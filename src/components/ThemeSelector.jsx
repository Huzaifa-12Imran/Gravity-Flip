// src/components/ThemeSelector.jsx
import React, { useState, useEffect } from 'react';
import { GAME_THEMES } from '../utils/GameThemes';
import AudioManager from '../phaser/managers/AudioManager';

export default function ThemeSelector({ onSelect, currentThemeKey }) {
    const [selected, setSelected] = useState(currentThemeKey || 'default');

    useEffect(() => {
        const saved = localStorage.getItem('gfzp-selected-theme');
        if (saved && GAME_THEMES[saved]) {
            setSelected(saved);
        }
    }, []);

    const handleSelect = (key) => {
        setSelected(key);
        localStorage.setItem('gfzp-selected-theme', key);
        AudioManager.playBlip(550, 0.05);
        if (onSelect) onSelect(key);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 fade-in">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
                    Environment Selection
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(GAME_THEMES).map(([key, theme]) => (
                    <div
                        key={key}
                        onClick={() => handleSelect(key)}
                        className={`bento-card p-4 cursor-pointer transition-all duration-300 border ${selected === key
                                ? 'bg-indigo-500/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                : 'bg-slate-400/5 border-white/5 hover:border-white/10'
                            }`}
                    >
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <h4 className={`text-lg font-black tracking-tight italic ${selected === key ? 'text-white' : 'text-slate-400'}`}>
                                    {theme.name.toUpperCase()}
                                </h4>
                                {selected === key && (
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                )}
                            </div>

                            <p className="text-[10px] text-slate-500 font-bold uppercase leading-tight h-8">
                                {theme.description}
                            </p>

                            <div className="flex gap-2 mt-2">
                                <div
                                    className="w-8 h-8 rounded-full border border-white/10 shadow-inner"
                                    style={{ background: `linear-gradient(to bottom, ${theme.bgGradient[0]}, ${theme.bgGradient[1]})` }}
                                />
                                <div
                                    className="w-8 h-8 rounded-full border border-white/10"
                                    style={{ backgroundColor: `rgb(${(theme.platformColor >> 16) & 0xFF}, ${(theme.platformColor >> 8) & 0xFF}, ${theme.platformColor & 0xFF})` }}
                                />
                                <div
                                    className="w-8 h-8 rounded-full border border-white/10"
                                    style={{ backgroundColor: `rgb(${(theme.obstacleBaseColor >> 16) & 0xFF}, ${(theme.obstacleBaseColor >> 8) & 0xFF}, ${theme.obstacleBaseColor & 0xFF})` }}
                                />
                            </div>

                            <button
                                className={`mt-2 py-2 px-4 rounded-lg text-[9px] font-black tracking-widest uppercase transition-all ${selected === key
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {selected === key ? 'Active Environment' : 'Select Entry Point'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
