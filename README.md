# 🎮 Spellbound Maze

An educational spelling game where children navigate a magical maze by spelling words correctly. Features customizable player profiles, multiple difficulty levels, and beautiful themed mazes!

![Spellbound Maze](https://img.shields.io/badge/React-18.2-61dafb?logo=react) ![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue?logo=typescript) ![Vite](https://img.shields.io/badge/Vite-7.2-646cff?logo=vite)

## ✨ Features

### 🎨 **Multiple Players & Profiles**
- Create unlimited player profiles with unique avatars
- Custom maze themes (Forest, Ocean, Candy, Space, Sunset, Castle)
- Personalized word lists for each player
- Comprehensive progress tracking and analytics

### 📊 **Progress Tracking & Analytics**
- Track games played, words attempted, and accuracy rates
- Monitor current and best streaks
- View performance by difficulty level
- See most missed words for targeted practice
- Track time played and perfect games
- Weekly reset option for fresh tracking periods
- Parent-controlled progress clearing

### 📝 **Flexible Word Lists**
- Add custom words per player via the Settings menu
- Drag-and-drop to reorder words
- Import/export word lists
- Pre-loaded test data for quick setup

### 🎯 **Three Difficulty Levels**
- **Easy**: Only the letters needed (perfect for beginners)
- **Medium**: +2 random letters to challenge
- **Hard**: +5 random letters for experts
- Per-player difficulty settings

### 🔊 **Text-to-Speech Support**
- Choose from multiple voices
- Preview voices before selecting
- Automatic word pronunciation
- Customizable per player

### 🎨 **Beautiful UI**
- Shiny animated title with magical effects
- Themed mazes with custom colors
- Smooth animations and visual feedback
- Responsive design for all screen sizes
- Intuitive player selection with visual chips

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- Modern web browser (Chrome, Edge, Firefox)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/metros98/SpellboundMaze.git
   cd SpellboundMaze
   ```

2. **Install dependencies**
   ```bash
   cd react-app
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in `react-app/dist/`

## 🎮 How to Play

1. **Select or Create a Player**
   - Choose an existing player or create a new one
   - Customize avatar, theme, and voice

2. **Add Words**
   - Go to Settings → Select plor WASD to navigate the maze
   - Click on letters to collect them instantly
   - Press Space Bar to collect letters at your position
   - Collect letters in the correct order to spell the word
   - Complete all words to win!

5. **View Progress**
   - Select a player and click "My Stats"
   - See detailed performance metrics
   - Track improvement over time
   - Identify words that need more practice
3. **Choose Difficulty**
   - Easy: Perfect for learning
   - Medium: Adds challenge
   - Hard: Expert mode

4. **Start Game**
   - Select a player from the main menu
   - Click "Start Game"
   - Use arrow keys (⬆️⬇️⬅️➡️) to navigate the maze
   - Collect letters in the correct order to spell the word
   - Complete all words to win!

## 📁 Project Structure

```
SpellboundMaze/
├── react-app/              # Modern React application
│   ├── src/
│   │   ├── pages/          # React components (StartMenu, GameView, ProfileEditor)
│   │   ├── lib/            # Core game logic, audio, persistence
│   │   ├── styles/         # CSS themes
│   │   └── types.ts        # TypeScript interfaces
│   ├── public/             # Static assets (avatars)
│   └── dist/               # Production build
└── legacy/                 # Original vanilla JS version
```

## 🛠️ Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **HTML Canvas** - Maze rendering
- **Web Speech API** - Text-to-speech
- **Web Audio API** - Sound effects
- **LocalStorage** - Data persistence

## 🎨 Customization

### Adding Custom Avatars
Place avatar images in `react-app/public/avatars/` and update `CUSTOM_AVATARS` in `StartMenu.tsx`

### Creating New Themes
Add theme definitions to `MAZE_THEMES` in `StartMenu.tsx` with custom color palettes

### Voice Options
Voices are automatically detected from the browser's speech synthesis API

## 🆕 Recent Updates

### Version 1.2.0 (December 2025)
- ✅ **Comprehensive Progress Tracking** - Track games, accuracy, streaks, and performance metrics
- ✅ **Progress Dashboard** - Visual stats view with performance insights
- ✅ **Clear Progress Feature** - Reset stats weekly or when introducing new word lists
- ✅ **Bug Fixes** - Fixed keyboard scrolling and letter collection issues
- ✅ **Improved Controls** - Canvas auto-focus for immediate keyboard input
- ✅ **Audio Enhancements** - Reliable audio playback on all interactions

### Version 1.1.0 (November 2025)
- ✅ **Player Profiles** - Multiple player support with customization
- ✅ **Difficulty Levels** - Easy, Medium, and Hard modes
- ✅ **Themed Mazes** - 6 beautiful themes to choose from
- ✅ **Drag-and-Drop** - Reorder word lists easily
- ✅ **Voice Selection** - Multiple TTS voice options

## 💡 Future Enhancements

- [ ] Multiplayer mode
- [ ] Timed challenges
- [ ] Achievement badges
- [ ] Cloud sync for profiles
- [ ] Mobile app version
- [ ] Printable word lists and progress report
## 💡 Future Enhancements

- [ ] Multiplayer mode
- [ ] Timed challenges
- [ ] Achievement system
- [ ] Cloud sync for profiles
- [ ] Mobile app version
- [ ] Additional game modes

---

**Made with ❤️ for young learners**
