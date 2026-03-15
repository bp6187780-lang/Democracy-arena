/* ============================================
   GAME ENGINE - Turns, Dice, Movement & Rules
   ============================================ */

class Game {
    constructor() {
        this.players = [];
        this.board = null;
        this.hexagons = [];
        this.currentTurn = 0;
        this.rolling = false;
        this.moving = false;
        this.finished = false;
        this.onUpdate = null;
        this.onMove = null;
        this.onMessage = null;
        this.onWin = null;
    }

    init(playerData) {
        const gen = new BoardGenerator();
        this.hexagons = gen.generate(7);
        this.board = gen;

        this.players = playerData.map((p, i) => ({
            id: i,
            name: p.name,
            color: p.color,
            position: 0,
            score: 0,
            eliminated: false
        }));

        // Place all players on the start hex
        const startHex = this.hexagons[0];
        this.players.forEach(p => {
            startHex.players.push(p.id);
        });

        this.currentTurn = 0;
        this.rolling = false;
        this.moving = false;
        this.finished = false;

        if (this.onUpdate) this.onUpdate();
    }

    getCurrentPlayer() {
        return this.players[this.currentTurn];
    }

    rollDice() {
        if (this.rolling || this.moving || this.finished) return;

        const player = this.getCurrentPlayer();
        if (player.eliminated) {
            this.nextTurn();
            return;
        }

        this.rolling = true;

        if (window.audioManager) window.audioManager.diceRoll();

        const result = Math.floor(Math.random() * 6) + 1;

        setTimeout(() => {
            this.rolling = false;
            if (window.audioManager) window.audioManager.diceResult();
            this.movePlayer(player, result);
        }, 1000);

        return result;
    }

    movePlayer(player, steps) {
        this.moving = true;
        const coreIndex = this.board.getCoreIndex();
        const oldPos = player.position;
        let newPos = Math.min(oldPos + steps, coreIndex);

        // Remove player from old hex
        const oldHex = this.hexagons[oldPos];
        oldHex.players = oldHex.players.filter(id => id !== player.id);

        // Animate step by step
        let currentStep = oldPos;
        const stepInterval = setInterval(() => {
            currentStep++;
            if (currentStep > newPos) {
                clearInterval(stepInterval);
                this.landOnHex(player, newPos);
                return;
            }
            if (window.audioManager) window.audioManager.move();
            if (this.onMove) this.onMove(player, currentStep);
        }, 250);
    }

    landOnHex(player, position) {
        player.position = position;
        const hex = this.hexagons[position];
        hex.players.push(player.id);

        if (window.audioManager) window.audioManager.land();

        // Check win condition
        if (hex.type === 'core') {
            player.score += 5;
            this.finished = true;
            if (window.audioManager) window.audioManager.victory();
            if (this.onWin) this.onWin(player);
            if (this.onUpdate) this.onUpdate();
            this.moving = false;
            return;
        }

        // Score points
        player.score += 1;

        // Check hex type
        if (hex.type === 'safe') {
            if (window.audioManager) window.audioManager.safeZone();
            if (this.onMessage) {
                this.onMessage(`${hex.data.icon} ${player.name} reached ${hex.data.name}! Protected zone.`, 'safezone');
            }
        } else {
            // Check for elimination (landing on occupied non-safe hex)
            const otherPlayers = hex.players.filter(id => id !== player.id);
            if (otherPlayers.length > 0 && hex.type !== 'safe') {
                otherPlayers.forEach(otherId => {
                    const other = this.players[otherId];
                    // Send them back to start
                    hex.players = hex.players.filter(id => id !== otherId);
                    other.position = 0;
                    this.hexagons[0].players.push(otherId);

                    if (window.audioManager) window.audioManager.elimination();
                    if (this.onMessage) {
                        this.onMessage(`⚡ ${player.name} eliminated ${other.name}! Sent back to START.`, 'elimination');
                    }
                    if (this.onMove) this.onMove(other, 0);
                });
            }
        }

        if (this.onUpdate) this.onUpdate();
        this.moving = false;

        // Auto next turn after a short delay
        setTimeout(() => this.nextTurn(), 800);
    }

    nextTurn() {
        if (this.finished) return;

        let next = (this.currentTurn + 1) % this.players.length;
        let attempts = 0;
        while (this.players[next].eliminated && attempts < this.players.length) {
            next = (next + 1) % this.players.length;
            attempts++;
        }

        // If all players are eliminated, end the game
        if (attempts >= this.players.length) {
            this.finished = true;
            return;
        }

        this.currentTurn = next;

        if (this.onUpdate) this.onUpdate();
    }

    reset() {
        this.hexagons.forEach(h => { h.players = []; });
        this.players = [];
        this.currentTurn = 0;
        this.rolling = false;
        this.moving = false;
        this.finished = false;
    }
}

window.Game = Game;
