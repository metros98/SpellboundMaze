import React from 'react';
import { Profile } from '../types';
import { 
  getAccuracyRate, 
  getRecentPerformance, 
  getMostMissedWords 
} from '../lib/progressTracker';

interface ProgressViewProps {
  profile: Profile;
  onBack: () => void;
}

export function ProgressView({ profile, onBack }: ProgressViewProps) {
  const progress = profile.progress;
  
  if (!progress || progress.totalWordsAttempted === 0) {
    return (
      <div className="start-menu">
        <header className="menu-header compact">
          <button className="back-btn" onClick={onBack}>← Back</button>
          <h1>Statistics</h1>
        </header>
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-on-dark)' }}>
          <p style={{ fontSize: '3rem', margin: 0 }}>📊</p>
          <p style={{ marginTop: 16 }}>No stats yet! Play some games to see your progress.</p>
        </div>
      </div>
    );
  }
  
  const accuracy = getAccuracyRate(progress);
  const recent = getRecentPerformance(progress, 10);
  const missedWords = getMostMissedWords(progress, 5);
  
  return (
    <div className="start-menu">
      <header className="menu-header compact">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>{profile.name}'s Stats</h1>
      </header>
      
      <div className="settings-section" style={{ marginBottom: 16 }}>
        <h2>🎯 Overall Performance</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <StatCard label="Games Played" value={progress.totalGamesPlayed} />
          <StatCard label="Perfect Games" value={progress.perfectGames} emoji="🏆" />
          <StatCard label="Words Correct" value={progress.totalWordsCorrect} emoji="✅" />
          <StatCard label="Accuracy" value={`${accuracy}%`} />
        </div>
      </div>
      
      <div className="settings-section" style={{ marginBottom: 16 }}>
        <h2>🔥 Streaks & Time</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <StatCard label="Best Streak" value={progress.bestStreak} emoji="🔥" />
          <StatCard label="Current Streak" value={progress.currentStreak} />
          <StatCard label="Time Played" value={`${progress.timePlayedMinutes}m`} emoji="⏱️" />
          <StatCard label="Total Words" value={progress.totalWordsAttempted} />
        </div>
      </div>
      
      <div className="settings-section" style={{ marginBottom: 16 }}>
        <h2>📈 Recent Performance (Last 10)</h2>
        <div style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--secondary-dark)' }}>
            {recent.percentage}%
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginTop: 4 }}>
            {recent.correct} / {recent.total} correct
          </div>
        </div>
      </div>
      
      <div className="settings-section" style={{ marginBottom: 16 }}>
        <h2>📊 By Difficulty</h2>
        {(['easy', 'medium', 'hard'] as const).map(diff => {
          const diffStats = progress.difficultyStats[diff];
          const diffAccuracy = diffStats.played > 0 
            ? Math.round((diffStats.correct / diffStats.played) * 100) 
            : 0;
          
          return (
            <div key={diff} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#f8f9fa',
              borderRadius: 8,
              marginBottom: 8
            }}>
              <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{diff}</span>
              <span>{diffStats.correct} / {diffStats.played} ({diffAccuracy}%)</span>
            </div>
          );
        })}
      </div>
      
      {missedWords.length > 0 && (
        <div className="settings-section">
          <h2>💪 Practice These Words</h2>
          {missedWords.map(({ word, missCount }) => (
            <div key={word} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#fff3cd',
              borderRadius: 8,
              marginBottom: 8,
              border: '1px solid #ffc107'
            }}>
              <span style={{ fontWeight: 600 }}>{word}</span>
              <span style={{ color: '#856404' }}>Missed {missCount}x</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, emoji }: { label: string; value: number | string; emoji?: string }) {
  return (
    <div style={{
      background: '#f8f9fa',
      borderRadius: 12,
      padding: 16,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--secondary-dark)' }}>
        {emoji && <span style={{ marginRight: 4 }}>{emoji}</span>}
        {value}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}
