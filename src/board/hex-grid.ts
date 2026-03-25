import { AxialCoord, HexCell, HexCoordinates, PixelCoord } from './hex-coordinates';

export interface HexGridConfig {
  size: number; // hex radius
  rings: number; // number of rings around center
  gridType: 'hexagon' | 'triangle' | 'rectangle';
}

export class HexGrid {
  private cells: Map<string, HexCell> = new Map();
  private cellArray: HexCell[] = [];
  private config: HexGridConfig;
  private neighborCache: Map<string, HexCell[]> = new Map();

  constructor(config: HexGridConfig) {
    this.config = config;
    this.generateGrid();
    this.precomputeNeighbors();
  }

  /**
   * Generate hexagonal grid based on configuration
   */
  private generateGrid(): void {
    let cellId = 0;

    switch (this.config.gridType) {
      case 'hexagon':
        this.generateHexagonGrid(cellId);
        break;
      case 'triangle':
        this.generateTriangleGrid(cellId);
        break;
      case 'rectangle':
        this.generateRectangleGrid(cellId);
        break;
    }

    // Sort cells by distance from center for easier path generation
    this.cellArray.sort((a, b) => {
      const distA = HexCoordinates.distance(a.coord, { q: 0, r: 0 });
      const distB = HexCoordinates.distance(b.coord, { q: 0, r: 0 });
      return distA - distB;
    });
  }

  /**
   * Generate hexagon-shaped grid
   */
  private generateHexagonGrid(startId: number): void {
    let cellId = startId;
    const rings = this.config.rings;

    for (let q = -rings; q <= rings; q++) {
      const r1 = Math.max(-rings, -q - rings);
      const r2 = Math.min(rings, -q + rings);
      for (let r = r1; r <= r2; r++) {
        const coord: AxialCoord = { q, r };
        const pixel = HexCoordinates.axialToPixel(coord, this.config.size);
        const cell: HexCell = {
          coord,
          pixel,
          type: 'normal',
          id: cellId++,
          occupiedBy: null,
        };
        this.cells.set(this.coordToKey(coord), cell);
        this.cellArray.push(cell);
      }
    }

    // Mark center as goal
    const centerKey = this.coordToKey({ q: 0, r: 0 });
    const centerCell = this.cells.get(centerKey);
    if (centerCell) {
      centerCell.type = 'goal';
    }
  }

  /**
   * Generate triangle-shaped grid
   */
  private generateTriangleGrid(startId: number): void {
    let cellId = startId;
    const size = this.config.rings;

    for (let q = 0; q < size; q++) {
      for (let r = 0; r < size - q; r++) {
        const coord: AxialCoord = { q, r };
        const pixel = HexCoordinates.axialToPixel(coord, this.config.size);
        const cell: HexCell = {
          coord,
          pixel,
          type: 'normal',
          id: cellId++,
          occupiedBy: null,
        };
        this.cells.set(this.coordToKey(coord), cell);
        this.cellArray.push(cell);
      }
    }

    // Mark approximate center as goal
    const centerCoord: AxialCoord = {
      q: Math.floor(size / 3),
      r: Math.floor(size / 3),
    };
    const centerKey = this.coordToKey(centerCoord);
    const centerCell = this.cells.get(centerKey);
    if (centerCell) {
      centerCell.type = 'goal';
    }
  }

  /**
   * Generate rectangle-shaped grid
   */
  private generateRectangleGrid(startId: number): void {
    let cellId = startId;
    const size = this.config.rings;

    for (let q = 0; q < size; q++) {
      const rOffset = Math.floor(q / 2);
      for (let r = -rOffset; r < size - rOffset; r++) {
        const coord: AxialCoord = { q, r };
        const pixel = HexCoordinates.axialToPixel(coord, this.config.size);
        const cell: HexCell = {
          coord,
          pixel,
          type: 'normal',
          id: cellId++,
          occupiedBy: null,
        };
        this.cells.set(this.coordToKey(coord), cell);
        this.cellArray.push(cell);
      }
    }
  }

  /**
   * Precompute neighbor relationships for performance
   */
  private precomputeNeighbors(): void {
    for (const [key, cell] of this.cells) {
      const neighbors = HexCoordinates.neighbors(cell.coord)
        .map((coord) => this.getCell(coord))
        .filter((c): c is HexCell => c !== null);
      this.neighborCache.set(key, neighbors);
    }
  }

  /**
   * Convert coordinate to string key
   */
  private coordToKey(coord: AxialCoord): string {
    return `${coord.q},${coord.r}`;
  }

  /**
   * Get cell at coordinate
   */
  getCell(coord: AxialCoord): HexCell | null {
    return this.cells.get(this.coordToKey(coord)) || null;
  }

  /**
   * Get cell by ID
   */
  getCellById(id: number): HexCell | null {
    return this.cellArray.find((c) => c.id === id) || null;
  }

  /**
   * Get all cells
   */
  getAllCells(): HexCell[] {
    return [...this.cellArray];
  }

  /**
   * Get neighbors of a cell (cached)
   */
  getNeighbors(cell: HexCell): HexCell[] {
    return this.neighborCache.get(this.coordToKey(cell.coord)) || [];
  }

  /**
   * Get cell at pixel coordinate
   */
  getCellAtPixel(pixel: PixelCoord): HexCell | null {
    const coord = HexCoordinates.pixelToAxial(pixel, this.config.size);
    return this.getCell(coord);
  }

  /**
   * Get goal cell
   */
  getGoalCell(): HexCell | null {
    return this.cellArray.find((c) => c.type === 'goal') || null;
  }

  /**
   * Get starting cells (furthest from goal)
   */
  getStartingCells(): HexCell[] {
    const goalCell = this.getGoalCell();
    if (!goalCell) return [this.cellArray[0]];

    // Get cells furthest from goal
    const maxDist = Math.max(
      ...this.cellArray.map((c) => HexCoordinates.distance(c.coord, goalCell.coord))
    );

    return this.cellArray.filter(
      (c) => HexCoordinates.distance(c.coord, goalCell.coord) === maxDist
    );
  }

  /**
   * Set safe zones evenly distributed
   */
  setSafeZones(count: number): void {
    const goalCell = this.getGoalCell();
    if (!goalCell) return;

    // Get cells at different distances from goal
    const cells = this.cellArray.filter((c) => c.type === 'normal');
    const distances = cells.map((c) => ({
      cell: c,
      dist: HexCoordinates.distance(c.coord, goalCell.coord),
    }));

    // Sort by distance
    distances.sort((a, b) => b.dist - a.dist);

    // Distribute safe zones evenly
    const step = Math.floor(distances.length / (count + 1));
    for (let i = 1; i <= count && i * step < distances.length; i++) {
      distances[i * step].cell.type = 'safe';
    }
  }

  /**
   * Get grid bounds for rendering
   */
  getBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const cell of this.cellArray) {
      minX = Math.min(minX, cell.pixel.x);
      maxX = Math.max(maxX, cell.pixel.x);
      minY = Math.min(minY, cell.pixel.y);
      maxY = Math.max(maxY, cell.pixel.y);
    }

    return { minX, maxX, minY, maxY };
  }

  /**
   * Get hex size
   */
  getHexSize(): number {
    return this.config.size;
  }
}
