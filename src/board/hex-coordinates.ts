/**
 * Hexagonal coordinate system using axial coordinates (q, r)
 * Documentation: https://www.redblobgames.com/grids/hexagons/
 */

export interface AxialCoord {
  q: number;
  r: number;
}

export interface CubeCoord {
  q: number;
  r: number;
  s: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

export interface HexCell {
  coord: AxialCoord;
  pixel: PixelCoord;
  type: 'normal' | 'safe' | 'goal';
  id: number;
  occupiedBy: number | null; // player id
}

export class HexCoordinates {
  /**
   * Convert axial to cube coordinates
   */
  static axialToCube(hex: AxialCoord): CubeCoord {
    return {
      q: hex.q,
      r: hex.r,
      s: -hex.q - hex.r,
    };
  }

  /**
   * Convert cube to axial coordinates
   */
  static cubeToAxial(cube: CubeCoord): AxialCoord {
    return {
      q: cube.q,
      r: cube.r,
    };
  }

  /**
   * Get distance between two hexagons
   */
  static distance(a: AxialCoord, b: AxialCoord): number {
    const ac = this.axialToCube(a);
    const bc = this.axialToCube(b);
    return Math.max(
      Math.abs(ac.q - bc.q),
      Math.abs(ac.r - bc.r),
      Math.abs(ac.s - bc.s)
    );
  }

  /**
   * Get all neighbors of a hexagon
   */
  static neighbors(hex: AxialCoord): AxialCoord[] {
    const directions = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ];
    return directions.map((d) => ({ q: hex.q + d.q, r: hex.r + d.r }));
  }

  /**
   * Convert axial to pixel coordinates (flat-top orientation)
   */
  static axialToPixel(hex: AxialCoord, size: number): PixelCoord {
    const x = size * (3 / 2) * hex.q;
    const y = size * (Math.sqrt(3) / 2 * hex.q + Math.sqrt(3) * hex.r);
    return { x, y };
  }

  /**
   * Convert pixel to axial coordinates (flat-top orientation)
   */
  static pixelToAxial(pixel: PixelCoord, size: number): AxialCoord {
    const q = (2 / 3) * pixel.x / size;
    const r = (-1 / 3 * pixel.x + Math.sqrt(3) / 3 * pixel.y) / size;
    return this.roundAxial({ q, r });
  }

  /**
   * Round fractional axial coordinates to nearest hex
   */
  static roundAxial(hex: AxialCoord): AxialCoord {
    return this.cubeToAxial(this.roundCube(this.axialToCube(hex)));
  }

  /**
   * Round fractional cube coordinates to nearest hex
   */
  static roundCube(cube: CubeCoord): CubeCoord {
    let q = Math.round(cube.q);
    let r = Math.round(cube.r);
    let s = Math.round(cube.s);

    const qDiff = Math.abs(q - cube.q);
    const rDiff = Math.abs(r - cube.r);
    const sDiff = Math.abs(s - cube.s);

    if (qDiff > rDiff && qDiff > sDiff) {
      q = -r - s;
    } else if (rDiff > sDiff) {
      r = -q - s;
    } else {
      s = -q - r;
    }

    return { q, r, s };
  }

  /**
   * Check if two coordinates are equal
   */
  static equals(a: AxialCoord, b: AxialCoord): boolean {
    return a.q === b.q && a.r === b.r;
  }
}
