/* ============================================
   MAIN - Application Initializer
   ============================================ */

(function () {
    const registration = new Registration();
    const game = new Game();
    const scene = new GameScene();

    const PLAYER_COLORS_HEX = ['#00d4ff', '#ff6b35', '#00ff88', '#a855f7'];

    // DOM References
    const regScreen = document.getElementById('registration-screen');
    const gameScreen = document.getElementById('game-screen');
    const canvas = document.getElementById('game-canvas');
    const turnDot = document.getElementById('turn-dot');
    const turnText = document.getElementById('turn-text');
    const playersPanel = document.getElementById('players-panel');
    const rollBtn = document.getElementById('roll-btn');
    const diceResult = document.getElementById('dice-result');
    const dice3d = document.getElementById('dice-3d');
    const messageArea = document.getElementById('message-area');
    const winOverlay = document.getElementById('win-overlay');
    const winPlayer = document.getElementById('win-player');
    const winScore = document.getElementById('win-score');
    const restartBtn = document.getElementById('restart-btn');

    // Dice face rotation mappings
    const DICE_ROTATIONS = {
        1: { rx: 0, ry: 0 },
        2: { rx: 90, ry: 0 },
        3: { rx: 0, ry: -90 },
        4: { rx: 0, ry: 90 },
        5: { rx: -90, ry: 0 },
        6: { rx: 180, ry: 0 }
    };

    function switchToGame() {
        regScreen.classList.remove('active');
        gameScreen.classList.add('active');
    }

    function switchToRegistration() {
        gameScreen.classList.remove('active');
        winOverlay.classList.remove('active');
        regScreen.classList.add('active');
    }

    function buildPlayerPanels(players) {
        playersPanel.innerHTML = '';
        players.forEach((p, i) => {
            const card = document.createElement('div');
            card.className = 'player-card';
            card.id = `player-card-${i}`;
            card.innerHTML = `
                <div class="p-color" style="background:${p.color};color:${p.color}"></div>
                <div class="p-info">
                    <div class="p-name">${p.name}</div>
                    <div class="p-score">Score: <span id="p-score-${i}">0</span></div>
                </div>
            `;
            playersPanel.appendChild(card);
        });
    }

    function updateHUD() {
        const current = game.getCurrentPlayer();
        if (!current) return;

        turnDot.style.background = current.color;
        turnDot.style.color = current.color;
        turnText.textContent = `${current.name}'s Turn`;

        // Update scores and active card
        game.players.forEach((p, i) => {
            const scoreEl = document.getElementById(`p-score-${i}`);
            if (scoreEl) scoreEl.textContent = p.score;

            const card = document.getElementById(`player-card-${i}`);
            if (card) {
                card.classList.toggle('active-turn', i === game.currentTurn);
            }
        });

        rollBtn.disabled = game.rolling || game.moving || game.finished;

        // Update 3D positions
        scene.updatePlayerPositions(game.players, game.hexagons);
    }

    function showMessage(text, type) {
        const msg = document.createElement('div');
        msg.className = `game-message ${type || ''}`;
        msg.textContent = text;
        messageArea.innerHTML = '';
        messageArea.appendChild(msg);

        setTimeout(() => {
            if (msg.parentNode) msg.remove();
        }, 3000);
    }

    function showDiceResult(value) {
        diceResult.textContent = `Rolled: ${value}`;

        // Animate CSS dice
        const rot = DICE_ROTATIONS[value] || { rx: 0, ry: 0 };
        dice3d.style.setProperty('--final-rx', rot.rx + 'deg');
        dice3d.style.setProperty('--final-ry', rot.ry + 'deg');
        dice3d.classList.add('rolling');
        setTimeout(() => {
            dice3d.classList.remove('rolling');
            dice3d.style.transform = `translateZ(-30px) rotateX(${rot.rx}deg) rotateY(${rot.ry}deg)`;
        }, 1000);
    }

    // --- Registration callback ---
    registration.onStart = function (players) {
        switchToGame();

        // Initialize the 3D scene
        scene.init(canvas);

        // Initialize the game
        game.init(players);

        // Build 3D board & tokens
        scene.buildBoard(game.hexagons);
        scene.createPlayerTokens(game.players);

        // Build HUD
        buildPlayerPanels(game.players);
        updateHUD();
    };

    // --- Game callbacks ---
    game.onUpdate = updateHUD;

    game.onMove = function (player, position) {
        const hex = game.hexagons[position];
        if (hex) {
            scene.moveTokenTo(player.id, hex);
        }
    };

    game.onMessage = showMessage;

    game.onWin = function (player) {
        winPlayer.textContent = player.name;
        winPlayer.style.color = player.color;
        winScore.textContent = `Score: ${player.score}`;
        winOverlay.classList.add('active');
    };

    // --- Roll button ---
    rollBtn.addEventListener('click', () => {
        if (window.audioManager) window.audioManager.resume();
        const result = game.rollDice();
        if (result) showDiceResult(result);
    });

    // --- Restart ---
    restartBtn.addEventListener('click', () => {
        game.reset();
        scene.destroy();
        switchToRegistration();
    });

    // --- Init registration ---
    registration.init();
})();
