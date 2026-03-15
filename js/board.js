/* ============================================
   BOARD GENERATOR - Honeycomb Triangle Grid
   Flat-top hexagons in a perfect honeycomb layout
   arranged as a triangular board
   ============================================ */

const SAFE_ZONES = [
    { name: 'Liberty',   icon: '🗽', color: 0x00d4ff, css: '#00d4ff' },
    { name: 'Election',  icon: '🗳️', color: 0x4488ff, css: '#4488ff' },
    { name: 'Media',     icon: '📡', color: 0x9944ff, css: '#9944ff' },
    { name: 'Policy',    icon: '📜', color: 0x00cc88, css: '#00cc88' },
    { name: 'Scandal',   icon: '⚡', color: 0xff4466, css: '#ff4466' },
    { name: 'Court',     icon: '⚖️', color: 0xff8844, css: '#ff8844' },
    { name: 'Protest',   icon: '✊', color: 0xffcc00, css: '#ffcc00' },
    { name: 'Equality',  icon: '🤝', color: 0x44ddff, css: '#44ddff' },
    { name: 'Justice',   icon: '🏛️', color: 0xaa66ff, css: '#aa66ff' },
];

class BoardGenerator {
    constructor() {
        this.hexagons = [];
        this.coreIndex = -1;
    }

    /**
     * Build a triangular honeycomb grid using axial coordinates.
     * Flat-top hexagons. Rows grow from 1 hex (top) to `size` hex (bottom).
     * The board is an equilateral triangle.
     */
    generate(size = 7) {
        this.hexagons = [];

        // We'll use axial (q, r) coordinates for flat-top hexes.
        // For a triangular grid: q >= 0, r >= 0, q + r < size
        const positions = [];
        for (let q = 0; q < size; q++) {
            for (let r = 0; r < size - q; r++) {
                positions.push({ q, r });
            }
        }

        // Convert axial to pixel (flat-top hex)
        const hexSize = 1.05; // radius
        const pixelPositions = positions.map(({ q, r }) => {
            const x = hexSize * (3 / 2 * q);
            const z = hexSize * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
            return { q, r, x, z };
        });

        // Center the board
        let cx = 0, cz = 0;
        pixelPositions.forEach(p => { cx += p.x; cz += p.z; });
        cx /= pixelPositions.length;
        cz /= pixelPositions.length;
        pixelPositions.forEach(p => { p.x -= cx; p.z -= cz; });

        // Find center of the triangle (centroid)
        // For axial triangle: centroid is near q=(size-1)/3, r=(size-1)/3
        const centroidQ = (size - 1) / 3;
        const centroidR = (size - 1) / 3;

        // Sort by distance from centroid (closest = center core)
        const withDist = pixelPositions.map(p => ({
            ...p,
            dist: Math.sqrt((p.q - centroidQ) ** 2 + (p.r - centroidR) ** 2 + (p.q - centroidQ) * (p.r - centroidR))
        }));

        withDist.sort((a, b) => a.dist - b.dist);
        const centerHex = withDist[0];

        // Create a spiral path from outer edge to center
        // Sort outermost first, then trace nearest-neighbor
        const outerFirst = [...withDist].reverse();

        const visited = new Set();
        const path = [];

        // Find the bottom-left corner as starting point
        let startHex = pixelPositions.reduce((best, h) => {
            const score = -h.x + h.z; // bottom-left preference
            const bestScore = -best.x + best.z;
            return score > bestScore ? h : best;
        });

        let current = startHex;
        const centerKey = `${centerHex.q},${centerHex.r}`;
        visited.add(`${current.q},${current.r}`);
        path.push(current);

        // Nearest-neighbor traversal (skip center until last)
        while (visited.size < pixelPositions.length - 1) {
            let nearest = null;
            let nearDist = Infinity;

            for (const h of pixelPositions) {
                const key = `${h.q},${h.r}`;
                if (visited.has(key)) continue;
                if (key === centerKey) continue;

                const d = Math.sqrt((h.x - current.x) ** 2 + (h.z - current.z) ** 2);
                if (d < nearDist) {
                    nearDist = d;
                    nearest = h;
                }
            }

            if (!nearest) break;
            visited.add(`${nearest.q},${nearest.r}`);
            path.push(nearest);
            current = nearest;
        }

        // Add center as final hex
        path.push(centerHex);

        const totalPath = path.length;

        // Assign safe zones evenly along the path
        const safeIndices = new Set();
        const usableRange = totalPath - 2; // skip first and last
        const spacing = Math.floor(usableRange / (SAFE_ZONES.length + 1));

        for (let i = 0; i < SAFE_ZONES.length; i++) {
            const idx = spacing * (i + 1);
            if (idx > 0 && idx < totalPath - 1) {
                safeIndices.add(idx);
            }
        }

        // Build hexagon data array
        let safeIdx = 0;
        for (let i = 0; i < path.length; i++) {
            const p = path[i];
            const isCenter = (i === path.length - 1);
            const isSafe = safeIndices.has(i) && safeIdx < SAFE_ZONES.length;

            let hexType = 'normal';
            let hexData = { name: '', icon: '', color: 0x1c2d44, css: '#1c2d44' };

            if (isCenter) {
                hexType = 'core';
                hexData = { name: 'DEMOCRACY CORE', icon: '⭐', color: 0xffd700, css: '#ffd700' };
            } else if (isSafe) {
                hexType = 'safe';
                hexData = SAFE_ZONES[safeIdx];
                safeIdx++;
            }

            this.hexagons.push({
                id: i,
                q: p.q,
                r: p.r,
                x: p.x,
                z: p.z,
                type: hexType,
                data: hexData,
                pathIndex: i,
                players: []
            });
        }

        this.coreIndex = this.hexagons.length - 1;
        return this.hexagons;
    }

    getHex(index) {
        return this.hexagons[index] || null;
    }

    getStartHex() {
        return 0;
    }

    getCoreIndex() {
        return this.coreIndex;
    }
}

window.BoardGenerator = BoardGenerator;
