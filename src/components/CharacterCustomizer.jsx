// src/components/CharacterCustomizer.jsx
// Slide-in premium sidebar for character appearance.
import { useState } from 'react';
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
    const [selected, setSelected] = useState('#6366f1');
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (hex) => {
        setSelected(hex);
        EventBus.emit('color-change', hex);
    };

    if (!visible) return null;

    return (
        <>
            {/* Toggle Tab */}
            <button
                onClick={() => setIsOpen(o => !o)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-40 flex items-center justify-center
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
                className={`absolute right-12 top-1/2 -translate-y-1/2 z-40 w-64
                          glass-panel rounded-3xl p-8 flex flex-col gap-6
                          ${isOpen ? 'slide-in' : 'hidden'}
                           shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}
            >
                <div className="flex flex-col items-start gap-1">
                    <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase">
                        Configuration
                    </span>
                    <h2 className="text-xl font-black text-white tracking-tight">
                        Visual ID
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {PALETTE.map(({ label, hex, bg }) => {
                        const isActive = selected === hex;
                        return (
                            <button
                                key={hex}
                                onClick={() => handleSelect(hex)}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-300
                                           ${isActive
                                        ? 'bg-white/10 ring-2 ring-indigo-500/50 scale-105'
                                        : 'bg-white/5 hover:bg-white/10 hover:scale-102'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl ${bg} shadow-lg`} />
                                <span className={`text-[10px] font-bold tracking-wider ${isActive ? 'text-white' : 'text-slate-500'}`}>
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
