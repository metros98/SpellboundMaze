import type { Profile } from '../types';

export const SEED_PLAYERS: Profile[] = [
  {
    id: 'seed-player-1',
    name: 'Graham',
    avatar: '🦄',
    theme: 'candy',
    color: '#FF69B4',
    voiceId: 'voice-1',
    words: ['sharp', 'start', 'shark', 'fern', 'verb', 'spoil', 'crawl', 'because']
  },
  {
    id: 'seed-player-2',
    name: 'CamCam',
    avatar: '🐶',
    theme: 'space',
    color: '#191970',
    voiceId: 'voice-2',
    words: [
      'necessary',
      'environment',
      'beginning',
      'separate',
      'curiosity',
      'schedule',
      'rhythm',
      'accomplish',
      'knowledge',
      'temperature'
    ]
  }
];

export function loadSeedData(): Profile[] {
  return SEED_PLAYERS;
}

export function shouldUseSeedData(): boolean {
  const storedProfiles = localStorage.getItem('profiles');
  return !storedProfiles || storedProfiles === '[]';
}
