// server/index.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*', // In production, restrict this to your frontend URL
        methods: ['GET', 'POST']
    }
});

const rooms = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('create-room', ({ playerName, playerColor, theme }) => {
        console.log(`[Server] create-room: name=${playerName}, color=${playerColor}, theme=${theme}`);
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const player = {
            id: socket.id,
            name: playerName || `Player ${socket.id.substring(0, 4)}`,
            color: playerColor || randomColor,
            ready: false,
            isHost: true,
            score: 0,
            distance: 0,
            isDead: false
        };

        rooms.set(roomCode, {
            code: roomCode,
            players: [player],
            gameStarted: false,
            seed: Math.floor(Math.random() * 1000000),
            theme: theme || 'default'
        });

        socket.join(roomCode);
        socket.emit('room-created', { roomCode, player });
        console.log(`Room created: ${roomCode} by ${socket.id}`);
    });

    socket.on('join-room', ({ roomCode, playerName, playerColor }) => {
        console.log(`[Server] join-room: room=${roomCode}, name=${playerName}, color=${playerColor}`);
        const room = rooms.get(roomCode);
        if (!room) {
            socket.emit('error', { message: 'Room not found' });
            return;
        }
        if (room.gameStarted) {
            socket.emit('error', { message: 'Game already in progress' });
            return;
        }
        if (room.players.length >= 4) {
            socket.emit('error', { message: 'Room is full' });
            return;
        }

        const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const player = {
            id: socket.id,
            name: playerName || `Player ${socket.id.substring(0, 4)}`,
            color: playerColor || randomColor,
            ready: false,
            isHost: false,
            score: 0,
            distance: 0,
            isDead: false
        };

        room.players.push(player);
        socket.join(roomCode);

        socket.emit('room-joined', { roomCode, player, players: room.players, seed: room.seed, theme: room.theme });
        socket.to(roomCode).emit('player-joined', { player });
        console.log(`User ${socket.id} joined room ${roomCode}`);
    });

    socket.on('player-ready', ({ roomCode, ready }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.ready = ready;
            io.to(roomCode).emit('player-ready-update', { playerId: socket.id, ready });

            // Auto-start if all ready and >= 2 players
            const allReady = room.players.every(p => p.ready);
            if (allReady && room.players.length >= 2) {
                room.gameStarted = true;
                io.to(roomCode).emit('start-game', {
                    seed: room.seed,
                    theme: room.theme,
                    players: room.players
                });
            }
        }
    });

    socket.on('player-update', ({ roomCode, state }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            // Delta compression: only send what's necessary (handled by client, server just relays)
            socket.to(roomCode).emit('remote-player-update', {
                playerId: socket.id,
                state
            });
        }
    });

    socket.on('player-color', ({ roomCode, color }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.color = color;
            io.to(roomCode).emit('remote-player-color', { playerId: socket.id, color });
        }
    });

    socket.on('player-died', ({ roomCode, finalScore, finalDistance }) => {
        const room = rooms.get(roomCode);
        if (!room) return;

        const player = room.players.find(p => p.id === socket.id);
        if (player) {
            player.isDead = true;
            player.score = finalScore;
            player.distance = finalDistance;
            io.to(roomCode).emit('remote-player-died', {
                playerId: socket.id,
                finalScore,
                finalDistance
            });

            // Check if all players are dead
            const allDead = room.players.every(p => p.isDead);
            if (allDead) {
                io.to(roomCode).emit('game-over-summary', { players: room.players });
                room.gameStarted = false;
                // Reset players for next match
                room.players.forEach(p => {
                    p.isDead = false;
                    p.ready = false;
                });
                io.to(roomCode).emit('player-ready-update', { playerId: null, ready: false, allReset: true });
            }
        }
    });

    socket.on('disconnecting', () => {
        for (const roomCode of socket.rooms) {
            const room = rooms.get(roomCode);
            if (room) {
                room.players = room.players.filter(p => p.id !== socket.id);
                if (room.players.length === 0) {
                    rooms.delete(roomCode);
                } else {
                    // If host left, assign new host
                    if (room.players.length > 0 && !room.players.some(p => p.isHost)) {
                        room.players[0].isHost = true;
                        io.to(roomCode).emit('player-joined', { player: room.players[0] }); // Just to trigger a roster refresh
                    }
                    socket.to(roomCode).emit('player-left', { playerId: socket.id });
                }
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Multiplayer server running on port ${PORT}`);
});
