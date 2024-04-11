import { css } from '@emotion/react';
import { TileState } from '../types';

interface Props {
  state: TileState;
  allowMove: boolean;
  onClick?: () => void;
}

export function Tile({ state, allowMove, onClick }: Props) {
  return (
    <div
      css={css`
        justify-content: center;
        align-items: center;
        display: flex;
        flex: 1 1 auto;

        &:hover {
          cursor: pointer;
          border-style: solid;
          border-width: 3px;
          border-color: ${allowMove ? 'lightgreen' : 'red'};
        }
      `}
      onClick={() => onClick?.()}
    >
      {state === 'X' && <XTile></XTile>}
      {state === 'O' && <OTile></OTile>}
    </div>
  );
}

function XTile() {
  return (
    <img
      css={css`
        width: 75%;
      `}
      src="/src/assets/X.svg"
    ></img>
  );
}

function OTile() {
  return (
    <img
      css={css`
        width: 75%;
      `}
      src="/src/assets/O.svg"
    ></img>
  );
}
