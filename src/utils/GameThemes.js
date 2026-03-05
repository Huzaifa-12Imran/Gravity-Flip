// src/utils/GameThemes.js

export const GAME_THEMES = {
    default: {
        name: 'Default',
        bgGradient: ['#1e293b', '#0f172a'],
        platformColor: 0xfbbf24,
        obstacleBaseColor: 0xf97316,
        description: 'Classic slate aesthetic',
        bgTexture: null,
        floorTexture: 'floor-neon'
    },
    beach: {
        name: 'Beach',
        bgGradient: ['#0ea5e9', '#38bdf8'],
        platformColor: 0xfbbf24,
        obstacleBaseColor: 0xf97316,
        bgElement: 'beach-waves',
        description: 'Sandy beach with ocean waves',
        bgTexture: null,
        floorTexture: 'floor-sand'
    },
    italian: {
        name: 'Italian',
        bgGradient: ['#fde68a', '#d8b4fe'],
        platformColor: 0xd4af37,
        obstacleBaseColor: 0x8b4513,
        bgElement: 'italian-columns',
        description: 'Mediterranean villa aesthetic',
        bgTexture: null,
        floorTexture: 'floor-marble'
    },
    neon: {
        name: 'Neon',
        bgGradient: ['#020617', '#0a0e27'],
        platformColor: 0x00ff88,
        obstacleBaseColor: 0xff006e,
        bgElement: 'neon-grid',
        description: 'Cyberpunk neon city',
        bgTexture: null,
        floorTexture: 'floor-neon'
    },
    forest: {
        name: 'Forest',
        bgGradient: ['#064e3b', '#065f46'],
        platformColor: 0x52b788,
        obstacleBaseColor: 0xd62828,
        bgElement: 'forest-trees',
        description: 'Enchanted forest',
        bgTexture: null,
        floorTexture: 'floor-moss'
    },
};
