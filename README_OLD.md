# 🏛️ Democracy Survival Arena

A **modern 3D board game** built with Three.js featuring a futuristic honeycomb hexagon grid, smooth animations, and strategic gameplay.

## 🎮 Game Overview

Players race across a triangular honeycomb board to reach the **Democracy Core** at the center. Along the way, they collect points, seek protection in Safe Zones, and can eliminate opponents by landing on their hexagons.

## ✅ Completed Features

### Registration Screen
- Animated game title with gradient effects
- Player count selection (2–4 players)
- Custom player name input with color-coded indicators
- Floating particle background animation
- Smooth screen transition to game

### 3D Game Board
- **Triangular honeycomb grid** (28 hexagons) using axial coordinates
- Flat-top hexagons perfectly aligned in honeycomb formation
- Three hexagon types with distinct visuals:
  - **Normal Hexagons** — Dark blue/grey, +1 point on landing
  - **Safe Zone Hexagons** — Colored and glowing, +1 point + elimination protection
  - **Democracy Core** — Gold center hex, win condition
- Path line connecting all hexagons in traversal order
- Canvas-based floating labels for special hexagons

### Safe Zones (9 zones with unique themes)
| Zone | Icon | Effect |
|------|------|--------|
| Liberty | 🗽 | +1 pt, protection |
| Election | 🗳️ | +1 pt, protection |
| Media | 📡 | +1 pt, protection |
| Policy | 📜 | +1 pt, protection |
| Scandal | ⚡ | +1 pt, protection |
| Court | ⚖️ | +1 pt, protection |
| Protest | ✊ | +1 pt, protection |
| Equality | 🤝 | +1 pt, protection |
| Justice | 🏛️ | +1 pt, protection |

### Game Mechanics
- **3D CSS dice roll animation** with correct face mapping
- **Step-by-step movement animation** with hop effect
- **Elimination system**: Landing on an occupied normal hex sends the previous occupant to START
- **Safe zone protection**: Players on safe zones cannot be eliminated
- **Overshoot bounce-back**: Players who roll past the core bounce back
- **Win detection**: First player to reach Democracy Core wins

### 3D Visuals (Three.js)
- ACES Filmic tone mapping with high-quality renderer
- PCF Soft shadow mapping
- Multi-light setup (hemisphere, directional key, fill, rim, point)
- Extruded hexagon geometry with bevel edges
- Animated gold particle system around Democracy Core
- Ambient floating particles throughout the scene
- Glowing ring effects on special hexagons
- Player tokens: Cylinder base + body + sphere head + glow ring
- Smooth camera following with lerp
- Fog effect for depth

### UI/HUD
- Real-time turn indicator with player color
- Player score and position cards
- Game message system (color-coded: gold for score, green for safe, red for elimination)
- 3D CSS dice with perspective transforms
- Victory overlay with trophy animation

### Audio
- Web Audio API synthesized sound effects:
  - Dice roll (cascading clicks)
  - Dice result (ascending tones)
  - Movement hop sounds
  - Safe zone chime (ascending melody)
  - Elimination alarm (descending sawtooth)
  - Victory fanfare (triumphant melody)
  - UI click feedback
  - Game start sequence

### Performance
- Optimized for 60 FPS
- Pixel ratio capped at 2x for mobile
- Minimal geometry (low-poly hexagons)
- Additive blending for particles (GPU efficient)
- Requestanimationframe-based animation loop
- Responsive layout for desktop and mobile

## 📁 Project Structure

```
index.html          — Main HTML with registration + game screens
css/
  style.css         — Complete styling (registration, HUD, dice, win overlay, responsive)
js/
  audio.js          — Web Audio API sound effects manager
  board.js          — Honeycomb triangle board generator (axial coordinates)
  game.js           — Core game engine (turns, rules, elimination, winning)
  scene.js          — Three.js 3D rendering (board, tokens, particles, camera)
  registration.js   — Registration screen UI logic
  main.js           — Application orchestrator (wiring everything together)
```

## 🌐 Entry URI

- **Main page**: `index.html` — Opens registration screen, transitions to game on START

## 🔧 Technologies Used

- **Three.js r160** — 3D WebGL rendering
- **Web Audio API** — Synthesized sound effects
- **CSS3** — 3D dice transforms, animations, glass-morphism
- **Font Awesome 6** — UI icons
- **Google Fonts** — Orbitron (titles), Rajdhani (body)

## 🚀 Recommended Next Steps

1. **Touch/drag camera control** — Allow players to rotate/zoom the 3D board
2. **AI opponents** — Add computer-controlled players
3. **Online multiplayer** — WebSocket-based real-time play
4. **Card events** — Random event cards when landing on special hexagons
5. **Board size options** — Small/medium/large board selection
6. **Persistent leaderboard** — Store high scores using Table API
7. **Custom themes** — Allow players to choose board color schemes
8. **Mobile haptic feedback** — Vibration on dice roll and elimination
