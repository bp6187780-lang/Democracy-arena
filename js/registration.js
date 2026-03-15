/* ============================================
   REGISTRATION - Player Setup & Screen Handling
   ============================================ */

class Registration {
    constructor() {
        this.playerCount = 3;
        this.playerColors = ['#00d4ff', '#ff6b35', '#00ff88', '#a855f7'];
        this.playerNames = [];
        this.onStart = null;
    }

    init() {
        this.setupCountButtons();
        this.setupStartButton();
        this.renderNameInputs();
        this.createParticles();
    }

    setupCountButtons() {
        const buttons = document.querySelectorAll('.count-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.audioManager) window.audioManager.click();
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.playerCount = parseInt(btn.dataset.count, 10);
                this.renderNameInputs();
            });
        });
    }

    renderNameInputs() {
        const grid = document.getElementById('names-grid');
        grid.innerHTML = '';

        for (let i = 0; i < this.playerCount; i++) {
            const wrapper = document.createElement('div');
            wrapper.className = 'name-input-wrapper';

            const dot = document.createElement('div');
            dot.className = 'player-dot';
            dot.style.background = this.playerColors[i];
            dot.style.boxShadow = `0 0 8px ${this.playerColors[i]}`;

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = `Player ${i + 1}`;
            input.maxLength = 16;
            input.dataset.index = i;

            if (this.playerNames[i]) {
                input.value = this.playerNames[i];
            }

            input.addEventListener('input', () => {
                this.playerNames[i] = input.value.trim();
            });

            wrapper.appendChild(dot);
            wrapper.appendChild(input);
            grid.appendChild(wrapper);
        }
    }

    setupStartButton() {
        const btn = document.getElementById('start-btn');
        btn.addEventListener('click', () => {
            if (window.audioManager) {
                window.audioManager.init();
                window.audioManager.startGame();
            }

            const players = [];
            for (let i = 0; i < this.playerCount; i++) {
                const name = this.playerNames[i] || `Player ${i + 1}`;
                players.push({ name, color: this.playerColors[i] });
            }

            if (typeof this.onStart === 'function') {
                this.onStart(players);
            }
        });
    }

    createParticles() {
        const container = document.getElementById('bg-particles');
        for (let i = 0; i < 30; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.left = Math.random() * 100 + '%';
            p.style.animationDelay = Math.random() * 8 + 's';
            p.style.animationDuration = 6 + Math.random() * 6 + 's';
            container.appendChild(p);
        }
    }
}

window.Registration = Registration;
