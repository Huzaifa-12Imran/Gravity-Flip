// src/phaser/managers/ObstacleManager.js
import Phaser from 'phaser';
// Obstacle Manager with updated design: Slate walls, Amber warnings.
const SCROLL_SPEED_INITIAL = 280;
const SCROLL_SPEED_MAX = 600;
const SPEED_RAMP_AMOUNT = 18;
const SPEED_RAMP_INTERVAL = 8000;

const OBSTACLES = [
    { type: 'wall', texture: 'wall', w: 32, h: 120, score: 1 },
    { type: 'platform', texture: 'platform', w: 120, h: 24, score: 2, isPlatform: true },
];

export default class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.scrollSpeed = SCROLL_SPEED_INITIAL;
        this.active = false;
        this.pools = {};
        this.spawnTimer = null;
        this.speedTimer = null;
        this.spawnDelay = 1600;
        this.spawnDelayMin = 650;

        this._createPools();
    }

    _createPools() {
        OBSTACLES.forEach(({ type, texture }) => {
            this.pools[type] = this.scene.physics.add.group({
                defaultKey: texture,
                maxSize: 20,
                active: false,
                visible: false,
            });
        });
    }

    start() {
        this.active = true;
        this._scheduleSpawn();
        this._startSpeedRamp();
    }

    stop() {
        this.active = false;
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.speedTimer) this.speedTimer.remove();
    }

    _scheduleSpawn() {
        if (!this.active) return;
        this.spawnTimer = this.scene.time.delayedCall(this.spawnDelay, () => {
            this._spawnObstacle();
            this.spawnDelay = Math.max(this.spawnDelayMin, this.spawnDelay - 15);
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
        const GW = this.scene.scale.width;
        const GH = this.scene.scale.height;
        const def = OBSTACLES[Math.floor(Math.random() * OBSTACLES.length)];
        const obj = this.pools[def.type].get();
        if (!obj) return;

        obj.setActive(true).setVisible(true);
        obj.setTexture(def.texture);
        obj.setDisplaySize(def.w, def.h);
        obj.refreshBody();

        let y;
        const offset = 4;

        if (def.type === 'platform') {
            if (Math.random() < 0.5) {
                y = Phaser.Math.Between(GH * 0.22, GH * 0.38);
            } else {
                y = Phaser.Math.Between(GH * 0.62, GH * 0.78);
            }
            // Laser: High-contrast Alert color (Amber 500)
            obj.setTint(0xf59e0b);
            obj.setAlpha(0.9);
        } else {
            if (Math.random() < 0.5) {
                y = 480 + 26 - def.h / 2 - offset;
            } else {
                y = 60 - 26 + def.h / 2 + offset;
            }
            // Wall: Solid Slate color (Slate 400)
            obj.setTint(0x94a3b8);
            obj.setAlpha(1.0);
        }

        obj.setPosition(GW + def.w, y);
        obj.body.setVelocityX(-this.scrollSpeed);
        obj.body.allowGravity = false;
        obj.setDepth(5);
        obj.scoreValue = def.score;
    }

    update() {
        if (!this.active) return;
        Object.values(this.pools).forEach(group => {
            group.getChildren().forEach(obj => {
                if (!obj.active) return;
                obj.body.setVelocityX(-this.scrollSpeed);
                if (obj.x < -200) {
                    obj.setActive(false).setVisible(false);
                    obj.body.setVelocityX(0);
                }
            });
        });
    }

    getActiveObstacles() {
        const all = [];
        Object.values(this.pools).forEach(group => {
            group.getChildren().forEach(obj => {
                if (obj.active) all.push(obj);
            });
        });
        return all;
    }

    reset() {
        this.scrollSpeed = SCROLL_SPEED_INITIAL;
        this.spawnDelay = 1600;
        Object.values(this.pools).forEach(group => {
            group.getChildren().forEach(obj => {
                obj.setActive(false).setVisible(false);
                if (obj.body) obj.body.setVelocityX(0);
            });
        });
    }

    getScrollSpeed() { return this.scrollSpeed; }
}