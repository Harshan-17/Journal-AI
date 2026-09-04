import React, { useState, useEffect, useCallback } from 'react';
import {
  auth,
  db,
  signInWithGoogle,
  signInGuestMode,
  signOutUser,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { SecurityBadgeModal } from './components/SecurityBadgeModal';
import { SummaryModal } from './components/SummaryModal';
import { FirebaseConfigModal } from './components/FirebaseConfigModal';
import { AdminDashboard } from './components/AdminDashboard';

import { EntriesMapViewModal } from './components/EntriesMapViewModal';
import { AmbientBackground } from './components/AmbientBackground';
import { JournalEntry, JournalMessage, ReflectionMode, UserProfile } from './types';
import { sanitizePayload, formatTimestamp, isValidCoordinate } from './utils/sanitize';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isEntriesLoading, setIsEntriesLoading] = useState(false);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');
  const [error, setError] = useState<string | null>(null);

  // Modals & UI States
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [isFirebaseConfigModalOpen, setIsFirebaseConfigModalOpen] = useState(false);
  const [isMapViewOpen, setIsMapViewOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Keyboard shortcut (Ctrl+B / Cmd+B) to toggle Focus Mode / Sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is inside an input/textarea and pressing other shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 1. Listen for Authentication state changes (Firebase Auth)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userProfile = {
          uid: currentUser.uid,
          email: currentUser.email || (currentUser.isAnonymous ? 'guest@isolated.session' : ''),
          displayName:
            currentUser.displayName ||
            (currentUser.isAnonymous ? 'Guest Explorer (Private)' : 'Authenticated User'),
          photoURL: currentUser.photoURL,
          lastLogin: Date.now(),
        };
        setUser(userProfile);

        // Save user profile to Firestore
        try {
          await setDoc(doc(db, 'users', currentUser.uid), userProfile, { merge: true });
        } catch (err) {
          console.warn('Failed to save user profile', err);
        }

        // Admin check fallback
        let adminStatus = currentUser.email === 'harshan1339a@gmail.com';
        try {
          const rolesDoc = await getDoc(doc(db, 'roles', 'admins'));
          if (rolesDoc.exists()) {
            const emails = rolesDoc.data().emails || [];
            if (emails.includes(currentUser.email)) {
              adminStatus = true;
            }
          }
        } catch (e) {
          console.warn('Could not read admin roles', e);
        }
        setIsAdmin(adminStatus);
      } else {
        setUser(null);
        setIsAdmin(false);
        setEntries([]);
        setSelectedEntryId(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to create a clean fresh entry object
  const createNewEmptyEntry = useCallback(
    (userId: string): JournalEntry => {
      const now = Date.now();
      return {
        id: `entry_${now}_${Math.random().toString(36).substring(2, 7)}`,
        userId,
        title: 'New Reflection',
        mode: 'reflect',
        messages: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
        isFavorite: false,
      };
    },
    []
  );

  // 2. Real-time Cloud Firestore synchronization across sessions
  useEffect(() => {
    if (!user) {
      setEntries([]);
      setSelectedEntryId(null);
      setIsEntriesLoading(false);
      return;
    }

    setIsEntriesLoading(true);
    const collectionPath = `users/${user.uid}/entries`;

    try {
      const entriesCollectionRef = collection(db, 'users', user.uid, 'entries');

      const unsubscribe = onSnapshot(
        entriesCollectionRef,
        (snapshot) => {
          const loadedEntries: JournalEntry[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const locationData =
              data.location && isValidCoordinate(data.location.latitude, data.location.longitude)
                ? {
                    latitude: Number(data.location.latitude),
                    longitude: Number(data.location.longitude),
                    placeId: data.location.placeId ? String(data.location.placeId) : undefined,
                    name: data.location.name ? String(data.location.name) : undefined,
                    formattedAddress: data.location.formattedAddress
                      ? String(data.location.formattedAddress)
                      : undefined,
                  }
                : undefined;

            loadedEntries.push({
              id: docSnap.id,
              userId: user.uid,
              title: data.title !== undefined ? data.title : 'Untitled Reflection',
              mode: data.mode || 'reflect',
              messages: Array.isArray(data.messages) ? data.messages : [],
              tags: Array.isArray(data.tags) ? data.tags : [],
              summary: data.summary || undefined,
              location: locationData,
              isFavorite: Boolean(data.isFavorite),
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
              updatedAt:
                typeof data.updatedAt === 'number'
                  ? data.updatedAt
                  : typeof data.createdAt === 'number'
                  ? data.createdAt
                  : Date.now(),
            });
          });

          // Sort by latest update descending
          loadedEntries.sort((a, b) => b.updatedAt - a.updatedAt);

          setEntries(loadedEntries);

          // Preserve current selection if valid, otherwise leave it as null (new entry)
          setSelectedEntryId((prevId) => {
            if (prevId && loadedEntries.some((e) => e.id === prevId)) {
              return prevId;
            }
            return null;
          });

          setIsEntriesLoading(false);
        },
        (firestoreErr) => {
          // If auth is logging out, silently unmount
          if (!auth.currentUser) {
            setIsEntriesLoading(false);
            return;
          }
          console.error('Firestore snapshot subscription error:', firestoreErr);
          try {
            handleFirestoreError(firestoreErr, OperationType.GET, collectionPath);
          } catch (e: any) {
            setError('Database connection error. Please verify authentication.');
          }
          setIsEntriesLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.error('Firestore initialization notice:', e);
      setIsEntriesLoading(false);
    }
  }, [user]);

  // Current active entry
  const currentEntry = entries.find((e) => e.id === selectedEntryId) || null;

  // 3. Persist entry updates directly to Cloud Firestore
  const persistEntry = async (entryToSave: JournalEntry): Promise<void> => {
    if (!user) return;
    setSaveStatus('saving');
    setError(null);

    const docPath = `users/${user.uid}/entries/${entryToSave.id}`;

    try {
      const locationPayload =
        entryToSave.location && isValidCoordinate(entryToSave.location.latitude, entryToSave.location.longitude)
          ? {
              latitude: Number(entryToSave.location.latitude),
              longitude: Number(entryToSave.location.longitude),
              placeId: entryToSave.location.placeId ? String(entryToSave.location.placeId) : null,
              name: entryToSave.location.name ? String(entryToSave.location.name) : null,
              formattedAddress: entryToSave.location.formattedAddress
                ? String(entryToSave.location.formattedAddress)
                : null,
            }
          : null;

      const sanitized = sanitizePayload({
        title: entryToSave.title,
        mode: entryToSave.mode,
        messages: entryToSave.messages,
        tags: entryToSave.tags || [],
        summary: entryToSave.summary || null,
        location: locationPayload,
        isFavorite: Boolean(entryToSave.isFavorite),
        createdAt: entryToSave.createdAt,
        updatedAt: entryToSave.updatedAt || Date.now(),
      });

      const entryDocRef = doc(db, 'users', user.uid, 'entries', entryToSave.id);
      await setDoc(entryDocRef, sanitized, { merge: true });
      setSaveStatus('saved');
    } catch (saveErr: any) {
      console.error('Firestore sync error:', saveErr);
      setSaveStatus('error');
      try {
        handleFirestoreError(saveErr, OperationType.WRITE, docPath);
      } catch (err: any) {
        setError('Database save issue: ' + (saveErr?.message || 'Please check your connection.'));
      }
      throw saveErr;
    }
  };

  // Create a new reflection session
  const handleNewEntry = async () => {
    if (!user) return;
    const newEntry = createNewEmptyEntry(user.uid);

    // Optimistically select and persist
    setEntries((prev) => [newEntry, ...prev]);
    setSelectedEntryId(newEntry.id);
    setIsSidebarOpen(false); // Collapse the sidebar on new reflection

    try {
      await persistEntry(newEntry);
    } catch (err) {
      console.error('Failed to create new entry in Firestore:', err);
    }
  };

  // Update current entry fields (e.g. title, mode)
  const handleUpdateEntry = async (updatedFields: Partial<JournalEntry>) => {
    let targetId = selectedEntryId;

    if (!targetId) {
      const newEntry = createNewEmptyEntry(user ? user.uid : 'anonymous');
      const updated = { ...newEntry, ...updatedFields, updatedAt: Date.now() };
      setEntries((prev) => [updated, ...prev]);
      setSelectedEntryId(updated.id);
      try {
        await persistEntry(updated);
      } catch (err) {
        console.error('Initial update save failed:', err);
      }
      return;
    }

    let updatedEntry: JournalEntry | null = null;
    
    setEntries((prev) => prev.map((e) => {
      if (e.id === targetId) {
        updatedEntry = {
          ...e,
          ...updatedFields,
          updatedAt: Date.now(),
        };
        return updatedEntry;
      }
      return e;
    }));

    if (updatedEntry) {
      try {
        await persistEntry(updatedEntry);
      } catch (err) {
        console.error('Update save failed:', err);
      }
    }
  };

  // Toggle entry favorite
  const handleToggleFavorite = async (entry: JournalEntry) => {
    if (!user) return;
    const updated = {
      ...entry,
      isFavorite: !entry.isFavorite,
      updatedAt: Date.now(),
    };
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    try {
      await persistEntry(updated);
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  };

  // Delete entry from Firestore
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;
    const docPath = `users/${user.uid}/entries/${entryId}`;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'entries', entryId));
      const remaining = entries.filter((e) => e.id !== entryId);
      setEntries(remaining);

      if (selectedEntryId === entryId) {
        setSelectedEntryId(remaining.length > 0 ? remaining[0].id : null);
      }
    } catch (err: any) {
      console.error('Failed to delete entry from Firestore:', err);
      try {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      } catch {
        setError('Failed to delete reflection from Firestore.');
      }
    }
  };

  // 4. Send Message to Gemini & Guaranteed Transaction Persistence
  const handleSendMessage = async (userText: string, mode: ReflectionMode) => {
    if (!user) return;

    let targetEntry = currentEntry;
    if (!targetEntry) {
      targetEntry = createNewEmptyEntry(user.uid);
      setEntries((prev) => [targetEntry!, ...prev]);
      setSelectedEntryId(targetEntry.id);
    }

    const now = Date.now();
    const userMessage: JournalMessage = {
      id: `msg_user_${now}`,
      role: 'user',
      content: userText,
      timestamp: formatTimestamp(now),
    };

    // Auto-derive a meaningful title if the title is default or cleared
    let newTitle = targetEntry.title;
    const needsTitleUpdate = targetEntry.title === 'New Reflection' || targetEntry.title === 'Untitled Reflection' || !targetEntry.title || targetEntry.title === 'Analyzing topic...';
    if (needsTitleUpdate) {
      newTitle = 'Analyzing topic...';
    }

    const entryWithUserMsg: JournalEntry = {
      ...targetEntry,
      title: newTitle,
      mode,
      messages: [...targetEntry.messages, userMessage],
      updatedAt: now,
    };

    // Optimistically update and persist user turn immediately
    setEntries((prev) => prev.map((e) => (e.id === entryWithUserMsg.id ? entryWithUserMsg : e)));
    setIsGenerating(true);
    setError(null);

    persistEntry(entryWithUserMsg).catch((saveErr) => {
      console.warn('Initial turn save notice:', saveErr);
    });

    // Start generating title concurrently if it needs an update
    if (needsTitleUpdate) {
      // Send the entire conversation history to get a better topic
      const conversationContext = entryWithUserMsg.messages.map(m => m.role + ': ' + m.content).join('\n');
      fetch('/api/gemini/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: conversationContext }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.title) {
            let updatedE: JournalEntry | null = null;
            setEntries((prev) => prev.map((e) => {
              if (e.id === entryWithUserMsg.id) {
                updatedE = { ...e, title: d.title, updatedAt: Date.now() };
                return updatedE;
              }
              return e;
            }));
            if (updatedE) {
              persistEntry(updatedE).catch(console.warn);
            }
          }
        })
        .catch(() => null);
    }

    let enabledEvents: string[] = [];
    try {
      const snap = await Promise.race([
        getDoc(doc(db, 'settings', 'discord')),
        new Promise((resolve) => setTimeout(() => resolve(null), 150))
      ]);
      if (snap && (snap as any).exists && (snap as any).exists()) {
        enabledEvents = (snap as any).data().enabledEvents || [];
      }
    } catch (err) {
      console.warn('Could not fetch discord settings:', err);
    }

    // Call Backend Gemini Server Proxy (/api/gemini/chat)
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: entryWithUserMsg.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          mode,
          entryTitle: entryWithUserMsg.title,
          enabledEvents,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Gemini request failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream not supported');

      const decoder = new TextDecoder();
      const assistantNow = Date.now();
      let currentModelUsed = 'gemini-3.6-flash';
      let assistantText = '';
      
      let assistantMessage: JournalMessage = {
        id: `msg_asst_${assistantNow}`,
        role: 'assistant',
        content: '',
        timestamp: formatTimestamp(assistantNow),
        modelUsed: currentModelUsed,
      };
      
      // Optimistically add empty assistant message to UI
      setEntries((prev) => prev.map((e) => {
        if (e.id === entryWithUserMsg.id) {
          return { ...e, messages: [...e.messages, assistantMessage] };
        }
        return e;
      }));

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'start') {
                currentModelUsed = data.modelUsed;
                assistantMessage.modelUsed = currentModelUsed;
              } else if (data.type === 'chunk') {
                assistantText += data.text;
                assistantMessage.content = assistantText;
                setEntries((prev) => prev.map((e) => {
                  if (e.id === entryWithUserMsg.id) {
                    const msgs = [...e.messages];
                    msgs[msgs.length - 1] = { ...assistantMessage };
                    return { ...e, messages: msgs };
                  }
                  return e;
                }));
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (err) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      let finalEntryToPersist: JournalEntry | null = null;
      setEntries((prev) => prev.map((e) => {
        if (e.id === entryWithUserMsg.id) {
          const finalE = {
            ...e,
            messages: e.messages.map(m => m.id === assistantMessage.id ? assistantMessage : m),
            updatedAt: assistantNow,
          };
          finalEntryToPersist = finalE;
          return finalE;
        }
        return e;
      }));

      // Guaranteed transaction persistence to /users/{userId}/entries/{entryId}
      let loggedEntryId = entryWithUserMsg.id;
      if (finalEntryToPersist) {
        await persistEntry(finalEntryToPersist);
      } else {
        const finalEntry: JournalEntry = {
          ...entryWithUserMsg,
          messages: [...entryWithUserMsg.messages, assistantMessage],
          updatedAt: assistantNow,
        };
        await persistEntry(finalEntry);
      }

      // Log interaction record to /users/{userId}/interactions/{interactionId}
      const interactionDocRef = doc(db, 'users', user.uid, 'interactions', `interaction_${assistantNow}`);
      await setDoc(
        interactionDocRef,
        sanitizePayload({
          id: `interaction_${assistantNow}`,
          entryId: loggedEntryId,
          prompt: userText,
          response: assistantText,
          mode,
          modelUsed: currentModelUsed,
          timestamp: assistantNow,
        }),
        { merge: true }
      ).catch((logErr) => console.warn('Interaction logging notice:', logErr));
    } catch (geminiErr: any) {
      console.error('Gemini interaction error:', geminiErr);
      if (geminiErr.message === 'Failed to fetch') {
        setError('The connection to the AI server was lost (the server was updating). Please retry your message.');
      } else {
        setError(geminiErr.message || 'Gemini was unable to respond. Please retry.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // 5. Generate Structured Summary (/api/gemini/summarize)
  const handleGenerateSummary = async () => {
    if (!currentEntry || currentEntry.messages.length === 0) return;

    setIsSummarizing(true);
    setError(null);

    try {
      const conversationText = currentEntry.messages
        .map((m) => `${m.role === 'user' ? 'User' : 'Gemini'}: ${m.content}`)
        .join('\n\n');

      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: currentEntry.title,
          content: conversationText,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Summarization request failed.');
      }

      const data = await response.json();
      const updated: JournalEntry = {
        ...currentEntry,
        summary: data.summary,
        updatedAt: Date.now(),
      };

      setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      await persistEntry(updated);
      setIsSummaryModalOpen(true);
    } catch (err: any) {
      console.error('Summary error:', err);
      setError(err.message || 'Failed to synthesize summary.');
    } finally {
      setIsSummarizing(false);
    }
  };

  // Sign out user
  const handleSignOut = async () => {
    await signOutUser();
    setUser(null);
    setEntries([]);
    setSelectedEntryId(null);
  };

  // Loading spinner during initial Firebase Auth state verification
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-neutral-400">Verifying secure Firebase session...</p>
      </div>
    );
  }

  // Unauthenticated Landing Page
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col font-sans relative overflow-hidden">
        <AmbientBackground />
        <Navbar
          user={null}
          onSignOut={handleSignOut}
          onNewEntry={() => {}}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
          isAdmin={isAdmin}
          onOpenAdmin={() => setIsAdminDashboardOpen(true)}
          onOpenFirebaseConfig={() => setIsFirebaseConfigModalOpen(true)}
          saveStatus="saved"
        />
        <LandingPage
          onSignIn={async () => {
            await signInWithGoogle();
          }}
          onSignInGuest={async () => {
            await signInGuestMode();
          }}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
          onOpenFirebaseConfig={() => setIsFirebaseConfigModalOpen(true)}
        />
        <SecurityBadgeModal
          isOpen={isSecurityModalOpen}
          onClose={() => setIsSecurityModalOpen(false)}
        />

      <FirebaseConfigModal
          isOpen={isFirebaseConfigModalOpen}
          onClose={() => setIsFirebaseConfigModalOpen(false)}
        />
      </div>
    );
  }

  // Loading indicator while initial user entries are fetching from Cloud Firestore
  if (isEntriesLoading && entries.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col font-sans text-white relative overflow-hidden">
        <AmbientBackground />
        <Navbar
          user={user}
          onSignOut={handleSignOut}
          onNewEntry={() => {}}
          onOpenSecurity={() => setIsSecurityModalOpen(true)}
          isAdmin={isAdmin}
          onOpenAdmin={() => setIsAdminDashboardOpen(true)}
          onOpenFirebaseConfig={() => setIsFirebaseConfigModalOpen(true)}
          saveStatus="saving"
        />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 relative z-10">
          <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-neutral-400">Retrieving your private reflections from Firestore...</p>
        </div>
      </div>
    );
  }

  // Active or Fallback empty entry for dashboard view
  const activeEntry: JournalEntry = currentEntry || createNewEmptyEntry(user.uid);

  if (isAdminDashboardOpen && isAdmin) {
    return (
      <AdminDashboard 
        onClose={() => setIsAdminDashboardOpen(false)} 
        onSignOut={handleSignOut} 
      />
    );
  }

  return (
    <div className="h-screen max-h-screen w-full bg-neutral-950 flex flex-col font-sans text-white relative overflow-hidden">
      <AmbientBackground />
      {/* Top Navigation */}
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onNewEntry={handleNewEntry}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminDashboardOpen(true)}
        onOpenFirebaseConfig={() => setIsFirebaseConfigModalOpen(true)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onOpenMapView={() => setIsMapViewOpen(true)}
        saveStatus={saveStatus}
      />

      {/* Main Authenticated Studio Container */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden relative">
        {/* Left Reflection History Sidebar */}
        <HistorySidebar
          entries={entries}
          selectedEntryId={activeEntry.id}
          onSelectEntry={(entry) => { setSelectedEntryId(entry.id); setIsSidebarOpen(false); }}
          onNewEntry={handleNewEntry}
          onDeleteEntry={handleDeleteEntry}
          onToggleFavorite={handleToggleFavorite}
          onOpenMapView={() => setIsMapViewOpen(true)}
          isOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
        />

        {/* Center Journal & Reflection Studio */}
        <JournalEditor
          userName={user?.displayName?.split(' ')[0] || ''}
          entry={activeEntry}
          onUpdateEntry={handleUpdateEntry}
          onSendMessage={handleSendMessage}
          onGenerateSummary={handleGenerateSummary}
          isGenerating={isGenerating}
          isSummarizing={isSummarizing}
          error={error}
          onRetry={() => {
            if (activeEntry.messages.length > 0) {
              const lastUserMsg = [...activeEntry.messages].reverse().find((m) => m.role === 'user');
              if (lastUserMsg) {
                handleSendMessage(lastUserMsg.content, activeEntry.mode);
              }
            }
          }}
          onOpenSummaryModal={() => setIsSummaryModalOpen(true)}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />
      </div>

      {/* Security Specifications Modal */}
      <SecurityBadgeModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
      />

      <FirebaseConfigModal
        isOpen={isFirebaseConfigModalOpen}
        onClose={() => setIsFirebaseConfigModalOpen(false)}
      />

      {/* Global Atlas / Maps View Modal */}
      <EntriesMapViewModal
        isOpen={isMapViewOpen}
        onClose={() => setIsMapViewOpen(false)}
        entries={entries}
        onSelectEntry={(entry) => {
          setSelectedEntryId(entry.id);
        }}
      />

      {/* Synthesis & Insights Modal */}
      {activeEntry.summary && (
        <SummaryModal
          isOpen={isSummaryModalOpen}
          onClose={() => setIsSummaryModalOpen(false)}
          title={activeEntry.title}
          summary={activeEntry.summary}
        />
      )}
    </div>
  );
}
