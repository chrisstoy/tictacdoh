import { useState } from 'react';
import { PlayGame } from './pages/PlayGame';
import { SetupGame } from './pages/SetupGame';
import { css } from '@emotion/react';
import { useGameStore, usePreviousGameStates } from './services/gameState';

type Mode = 'play' | 'new';

export default function App() {
  const gameStore = useGameStore();
  const previousGameStates = usePreviousGameStates();

  const [gameMode, setGameMode] = useState<Mode>('new');
  return (
    <div
      css={css`
        display: flex;
        flex: 1 1 auto;
        background-color: antiquewhite;

        button {
          padding: 0.25rem 0.5rem;
          border-radius: 0.5rem;
          border-color: saddlebrown;
          background: burlywood;
          color: white;
          font-weight: bold;
          font-size: large;

          &:disabled {
            color: darkgray;
            border-color: sandybrown;
          }
        }
      `}
    >
      {gameMode === 'play' && (
        <PlayGame
          onSetupGame={() => setGameMode('new')}
          onReplayGame={() => {
            gameStore.initNewGame();
            previousGameStates.clear();
          }}
        ></PlayGame>
      )}
      {gameMode === 'new' && (
        <SetupGame
          onStartGame={() => {
            gameStore.initNewGame();
            previousGameStates.clear();
            setGameMode('play');
          }}
        ></SetupGame>
      )}
    </div>
  );
}
