import React, { useEffect, useRef, useState } from 'react'
import { Profile } from '../types'
import gameAdapter from '../lib/gameAdapter'
import { loadSettings, saveSettings } from '../lib/persistence'
import { recordGameStart, recordWordAttempt, recordGameEnd } from '../lib/progressTracker'

// Theme color definitions (matching gameCore.js)
const THEME_COLORS = {
  forest: { wall: '#558b2f' },
  ocean: { wall: '#0277bd' },
  candy: { wall: '#c2185b' },
  space: { wall: '#3949ab' },
  sunset: { wall: '#8B4A6B' },
  castle: { wall: '#4A5568' }
};6

export default function GameView({ profile, onExit }: { profile?: Profile, onExit: ()=>void }){
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const correctWordsRef = useRef(0)
  const currentWordRef = useRef('')
  const gameStartTimeRef = useRef<number>(0)
  const wordAttemptsRef = useRef<Record<string, number>>({})
  const [overlay, setOverlay] = useState<string | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [showCelebration, setShowCelebration] = useState(false)
  const [showFeedback, setShowFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [wordsCompleted, setWordsCompleted] = useState(0)
  const [correctWords, setCorrectWords] = useState(0)
  const [showButtons, setShowButtons] = useState(false)
  const [failedWord, setFailedWord] = useState('')

  // Auto-dismiss incorrect feedback after 5 seconds and handle keyboard dismiss
  useEffect(() => {
    if (showFeedback === 'incorrect') {
      const timer = setTimeout(() => setShowFeedback(null), 5000);
      const handleKeyPress = () => setShowFeedback(null);
      window.addEventListener('keydown', handleKeyPress);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [showFeedback]);

  useEffect(()=>{
    const c = canvasRef.current;
    if(!c) return;

    // initialize adapter and runtime
    let mounted = true;
    (async ()=>{
      // If profile has a preferred voice, convert index-based voiceId to composite identifier and save to settings
      try{
        if(profile?.voiceId){
          let voiceToSave = profile.voiceId;
          // If it's an index-based ID (voice-N), convert to composite name|voiceURI|lang
          if(voiceToSave.startsWith('voice-')){
            const idx = parseInt(voiceToSave.replace('voice-', ''), 10);
            const voices = (window.speechSynthesis && window.speechSynthesis.getVoices && window.speechSynthesis.getVoices()) || [];
            const voice = voices[idx];
            if(voice) voiceToSave = `${voice.name}|${voice.voiceURI}|${voice.lang}`;
          }
          saveSettings({ ...(loadSettings()||{}), voiceId: voiceToSave });
        }
      }catch(e){}

      await gameAdapter.init(c, {
        onUpdate: (s)=>{ 
          if(mounted) {
            setStatus(s);
            // Track current word in ref
            if(s.word) currentWordRef.current = s.word;
            // Check for word completion
            if(s.collected && s.word && s.collected.length === s.word.length){
              setWordsCompleted(prev => prev + 1);
            }
          }
        },
        onOverlay: (text)=>{ 
          if(mounted) {
            setOverlay(text);
            // Check for correct word completion
            if(text && text.includes('Great! Next word')){
              const word = currentWordRef.current;
              const attempts = wordAttemptsRef.current[word] || 1;
              if (profile) {
                recordWordAttempt(profile, word, true, attempts);
              }
              wordAttemptsRef.current[word] = 0; // reset
              
              correctWordsRef.current += 1;
              setCorrectWords(correctWordsRef.current);
              setShowFeedback('correct');
              setTimeout(() => setShowFeedback(null), 2000);
            }
            // Check for game completion
            if(text && text.includes('All done')){
              if (profile) {
                recordGameEnd(profile, correctWordsRef.current, profile?.words?.length || 0);
              }
              
              setTimeout(() => {
                setShowCelebration(true);
                // Delayed button display: 2s for perfect, 1s otherwise
                const totalWords = profile?.words?.length || 0;
                const isPerfect = correctWordsRef.current === totalWords && totalWords > 0;
                setTimeout(() => setShowButtons(true), isPerfect ? 2000 : 1000);
              }, 1000);
            }
            // Check for wrong letter
            if(text && (text.includes('Try again') || text.includes('Out of attempts'))){
              const word = currentWordRef.current;
              wordAttemptsRef.current[word] = (wordAttemptsRef.current[word] || 0) + 1;
              
              if(text.includes('Out of attempts') && profile){
                recordWordAttempt(profile, word, false, wordAttemptsRef.current[word]);
                wordAttemptsRef.current[word] = 0; // reset
              }
              
              setFailedWord(word);
              setShowFeedback('incorrect');
            }
          }
        },
        getRetries: ()=>{ return profile?.words ? 1 : 1; },
        onEnableStart: (_)=>{}
      }, { 
        minLetterSpacing: profile?.words ? 3 : 3, 
        playerAvatar: profile?.avatar || '🙂',
        playerAvatarUrl: profile?.avatarUrl,
        mazeTheme: profile?.theme || 'forest',
        difficulty: profile?.difficulty || 'easy',
        trickyLettersEnabled: profile?.trickyLettersEnabled || false
      });

      if(profile?.words && profile.words.length > 0){
        gameStartTimeRef.current = Date.now();
        wordAttemptsRef.current = {};
        if (profile) {
          recordGameStart(profile, gameStartTimeRef.current);
        }
        await gameAdapter.setWords(profile.words);
        await gameAdapter.start();
        // Focus the canvas to ensure keyboard events work immediately
        c.focus();
      }
    })();

    return ()=>{ mounted = false; gameAdapter.stop().catch(()=>{}); };
  }, [profile])

  const themeId = profile?.theme || 'forest';
  const themeColor = THEME_COLORS[themeId as keyof typeof THEME_COLORS]?.wall || '#558b2f';

  const word = status?.word || '';
  const collected = status?.collected || '';
  const hideWordText = status?.hideWordText !== false;

  const handlePlayAgain = async () => {
    setShowCelebration(false);
    setShowFeedback(null);
    setWordsCompleted(0);
    setCorrectWords(0);
    correctWordsRef.current = 0;
    setShowButtons(false);
    if(profile?.words && profile.words.length > 0){
      gameStartTimeRef.current = Date.now();
      wordAttemptsRef.current = {};
      if (profile) {
        recordGameStart(profile, gameStartTimeRef.current);
      }
      await gameAdapter.setWords(profile.words);
      await gameAdapter.start();
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '8px',
      position: 'relative',
      maxWidth: '100vw',
      overflow: 'hidden'
    }}>
      {/* Player Badge - styled like Start Menu */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: '#fff',
        borderRadius: '50px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        marginBottom: 12,
        border: `3px solid ${themeColor}`
      }}>
        <span style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', display: 'flex', alignItems: 'center' }}>
          {profile?.avatarUrl ? (
            <img src={profile.avatarUrl} alt="avatar" style={{ width: 'clamp(1.5rem, 5vw, 2rem)', height: 'clamp(1.5rem, 5vw, 2rem)', borderRadius: '50%' }} />
          ) : (
            profile?.avatar || '🙂'
          )}
        </span>
        <span style={{ 
          fontSize: 'clamp(1rem, 3.5vw, 1.3rem)', 
          fontWeight: 700,
          color: themeColor
        }}>
          {profile?.name}
        </span>
      </div>

      {/* Exit Button - Top Right Corner */}
      <div style={{
        position: 'absolute',
        top: 8,
        right: 8,
        zIndex: 10
      }}>
        <button
          onClick={onExit}
          style={{
            background: 'rgba(255,255,255,0.95)',
            border: '2px solid #ccc',
            borderRadius: '50%',
            width: 'clamp(40px, 10vw, 48px)',
            height: 'clamp(40px, 10vw, 48px)',
            cursor: 'pointer',
            fontSize: 'clamp(1rem, 3vw, 1.3rem)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
          }}
          title="Exit to Menu"
        >
          🏠
        </button>
      </div>

      {/* Hear Button - Playful Child-Friendly Style */}
      <button
        onClick={()=>gameAdapter.hear()}
        style={{
          background: 'linear-gradient(135deg, #FFD166 0%, #FFA500 100%)',
          border: 'none',
          borderRadius: '20px',
          padding: 'clamp(12px, 3vw, 16px) clamp(20px, 5vw, 32px)',
          fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
          fontWeight: 700,
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255,165,0,0.4), 0 0 20px rgba(255,209,102,0.3)',
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.2s ease',
          textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(255,165,0,0.5), 0 0 30px rgba(255,209,102,0.4)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1) translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(255,165,0,0.4), 0 0 20px rgba(255,209,102,0.3)';
        }}
      >
        <span style={{ fontSize: 'clamp(1.3rem, 4vw, 1.6rem)' }}>🔊</span>
        <span>Hear Word</span>
      </button>

      {/* Word Display */}
      {word && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 16, 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          letterSpacing: '4px',
          minHeight: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {hideWordText ? (
            <span style={{ color: '#999' }}>{'_ '.repeat(word.length).trim()}</span>
          ) : (
            <span>
              <span style={{ color: '#4CAF50' }}>{collected}</span>
              <span style={{ color: '#ccc' }}>{'_ '.repeat(word.length - collected.length).trim()}</span>
            </span>
          )}
        </div>
      )}

      {/* Playful Feedback Messages */}
      {showFeedback === 'correct' && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)',
          color: '#fff',
          padding: '32px 48px',
          borderRadius: '24px',
          fontSize: '2.5rem',
          fontWeight: 'bold',
          boxShadow: '0 8px 32px rgba(76,175,80,0.6)',
          animation: 'bounce 0.5s ease',
          zIndex: 1000,
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 8 }}>🎉</div>
          <div>Amazing!</div>
          <div style={{ fontSize: '1.5rem', marginTop: 8 }}>Next word...</div>
        </div>
      )}

      {showFeedback === 'incorrect' && (
        <div 
          onClick={() => setShowFeedback(null)}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
            color: '#fff',
            padding: '32px 48px',
            borderRadius: '24px',
            fontSize: '2rem',
            fontWeight: 'bold',
            boxShadow: '0 8px 32px rgba(255,152,0,0.6)',
            animation: 'shake 0.5s ease',
            zIndex: 1000,
            textAlign: 'center',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🤔</div>
          <div>Try again!</div>
          <div style={{ 
            fontSize: '1.5rem', 
            marginTop: 16,
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '12px',
            letterSpacing: '2px'
          }}>
            {failedWord.toUpperCase()}
          </div>
          <div style={{ 
            fontSize: '0.9rem', 
            marginTop: 12, 
            opacity: 0.8,
            fontStyle: 'italic'
          }}>
            Click or press any key to continue
          </div>
        </div>
      )}

      {/* Victory Celebration */}
      {showCelebration && (() => {
        const totalWords = profile?.words?.length || 0;
        const isPerfect = correctWords === totalWords && totalWords > 0;
        const isGreat = correctWords / totalWords >= 0.8;
        
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: isPerfect ? 'rgba(255,215,0,0.3)' : 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn 0.3s ease'
          }}>
            {/* Perfect Score Confetti Rain */}
            {isPerfect && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                overflow: 'hidden',
                pointerEvents: 'none'
              }}>
                {[...Array(30)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    top: '-20px',
                    left: `${Math.random() * 100}%`,
                    fontSize: '2rem',
                    animation: `fall ${2 + Math.random() * 2}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0.8
                  }}>
                    {['⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 4)]}
                  </div>
                ))}
              </div>
            )}

            <div style={{
              background: isPerfect 
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)'
                : 'linear-gradient(135deg, #FF8C42 0%, #FFB347 100%)',
              borderRadius: '32px',
              padding: '48px',
              textAlign: 'center',
              boxShadow: isPerfect 
                ? '0 0 60px rgba(255,215,0,0.8), 0 16px 48px rgba(0,0,0,0.5)'
                : '0 16px 48px rgba(0,0,0,0.5)',
              maxWidth: '600px',
              animation: 'scaleInBig 0.6s ease',
              position: 'relative'
            }}>
              {/* Perfect Score Crown on Avatar */}
              {isPerfect && (
                <div style={{
                  fontSize: '4rem',
                  position: 'absolute',
                  top: '-30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  animation: 'float0 2s ease-in-out infinite'
                }}>👑</div>
              )}

              {/* Emoji Celebration */}
              <div style={{ 
                fontSize: isPerfect ? '7rem' : '6rem', 
                marginBottom: 16,
                animation: isPerfect ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }}>
                {isPerfect ? '⭐🎊⭐' : isGreat ? '🎉🌟🎉' : '🎊✨🎊'}
              </div>

             {/* Title */}
            <h2 style={{ 
              fontSize: '3.5rem', 
              margin: '0 0 24px', 
              color: isPerfect ? '#FFD700' : '#fff',
              textShadow: isPerfect 
                ? '0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.6), 3px 3px 6px rgba(0,0,0,0.8)'
                : '3px 3px 6px rgba(0,0,0,0.4)',
              WebkitTextStroke: isPerfect ? '2px #B8860B' : 'none',
              fontWeight: 'bold',
              animation: isPerfect ? 'pulse 1.5s ease-in-out infinite' : 'none'
            }}>
              {isPerfect ? '⭐ Perfect! ⭐' : isGreat ? 'You Did It!' : 'Almost There!'}
            </h2>

              {/* Score Display */}
              <div style={{
                fontSize: '2.5rem',
                color: '#fff',
                marginBottom: 24,
                fontWeight: 'bold',
                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
              }}>
                {correctWords} / {totalWords} words correct!
              </div>

              {/* Stars Display */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: 32,
                flexWrap: 'wrap',
                maxWidth: '500px',
                margin: '0 auto 32px'
              }}>
                {[...Array(totalWords)].map((_, i) => (
                  <div key={i} style={{
                    fontSize: '2.5rem',
                    animation: isPerfect ? `starFlyIn 0.5s ease ${i * 0.1}s both` : 'scaleIn 0.3s ease both',
                    animationDelay: isPerfect ? `${i * 0.15}s` : '0s'
                  }}>
                    {i < correctWords ? '⭐' : '☆'}
                  </div>
                ))}
              </div>

              {/* Perfect Score Sparkles */}
              {isPerfect && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  pointerEvents: 'none',
                  overflow: 'hidden',
                  borderRadius: '32px'
                }}>
                  {[...Array(15)].map((_, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      top: `${Math.random() * 100}%`,
                      left: `${Math.random() * 100}%`,
                      fontSize: '1.5rem',
                      animation: `float${i % 3} ${2 + Math.random()}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 2}s`,
                      opacity: 0.6
                    }}>
                      ✨
                    </div>
                  ))}
                </div>
              )}

              {/* Buttons - Show after delay */}
              {showButtons && (
                <div style={{ 
                  display: 'flex', 
                  gap: 16, 
                  justifyContent: 'center',
                  animation: 'fadeIn 0.5s ease'
                }}>
                  <button
                    onClick={handlePlayAgain}
                    style={{
                      background: '#fff',
                      color: isPerfect ? '#FFD700' : '#FF8C42',
                      border: 'none',
                      borderRadius: '16px',
                      padding: '16px 32px',
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🔄 Play Again
                  </button>
                  <button
                    onClick={onExit}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      color: '#fff',
                      border: '2px solid #fff',
                      borderRadius: '16px',
                      padding: '16px 32px',
                      fontSize: '1.3rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    🏠 Menu
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        width: '100%',
        maxWidth: '100vw',
        padding: '0 8px',
        boxSizing: 'border-box'
      }}>
        <canvas 
          id="reactGameCanvas" 
          ref={canvasRef} 
          width={800} 
          height={480}
          tabIndex={0}
          style={{ 
            border: '4px solid #fff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            maxWidth: '100%',
            height: 'auto',
            outline: 'none'
          }} 
        />
      </div>

      {/* Instructions */}
      <div style={{
        textAlign: 'center',
        marginTop: '16px',
        color: '#fff',
        fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '600px',
        lineHeight: 1.5
      }}>
        Use Arrow Keys or WASD to move and Space Bar (Jump Bar) to select letters
      </div>

      {/* Add animations */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes shake {
          0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
          25% { transform: translate(-50%, -50%) rotate(-5deg); }
          75% { transform: translate(-50%, -50%) rotate(5deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes scaleInBig {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shimmer {
          0%, 100% { background-position: -200% center; }
          50% { background-position: 200% center; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes float0 {
          0%, 100% { transform: translateX(-50%) translateY(0px); }
          50% { transform: translateX(-50%) translateY(-10px); }
        }
        @keyframes float1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(-5deg); }
        }
        @keyframes fall {
          from { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          to { transform: translateY(100vh) rotate(360deg); opacity: 0.8; }
        }
        @keyframes starFlyIn {
          from { 
            transform: scale(0) rotate(-180deg); 
            opacity: 0; 
          }
          50% {
            transform: scale(1.3) rotate(0deg);
          }
          to { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
          }
        }
        
        /* Mobile optimizations */
        @media (max-width: 480px) {
          #reactGameCanvas {
            border-width: 2px !important;
          }
        }
      `}</style>
    </div>
  )
}
