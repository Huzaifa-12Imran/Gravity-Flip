// src/components/MainMenu.jsx
// Premium Main Menu (Homepage) for the game.
import { useState, useEffect } from 'react';

export default function MainMenu({ onStart }) {
    const [highScore, setHighScore] = useState(0);

    useEffect(() => {
        const stored = localStorage.getItem('gfzp-highscore');
        if (stored) setHighScore(parseInt(stored, 10));
    }, []);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center modal-backdrop">
            <div className="glass-panel w-[500px] max-w-[95vw] p-12 rounded-[2.5rem] border border-white/10 flex flex-col items-center gap-10 shadow-2xl fade-in-scale">

                {/* Brand Section */}
                <div className="flex flex-col items-center gap-3">
                    <div className="px-4 py-1.5 rounded-full bg-slate-800 border border-white/5 mb-2">
                        <span className="text-[11px] font-black text-slate-500 tracking-[0.5em] uppercase">
                            Premium Interface v1.2
                        </span>
                    </div>
                    <div className="flex flex-col items-center">
                        <h1 className="text-7xl font-black text-white tracking-tighter leading-none italic">
                            GRAVITY
                        </h1>
                        <h1 className="text-7xl font-black text-indigo-400 tracking-tighter leading-none -mt-2">
                            FLIP
                        </h1>
                    </div>
                </div>

                {/* Status/Score Bar */}
                <div className="w-full flex justify-center gap-4">
                    <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center min-w-[120px]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Status</span>
                        <span className="text-emerald-400 text-sm font-black">ONLINE</span>
                    </div>
                    <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center min-w-[120px]">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Personal Best</span>
                        <span className="text-white text-sm font-black">{highScore.toLocaleString()}</span>
                    </div>
                </div>

                {/* Primary Action */}
                <div className="w-full flex flex-col gap-4">
                    <button
                        onClick={onStart}
                        className="w-full py-6 rounded-2xl text-lg font-black tracking-[0.4em] uppercase 
                                 premium-gradient text-white shadow-xl shadow-indigo-500/20
                                 premium-gradient-hover transition-all duration-300 active:scale-95 
                                 group relative overflow-hidden"
                    >
                        <span className="relative z-10">INITIATE SESSION</span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] text-center">
                        Secure connection established...
                    </p>
                </div>

                {/* Footer Controls */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-white/5 w-full">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">PC Input</span>
                        <span className="text-[10px] text-slate-400 font-bold">[SPACE]</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Touch Input</span>
                        <span className="text-[10px] text-slate-400 font-bold">[TAP SCREEN]</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
