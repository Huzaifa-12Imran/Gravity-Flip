// src/App.jsx
// Root React component: Now includes a Premium Main Menu (Homepage).
import { useState, useEffect, useCallback } from 'react';
import PhaserGame from './PhaserGame';
import HUD from './components/HUD';
import CharacterCustomizer from './components/CharacterCustomizer';
import GameOverModal from './components/GameOverModal';
import MainMenu from './components/MainMenu';
import PauseMenu from './components/PauseMenu';
import EventBus from './eventBus';

export default function App() {
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'menu' | 'playing' | 'dead'
  console.log('[App] Current gameState:', gameState);
  const [finalScore, setFinalScore] = useState(0);
  const [finalDistance, setFinalDistance] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Scene ready -> Transition from 'idle' to 'menu'
    const onReady = () => {
      console.log('[App] scene-ready received');
      setGameState(prev => (prev === 'idle' ? 'menu' : prev));
    };

    const onGameOver = ({ score, distance }) => {
      console.log('[App] game-over received');
      setFinalScore(score);
      setFinalDistance(distance);
      setGameState('dead');
    };

    const onStarted = () => {
      console.log('[App] game-started received');
      setGameState('playing');
      setIsPaused(false);
    };

    const onPause = () => {
      console.log('[App] pause-game received');
      setIsPaused(true);
    };

    const onResume = () => {
      console.log('[App] resume-game received');
      setIsPaused(false);
    };

    console.log('[App] Registering event listeners');
    EventBus.on('scene-ready', onReady);
    EventBus.on('game-started', onStarted);
    EventBus.on('game-over', onGameOver);
    EventBus.on('pause-game', onPause);
    EventBus.on('resume-game', onResume);

    // Initial check: if Phaser already loaded before this hook
    // (This helps with some hot-reload or fast-boot scenarios)
    if (window.phaserGameReady) {
      onReady();
    }

    return () => {
      EventBus.off('scene-ready', onReady);
      EventBus.off('game-started', onStarted);
      EventBus.off('game-over', onGameOver);
      EventBus.off('pause-game', onPause);
      EventBus.off('resume-game', onResume);
    };
  }, []);

  // Keyboard Pause Toggle: Listen for [ESC] key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && gameState === 'playing') {
        if (isPaused) {
          EventBus.emit('resume-game');
        } else {
          EventBus.emit('pause-game');
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [gameState, isPaused]);

  const handleStartGame = useCallback(() => {
    console.log('[App] Starting game from menu');
    setGameState('playing');
    // Tell Phaser to start the game logic if it was waiting
    EventBus.emit('start-game');
  }, []);

  const handleRestart = useCallback(() => {
    setFinalScore(0);
    setFinalDistance(0);
    setGameState('playing');
    setIsPaused(false);
  }, []);

  const handleResume = useCallback(() => {
    EventBus.emit('resume-game');
  }, []);

  const handleQuit = useCallback(() => {
    EventBus.emit('resume-game'); // Ensure Phaser is unpaused
    setGameState('menu');
    setIsPaused(false);
  }, []);

  return (
    <div
      id="app-root"
      className="relative w-screen h-screen overflow-hidden bg-[#0f172a] font-inter"
    >
      {/* ── Phaser Canvas ─────────────────────────────────────── */}
      {/* ── Mesh Atmosphere (Dynamic Background) ───────────────── */}
      <div className="mesh-atmosphere" />

      {/* ── Phaser Canvas ─────────────────────────────────────── */}
      <div className="relative z-10 w-full h-full">
        <PhaserGame />
      </div>

      {/* ── Cinematic Grain / Noise Overlay ────────────────────── */}
      <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* ── Soft Vignette (Visual Overlay) ────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(circle at center, transparent 30%, rgba(2, 6, 23, 0.4) 100%)',
        }}
      />

      {/* ── Main Menu (Homepage) ──────────────────────────────── */}
      {gameState === 'menu' && (
        <MainMenu onStart={handleStartGame} />
      )}

      {/* ── HUD ───────────────────────────────────────────────── */}
      <HUD visible={gameState === 'playing'} />

      {/* ── Character Customizer ──────────────────────────────── */}
      <CharacterCustomizer visible={gameState === 'playing' && !isPaused} />

      {/* ── Pause Menu ─────────────────────────────────────────── */}
      {isPaused && gameState === 'playing' && (
        <PauseMenu onResume={handleResume} onQuit={handleQuit} />
      )}

      {/* ── Game Over Modal ────────────────────────────────────── */}
      <GameOverModal
        visible={gameState === 'dead'}
        finalScore={finalScore}
        finalDistance={finalDistance}
        onRestart={handleRestart}
      />

      {/* ── Loading Overlay ────────────────────────────────────── */}
      {gameState === 'idle' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 gap-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-[0.6em] text-slate-500 uppercase font-black">
              System Interface
            </span>
            <h1 className="text-4xl font-extrabold text-white tracking-tighter animate-pulse">
              INITIALIZING
            </h1>
          </div>
          <div className="flex gap-2.5 mt-4">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full bg-indigo-500/80"
                style={{
                  animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
                  boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)'
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Help Hint (only when playing) ──────────────────────── */}
      {gameState === 'playing' && !isPaused && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none fade-in-scale">
          <div className="bento-card px-8 py-3 rounded-full border border-white/10 flex items-center gap-4">
            <div className="flex gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500 text-[10px] font-black text-white">SPACE</span>
              <span className="text-[10px] font-black text-slate-500">OR</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-black text-slate-300">TAP</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[10px] text-white font-black tracking-[0.2em] uppercase italic">
              TO SHIFT GRAVITY
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
