import { css } from '@emotion/react';
import { useGameStore } from '../services/gameState';
import { RewindControls } from './RewindControls';

interface Props {
  enableRewind?: boolean;
  onSetupGame: () => void;
  onReplayGame: () => void;
  onAIPickMove: () => void;
}

export function GameControls({
  onSetupGame: handleSetupGame,
  onReplayGame: handleReplayGame,
  onAIPickMove: handleAIPickMove,
  enableRewind = false,
}: Props) {
  const gameStore = useGameStore();

  return (
    <div
      css={css`
        align-items: center;
        display: flex;
        flex-direction: column;
        flex: 0 0 auto;
        justify-content: center;
        margin: 1rem 0;
      `}
    >
      {enableRewind && <RewindControls></RewindControls>}
      <div
        css={css`
          display: flex;
          flex-direction: row;
          justify-content: space-around;
          width: 100%;
        `}
      >
        <button onClick={handleSetupGame}>New Game</button>
        <button
          disabled={gameStore.isGameOver() || gameStore.isCPU[gameStore.turn]}
          onClick={handleAIPickMove}
        >
          AI Pick Move
        </button>
        <div
          css={css`
            display: flex;
            flex-direction: column;
          `}
        >
          <button disabled={!gameStore.isGameOver()} onClick={handleReplayGame}>
            Replay
          </button>
          <div
            css={css`
              justify-content: center;
              align-items: center;
              display: flex;
            `}
          >
            <label>Auto</label>
            <input
              type="checkbox"
              checked={gameStore.autoReplay}
              onChange={() => gameStore.setAutoReplay(!gameStore.autoReplay)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
