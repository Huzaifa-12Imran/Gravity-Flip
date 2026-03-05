// src/phaser/managers/DifficultyManager.js
import EventBus from '../../eventBus';

export default class DifficultyManager {
    constructor(scene, themeKey = 'default') {
        this.scene = scene;
        this.themeKey = themeKey;
        this.baseDifficulty = 1.0;
        this.currentLevel = 'EASY';
        this.lastMilestone = 0;

        // Theme modifiers
        this.modifiers = {
            default: { speed: 1.0, spawn: 1.0, gap: 1.0 },
            beach: { speed: 0.85, spawn: 0.8, gap: 1.2 }, // Easier
            italian: { speed: 1.0, spawn: 1.0, gap: 1.0 },
            neon: { speed: 1.15, spawn: 1.2, gap: 0.85 }, // Harder
            forest: { speed: 1.05, spawn: 1.1, gap: 0.9 }
        };

        this.currentModifier = this.modifiers[themeKey] || this.modifiers.default;
    }

    calculateDifficulty(distance) {
        // Every 800 units, increase level (was 500 - more breathing room)
        const level = Math.floor(distance / 800);
        if (level > this.lastMilestone) {
            this.lastMilestone = level;
            this.updateDifficultyLevel(level);
        }

        // Gentler linear scaling (was /5000)
        this.baseDifficulty = 1.0 + (distance / 10000);
        return this.baseDifficulty * this.currentModifier.speed;
    }

    updateDifficultyLevel(level) {
        if (level < 2) this.currentLevel = 'EASY';
        else if (level < 5) this.currentLevel = 'MEDIUM';
        else if (level < 10) this.currentLevel = 'HARD';
        else this.currentLevel = 'EXTREME';

        EventBus.emit('difficulty-change', {
            level: this.currentLevel,
            multiplier: this.baseDifficulty.toFixed(2)
        });
    }

    getScrollSpeed(baseSpeed) {
        return baseSpeed * this.baseDifficulty * this.currentModifier.speed;
    }

    getSpawnRate(baseRate) {
        // Higher multiplier means shorter delay (faster spawn)
        return baseRate / (this.baseDifficulty * this.currentModifier.spawn);
    }

    getObstacleSizeModifier() {
        // Cap at 1.2x - walls must remain passable
        return 1.0 + Math.min(this.baseDifficulty - 1, 0.2);
    }
}
