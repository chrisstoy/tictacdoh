import { css } from '@emotion/react';
import { PlayerId } from '../types';
import { useGameStore } from '../services/gameState';

interface Props {
  player: PlayerId;
  playersTurn: boolean;
  isCPU: boolean;
}

export function Player({ player, playersTurn, isCPU }: Props) {
  const gameStore = useGameStore();

  return (
    <div
      css={css`
        display: flex;
        flex-direction: column;
        align-items: center;
      `}
    >
      <div
        css={css`
          border: thin solid black;
          padding: 0.5em;
          margin: 0.5em;
          border-radius: 0.5em;
          background-color: ${playersTurn ? 'lightgreen' : 'white'};
        `}
      >{`${isCPU ? 'CPU' : 'Player'}: ${player}`}</div>
      <div>{`Wins: ${gameStore.stats.wins[player]}`}</div>
    </div>
  );
}
