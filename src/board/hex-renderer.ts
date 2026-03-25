import { HexCell, PixelCoord } from './hex-coordinates';
import { HexGrid } from './hex-grid';

export interface RenderConfig {
  canvas: HTMLCanvasElement;
  container: HTMLElement;
  colors: {
    normal: string;
    safe: string;
    goal: string;
    highlight: string;
    selected: string;
    player: string[];
  };
}

export class HexRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private container: HTMLElement;
  private grid: HexGrid;
  private config: RenderConfig;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private highlightedCell: HexCell | null = null;
  private selectedCell: HexCell | null = null;
  private animationFrame: number = 0;
  private pixelRatio: number = 1;

  constructor(grid: HexGrid, config: RenderConfig) {
    this.grid = grid;
    this.config = config;
    this.canvas = config.canvas;
    this.container = config.container;
    const ctx = this.canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    this.ctx = ctx;

    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.setupCanvas();
    this.calculateBoardFit();
  }

  /**
   * Setup canvas with proper resolution
   */
  private setupCanvas(): void {
    const resize = () => {
      const rect = this.container.getBoundingClientRect();
      this.canvas.width = rect.width * this.pixelRatio;
      this.canvas.height = rect.height * this.pixelRatio;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.ctx.scale(this.pixelRatio, this.pixelRatio);
      this.calculateBoardFit();
      this.render();
    };

    // Debounced resize handler
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(resize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    resize();
  }

  /**
   * Calculate scale and offset to fit board in viewport (mobile-first)
   */
  private calculateBoardFit(): void {
    const bounds = this.grid.getBounds();
    const hexSize = this.grid.getHexSize();

    // Add padding for hex corners
    const padding = hexSize * 1.2;
    const boardWidth = bounds.maxX - bounds.minX + padding * 2;
    const boardHeight = bounds.maxY - bounds.minY + padding * 2;

    const containerWidth = this.canvas.width / this.pixelRatio;
    const containerHeight = this.canvas.height / this.pixelRatio;

    // Calculate scale to fit entire board
    const scaleX = containerWidth / boardWidth;
    const scaleY = containerHeight / boardHeight;
    this.scale = Math.min(scaleX, scaleY, 2); // Cap at 2x for readability

    // Center the board
    const scaledBoardWidth = boardWidth * this.scale;
    const scaledBoardHeight = boardHeight * this.scale;
    this.offsetX = (containerWidth - scaledBoardWidth) / 2 + (padding - bounds.minX) * this.scale;
    this.offsetY = (containerHeight - scaledBoardHeight) / 2 + (padding - bounds.minY) * this.scale;
  }

  /**
   * Transform pixel coordinates to screen space
   */
  private toScreen(pixel: PixelCoord): PixelCoord {
    return {
      x: pixel.x * this.scale + this.offsetX,
      y: pixel.y * this.scale + this.offsetY,
    };
  }

  /**
   * Transform screen coordinates to pixel space
   */
  private fromScreen(screen: PixelCoord): PixelCoord {
    return {
      x: (screen.x - this.offsetX) / this.scale,
      y: (screen.y - this.offsetY) / this.scale,
    };
  }

  /**
   * Draw a hexagon
   */
  private drawHex(cell: HexCell, fillColor: string, strokeColor?: string): void {
    const screen = this.toScreen(cell.pixel);
    const size = this.grid.getHexSize() * this.scale;

    this.ctx.save();
    this.ctx.beginPath();

    // Flat-top hexagon
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      const x = screen.x + size * Math.cos(angle);
      const y = screen.y + size * Math.sin(angle);
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.closePath();

    // Fill
    this.ctx.fillStyle = fillColor;
    this.ctx.fill();

    // Stroke
    if (strokeColor) {
      this.ctx.strokeStyle = strokeColor;
      this.ctx.lineWidth = Math.max(2, this.scale * 0.5);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  /**
   * Draw text centered in hexagon
   */
  private drawHexText(cell: HexCell, text: string, color: string = '#fff'): void {
    const screen = this.toScreen(cell.pixel);
    const size = this.grid.getHexSize() * this.scale;

    this.ctx.save();
    this.ctx.fillStyle = color;
    this.ctx.font = `bold ${Math.max(12, size * 0.4)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, screen.x, screen.y);
    this.ctx.restore();
  }

  /**
   * Draw player token on cell
   */
  private drawPlayer(cell: HexCell, playerId: number): void {
    const screen = this.toScreen(cell.pixel);
    const size = this.grid.getHexSize() * this.scale;
    const radius = size * 0.4;

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    this.ctx.fillStyle = this.config.colors.player[playerId % this.config.colors.player.length];
    this.ctx.fill();
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = Math.max(2, this.scale);
    this.ctx.stroke();

    // Player number
    this.ctx.fillStyle = '#fff';
    this.ctx.font = `bold ${Math.max(10, size * 0.3)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(`P${playerId + 1}`, screen.x, screen.y);
    this.ctx.restore();
  }

  /**
   * Main render method
   */
  render(): void {
    const width = this.canvas.width / this.pixelRatio;
    const height = this.canvas.height / this.pixelRatio;

    // Clear
    this.ctx.clearRect(0, 0, width, height);

    // Draw all hexagons
    const cells = this.grid.getAllCells();
    for (const cell of cells) {
      let fillColor = this.config.colors.normal;
      if (cell.type === 'safe') fillColor = this.config.colors.safe;
      if (cell.type === 'goal') fillColor = this.config.colors.goal;

      // Highlight or select
      if (this.selectedCell && cell.id === this.selectedCell.id) {
        fillColor = this.config.colors.selected;
      } else if (this.highlightedCell && cell.id === this.highlightedCell.id) {
        fillColor = this.config.colors.highlight;
      }

      this.drawHex(cell, fillColor, '#333');

      // Draw type indicator
      if (cell.type === 'goal') {
        this.drawHexText(cell, '★', '#fff');
      } else if (cell.type === 'safe') {
        this.drawHexText(cell, 'S', '#fff');
      }
    }

    // Draw players
    for (const cell of cells) {
      if (cell.occupiedBy !== null) {
        this.drawPlayer(cell, cell.occupiedBy);
      }
    }
  }

  /**
   * Handle click on canvas
   */
  handleClick(event: MouseEvent): HexCell | null {
    const rect = this.canvas.getBoundingClientRect();
    const screen: PixelCoord = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
    const pixel = this.fromScreen(screen);
    return this.grid.getCellAtPixel(pixel);
  }

  /**
   * Highlight a cell
   */
  setHighlight(cell: HexCell | null): void {
    this.highlightedCell = cell;
    this.render();
  }

  /**
   * Select a cell
   */
  setSelected(cell: HexCell | null): void {
    this.selectedCell = cell;
    this.render();
  }

  /**
   * Animate movement between cells
   */
  animateMove(
    fromCell: HexCell,
    toCell: HexCell,
    playerId: number,
    duration: number = 200,
    callback?: () => void
  ): void {
    const start = performance.now();
    const fromScreen = this.toScreen(fromCell.pixel);
    const toScreen = this.toScreen(toCell.pixel);

    const animate = (time: number) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = this.easeInOutCubic(progress);

      // Temporarily update render
      const tempX = fromScreen.x + (toScreen.x - fromScreen.x) * eased;
      const tempY = fromScreen.y + (toScreen.y - fromScreen.y) * eased;

      this.render();

      // Draw moving player
      const size = this.grid.getHexSize() * this.scale;
      const radius = size * 0.4;
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(tempX, tempY, radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.config.colors.player[playerId % this.config.colors.player.length];
      this.ctx.fill();
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = Math.max(2, this.scale);
      this.ctx.stroke();
      this.ctx.fillStyle = '#fff';
      this.ctx.font = `bold ${Math.max(10, size * 0.3)}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(`P${playerId + 1}`, tempX, tempY);
      this.ctx.restore();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
      } else {
        if (callback) callback();
        this.render();
      }
    };

    cancelAnimationFrame(this.animationFrame);
    this.animationFrame = requestAnimationFrame(animate);
  }

  /**
   * Easing function
   */
  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Clean up
   */
  destroy(): void {
    cancelAnimationFrame(this.animationFrame);
  }
}
