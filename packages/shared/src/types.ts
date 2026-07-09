export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currentLevel: number;
  streakCurrent: number;
  streakMax: number;
  lastEntryDate: string | null;
  createdAt: string;
}

export interface BibleVerse {
  id: string;
  reference: string;
  text: string;
  interpretation: string | null;
  recommendedLevel: number;
  topic: string | null;
}
