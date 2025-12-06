export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  avatarUrl?: string;
  color?: string;
  theme?: string;
  voiceId?: string;
  words: string[];
  stats?: { played: number; correct: number; lastUpdated?: string };
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
