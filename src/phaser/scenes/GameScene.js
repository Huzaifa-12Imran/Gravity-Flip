// src/phaser/scenes/GameScene.js
import Phaser from 'phaser';
import EventBus from '../../eventBus';
import Stickman from '../entities/Stickman';
import ObstacleManager from '../managers/ObstacleManager';
import AudioManager from '../managers/AudioManager';
import NetworkManager from '../managers/NetworkManager';

const STICKMAN_X = 180;
const FLOOR_Y = 480;
const CEILING_Y = 60;

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        this.deathSequenceStarted = false;
        this.remotePlayers = new Map();
    }

    create(data = {}) {
        console.log('[GameScene] Creating with data:', data);
        this.events.once('shutdown', this.shutdown, this);
        const W = this.scale.width;

        this.isGameOver = false;
        this.deathSequenceStarted = false;
        this.gravityFlipped = false;
        this.score = 0;
        this.multiplier = 1;
        this.distance = 0;
        this.gameStarted = false;
        this.isMultiplayer = !!data.multiplayer;

        // Visuals
        this.cameras.main.setBackgroundColor('#020617');
        this.cityFar1 = this.add.image(0, 0, 'city').setOrigin(0, 0).setDepth(0).setAlpha(0.15).setTint(0x6366f1);
        this.cityFar2 = this.add.image(W, 0, 'city').setOrigin(0, 0).setDepth(0).setAlpha(0.15).setTint(0x6366f1);
        this.grid1 = this.add.image(0, 0, 'grid').setOrigin(0, 0).setDepth(1).setAlpha(0.1).setTint(0x94a3b8);
        this.grid2 = this.add.image(W, 0, 'grid').setOrigin(0, 0).setDepth(1).setAlpha(0.1).setTint(0x94a3b8);
        this._gridOffset = 0;
        this._cityOffset = 0;
        this._drawLanes();
        this._initParticles();

        // Local Player
        const localMeta = data.playerConfig || { name: 'You', color: '#6366f1' };
        this.stickman = new Stickman(this, STICKMAN_X, FLOOR_Y, false, localMeta);
        this.obstacleManager = new ObstacleManager(this);

        // Remote Players setup
        if (this.isMultiplayer) {
            this.obstacleManager.setSeed(data.seed || 1);
            const myId = NetworkManager.player?.id || '';
            const otherPlayers = (data.players || []).filter(p => p.id !== myId);
            otherPlayers.forEach(p => this._addRemotePlayer(p));
        }

        // Networking Listeners
        if (this.isMultiplayer) {
            this._remoteUpdateHandler = this._onRemoteUpdate.bind(this);
            this._remoteDeathHandler = this._onRemoteDeath.bind(this);
            this._remoteColorHandler = ({ playerId, color }) => {
                console.log(`[GameScene] Received Remote Color: id=${playerId}, color=${color}`);
                const remote = this.remotePlayers.get(playerId);
                if (remote) remote.setColor(color);
            };
            EventBus.on('remote-player-update', this._remoteUpdateHandler);
            EventBus.on('remote-player-died', this._remoteDeathHandler);
            EventBus.on('remote-player-color', this._remoteColorHandler);
        }

        // Start Handlers
        this._startGameHandler = (mdata) => {
            if (this.isMultiplayer && mdata?.seed) this.obstacleManager.setSeed(mdata.seed);
            this._startCountdown();
        };
        EventBus.on('start-game', this._startGameHandler);
        EventBus.on('multiplayer-start', this._startGameHandler);

        if (data.autoStart) this._startCountdown();

        // Inputs
        this._flipHandler = this._onFlip.bind(this);
        this.input.keyboard.on('keydown-SPACE', this._flipHandler);
        this.input.on('pointerdown', this._flipHandler);

        this._localColorHandler = (c) => this.stickman.setColor(c);
        this._gameRestartHandler = (newData = {}) => {
            this.scene.restart({ autoStart: true, ...data, ...newData });
        };
        this._pauseHandler = () => !this.isMultiplayer && this.scene.pause();
        this._resumeHandler = () => !this.isMultiplayer && this.scene.resume();
        this._quitHandler = () => this.scene.restart({ autoStart: false });

        EventBus.on('color-change', this._localColorHandler);
        EventBus.on('game-restart', this._gameRestartHandler);
        EventBus.on('pause-game', this._pauseHandler);
        EventBus.on('resume-game', this._resumeHandler);
        EventBus.on('quit-game', this._quitHandler);

        this.scoreTicker = this.time.addEvent({ delay: 50, repeat: -1, callback: this._tickScore, callbackScope: this });
        EventBus.emit('scene-ready', this);
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
        this.add.rectangle(W / 2, FLOOR_Y + 30, W, 2, 0x1e293b, 1.0).setDepth(2);
        this.add.rectangle(W / 2, CEILING_Y - 30, W, 2, 0x1e293b, 1.0).setDepth(2);
    }

    _startCountdown() {
        if (this.gameStarted) return;
        this.gameStarted = true;
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
            const success = this.stickman.flipGravity();
            if (success) AudioManager.playFlip(this.stickman.isFlipped);
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

        this.flowParticles = this.add.particles(0, 0, 'particle', {
            x: 1200, y: { min: 50, max: 550 }, scaleX: { min: 2, max: 5 }, scaleY: 0.1,
            alpha: { start: 0.2, end: 0 }, speedX: { min: -1500, max: -800 },
            lifespan: 1500, quantity: 1, frequency: 50, tint: 0x6366f1
        }).setDepth(2);
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
        console.log('[GameScene] Local Player Death Triggered');
        this.deathSequenceStarted = true;
        this.isGameOver = true;

        AudioManager.playShatter();
        AudioManager.stopMusic();

        this.input.keyboard.off('keydown-SPACE', this._flipHandler);
        this.input.off('pointerdown', this._flipHandler);
        if (!this.isMultiplayer) {
            this.obstacleManager.stop();
        }
        if (this.scoreTicker) { this.scoreTicker.remove(); this.scoreTicker = null; }

        const finalScore = Math.floor(this.score);
        const finalDistance = Math.floor(this.distance);

        this.stickman.shatter();
        this.cameras.main.flash(300, 255, 255, 255, 0.2);
        this.cameras.main.shake(150, 0.005);

        if (this.isMultiplayer) {
            NetworkManager.sendDeath(finalScore, finalDistance);
            // In multiplayer, don't trigger the modal yet. Just tell the UI we're dead.
            EventBus.emit('local-death', { score: finalScore, distance: finalDistance });
        } else {
            this.time.delayedCall(400, () => {
                EventBus.emit('game-over', { score: finalScore, distance: finalDistance, isMultiplayer: this.isMultiplayer });
            });
        }
    }

    update(time, delta) {
        try {
            if (this.gameStarted) {
                const W = this.scale.width;
                const speed = this.obstacleManager.getScrollSpeed();

                // Move backgrounds (Must keep moving for spectators)
                this._cityOffset = (this._cityOffset + speed * 0.1 * (delta / 1000)) % W;
                this._gridOffset = (this._gridOffset + speed * 0.4 * (delta / 1000)) % W;

                this.cityFar1.x = -this._cityOffset;
                this.cityFar2.x = W - this._cityOffset;
                this.grid1.x = -this._gridOffset;
                this.grid2.x = W - this._gridOffset;

                this.obstacleManager.update();

                // ONLY check collisions and sync if local player is alive
                if (!this.isGameOver && !this.deathSequenceStarted) {
                    this._checkCollisions();

                    // Periodic network sync
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

            if (this.stickman && typeof this.stickman.update === 'function') {
                this.stickman.update();
            }
            if (this.remotePlayers) {
                this.remotePlayers.forEach(p => {
                    if (p && typeof p.update === 'function') p.update();
                });
            }
        } catch (err) {
            console.error('[GameScene] Loop Crash:', err);
        }
    }

    shutdown() {
        this.input.keyboard.off('keydown-SPACE', this._flipHandler);
        this.input.off('pointerdown', this._flipHandler);
        EventBus.off('color-change', this._localColorHandler);
        EventBus.off('game-restart', this._gameRestartHandler);
        EventBus.off('start-game', this._startGameHandler);
        EventBus.off('multiplayer-start', this._startGameHandler);
        if (this._remoteUpdateHandler) {
            EventBus.off('remote-player-update', this._remoteUpdateHandler);
            EventBus.off('remote-player-died', this._remoteDeathHandler);
            EventBus.off('remote-player-color', this._remoteColorHandler);
        }
        EventBus.off('pause-game', this._pauseHandler);
        EventBus.off('resume-game', this._resumeHandler);
        EventBus.off('quit-game', this._quitHandler);
        if (this.scoreTicker) this.scoreTicker.remove();
        if (this.stickman) this.stickman.destroy();
        this.remotePlayers.forEach(p => p.destroy());
        this.remotePlayers.clear();
        if (this.obstacleManager) this.obstacleManager.stop();
    }
}
