import Phaser from 'phaser';
import SeededRandom from '../../utils/SeededRandom';
import EventBus from '../../eventBus';
import AudioManager from './AudioManager';

// Obstacle Manager with updated design: Slate walls, Amber warnings.
const SCROLL_SPEED_INITIAL = 260;
const SCROLL_SPEED_MAX = 520;
const SPEED_RAMP_AMOUNT = 12;
const SPEED_RAMP_INTERVAL = 10000;

const OBSTACLES = [
    { type: 'wall', texture: 'wall', w: 32, h: 80, score: 1 },
    { type: 'platform', texture: 'platform', w: 110, h: 24, score: 2, isPlatform: true },
];
// Minimum pixel gap between consecutive obstacle spawn X positions
const MIN_OBSTACLE_GAP = 320;

export default class ObstacleManager {
    constructor(scene, difficultyManager) {
        this.scene = scene;
        this.difficultyManager = difficultyManager;
        this.scrollSpeed = SCROLL_SPEED_INITIAL;
        this.active = false;
        this.pools = {};
        this.spawnTimer = null;
        this.speedTimer = null;
        this.spawnDelay = 1800;
        this.spawnDelayMin = 950;
        this._lastSpawnX = 9999; // track last spawned X to enforce gaps
        this.random = new SeededRandom(1); // Default seed

        // Phase 1: Dynamic Color Cycle
        this.colorCycle = [
            { name: 'orange', slate: 0xf97316, accent: 0xfb923c },      // Current orange
            { name: 'purple', slate: 0xa855f7, accent: 0xc084fc },       // Purple theme
            { name: 'cyan', slate: 0x06b6d4, accent: 0x22d3ee },         // Cyan theme
            { name: 'pink', slate: 0xec4899, accent: 0xf472b6 },         // Pink theme
            { name: 'lime', slate: 0x84cc16, accent: 0xa3e635 },         // Lime theme
            { name: 'red', slate: 0xef4444, accent: 0xf87171 },          // Red theme
            { name: 'indigo', slate: 0x6366f1, accent: 0x818cf8 },       // Indigo theme
        ];
        this.currentColorSetIndex = 0;
        this.colorChangeInterval = 35000; // 35 seconds
        this.timeSinceLastColorChange = 0;

        this._createPools();
    }

    setSeed(seed) {
        console.log('[ObstacleManager] Setting seed:', seed);
        this.random = new SeededRandom(seed);
    }

    _createPools() {
        OBSTACLES.forEach(({ type, texture }) => {
            this.pools[type] = this.scene.physics.add.group({
                defaultKey: texture,
                maxSize: 30,
                active: false,
                visible: false,
            });
        });
    }

    start() {
        if (this.active) return;
        this.active = true;
        this._scheduleSpawn();
        this._startSpeedRamp();
    }

    stop() {
        this.active = false;
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.speedTimer) this.speedTimer.remove();

        // Ensure all active obstacles stop moving instantly
        Object.values(this.pools).forEach(group => {
            group.getChildren().forEach(obj => {
                if (obj.active && obj.body) obj.body.setVelocityX(0);
            });
        });
    }

    _scheduleSpawn() {
        if (!this.active) return;

        let targetDelay = this.spawnDelay;
        if (this.difficultyManager) {
            targetDelay = this.difficultyManager.getSpawnRate(this.spawnDelay);
        }

        this.spawnTimer = this.scene.time.delayedCall(targetDelay, () => {
            try {
                this._spawnObstacle();
            } catch (e) {
                console.error('[ObstacleManager] Spawn failed:', e);
            }
            this.spawnDelay = Math.max(this.spawnDelayMin, this.spawnDelay - 8);
            this._scheduleSpawn();
        });
    }

    _startSpeedRamp() {
        this.speedTimer = this.scene.time.addEvent({
            delay: SPEED_RAMP_INTERVAL,
            repeat: -1,
            callback: () => {
                this.scrollSpeed = Math.min(SCROLL_SPEED_MAX, this.scrollSpeed + SPEED_RAMP_AMOUNT);
            },
        });
    }

    _spawnObstacle() {
        if (!this.active || this.scene._paused) return;

        // Loop Protection: Avoid rapid-fire spawns that freeze the browser
        const now = this.scene.time.now;
        if (this._lastSpawnTime && now - this._lastSpawnTime < 100) {
            console.warn('[ObstacleManager] Spawn loop detected! Blocking spawn.');
            return;
        }
        this._lastSpawnTime = now;

        // Gap enforcement: check closest active obstacle to spawn edge
        const GW_check = Math.max(960, this.scene.scale.width || 0);
        const spawnEdge = GW_check + 200;
        const activeObs = this.getActiveObstacles();
        for (let i = 0; i < activeObs.length; i++) {
            const ox = activeObs[i].x;
            if (ox > 0 && spawnEdge - ox < MIN_OBSTACLE_GAP) {
                // Too close to the last obstacle — skip this spawn cycle
                return;
            }
        }

        const GW = Math.max(960, this.scene.scale.width || 0);
        const GH = Math.max(540, this.scene.scale.height || 0);

        // Use SeededRandom instead of Math.random
        const def = { ...this.random.pick(OBSTACLES) };
        const themeKey = this.scene.currentTheme?.bgElement || 'default';

        // Apply theme-specific textures
        if (themeKey === 'beach-waves') {
            if (def.type === 'wall') {
                def.texture = this.random.pick(['beach-ball', 'jellyfish', 'surfboard']);
            }
        } else if (themeKey === 'italian-columns') {
            if (def.type === 'wall') {
                def.texture = this.random.pick(['column', 'amphora']);
            }
        } else if (themeKey === 'neon-grid') {
            if (def.type === 'wall') def.texture = 'neon-barrier';
        } else if (themeKey === 'forest-trees') {
            if (def.type === 'platform') def.texture = 'log';
            else if (def.type === 'wall') def.texture = 'rock';
        }

        let obj = this.pools[def.type].get();
        if (!obj) {
            console.warn(`[ObstacleManager] Pool [${def.type}] full! Recycling oldest.`);
            obj = this.pools[def.type].getFirstAlive();
            if (obj) {
                obj.setActive(false).setVisible(false);
            } else {
                return; // True failure
            }
            obj = this.pools[def.type].get();
        }
        if (!obj) return;

        console.log(`[ObstacleManager] Spawning [${def.type}] at GH-relative pos.`);

        obj.setActive(true).setVisible(true);
        obj.setTexture(def.texture);

        // Adjust size for specific textures
        if (def.texture === 'beach-ball' || def.texture === 'jellyfish') { def.w = 32; def.h = 32; }
        if (def.texture === 'amphora') { def.w = 32; def.h = 45; }
        if (def.texture === 'rock') { def.w = 40; def.h = 40; }
        if (def.texture === 'log') { def.h = 40; }

        if (def.isPlatform) {
            obj.isPlatform = true;
        } else {
            obj.isPlatform = false;
        }

        // Cap size modifier so walls never become unpassable
        const rawMod = this.difficultyManager ? this.difficultyManager.getObstacleSizeModifier() : 1.0;
        const sizeMod = def.isPlatform ? 1.0 : Math.min(rawMod, 1.2); // walls grow max 20%
        obj.setDisplaySize(def.w * sizeMod, def.h * sizeMod);
        obj.refreshBody();

        let y;
        const offset = GH * 0.01; // Scale offset slightly

        if (def.type === 'platform') {
            if (this.random.next() < 0.5) {
                y = this.random.between(GH * 0.22, GH * 0.38);
            } else {
                y = this.random.between(GH * 0.62, GH * 0.78);
            }
            // Laser: High-contrast Alert color (Accent)
            obj.setTint(this.getCurrentColor().accent);
            obj.setAlpha(0.9);
        } else {
            const floorY = GH * 0.88;
            const ceilingY = GH * 0.12;

            if (this.random.next() < 0.5) {
                // Bottom wall
                y = floorY + 26 - def.h / 2 - offset;
            } else {
                // Top wall
                y = ceilingY - 26 + def.h / 2 + offset;
            }
            // Wall: Solid Slate color (Slate)
            obj.setTint(this.getCurrentColor().slate);
            obj.setAlpha(1.0);
        }

        // SET POSITION OFF-SCREEN BUT CLOSER TO PREVENT LAG/CONFUSION
        obj.setPosition(GW + 200, y);
        obj.setActive(true).setVisible(true);
        if (obj.body) {
            obj.body.setEnable(true); // Ensure body is enabled for fresh spawn
            obj.body.setVelocityX(-this.scrollSpeed);
            obj.body.allowGravity = false;
        }
        obj.setDepth(5);
        obj.scoreValue = def.score;

        this.applyColorToObstacle(obj);

        // Apply theme-specific glow/effects
        if (themeKey === 'neon-grid') {
            obj.setAlpha(1.0);
        }
    }

    update(deltaTime) {
        if (!this.active) return;

        this.updateColorCycle(deltaTime);

        for (const group of Object.values(this.pools)) {
            const children = group.getChildren();
            for (let i = 0; i < children.length; i++) {
                const obj = children[i];
                if (!obj.active) continue;
                obj.body.setVelocityX(-this.scrollSpeed);
                if (obj.x < -250) {
                    obj.setActive(false).setVisible(false);
                    if (obj.body) {
                        obj.body.setVelocityX(0);
                        obj.body.setEnable(false);
                    }
                }
            }
        }
    }

    updateColorCycle(deltaTime) {
        this.timeSinceLastColorChange += deltaTime;
        if (this.timeSinceLastColorChange >= this.colorChangeInterval) {
            this.timeSinceLastColorChange = 0;
            this.changeObstacleColor();
        }
    }

    changeObstacleColor() {
        this.currentColorSetIndex = (this.currentColorSetIndex + 1) % this.colorCycle.length;
        const newColors = this.getCurrentColor();

        // Sound effect
        AudioManager.playBlip(880, 0.05); // High pitch blip for color shift

        this.broadcastColorChange(newColors);

        // Tween all active obstacles
        const activeObs = this.getActiveObstacles();
        for (let i = 0; i < activeObs.length; i++) {
            const obs = activeObs[i];
            const isPlatform = obs.texture.key === 'platform' || obs.texture.key === 'log';
            const targetColor = isPlatform ? newColors.accent : newColors.slate;

            this.scene.tweens.addCounter({
                from: 0,
                to: 100,
                duration: 300,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                        Phaser.Display.Color.ValueToColor(obs.tintTopLeft),
                        Phaser.Display.Color.ValueToColor(targetColor),
                        100,
                        value
                    );
                    obs.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                }
            });
        }
    }

    broadcastColorChange(colors) {
        EventBus.emit('obstacle-color-change', {
            name: colors.name,
            slate: colors.slate,
            accent: colors.accent
        });
    }

    applyColorToObstacle(obstacle) {
        const colors = this.getCurrentColor();
        const isPlatform = obstacle.texture.key === 'platform' || obstacle.texture.key === 'log';
        obstacle.setTint(isPlatform ? colors.accent : colors.slate);
    }
    // Optional chime sound? Scene can handle this via eventBus if needed


    getCurrentColor() {
        return this.colorCycle[this.currentColorSetIndex];
    }

    getActiveObstacles() {
        const all = [];
        for (const group of Object.values(this.pools)) {
            const children = group.getChildren();
            for (let i = 0; i < children.length; i++) {
                const obj = children[i];
                if (obj.active) all.push(obj);
            }
        }
        return all;
    }

    reset() {
        this.scrollSpeed = SCROLL_SPEED_INITIAL;
        this.spawnDelay = 1600;
        Object.values(this.pools).forEach(group => {
            group.getChildren().forEach(obj => {
                obj.setActive(false).setVisible(false);
                if (obj.body) {
                    obj.body.setVelocityX(0);
                    obj.body.setEnable(false);
                    // Force move off-screen to prevent frame-1 collisions on restart
                    obj.setPosition(-2000, -2000);
                }
            });
        });
    }

    getScrollSpeed() {
        if (this.difficultyManager) {
            return this.difficultyManager.getScrollSpeed(this.scrollSpeed);
        }
        return this.scrollSpeed;
    }
}
