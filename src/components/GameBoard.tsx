import { css } from '@emotion/react';
import { useGameStore } from '../services/gameState';
import { Tile } from './Tile';

export function GameBoard() {
  const gameStore = useGameStore();

  const handleTileClick = (index: number) => {
    if (
      gameStore.boardState[index] !== undefined ||
      gameStore.winner !== undefined
    ) {
      return;
    }
    gameStore.setTileState(index, gameStore.turn);
    gameStore.setTurn(gameStore.turn === 'X' ? 'O' : 'X');
  };

  const borderForTile = (index: number) => {
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
        width: 100%;
      `}
    >
      {gameStore.boardState.map((state, index) => (
        <div
          key={index}
          css={css`
            aspect-ratio: 1/1;
            flex: 1 1 auto;
            display: flex;
            ${borderForTile(index)}
          `}
        >
          <Tile
            state={state}
            allowMove={state === undefined}
            isOnWinningLine={gameStore.winner?.line?.includes(index) ?? false}
            onClick={() => {
              handleTileClick(index);
            }}
          />
        </div>
      ))}
    </div>
  );
}
