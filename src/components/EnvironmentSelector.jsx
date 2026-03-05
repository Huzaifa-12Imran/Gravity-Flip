// src/components/EnvironmentSelector.jsx
import { useState, useEffect } from 'react';
import { GAME_THEMES } from '../utils/GameThemes';
import AudioManager from '../phaser/managers/AudioManager';

// Theme metadata: emoji icon + accent color per environment
const THEME_META = {
    default: { icon: '⬡', accent: '#6366f1', accentRgb: '99,102,241', label: 'DIGITAL VOID' },
    beach: { icon: '🌊', accent: '#38bdf8', accentRgb: '56,189,248', label: 'COASTAL WAVE' },
    italian: { icon: '🏛', accent: '#fbbf24', accentRgb: '251,191,36', label: 'ROMAN RUINS' },
    neon: { icon: '⚡', accent: '#00ff88', accentRgb: '0,255,136', label: 'CYBER GRID' },
    forest: { icon: '🌿', accent: '#52b788', accentRgb: '82,183,136', label: 'WILD ZONE' },
};

export default function EnvironmentSelector({ onSelect, onBack, defaultKey = 'default' }) {
    const [selected, setSelected] = useState(() => {
        const saved = localStorage.getItem('gfzp-selected-theme');
        return (saved && GAME_THEMES[saved]) ? saved : defaultKey;
    });
    const [hovered, setHovered] = useState(null);
    const [launching, setLaunching] = useState(false);

    const handlePick = (key) => {
        if (key === selected) return;
        setSelected(key);
        localStorage.setItem('gfzp-selected-theme', key);
        AudioManager.playBlip(550, 0.06);
    };

    const handleLaunch = () => {
        setLaunching(true);
        AudioManager.playStart();
        setTimeout(() => onSelect(selected), 350);
    };

    const active = THEME_META[selected];

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-y-auto"
            style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(20px)' }}>

            {/* Ambient glow that follows selected theme */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none transition-all duration-700"
                style={{ background: `radial-gradient(circle, rgba(${active.accentRgb},0.08) 0%, transparent 70%)` }} />

            <div className="relative w-full max-w-[960px] flex flex-col gap-8 fade-in-scale">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <button onClick={onBack}
                                className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
                                </svg>
                            </button>
                            <span className="text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">
                                Step 2 of 2 — Environment
                            </span>
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white italic mt-1">
                            PICK YOUR
                            <span style={{ color: active.accent }} className="ml-3 transition-colors duration-500">
                                WORLD
                            </span>
                        </h2>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                            Each environment has unique obstacles and atmosphere
                        </p>
                    </div>

                    {/* Selected env summary badge */}
                    <div className="hidden md:flex flex-col items-end gap-2">
                        <div className="px-4 py-2 rounded-xl border transition-all duration-500"
                            style={{ borderColor: `rgba(${active.accentRgb},0.4)`, background: `rgba(${active.accentRgb},0.08)` }}>
                            <span className="text-2xl">{active.icon}</span>
                            <div className="text-[10px] font-black tracking-widest mt-1" style={{ color: active.accent }}>
                                {active.label}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Theme Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(GAME_THEMES).map(([key, theme]) => {
                        const meta = THEME_META[key];
                        const isSelected = selected === key;
                        const isHovered = hovered === key;

                        return (
                            <button
                                key={key}
                                onClick={() => handlePick(key)}
                                onMouseEnter={() => { setHovered(key); AudioManager.playBlip(440, 0.03); }}
                                onMouseLeave={() => setHovered(null)}
                                className="relative text-left rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer focus:outline-none"
                                style={{
                                    border: isSelected
                                        ? `1.5px solid rgba(${meta.accentRgb},0.7)`
                                        : '1.5px solid rgba(255,255,255,0.06)',
                                    background: isSelected
                                        ? `rgba(${meta.accentRgb},0.10)`
                                        : 'rgba(15,23,42,0.5)',
                                    transform: isSelected ? 'scale(1.03)' : isHovered ? 'scale(1.015)' : 'scale(1)',
                                    boxShadow: isSelected
                                        ? `0 0 32px rgba(${meta.accentRgb},0.18), inset 0 1px 0 rgba(255,255,255,0.06)`
                                        : '0 2px 12px rgba(0,0,0,0.3)',
                                }}>

                                {/* Gradient preview strip */}
                                <div className="w-full h-28 relative overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${theme.bgGradient[0]} 0%, ${theme.bgGradient[1]} 100%)` }}>
                                    {/* Pixel-art grid overlay */}
                                    <div className="absolute inset-0 opacity-10"
                                        style={{ backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,0.15) 0,rgba(255,255,255,0.15) 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,rgba(255,255,255,0.15) 0,rgba(255,255,255,0.15) 1px,transparent 1px,transparent 32px)' }} />
                                    {/* Big env icon */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-5xl opacity-60 drop-shadow-lg select-none">{meta.icon}</span>
                                    </div>
                                    {/* Color swatches bottom-right */}
                                    <div className="absolute bottom-3 right-3 flex gap-1.5">
                                        <div className="w-5 h-5 rounded-full border border-black/20 shadow-inner"
                                            style={{ background: `linear-gradient(to bottom, ${theme.bgGradient[0]}, ${theme.bgGradient[1]})` }} />
                                        <div className="w-5 h-5 rounded-full border border-black/20"
                                            style={{ backgroundColor: `rgb(${(theme.platformColor >> 16) & 0xFF},${(theme.platformColor >> 8) & 0xFF},${theme.platformColor & 0xFF})` }} />
                                        <div className="w-5 h-5 rounded-full border border-black/20"
                                            style={{ backgroundColor: `rgb(${(theme.obstacleBaseColor >> 16) & 0xFF},${(theme.obstacleBaseColor >> 8) & 0xFF},${theme.obstacleBaseColor & 0xFF})` }} />
                                    </div>
                                    {/* Selected checkmark */}
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                                            style={{ background: `rgba(${meta.accentRgb},1)` }}>
                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Card body */}
                                <div className="p-4 flex flex-col gap-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black tracking-[0.3em] uppercase transition-colors duration-300"
                                            style={{ color: isSelected ? meta.accent : '#64748b' }}>
                                            {meta.label}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight text-white italic">
                                        {theme.name.toUpperCase()}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold leading-snug uppercase">
                                        {theme.description}
                                    </p>
                                </div>

                                {/* Bottom accent line when selected */}
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-500"
                                    style={{ background: isSelected ? `rgba(${meta.accentRgb},1)` : 'transparent' }} />
                            </button>
                        );
                    })}
                </div>

                {/* Launch button */}
                <div className="flex items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{active.icon}</span>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Selected</span>
                            <span className="text-sm font-black text-white italic tracking-tight"
                                style={{ color: active.accent }}>
                                {GAME_THEMES[selected]?.name?.toUpperCase()} — {active.label}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handleLaunch}
                        disabled={launching}
                        className="px-10 py-4 rounded-2xl text-white font-black italic uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 relative overflow-hidden"
                        style={{
                            background: `linear-gradient(135deg, rgba(${active.accentRgb},0.9), rgba(${active.accentRgb},0.6))`,
                            boxShadow: `0 0 24px rgba(${active.accentRgb},0.3)`,
                            opacity: launching ? 0.7 : 1,
                        }}>
                        <span className="relative z-10">
                            {launching ? 'LAUNCHING...' : 'LAUNCH →'}
                        </span>
                        <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </div>
        </div>
    );
}
