// src/eventBus.js
// Singleton Phaser EventEmitter used as a React <-> Phaser bridge.
// React dispatches events TO Phaser (e.g. color-change).
// Phaser dispatches events TO React (e.g. score-update, game-over).

import Phaser from 'phaser';

const EventBus = new Phaser.Events.EventEmitter();

export default EventBus;
