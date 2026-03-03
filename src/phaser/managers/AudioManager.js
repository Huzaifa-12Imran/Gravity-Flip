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

    // --- Procedural Music System ---

    _initMusic() {
        if (this.musicGain) return;
        this.musicGain = this.ctx.createGain();
        this.musicGain.connect(this.ctx.destination);
        this.musicGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.isMusicPlaying = false;
        this.beatInterval = 0.4; // Seconds per beat
        this.currentNote = 0;
    }

    startMusic() {
        this._init();
        this._initMusic();
        if (this.isMusicPlaying) return;

        this.isMusicPlaying = true;
        this.musicGain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, this.ctx.currentTime + 1);
        this._scheduleNextBeat();
    }

    stopMusic() {
        if (!this.isMusicPlaying) return;
        this.isMusicPlaying = false;
        if (this.musicGain) {
            this.musicGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);
        }
    }

    _scheduleNextBeat() {
        if (!this.isMusicPlaying) return;

        const time = this.ctx.currentTime;
        this._playNote(time);

        // Schedule next beat
        setTimeout(() => this._scheduleNextBeat(), this.beatInterval * 1000);
    }

    _playNote(time) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Cyber sequence pattern: Root, Root, Octave, Fifth
        const pattern = [55, 55, 110, 82.4]; // A1, A1, A2, E2 (approx)
        const freq = pattern[this.currentNote % pattern.length];
        this.currentNote++;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, time);
        filter.frequency.exponentialRampToValueAtTime(100, time + this.beatInterval * 0.8);

        g.gain.setValueAtTime(0.3, time);
        g.gain.exponentialRampToValueAtTime(0.01, time + this.beatInterval * 0.9);

        osc.connect(filter);
        filter.connect(g);
        g.connect(this.musicGain);

        osc.start(time);
        osc.stop(time + this.beatInterval);
    }
}

export default new AudioManager();
