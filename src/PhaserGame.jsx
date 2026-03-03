// src/PhaserGame.jsx
// React component that mounts and owns the Phaser.Game instance.
// Uses useRef/useEffect to create game on mount, destroy on unmount.

import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PhaserConfig from './phaser/config';

export default function PhaserGame({ onGameReady }) {
    const containerRef = useRef(null);
    const gameRef = useRef(null);

    useEffect(() => {
        if (gameRef.current) return;

        const config = {
            ...PhaserConfig,
            parent: containerRef.current,
        };

        gameRef.current = new Phaser.Game(config);

        // Expose a global flag for App.jsx to check if it missed the ready event
        window.phaserGameReady = true;

        if (onGameReady) onGameReady(gameRef.current);

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div
            ref={containerRef}
            id="phaser-container"
            className="w-full h-full"
            style={{ touchAction: 'none' }}
        />
    );
}
