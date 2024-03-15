import { css } from '@emotion/react';
import { Tile } from './Tile';
import { TileState } from '../types';
import { useState } from 'react';

export function GameBoard() {
  const [boardState, setBoardState] = useState<TileState[]>([
    undefined,
    'X',
    'O',

    'X',
    undefined,
    'O',

    'X',
    'O',
    undefined,
  ]);

  const handleTileClick = (index: number) => {
    const curState = boardState[index];
    const nextState =
      curState === undefined ? 'X' : curState === 'X' ? 'O' : undefined;

    const newBoardState = [...boardState];
    newBoardState[index] = nextState;
    setBoardState(newBoardState);
  };

  const borderRight = `
    border-right: 2px solid black;
  `;

  const borderBottom = `
    border-bottom: 2px solid black;
  `;

  const borderLeft = `
    border-left: 2px solid black;
  `;

  const borderTop = `
    border-top: 2px solid black;
  `;

  const borderForTile = (index: number) => {
    switch (index) {
      case 0:
        return borderBottom + borderRight;
      case 1:
        return borderBottom;
      case 2:
        return borderBottom + borderLeft;
      case 3:
        return borderRight;
      case 4:
        return '';
      case 5:
        return borderLeft;
      case 6:
        return borderTop + borderRight;
      case 7:
        return borderTop;
      case 8:
        return borderTop + borderLeft;
    }
  };

  return (
    <div
      css={css`
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        grid: 1em;
      `}
    >
      {boardState.map((state, index) => (
        <div css={css`${borderForTile(index)}}`}>
          <Tile
            key={index}
            state={state}
            onClick={() => {
              handleTileClick(index);
            }}
          />
        </div>
      ))}
    </div>
  );
}
