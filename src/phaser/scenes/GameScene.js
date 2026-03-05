// src/phaser/scenes/GameScene.js
import Phaser from 'phaser';
import EventBus from '../../eventBus';
import Stickman from '../entities/Stickman';
import ObstacleManager from '../managers/ObstacleManager';
import AudioManager from '../managers/AudioManager';
import NetworkManager from '../managers/NetworkManager';
import DifficultyManager from '../managers/DifficultyManager';
import { GAME_THEMES } from '../../utils/GameThemes';

const STICKMAN_X = 180;
const FLOOR_Y = 480;
const CEILING_Y = 60;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.currentTheme = GAME_THEMES.default;
    }

    create(data) {
        try {
            console.log('[GameScene] Creating with data:', data);

            // Core State Reset
            this.isMultiplayer = !!data?.multiplayer;
            this.gravityFlipped = false;
            this._wasOnPlatform = false;
            this.isGameOver = false;
            this.deathSequenceStarted = false;
            this._paused = false;
            this.gameStarted = false;
            this._visualTime = 0;
            this._sceneryOffset = 0;
            this._cityOffset = 0;
            this._gridOffset = 0;
            this.currentObstacleColors = null;
            this.themeEmitters = [];

            // Optimization: Shared geometric buffers to avoid GC pressure
            this._sbRect = new Phaser.Geom.Rectangle();
            this._obsRect = new Phaser.Geom.Rectangle();

            // Manual cleanup of old state for peace of mind
            this.events.off('shutdown');
            this.events.once('shutdown', this.shutdown, this);

            this.score = 0;
            this.multiplier = 1.0;
            this.distance = 0;

            const W = Math.max(960, this.scale.width || 0);
            const GH = Math.max(540, this.scale.height || 0);

            const themeKey = (data?.theme || 'default').toLowerCase();
            this.currentTheme = GAME_THEMES[themeKey] || GAME_THEMES.default;
            console.log('[GameScene] Theme set to:', themeKey);

            // Background fallbacks
            this.cameras.main.setBackgroundColor(this.currentTheme.bgGradient[0]);
            this.cityFar1 = this.add.image(0, 0, 'city').setOrigin(0, 0).setDepth(0).setAlpha(0.12).setTint(this.currentTheme.platformColor);
            this.cityFar2 = this.add.image(W, 0, 'city').setOrigin(0, 0).setDepth(0).setAlpha(0.12).setTint(this.currentTheme.platformColor);
            this.grid1 = this.add.image(0, 0, 'grid').setOrigin(0, 0).setDepth(1).setAlpha(0.08).setTint(this.currentTheme.platformColor);
            this.grid2 = this.add.image(W, 0, 'grid').setOrigin(0, 0).setDepth(1).setAlpha(0.08).setTint(this.currentTheme.platformColor);
            this._gridOffset = 0;
            this._cityOffset = 0;

            // DYNAMIC COORDINATES
            this.floorY = GH * 0.88;
            this.ceilingY = GH * 0.12;
            console.log(`[GameScene] Layout: Floor@${this.floorY}, Ceiling@${this.ceilingY}`);
            this.parallaxLayers = [];

            this.themeAssets = this.add.group();

            try {
                this._initThemeElements();
            } catch (e) {
                console.warn('[GameScene] _initThemeElements failed:', e);
            }

            try {
                this._createParallaxSilhouettes(themeKey);
            } catch (e) {
                console.warn('[GameScene] _createParallaxSilhouettes failed:', e);
            }

            // Stickman Metadata
            const localMeta = data.playerConfig || { name: 'You', color: '#6366f1' };
            this.stickman = new Stickman(this, STICKMAN_X, this.floorY, false, localMeta);

            this.difficultyManager = new DifficultyManager(this, themeKey);
            this.obstacleManager = new ObstacleManager(this, this.difficultyManager);

            this.remotePlayers = new Map();
            if (data.multiplayer) {
                this.obstacleManager.setSeed(data.seed || 1);
                const players = data.players || [];
                const myId = NetworkManager.player?.id;
                players.filter(p => p.id !== myId).forEach(p => this._addRemotePlayer(p));
            }

            this._drawLanes();
            this._initParticles();

            // Input handlers
            this._flipHandler = () => this._onFlip();
            this.input.keyboard.on('keydown-SPACE', this._flipHandler);
            this.input.keyboard.on('keydown-ESC', () => {
                console.log('[GameScene] ESC detected. Current _paused:', this._paused);
                if (this._paused) EventBus.emit('resume-game');
                else EventBus.emit('pause-game');
            });
            this.input.on('pointerdown', this._flipHandler);

            // Listeners
            this._localColorHandler = (hex) => {
                if (this.stickman) this.stickman.setColor(hex);
            };
            this._obstacleColorHandler = ({ slate, accent }) => {
                this.currentObstacleColors = { slate, accent };
                // Update theme elements that should react to obstacle color changes
                if (this.currentTheme.bgElement === 'neon-grid' && this.neonGrid) {
                    this.neonGrid.lineStyle(2, accent, 0.4);
                }
            };
            this._gameRestartHandler = (newData) => this.scene.restart(newData);
            this._pauseHandler = () => {
                if (data.multiplayer) return; // No pausing in MP
                if (!this.isSceneActive || this.isGameOver) return;
                this._paused = true;
                if (this.physics && this.physics.world) this.physics.pause();
                if (this.tweens) this.tweens.pauseAll();
                this.children.list.forEach(c => { if (c.type === 'ParticleEmitter') c.pause(); });
                AudioManager.pauseMusic();
            };
            this._resumeHandler = () => {
                if (data.multiplayer) return;
                if (!this.isSceneActive || this.isGameOver) return;
                this._paused = false;
                if (this.physics && this.physics.world) this.physics.resume();
                if (this.tweens) this.tweens.resumeAll();
                this.children.list.forEach(c => { if (c.type === 'ParticleEmitter') c.resume(); });
                AudioManager.resumeMusic();
            };
            this._quitHandler = () => this.scene.restart({ autoStart: false });

            if (data.multiplayer) {
                this._remoteUpdateHandler = d => this._onRemoteUpdate(d);
                this._remoteDeathHandler = d => this._onRemoteDeath(d);
                this._remoteColorHandler = ({ playerId, color }) => {
                    const r = this.remotePlayers.get(playerId);
                    if (r) r.setColor(color);
                };
                EventBus.off('remote-player-update').on('remote-player-update', this._remoteUpdateHandler);
                EventBus.off('remote-player-died').on('remote-player-died', this._remoteDeathHandler);
                EventBus.off('remote-player-color').on('remote-player-color', this._remoteColorHandler);
            }

            EventBus.off('color-change', this._localColorHandler).on('color-change', this._localColorHandler);
            EventBus.off('obstacle-color-change', this._obstacleColorHandler).on('obstacle-color-change', this._obstacleColorHandler);
            EventBus.off('game-restart', this._gameRestartHandler).on('game-restart', this._gameRestartHandler);
            EventBus.off('pause-game', this._pauseHandler).on('pause-game', this._pauseHandler);
            EventBus.off('resume-game', this._resumeHandler).on('resume-game', this._resumeHandler);
            EventBus.off('quit-game', this._quitHandler).on('quit-game', this._quitHandler);

            const autoStart = !!data?.autoStart;
            if (autoStart) this._startCountdown();

            this.scoreTicker = this.time.addEvent({ delay: 50, repeat: -1, callback: this._tickScore, callbackScope: this });
            this.isSceneActive = true;
            EventBus.emit('scene-ready', this);

        } catch (err) {
            console.error('[GameScene] Create fail:', err);
        }
    }

    _initThemeElements() {
        try {
            if (!this.currentTheme) return;
            const W = this.scale.width;
            const GH = this.scale.height;

            this.globalGlow = this.add.graphics().setDepth(0.01).setAlpha(0.4);
            this.themeAssets.add(this.globalGlow);

            const elem = this.currentTheme.bgElement;
            if (elem === 'beach-waves') {
                this.waves = [];
                for (let i = 0; i < 2; i++) {
                    const wave = this.add.graphics().setDepth(0.05 + i * 0.01).setAlpha(0.2);
                    wave.fillStyle(0x0e7490, 0.8).beginPath().moveTo(0, GH * 0.45);
                    for (let x = 0; x <= W * 2; x += 40) wave.lineTo(x, GH * 0.45 + Math.sin(x * 0.01) * 15);
                    wave.lineTo(W * 2, GH).lineTo(0, GH).fillPath();
                    this.waves.push({ g: wave, speed: 0.2 + i * 0.1 });
                    this.themeAssets.add(wave);
                }
                this.palms = this.add.graphics().setDepth(0.08).setAlpha(0.6);
                this.palms.g2 = this.add.graphics().setDepth(0.08).setAlpha(0.6);
                this._drawThemeShapes(this.palms, 'beach', 1.0);
                this._drawThemeShapes(this.palms.g2, 'beach', 1.0);
                this.themeAssets.add(this.palms);
                this.themeAssets.add(this.palms.g2);
                this._addThemeEmitter(W, GH, 0.7, 0.9, 2000, 150, 0xffffff);
            } else if (elem === 'italian-columns') {
                this.rays = this.add.graphics().setDepth(0.02).fillStyle(0xffffff, 0.1);
                for (let i = 0; i < 5; i++) {
                    const x = W * (0.2 + i * 0.15);
                    this.rays.beginPath().moveTo(x, -50).lineTo(x + 100, -50).lineTo(x - 200, GH + 50).lineTo(x - 300, GH + 50).fillPath();
                }
                this.themeAssets.add(this.rays);
                this.columns = this.add.graphics().setDepth(0.06).setAlpha(0.5);
                this.columns.g2 = this.add.graphics().setDepth(0.06).setAlpha(0.5);
                this._drawThemeShapes(this.columns, 'italian', 1.0);
                this._drawThemeShapes(this.columns.g2, 'italian', 1.0);
                this.themeAssets.add(this.columns); this.themeAssets.add(this.columns.g2);
                this._addThemeEmitter(W, GH, -0.1, -0.1, 8000, 300, 0xfbbf24);
            } else if (elem === 'neon-grid') {
                this.neonGrid = this.add.graphics().setDepth(0.05).lineStyle(2, 0x22d3ee, 0.2);
                for (let i = -10; i <= 20; i++) this.neonGrid.lineBetween(W / 2 + (i * 100), GH * 0.4, (W / 2 + i * 100) * 1.5 - W * 0.25, GH);
                this.themeAssets.add(this.neonGrid);
                this.spires = this.add.graphics().setDepth(0.04).setAlpha(0.4);
                this.spires.g2 = this.add.graphics().setDepth(0.04).setAlpha(0.4);
                this._drawThemeShapes(this.spires, 'neon', 1.0);
                this._drawThemeShapes(this.spires.g2, 'neon', 1.0);
                this.themeAssets.add(this.spires); this.themeAssets.add(this.spires.g2);
                this._addThemeEmitter(W, GH, 0, 1.0, 2000, 100, 0x22d3ee);
            } else if (elem === 'forest-trees') {
                this.canopy = this.add.graphics().setDepth(0.02).setAlpha(0.15).fillStyle(0x064e3b, 1.0);
                for (let i = 0; i < 6; i++) { this.canopy.fillCircle(W * (i * 0.3), -50, 200); this.canopy.fillCircle(W * (i * 0.3) + 200, -20, 150); }
                this.themeAssets.add(this.canopy);
                this.trees = this.add.graphics().setDepth(0.03).setAlpha(0.4);
                this.trees.g2 = this.add.graphics().setDepth(0.03).setAlpha(0.4);
                this._drawThemeShapes(this.trees, 'forest', 1.0);
                this._drawThemeShapes(this.trees.g2, 'forest', 1.0);
                this.themeAssets.add(this.trees); this.themeAssets.add(this.trees.g2);
                this._addThemeEmitter(W, GH, 0, 1.0, 5000, 150, 0x34d399);
            } else {
                // Default theme enhanced: Stronger glow and grid visibility
                if (this.grid1) this.grid1.setAlpha(0.12).setTint(0x6366f1);
                if (this.cityFar1) this.cityFar1.setAlpha(0.15).setTint(0x4338ca);
                this._addThemeEmitter(W, GH, 0.4, 0.6, 5000, 200, 0x6366f1);
            }
        } catch (e) {
            console.error('[GameScene] _initThemeElements fail:', e);
        }
    }

    _addThemeEmitter(W, GH, yMin, yMax, lifespan, freq, tint) {
        const p = this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: W }, y: { min: GH * yMin, max: GH * yMax },
            scale: { min: 0.1, max: 0.4 }, alpha: { start: 0.4, end: 0 },
            speedY: { min: -20, max: -40 }, lifespan: lifespan, frequency: freq, tint: tint
        }).setDepth(1.2);
        this.themeAssets.add(p);
        this.themeEmitters.push(p);
    }

    _createParallaxSilhouettes(themeKey) {
        if (themeKey === 'default') return;
        const W = Math.max(960, this.scale.width || 0);
        const g1a = this.add.graphics().setDepth(0.01).setAlpha(0.12);
        const g1b = this.add.graphics().setDepth(0.01).setAlpha(0.12);
        this.themeAssets.add(g1a); this.themeAssets.add(g1b);
        this._drawThemeShapes(g1a, themeKey, 0.4);
        this._drawThemeShapes(g1b, themeKey, 0.4);
        this.parallaxLayers.push({ g1: g1a, g2: g1b, x: 0, speed: 0.04, width: W });

        const g2a = this.add.graphics().setDepth(0.03).setAlpha(0.2);
        const g2b = this.add.graphics().setDepth(0.03).setAlpha(0.2);
        this.themeAssets.add(g2a); this.themeAssets.add(g2b);
        this._drawThemeShapes(g2a, themeKey, 0.7);
        this._drawThemeShapes(g2b, themeKey, 0.7);
        this.parallaxLayers.push({ g1: g2a, g2: g2b, x: 0, speed: 0.12, width: W });
    }

    _drawThemeShapes(graphics, themeKey, scale = 1.0) {
        if (!graphics) return;
        const W = Math.max(960, this.scale.width || 0);
        const GH = Math.max(540, this.scale.height || 0);
        const s = Math.max(0.01, scale);
        graphics.clear();
        graphics.fillStyle(0x000000, 1);

        if (themeKey === 'beach') {
            for (let i = 0; i < 5; i++) {
                const x = (i * 500 + 100) * s;
                // High-End Tapered Palm Trunk (Vector)
                graphics.beginPath();
                graphics.moveTo(x - 20 * s, GH);
                graphics.quadraticCurveTo(x + 50 * s, GH * 0.7, x + 30 * s, GH * 0.4);
                graphics.lineTo(x + 10 * s, GH * 0.4);
                graphics.quadraticCurveTo(x + 30 * s, GH * 0.7, x - 10 * s, GH);
                graphics.closePath();
                graphics.fillPath();
                // Fronds: Using arcs/circles as fillEllipse rotate is not standard in Graphics
                for (let j = 0; j < 6; j++) {
                    const angle = (j * 60) * Math.PI / 180;
                    const fx = x + 20 * s + Math.cos(angle) * 30 * s;
                    const fy = GH * 0.4 + Math.sin(angle) * 30 * s;
                    graphics.fillCircle(fx, fy, 25 * s);
                }
            }
        } else if (themeKey === 'italian') {
            for (let i = 0; i < 4; i++) {
                const x = (i * 600 + 200) * s;
                // Fluted Columns (Vector)
                graphics.fillRect(x - 30 * s, GH * 0.2, 60 * s, GH); // Shaft
                graphics.fillRect(x - 45 * s, GH * 0.2 - 20 * s, 90 * s, 20 * s); // Capital
                graphics.fillRect(x - 45 * s, GH - 20 * s, 90 * s, 20 * s); // Base
            }
        } else if (themeKey === 'neon') {
            for (let i = 0; i < 8; i++) {
                const x = (i * 300) * s;
                const h = (200 + Math.random() * 300) * s;
                graphics.beginPath();
                graphics.moveTo(x, GH);
                graphics.lineTo(x + 20 * s, GH - h);
                graphics.lineTo(x + 40 * s, GH);
                graphics.closePath();
                graphics.fillPath();
                graphics.fillStyle(0x22d3ee, 1);
                graphics.fillCircle(x + 20 * s, GH - h, 4 * s);
                graphics.fillStyle(0x000000, 1);
            }
        } else if (themeKey === 'forest') {
            for (let i = 0; i < 6; i++) {
                const x = (i * 450 + 150) * s;
                // Gnarled Tree Silhouette
                graphics.beginPath();
                graphics.moveTo(x - 40 * s, GH);
                graphics.quadraticCurveTo(x - 20 * s, GH * 0.6, x + 10 * s, GH * 0.3);
                graphics.lineTo(x + 30 * s, GH * 0.3);
                graphics.quadraticCurveTo(x, GH * 0.6, x + 60 * s, GH);
                graphics.closePath();
                graphics.fillPath();
            }
        }
    }

    _tickScore() {
        if (!this.gameStarted || this.isGameOver || this.deathSequenceStarted || this._paused) return;
        this.score += Math.round(this.multiplier || 0);
        const deltaDist = (this.obstacleManager.getScrollSpeed() / 1200);
        if (!isNaN(deltaDist)) {
            this.distance += parseFloat(deltaDist.toFixed(2));
        }
        EventBus.emit('score-update', {
            score: Math.floor(this.score),
            multiplier: this.multiplier.toFixed(1),
            distance: Math.floor(this.distance),
        });
    }

    _checkCollisions() {
        if (this.isGameOver || this.deathSequenceStarted) return;
        const sb = this.stickman.body;
        const sbBounds = sb.getBounds();
        const obstacles = this.obstacleManager.getActiveObstacles();

        let onPlatform = false;
        let platformY = null;

        const padX = 4;
        const padY = -2;
        this._sbRect.setTo(sbBounds.x + padX, sbBounds.y + padY, sbBounds.width - padX * 2, sbBounds.height - padY * 2);

        for (let i = 0; i < obstacles.length; i++) {
            const obs = obstacles[i];
            const bounds = obs.getBounds();
            const isPlatform = !!obs.isPlatform;

            this._obsRect.setTo(bounds.x, bounds.y, bounds.width, bounds.height);

            if (Phaser.Geom.Intersects.RectangleToRectangle(this._sbRect, this._obsRect)) {
                if (isPlatform) {
                    onPlatform = true;
                    platformY = this.gravityFlipped ? bounds.bottom + 30 : bounds.top - 30;
                    if (this.flipTween && this.flipTween.isPlaying()) {
                        this.flipTween.stop();
                        this.flipTween = null;
                    }
                } else {
                    this._triggerDeath();
                    return;
                }
            }
        }

        if (onPlatform && !this.isGameOver) {
            sb.y = platformY;
            this._wasOnPlatform = true;
        } else if (this._wasOnPlatform && !this.isGameOver && !this.flipTween) {
            this._wasOnPlatform = false;
            this._onFlip(true);
        }
    }

    _triggerDeath() {
        if (this.isGameOver || this.deathSequenceStarted) return;
        this.deathSequenceStarted = true;
        this.isGameOver = true;

        AudioManager.playShatter();
        AudioManager.stopMusic();

        this.input.keyboard.off('keydown-SPACE', this._flipHandler);
        this.input.off('pointerdown', this._flipHandler);
        if (!this.isMultiplayer) this.obstacleManager.stop();
        if (this.scoreTicker) { this.scoreTicker.remove(); this.scoreTicker = null; }

        const finalScore = Math.floor(this.score);
        const finalDistance = Math.floor(this.distance);

        this.stickman.shatter();
        this.cameras.main.flash(300, 255, 255, 255, 0.2);
        this.cameras.main.shake(150, 0.005);

        if (this.isMultiplayer) {
            NetworkManager.sendDeath(finalScore, finalDistance);
            EventBus.emit('local-death', { score: finalScore, distance: finalDistance });
        } else {
            this.time.delayedCall(400, () => {
                EventBus.emit('game-over', { score: finalScore, distance: finalDistance, isMultiplayer: this.isMultiplayer });
            });
        }
    }

    update(time, delta) {
        try {
            if (this._paused) return;
            if (this.gameStarted) {
                const W = Math.max(960, this.scale.width || 0);
                const GH = Math.max(540, this.scale.height || 0);
                this.difficultyManager.calculateDifficulty(this.distance);
                const speed = this.obstacleManager.getScrollSpeed();

                // Advanced Global Layout Animation
                this._visualTime = (this._visualTime || 0) + delta * 0.001;

                // Parallax Logic
                if (this.parallaxLayers) {
                    for (let i = 0; i < this.parallaxLayers.length; i++) {
                        const layer = this.parallaxLayers[i];
                        const layerScrollSpeed = speed * layer.speed * (delta / 1000);
                        layer.x -= layerScrollSpeed;
                        if (layer.x <= -layer.width) layer.x += layer.width;
                        layer.g1.x = layer.x;
                        layer.g2.x = layer.x + layer.width;
                    }
                }

                // Global Glow Layer
                if (this.globalGlow) {
                    this.globalGlow.clear();
                    const color = (this.currentObstacleColors && this.currentObstacleColors.accent) || this.currentTheme.platformColor;
                    this.globalGlow.fillStyle(color, 0.25);
                    const safeW = Math.max(1, W);
                    const safeGH = Math.max(1, GH);
                    this.globalGlow.fillCircle(safeW * 0.8, safeGH * 0.2, 200 + Math.sin(this._visualTime) * 50);
                    this.globalGlow.fillCircle(safeW * 0.2, safeGH * 0.8, 150 + Math.cos(this._visualTime) * 30);
                }

                // High-Fidelity Procedural Animation
                const scenerySeed = speed * 0.5 * (delta / 1000);
                this._sceneryOffset = (this._sceneryOffset || 0) + scenerySeed;

                // 1. BEACH: Palms & Waves
                if (this.currentTheme.bgElement === 'beach-waves') {
                    const safeOffset = (this._sceneryOffset || 0);
                    if (this.palms) {
                        const safeW = Math.max(960, W);
                        this.palms.x = -(safeOffset % safeW);
                        if (this.palms.g2) this.palms.g2.x = this.palms.x + safeW;
                    }
                    if (this.waves) {
                        for (let i = 0; i < this.waves.length; i++) {
                            const wave = this.waves[i];
                            const safeW = Math.max(960, W);
                            if (wave && wave.g) {
                                wave.g.x = -((this._visualTime * 100 * (wave.speed || 1)) % safeW);
                            }
                        }
                    }
                }

                // 2. ITALIAN: Columns & Rays
                if (this.currentTheme.bgElement === 'italian-columns') {
                    if (this.columns) {
                        const safeW = Math.max(960, W);
                        const safeOffset = (this._sceneryOffset || 0);
                        this.columns.x = -(safeOffset % safeW);
                        if (this.columns.g2) this.columns.g2.x = this.columns.x + safeW;
                    }
                }

                // 3. NEON: Grid & Spires
                if (this.currentTheme.bgElement === 'neon-grid') {
                    const safeOffset = (this._sceneryOffset || 0);
                    if (this.spires) {
                        const safeW = Math.max(960, W);
                        this.spires.x = -(safeOffset % safeW);
                        if (this.spires.g2) this.spires.g2.x = this.spires.x + safeW;
                    }
                    if (this.neonGrid) {
                        const safeW = Math.max(960, W);
                        const gridTime = (this._visualTime || 0) * (speed || 300) * 0.005;
                        this.neonGrid.x = -(gridTime % 100);
                    }
                }

                // 4. FOREST: Trees & Canopy
                if (this.currentTheme.bgElement === 'forest-trees') {
                    const safeOffset = (this._sceneryOffset || 0);
                    if (this.trees) {
                        const safeW = Math.max(960, W);
                        this.trees.x = -(safeOffset % safeW);
                        if (this.trees.g2) this.trees.g2.x = this.trees.x + safeW;
                    }
                    if (this.canopy) {
                        const safeW = Math.max(960, W);
                        const div = Math.max(1, safeW * 0.3);
                        this.canopy.x = -(((this._visualTime || 0) * 50) % div);
                    }
                }

                // Legacy Defaults
                if (this.cityFar1 && this.cityFar1.alpha > 0) {
                    this._cityOffset = (this._cityOffset + speed * 0.1 * (delta / 1000)) % W;
                    this.cityFar1.x = -this._cityOffset;
                    this.cityFar2.x = W - this._cityOffset;
                }
                if (this.grid1 && this.grid1.alpha > 0) {
                    this._gridOffset = (this._gridOffset + speed * 0.4 * (delta / 1000)) % W;
                    this.grid1.x = -this._gridOffset;
                    this.grid2.x = W - this._gridOffset;
                }

                if (!this.isGameOver && !this.deathSequenceStarted) {
                    this.obstacleManager.update(delta);
                    this._checkCollisions();
                    if (this.isMultiplayer) {
                        if (!this.lastSyncTime || time - this.lastSyncTime > 50) {
                            this.lastSyncTime = time;
                            NetworkManager.sendUpdate({
                                y: this.stickman.body.y,
                                yScale: this.stickman.yScale,
                                animPhase: this.stickman.animPhase,
                                gravityFlipped: this.gravityFlipped
                            });
                        }
                    }
                }
            }
            if (this.stickman && typeof this.stickman.update === 'function') this.stickman.update();
            if (this.remotePlayers) {
                for (const p of this.remotePlayers.values()) {
                    if (p && typeof p.update === 'function') p.update();
                }
            }
        } catch (err) {
            console.error('[GameScene] Loop Crash:', err);
        }
    }

    _addRemotePlayer(playerData) {
        if (this.remotePlayers.has(playerData.id)) return;
        console.log('[GameScene] Adding remote player:', playerData.name);
        const remote = new Stickman(this, STICKMAN_X, FLOOR_Y, true, playerData);
        this.remotePlayers.set(playerData.id, remote);
    }

    _onRemoteUpdate({ playerId, state }) {
        const remote = this.remotePlayers.get(playerId);
        if (remote) remote.setRemoteState(state);
    }

    _onRemoteDeath({ playerId }) {
        const remote = this.remotePlayers.get(playerId);
        if (remote) remote.shatter();
    }

    _drawLanes() {
        const W = this.scale.width;
        const color = this.currentTheme.platformColor || 0x1e293b;
        this.add.rectangle(W / 2, this.floorY + 30, W, 2, color, 0.4).setDepth(2);
        this.add.rectangle(W / 2, this.ceilingY - 30, W, 2, color, 0.4).setDepth(2);
    }

    _startCountdown() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        if (this.physics && this.physics.world) this.physics.resume();
        AudioManager.playStart();
        AudioManager.startMusic();
        this.time.delayedCall(400, () => {
            this.obstacleManager.start();
            EventBus.emit('game-started');
        });
    }

    _onFlip(isAutomatic = false) {
        if (this.isGameOver || this.deathSequenceStarted || !this.gameStarted) return;
        if (isAutomatic !== true) {
            this.gravityFlipped = !this.gravityFlipped;
            this.stickman.flipGravity();
            AudioManager.playFlip(this.gravityFlipped);
            this._wasOnPlatform = false;
        }

        const targetY = this.gravityFlipped ? this.ceilingY : this.floorY;
        if (this.flipTween) this.flipTween.stop();
        this.flipTween = this.tweens.add({
            targets: this.stickman.body,
            y: targetY,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => { this.flipTween = null; }
        });

        if (isAutomatic !== true) {
            this.multiplier = Math.min(10, this.multiplier + 0.2);
            this.time.delayedCall(1500, () => {
                if (this.isSceneActive && !this.isGameOver) this.multiplier = Math.max(1, this.multiplier - 0.1);
            });

            // Sync flip to network
            if (this.isMultiplayer) {
                NetworkManager.sendUpdate({
                    y: this.stickman.body.y,
                    yScale: this.stickman.yScale,
                    animPhase: this.stickman.animPhase,
                    gravityFlipped: this.gravityFlipped
                });
            }
        }
    }

    _initParticles() {
        this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: 1200 }, y: { min: 0, max: 600 },
            scale: { min: 0.1, max: 0.3 }, alpha: { min: 0.1, max: 0.3 },
            speedX: { min: -10, max: -5 }, lifespan: 10000, quantity: 0.5, frequency: 100,
            emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(1200, 0, 100, 600) }
        }).setDepth(1);

        const tint = this.currentTheme.platformColor || 0x6366f1;
        this.flowParticles = this.add.particles(0, 0, 'particle', {
            x: 1200, y: { min: 50, max: 550 }, scaleX: { min: 2, max: 5 }, scaleY: 0.1,
            alpha: { start: 0.2, end: 0 }, speedX: { min: -1500, max: -800 },
            lifespan: 1500, quantity: 1, frequency: 50, tint: tint
        }).setDepth(2);
    }

    shutdown() {
        try {
            console.log('[GameScene] Shutdown initiated');
            this.isSceneActive = false;

            // Comprehensive Tween & Physics Cleanup
            if (this.tweens) this.tweens.killAll();

            if (this.obstacleManager) {
                // Soft clear: Destroy all objects in the pools without destroying the pools themselves
                if (this.obstacleManager.pools) {
                    Object.values(this.obstacleManager.pools).forEach(group => {
                        if (group) group.clear(true, true);
                    });
                }
                this.obstacleManager.stop();
                this.obstacleManager = null;
            }

            if (this.physics && this.physics.world) {
                this.physics.resume(); // CRITICAL: Ensure world is not left paused for next round
                this.physics.world.removeAllListeners();
            }

            // Input cleanup
            if (this.input) {
                if (this._flipHandler) {
                    this.input.keyboard.off('keydown-SPACE', this._flipHandler);
                    this.input.off('pointerdown', this._flipHandler);
                }
                this.input.keyboard.shutdown();
                this.input.removeAllListeners();
            }

            // EventBus cleanup
            if (this._localColorHandler) EventBus.off('color-change', this._localColorHandler);
            if (this._obstacleColorHandler) EventBus.off('obstacle-color-change', this._obstacleColorHandler);
            if (this._gameRestartHandler) EventBus.off('game-restart', this._gameRestartHandler);
            if (this._pauseHandler) EventBus.off('pause-game', this._pauseHandler);
            if (this._resumeHandler) EventBus.off('resume-game', this._resumeHandler);
            if (this._quitHandler) EventBus.off('quit-game', this._quitHandler);

            if (this._remoteUpdateHandler) {
                EventBus.off('remote-player-update', this._remoteUpdateHandler);
                EventBus.off('remote-player-died', this._remoteDeathHandler);
                EventBus.off('remote-player-color', this._remoteColorHandler);
            }

            // Object cleanup
            if (this.scoreTicker) { this.scoreTicker.remove(); this.scoreTicker = null; }
            if (this.stickman) { this.stickman.destroy(); this.stickman = null; }
            if (this.remotePlayers) {
                this.remotePlayers.forEach(p => { if (p) p.destroy(); });
                this.remotePlayers.clear();
            }

            // Theme cleanup
            if (this.themeEmitters) {
                this.themeEmitters.forEach(e => { if (e) e.destroy(); });
                this.themeEmitters = [];
            }
            if (this.themeAssets) {
                this.themeAssets.destroy(true);
                this.themeAssets = null;
            }

            // Nullify all handler references
            this._localColorHandler = null;
            this._obstacleColorHandler = null;
            this._gameRestartHandler = null;
            this._pauseHandler = null;
            this._resumeHandler = null;
            this._quitHandler = null;
            this._remoteUpdateHandler = null;
            this._remoteDeathHandler = null;
            this._remoteColorHandler = null;
            this._flipHandler = null;

            // Nullify visual references
            this.waves = null;
            this.rays = null;
            this.neonGrid = null;
            this.canopy = null;
            this.palms = null;
            this.columns = null;
            this.spires = null;
            this.trees = null;
            this.globalGlow = null;
            this.cityFar1 = null;
            this.cityFar2 = null;
            this.grid1 = null;
            this.grid2 = null;

            console.log('[GameScene] Shutdown complete');
        } catch (e) {
            console.error('[GameScene] Shutdown error:', e);
        }
    }
}
