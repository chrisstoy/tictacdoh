import { css } from '@emotion/react';
import { PlayerId } from '../types';
import { XTile } from './XTile';
import { OTile } from './OTile';

interface Props {
  player: PlayerId;
  isCPU: boolean;
  onClick: () => void;
}
export function PlayerChoice({ player, isCPU, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      css={css`
        width: 20%;
        border-radius: 1rem;
        text-align: center;
        justify-content: center;
        align-items: center;
        display: flex;
        flex-direction: column;

        &:hover {
          cursor: pointer;
        }
      `}
    >
      {player === 'X' && <XTile></XTile>}
      {player === 'O' && <OTile></OTile>}
      <div>{isCPU ? 'CPU' : 'Meatbag'}</div>
    </div>
  );
}
