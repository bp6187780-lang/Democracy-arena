export interface Player {
  id: number;
  name: string;
  position: number; // cell ID
  score: number;
  isActive: boolean;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  winner: Player | null;
  turnNumber: number;
  lastRoll: number | null;
  gameStatus: 'setup' | 'playing' | 'finished';
}

export interface MoveResult {
  valid: boolean;
  fromCell: number;
  toCell: number;
  reason?: string;
  eliminatedPlayer?: Player;
  reachedGoal?: boolean;
  points?: number;
}

export type GameEvent =
  | { type: 'turn_start'; player: Player }
  | { type: 'dice_rolled'; player: Player; roll: number }
  | { type: 'move'; player: Player; from: number; to: number }
  | { type: 'elimination'; eliminated: Player; by: Player }
  | { type: 'reached_safe'; player: Player; cellId: number }
  | { type: 'reached_goal'; player: Player }
  | { type: 'game_over'; winner: Player };

export type GameEventListener = (event: GameEvent) => void;
