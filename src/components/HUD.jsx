// src/components/HUD.jsx
import { useEffect, useState, useRef } from 'react';
import EventBus from '../eventBus';
import NetworkManager from '../phaser/managers/NetworkManager';

export default function HUD({ visible }) {
    const [score, setScore] = useState(0);
    const [multiplier, setMultiplier] = useState('1.0');
    const [distance, setDistance] = useState(0);
    const [players, setPlayers] = useState([]);
    const prevScore = useRef(0);
    const [scoreFlash, setScoreFlash] = useState(false);
    const [colorTheme, setColorTheme] = useState('ORANGE');
    const [difficulty, setDifficulty] = useState('EASY');

    useEffect(() => {
        const handler = ({ score: s, multiplier: m, distance: d }) => {
            if (s !== prevScore.current) {
                setScoreFlash(true);
                setTimeout(() => setScoreFlash(false), 120);
                prevScore.current = s;
            }
            setScore(s);
            setMultiplier(m);
            setDistance(d);
        };

        const onPlayersUpdate = (updatedPlayers) => {
            setPlayers(updatedPlayers);
        };

        const onColorChange = (data) => {
            setColorTheme(data.name.toUpperCase());
        };

        const onDifficultyChange = (data) => {
            setDifficulty(data.level);
        };

        EventBus.on('score-update', handler);
        EventBus.on('players-update', onPlayersUpdate);
        EventBus.on('obstacle-color-change', onColorChange);
        EventBus.on('difficulty-change', onDifficultyChange);

        // Initial set
        if (NetworkManager.players.length > 0) {
            setPlayers(NetworkManager.players);
        }

        return () => {
            EventBus.off('score-update', handler);
            EventBus.off('players-update', onPlayersUpdate);
            EventBus.off('obstacle-color-change', onColorChange);
            EventBus.off('difficulty-change', onDifficultyChange);
        };
    }, []);

    if (!visible) return null;

    const isMultiplayer = players.length > 1;

    return (
        <div className="absolute top-0 left-0 right-0 z-30 p-4 md:p-8 pointer-events-none grid grid-cols-2 md:grid-cols-12 md:grid-rows-2 gap-3 md:gap-4 max-w-[1400px] mx-auto">

            {/* Score Card */}
            <div className="col-span-2 md:col-span-4 md:row-span-2 bento-card p-4 md:p-6 flex flex-col justify-between group">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
                        Neural Collection
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-600 uppercase mb-1">Accumulated Data</span>
                    <span className={`text-3xl md:text-5xl font-black tracking-tighter text-white transition-all duration-300 ${scoreFlash ? 'scale-105 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''}`}>
                        {score.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Multiplayer Leaderboard (Mobile: Hidden / Desktop: Col 5-8) */}
            {isMultiplayer && (
                <div className="hidden md:flex flex-col gap-2 col-span-4 row-span-2 bento-card p-4 bg-slate-400/5">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Linked Entities</span>
                    <div className="flex flex-col gap-1.5 overflow-hidden">
                        {players.map(p => (
                            <div key={p.id} className="flex items-center justify-between gap-3 p-2 bg-white/5 rounded border border-white/5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                    <span className="text-[10px] font-bold text-white truncate max-w-[80px]">{p.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[10px] font-black text-slate-500 tracking-tighter">{p.distance}m</span>
                                    {p.isDead && <span className="text-[8px] font-black text-red-500 uppercase italic">Offline</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Controls & Mini Stats */}
            <div className={`col-span-1 md:col-span-2 bento-card flex items-center justify-center p-3 group pointer-events-auto cursor-pointer active:scale-95 ${isMultiplayer ? 'md:col-start-9' : 'md:col-start-5'}`}
                onClick={() => EventBus.emit('pause-game')}>
                <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                        <div className="w-1 h-3 bg-white rounded-full" />
                        <div className="w-1 h-3 bg-white rounded-full" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">Pause</span>
                </div>
            </div>

            {/* Combined Traversal & Momentum (Compact) */}
            <div className={`col-span-1 md:col-span-4 bento-card px-4 md:px-6 flex items-center justify-between ${isMultiplayer ? 'md:col-start-9 md:row-start-2' : 'md:col-start-5 md:row-start-2'}`}>
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 tracking-[0.2em] uppercase">Traversal</span>
                    <span className="text-xl font-black text-white tracking-tighter">
                        {distance.toLocaleString()}<span className="text-xs text-slate-500 ml-1 italic">m</span>
                    </span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-indigo-400 tracking-widest uppercase italic">x{multiplier}</span>
                    <div className="flex gap-0.5 mt-1">
                        {[0, 1, 2].map(i => (
                            <div key={i} className={`w-0.5 h-2 rounded-full ${parseFloat(multiplier) > (i + 1) ? 'bg-indigo-500' : 'bg-white/10'}`} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Session Type */}
            <div className={`col-span-1 md:col-span-4 bento-card px-4 md:px-6 flex items-center gap-3 bg-indigo-500/5 ${isMultiplayer ? 'md:col-start-9 md:row-start-3' : 'md:col-start-9 md:row-start-1'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isMultiplayer ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                <span className="text-[8px] md:text-[9px] font-black text-slate-300 tracking-[0.4em] uppercase italic">
                    {isMultiplayer ? 'Networked Node Active' : 'Simulation Active'}
                </span>
            </div>

            {/* Color Theme Display */}
            <div className="col-span-2 md:col-span-12 bento-card px-4 md:px-6 py-2 flex items-center justify-center bg-white/5 border-white/5">
                <div className="flex items-center gap-4">
                    <span className="text-[8px] font-black text-slate-500 tracking-[0.3em] uppercase">Active Spectrum:</span>
                    <span className="text-[10px] font-black text-indigo-400 tracking-[0.5em] animate-pulse">{colorTheme}</span>
                    <div className="w-px h-3 bg-white/10 mx-2" />
                    <span className="text-[8px] font-black text-slate-500 tracking-[0.3em] uppercase">Threat Level:</span>
                    <span className={`text-[10px] font-black tracking-[0.5em] ${difficulty === 'EASY' ? 'text-emerald-400' : difficulty === 'MEDIUM' ? 'text-amber-400' : 'text-red-500 animate-pulse'}`}>
                        {difficulty}
                    </span>
                </div>
            </div>
        </div>
    );
}
