// src/utils/SeededRandom.js
/**
 * Simple seeded random number generator (LCC)
 * Ensures all players see the same obstacles based on the same seed.
 */
export default class SeededRandom {
    constructor(seed = 1) {
        this.seed = seed;
    }

    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    between(min, max) {
        return min + this.next() * (max - min);
    }

    integer(min, max) {
        return Math.floor(this.between(min, max + 1));
    }

    pick(array) {
        return array[this.integer(0, array.length - 1)];
    }
}
