import { css } from '@emotion/react';
import { TileState } from '../types';
import { XTile } from './XTile';
import { OTile } from './OTile';

interface Props {
  index?: number;
  state: TileState;
  allowMove: boolean;
  isOnWinningLine: boolean;
  onClick?: () => void;
}

const hoverCss = css`
  &:hover {
    cursor: pointer;
    border-style: solid;
    border-width: 3px;
    border-color: lightgreen;
  }
`;

export function Tile({
  index,
  state,
  allowMove,
  isOnWinningLine,
  onClick,
}: Props) {
  return (
    <div
      css={css`
        position: relative;
        justify-content: center;
        align-items: center;
        display: flex;
        flex: 1 1 auto;
        background-color: ${isOnWinningLine ? 'lightgreen' : 'transparent'};

        ${allowMove && hoverCss}
      `}
      onClick={() => onClick?.()}
    >
      {typeof index !== 'undefined' && (
        <div
          css={css`
            position: absolute;
            top: 0.25rem;
            left: 0.25rem;
            color: rgba(0, 0, 0, 0.25);
          `}
        >
          {index}
        </div>
      )}
      {state === 'X' && <XTile></XTile>}
      {state === 'O' && <OTile></OTile>}
    </div>
  );
}
