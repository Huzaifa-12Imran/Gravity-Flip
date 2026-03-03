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
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-8 py-4 pointer-events-none">
            {/* Left: Score Box */}
            <div className="glass-panel px-6 py-3 rounded-2xl border border-white/5 flex flex-col items-start gap-1">
                <span className="text-[9px] font-black tracking-[0.3em] text-slate-500 uppercase">
                    Data Collection
                </span>
                <span
                    className={`text-2xl font-black tracking-tight text-white transition-all duration-100 ${scoreFlash ? 'scale-105 text-indigo-400' : ''
                        }`}
                >
                    {score.toString().padStart(6, '0')}
                </span>
            </div>

            {/* Center: Status / Pause Control */}
            <div className="flex flex-col items-center gap-3">
                <div className="glass-panel px-6 py-2 rounded-full border border-white/10">
                    <span className="text-[10px] font-extrabold text-slate-300 tracking-[0.4em] uppercase">
                        Active Session
                    </span>
                </div>

                {/* Interactive Pause Trigger */}
                <button
                    onClick={() => EventBus.emit('pause-game')}
                    className="pointer-events-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all active:scale-90 group"
                >
                    <div className="flex gap-1">
                        <div className="w-1 h-3 bg-indigo-400 rounded-full group-hover:bg-indigo-300" />
                        <div className="w-1 h-3 bg-indigo-400 rounded-full group-hover:bg-indigo-300" />
                    </div>
                    <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase group-hover:text-slate-200">
                        Pause
                    </span>
                </button>
            </div>

            {/* Right: Stats Group */}
            <div className="flex items-center gap-4">
                <div className="glass-panel px-5 py-3 rounded-2xl border border-white/5 flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black tracking-[0.3em] text-slate-500 uppercase">
                        Multiplier
                    </span>
                    <span className="text-xl font-black text-indigo-400">
                        x{multiplier}
                    </span>
                </div>
                <div className="glass-panel px-5 py-3 rounded-2xl border border-white/5 flex flex-col items-end gap-1">
                    <span className="text-[9px] font-black tracking-[0.3em] text-slate-500 uppercase">
                        Distance
                    </span>
                    <span className="text-xl font-black text-white">
                        {distance.toString().padStart(5, '0')}m
                    </span>
                </div>
            </div>
        </div>
    );
}
