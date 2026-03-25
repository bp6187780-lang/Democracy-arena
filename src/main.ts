import { HexGrid } from './board/hex-grid';
import { HexRenderer } from './board/hex-renderer';
import { GameEngine } from './engine/game-engine';
import { GameEvent } from './engine/types';
import { UIController } from './ui/ui-controller';
import { PerformanceMonitor, prefersReducedMotion } from './perf/timing';
import './style.css';

class Game {
  private grid!: HexGrid;
  private renderer!: HexRenderer;
  private engine!: GameEngine;
  private ui: UIController;
  private perfMonitor: PerformanceMonitor;
  private isRolling: boolean = false;
  private reducedMotion: boolean = false;

  constructor() {
    this.reducedMotion = prefersReducedMotion();
    this.perfMonitor = new PerformanceMonitor();

    // Initialize UI
    const appElement = document.getElementById('app')!;
    this.ui = new UIController(appElement);

    // Initialize game
    this.initGame();

    // Setup controls
    this.setupControls();

    // Start render loop
    this.startRenderLoop();
  }

  private initGame(): void {
    // Create hex grid (triangle shape, 7 rows)
    this.grid = new HexGrid({
      size: 40,
      rings: 7,
      gridType: 'triangle',
    });

    // Set safe zones
    this.grid.setSafeZones(6);

    // Create game engine
    const playerNames = ['Player 1', 'Player 2', 'Player 3'];
    this.engine = new GameEngine(this.grid, playerNames, {
      canEliminate: true,
      safeZonesProtect: true,
      bounceBackOnOvershoot: false,
      goalRequiresExactRoll: false,
    });

    // Create renderer
    const canvas = this.ui.getCanvas();
    const container = this.ui.getBoardContainer();
    this.renderer = new HexRenderer(this.grid, {
      canvas,
      container,
      colors: {
        normal: '#2c3e50',
        safe: '#27ae60',
        goal: '#f39c12',
        highlight: '#3498db',
        selected: '#9b59b6',
        player: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'],
      },
    });

    // Setup event listeners
    this.setupGameEvents();

    // Initial UI update
    this.updateUI();
  }

  private setupGameEvents(): void {
    this.engine.addEventListener((event: GameEvent) => {
      switch (event.type) {
        case 'turn_start':
          this.updateUI();
          this.ui.setRollEnabled(true);
          this.ui.showMessage(`${event.player.name}'s turn`, 'info');
          break;

        case 'dice_rolled':
          this.ui.showDiceRoll(event.roll, !this.reducedMotion);
          break;

        case 'move':
          const fromCell = this.grid.getCellById(event.from);
          const toCell = this.grid.getCellById(event.to);
          if (fromCell && toCell && !this.reducedMotion) {
            this.renderer.animateMove(fromCell, toCell, event.player.id, 200, () => {
              this.renderer.render();
              this.updateUI();
            });
          } else {
            this.renderer.render();
            this.updateUI();
          }
          break;

        case 'elimination':
          this.ui.showMessage(
            `${event.eliminated.name} was eliminated by ${event.by.name}!`,
            'warning'
          );
          break;

        case 'reached_safe':
          this.ui.showMessage(`${event.player.name} reached a safe zone!`, 'success');
          break;

        case 'reached_goal':
          this.ui.showMessage(`${event.player.name} reached the goal!`, 'success');
          break;

        case 'game_over':
          this.ui.setRollEnabled(false);
          this.ui.showWinner(event.winner);
          break;
      }
    });

    // Canvas click handler
    this.ui.getCanvas().addEventListener('click', (e) => {
      const cell = this.renderer.handleClick(e);
      if (cell) {
        this.renderer.setSelected(cell);
      }
    });
  }

  private setupControls(): void {
    // Roll button
    this.ui.getRollButton().addEventListener('click', () => {
      if (this.isRolling) return;
      this.isRolling = true;
      this.ui.setRollEnabled(false);

      const roll = this.engine.rollDice();

      setTimeout(() => {
        const result = this.engine.executeMove(roll);
        this.isRolling = false;

        if (!result.valid) {
          this.ui.showMessage(result.reason || 'Invalid move', 'error');
          this.ui.setRollEnabled(true);
        }
      }, this.reducedMotion ? 100 : 900);
    });

    // Reset button
    this.ui.getResetButton().addEventListener('click', () => {
      this.engine.reset();
      this.renderer.render();
      this.updateUI();
      this.ui.setRollEnabled(true);
    });
  }

  private updateUI(): void {
    const state = this.engine.getState();
    this.ui.updateStatus(state);
    this.ui.updatePlayers(state.players, state.currentPlayerIndex);
  }

  private startRenderLoop(): void {
    const animate = () => {
      this.perfMonitor.update();
      requestAnimationFrame(animate);
    };
    animate();
  }
}

// Start game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new Game());
} else {
  new Game();
}
