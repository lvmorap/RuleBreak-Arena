# RuleBreak Arena

A competitive 3D multiplayer sports arena game with rotating game modes, inspired by the modular game mode style of Brawl Stars.

## 🎮 Game Overview

RuleBreak Arena is a fast-paced arena game where the rules change every 60 seconds, switching between different competitive sports-style modes. Up to 8 players can compete in real-time matches.

### Features

- **Fully 3D** - Built with Three.js for immersive 3D graphics
- **Up to 8 players** - Real-time multiplayer support
- **4 Game Modes** - Rotating automatically every 60 seconds
- **Physics-based** - Using Cannon-es for realistic interactions
- **Competitive** - Team-based and individual scoring

## 🏟 Game Modes

### 1. ⚽ Goal Mode (Soccer-style)
Score goals in enemy goals using a physics ball.
- 2 teams (4v4)
- First to 5 goals wins the mode
- Ball uses realistic physics

### 2. 🏐 Hold the Ball Mode
Hold the ball as long as possible to score points.
- Ball attaches to closest player
- Points earned per second while holding
- Push enemies to steal the ball

### 3. 💥 Elimination Mode
Push enemies off the arena platform.
- Players respawn after 5 seconds
- Each elimination gives 1 point
- Highest kills wins

### 4. 👑 King of the Tower
Climb and stay on top of the central tower.
- Only player on top earns points
- Continuous scoring per second
- Push others off to claim the throne

## 🎮 Controls

| Key | Action |
|-----|--------|
| W / A / S / D | Move |
| SHIFT | Dash |
| SPACE | Push |

## 🛠 Technology Stack

### Frontend / Rendering
- **Three.js** - 3D rendering
- **Cannon-es** - Physics engine
- **Vite** - Build tool / dev server

### Backend
- **Node.js** - Runtime
- **Express** - HTTP server
- **Socket.io** - Real-time multiplayer

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18.0.0 or higher
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/lvmorap/RuleBreak-Arena.git
cd RuleBreak-Arena
```

2. Install dependencies:
```bash
npm install
```

### Running the Game

#### Development Mode (recommended)
Run both server and client with hot reloading:
```bash
npm run dev
```
This starts:
- Server on `http://localhost:3001`
- Client on `http://localhost:3000`

#### Running Separately
Start the server:
```bash
npm run dev:server
```

In another terminal, start the client:
```bash
npm run dev:client
```

### Production Build
Build the client:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## 🎯 How to Play

1. Open the game in your browser at `http://localhost:3000`
2. You'll automatically join a match
3. Use WASD to move around the arena
4. Use SHIFT to dash (has cooldown)
5. Use SPACE to push nearby enemies
6. Follow the current game mode objectives
7. Every 60 seconds, the mode changes
8. After 5 minutes, the match ends and scores are tallied

## 📁 Project Structure

```
RuleBreak-Arena/
├── client/                 # Frontend code
│   ├── index.html         # HTML entry point
│   ├── main.js            # Client entry & game loop
│   ├── scene.js           # Three.js scene management
│   ├── player.js          # Player rendering
│   ├── ball.js            # Ball rendering
│   └── ui.js              # UI overlays
├── server/                 # Backend code
│   ├── server.js          # Main server & Socket.io
│   ├── gameManager.js     # Game state management
│   ├── physics.js         # Cannon-es physics
│   └── modes/             # Game modes
│       ├── goalMode.js
│       ├── holdMode.js
│       ├── eliminationMode.js
│       └── towerMode.js
├── shared/                 # Shared code
│   └── config.js          # Game constants
├── package.json
├── vite.config.js
├── ROADMAP.md             # Future development plans
└── README.md              # This file
```

## 🔧 Configuration

Game settings can be adjusted in `shared/config.js`:

- `MAX_PLAYERS` - Maximum players per match (default: 8)
- `MATCH_DURATION` - Total match time in seconds (default: 300)
- `MODE_DURATION` - Time per mode in seconds (default: 60)
- `PHYSICS.*` - Physics parameters
- `ARENA.*` - Arena dimensions

## 🐛 Troubleshooting

### "Cannot connect to server"
- Make sure the server is running (`npm run dev:server`)
- Check if port 3001 is available

### "Game is full"
- Maximum 8 players per match
- Wait for a slot or restart the server

### Physics issues
- Try refreshing the browser
- Check browser console for errors

## 📜 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please see the ROADMAP.md for planned features.
