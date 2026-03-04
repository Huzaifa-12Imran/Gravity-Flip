// src/phaser/managers/NetworkManager.js
import { io } from 'socket.io-client';
import EventBus from '../../eventBus';

class NetworkManager {
    constructor() {
        this.socket = null;
        this.roomCode = null;
        this.player = null; // Local player data
        this.players = []; // All players in room
        this.isConnected = false;

        // Backend URL (Supports VITE_SERVER_URL environment variable for production)
        let rawUrl = (import.meta.env.VITE_SERVER_URL || 'http://localhost:3001').trim();

        // Ensure protocol exists
        if (rawUrl && !rawUrl.startsWith('http')) {
            rawUrl = 'https://' + rawUrl;
        }

        this.serverUrl = rawUrl;
        console.log('[NetworkManager] Target Server URL:', this.serverUrl);

        EventBus.on('color-change', (color) => {
            if (this.player) {
                console.log('[NetworkManager] Local color changed:', color);
                this.player.color = color;
                const me = this.players.find(p => p.id === this.player.id);
                if (me) me.color = color;
                this.sendColorUpdate(color);
                EventBus.emit('players-update', [...this.players]);
            }
        });
    }

    connect() {
        if (this.socket && this.socket.connected) return;
        if (this.socket) this.socket.disconnect();

        console.log('[NetworkManager] Initiating connection to:', this.serverUrl);

        // Remove 'transports' restriction to allow polling fallback if WS is blocked
        this.socket = io(this.serverUrl);

        this.socket.on('connect', () => {
            console.log('[NetworkManager] Successfully connected to server ID:', this.socket.id);
            this.isConnected = true;
            EventBus.emit('network-status', { connected: true });
        });

        this.socket.on('connect_error', (err) => {
            console.error('[NetworkManager] Connection failed:', err.message);
            this.isConnected = false;
            EventBus.emit('network-status', { connected: false });
        });

        this.socket.on('disconnect', () => {
            console.log('[NetworkManager] Disconnected from server');
            this.isConnected = false;
            EventBus.emit('network-status', { connected: false });
        });

        this.socket.on('room-created', ({ roomCode, player }) => {
            this.roomCode = roomCode;
            this.player = player;
            this.players = [player];

            // Force Sync: Ensure server uses our actual selected color
            const savedColor = sessionStorage.getItem('gf-player-color');
            if (savedColor) {
                this.player.color = savedColor;
                this.sendColorUpdate(savedColor);
            }

            EventBus.emit('room-update', { roomCode, player, players: this.players });
        });

        this.socket.on('room-joined', ({ roomCode, player, players, seed }) => {
            this.roomCode = roomCode;
            this.player = player;
            this.players = players;

            // Force Sync: Ensure server uses our actual selected color
            const savedColor = sessionStorage.getItem('gf-player-color');
            if (savedColor) {
                this.player.color = savedColor;
                this.sendColorUpdate(savedColor);
            }

            EventBus.emit('room-update', { roomCode, player, players: this.players, seed });
        });

        this.socket.on('player-joined', ({ player }) => {
            console.log('[NetworkManager] Player joined:', player.name);
            this.players.push(player);
            EventBus.emit('players-update', [...this.players]);
        });

        this.socket.on('player-left', ({ playerId }) => {
            console.log('[NetworkManager] Player left:', playerId);
            this.players = this.players.filter(p => p.id !== playerId);
            EventBus.emit('players-update', [...this.players]);
        });

        this.socket.on('player-ready-update', ({ playerId, ready, allReset }) => {
            if (allReset) {
                this.players.forEach(p => p.ready = false);
            } else {
                const p = this.players.find(p => p.id === playerId);
                if (p) p.ready = ready;
            }
            EventBus.emit('players-update', [...this.players]);
        });

        this.socket.on('remote-player-color', ({ playerId, color }) => {
            console.log('[NetworkManager] Remote color update:', playerId, color);
            const p = this.players.find(p => p.id === playerId);
            if (p) p.color = color;
            EventBus.emit('remote-player-color', { playerId, color });
            EventBus.emit('players-update', [...this.players]);
        });

        this.socket.on('start-game', ({ seed }) => {
            EventBus.emit('multiplayer-start', { seed });
        });

        this.socket.on('remote-player-update', ({ playerId, state }) => {
            EventBus.emit('remote-player-update', { playerId, state });
        });

        this.socket.on('remote-player-died', ({ playerId, finalScore, finalDistance }) => {
            const p = this.players.find(p => p.id === playerId);
            if (p) p.isDead = true;
            EventBus.emit('remote-player-died', { playerId, finalScore, finalDistance });
        });

        this.socket.on('game-over-summary', ({ players }) => {
            EventBus.emit('multiplayer-game-over', { players });
        });

        this.socket.on('error', ({ message }) => {
            EventBus.emit('network-error', message);
        });
    }

    createRoom(playerName, playerColor) {
        if (!this.isConnected) this.connect();
        this.socket.emit('create-room', { playerName, playerColor });
    }

    joinRoom(roomCode, playerName, playerColor) {
        if (!this.isConnected) this.connect();
        this.socket.emit('join-room', { roomCode, playerName, playerColor });
    }

    sendReady(ready) {
        if (this.socket && this.roomCode) {
            this.socket.emit('player-ready', { roomCode: this.roomCode, ready });
        }
    }

    sendColorUpdate(color) {
        if (this.socket && this.roomCode) {
            this.socket.emit('player-color', { roomCode: this.roomCode, color });
        }
    }

    sendUpdate(state) {
        if (this.socket && this.roomCode) {
            this.socket.emit('player-update', { roomCode: this.roomCode, state });
        }
    }

    sendDeath(finalScore, finalDistance) {
        if (this.socket && this.roomCode) {
            this.socket.emit('player-died', { roomCode: this.roomCode, finalScore, finalDistance });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
        }
    }
}

export default new NetworkManager();
