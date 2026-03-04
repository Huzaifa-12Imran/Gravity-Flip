// src/components/CharacterCustomizer.jsx
// Slide-in premium sidebar for character appearance.
import { useState, useEffect } from 'react';
import EventBus from '../eventBus';

const PALETTE = [
    { label: 'Indigo', hex: '#6366f1', bg: 'bg-indigo-500' },
    { label: 'Emerald', hex: '#10b981', bg: 'bg-emerald-500' },
    { label: 'Amber', hex: '#f59e0b', bg: 'bg-amber-500' },
    { label: 'Rose', hex: '#f43f5e', bg: 'bg-rose-500' },
    { label: 'Slate', hex: '#64748b', bg: 'bg-slate-500' },
    { label: 'Pearl', hex: '#f8fafc', bg: 'bg-slate-50' },
];

export default function CharacterCustomizer({ visible }) {
    const [selected, setSelected] = useState(sessionStorage.getItem('gf-player-color') || '#6366f1');
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (hex) => {
        setSelected(hex);
        sessionStorage.setItem('gf-player-color', hex);
        EventBus.emit('color-change', hex);
    };

    useEffect(() => {
        const current = sessionStorage.getItem('gf-player-color');
        if (!current) {
            sessionStorage.setItem('gf-player-color', '#6366f1');
        }
    }, []);

    if (!visible) return null;

    return (
        <>
            {/* Toggle Tab */}
            <button
                onClick={() => setIsOpen(o => !o)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-[70] flex items-center justify-center
                          w-12 h-28 rounded-l-3xl glass-panel border-r-0 border-white/10
                          cursor-pointer hover:bg-slate-800/80 transition-all duration-300 group"
                style={{ writingMode: 'vertical-rl' }}
            >
                <span className="text-[10px] font-black text-slate-400 tracking-[0.5em] uppercase rotate-180 group-hover:text-white transition-colors">
                    APPEARANCE
                </span>
            </button>

            {/* Sidebar Panel */}
            <div
                className={`absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-[70] w-48 md:w-64
                          glass-panel rounded-3xl p-4 md:p-8 flex flex-col gap-4 md:gap-6
                          ${isOpen ? 'slide-in' : 'hidden'}
                           shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
            >
                <div className="flex flex-col items-start gap-1">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-[0.3em] md:tracking-[0.4em] uppercase">
                        Configuration
                    </span>
                    <h2 className="text-lg md:text-xl font-black text-white tracking-tight">
                        Visual ID
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 md:gap-4">
                    {PALETTE.map(({ label, hex, bg }) => {
                        const isActive = selected === hex;
                        return (
                            <button
                                key={hex}
                                onClick={() => handleSelect(hex)}
                                className={`flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3 rounded-xl md:rounded-2xl transition-all duration-300
                                           ${isActive
                                        ? 'bg-white/10 ring-2 ring-indigo-500/50 scale-105'
                                        : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl ${bg} shadow-lg`} />
                                <span className={`text-[8px] md:text-[10px] font-bold tracking-wider ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center leading-relaxed">
                        Updates real-time via<br />Vector Synchronization
                    </p>
                </div>
            </div>
        </>
    );
}
