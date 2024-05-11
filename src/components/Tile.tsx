import { css } from '@emotion/react';
import { TileState } from '../types';
import { XTile } from './XTile';
import { OTile } from './OTile';

interface Props {
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

export function Tile({ state, allowMove, onClick, isOnWinningLine }: Props) {
  return (
    <div
      css={css`
        justify-content: center;
        align-items: center;
        display: flex;
        flex: 1 1 auto;
        background-color: ${isOnWinningLine ? 'lightgreen' : 'transparent'};

        ${allowMove && hoverCss}
      `}
      onClick={() => onClick?.()}
    >
      {state === 'X' && <XTile></XTile>}
      {state === 'O' && <OTile></OTile>}
    </div>
  );
}
