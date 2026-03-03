// src/components/GameOverModal.jsx
// Premium Game Over modal shown when the player fails.
import { useEffect, useState } from 'react';
import EventBus from '../eventBus';

export default function GameOverModal({ visible, finalScore, finalDistance, onRestart }) {
    const [highScore, setHighScore] = useState(() => {
        return parseInt(localStorage.getItem('gfzp-highscore') || '0', 10);
    });
    const [isNewHigh, setIsNewHigh] = useState(false);

    useEffect(() => {
        if (visible && finalScore > 0) {
            const stored = parseInt(localStorage.getItem('gfzp-highscore') || '0', 10);
            if (finalScore > stored) {
                localStorage.setItem('gfzp-highscore', finalScore.toString());
                setHighScore(finalScore);
                setIsNewHigh(true);
            } else {
                setHighScore(stored);
                setIsNewHigh(false);
            }
        }
    }, [visible, finalScore]);

    const handleRestart = () => {
        EventBus.emit('game-restart');
        if (onRestart) onRestart();
    };

    if (!visible) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center modal-backdrop pointer-events-auto">
            <div className="glass-panel w-[400px] max-w-[90vw] p-10 rounded-3xl border border-white/10 fade-in-scale flex flex-col items-center gap-8 shadow-2xl">

                {/* Header */}
                <div className="flex flex-col items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-slate-800 border border-white/5 mb-2">
                        <span className="text-[10px] font-black text-slate-500 tracking-[0.5em] uppercase">
                            Session Terminated
                        </span>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter text-center">
                        GAME OVER
                    </h1>
                </div>

                {/* Stats Partition */}
                <div className="w-full flex flex-col gap-4">
                    <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Current Score
                        </span>
                        <span className="text-2xl font-black text-white">
                            {finalScore.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 relative overflow-hidden">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Best Score
                        </span>
                        <div className="flex items-center gap-3">
                            {isNewHigh && (
                                <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-0.5 rounded shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                                    NEW RECORD
                                </span>
                            )}
                            <span className="text-2xl font-black text-indigo-400">
                                {highScore.toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={handleRestart}
                    className="w-full py-5 rounded-2xl text-sm font-black tracking-[0.4em] uppercase 
                             premium-gradient text-white shadow-xl premium-gradient-hover
                             transition-all duration-300 active:scale-95 group relative overflow-hidden"
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        Reinitialize System
                    </span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]">
                    Gravity manipulation requires precision. Try again.
                </p>
            </div>
        </div>
    );
}
