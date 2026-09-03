import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, collectionGroup, doc, getDoc, setDoc, query, orderBy, limit } from 'firebase/firestore';
import { useAppTheme } from '../context/ThemeContext';
import { Users, Server, Shield, Database, LogOut } from 'lucide-react';

interface AdminDashboardProps {
  onClose: () => void;
  onSignOut: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, onSignOut }) => {
  const { themeConfig } = useAppTheme();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [discordConfig, setDiscordConfig] = useState<any>(null);
  const [discordSaving, setDiscordSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const token = await user.getIdToken();

      // Fetch Discord Config
      const discordRes = await fetch('/api/admin/discord/config', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (discordRes.ok) {
        const discordData = await discordRes.json();
        
        // Fetch enabled events directly from Firestore
        const settingsSnap = await getDoc(doc(db, 'settings', 'discord'));
        const enabledEvents = settingsSnap.exists() ? settingsSnap.data().enabledEvents || [] : [];
        
        setDiscordConfig({ ...discordData, enabledEvents });
      }

      // 1. Fetch Users from the 'users' collection
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersList = usersSnap.docs.map(d => ({ ...d.data(), uid: d.id }));

      // 2. Fetch Recent Entries globally (collectionGroup)
      const entriesQuery = query(collectionGroup(db, 'entries'), orderBy('createdAt', 'desc'), limit(50));
      const entriesSnap = await getDocs(entriesQuery);
      const entriesList = entriesSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));

      // 3. Check roles
      const rolesDoc = await getDoc(doc(db, 'roles', 'admins'));
      const adminEmails = rolesDoc.exists() ? (rolesDoc.data().emails || []) : [];
      adminEmails.push('harshan1339a@gmail.com'); // Root admin

      const formattedUsers = usersList.map((u: any) => ({
        uid: u.uid,
        email: u.email,
        displayName: u.displayName,
        creationTime: u.lastLogin || Date.now(),
        isAdmin: adminEmails.includes(u.email)
      }));

      setData({
        stats: {
          totalUsers: usersSnap.size,
          totalEntries: entriesSnap.size, // Note: only counts up to limit unless we do a separate query, but this is fine for now
        },
        users: formattedUsers,
        entries: entriesList
      });
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Access Denied: Missing permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleRole = async (targetEmail: string, currentIsAdmin: boolean) => {
    try {
      if (targetEmail === 'harshan1339a@gmail.com') return;
      const rolesRef = doc(db, 'roles', 'admins');
      const rolesDoc = await getDoc(rolesRef);
      let emails: string[] = rolesDoc.exists() ? rolesDoc.data().emails || [] : [];
      
      if (currentIsAdmin) {
        emails = emails.filter(e => e !== targetEmail);
      } else {
        if (!emails.includes(targetEmail)) emails.push(targetEmail);
      }
      
      await setDoc(rolesRef, { emails });
      fetchData(); // Refresh data
    } catch (err: any) {
      alert('Failed to update role: ' + err.message);
    }
  };

  const handleToggleDiscordEvent = async (event: string) => {
    if (!discordConfig) return;
    setDiscordSaving(true);
    try {
      const currentEvents = discordConfig.enabledEvents || [];
      const newEvents = currentEvents.includes(event)
        ? currentEvents.filter((e: string) => e !== event)
        : [...currentEvents, event];

      // Save directly to Firestore using Client SDK
      await setDoc(doc(db, 'settings', 'discord'), { enabledEvents: newEvents }, { merge: true });
      setDiscordConfig({ ...discordConfig, enabledEvents: newEvents });
    } catch (err) {
      alert('Failed to update Discord settings');
    } finally {
      setDiscordSaving(false);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/discord/test', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Test notification sent successfully!');
      } else {
        alert('Failed to send test notification');
      }
    } catch (err) {
      alert('Error sending test notification');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black min-h-screen">
        <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black min-h-screen text-white">
        <Shield className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
        <p className="text-neutral-400 mb-6">{error}</p>
        <button onClick={onClose} className="px-6 py-2 bg-neutral-800 rounded-full text-sm font-medium hover:bg-neutral-700">Return to App</button>
      </div>
    );
  }

  const filteredUsers = data?.users?.filter((u: any) => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="fixed inset-0 z-[100] bg-black min-h-screen text-white overflow-y-auto font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-12 border-b border-neutral-800 pb-6">
           <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-tr ${themeConfig.primaryGradient} text-black`}>
                 <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-serif">Admin Dashboard</h1>
                <p className="text-sm text-neutral-400">System Overview & Management</p>
              </div>
           </div>
           <div className="flex items-center space-x-3">
             <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-300 hover:text-white bg-neutral-900 rounded-full border border-neutral-800 transition-colors cursor-pointer">
               Exit Admin
             </button>
             <button onClick={onSignOut} className="px-4 py-2 text-sm text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-full border border-rose-500/20 transition-colors flex items-center space-x-2 cursor-pointer">
               <LogOut className="w-4 h-4" />
               <span>Sign Out</span>
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl">
             <div className="flex items-center space-x-3 text-neutral-400 mb-4">
               <Users className="w-5 h-5" />
               <h3 className="font-medium text-sm">Total Users</h3>
             </div>
             <p className="text-4xl font-light font-mono">{data?.stats?.totalUsers || 0}</p>
          </div>
          <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl">
             <div className="flex items-center space-x-3 text-neutral-400 mb-4">
               <Database className="w-5 h-5" />
               <h3 className="font-medium text-sm">Recent Entries</h3>
             </div>
             <p className="text-4xl font-light font-mono">{data?.stats?.totalEntries || 0}</p>
          </div>
           <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl">
             <div className="flex items-center space-x-3 text-neutral-400 mb-4">
               <Server className="w-5 h-5" />
               <h3 className="font-medium text-sm">System Health</h3>
             </div>
             <p className="text-4xl font-light font-mono text-emerald-400">100%</p>
          </div>
        </div>

        <div className="space-y-12">
          
          {/* Discord Integration */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8">
            <div className="flex items-start justify-between mb-8">
              <div>
                <h2 className="text-xl font-serif mb-2">Discord Integration</h2>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="text-neutral-400">Status:</span>
                  {discordConfig?.isConnected ? (
                    <span className="text-emerald-400 flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>Connected</span>
                    </span>
                  ) : (
                    <span className="text-neutral-500">Not configured</span>
                  )}
                </div>
              </div>
              <button
                onClick={handleSendTestNotification}
                disabled={!discordConfig?.isConnected}
                className={`px-4 py-2 text-sm rounded-full border transition-colors ${
                  discordConfig?.isConnected
                    ? 'border-neutral-700 hover:bg-neutral-800 text-neutral-300 cursor-pointer'
                    : 'border-neutral-800 text-neutral-600 cursor-not-allowed'
                }`}
              >
                Send Test Notification
              </button>
            </div>

            <div>
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Notification Events</h3>
              <div className="flex items-center space-x-6">
                {['milestone', 'achievement', 'reminder'].map((evt) => (
                  <label key={evt} className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={discordConfig?.enabledEvents?.includes(evt) || false}
                        onChange={() => handleToggleDiscordEvent(evt)}
                        disabled={discordSaving || !discordConfig?.isConnected}
                        className="peer sr-only"
                      />
                      <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${
                        discordConfig?.enabledEvents?.includes(evt)
                          ? 'bg-neutral-200 border-neutral-200'
                          : 'bg-neutral-950 border-neutral-700 group-hover:border-neutral-500'
                      } ${(!discordConfig?.isConnected || discordSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {discordConfig?.enabledEvents?.includes(evt) && (
                          <svg className="w-3.5 h-3.5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className={`text-sm capitalize ${
                      (!discordConfig?.isConnected || discordSaving) ? 'text-neutral-600' : 'text-neutral-300 group-hover:text-white transition-colors'
                    }`}>
                      {evt}s
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif flex items-center space-x-2">
                 <Users className="w-5 h-5 text-neutral-400" />
                 <span>User Directory</span>
              </h2>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-neutral-900 border border-neutral-800 text-sm rounded-full px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 focus:ring-1 focus:ring-neutral-600 w-64"
                />
              </div>
            </div>
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400">
                   <tr>
                     <th className="px-6 py-4 font-medium">User</th>
                     <th className="px-6 py-4 font-medium">Email</th>
                     <th className="px-6 py-4 font-medium">Last Login</th>
                     <th className="px-6 py-4 font-medium">Role</th>
                     <th className="px-6 py-4 font-medium text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-800">
                   {filteredUsers.length === 0 ? (
                     <tr>
                       <td colSpan={5} className="px-6 py-8 text-center text-neutral-500">
                         No users found matching "{searchQuery}"
                       </td>
                     </tr>
                   ) : (
                     filteredUsers.map((u: any) => (
                       <tr key={u.uid} className="hover:bg-neutral-800/50 transition-colors">
                         <td className="px-6 py-4 font-medium text-neutral-200">{u.displayName || 'Unknown'}</td>
                         <td className="px-6 py-4 text-neutral-400">{u.email || 'Guest'}</td>
                         <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{new Date(u.creationTime).toLocaleDateString()}</td>
                         <td className="px-6 py-4">
                           <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${u.isAdmin ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-neutral-800 text-neutral-400 border-neutral-700'}`}>
                             {u.isAdmin ? 'Admin' : 'User'}
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <button 
                             onClick={() => handleToggleRole(u.email, u.isAdmin)}
                             disabled={u.email === 'harshan1339a@gmail.com'}
                             className={`text-xs px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${u.email === 'harshan1339a@gmail.com' ? 'opacity-50 cursor-not-allowed border-neutral-800 text-neutral-500' : 'border-neutral-700 hover:bg-neutral-800 text-neutral-300'}`}
                           >
                             {u.isAdmin ? 'Revoke Admin' : 'Make Admin'}
                           </button>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-serif mb-6 flex items-center space-x-2">
               <Database className="w-5 h-5 text-neutral-400" />
               <span>Recent Global Entries</span>
            </h2>
             <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400">
                   <tr>
                     <th className="px-6 py-4 font-medium">Title</th>
                     <th className="px-6 py-4 font-medium">Mode</th>
                     <th className="px-6 py-4 font-medium">Date</th>
                     <th className="px-6 py-4 font-medium">Location</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-800">
                   {data?.entries?.map((e: any) => (
                     <tr key={e.id} className="hover:bg-neutral-800/50 transition-colors">
                       <td className="px-6 py-4 font-medium text-neutral-200">{e.title || 'Untitled'}</td>
                       <td className="px-6 py-4">
                         <span className="text-xs px-2 py-1 rounded-md bg-neutral-800 text-neutral-300 capitalize">{e.mode}</span>
                       </td>
                       <td className="px-6 py-4 text-neutral-400 font-mono text-xs">{new Date(e.createdAt).toLocaleDateString()}</td>
                       <td className="px-6 py-4 text-neutral-500 text-xs truncate max-w-[200px]">
                         {e.location?.name || 'No location'}
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
