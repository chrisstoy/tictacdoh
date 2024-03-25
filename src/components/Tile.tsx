import { css } from '@emotion/react';
import { TileState } from '../types';

interface Props {
  state: TileState;
  onClick?: () => void;
}

export function Tile({ state, onClick }: Props) {
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
          border-color: rgba(0, 255, 0, 0.5);
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
