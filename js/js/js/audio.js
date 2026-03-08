/* ============================================
   AUDIO MANAGER - Web Audio API Sound Effects
   ============================================ */

class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterGain = null;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.ctx.destination);
        } catch (e) {
            this.enabled = false;
        }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', gainVal = 0.15) {
        if (!this.enabled || !this.ctx) return;
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    diceRoll() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this.playTone(200 + Math.random() * 400, 0.05, 'square', 0.06);
            }, i * 80);
        }
    }

    diceResult() {
        this.playTone(600, 0.15, 'sine', 0.12);
        setTimeout(() => this.playTone(800, 0.2, 'sine', 0.1), 100);
    }

    move() {
        this.playTone(440 + Math.random() * 200, 0.08, 'sine', 0.08);
    }

    land() {
        this.playTone(523, 0.12, 'sine', 0.1);
        setTimeout(() => this.playTone(659, 0.15, 'sine', 0.08), 60);
    }

    safeZone() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.2, 'sine', 0.1), i * 80);
        });
    }

    elimination() {
        this.playTone(400, 0.3, 'sawtooth', 0.1);
        setTimeout(() => this.playTone(250, 0.4, 'sawtooth', 0.08), 150);
    }

    victory() {
        const melody = [523, 659, 784, 1047, 784, 1047, 1319];
        melody.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.3, 'sine', 0.12), i * 120);
        });
    }

    click() {
        this.playTone(800, 0.05, 'sine', 0.08);
    }

    startGame() {
        const notes = [262, 330, 392, 523];
        notes.forEach((n, i) => {
            setTimeout(() => this.playTone(n, 0.25, 'sine', 0.1), i * 150);
        });
    }
}

window.audioManager = new AudioManager();
