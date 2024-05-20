import { css } from '@emotion/react';
import { Player } from './Player';
import { Score } from './Score';
import { useGameStore } from '../services/gameState';

export function Scoreboard() {
  const gameStore = useGameStore();

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        margin: 1rem 0.5rem;
      `}
    >
      <div
        css={css`
          font-size: xx-large;
          justify-content: center;
          display: flex;
        `}
      >
        Round: {gameStore.stats.totalGames}
      </div>

      <div
        css={css`
          display: flex;
          flex-direction: row;
          justify-content: space-evenly;
          margin: 1rem;
        `}
      >
        <Player
          player={'X'}
          isCPU={gameStore.isCPU['X']}
          playersTurn={gameStore.winner === undefined && gameStore.turn === 'X'}
        ></Player>
        <Score></Score>
        <Player
          player={'O'}
          isCPU={gameStore.isCPU['O']}
          playersTurn={gameStore.winner === undefined && gameStore.turn === 'O'}
        ></Player>
      </div>
    </div>
  );
}
