// src/PhaserGame.jsx
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import PhaserConfig from './phaser/config';
import EventBus from './eventBus';

export default function PhaserGame({ sceneData }) {
    const containerRef = useRef(null);
    const gameRef = useRef(null);

    // Watch for sceneData changes (e.g. when restarting or starting multiplayer)
    useEffect(() => {
        if (gameRef.current && sceneData) {
            console.log('[PhaserGame] sceneData updated:', sceneData);
            // We can pass data to the current scene or store it in the registry
            gameRef.current.registry.set('sceneData', sceneData);
        }
    }, [sceneData]);

    useEffect(() => {
        if (gameRef.current) return;

        const config = {
            ...PhaserConfig,
            parent: containerRef.current,
        };

        gameRef.current = new Phaser.Game(config);

        // Store initial sceneData if present
        if (sceneData) {
            gameRef.current.registry.set('sceneData', sceneData);
        }

        window.phaserGameReady = true;
        EventBus.emit('scene-ready');

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true);
                gameRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={containerRef}
            id="phaser-container"
            className="w-full h-full"
            style={{ touchAction: 'none' }}
        />
    );
}
