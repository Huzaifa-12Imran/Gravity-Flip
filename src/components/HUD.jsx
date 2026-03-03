// src/components/HUD.jsx
// React HUD overlay: Score, Multiplier, Distance.
import { useEffect, useState, useRef } from 'react';
import EventBus from '../eventBus';

export default function HUD({ visible }) {
    const [score, setScore] = useState(0);
    const [multiplier, setMultiplier] = useState('1.0');
    const [distance, setDistance] = useState(0);
    const prevScore = useRef(0);
    const [scoreFlash, setScoreFlash] = useState(false);

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

        EventBus.on('score-update', handler);
        return () => EventBus.off('score-update', handler);
    }, []);

    if (!visible) return null;

    return (
        <div className="absolute top-0 left-0 right-0 z-30 p-4 md:p-8 pointer-events-none grid grid-cols-2 md:grid-cols-12 md:grid-rows-2 gap-3 md:gap-4 max-w-[1400px] mx-auto">

            {/* Bento Card: Session Vitality (Score) */}
            <div className="col-span-2 md:col-span-4 md:row-span-2 bento-card p-4 md:p-6 flex flex-col justify-between group">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.3em] text-slate-500 uppercase">
                        Neural Collection
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-600 uppercase mb-1">Accumulated Data</span>
                    <span className={`text-3xl md:text-5xl font-black tracking-tighter text-white transition-all duration-300 ${scoreFlash ? 'scale-105 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''
                        }`}>
                        {score.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Bento Card: Pause Control */}
            <div className="col-span-1 md:col-span-2 bento-card flex items-center justify-center p-3 group pointer-events-auto cursor-pointer active:scale-95"
                onClick={() => EventBus.emit('pause-game')}>
                <div className="flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                        <div className="w-1 h-3 bg-white rounded-full" />
                        <div className="w-1 h-3 bg-white rounded-full" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest text-white uppercase">Pause</span>
                </div>
            </div>

            {/* Bento Card: Operational Status (Desktop only or combined on mobile) */}
            <div className="hidden md:flex col-span-2 bento-card items-center justify-center">
                <div className="flex flex-col items-center">
                    <span className="text-[8px] font-black text-indigo-400 tracking-widest uppercase">Status</span>
                    <span className="text-[10px] font-black text-white tracking-widest uppercase">Active</span>
                </div>
            </div>

            {/* Bento Card: Momentum Multiplier */}
            <div className="col-span-1 md:col-span-4 bento-card px-4 md:px-6 flex items-center justify-between group overflow-hidden">
                <div className="flex flex-col">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Momentum</span>
                    <span className="text-xl md:text-2xl font-black text-indigo-400 italic">x{multiplier}</span>
                </div>
                {/* Visual Momentum Bar (Hidden on tiny screens) */}
                <div className="hidden sm:flex gap-1">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className={`w-1 h-4 md:h-6 rounded-full transition-all duration-300 ${parseFloat(multiplier) > (i * 2) ? 'bg-indigo-500 opacity-100' : 'bg-white/5 opacity-40'
                            }`} />
                    ))}
                </div>
            </div>

            {/* Bento Card: Traversal Distance */}
            <div className="col-span-1 md:col-span-4 bento-card px-4 md:px-6 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Traversal</span>
                    <span className="text-xl md:text-2xl font-black text-white tracking-tighter">
                        {distance.toLocaleString()}<span className="text-xs text-slate-500 ml-1 italic">m</span>
                    </span>
                </div>
                <div className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 border border-white/5 items-center justify-center">
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-indigo-500/30 rounded-full border-t-indigo-500 animate-spin" />
                </div>
            </div>

            {/* Bento Card: Session Type (Footer on Mobile, Sidebar on Desktop) */}
            <div className="col-span-1 md:col-span-4 bento-card px-4 md:px-6 flex items-center gap-3 md:gap-4 bg-indigo-500/5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[8px] md:text-[9px] font-black text-slate-300 tracking-[0.3em] md:tracking-[0.5em] uppercase italic">
                    Simulation Active
                </span>
            </div>
        </div>
    );
}
