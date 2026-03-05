// src/App.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import PhaserGame from './PhaserGame';
import HUD from './components/HUD';
import CharacterCustomizer from './components/CharacterCustomizer';
import GameOverModal from './components/GameOverModal';
import MainMenu from './components/MainMenu';
import MultiplayerLobby from './components/MultiplayerLobby';
import PauseMenu from './components/PauseMenu';
import SpectatorOverlay from './components/SpectatorOverlay';
import EventBus from './eventBus';
import NetworkManager from './phaser/managers/NetworkManager';

export default function App() {
  const [gameState, setGameState] = useState('idle'); // 'idle' | 'menu' | 'lobby' | 'playing' | 'dead'
  const [finalScore, setFinalScore] = useState(0);
  const [finalDistance, setFinalDistance] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSpectating, setIsSpectating] = useState(false);
  const [sessionConfig, setSessionConfig] = useState(null);

  // Use refs for listener stability - ensures handlers always have current state without re-registering
  const stateRef = useRef({ gameState, sessionConfig, isPaused });
  useEffect(() => {
    stateRef.current = { gameState, sessionConfig, isPaused };
  }, [gameState, sessionConfig, isPaused]);

  useEffect(() => {
    const onReady = () => setGameState(prev => (prev === 'idle' ? 'menu' : prev));

    const onGameOver = ({ score, distance }) => {
      setFinalScore(score);
      setFinalDistance(distance);
      setGameState('dead');
    };

    const onStarted = () => {
      console.log('[App] game-started received');
      setGameState('playing');
      // DO NOT force isPaused to false here, as the user might have paused during countdown
    };

    const onLocalDeath = ({ score, distance }) => {
      setFinalScore(score);
      setFinalDistance(distance);
      setIsSpectating(true);
    };

    const onMultiStart = ({ seed, theme, players }) => {
      const playerName = NetworkManager.player?.name || 'Player';
      const playerConfig = {
        name: `${playerName} (You)`,
        color: NetworkManager.player?.color || '#6366f1'
      };

      const mData = {
        multiplayer: true,
        autoStart: true,
        seed,
        players: players || [],
        playerConfig,
        theme: theme || 'default'
      };
      setSessionConfig(mData);
      setIsSpectating(false);
      setGameState('playing');
      EventBus.emit('game-restart', mData);
    };

    const onMultiGameOver = () => {
      setIsSpectating(false);
      setGameState('dead');
    };

    const onPause = () => {
      console.log('[App] onPause received. Forcing isPaused = true');
      setIsPaused(true);
    };
    const onResume = () => {
      console.log('[App] onResume received. Forcing isPaused = false');
      setIsPaused(false);
    };

    EventBus.on('scene-ready', onReady);
    EventBus.on('game-started', onStarted);
    EventBus.on('local-death', onLocalDeath);
    EventBus.on('multiplayer-start', onMultiStart);
    EventBus.on('multiplayer-game-over', onMultiGameOver);
    EventBus.on('game-over', onGameOver);
    EventBus.on('pause-game', onPause);
    EventBus.on('resume-game', onResume);

    if (window.phaserGameReady) onReady();

    return () => {
      EventBus.off('scene-ready', onReady);
      EventBus.off('game-started', onStarted);
      EventBus.off('local-death', onLocalDeath);
      EventBus.off('multiplayer-start', onMultiStart);
      EventBus.off('multiplayer-game-over', onMultiGameOver);
      EventBus.off('game-over', onGameOver);
      EventBus.off('pause-game', onPause);
      EventBus.off('resume-game', onResume);
    };
  }, []);

  // Use a simpler approach for the ESC key - rely on Phaser for emission
  // and App.jsx for state management. 

  const handleStartSolo = useCallback(({ theme }) => {
    const themeKey = (theme || 'default').toLowerCase();
    const sceneData = { theme: themeKey, autoStart: true, multiplayer: false };
    setSessionConfig(sceneData);
    setGameState('playing');
    setIsPaused(false); // Reset pause state on new game
    // Use game-restart so the scene restarts with theme baked into create(data)
    EventBus.emit('game-restart', sceneData);
  }, []);

  const handleStartMulti = useCallback(() => {
    setGameState('lobby');
    NetworkManager.connect();
  }, []);

  const handleRestart = useCallback(() => {
    setFinalScore(0);
    setFinalDistance(0);
    setIsSpectating(false);

    if (sessionConfig?.multiplayer) {
      setGameState('lobby');
      // Tell Phaser to go back to "idle" or just wait
      EventBus.emit('quit-game');
    } else {
      setGameState('playing');
      setIsPaused(false);
      const restartData = { ...sessionConfig, autoStart: true };
      EventBus.emit('game-restart', restartData);
    }
  }, [sessionConfig]);

  const handleResume = useCallback(() => EventBus.emit('resume-game'), []);

  const handleQuit = useCallback(() => {
    EventBus.emit('resume-game');
    EventBus.emit('quit-game');
    if (sessionConfig?.multiplayer) NetworkManager.disconnect();
    setGameState('menu');
    setIsPaused(false);
    setSessionConfig(null);
  }, [sessionConfig]);

  return (
    <div id="app-root" className="relative w-screen h-screen overflow-hidden bg-[#0f172a] font-inter">
      <div className="mesh-atmosphere" />
      <div className="relative z-10 w-full h-full text-white">
        <PhaserGame sceneData={sessionConfig} />
      </div>
      <div className="absolute inset-0 pointer-events-none z-20 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(2, 6, 23, 0.4) 100%)' }} />

      {gameState === 'menu' && (
        <MainMenu onStart={handleStartSolo} onMultiplayer={handleStartMulti} />
      )}

      {gameState === 'lobby' && (
        <MultiplayerLobby onBack={() => setGameState('menu')} />
      )}

      <HUD visible={gameState === 'playing'} />
      <CharacterCustomizer visible={(gameState === 'playing' && !isPaused) || gameState === 'lobby'} />
      <SpectatorOverlay visible={isSpectating} score={finalScore} distance={finalDistance} />

      {isPaused && gameState === 'playing' && (
        <PauseMenu onResume={handleResume} onQuit={handleQuit} />
      )}

      <GameOverModal
        visible={gameState === 'dead'}
        finalScore={finalScore}
        finalDistance={finalDistance}
        onRestart={handleRestart}
      />

      {gameState === 'idle' && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 gap-4">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-[0.6em] text-slate-500 uppercase font-black">System Interface</span>
            <h1 className="text-4xl font-extrabold text-white tracking-tighter animate-pulse">INITIALIZING</h1>
          </div>
          <div className="flex gap-2.5 mt-4">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-2.5 h-2.5 rounded-full bg-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.4)]" style={{ animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite` }} />
            ))}
          </div>
        </div>
      )}

      {gameState === 'playing' && !isPaused && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 pointer-events-none fade-in-scale">
          <div className="bento-card px-8 py-3 rounded-full border border-white/10 flex items-center gap-4">
            <div className="flex gap-2 text-white">
              <span className="px-2 py-0.5 rounded bg-indigo-500 text-[10px] font-black">SPACE</span>
              <span className="text-[10px] font-black text-slate-500">OR</span>
              <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-black text-slate-300">TAP</span>
            </div>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[10px] text-white font-black tracking-[0.2em] uppercase italic">TO SHIFT GRAVITY</span>
          </div>
        </div>
      )}
    </div>
  );
}
