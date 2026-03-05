// src/components/MultiplayerLobby.jsx
import { useState, useEffect } from 'react';
import EventBus from '../eventBus';
import NetworkManager from '../phaser/managers/NetworkManager';
import AudioManager from '../phaser/managers/AudioManager';
import { GAME_THEMES } from '../utils/GameThemes';

const THEME_ACCENTS = {
    default: { accent: '#6366f1', icon: '⬡' },
    beach: { accent: '#38bdf8', icon: '🌊' },
    italian: { accent: '#fbbf24', icon: '🏛' },
    neon: { accent: '#00ff88', icon: '⚡' },
    forest: { accent: '#52b788', icon: '🌿' },
};

export default function MultiplayerLobby({ onBack }) {
    const [view, setView] = useState('selection'); // 'selection' | 'create' | 'join' | 'lobby'
    const [roomCode, setRoomCode] = useState('');
    const [players, setPlayers] = useState([]);
    const [playerName, setPlayerName] = useState(sessionStorage.getItem('gf-player-name') || '');
    const [localPlayer, setLocalPlayer] = useState(null);
    const [error, setError] = useState('');
    const [ready, setReady] = useState(false);
    const [lobbyTheme, setLobbyTheme] = useState(() => localStorage.getItem('gfzp-selected-theme') || 'default');
    const [createTheme, setCreateTheme] = useState(() => localStorage.getItem('gfzp-selected-theme') || 'default');

    useEffect(() => {
        // Initiate connection as soon as the lobby is opened
        NetworkManager.connect();

        const onRoomUpdate = ({ roomCode, player, players: initialPlayers, theme }) => {
            setView('lobby');
            setPlayers([...initialPlayers]);
            setLocalPlayer({ ...player });
            if (theme) setLobbyTheme(theme);
            setError('');
        };

        const onPlayersUpdate = (updatedPlayers) => {
            setPlayers(updatedPlayers);
            const me = updatedPlayers.find(p => p.id === NetworkManager.player?.id);
            if (me) setReady(me.ready);
        };

        const onNetworkStatus = ({ connected }) => {
            // Force re-render to update connection-dependent UI
            setPlayers(prev => [...prev]);
            if (connected) setError('');
        };

        const onNetworkError = (msg) => {
            setError(msg);
            AudioManager.playBlip(220, 0.1);
        };

        const onMultiplayerStart = ({ seed }) => {
            // App component handles the transition to game scene
        };

        EventBus.on('room-update', onRoomUpdate);
        EventBus.on('players-update', onPlayersUpdate);
        EventBus.on('network-status', onNetworkStatus);
        EventBus.on('network-error', onNetworkError);
        EventBus.on('multiplayer-start', onMultiplayerStart);

        return () => {
            EventBus.off('room-update', onRoomUpdate);
            EventBus.off('players-update', onPlayersUpdate);
            EventBus.off('network-status', onNetworkStatus);
            EventBus.off('network-error', onNetworkError);
            EventBus.off('multiplayer-start', onMultiplayerStart);
        };
    }, []);

    const handleCreate = () => {
        if (!playerName) { setError('Name required'); return; }
        const playerColor = sessionStorage.getItem('gf-player-color') || '#6366f1';
        console.log('[MultiplayerLobby] handleCreate: color=', playerColor, 'theme=', createTheme);
        sessionStorage.setItem('gf-player-name', playerName);
        localStorage.setItem('gfzp-selected-theme', createTheme);
        NetworkManager.createRoom(playerName, playerColor, createTheme);
        AudioManager.playBlip(600, 0.05);
    };

    const handleJoin = () => {
        if (!playerName) { setError('Name required'); return; }
        if (!roomCode) { setError('Code required'); return; }
        const playerColor = sessionStorage.getItem('gf-player-color') || '#6366f1';
        console.log('[MultiplayerLobby] handleJoin: color=', playerColor);
        sessionStorage.setItem('gf-player-name', playerName);
        NetworkManager.joinRoom(roomCode.toUpperCase(), playerName, playerColor);
        AudioManager.playBlip(600, 0.05);
    };

    const toggleReady = () => {
        const newReady = !ready;
        setReady(newReady);
        NetworkManager.sendReady(newReady);
        AudioManager.playBlip(newReady ? 880 : 440, 0.05);
    };

    return (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-[500px] flex flex-col gap-6 bento-card p-8 border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                    <span className="text-8xl font-black italic tracking-tighter">NODE</span>
                </div>

                {/* Header */}
                <div className="flex justify-between items-center relative z-10">
                    <div>
                        <span className="text-[10px] font-black tracking-[0.4em] text-indigo-500 uppercase">Multiplayer Module</span>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                            {view === 'lobby' ? 'Active Session' : 'Lobby Interface'}
                        </h2>
                    </div>
                    {view !== 'lobby' && (
                        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                            <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                        </button>
                    )}
                </div>

                {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest animate-shake">{error}</div>}
                <div className="text-[8px] font-mono text-slate-500 uppercase tracking-tighter opacity-50 px-1">
                    Target: {NetworkManager.serverUrl} | Status: {NetworkManager.isConnected ? 'Connected' : 'Searching...'}
                </div>

                {/* Name Input */}
                {view !== 'lobby' && (
                    <div className="flex flex-col gap-2">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Operator Designation</label>
                        <input
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Type name..."
                            className="bg-white/5 border border-white/10 rounded-lg p-4 text-white font-bold focus:border-indigo-500 outline-none transition-all placeholder:text-white/20"
                        />
                    </div>
                )}

                {/* Views */}
                {view === 'selection' && (
                    <div className="grid grid-cols-2 gap-4 animate-scale-up">
                        <button onClick={() => setView('create')} className="flex flex-col gap-4 p-6 bento-card bg-indigo-500 group">
                            <span className="text-[10px] font-black text-white/50 uppercase">Host</span>
                            <span className="text-xl font-black text-white italic tracking-tighter group-hover:translate-x-1 transition-transform">CREATE ROOM</span>
                        </button>
                        <button onClick={() => setView('join')} className="flex flex-col gap-4 p-6 bento-card border-white/10 hover:border-white/30 transition-all group">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Client</span>
                            <span className="text-xl font-black text-white italic tracking-tighter group-hover:translate-x-1 transition-transform">JOIN ROOM</span>
                        </button>
                    </div>
                )}

                {view === 'join' && (
                    <div className="flex flex-col gap-4 animate-scale-up">
                        {NetworkManager.isConnected ? null : <div className="text-xs text-red-500 font-bold mb-2">⚠ NOT CONNECTED TO SERVER</div>}
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Reference Code</label>
                            <input
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                placeholder="ABCD12"
                                maxLength={6}
                                className="bg-white/5 border border-white/10 rounded-lg p-4 text-center text-2xl font-black text-indigo-500 tracking-[0.2em] uppercase focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <button onClick={handleJoin} className="premium-gradient p-4 rounded-xl text-white font-black italic uppercase tracking-widest hover:scale-[1.02] transition-all" disabled={!NetworkManager.isConnected}>
                            {NetworkManager.isConnected ? "SYNC WITH SESSION" : "SERVER OFFLINE"}
                        </button>
                        <button onClick={() => setView('selection')} className="text-[10px] font-black text-slate-500 uppercase py-2 hover:text-white transition-colors">Go Back</button>
                    </div>
                )}

                {view === 'create' && (
                    <div className="flex flex-col gap-4 animate-scale-up">
                        {NetworkManager.isConnected ? null : (
                            <div className="text-xs text-red-500 font-bold mb-2">
                                ⚠ NOT CONNECTED TO SERVER. {import.meta.env.DEV
                                    ? 'Is the Node.js backend running on port 3001?'
                                    : 'Check VITE_SERVER_URL and ensure the backend is live.'}
                            </div>
                        )}

                        {/* Environment Picker */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select Environment</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {Object.entries(GAME_THEMES).map(([key, theme]) => {
                                    const meta = THEME_ACCENTS[key];
                                    const isSel = createTheme === key;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => { setCreateTheme(key); AudioManager.playBlip(550, 0.05); }}
                                            title={theme.name}
                                            style={{
                                                flex: '1 1 72px',
                                                minWidth: '68px',
                                                padding: '8px 4px',
                                                borderRadius: '10px',
                                                border: isSel ? `1.5px solid ${meta.accent}` : '1.5px solid rgba(255,255,255,0.08)',
                                                background: isSel ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.04)',
                                                transform: isSel ? 'scale(1.06)' : 'scale(1)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: '6px',
                                                transition: 'all 0.2s ease',
                                            }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                                                background: `linear-gradient(135deg, ${theme.bgGradient[0]}, ${theme.bgGradient[1]})`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 16,
                                            }}>
                                                {meta.icon}
                                            </div>
                                            <span style={{
                                                fontSize: 9, fontWeight: 900, textTransform: 'uppercase',
                                                letterSpacing: '0.05em', lineHeight: 1,
                                                color: isSel ? meta.accent : '#475569',
                                            }}>
                                                {theme.name}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button onClick={handleCreate} className="premium-gradient p-4 rounded-xl text-white font-black italic uppercase tracking-widest hover:scale-[1.02] transition-all" disabled={!NetworkManager.isConnected}>
                            {NetworkManager.isConnected ? "ESTABLISH NODE" : "WAITING FOR SERVER..."}
                        </button>
                        <button onClick={() => setView('selection')} className="text-[10px] font-black text-slate-500 uppercase py-2 hover:text-white transition-colors">Go Back</button>
                    </div>
                )}

                {view === 'lobby' && (
                    <div className="flex flex-col gap-6 animate-scale-up">
                        {/* Room Info */}
                        <div className="flex justify-between items-end p-4 bg-white/5 border border-white/5 rounded-xl">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Room Link Hash</span>
                                <span className="text-2xl font-black text-indigo-500 tracking-widest">{NetworkManager.roomCode}</span>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1">
                                <span className="text-[9px] font-black text-slate-500 uppercase">Environment</span>
                                <div className="flex items-center gap-2 px-2 py-1 rounded-lg"
                                    style={{ background: `rgba(0,0,0,0.3)`, border: `1px solid ${THEME_ACCENTS[lobbyTheme]?.accent || '#6366f1'}44` }}>
                                    <span className="text-base">{THEME_ACCENTS[lobbyTheme]?.icon || '⬡'}</span>
                                    <span className="text-[10px] font-black uppercase tracking-wider"
                                        style={{ color: THEME_ACCENTS[lobbyTheme]?.accent || '#6366f1' }}>
                                        {GAME_THEMES[lobbyTheme]?.name || lobbyTheme}
                                    </span>
                                </div>
                                <div className="flex gap-1 mt-1">
                                    {players.map((_, i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-500" />)}
                                </div>
                            </div>
                        </div>

                        {/* Player List */}
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Linked Entities ({players.length}/4)</label>
                            <div className="flex flex-col gap-1">
                                {players.map(p => (
                                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                                            <span className="font-bold text-white text-sm">{p.name} {p.id === NetworkManager.player?.id ? '(YOU)' : ''}</span>
                                        </div>
                                        {p.ready ? (
                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">READY</span>
                                        ) : (
                                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">PENDING</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={toggleReady}
                                className={`p-4 rounded-xl font-black italic uppercase tracking-widest transition-all ${ready ? 'bg-emerald-500 text-white' : 'premium-gradient text-white'}`}
                            >
                                {ready ? 'READY FOR UPLINK' : 'INITIATE UPLINK'}
                            </button>
                            <p className="text-[9px] text-center text-slate-600 font-black uppercase tracking-[0.2em] animate-pulse">
                                WAIT FOR ALL NODES TO SYNC (2+ REQUIRED)
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
