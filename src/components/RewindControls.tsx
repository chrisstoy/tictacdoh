import { css } from '@emotion/react';
import { useGameStore, usePreviousGameStates } from '../services/gameState';
import { useCallback } from 'react';

export function RewindControls() {
  const gameState = useGameStore();
  const previousGameStates = usePreviousGameStates();

  const handleRewind = useCallback(() => {
    const lastState = previousGameStates.pop();
    if (lastState) {
      gameState.setState(lastState);
    }
  }, [gameState, previousGameStates]);

  return (
    <div
      css={css`
        display: flex;
        flex-direction: row;
        margin: 0.5rem;
      `}
    >
      <div
        css={css`
          margin-right: 1rem;
        `}
      >
        Previous States: {previousGameStates.previousStates.length}
      </div>
      <button
        onClick={handleRewind}
        disabled={!previousGameStates.previousStates.length}
      >
        Rewind
      </button>
    </div>
  );
}
