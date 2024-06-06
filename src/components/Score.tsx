import { css } from '@emotion/react';
import { useGameStore } from '../services/gameState';

export function Score() {
  const gameStore = useGameStore();

  return (
    <div
      css={css`
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        font-size: 2rem;
      `}
    >
      <div>
        {gameStore.isDraw && <div>Draw</div>}
        {gameStore.winner !== undefined && (
          <div>
            <div>{gameStore.winner.player} Wins</div>
          </div>
        )}
      </div>
    </div>
  );
}
