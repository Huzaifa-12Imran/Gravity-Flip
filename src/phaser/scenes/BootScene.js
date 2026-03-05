// src/phaser/scenes/BootScene.js
// Preloads all programmatic textures with the new Premium design.
import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        console.log('[BootScene] Preloading textures and assets...');
        this._createCityTexture();
        this._createGridTexture();
        this._createFloorTextures();
        this._createObstacleTextures();
        this._createThemeObstacleTextures();

        this._createParticleTexture();
        console.log('[BootScene] Programmatic texture generation complete');
    }

    _createCityTexture() {
        const W = 960, H = 540;
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillGradientStyle(0x020617, 0x020617, 0x0f172a, 0x0f172a, 1);
        g.fillRect(0, 0, W, H);
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
        g.fillStyle(0x1e293b, 1);
        const midBuildings = [
            [0, 400, 80, 140], [75, 390, 55, 150], [125, 410, 65, 130],
            [185, 385, 90, 155], [270, 400, 60, 140], [325, 420, 75, 120],
            [395, 395, 85, 145], [475, 405, 70, 135], [540, 388, 95, 152],
            [630, 400, 65, 140], [690, 415, 80, 125], [765, 390, 90, 150],
            [850, 400, 55, 140], [900, 385, 65, 155],
        ];
        midBuildings.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
        const windowColors = [0x6366f1, 0xffffff, 0x94a3b8];
        for (let i = 0; i < 150; i++) {
            const color = windowColors[i % 3];
            g.fillStyle(color, (i % 4 + 1) / 10);
            g.fillRect((i * 37) % W, 350 + (i * 13) % 90, 2, 2);
        }
        g.generateTexture('city', W, H);
        g.destroy();
    }

    _createGridTexture() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.lineStyle(1, 0x334155, 0.1);
        for (let x = 0; x <= 960; x += 60) g.lineBetween(x, 0, x, 540);
        for (let y = 0; y <= 540; y += 60) g.lineBetween(0, y, 960, y);
        g.generateTexture('grid', 960, 540);
        g.destroy();
    }

    _createObstacleTextures() {
        // Wall
        const dw = this.make.graphics({ x: 0, y: 0, add: false });
        dw.fillStyle(0x1e293b, 1);
        dw.fillRoundedRect(0, 0, 32, 120, 4);
        dw.lineStyle(1, 0xffffff, 0.1);
        dw.strokeRoundedRect(0, 0, 32, 120, 4);
        dw.fillStyle(0xffffff, 0.05);
        for (let i = 0; i < 10; i++) dw.fillRect(4, 10 + i * 10, 24, 1);
        dw.generateTexture('wall', 32, 120);
        dw.destroy();

        // Platform
        const pg = this.make.graphics({ x: 0, y: 0, add: false });
        pg.fillStyle(0xf59e0b, 1);
        pg.fillRoundedRect(0, 0, 120, 24, 4);
        pg.fillStyle(0xffffff, 0.2);
        pg.fillRect(0, 0, 120, 4);
        pg.fillStyle(0x000000, 0.1);
        pg.fillRect(0, 20, 120, 4);
        pg.lineStyle(1, 0xffffff, 0.1);
        for (let i = 0; i < 6; i++) pg.lineBetween(10 + i * 20, 4, 10 + i * 20, 20);
        pg.generateTexture('platform', 120, 24);
        pg.destroy();
    }

    _createThemeObstacleTextures() {
        // Beach Ball
        const bb = this.make.graphics({ x: 0, y: 0, add: false });
        bb.fillStyle(0xffffff, 1);
        bb.fillCircle(16, 16, 16);
        bb.fillStyle(0xfbbf24, 1);
        bb.slice(16, 16, 16, 0, Math.PI / 2);
        bb.fillPath();
        bb.fillStyle(0xef4444, 1);
        bb.slice(16, 16, 16, Math.PI, 3 * Math.PI / 2);
        bb.fillPath();
        bb.generateTexture('beach-ball', 32, 32);
        bb.destroy();

        // Italian Column
        const col = this.make.graphics({ x: 0, y: 0, add: false });
        col.fillStyle(0xf5deb3, 1);
        col.fillRect(4, 10, 24, 100);
        col.fillStyle(0xe2e8f0, 1);
        col.fillRect(0, 0, 32, 10);
        col.fillRect(0, 110, 32, 10);
        col.generateTexture('column', 32, 120);
        col.destroy();

        // Neon Barrier
        const nb = this.make.graphics({ x: 0, y: 0, add: false });
        nb.lineStyle(2, 0x00ff88, 1);
        nb.strokeRoundedRect(2, 2, 28, 116, 4);
        nb.fillStyle(0x00ff88, 0.2);
        nb.fillRoundedRect(4, 4, 24, 112, 2);
        nb.generateTexture('neon-barrier', 32, 120);
        nb.destroy();

        // Forest Log
        const log = this.make.graphics({ x: 0, y: 0, add: false });
        log.fillStyle(0x78350f, 1);
        log.fillRoundedRect(0, 40, 120, 40, 8);
        log.fillStyle(0x92400e, 1);
        for (let i = 0; i < 5; i++) log.fillRect(10 + i * 20, 45, 15, 2);
        log.generateTexture('log', 120, 120);
        log.destroy();

        // Surfboard
        const sb = this.make.graphics({ x: 0, y: 0, add: false });
        sb.fillStyle(0x0ea5e9, 1);
        // Standardizing to Circle for better compatibility
        sb.fillCircle(16, 30, 16);
        sb.fillCircle(16, 90, 16);
        sb.fillRect(8, 30, 16, 60);
        sb.fillStyle(0xffffff, 1);
        sb.fillRect(15, 0, 2, 120);
        sb.generateTexture('surfboard', 32, 120);
        sb.destroy();
        console.log('[BootScene] Theme textures: beach-ball, column, neon-barrier, log, surfboard, jellyfish, amphora, rock created');

        // Jellyfish
        const jf = this.make.graphics({ x: 0, y: 0, add: false });
        jf.fillStyle(0xf472b6, 0.8);
        jf.fillCircle(16, 12, 12);
        jf.lineStyle(2, 0xf472b6, 0.5);
        for (let i = 0; i < 3; i++) jf.lineBetween(10 + i * 6, 20, 10 + i * 6, 32);
        jf.generateTexture('jellyfish', 32, 32);
        jf.destroy();

        // Amphora
        const amp = this.make.graphics({ x: 0, y: 0, add: false });
        amp.fillStyle(0xb45309, 1);
        // Using Circles instead of Ellipse
        amp.fillCircle(16, 20, 12);
        amp.fillRect(14, 0, 4, 10);
        amp.fillCircle(16, 35, 10);
        amp.generateTexture('amphora', 32, 45);
        amp.destroy();

        // Forest Rock
        const rk = this.make.graphics({ x: 0, y: 0, add: false });
        rk.fillStyle(0x475569, 1);
        rk.fillRoundedRect(0, 0, 40, 40, 8);
        rk.fillStyle(0x334155, 1);
        rk.fillRect(5, 5, 10, 10);
        rk.generateTexture('rock', 40, 40);
        rk.destroy();
    }


    _createFloorTextures() {
        // Sand Floor
        const sf = this.make.graphics({ x: 0, y: 0, add: false });
        sf.fillStyle(0xfcd34d, 1);
        sf.fillRect(0, 0, 512, 64);
        sf.fillStyle(0xe9a800, 0.5);
        for (let i = 0; i < 100; i++) sf.fillCircle((i * 137) % 512, (i * 47) % 64, 1.5);
        sf.fillStyle(0xfff1f2, 1);
        // Manual "ellipse" using circle + rect or just circles for safety
        for (let i = 0; i < 5; i++) sf.fillCircle((i * 107) % 512, (i * 31) % 20, 4);
        sf.generateTexture('floor-sand', 512, 64);
        sf.destroy();
        console.log('[BootScene] Floor textures generated');

        // Marble Floor
        const mf = this.make.graphics({ x: 0, y: 0, add: false });
        mf.fillStyle(0xe2e8f0, 1);
        mf.fillRect(0, 0, 512, 64);
        mf.lineStyle(1, 0x94a3b8, 0.3);
        for (let i = 0; i < 10; i++) mf.strokeLineShape(new Phaser.Geom.Line(i * 64, 0, i * 64, 64));
        mf.lineStyle(1, 0x64748b, 0.1);
        for (let i = 0; i < 20; i++) {
            const x = (i * 83) % 512;
            mf.beginPath(); mf.moveTo(x, 0); mf.lineTo(x + (i % 5) * 4 - 10, 64); mf.strokePath();
        }
        mf.generateTexture('floor-marble', 512, 64);
        mf.destroy();

        // Neon Floor
        const nf = this.make.graphics({ x: 0, y: 0, add: false });
        nf.fillStyle(0x0f172a, 1);
        nf.fillRect(0, 0, 512, 64);
        nf.lineStyle(2, 0x06b6d4, 1);
        nf.strokeRect(0, 0, 512, 4);
        nf.generateTexture('floor-neon', 512, 64);
        nf.destroy();

        // Mossy Floor
        const ms = this.make.graphics({ x: 0, y: 0, add: false });
        ms.fillStyle(0x1a2e05, 1);
        ms.fillRect(0, 0, 512, 64);
        ms.fillStyle(0x3f6212, 1);
        for (let i = 0; i < 30; i++) {
            // Manual ellipse shape with rect/circle combo
            const ex = (i * 173) % 512;
            const ey = (i * 37) % 15;
            ms.fillCircle(ex - 10, ey, 5);
            ms.fillCircle(ex + 10, ey, 5);
            ms.fillRect(ex - 10, ey - 5, 20, 10);
            ms.fillStyle(0x4d7c0f, 0.5);
            ms.fillRect((i * 211) % 512, 0, 2, (i % 4) * 2 + 2);
        }
        ms.generateTexture('floor-moss', 512, 64);
        ms.destroy();
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
