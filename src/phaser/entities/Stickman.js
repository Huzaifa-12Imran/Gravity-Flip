// src/phaser/entities/Stickman.js
// Modern Stickman: Jointed skeletal animation with vertical flipping support.
import Phaser from 'phaser';

export default class Stickman {
    constructor(scene, x, y) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Default premium color: Indigo 500
        this.color = 0x6366f1;
        this.colorHex = '#6366f1';

        // Physics body: Using 'particle' as a safe key for the dummy physics body
        this.body = scene.physics.add.image(x, y, 'particle');
        this.body.setDisplaySize(30, 60);
        this.body.setAlpha(0);
        this.body.setDepth(10);
        this.body.body.setSize(22, 54);
        this.body.body.allowGravity = false;

        // Graphics for drawing stickman
        this.gfx = scene.add.graphics();
        this.gfx.setDepth(10);

        // Animation state
        this.animPhase = 0; // 0 to 1 cycle
        this.gravityFlipped = false;
        this.isDead = false;
        this.yScale = 1; // 1 for floor, -1 for ceiling
        this.flipTween = null;

        // Phantom Trail System
        this.trail = [];
        this.maxTrail = 12;
        this.trailGraphics = scene.add.graphics();
        this.trailGraphics.setDepth(9); // Just below the main character
    }

    setColor(hexString) {
        this.colorHex = hexString;
        this.color = parseInt(hexString.replace('#', ''), 16);
    }

    flipGravity() {
        if (this.isDead) return;
        this.gravityFlipped = !this.gravityFlipped;

        const targetScale = this.gravityFlipped ? -1 : 1;
        if (this.flipTween) this.flipTween.stop();

        this.flipTween = this.scene.tweens.add({
            targets: this,
            yScale: targetScale,
            duration: 250,
            ease: 'Back.easeOut'
        });
    }

    shatter() {
        if (this.isDead) return;
        this.isDead = true;

        if (this.flipTween) this.flipTween.stop();

        const particles = this.scene.add.particles(this.body.x, this.body.y, 'particle', {
            speed: { min: 120, max: 350 },
            angle: { min: 0, max: 360 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            tint: [0xffffff, this.color, 0x94a3b8],
            lifespan: { min: 400, max: 800 },
            quantity: 40,
            emitting: false,
        });
        particles.setDepth(20);
        particles.explode(40);

        this.scene.tweens.add({
            targets: this.gfx,
            alpha: 0,
            duration: 250,
            onComplete: () => this.gfx.clear(),
        });

        this.trailGraphics.clear();
        this.body.destroy();
    }

    _drawPhantomTrail() {
        if (this.isDead) return;
        const tg = this.trailGraphics;
        tg.clear();

        const speed = this.scene.obstacleManager ? this.scene.obstacleManager.getScrollSpeed() : 300;
        // Only show trail at high momentum
        if (speed < 400) return;

        const baseAlpha = Math.min((speed - 400) / 600, 0.4);

        this.trail.forEach((snapshot, i) => {
            const alpha = (i / this.trail.length) * baseAlpha;
            tg.lineStyle(2, this.color, alpha);

            // Draw head
            const hPos = this._getSnapshotPos(snapshot, 0, -22);
            tg.strokeCircle(hPos.x, hPos.y, 6);

            // Draw simple torso line for trail
            const nPos = this._getSnapshotPos(snapshot, 0, -15);
            const wPos = this._getSnapshotPos(snapshot, 0, 8);
            tg.lineBetween(nPos.x, nPos.y, wPos.x, wPos.y);
        });
    }

    _getSnapshotPos(snapshot, dx, dy) {
        const bob = Math.sin(snapshot.phase * Math.PI * 2 * 2) * 3.5;
        return {
            x: snapshot.x + dx,
            y: (snapshot.y + (snapshot.scale * bob)) + dy * snapshot.scale
        };
    }

    _drawStickman() {
        const g = this.gfx;
        g.clear();

        const cx = this.body.x;
        const cy = this.body.y;
        const color = this.color;
        const phase = this.animPhase;
        const scale = this.yScale;

        // Bobbing: Two bounces per run cycle
        const bodyBob = Math.sin(phase * Math.PI * 2 * 2) * 3.5;
        const drawCy = cy + (scale * bodyBob);

        // Local -> World space transform: Vertical flip only
        const tx = (dx, dy) => ({ x: cx + dx, y: drawCy + dy * scale });

        const strokeWidth = 2.5;
        const limbColor = color;
        g.lineStyle(strokeWidth, limbColor, 1);

        // 1. Head
        const headPos = tx(0, -22);
        g.lineStyle(2, limbColor, 1);
        g.strokeCircle(headPos.x, headPos.y, 7);

        // 2. Torso (Bending slightly based on cycle)
        const torsoLean = Math.sin(phase * Math.PI * 2) * 0.08;
        const neck = tx(torsoLean * 15, -15);
        const waist = tx(0, 8);
        g.lineStyle(strokeWidth, limbColor, 1);
        g.lineBetween(neck.x, neck.y, waist.x, waist.y);

        // 3. Limbs Helper (Skeletal/Jointed)
        const drawJointedLimb = (start, phaseOffset, isArm) => {
            const p = (phase + phaseOffset) % 1;

            // Primary angle (Upper segment)
            const angle1 = isArm
                ? Math.sin(p * Math.PI * 2) * 45 + 10
                : Math.sin(p * Math.PI * 2) * 45;

            // Secondary angle (Lower segment / Joint)
            const angle2 = isArm
                ? Math.sin(p * Math.PI * 2 - 0.5) * 40 + 40
                : Math.sin(p * Math.PI * 2 - 1) * 35 + 45;

            // Segment 1 (Upper)
            const rad1 = Phaser.Math.DegToRad(isArm ? angle1 + 180 : angle1 + 90);
            const seg1Len = isArm ? 11 : 14;
            // Apply scale to vertical offset only
            const joint = {
                x: start.x + Math.cos(rad1) * seg1Len,
                y: start.y + Math.sin(rad1) * seg1Len * scale
            };

            // Segment 2 (Lower)
            const rad2 = rad1 + Phaser.Math.DegToRad(isArm ? -angle2 : angle2);
            const seg2Len = isArm ? 10 : 13;
            // Apply scale to vertical offset only
            const end = {
                x: joint.x + Math.cos(rad2) * seg2Len,
                y: joint.y + Math.sin(rad2) * seg2Len * scale
            };

            g.lineBetween(start.x, start.y, joint.x, joint.y);
            g.lineBetween(joint.x, joint.y, end.x, end.y);
            return { end };
        };

        // Arms (shoulder is 80% up the torso)
        const shoulder = { x: neck.x * 0.8 + waist.x * 0.2, y: neck.y * 0.8 + waist.y * 0.2 };
        const lHandInfo = drawJointedLimb(shoulder, 0.5, true);
        const rHandInfo = drawJointedLimb(shoulder, 0, true);

        // Legs
        const hip = waist;
        const lFootInfo = drawJointedLimb(hip, 0, false);
        const rFootInfo = drawJointedLimb(hip, 0.5, false);

        // 4. Rounded Hands & Feet
        g.fillStyle(limbColor, 1);
        g.fillCircle(lHandInfo.end.x, lHandInfo.end.y, 3.5);
        g.fillCircle(rHandInfo.end.x, rHandInfo.end.y, 3.5);
        g.fillEllipse(lFootInfo.end.x, lFootInfo.end.y, 10, 5.5);
        g.fillEllipse(rFootInfo.end.x, rFootInfo.end.y, 10, 5.5);
    }

    update() {
        if (this.isDead) return;

        // Advance animation phase based on current scroll speed
        const speed = this.scene.obstacleManager ? this.scene.obstacleManager.getScrollSpeed() : 300;
        const phaseIncrement = (this.scene.gameStarted ? (speed / 1000) * 0.08 : 0);
        this.animPhase = (this.animPhase + phaseIncrement) % 1;

        // Update trail
        this.trail.push({
            x: this.body.x,
            y: this.body.y,
            phase: this.animPhase,
            scale: this.yScale
        });
        if (this.trail.length > this.maxTrail) this.trail.shift();

        this._drawPhantomTrail();
        this._drawStickman();
    }

    getBody() { return this.body; }

    destroy() {
        if (this.flipTween) this.flipTween.stop();
        this.gfx.destroy();
        this.trailGraphics.destroy();
        if (this.body && this.body.active) this.body.destroy();
    }
}
