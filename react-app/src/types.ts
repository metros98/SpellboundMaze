export interface Profile {
  id: string;
  name: string;
  avatarUrl?: string;
  voiceId?: string;
  words: string[];
  stats?: { played: number; correct: number; lastUpdated?: string };
}

export interface Settings {
  ttsVoiceURI?: string;
  mazeColors?: { wall: string; floor: string; accent: string };
  tokenAsset?: string;
  minLetterSpacing?: number;
  retriesDefault?: number;
}
