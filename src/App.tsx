import { useState } from 'react';
import { PlayGame } from './pages/PlayGame';
import { SetupGame } from './pages/SetupGame';
import { css } from '@emotion/react';
import { useGameStore } from './services/gameState';

type Mode = 'play' | 'new';

export default function App() {
  const gameStore = useGameStore();

  const [gameMode, setGameMode] = useState<Mode>('new');
  return (
    <div
      css={css`
        display: flex;
        flex: 1 1 auto;
      `}
    >
      {gameMode === 'play' && (
        <PlayGame
          onSetupGame={() => setGameMode('new')}
          onReplayGame={() => {
            gameStore.reset();
          }}
        ></PlayGame>
      )}
      {gameMode === 'new' && (
        <SetupGame onStartGame={() => setGameMode('play')}></SetupGame>
      )}
    </div>
  );
}
