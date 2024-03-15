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
        aspect-ratio: 1/1;
        justify-content: center;
        align-items: center;
        display: flex;

        &:hover {
          cursor: pointer;
          border-style: solid;
          border-width: 3px;
          border-color: rgba(0, 255, 0, 0.5);
        }
      `}
      onClick={() => onClick?.()}
    >
      {state === 'X' && (
        <img
          css={css`
            width: 75%;
          `}
          src="/src/assets/X.svg"
        ></img>
      )}
      {state === 'O' && (
        <img
          css={css`
            width: 75%;
          `}
          src="/src/assets/O.svg"
        ></img>
      )}
      {state === undefined && <span></span>}
    </div>
  );
}
