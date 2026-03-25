import { HexGrid } from '../board/hex-grid';
import { Player, MoveResult } from './types';

export interface RuleSet {
  canEliminate: boolean;
  safeZonesProtect: boolean;
  bounceBackOnOvershoot: boolean;
  goalRequiresExactRoll: boolean;
  pointsPerMove: number;
  pointsForSafe: number;
  pointsForGoal: number;
}

export class GameRules {
  private grid: HexGrid;
  private rules: RuleSet;

  constructor(grid: HexGrid, rules: Partial<RuleSet> = {}) {
    this.grid = grid;
    this.rules = {
      canEliminate: true,
      safeZonesProtect: true,
      bounceBackOnOvershoot: true,
      goalRequiresExactRoll: false,
      pointsPerMove: 1,
      pointsForSafe: 2,
      pointsForGoal: 10,
      ...rules,
    };
  }

  /**
   * Validate if a move is legal
   */
  validateMove(player: Player, roll: number, players: Player[]): MoveResult {
    const currentCell = this.grid.getCellById(player.position);
    if (!currentCell) {
      return {
        valid: false,
        fromCell: player.position,
        toCell: player.position,
        reason: 'Invalid current position',
      };
    }

    // Calculate target cell
    const allCells = this.grid.getAllCells();
    const currentIndex = allCells.findIndex((c) => c.id === currentCell.id);
    let targetIndex = currentIndex + roll;

    // Handle overshoot
    const goalCell = this.grid.getGoalCell();
    const goalIndex = goalCell ? allCells.findIndex((c) => c.id === goalCell.id) : -1;

    if (targetIndex > allCells.length - 1) {
      if (this.rules.bounceBackOnOvershoot && goalIndex !== -1) {
        // Bounce back from goal
        const overshoot = targetIndex - goalIndex;
        targetIndex = goalIndex - overshoot;
        if (targetIndex < 0) targetIndex = 0;
      } else {
        targetIndex = allCells.length - 1;
      }
    }

    const targetCell = allCells[targetIndex];
    if (!targetCell) {
      return {
        valid: false,
        fromCell: currentCell.id,
        toCell: currentCell.id,
        reason: 'Invalid target cell',
      };
    }

    // Check for goal requirement
    if (this.rules.goalRequiresExactRoll && targetCell.type === 'goal') {
      if (targetIndex !== currentIndex + roll) {
        return {
          valid: false,
          fromCell: currentCell.id,
          toCell: currentCell.id,
          reason: 'Goal requires exact roll',
        };
      }
    }

    // Check for elimination
    let eliminatedPlayer: Player | undefined;
    const occupyingPlayer = players.find((p) => p.position === targetCell.id && p.id !== player.id);

    if (occupyingPlayer && this.rules.canEliminate) {
      // Check if target is safe zone
      if (this.rules.safeZonesProtect && targetCell.type === 'safe') {
        eliminatedPlayer = undefined; // Can't eliminate on safe zone
      } else if (targetCell.type !== 'goal') {
        eliminatedPlayer = occupyingPlayer;
      }
    }

    // Calculate points
    let points = this.rules.pointsPerMove;
    if (targetCell.type === 'safe') points = this.rules.pointsForSafe;
    if (targetCell.type === 'goal') points = this.rules.pointsForGoal;

    return {
      valid: true,
      fromCell: currentCell.id,
      toCell: targetCell.id,
      eliminatedPlayer,
      reachedGoal: targetCell.type === 'goal',
      points,
    };
  }

  /**
   * Get starting position
   */
  getStartingPosition(): number {
    const startCells = this.grid.getStartingCells();
    return startCells.length > 0 ? startCells[0].id : 0;
  }

  /**
   * Check if game is won
   */
  checkWinCondition(players: Player[]): Player | null {
    const goalCell = this.grid.getGoalCell();
    if (!goalCell) return null;

    const winner = players.find((p) => p.isActive && p.position === goalCell.id);
    return winner || null;
  }

  /**
   * Get rules
   */
  getRules(): RuleSet {
    return { ...this.rules };
  }
}
