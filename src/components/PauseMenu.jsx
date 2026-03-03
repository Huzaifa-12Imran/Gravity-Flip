// src/components/PauseMenu.jsx
import React from 'react';
import AudioManager from '../phaser/managers/AudioManager';

export default function PauseMenu({ onResume, onQuit }) {
    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center modal-backdrop backdrop-blur-sm">
            <div className="glass-panel w-[400px] max-w-[90vw] p-10 rounded-[2rem] border border-white/10 flex flex-col items-center gap-8 shadow-2xl animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="flex flex-col items-center gap-2">
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 mb-1">
                        <span className="text-[10px] font-black text-amber-500 tracking-[0.4em] uppercase">
                            Session Interrupted
                        </span>
                    </div>
                    <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase">
                        PAUSED
                    </h2>
                </div>

                {/* Info */}
                <p className="text-slate-400 text-sm text-center font-medium leading-relaxed px-4">
                    Neural link maintained. Operational status preserved. Ready to synchronize.
                </p>

                {/* Actions */}
                <div className="w-full flex flex-col gap-3">
                    <button
                        onClick={() => {
                            AudioManager.playBlip(660);
                            onResume();
                        }}
                        className="w-full py-5 rounded-2xl text-base font-black tracking-[0.3em] uppercase 
                                 premium-gradient text-white shadow-lg shadow-indigo-500/20
                                 transition-all duration-200 active:scale-95 group relative overflow-hidden"
                    >
                        <span className="relative z-10">RESUME SESSION</span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>

                    <button
                        onClick={() => {
                            AudioManager.playBlip(440);
                            onQuit();
                        }}
                        className="w-full py-5 rounded-2xl text-base font-black tracking-[0.3em] uppercase 
                                 bg-white/5 text-slate-400 border border-white/5
                                 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20
                                 transition-all duration-200 active:scale-95"
                    >
                        TERMINATE SESSION
                    </button>
                </div>

                {/* Footer Tip */}
                <div className="pt-4 border-t border-white/5 w-full flex justify-center">
                    <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                        Press [ESC] to Resume
                    </span>
                </div>
            </div>
        </div>
    );
}
