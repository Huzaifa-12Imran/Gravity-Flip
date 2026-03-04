// src/components/SpectatorOverlay.jsx
// Premium overlay for players who are currently spectating others.

export default function SpectatorOverlay({ visible, score, distance }) {
    if (!visible) return null;

    return (
        <div className="absolute inset-x-0 top-32 z-40 flex flex-col items-center animate-fade-in pointer-events-none">
            <div className="glass-panel px-8 py-4 rounded-3xl border border-white/10 flex flex-col items-center gap-1 shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.5em] text-slate-400 uppercase">
                        UPLINK SEVERED
                    </span>
                </div>
                <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">
                    SPECTATING
                </h2>

                <div className="flex gap-6 mt-2 pt-2 border-t border-white/5">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Final Score</span>
                        <span className="text-sm font-bold text-indigo-400 font-mono">{score}</span>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Distance</span>
                        <span className="text-sm font-bold text-slate-300 font-mono">{distance}m</span>
                    </div>
                </div>

                <div className="mt-4 px-3 py-1 bg-white/5 rounded-full">
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse">
                        Waiting for all neural nodes to finish...
                    </p>
                </div>
            </div>
        </div>
    );
}
