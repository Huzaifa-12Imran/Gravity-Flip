// src/phaser/scenes/BootScene.js
// Preloads all programmatic textures with the new Premium design.
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('[BootScene] Preloading textures...');
        this._createCityTexture();
        this._createGridTexture();
        this._createObstacleTextures();
        this._createParticleTexture();
        console.log('[BootScene] Preload complete');
    }

    _createCityTexture() {
        const W = 960, H = 540;
        const g = this.make.graphics({ x: 0, y: 0, add: false });

        // Sky gradient: Deep Slate
        g.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 1);
        g.fillRect(0, 0, W, H);

        // Far buildings (Slate 900)
        g.fillStyle(0x0f172a, 1);
        const farBuildings = [
            [0, 380, 60, 160], [55, 350, 50, 190], [100, 370, 70, 170],
            [165, 340, 45, 200], [205, 360, 55, 180], [255, 330, 80, 210],
            [330, 355, 50, 185], [375, 345, 60, 195], [430, 370, 45, 170],
            [470, 340, 70, 200], [535, 360, 55, 180], [585, 350, 65, 190],
            [645, 330, 80, 210], [720, 355, 50, 185], [765, 345, 60, 195],
            [820, 365, 70, 175], [885, 340, 75, 200],
        ];
        farBuildings.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));

        // Mid buildings (Slate 800)
        g.fillStyle(0x1e293b, 1);
        const midBuildings = [
            [0, 400, 80, 140], [75, 390, 55, 150], [125, 410, 65, 130],
            [185, 385, 90, 155], [270, 400, 60, 140], [325, 420, 75, 120],
            [395, 395, 85, 145], [475, 405, 70, 135], [540, 388, 95, 152],
            [630, 400, 65, 140], [690, 415, 80, 125], [765, 390, 90, 150],
            [850, 400, 55, 140], [900, 385, 65, 155],
        ];
        midBuildings.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));

        // Subtle Windows (Indigo/White)
        const rng = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const windowColors = [0x6366f1, 0xffffff, 0x94a3b8];
        for (let i = 0; i < 150; i++) {
            const color = windowColors[rng(0, windowColors.length - 1)];
            g.fillStyle(color, rng(1, 4) / 10);
            g.fillRect(rng(0, W - 3), rng(350, 440), 2, 2);
        }

        g.generateTexture('city', W, H);
        g.destroy();
    }

    _createGridTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        // Subtle Slate grid
        g.lineStyle(1, 0x334155, 0.1);
        for (let x = 0; x <= 960; x += 60) g.lineBetween(x, 0, x, 540);
        for (let y = 0; y <= 540; y += 60) g.lineBetween(0, y, 960, y);
        g.generateTexture('grid', 960, 540);
        g.destroy();
    }

    _createObstacleTextures() {
        // Premium Wall
        const dw = this.make.graphics({ x: 0, y: 0, add: false });
        dw.fillStyle(0x1e293b, 1); // Slate 800
        dw.fillRoundedRect(0, 0, 32, 120, 4);
        dw.lineStyle(1, 0xffffff, 0.1);
        dw.strokeRoundedRect(0, 0, 32, 120, 4);

        // Clean accent stripes
        dw.fillStyle(0xffffff, 0.05);
        for (let i = 0; i < 10; i++) {
            dw.fillRect(4, 10 + i * 10, 24, 1);
        }

        dw.generateTexture('wall', 32, 120);
        dw.destroy();

        // Premium Platform (Solid Amber)
        const pg = this.make.graphics({ x: 0, y: 0, add: false });
        // Main body (Amber 500)
        pg.fillStyle(0xf59e0b, 1);
        pg.fillRoundedRect(0, 0, 120, 24, 4);
        // Bevel/Top Highlight
        pg.fillStyle(0xffffff, 0.2);
        pg.fillRect(0, 0, 120, 4);
        // Bottom Shadow
        pg.fillStyle(0x000000, 0.1);
        pg.fillRect(0, 20, 120, 4);
        // Accent Stripes
        pg.lineStyle(1, 0xffffff, 0.1);
        for (let i = 0; i < 6; i++) {
            pg.lineBetween(10 + i * 20, 4, 10 + i * 20, 20);
        }

        pg.generateTexture('platform', 120, 24);
        pg.destroy();
    }

    _createParticleTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(4, 4, 4);
        g.generateTexture('particle', 8, 8);
        g.destroy();
    }

    create() {
        console.log('[BootScene] Creating... starting GameScene');
        this.scene.start('GameScene');
    }
}
