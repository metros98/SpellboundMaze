export interface GameProgress {
  totalGamesPlayed: number;
  totalWordsAttempted: number;
  totalWordsCorrect: number;
  totalWordsIncorrect: number;
  perfectGames: number;
  lastPlayed?: string;
  bestStreak: number;
  currentStreak: number;
  timePlayedMinutes: number;
  wordHistory: {
    word: string;
    correct: boolean;
    attempts: number;
    timestamp: string;
  }[];
  difficultyStats: {
    easy: { played: number; correct: number };
    medium: { played: number; correct: number };
    hard: { played: number; correct: number };
  };
}

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  color?: string;
  theme?: string;
  voiceId?: string;
  words: string[];
  progress?: GameProgress;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Settings {
  ttsVoiceURI?: string;
  mazeColors?: { wall: string; floor: string; accent: string };
  tokenAsset?: string;
  minLetterSpacing?: number;
  retriesDefault?: number;
  voiceId?: string;
}
