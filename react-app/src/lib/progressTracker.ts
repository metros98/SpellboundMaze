import { GameProgress, Profile } from '../types';
import { updateProfile } from './persistence';

export function initializeProgress(): GameProgress {
  return {
    totalGamesPlayed: 0,
    totalWordsAttempted: 0,
    totalWordsCorrect: 0,
    totalWordsIncorrect: 0,
    perfectGames: 0,
    bestStreak: 0,
    currentStreak: 0,
    timePlayedMinutes: 0,
    wordHistory: [],
    difficultyStats: {
      easy: { played: 0, correct: 0 },
      medium: { played: 0, correct: 0 },
      hard: { played: 0, correct: 0 }
    }
  };
}

export function recordGameStart(profile: Profile, startTime: number): void {
  const progress = profile.progress || initializeProgress();
  progress.totalGamesPlayed += 1;
  progress.lastPlayed = new Date().toISOString();
  
  // Store start time for duration tracking
  sessionStorage.setItem('gameStartTime', startTime.toString());
  
  updateProfile({ ...profile, progress });
}

export function recordWordAttempt(
  profile: Profile,
  word: string,
  isCorrect: boolean,
  attempts: number
): void {
  const progress = profile.progress || initializeProgress();
  
  progress.totalWordsAttempted += 1;
  
  if (isCorrect) {
    progress.totalWordsCorrect += 1;
    progress.currentStreak += 1;
    if (progress.currentStreak > progress.bestStreak) {
      progress.bestStreak = progress.currentStreak;
    }
  } else {
    progress.totalWordsIncorrect += 1;
    progress.currentStreak = 0;
  }
  
  // Track by difficulty
  const difficulty = profile.difficulty || 'easy';
  progress.difficultyStats[difficulty].played += 1;
  if (isCorrect) {
    progress.difficultyStats[difficulty].correct += 1;
  }
  
  // Add to word history (keep last 100)
  progress.wordHistory.unshift({
    word,
    correct: isCorrect,
    attempts,
    timestamp: new Date().toISOString()
  });
  
  if (progress.wordHistory.length > 100) {
    progress.wordHistory = progress.wordHistory.slice(0, 100);
  }
  
  updateProfile({ ...profile, progress });
}

export function recordGameEnd(
  profile: Profile,
  correctWords: number,
  totalWords: number
): void {
  const progress = profile.progress || initializeProgress();
  
  // Track perfect game
  if (correctWords === totalWords && totalWords > 0) {
    progress.perfectGames += 1;
  }
  
  // Calculate time played
  const startTime = sessionStorage.getItem('gameStartTime');
  if (startTime) {
    const duration = (Date.now() - parseInt(startTime)) / 1000 / 60; // minutes
    progress.timePlayedMinutes += Math.round(duration);
    sessionStorage.removeItem('gameStartTime');
  }
  
  updateProfile({ ...profile, progress });
}

export function getAccuracyRate(progress: GameProgress): number {
  if (progress.totalWordsAttempted === 0) return 0;
  return Math.round((progress.totalWordsCorrect / progress.totalWordsAttempted) * 100);
}

export function getRecentPerformance(progress: GameProgress, last: number = 10): {
  correct: number;
  total: number;
  percentage: number;
} {
  const recent = progress.wordHistory.slice(0, last);
  const correct = recent.filter(w => w.correct).length;
  const total = recent.length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  return { correct, total, percentage };
}

export function getMostMissedWords(progress: GameProgress, limit: number = 5): {
  word: string;
  missCount: number;
}[] {
  const wordMisses: Record<string, number> = {};
  
  progress.wordHistory.forEach(entry => {
    if (!entry.correct) {
      wordMisses[entry.word] = (wordMisses[entry.word] || 0) + 1;
    }
  });
  
  return Object.entries(wordMisses)
    .map(([word, missCount]) => ({ word, missCount }))
    .sort((a, b) => b.missCount - a.missCount)
    .slice(0, limit);
}

export function clearProgress(profile: Profile): Profile {
  const clearedProfile = {
    ...profile,
    progress: initializeProgress()
  };
  
  updateProfile(clearedProfile);
  return clearedProfile;
}

export function getProgressSummary(progress: GameProgress | undefined): string {
  if (!progress || progress.totalGamesPlayed === 0) {
    return 'No progress data to clear';
  }
  
  return `${progress.totalGamesPlayed} games, ${progress.totalWordsCorrect} correct words, ${progress.perfectGames} perfect games`;
}
