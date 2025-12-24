import { useCallback, useEffect, useState } from 'react';
import { Button, View } from 'react-native';
import { GameBoard } from '@/screens/play/components/GameBoard';
import { pickMove, pickRandomEmptyTile } from '@/services/game';
import { useGameStore, usePreviousGameStates } from '@/services/gameState';
import { BoardState, PlayerId, TileState } from '@/types';
import { Scoreboard } from './components/Scoreboard';

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

export function PlayGameScreen({
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
    const move = pickNextMoveOnBoardForPlayer(gameStore.boardState, gameStore.turn);
    makeMoveForPlayer(move, gameStore.turn);
  }, [gameStore.boardState, gameStore.turn, makeMoveForPlayer]);

  useEffect(() => {
    if (!gameStore.isGameOver() && gameStore.isCPU[gameStore.turn] && !aiMoving) {
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
  }, [gameStore, gameStore.autoReplay, gameStore.turn, handleReplayGame, isDelaying]);

  const handleTileClick = (index: number) => {
    if (gameStore.boardState[index] !== ' ' || gameStore.winner !== undefined) {
      return;
    }
    makeMoveForPlayer(index, gameStore.turn);
  };

  return (
    <View className="h-max flex-1 flex-col">
      <View className="h-1/5 flex-none m-2">
        <View className="h-full">
          <Scoreboard></Scoreboard>
        </View>
      </View>

      <View className="flex flex-row flex-none">
        <GameBoard
          allowTileSelection={!gameStore.isGameOver()}
          highlightTiles={gameStore.winner?.line}
          onTileClick={handleTileClick}
        ></GameBoard>
      </View>

      <View className="flex-auto"></View>

      <View className="debug-green flex-none m-2">
        <View className="flex flex-row justify-center gap-16">
          {gameStore.isGameOver() ? (
            <>
              <Button title="Next Round" onPress={handleReplayGame} />
              <Button title="New Game" onPress={handleSetupGame} />
            </>
          ) : (
            <>
              <Button title="Quit Game" onPress={handleSetupGame} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}
