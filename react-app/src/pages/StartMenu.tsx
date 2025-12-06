import { useState, useEffect } from 'react';
import { loadProfiles, saveProfiles, addProfile, updateProfile, deleteProfile, loadSettings, saveSettings } from '../lib/persistence';
import { speak } from '../lib/audio';
import { Profile } from '../types';

type MenuScreen = 'main' | 'players' | 'settings';

interface StartMenuProps {
  onPlay?: (profile: Profile) => void;
  onEdit?: (profile?: Profile) => void;
}

export function StartMenu({ onPlay, onEdit }: StartMenuProps) {
  const [screen, setScreen] = useState<MenuScreen>('main');
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  // load persisted profiles
  useEffect(()=>{
    try{
      const persisted = loadProfiles();
      setProfiles(persisted || []);
    }catch(e){ setProfiles([]); }
  }, []);

  const toggleProfileSelection = (id: string) => {
    // single-selection: select or deselect
    setSelectedProfileId(prev => prev === id ? null : id);
  };

  const handleStartGame = () => {
    if (!selectedProfileId) return;
    const profile = profiles.find(p => p.id === selectedProfileId);
    if (!profile) return;
    // If the profile has no words, open the editor first (so user can add words)
    if (!profile.words || profile.words.length === 0) {
      if (onEdit) { onEdit(profile); return; }
      alert('Please add some words for this profile before starting the game.');
      return;
    }
    if (onPlay) onPlay(profile);
  };

  if (screen === 'players') {
    return (
      <PlayerEditor
        players={profiles}
        onPlayersChange={(ps)=>{ setProfiles(ps); saveProfiles(ps); }}
        onBack={() => setScreen('main')}
      />
    );
  }

  if (screen === 'settings') {
    return <SettingsMenu onBack={() => {
      // Reload profiles when returning from settings to get updated word lists
      const persisted = loadProfiles();
      setProfiles(persisted || []);
      setScreen('main');
    }} />;
  }

  return (
    <div className="start-menu">
      <header className="menu-header">
        <span className="magic-icon">✨</span>
        <h1>Spellbound Maze</h1>
        <span className="magic-icon">🔮</span>
      </header>

      <p className="tagline">Navigate the maze by spelling words!</p>

      {/* Player Selection */}
          {profiles.length > 0 && (
        <section className="player-select">
          <h2>Who's playing?</h2>
          <div className="player-chips">
                    {profiles.map(p => (
                  <button
                    key={p.id}
                    className={`player-chip ${selectedProfileId === p.id ? 'selected' : ''}`}
                    onClick={() => toggleProfileSelection(p.id)}
                    style={{ '--chip-color': (p as any).color || '#5B9BD5' } as React.CSSProperties}
                  >
                    <span className="avatar">{p.avatarUrl ? <img src={p.avatarUrl} alt="avatar" style={{width:24,height:24}} /> : ((p as any).avatar || (p.name||'').charAt(0) || '🙂')}</span>
                    <span className="name">{p.name}</span>
                    {selectedProfileId === p.id && <span className="check">✓</span>}
                  </button>
                ))}
          </div>
        </section>
      )}

      {/* Main Menu Buttons */}
      <nav className="menu-buttons">
        <button
          className="menu-btn primary"
          onClick={handleStartGame}
          disabled={!selectedProfileId}
        >
          <span className="icon">▶</span>
          <span>Start Game</span>
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

      {/* Decorative elements */}
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

const AVATARS = ['🧙', '🦉', '🐉', '🦊', '🐰', '🐸', '🦁', '🦄', '🐶', '🐱', '🦋', '🐢'];
const MAZE_THEMES = [
  { id: 'forest', name: 'Forest', colors: ['#228B22', '#90EE90', '#2E8B57'], chipColor: '#228B22' },
  { id: 'ocean', name: 'Ocean', colors: ['#1E90FF', '#87CEEB', '#00CED1'], chipColor: '#1E90FF' },
  { id: 'candy', name: 'Candy', colors: ['#FF69B4', '#FFB6C1', '#DDA0DD'], chipColor: '#FF69B4' },
  { id: 'space', name: 'Space', colors: ['#191970', '#4B0082', '#9370DB'], chipColor: '#191970' },
];

type LocalProfile = Profile & { avatar?: string; color?: string };

interface PlayerEditorProps {
  players: LocalProfile[];
  onPlayersChange: (players: LocalProfile[]) => void;
  onBack: () => void;
}

function PlayerEditor({ players, onPlayersChange, onBack }: PlayerEditorProps) {
  const [editingPlayer, setEditingPlayer] = useState<LocalProfile | null>(null);
  const [newName, setNewName] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(()=>{
    const load = ()=>{
      const v = (window.speechSynthesis && window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
      setVoices(v);
    };
    load();
    if(window.speechSynthesis){
      window.speechSynthesis.onvoiceschanged = load;
    }
    return ()=>{ if(window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const addPlayer = () => {
    const newPlayer: LocalProfile = {
      id: crypto.randomUUID(),
      name: `Player ${players.length + 1}`,
      avatar: AVATARS[players.length % AVATARS.length],
      color: MAZE_THEMES[players.length % MAZE_THEMES.length].chipColor,
      theme: MAZE_THEMES[players.length % MAZE_THEMES.length].id,
      words: [],
      avatarUrl: undefined,
    } as LocalProfile;
    const next = [...players, newPlayer];
    // persist immediately
    addProfile(newPlayer as Profile);
    onPlayersChange(next);
    setEditingPlayer(newPlayer);
    setNewName(newPlayer.name);
  };

  const updatePlayer = (updated: LocalProfile) => {
    const next = players.map(p => (p.id === updated.id ? updated : p));
    updateProfile(updated as Profile);
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
                        className={`avatar-option ${editingPlayer.avatar === av ? 'selected' : ''}`}
                        onClick={() => {
                          setEditingPlayer({ ...editingPlayer, avatar: av });
                          updatePlayer({ ...editingPlayer, avatar: av });
                        }}
                      >
                        {av}
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
                        className={`theme-option ${(editingPlayer as any).theme === theme.id ? 'selected' : ''}`}
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
                  <label style={{ display:'block', marginBottom:6 }}>Voice</label>
                  <div style={{ display:'flex', gap:8, alignItems:'stretch', marginBottom:8 }}>
                    <select
                      value={editingPlayer.voiceId || ''}
                      style={{ flex: '1 1 auto', minWidth: '150px', padding: '8px', fontSize: '0.95rem', borderRadius: '8px', border: '2px solid #E0E0E0' }}
                      onChange={e=>{
                        const sel = e.target.value || undefined;
                        const updated = editingPlayer ? { ...(editingPlayer as LocalProfile), voiceId: sel } : null;
                        if(updated){
                          setEditingPlayer(updated);
                          updatePlayer(updated);
                        }
                      }}
                    >
                      <option value="">(default)</option>
                      {voices.map((v,i)=>{
                        // Use index-based value to guarantee uniqueness
                        const value = `voice-${i}`;
                        const key = `${value}`;
                        return <option key={key} value={value}>{v.name} — {v.lang}</option>;
                      })}
                    </select>
                    <button className="menu-btn" onClick={()=>{
                      if(editingPlayer){
                        const sample = editingPlayer.name || 'Hello';
                        let chosen = null;
                        if(editingPlayer.voiceId && editingPlayer.voiceId.startsWith('voice-')){
                          const idx = parseInt(editingPlayer.voiceId.replace('voice-', ''), 10);
                          chosen = voices[idx] || null;
                          try{ 
                            if(chosen){ 
                              const compositeId = `${chosen.name}|${chosen.voiceURI}|${chosen.lang}`;
                              saveSettings({ ...(loadSettings()||{}), voiceId: compositeId }); 
                            } 
                          }catch(e){}
                        }
                        speak(sample);
                      }
                    }} style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>▶ Play</button>
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
                <span className="avatar">{player.avatar}</span>
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
    </div>
  );
}

/* ============ Settings Menu Component ============ */
interface SettingsMenuProps {
  onBack: () => void;
}

function SettingsMenu({ onBack }: SettingsMenuProps) {
  const [players, setPlayers] = useState<LocalProfile[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [editingWords, setEditingWords] = useState(false);
  const [wordInput, setWordInput] = useState('');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
    saveProfiles(updated as Profile[]);
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex === null || draggedIndex === index || !selectedPlayerId || !selectedPlayer?.words) return;
    
    // Reorder in real-time as user drags over items
    const words = [...selectedPlayer.words];
    const [draggedWord] = words.splice(draggedIndex, 1);
    words.splice(index, 0, draggedWord);
    
    // Update local state immediately for smooth animation
    const updated = players.map(p => 
      p.id === selectedPlayerId ? { ...p, words } : p
    );
    setPlayers(updated);
    setDraggedIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || !selectedPlayerId) return;
    
    // Get the current player state with reordered words and save
    const currentPlayer = players.find(p => p.id === selectedPlayerId);
    if (currentPlayer?.words) {
      saveWords(selectedPlayerId, currentPlayer.words);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // Also save on drag end as a backup
    if (selectedPlayerId) {
      const currentPlayer = players.find(p => p.id === selectedPlayerId);
      if (currentPlayer?.words) {
        saveProfiles(players as Profile[]);
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
        
        {/* Player Selection */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Select Player:</label>
          <div className="player-chips">
            {players.map(p => (
              <button
                key={p.id}
                className={`player-chip ${selectedPlayerId === p.id ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedPlayerId(p.id);
                  setEditingWords(false);
                  setWordInput('');
                }}
                style={{ '--chip-color': (p as any).color || '#5B9BD5' } as React.CSSProperties}
              >
                <span className="avatar">{(p as any).avatar || '🙂'}</span>
                <span className="name">{p.name}</span>
                {selectedPlayerId === p.id && <span className="check">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Word List Management */}
        {selectedPlayer && (
          <div style={{ marginTop: 24 }}>
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

            {/* Add Words Form */}
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

            {/* Word List Display */}
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
                      background: (selectedPlayer as any).color || '#5B9BD5',
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
          </div>
        )}

        {players.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', marginTop: 24 }}>
            No players yet. Add players first to manage word lists.
          </p>
        )}
      </section>
    </div>
  );
}

export default StartMenu;
