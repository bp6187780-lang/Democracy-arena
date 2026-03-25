# Hexagonal Board Game

A production-quality web game featuring hexagonal board gameplay with mobile-first responsive design, built with TypeScript and Vite.

## 🎮 Game Overview

This is a turn-based strategy game where players navigate across a hexagonal board to reach the goal. The game features:

- **Hexagonal grid system** using axial coordinates
- **Turn-based gameplay** with dice rolling mechanics
- **Strategic elements**: Safe zones, elimination mechanics, and scoring
- **Mobile-first design** with auto-scaling board
- **60 FPS performance** target on modern devices

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Access

- Development: `http://localhost:3000`
- Production build is in `dist/` directory

## 🏗️ Project Structure

```
src/
├── engine/          # Game rules, turns, win checks
│   ├── game-engine.ts    # Main game controller
│   ├── rules.ts          # Rule validation and win conditions
│   └── types.ts          # Type definitions
├── board/           # Hex grid generation, coordinate mapping, rendering
│   ├── hex-coordinates.ts  # Axial/cube coordinate system
│   ├── hex-grid.ts        # Grid generation and navigation
│   └── hex-renderer.ts    # Canvas-based rendering with mobile scaling
├── ui/              # Panels, indicators, controls
│   └── ui-controller.ts   # UI state management
├── perf/            # Timing utilities, throttling, memoization
│   └── timing.ts          # Performance utilities
├── main.ts          # Application entry point
└── style.css        # Responsive styling
```

## 📐 Hexagonal Coordinate System

This implementation uses **axial coordinates** (q, r) for hexagons with flat-top orientation.

### Coordinate System Documentation

- **Axial coordinates**: Simplifies storage and calculations
- **Cube coordinates**: Used internally for distance and neighbor calculations
- **Pixel coordinates**: For rendering and click detection

Reference: [Red Blob Games - Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/)

### Key Coordinate Operations

```typescript
// Distance between hexagons
HexCoordinates.distance(hexA, hexB)

// Get all neighbors
HexCoordinates.neighbors(hex)

// Convert to/from pixel space
HexCoordinates.axialToPixel(hex, size)
HexCoordinates.pixelToAxial(pixel, size)
```

## 🎯 Game Rules

### Core Mechanics

1. **Turn System**
   - Players take turns in order
   - Roll dice (1-6) to move forward
   - Execute move and check for special events

2. **Movement**
   - Move forward along the path by dice roll amount
   - Can land on: Normal cells, Safe zones, or Goal

3. **Elimination** (configurable)
   - Landing on an occupied normal cell eliminates the previous occupant
   - Eliminated players return to start
   - Safe zones protect from elimination

4. **Safe Zones** (configurable)
   - Marked with 'S' on the board
   - Award bonus points
   - Protect from elimination

5. **Win Condition**
   - First player to reach the goal cell wins
   - Score is tracked throughout the game

### Configurable Rules

```typescript
{
  canEliminate: boolean,          // Enable elimination mechanic
  safeZonesProtect: boolean,      // Safe zones prevent elimination
  bounceBackOnOvershoot: boolean, // Bounce back from goal if overshot
  goalRequiresExactRoll: boolean, // Must land exactly on goal
  pointsPerMove: number,          // Points for normal moves
  pointsForSafe: number,          // Points for safe zones
  pointsForGoal: number           // Points for reaching goal
}
```

## Reference Parity Mapping

| Reference Behavior | Implemented Behavior | Status |
|-------------------|---------------------|--------|
| Hexagonal board topology | Axial coordinate hexagonal grid with configurable shapes | ✅ Implemented |
| Turn-based gameplay | Sequential turn system with dice rolling | ✅ Implemented |
| Move validation | Rule-based validation with configurable options | ✅ Implemented |
| Win condition | First to goal with score tracking | ✅ Implemented |
| Elimination mechanics | Configurable elimination with safe zone protection | ✅ Implemented |
| Mobile responsiveness | Auto-scaling board with viewport fit | ✅ Implemented |
| Performance target | 60 FPS with RAF-based animation | ✅ Implemented |

## 📱 Mobile Fit Strategy

### Auto-Scaling Formula

The board automatically scales to fit any viewport while preserving hex proportions:

```typescript
// Calculate grid bounds
const boardWidth = maxX - minX + padding
const boardHeight = maxY - minY + padding

// Scale to fit viewport
const scaleX = viewportWidth / boardWidth
const scaleY = viewportHeight / boardHeight
const scale = min(scaleX, scaleY, 2.0)  // Cap at 2x for readability

// Center in viewport
offsetX = (viewportWidth - boardWidth * scale) / 2
offsetY = (viewportHeight - boardHeight * scale) / 2
```

### Mobile-First Breakpoints

- **320x568+** (iPhone SE): Full board visible, minimal UI
- **375x667** (iPhone 6/7/8): Comfortable spacing
- **390x844** (iPhone 12): Enhanced layout
- **768x1024** (iPad): Side-by-side layout with full controls

### Touch Target Sizes

- Minimum 44px for interactive elements (iOS guidelines)
- Hexagons scale proportionally while maintaining tap accuracy
- Buttons have minimum 44px height on touch devices

### Text Readability

- Body text: minimum 12px
- Key labels: minimum 14px
- Titles: minimum 16px (responsive scaling)

## ⚡ Performance Optimizations

### Implemented Optimizations

1. **Rendering**
   - Canvas 2D rendering for optimal mobile performance
   - Pixel ratio capped at 2x to prevent over-rendering
   - RequestAnimationFrame-based animation loop
   - Selective redraw during animations

2. **Layout Calculations**
   - **Precomputed neighbor relationships** cached at init
   - **Memoized coordinate conversions** for repeated calculations
   - **Batch DOM operations** using DOMBatcher utility
   - Board fit calculation cached and updated only on resize

3. **Event Handling**
   - **Debounced resize handlers** (100ms delay)
   - **Throttled input handlers** where applicable
   - Event delegation for efficient event management

4. **Animation**
   - Respects `prefers-reduced-motion` user preference
   - Short animation durations (120-220ms) for responsiveness
   - Easing functions for smooth motion

5. **Memory Management**
   - Cleanup of animation frames on component destroy
   - Map-based cell storage for O(1) lookups
   - Cached query selectors for DOM elements

### Performance Monitoring

The game includes a built-in performance monitor tracking:
- FPS (frames per second)
- Frame timing
- Long tasks detection

### Target Metrics Met

✅ 60 FPS during gameplay
✅ Input latency < 100ms
✅ Resize/orientation change < 200ms
✅ No layout thrashing (batched DOM operations)
✅ Reduced motion support

## 🎨 Responsive Layout

### Desktop (1024px+)
- Side-by-side layout with board and control panel
- Full-size controls and status displays
- Optimal hex sizing for mouse interaction

### Tablet (768px - 1023px)
- Maintained side-by-side layout
- Adjusted panel widths
- Touch-optimized controls

### Mobile Portrait (< 768px)
- Stacked layout: board on top, controls below
- Board takes 60% of viewport height
- Grid layout for player cards
- Compact status bar

### Mobile Landscape (< 500px height)
- Returns to side-by-side layout to maximize board space
- Compressed vertical spacing
- Scrollable control panel if needed

## 🛠️ Technologies Used

- **TypeScript 5.3+** - Type-safe development
- **Vite 5.0+** - Fast build tool and dev server
- **Canvas 2D API** - Hardware-accelerated rendering
- **CSS3** - Modern responsive design with flexbox/grid
- **Web APIs** - RequestAnimationFrame, MediaQuery

## 🔧 Configuration

### Grid Configuration

```typescript
const grid = new HexGrid({
  size: 40,              // Hex radius in pixels
  rings: 7,              // Grid size (7 = 28 hexagons for triangle)
  gridType: 'triangle'   // 'hexagon', 'triangle', or 'rectangle'
});

// Add safe zones
grid.setSafeZones(6);  // Distribute 6 safe zones evenly
```

### Game Configuration

```typescript
const engine = new GameEngine(grid, playerNames, {
  canEliminate: true,
  safeZonesProtect: true,
  bounceBackOnOvershoot: false,
  goalRequiresExactRoll: false
});
```

### Renderer Configuration

```typescript
const renderer = new HexRenderer(grid, {
  canvas: canvasElement,
  container: containerElement,
  colors: {
    normal: '#2c3e50',
    safe: '#27ae60',
    goal: '#f39c12',
    highlight: '#3498db',
    selected: '#9b59b6',
    player: ['#e74c3c', '#3498db', '#2ecc71', '#f39c12']
  }
});
```

## 📊 Testing

See [TESTING.md](TESTING.md) for comprehensive testing documentation including:
- Device viewport test matrix
- Manual test procedures
- Performance validation
- Accessibility checks

## 📝 License

MIT License - feel free to use this code for learning or production projects.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- TypeScript compilation passes (`npm run type-check`)
- Code follows existing patterns and architecture
- Performance targets are maintained
- Mobile responsiveness is preserved

## 📚 Additional Resources

- [Red Blob Games - Hexagonal Grids](https://www.redblobgames.com/grids/hexagons/) - Comprehensive hex grid guide
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) - Canvas rendering reference
- [Web.dev Performance](https://web.dev/performance/) - Performance best practices
