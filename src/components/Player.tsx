import { css } from '@emotion/react';
import { PlayerId } from '../types';

interface Props {
  player: PlayerId;
  playersTurn: boolean;
  isCPU: boolean;
}

export function Player({ player, playersTurn, isCPU }: Props) {
  return (
    <div
      css={css`
        border: thin solid black;
        padding: 0.5em;
        margin: 0.5em;
        border-radius: 0.5em;
        background-color: ${playersTurn ? 'lightgreen' : 'white'};
      `}
    >{`${isCPU ? 'CPU' : 'Player'}: ${player}`}</div>
  );
}
