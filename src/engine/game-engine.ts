import { HexGrid } from '../board/hex-grid';
import { GameRules, RuleSet } from './rules';
import { Player, GameState, MoveResult, GameEvent, GameEventListener } from './types';

export class GameEngine {
  private grid: HexGrid;
  private rules: GameRules;
  private state: GameState;
  private listeners: GameEventListener[] = [];

  constructor(grid: HexGrid, playerNames: string[], rules?: Partial<RuleSet>) {
    this.grid = grid;
    this.rules = new GameRules(grid, rules);

    // Initialize players
    const startPosition = this.rules.getStartingPosition();
    const players: Player[] = playerNames.map((name, index) => ({
      id: index,
      name,
      position: startPosition,
      score: 0,
      isActive: true,
    }));

    this.state = {
      players,
      currentPlayerIndex: 0,
      winner: null,
      turnNumber: 1,
      lastRoll: null,
      gameStatus: 'playing',
    };

    // Place players on starting cell
    const startCell = this.grid.getCellById(startPosition);
    if (startCell) {
      players.forEach((p) => {
        startCell.occupiedBy = p.id; // Note: This will overwrite, but for start it's ok
      });
    }

    this.emitEvent({ type: 'turn_start', player: this.getCurrentPlayer() });
  }

  /**
   * Roll dice and get result
   */
  rollDice(): number {
    const roll = Math.floor(Math.random() * 6) + 1;
    this.state.lastRoll = roll;
    this.emitEvent({
      type: 'dice_rolled',
      player: this.getCurrentPlayer(),
      roll,
    });
    return roll;
  }

  /**
   * Execute a move for current player
   */
  executeMove(roll: number): MoveResult {
    const currentPlayer = this.getCurrentPlayer();
    const result = this.rules.validateMove(
      currentPlayer,
      roll,
      this.state.players
    );

    if (!result.valid) {
      return result;
    }

    // Update cell occupancy
    const fromCell = this.grid.getCellById(result.fromCell);
    const toCell = this.grid.getCellById(result.toCell);

    if (fromCell && toCell) {
      // Clear old position
      if (fromCell.occupiedBy === currentPlayer.id) {
        fromCell.occupiedBy = null;
      }

      // Handle elimination
      if (result.eliminatedPlayer) {
        const eliminatedPlayer = result.eliminatedPlayer;
        eliminatedPlayer.position = this.rules.getStartingPosition();
        const startCell = this.grid.getCellById(eliminatedPlayer.position);
        if (startCell) {
          startCell.occupiedBy = eliminatedPlayer.id;
        }
        this.emitEvent({
          type: 'elimination',
          eliminated: eliminatedPlayer,
          by: currentPlayer,
        });
      }

      // Move player
      currentPlayer.position = result.toCell;
      currentPlayer.score += result.points || 0;
      toCell.occupiedBy = currentPlayer.id;

      this.emitEvent({
        type: 'move',
        player: currentPlayer,
        from: result.fromCell,
        to: result.toCell,
      });

      // Check for special cells
      if (toCell.type === 'safe') {
        this.emitEvent({
          type: 'reached_safe',
          player: currentPlayer,
          cellId: toCell.id,
        });
      }

      // Check win condition
      if (result.reachedGoal) {
        this.state.winner = currentPlayer;
        this.state.gameStatus = 'finished';
        this.emitEvent({ type: 'reached_goal', player: currentPlayer });
        this.emitEvent({ type: 'game_over', winner: currentPlayer });
      } else {
        // Next turn
        this.nextTurn();
      }
    }

    return result;
  }

  /**
   * Move to next turn
   */
  private nextTurn(): void {
    do {
      this.state.currentPlayerIndex =
        (this.state.currentPlayerIndex + 1) % this.state.players.length;
    } while (!this.state.players[this.state.currentPlayerIndex].isActive);

    if (this.state.currentPlayerIndex === 0) {
      this.state.turnNumber++;
    }

    this.state.lastRoll = null;
    this.emitEvent({ type: 'turn_start', player: this.getCurrentPlayer() });
  }

  /**
   * Get current player
   */
  getCurrentPlayer(): Player {
    return this.state.players[this.state.currentPlayerIndex];
  }

  /**
   * Get game state
   */
  getState(): GameState {
    return { ...this.state };
  }

  /**
   * Get all players
   */
  getPlayers(): Player[] {
    return [...this.state.players];
  }

  /**
   * Reset game
   */
  reset(): void {
    const startPosition = this.rules.getStartingPosition();

    // Clear all cells
    this.grid.getAllCells().forEach((cell) => {
      cell.occupiedBy = null;
    });

    // Reset players
    this.state.players.forEach((player) => {
      player.position = startPosition;
      player.score = 0;
      player.isActive = true;
    });

    // Reset state
    this.state.currentPlayerIndex = 0;
    this.state.winner = null;
    this.state.turnNumber = 1;
    this.state.lastRoll = null;
    this.state.gameStatus = 'playing';

    // Place players on starting cell
    const startCell = this.grid.getCellById(startPosition);
    if (startCell) {
      this.state.players.forEach((p) => {
        startCell.occupiedBy = p.id;
      });
    }

    this.emitEvent({ type: 'turn_start', player: this.getCurrentPlayer() });
  }

  /**
   * Add event listener
   */
  addEventListener(listener: GameEventListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(listener: GameEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: GameEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * Get grid
   */
  getGrid(): HexGrid {
    return this.grid;
  }

  /**
   * Get rules
   */
  getRules(): RuleSet {
    return this.rules.getRules();
  }
}
