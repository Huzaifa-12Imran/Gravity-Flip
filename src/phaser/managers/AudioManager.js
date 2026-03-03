// src/phaser/managers/AudioManager.js
// Procedural Audio Manager: Generates "Cyber" sounds using Web Audio API.

class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterVolume = 0.4;
    }

    _init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Short glitchy blip for UI/Menu
    playBlip(freq = 880, duration = 0.1) {
        this._init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // Smooth sine glide for Gravity Flip
    playFlip(isUp) {
        this._init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const duration = 0.2;

        osc.type = 'sine';
        const startFreq = isUp ? 220 : 440;
        const endFreq = isUp ? 440 : 220;

        osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(this.masterVolume * 0.5, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    // White noise burst for Death/Shatter
    playShatter() {
        this._init();
        const duration = 0.5;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start();
    }

    // Protocol initiation pulse
    playStart() {
        this._init();
        const duration = 0.8;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(440, this.ctx.currentTime + duration);

        gain.gain.setValueAtTime(0, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, this.ctx.currentTime + 0.1);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }
}

export default new AudioManager();
