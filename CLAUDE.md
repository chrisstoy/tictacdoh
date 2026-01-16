# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tic-Tac-Doh is a React Native tic-tac-toe game built with Expo SDK 54, supporting iOS, Android, and web platforms. It features human vs human, human vs CPU, and CPU vs CPU gameplay with configurable match lengths.

## Development Commands

```bash
# Development
npm start              # Start Expo dev server (opens platform menu)
npm run ios            # Run on iOS simulator
npm run android        # Run on Android emulator
npm run web            # Run in browser

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage

# Code Quality
npm run lint           # Run ESLint
npm run format         # Format with Prettier
npm run format:check   # Check formatting

# Build & Deploy
npm run build          # Build web export
npm run deploy         # Build and deploy to EAS
```

## Architecture

### State Management (Zustand)

Three separate Zustand stores manage game state:

- **`matchState.ts`**: Match-level state (rounds in match, player types, scores, match winner). Controls the PlayMode state machine: `SETUP_MATCH` → `SETUP_ROUND` → `PLAYING` → `ROUND_OVER` → `MATCH_OVER`
- **`roundState.ts`**: Single round state (9-tile board, current turn, round winner/draw)
- **`optionsState.ts`**: Persisted user preferences (sound, music, auto-replay) stored in AsyncStorage

All stores use a custom `withZustandDevtools` wrapper and follow a consistent pattern: state → actions → selectors → action hooks.

### Screen Flow

Single-page app with mode-based navigation in `src/app/index.tsx`:
- `NEW` → SetupGameScreen (player selection, rounds configuration)
- `OPTIONS` → OptionsScreen (sound/music/auto-replay toggles)
- `PLAY` → PlayGameScreen (gameplay with state machine controlling flow)

### AI System

`game.ts` contains the CPU opponent logic:
- `solveBoard()`: Recursively builds game tree with minimax-style evaluation
- `pickMove()`: Selects move prioritizing: immediate win → block opponent win → random valid move
- `determineWinner()`: Checks 8 possible winning lines

### Styling

NativeWind (Tailwind for React Native) with custom color palette in `tailwind.config.js`:
- `dough-*`: Yellow/gold tones (background)
- `outline-*`: Dark browns (line art)
- `orange-*`: X piece colors
- `teal-*`: O piece colors

### Audio

`audioService.tsx` provides a React context for sound effects and background music via `expo-audio`. Controlled by options state.

## Path Aliases

```typescript
@/*        → src/*
@/assets/* → assets/*
```

## Test Location

Tests live alongside source files in `__test__` directories using `.spec.ts` extension.

## Web Build Notes

Web builds require SSR compatibility. Check `typeof window !== 'undefined'` before using browser-only APIs like AsyncStorage initialization.
