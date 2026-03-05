import { useState, useEffect } from 'react';
import AudioManager from '../phaser/managers/AudioManager';
import EnvironmentSelector from './EnvironmentSelector';

export default function MainMenu({ onStart, onMultiplayer }) {
    const [highScore, setHighScore] = useState(0);
    // 'main' | 'env-solo'
    const [step, setStep] = useState('main');

    useEffect(() => {
        const stored = localStorage.getItem('gfzp-highscore');
        if (stored) setHighScore(parseInt(stored, 10));
    }, []);

    // Solo: after environment chosen, launch
    const handleEnvSelected = (theme) => {
        onStart({ theme });
    };

    if (step === 'env-solo') {
        return (
            <EnvironmentSelector
                onSelect={handleEnvSelected}
                onBack={() => setStep('main')}
            />
        );
    }

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 sm:p-12 overflow-y-auto">
            {/* Background cinematic glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative w-full max-w-[1000px] flex flex-col gap-8 fade-in-scale">

                {/* Brand Header */}
                <div className="flex flex-col items-start gap-4">
                    <div className="flex items-center gap-4">
                        <div className="px-4 py-1 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                            <span className="text-[10px] font-black text-slate-500 tracking-[0.4em] uppercase">
                                Build 04.22 // Protocol Secured
                            </span>
                        </div>
                    </div>

                    <div className="relative flex flex-col">
                        <h1 className="text-6xl sm:text-8xl md:text-[120px] font-black tracking-tighter leading-[0.85] text-white italic drop-shadow-2xl">
                            GRAVITY
                        </h1>
                        <h1 className="text-6xl sm:text-8xl md:text-[120px] font-black tracking-tighter leading-[0.85] text-indigo-500 italic mix-blend-screen opacity-90">
                            FLIP
                        </h1>
                    </div>
                </div>

                {/* Main Bento Layout */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">

                    {/* Solo Action — goes to env selector */}
                    <button
                        onClick={() => {
                            AudioManager.playBlip(550, 0.05);
                            setStep('env-solo');
                        }}
                        onMouseEnter={() => AudioManager.playBlip(440, 0.05)}
                        className="md:col-span-2 bento-card p-1 text-left premium-gradient group cursor-pointer"
                    >
                        <div className="w-full h-full bg-slate-950/20 group-hover:bg-transparent transition-colors p-6 md:p-8 rounded-[1.4rem] flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
                            <span className="text-[9px] md:text-[10px] font-black tracking-[0.3em] text-white/50 uppercase">
                                Neural Uplink
                            </span>
                            <div className="flex items-end justify-between">
                                <div className="flex flex-col">
                                    <h3 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">
                                        SOLO EMULATION
                                    </h3>
                                    <span className="text-[9px] text-white/40 font-bold uppercase mt-1 tracking-widest">
                                        Pick your world →
                                    </span>
                                </div>
                                <div className="w-10 h-10 rounded-full border-2 border-white/20 flex items-center justify-center group-hover:bg-white group-hover:border-white transition-all">
                                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white group-hover:fill-indigo-600">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </button>

                    {/* Multiplayer Action */}
                    <button
                        onClick={() => {
                            AudioManager.playStart();
                            onMultiplayer({});
                        }}
                        onMouseEnter={() => AudioManager.playBlip(660, 0.05)}
                        className="bento-card p-1 text-left bg-indigo-500/20 border border-indigo-500/30 group cursor-pointer hover:bg-indigo-500/40 transition-all"
                    >
                        <div className="w-full h-full p-6 flex flex-col justify-between min-h-[140px] md:min-h-[160px]">
                            <span className="text-[9px] font-black tracking-[0.3em] text-indigo-400 uppercase">
                                Networked Hub
                            </span>
                            <div className="flex flex-col">
                                <h3 className="text-2xl font-black text-white italic tracking-tighter">
                                    MULTIPLAYER
                                </h3>
                                <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">
                                    Sync nodes <br />with peers
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Personal Best Card */}
                    <div className="bento-card p-6 md:p-8 flex flex-col justify-between min-h-[120px] md:min-h-[160px]">
                        <span className="text-[9px] md:text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
                            Archived Data
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-600 uppercase mb-1">High Score</span>
                            <span className="text-3xl md:text-4xl font-black text-white tracking-tighter">
                                {highScore.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    {/* Status Quote Card */}
                    <div className="md:col-span-2 bento-card p-6 md:p-8 flex items-center justify-between bg-emerald-500/5 border-emerald-500/10">
                        <div className="flex flex-col">
                            <span className="text-[8px] md:text-[9px] font-black text-emerald-400 tracking-[0.3em] md:tracking-[0.4em] uppercase mb-1">
                                Operational Status
                            </span>
                            <p className="text-[9px] md:text-[11px] text-slate-400 font-bold uppercase tracking-widest italic">
                                "Neural link synchronized. Environment verification complete."
                            </p>
                        </div>
                        <div className="hidden md:flex items-center gap-1">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="w-1 h-4 bg-emerald-500/20 rounded-full" />
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
