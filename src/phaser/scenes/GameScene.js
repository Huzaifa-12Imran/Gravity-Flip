// src/phaser/scenes/GameScene.js
// Modern GameScene with Slate aesthetics and smooth parallax.
import Phaser from 'phaser';
import EventBus from '../../eventBus';
import Stickman from '../entities/Stickman';
import ObstacleManager from '../managers/ObstacleManager';
import AudioManager from '../managers/AudioManager';

const STICKMAN_X = 180;
const FLOOR_Y = 480;
const CEILING_Y = 60;
const GRAVITY_VEL = 550;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.deathSequenceStarted = false;
    }

    create(data = {}) {
        console.log('[GameScene] Creating with data:', data);

        // Register shutdown handler correctly
        this.events.once('shutdown', this.shutdown, this);
        const W = this.scale.width;
        const H = this.scale.height;

        this.isGameOver = false;
        this.deathSequenceStarted = false;
        this.gravityFlipped = false;
        this.score = 0;
        this.multiplier = 1;
        this.distance = 0;
        this.frameCount = 0;
        this.gameStarted = false;

        // ── Visual Background ───────────────────────────────────────
        this.cameras.main.setBackgroundColor('#020617'); // Slate 950

        // Parallax Layers
        this.cityFar1 = this.add.image(0, 0, 'city').setOrigin(0, 0).setDepth(0).setAlpha(0.15).setTint(0x6366f1);
        this.cityFar2 = this.add.image(W, 0, 'city').setOrigin(0, 0).setDepth(0).setAlpha(0.15).setTint(0x6366f1);

        this.grid1 = this.add.image(0, 0, 'grid').setOrigin(0, 0).setDepth(1).setAlpha(0.1).setTint(0x94a3b8);
        this.grid2 = this.add.image(W, 0, 'grid').setOrigin(0, 0).setDepth(1).setAlpha(0.1).setTint(0x94a3b8);

        this._gridOffset = 0;
        this._cityOffset = 0;

        // Lane Indicators (Minimalist)
        this._drawLanes();

        // Entities
        try {
            console.log('[GameScene] Initializing Stickman...');
            // Cinematic Atmosphere: Multi-layered particles for depth
            this._initParticles();

            this.stickman = new Stickman(this, STICKMAN_X, FLOOR_Y);
            console.log('[GameScene] Initializing ObstacleManager...');
            this.obstacleManager = new ObstacleManager(this);
        } catch (e) {
            console.error('[GameScene] Initialization ERROR:', e);
        }

        // Don't start immediately: wait for 'start-game' from React menu
        this._startGameHandler = () => {
            console.log('[GameScene] start-game received, beginning countdown');
            this._startCountdown();
        };
        EventBus.on('start-game', this._startGameHandler);

        // If this is a restart, auto-start the countdown
        if (data.autoStart) {
            console.log('[GameScene] autoStart detected, skipping menu wait');
            this._startCountdown();
        }

        // Input
        this._flipHandler = this._onFlip.bind(this);
        this._colorChangeHandler = this._onColorChange.bind(this);
        this._restartHandler = this._onStarted.bind(this);

        this.input.keyboard.on('keydown-SPACE', this._flipHandler);
        this.input.on('pointerdown', this._flipHandler);

        EventBus.on('color-change', this._colorChangeHandler);
        EventBus.on('game-restart', this._restartHandler);
        EventBus.on('pause-game', this._handlePause, this);
        EventBus.on('resume-game', this._handleResume, this);
        EventBus.on('quit-game', this._onQuit, this);

        this.scoreTicker = this.time.addEvent({
            delay: 50,
            repeat: -1,
            callback: this._tickScore,
            callbackScope: this,
        });

        console.log('[GameScene] Emitting scene-ready');
        EventBus.emit('scene-ready', this);
    }

    _drawLanes() {
        const W = this.scale.width;
        // Top and Bottom boundary lines - Clean Slate color
        this.add.rectangle(W / 2, FLOOR_Y + 30, W, 2, 0x1e293b, 1.0).setDepth(2);
        this.add.rectangle(W / 2, CEILING_Y - 30, W, 2, 0x1e293b, 1.0).setDepth(2);
    }

    _startCountdown() {
        this.gameStarted = true;
        AudioManager.playStart();
        this.time.delayedCall(400, () => {
            this.obstacleManager.start();
            EventBus.emit('game-started');
        });
    }

    _onFlip(isAutomatic = false) {
        if (this.isGameOver || this.deathSequenceStarted || !this.gameStarted) return;

        // Phaser events (pointerdown, keydown) pass an event object.
        // We only want to skip the flip logic IF we explicitly pass boolean 'true'.
        if (isAutomatic !== true) {
            this.gravityFlipped = !this.gravityFlipped;
            const success = this.stickman.flipGravity();
            if (success) {
                AudioManager.playFlip(this.stickman.isFlipped);
            }
            this._wasOnPlatform = false;
        }

        const targetY = this.gravityFlipped ? CEILING_Y : FLOOR_Y;

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
            setTimeout(() => { this.multiplier = Math.max(1, this.multiplier - 0.1); }, 1500);
        }
    }

    _onColorChange(colorHex) {
        if (this.stickman && !this.isGameOver) {
            this.stickman.setColor(colorHex);
        }
    }

    _initParticles() {
        // 1. Distant Star/Dust particles (Slow)
        this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: 1200 },
            y: { min: 0, max: 600 },
            scale: { min: 0.1, max: 0.3 },
            alpha: { min: 0.1, max: 0.3 },
            speedX: { min: -10, max: -5 },
            lifespan: 10000,
            quantity: 0.5,
            frequency: 100,
            emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(1200, 0, 100, 600) }
        }).setDepth(1);

        // 2. High-speed "Neural Flow" lines
        this.flowParticles = this.add.particles(0, 0, 'particle', {
            x: 1200,
            y: { min: 50, max: 550 },
            scaleX: { min: 2, max: 5 },
            scaleY: 0.1,
            alpha: { start: 0.2, end: 0 },
            speedX: { min: -1500, max: -800 },
            lifespan: 1500,
            quantity: 1,
            frequency: 50,
            tint: 0x6366f1
        });
        this.flowParticles.setDepth(2);
    }

    _onStarted() {
        console.log('[GameScene] Restarting with autoStart: true');
        this.scene.restart({ autoStart: true });
    }

    _onQuit() {
        console.log('[GameScene] Terminating session, returning to stable menu state');
        this.scene.restart({ autoStart: false });
    }

    _handlePause() {
        if (this.isGameOver || this.deathSequenceStarted) return;
        console.log('[GameScene] Pausing scene');
        this.scene.pause();
    }

    _handleResume() {
        console.log('[GameScene] Resuming scene');
        this.scene.resume();
    }

    _tickScore() {
        if (!this.gameStarted || this.isGameOver || this.deathSequenceStarted) return;
        this.score += Math.round(this.multiplier);
        this.distance += (this.obstacleManager.getScrollSpeed() / 1200).toFixed(2) * 1;
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

        for (const obs of obstacles) {
            if (!obs.active) continue;
            const bounds = obs.getBounds();
            const isPlatform = obs.texture.key === 'platform';

            // Collision check: padX=4 for side hit, padY=-2 to grow the surface hit area
            const padX = 4;
            const padY = -2;
            const hit = Phaser.Geom.Intersects.RectangleToRectangle(
                new Phaser.Geom.Rectangle(sbBounds.x + padX, sbBounds.y + padY, sbBounds.width - padX * 2, sbBounds.height - padY * 2),
                bounds
            );

            if (hit) {
                if (isPlatform) {
                    onPlatform = true;
                    platformY = this.gravityFlipped ? bounds.bottom + 30 : bounds.top - 30;

                    if (this.flipTween && this.flipTween.isPlaying()) {
                        this.flipTween.stop();
                        this.flipTween = null;
                        console.log('[GameScene] Landed on platform, stopping flip');
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

        this.input.keyboard.off('keydown-SPACE', this._flipHandler);
        this.input.off('pointerdown', this._flipHandler);

        this.obstacleManager.stop();
        if (this.scoreTicker) {
            this.scoreTicker.remove();
            this.scoreTicker = null;
        }

        const finalScore = Math.floor(this.score);
        const finalDistance = Math.floor(this.distance);

        this.stickman.shatter();
        this.cameras.main.flash(300, 255, 255, 255, 0.2);
        this.cameras.main.shake(150, 0.005);

        this.time.delayedCall(400, () => {
            EventBus.emit('game-over', {
                score: finalScore,
                distance: finalDistance,
            });
        });
    }

    update(time, delta) {
        if (this.isGameOver || this.deathSequenceStarted) return;

        if (this.gameStarted) {
            this.frameCount++;
            const W = this.scale.width;
            const speed = this.obstacleManager.getScrollSpeed();

            this._cityOffset = (this._cityOffset + speed * 0.1 * (delta / 1000)) % W;
            this._gridOffset = (this._gridOffset + speed * 0.4 * (delta / 1000)) % W;

            this.cityFar1.x = -this._cityOffset;
            this.cityFar2.x = W - this._cityOffset;
            this.grid1.x = -this._gridOffset;
            this.grid2.x = W - this._gridOffset;

            this.obstacleManager.update();
            this._checkCollisions();
        }

        this.stickman.update();
    }

    shutdown() {
        this.input.keyboard.off('keydown-SPACE', this._flipHandler);
        this.input.off('pointerdown', this._flipHandler);
        EventBus.off('color-change', this._colorChangeHandler);
        EventBus.off('game-restart', this._restartHandler);
        EventBus.off('start-game', this._startGameHandler);
        EventBus.off('pause-game', this._handlePause, this);
        EventBus.off('resume-game', this._handleResume, this);
        EventBus.off('quit-game', this._onQuit, this);
        if (this.scoreTicker) {
            this.scoreTicker.remove();
            this.scoreTicker = null;
        }
        if (this.stickman) this.stickman.destroy();
        if (this.obstacleManager) this.obstacleManager.stop();
    }
}