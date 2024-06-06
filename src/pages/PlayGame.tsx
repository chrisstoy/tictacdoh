import { css } from '@emotion/react';
import { useGameStore, usePreviousGameStates } from '../services/gameState';
import { Scoreboard } from '../components/Scoreboard';
import { GameBoard } from '../components/GameBoard';
import { useCallback, useEffect, useState } from 'react';
import { pickMove, pickRandomEmptyTile } from '../services/game';
import { BoardState, PlayerId, TileState } from '../types';
import { GameControls } from '../components/GameControls';

const CPU_MOVE_DELAY_MS = 200;

interface Props {
  onSetupGame: () => void;
  onReplayGame: () => void;
}

const pickNextMoveOnBoardForPlayer = (board: TileState[], player: PlayerId) => {
  const boardState: BoardState = {
    board,
    player,
    move: 0,
    victoryState: 'none',
    children: [],
  };

  let move = pickMove(boardState);
  if (move === undefined || move === -1) {
    // failed to find a move.  sad.  just randomly pick a move
    move = pickRandomEmptyTile(board);
  }

  return move;
};

export function PlayGame({
  onSetupGame: handleSetupGame,
  onReplayGame: handleReplayGame,
}: Props) {
  const gameStore = useGameStore();
  const previousGameStates = usePreviousGameStates();

  const [aiMoving, setAIMoving] = useState(false);

  const [isDelaying, setIsDelaying] = useState(false);

  const makeMoveForPlayer = useCallback(
    (move: number, player: PlayerId) => {
      previousGameStates.push(gameStore);
      gameStore.setTileState(move, player);
      gameStore.setTurn(player === 'X' ? 'O' : 'X');
    },
    [gameStore, previousGameStates]
  );

  const handleAIPickMove = useCallback(() => {
    const move = pickNextMoveOnBoardForPlayer(
      gameStore.boardState,
      gameStore.turn
    );
    makeMoveForPlayer(move, gameStore.turn);
  }, [gameStore.boardState, gameStore.turn, makeMoveForPlayer]);

  useEffect(() => {
    if (
      !gameStore.isGameOver() &&
      gameStore.isCPU[gameStore.turn] &&
      !aiMoving
    ) {
      setAIMoving(true);
      setTimeout(() => {
        handleAIPickMove();
        setAIMoving(false);
      }, CPU_MOVE_DELAY_MS);
    }
  }, [gameStore, gameStore.turn, aiMoving, handleAIPickMove]);

  useEffect(() => {
    if (gameStore.isGameOver() && gameStore.autoReplay && !isDelaying) {
      setIsDelaying(true);
      setTimeout(() => {
        setIsDelaying(false);
        handleReplayGame();
      }, CPU_MOVE_DELAY_MS * 2);
    }
  }, [
    gameStore,
    gameStore.autoReplay,
    gameStore.turn,
    handleReplayGame,
    isDelaying,
  ]);

  const handleTileClick = (index: number) => {
    if (gameStore.boardState[index] !== ' ' || gameStore.winner !== undefined) {
      return;
    }
    makeMoveForPlayer(index, gameStore.turn);
  };

  return (
    <div
      css={css`
        flex: 1 1 auto;
        justify-content: space-between;
        display: flex;
        flex-direction: column;
        border: 2px solid red;
      `}
    >
      <div
        css={css`
          flex: 2 2 auto;
        `}
      ></div>
      <Scoreboard></Scoreboard>
      <div
        css={css`
          margin: 1rem;
          border: 4px solid black;
          border-radius: 1rem;
          display: flex;
          flex: 1 1 auto;
          aspect-ratio: 1 / 1;
        `}
      >
        <GameBoard
          allowTileSelection={!gameStore.isGameOver()}
          highlightTiles={gameStore.winner?.line}
          onTileClick={handleTileClick}
        ></GameBoard>
      </div>
      <GameControls
        onSetupGame={handleSetupGame}
        onReplayGame={handleReplayGame}
        onAIPickMove={handleAIPickMove}
      ></GameControls>
      <div
        css={css`
          flex: 2 2 auto;
        `}
      ></div>
    </div>
  );
}
