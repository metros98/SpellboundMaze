import { useState, useEffect, useRef } from 'react';
import { loadProfiles, saveProfiles, addProfile, updateProfile, deleteProfile, loadSettings, saveSettings } from '../lib/persistence';
import { speak } from '../lib/audio';
import { Profile } from '../types';
import { loadSeedData, shouldUseSeedData } from '../lib/seedData';
import { ProgressView } from './ProgressView';
import { clearProgress, getProgressSummary } from '../lib/progressTracker';

// UUID generator
function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Constants
const AVATARS = ['🧙', '🦉', '🐉', '🦊', '🐰', '🐸', '🦁', '🦄', '🐶', '🐱', '🦋', '🐢', '🦦', '🐨', '🐧', '🦎', '🦜'];
const CUSTOM_AVATARS = [
  { id: 'otter-face', url: import.meta.env.BASE_URL + 'avatars/otter-face.png', name: 'Otter' }
];
const MAZE_THEMES = [
  { id: 'forest', name: 'Forest', colors: ['#228B22', '#90EE90', '#2E8B57'], chipColor: '#228B22' },
  { id: 'ocean', name: 'Ocean', colors: ['#1E90FF', '#87CEEB', '#00CED1'], chipColor: '#1E90FF' },
  { id: 'candy', name: 'Candy', colors: ['#FF69B4', '#FFB6C1', '#DDA0DD'], chipColor: '#FF69B4' },
  { id: 'space', name: 'Space', colors: ['#191970', '#4B0082', '#9370DB'], chipColor: '#191970' },
  { id: 'sunset', name: 'Sunset', colors: ['#FFE4D6', '#8B4A6B', '#FF6B4A'], chipColor: '#8B4A6B' },
  { id: 'castle', name: 'Castle', colors: ['#E8ECF0', '#4A5568', '#D4AF37'], chipColor: '#4A5568' },
];

type MenuScreen = 'main' | 'players' | 'settings' | 'progress';

interface StartMenuProps {
  onPlay?: (profile: Profile) => void;
  onEdit?: (profile?: Profile) => void;
}

/* ============ Reusable Player Chip Component ============ */
function PlayerChip({ 
  player, 
  isSelected, 
  onClick 
}: { 
  player: Profile; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      className={`player-chip ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
      style={{ '--chip-color': player.color || '#5B9BD5' } as React.CSSProperties}
    >
      <span className="avatar">
        {player.avatarUrl ? (
          <img src={player.avatarUrl} alt="avatar" style={{ width: 24, height: 24, borderRadius: '50%' }} />
        ) : (
          player.avatar || player.name.charAt(0) || '🙂'
        )}
      </span>
      <span className="name">{player.name}</span>
      {isSelected && <span className="check">✓</span>}
    </button>
  );
}

/* ============ Main Menu Component ============ */
export function StartMenu({ onPlay, onEdit }: StartMenuProps) {
  const [screen, setScreen] = useState<MenuScreen>('main');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    try {
      const persisted = loadProfiles();
      setProfiles(persisted || []);
    } catch (e) {
      setProfiles([]);
    }
  }, []);

  const toggleProfileSelection = (id: string) => {
    setSelectedProfileId(prev => prev === id ? null : id);
  };

  const handleStartGame = () => {
    if (!selectedProfileId) return;
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (!profile) return;
    
    if (!profile.words || profile.words.length === 0) {
      if (onEdit) {
        onEdit(profile);
        return;
      }
      alert('Please add some words for this profile before starting the game.');
      return;
    }
    if (onPlay) onPlay(profile);
  };

  if (screen === 'players') {
    return (
      <PlayerEditor
        players={profiles}
        onPlayersChange={(ps) => {
          setProfiles(ps);
          saveProfiles(ps);
        }}
        onBack={() => setScreen('main')}
      />
    );
  }

  if (screen === 'settings') {
    return (
      <SettingsMenu
        onBack={() => {
          const persisted = loadProfiles();
          setProfiles(persisted || []);
          setScreen('main');
        }}
      />
    );
  }

  if (screen === 'progress' && selectedProfileId) {
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (profile) {
      return <ProgressView profile={profile} onBack={() => setScreen('main')} />;
    }
  }

  return (
    <div className="start-menu">
      <header className="menu-header">
        <span className="magic-icon">✨</span>
        <h1>Spellbound Maze</h1>
        <span className="magic-icon">🔮</span>
      </header>

      <p className="tagline">Navigate the maze by spelling words!</p>

      {profiles.length > 0 && (
        <section className="player-select">
          <h2>Who's playing?</h2>
          <div className="player-chips">
            {profiles.map(p => (
              <PlayerChip
                key={p.id}
                player={p}
                isSelected={selectedProfileId === p.id}
                onClick={() => toggleProfileSelection(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      <nav className="menu-buttons">
        <button
          className="menu-btn primary"
          onClick={handleStartGame}
          disabled={!selectedProfileId}
        >
          <span className="icon">▶</span>
          <span>Start Game</span>
        </button>

        <button 
          className="menu-btn" 
          onClick={() => setScreen('progress')}
          disabled={!selectedProfileId}
        >
          <span className="icon">📊</span>
          <span>My Stats</span>
        </button>

        <button className="menu-btn" onClick={() => setScreen('players')}>
          <span className="icon">👤</span>
          <span>Players</span>
        </button>

        <button className="menu-btn" onClick={() => setScreen('settings')}>
          <span className="icon">⚙️</span>
          <span>Settings</span>
        </button>
      </nav>

      <div className="decorations">
        <span className="float-char char-1">🧙</span>
        <span className="float-char char-2">🦉</span>
        <span className="float-char char-3">🐉</span>
        <span className="star star-1">⭐</span>
        <span className="star star-2">✦</span>
        <span className="star star-3">⭐</span>
        <span className="star star-4">✦</span>
        <span className="star star-5">⭐</span>
        <span className="star star-6">✦</span>
      </div>
    </div>
  );
}

/* ============ Player Editor Component ============ */
interface PlayerEditorProps {
  players: Profile[];
  onPlayersChange: (players: Profile[]) => void;
  onBack: () => void;
}

function PlayerEditor({ players, onPlayersChange, onBack }: PlayerEditorProps) {
  const [editingPlayer, setEditingPlayer] = useState<Profile | null>(null);
  const [newName, setNewName] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const editingCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = () => {
      const v = (window.speechSynthesis?.getVoices?.()) || [];
      setVoices(v);
    };
    load();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = load;
    }
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const addPlayer = () => {
    const newPlayer: Profile = {
      id: generateUUID(),
      name: `Player ${players.length + 1}`,
      avatar: AVATARS[players.length % AVATARS.length],
      color: MAZE_THEMES[players.length % MAZE_THEMES.length].chipColor,
      theme: MAZE_THEMES[players.length % MAZE_THEMES.length].id,
      words: [],
    };
    const next = [...players, newPlayer];
    addProfile(newPlayer);
    onPlayersChange(next);
    setEditingPlayer(newPlayer);
    setNewName(newPlayer.name);
    
    setTimeout(() => {
      editingCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const updatePlayer = (updated: Profile) => {
    const next = players.map(p => (p.id === updated.id ? updated : p));
    updateProfile(updated);
    onPlayersChange(next);
  };

  const deletePlayer = (id: string) => {
    const next = players.filter(p => p.id !== id);
    deleteProfile(id);
    onPlayersChange(next);
    if (editingPlayer?.id === id) {
      setEditingPlayer(null);
    }
  };

  const saveEdit = () => {
    if (editingPlayer && newName.trim()) {
      updatePlayer({ ...editingPlayer, name: newName.trim() });
      setEditingPlayer(null);
    }
  };

  return (
    <div className="start-menu">
      <header className="menu-header compact">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Players</h1>
      </header>

      <div className="player-list">
        {players.map(player => (
          <div
            key={player.id}
            ref={editingPlayer?.id === player.id ? editingCardRef : null}
            className={`player-card ${editingPlayer?.id === player.id ? 'editing' : ''}`}
            style={{ '--card-color': player.color } as React.CSSProperties}
          >
            {editingPlayer?.id === player.id ? (
              <div className="edit-form">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Enter name"
                  autoFocus
                  maxLength={12}
                />
                
                <div className="avatar-picker">
                  <label>Pick a character:</label>
                  <div className="avatar-grid">
                    {AVATARS.map(av => (
                      <button
                        key={av}
                        className={`avatar-option ${editingPlayer.avatar === av && !editingPlayer.avatarUrl ? 'selected' : ''}`}
                        onClick={() => {
                          const updated = { ...editingPlayer, avatar: av, avatarUrl: undefined };
                          setEditingPlayer(updated);
                          updatePlayer(updated);
                        }}
                      >
                        {av}
                      </button>
                    ))}
                    {CUSTOM_AVATARS.map(customAv => (
                      <button
                        key={customAv.id}
                        className={`avatar-option ${editingPlayer.avatarUrl === customAv.url ? 'selected' : ''}`}
                        onClick={() => {
                          const updated = { ...editingPlayer, avatar: customAv.name, avatarUrl: customAv.url };
                          setEditingPlayer(updated);
                          updatePlayer(updated);
                        }}
                      >
                        <img src={customAv.url} alt={customAv.name} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="theme-picker">
                  <label>Pick a maze theme:</label>
                  <div className="theme-grid">
                    {MAZE_THEMES.map(theme => (
                      <button
                        key={theme.id}
                        className={`theme-option ${editingPlayer.theme === theme.id ? 'selected' : ''}`}
                        onClick={() => {
                          const updated = { ...editingPlayer, theme: theme.id, color: theme.chipColor };
                          setEditingPlayer(updated);
                          updatePlayer(updated);
                        }}
                      >
                        <div className="theme-preview">
                          {theme.colors.map((c, i) => (
                            <div key={i} className="color-band" style={{ backgroundColor: c }} />
                          ))}
                        </div>
                        <span className="theme-name">{theme.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'block', marginBottom: 6 }}>Voice</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', marginBottom: 8 }}>
                    <select
                      value={editingPlayer.voiceId || ''}
                      style={{ flex: '1 1 auto', minWidth: '150px', padding: '8px', fontSize: '0.95rem', borderRadius: '8px', border: '2px solid #E0E0E0' }}
                      onChange={e => {
                        const updated = { ...editingPlayer, voiceId: e.target.value || undefined };
                        setEditingPlayer(updated);
                        updatePlayer(updated);
                      }}
                    >
                      <option value="">(default)</option>
                      {voices.map((v, i) => {
                        const value = `voice-${i}`;
                        return <option key={value} value={value}>{v.name} — {v.lang}</option>;
                      })}
                    </select>
                    <button 
                      className="menu-btn" 
                      onClick={() => {
                        if (editingPlayer) {
                          const sample = editingPlayer.name || 'Hello';
                          if (editingPlayer.voiceId?.startsWith('voice-')) {
                            const idx = parseInt(editingPlayer.voiceId.replace('voice-', ''), 10);
                            const chosen = voices[idx];
                            if (chosen) {
                              const compositeId = `${chosen.name}|${chosen.voiceURI}|${chosen.lang}`;
                              saveSettings({ ...(loadSettings() || {}), voiceId: compositeId });
                            }
                          }
                          speak(sample);
                        }
                      }} 
                      style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}
                    >
                      ▶ Play
                    </button>
                  </div>

                  <div className="edit-actions">
                    <button className="save-btn" onClick={saveEdit}>Done</button>
                    <button className="delete-btn" onClick={() => deletePlayer(player.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                className="player-display"
                onClick={() => {
                  setEditingPlayer(player);
                  setNewName(player.name);
                }}
              >
                <span className="avatar">
                  {player.avatarUrl ? (
                    <img src={player.avatarUrl} alt="avatar" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  ) : (
                    player.avatar
                  )}
                </span>
                <span className="name">{player.name}</span>
                <span className="edit-hint">tap to edit</span>
              </button>
            )}
          </div>
        ))}
      </div>

      <button className="add-player-btn" onClick={addPlayer}>
        <span className="icon">+</span>
        <span>Add Player</span>
      </button>

      <button
        className="menu-btn secondary-btn"
        onClick={() => {
          const seedPlayers = loadSeedData();
          onPlayersChange(seedPlayers);
          saveProfiles(seedPlayers);
        }}
        style={{ marginTop: 12, background: '#4CAF50', color: '#fff' }}
      >
        <span className="icon">🌱</span>
        <span>Load Test Data</span>
      </button>
    </div>
  );
}

/* ============ Settings Menu Component ============ */
interface SettingsMenuProps {
  onBack: () => void;
}

function SettingsMenu({ onBack }: SettingsMenuProps) {
  const [players, setPlayers] = useState<Profile[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [editingWords, setEditingWords] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<string | null>(null);

  useEffect(() => {
    const persisted = loadProfiles();
    setPlayers(persisted || []);
  }, []);

  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const saveWords = (playerId: string, words: string[]) => {
    const updated = players.map(p => 
      p.id === playerId ? { ...p, words } : p
    );
    setPlayers(updated);
    saveProfiles(updated);
  };

  const addWords = () => {
    if (!selectedPlayerId || !wordInput.trim()) return;
    const newWords = wordInput
      .split(/[\n,]+/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    const currentWords = selectedPlayer?.words || [];
    const combined = [...currentWords, ...newWords];
    saveWords(selectedPlayerId, combined);
    setWordInput('');
  };

  const removeWord = (word: string) => {
    if (!selectedPlayerId) return;
    const currentWords = selectedPlayer?.words || [];
    saveWords(selectedPlayerId, currentWords.filter(w => w !== word));
  };

  const clearAllWords = () => {
    if (!selectedPlayerId) return;
    if (confirm('Clear all words for this player?')) {
      saveWords(selectedPlayerId, []);
      setEditingWords(false);
    }
  };

  const handleClearProgress = (playerId: string) => {
    const profile = players.find(p => p.id === playerId);
    if (!profile) return;
    
    const updatedProfile = clearProgress(profile);
    const updated = players.map(p => p.id === playerId ? updatedProfile : p);
    setPlayers(updated);
    saveProfiles(updated);
    setShowClearConfirm(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index || !selectedPlayerId || !selectedPlayer?.words) return;
    
    const words = [...selectedPlayer.words];
    const [draggedWord] = words.splice(draggedIndex, 1);
    words.splice(index, 0, draggedWord);
    
    const updated = players.map(p => 
      p.id === selectedPlayerId ? { ...p, words } : p
    );
    setPlayers(updated);
    setDraggedIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !selectedPlayerId) return;
    
    const currentPlayer = players.find(p => p.id === selectedPlayerId);
    if (currentPlayer?.words) {
      saveWords(selectedPlayerId, currentPlayer.words);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    if (selectedPlayerId) {
      const currentPlayer = players.find(p => p.id === selectedPlayerId);
      if (currentPlayer?.words) {
        saveProfiles(players);
      }
    }
  };

  return (
    <div className="start-menu">
      <header className="menu-header compact">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h1>Settings</h1>
      </header>

      <section className="settings-section">
        <h2>📝 Word Lists</h2>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Select Player:</label>
          <div className="player-chips">
            {players.map(p => (
              <PlayerChip
                key={p.id}
                player={p}
                isSelected={selectedPlayerId === p.id}
                onClick={() => {
                  setSelectedPlayerId(p.id);
                  setEditingWords(false);
                  setWordInput('');
                }}
              />
            ))}
          </div>
        </div>

        {selectedPlayer && (
          <div style={{ marginTop: 24 }}>
            <div style={{ marginBottom: 20, padding: 16, background: '#f0f8ff', borderRadius: 8, border: '2px solid #4a90e2' }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold', fontSize: '1rem' }}>
                🎯 Difficulty Level for {selectedPlayer.name}
              </label>
              <select
                value={selectedPlayer.difficulty || 'easy'}
                onChange={(e) => {
                  const updated = players.map(p => 
                    p.id === selectedPlayerId ? { ...p, difficulty: e.target.value as 'easy' | 'medium' | 'hard' } : p
                  );
                  setPlayers(updated);
                  saveProfiles(updated);
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '2px solid #ddd',
                  background: '#fff',
                  cursor: 'pointer'
                }}
              >
                <option value="easy">Easy (No extra letters)</option>
                <option value="medium">Medium (+2 random letters)</option>
                <option value="hard">Hard (+5 random letters)</option>
              </select>
              <div style={{ marginTop: 8, fontSize: '0.85rem', color: '#555', fontStyle: 'italic' }}>
                {(!selectedPlayer.difficulty || selectedPlayer.difficulty === 'easy') && 'Perfect for beginners - only the letters needed'}
                {selectedPlayer.difficulty === 'medium' && 'A bit more challenging with 2 extra letters to ignore'}
                {selectedPlayer.difficulty === 'hard' && 'Expert mode with 5 extra letters to avoid'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>
                {selectedPlayer.name}'s Words ({selectedPlayer.words?.length || 0})
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {!editingWords ? (
                  <>
                    <button 
                      className="menu-btn secondary-btn"
                      onClick={() => setEditingWords(true)}
                    >
                      ✏️ Add Words
                    </button>
                    {(selectedPlayer.words?.length || 0) > 0 && (
                      <button 
                        className="menu-btn secondary-btn"
                        onClick={clearAllWords}
                        style={{ background: '#dc3545' }}
                      >
                        🗑️ Clear All
                      </button>
                    )}
                  </>
                ) : (
                  <button 
                    className="menu-btn secondary-btn"
                    onClick={() => setEditingWords(false)}
                  >
                    ✓ Done
                  </button>
                )}
              </div>
            </div>

            {editingWords && (
              <div style={{ marginBottom: 16, padding: 16, background: '#f8f9fa', borderRadius: 8 }}>
                <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                  Add New Words (one per line or comma-separated):
                </label>
                <textarea
                  value={wordInput}
                  onChange={e => setWordInput(e.target.value)}
                  placeholder="cat, dog, fish&#10;bird&#10;hamster"
                  rows={5}
                  style={{ 
                    width: '100%', 
                    padding: 12, 
                    fontSize: '1rem',
                    borderRadius: 8,
                    border: '2px solid #ddd',
                    fontFamily: 'monospace'
                  }}
                />
                <button 
                  className="menu-btn primary"
                  onClick={addWords}
                  disabled={!wordInput.trim()}
                  style={{ marginTop: 8 }}
                >
                  Add Words
                </button>
              </div>
            )}

            {(selectedPlayer.words?.length || 0) > 0 ? (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 8,
                padding: 12,
                background: '#fff',
                borderRadius: 8,
                border: '2px solid #e0e0e0'
              }}>
                {selectedPlayer.words!.map((word, idx) => (
                  <div 
                    key={`${word}-${idx}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 12px',
                      background: selectedPlayer.color || '#5B9BD5',
                      color: '#fff',
                      borderRadius: 16,
                      fontSize: '0.95rem',
                      cursor: 'grab',
                      opacity: draggedIndex === idx ? 0.4 : 1,
                      transform: draggedIndex === idx ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.15s ease-out',
                      boxShadow: draggedIndex === idx ? '0 4px 12px rgba(0,0,0,0.5)' : 'none'
                    }}
                  >
                    <span style={{ opacity: 0.7, fontSize: '0.9rem' }}>⋮⋮</span>
                    <span>{word}</span>
                    <button
                      onClick={() => removeWord(word)}
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        background: 'rgba(255,255,255,0.5)',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ 
                padding: 24, 
                textAlign: 'center', 
                color: '#999',
                background: '#f8f9fa',
                borderRadius: 8,
                fontStyle: 'italic'
              }}>
                No words yet. Click "Add Words" to get started!
              </p>
            )}

            {/* Clear Progress Section */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '2px solid #e0e0e0' }}>
              <h3 style={{ marginBottom: 12, fontSize: '1rem', color: '#495057' }}>📊 Progress Management</h3>
              <button
                className="menu-btn"
                style={{ 
                  background: '#dc3545', 
                  color: 'white',
                  fontSize: '0.9rem',
                  padding: '10px 20px',
                  width: 'auto'
                }}
                onClick={() => setShowClearConfirm(selectedPlayer.id)}
              >
                🗑️ Clear Progress Stats
              </button>
              {selectedPlayer.progress && selectedPlayer.progress.totalGamesPlayed > 0 && (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: '#6c757d', 
                  marginTop: 12,
                  padding: '12px',
                  background: '#f8f9fa',
                  borderRadius: 8
                }}>
                  <strong>Current progress:</strong> {getProgressSummary(selectedPlayer.progress)}
                </div>
              )}
              <p style={{ 
                fontSize: '0.85rem', 
                color: '#6c757d', 
                marginTop: 8,
                fontStyle: 'italic'
              }}>
                💡 Tip: Clear weekly to track fresh progress
              </p>
            </div>
          </div>
        )}

        {players.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', marginTop: 24 }}>
            No players yet. Add players first to manage word lists.
          </p>
        )}
      </section>

      {/* Clear Progress Confirmation Dialog */}
      {showClearConfirm && (() => {
        const playerToClear = players.find(p => p.id === showClearConfirm);
        if (!playerToClear) return null;
        
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: 16,
              padding: 32,
              maxWidth: 450,
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              <h2 style={{ marginTop: 0, color: '#dc3545', fontSize: '1.5rem' }}>⚠️ Clear Progress?</h2>
              <p style={{ color: '#495057', lineHeight: 1.6, marginBottom: 16 }}>
                This will permanently delete all progress stats for{' '}
                <strong style={{ color: '#212529' }}>{playerToClear.name}</strong>:
              </p>
              <div style={{
                background: '#f8f9fa',
                padding: 16,
                borderRadius: 8,
                marginBottom: 20,
                fontSize: '0.95rem',
                color: '#495057',
                border: '1px solid #dee2e6'
              }}>
                {getProgressSummary(playerToClear.progress)}
              </div>
              <p style={{ color: '#6c757d', fontSize: '0.9rem', marginBottom: 24 }}>
                ✓ Profile, words, and settings will be kept
              </p>
              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  className="menu-btn"
                  style={{ flex: 1, background: '#6c757d', color: 'white' }}
                  onClick={() => setShowClearConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="menu-btn"
                  style={{ flex: 1, background: '#dc3545', color: 'white' }}
                  onClick={() => handleClearProgress(showClearConfirm)}
                >
                  Clear Progress
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default StartMenu;
