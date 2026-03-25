import { Player, GameState } from '../engine/types';

export class UIController {
  private container: HTMLElement;
  private statusElement: HTMLElement;
  private playersElement: HTMLElement;
  private messageElement: HTMLElement;
  private rollButton: HTMLButtonElement;
  private resetButton: HTMLButtonElement;
  private diceDisplay: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    this.render();

    this.statusElement = this.container.querySelector('#game-status')!;
    this.playersElement = this.container.querySelector('#players-panel')!;
    this.messageElement = this.container.querySelector('#game-message')!;
    this.rollButton = this.container.querySelector('#roll-btn')! as HTMLButtonElement;
    this.resetButton = this.container.querySelector('#reset-btn')! as HTMLButtonElement;
    this.diceDisplay = this.container.querySelector('#dice-display')!;
  }

  /**
   * Render initial UI structure
   */
  private render(): void {
    this.container.innerHTML = `
      <div class="game-ui">
        <div class="top-bar">
          <h1 class="game-title">Hexagonal Board Game</h1>
          <div id="game-status" class="game-status"></div>
        </div>

        <div class="main-content">
          <div class="board-container">
            <canvas id="game-canvas"></canvas>
          </div>

          <div class="side-panel">
            <div id="players-panel" class="players-panel"></div>

            <div id="game-controls" class="game-controls">
              <div id="dice-display" class="dice-display">?</div>
              <button id="roll-btn" class="btn btn-primary">Roll Dice</button>
              <button id="reset-btn" class="btn btn-secondary">Reset Game</button>
            </div>

            <div id="game-message" class="game-message"></div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update status display
   */
  updateStatus(state: GameState): void {
    const currentPlayer = state.players[state.currentPlayerIndex];
    this.statusElement.innerHTML = `
      <div class="status-content">
        <span class="turn-label">Turn ${state.turnNumber}</span>
        <span class="player-turn" style="color: var(--player-${currentPlayer.id}-color)">
          ${currentPlayer.name}'s Turn
        </span>
      </div>
    `;
  }

  /**
   * Update players panel
   */
  updatePlayers(players: Player[], currentPlayerId: number): void {
    this.playersElement.innerHTML = players
      .map(
        (player) => `
      <div class="player-card ${player.id === currentPlayerId ? 'active' : ''}">
        <div class="player-indicator" style="background: var(--player-${player.id}-color)"></div>
        <div class="player-info">
          <div class="player-name">${player.name}</div>
          <div class="player-stats">
            <span class="stat">Score: ${player.score}</span>
            <span class="stat">Pos: ${player.position}</span>
          </div>
        </div>
      </div>
    `
      )
      .join('');
  }

  /**
   * Show dice result
   */
  showDiceRoll(value: number, animated: boolean = true): void {
    if (animated) {
      this.animateDice(value);
    } else {
      this.diceDisplay.textContent = value.toString();
      this.diceDisplay.className = 'dice-display';
    }
  }

  /**
   * Animate dice roll
   */
  private animateDice(finalValue: number): void {
    let count = 0;
    const maxCount = 10;
    const interval = 80;

    this.diceDisplay.classList.add('rolling');

    const rollInterval = setInterval(() => {
      this.diceDisplay.textContent = (Math.floor(Math.random() * 6) + 1).toString();
      count++;

      if (count >= maxCount) {
        clearInterval(rollInterval);
        this.diceDisplay.textContent = finalValue.toString();
        this.diceDisplay.classList.remove('rolling');
        this.diceDisplay.classList.add('result');
        setTimeout(() => {
          this.diceDisplay.classList.remove('result');
        }, 500);
      }
    }, interval);
  }

  /**
   * Show message
   */
  showMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    this.messageElement.textContent = message;
    this.messageElement.className = `game-message ${type}`;
    this.messageElement.style.display = 'block';

    setTimeout(() => {
      this.messageElement.style.display = 'none';
    }, 3000);
  }

  /**
   * Show winner overlay
   */
  showWinner(player: Player): void {
    const overlay = document.createElement('div');
    overlay.className = 'winner-overlay';
    overlay.innerHTML = `
      <div class="winner-content">
        <h2 class="winner-title">🏆 Winner! 🏆</h2>
        <div class="winner-player" style="color: var(--player-${player.id}-color)">
          ${player.name}
        </div>
        <div class="winner-score">Final Score: ${player.score}</div>
        <button class="btn btn-primary" id="play-again-btn">Play Again</button>
      </div>
    `;

    this.container.appendChild(overlay);

    const playAgainBtn = overlay.querySelector('#play-again-btn') as HTMLButtonElement;
    playAgainBtn.addEventListener('click', () => {
      overlay.remove();
      this.resetButton.click();
    });
  }

  /**
   * Enable/disable roll button
   */
  setRollEnabled(enabled: boolean): void {
    this.rollButton.disabled = !enabled;
  }

  /**
   * Get roll button
   */
  getRollButton(): HTMLButtonElement {
    return this.rollButton;
  }

  /**
   * Get reset button
   */
  getResetButton(): HTMLButtonElement {
    return this.resetButton;
  }

  /**
   * Get canvas element
   */
  getCanvas(): HTMLCanvasElement {
    return this.container.querySelector('#game-canvas')! as HTMLCanvasElement;
  }

  /**
   * Get board container
   */
  getBoardContainer(): HTMLElement {
    return this.container.querySelector('.board-container')! as HTMLElement;
  }
}
