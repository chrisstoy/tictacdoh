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
        flex-direction: row;
        justify-content: space-evenly;
      `}
    >
      <Player
        player={'X'}
        isCPU={false}
        playersTurn={gameStore.winner === undefined && gameStore.turn === 'X'}
      ></Player>
      <Score></Score>
      <Player
        player={'O'}
        isCPU={true}
        playersTurn={gameStore.winner === undefined && gameStore.turn === 'O'}
      ></Player>
    </div>
  );
}
