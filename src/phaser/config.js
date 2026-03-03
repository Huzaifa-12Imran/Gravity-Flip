// src/phaser/config.js
import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';

const PhaserConfig = {
    type: Phaser.AUTO,
    backgroundColor: '#0a000f',
    width: 960,
    height: 540,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false,
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, GameScene],
    // Canvas rendering for broadest compatibility
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
    },
};

export default PhaserConfig;
