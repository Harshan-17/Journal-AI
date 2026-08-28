export type ReflectionMode = 'reflect' | 'brainstorm' | 'summarize' | 'actionable';

export type AppTheme = 'aurora' | 'cyberpunk' | 'sunset' | 'emerald' | 'violet';

export interface MoodTag {
  id: string;
  emoji: string;
  label: string;
  color: string;
}

export interface JournalLocation {
  placeId?: string;
  name?: string;
  formattedAddress?: string;
  latitude: number;
  longitude: number;
}

export interface JournalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  mode: ReflectionMode;
  messages: JournalMessage[];
  tags: string[];
  summary?: string;
  location?: JournalLocation;
  isFavorite?: boolean;
  createdAt: number; // Unix timestamp ms
  updatedAt: number; // Unix timestamp ms
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface PromptIdea {
  id: string;
  title: string;
  text: string;
  category: string;
}
