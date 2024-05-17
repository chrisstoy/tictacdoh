import { css } from '@emotion/react';
import {
  GameState,
  useGameStore,
  usePreviousGameStates,
} from '../services/gameState';
import { Scoreboard } from '../components/Scoreboard';
import { GameBoard } from '../components/GameBoard';
import { useCallback, useEffect, useState } from 'react';
import { pickMove, pickRandomEmptyTile } from '../services/game';
import { BoardState, PlayerId, TileState } from '../types';
import { RewindControls } from '../components/RewindControls';

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
  if (!move || move === -1) {
    // failed to find a move.  sad.  just randomly pick a move
    console.log(`Picking a ranom move`);
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
    gameStore.initNewGame();
    previousGameStates.clear();
  }, []);

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
      }, 1000);
    }
  }, [gameStore, gameStore.turn, aiMoving, handleAIPickMove]);

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
      `}
    >
      <Scoreboard></Scoreboard>
      <div
        css={css`
          padding: 1em;
          margin: 1em;
          border: 4px solid black;
          border-radius: 1em;
          display: flex;
        `}
      >
        <GameBoard
          allowTileSelection={!gameStore.isGameOver()}
          highlightTiles={gameStore.winner?.line}
          onTileClick={handleTileClick}
        ></GameBoard>
      </div>

      <div
        css={css`
          display: flex;
          flex: 1 1 auto;
          align-items: center;
          justify-content: center;
          flex-direction: column;
        `}
      >
        <RewindControls></RewindControls>
        <div
          css={css`
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            width: 100%;
          `}
        >
          <button onClick={handleSetupGame}>New Game</button>
          <button disabled={gameStore.isGameOver()} onClick={handleAIPickMove}>
            Pick Move
          </button>
          <button disabled={!gameStore.isGameOver()} onClick={handleReplayGame}>
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}
