import { useCallback, useEffect, useState } from 'react';
import { Button, View } from 'react-native';
import { GameBoard } from '@/screens/play/components/GameBoard';
import { pickNextMoveOnBoardForPlayer } from '@/services/game';
import {
  selectIsMatchOver,
  selectIsPlayerCPU,
  selectMatchWinner,
  selectNumberOfRoundsPlayed,
  selectPlayMode,
  selectRoundsInMatch,
  useMatchActions,
  useMatchStore,
} from '@/services/matchState';
import { selectAutoReplay, useOptionsStore } from '@/services/optionsState';
import {
  selectBoardState,
  selectIsGameOver,
  selectTurn,
  selectWinner,
  useRoundActions,
  useRoundStore,
} from '@/services/roundState';
import { PlayerId } from '@/types';
import { EndOfGame } from './components/EndOfGame';
import { EndOfMatch } from './components/EndOfMatch';
import { Scoreboard } from './components/Scoreboard';

const CPU_MOVE_DELAY_MS = 200; // how long to delay CPU moves
const AUTOPLAY_ROUND_DELAY_MS = 1000; // how long to delay between rounds
const AUTOPLAY_MATCH_DELAY_MS = 2000; // how long to delay between matches

interface Props {
  onExitGame: () => void;
}

export function PlayGameScreen({ onExitGame }: Props) {
  const { initNewRound, applyMove } = useRoundActions();
  const boardState = useRoundStore(selectBoardState);
  const currentTurn = useRoundStore(selectTurn);
  const roundWinner = useRoundStore(selectWinner);
  const isGameOver = useRoundStore(selectIsGameOver);
  const gameWinner = useRoundStore(selectWinner);

  const { initNewMatch, recordRound, setPlayMode } = useMatchActions();
  const isMatchOver = useMatchStore(selectIsMatchOver);
  const roundsInMatch = useMatchStore(selectRoundsInMatch);
  const roundsPlayed = useMatchStore(selectNumberOfRoundsPlayed);
  const isPlayerXCPU = useMatchStore(selectIsPlayerCPU('X'));
  const isPlayerOCPU = useMatchStore(selectIsPlayerCPU('O'));
  const matchWinner = useMatchStore(selectMatchWinner);
  const playMode = useMatchStore(selectPlayMode);

  const autoReplay = useOptionsStore(selectAutoReplay);

  const [aiMoving, setAIMoving] = useState(false);
  const [isDelaying, setIsDelaying] = useState(false);

  const isPlayerCPU = useCallback(
    (player: PlayerId) => (player === 'X' ? isPlayerXCPU : isPlayerOCPU),
    [isPlayerXCPU, isPlayerOCPU]
  );

  const handleTileClick = useCallback(
    (pickedTile: number) => {
      if (playMode !== 'PLAYING' || isPlayerCPU(currentTurn) || boardState[pickedTile] !== ' ') {
        return;
      }

      applyMove(pickedTile, currentTurn);
    },
    [playMode, isPlayerCPU, currentTurn, boardState, applyMove]
  );

  useEffect(() => {
    switch (playMode) {
      case 'SETUP_MATCH':
        initNewMatch();
        setPlayMode('SETUP_ROUND');
        break;

      case 'SETUP_ROUND':
        if (isMatchOver) {
          setPlayMode('MATCH_OVER');
          return;
        }

        initNewRound();
        setPlayMode('PLAYING');
        break;

      case 'PLAYING':
        if (isGameOver) {
          recordRound({
            boardState,
            winner: roundWinner,
          });
          setPlayMode('ROUND_OVER');
          return;
        }

        if (isPlayerCPU(currentTurn) && !aiMoving) {
          setAIMoving(true);
          setTimeout(() => {
            const pickedTile = pickNextMoveOnBoardForPlayer(boardState, currentTurn);
            applyMove(pickedTile, currentTurn);
            setAIMoving(false);
          }, CPU_MOVE_DELAY_MS);
        }
        break;

      case 'ROUND_OVER':
        if (autoReplay && !isDelaying) {
          setIsDelaying(true);
          setTimeout(() => {
            setIsDelaying(false);
            setPlayMode('SETUP_ROUND');
          }, AUTOPLAY_ROUND_DELAY_MS);
        }
        break;

      case 'MATCH_OVER':
        if (autoReplay && !isDelaying) {
          setIsDelaying(true);
          setTimeout(() => {
            setIsDelaying(false);
            setPlayMode('SETUP_MATCH');
          }, AUTOPLAY_MATCH_DELAY_MS);
        }
        break;
    }
  }, [
    aiMoving,
    autoReplay,
    currentTurn,
    initNewMatch,
    initNewRound,
    isDelaying,
    isMatchOver,
    isPlayerCPU,
    playMode,
    isGameOver,
    setPlayMode,
    boardState,
    applyMove,
    recordRound,
    roundWinner,
  ]);

  return (
    <View className="h-max flex-1 flex-col">
      <View className="h-1/5 flex-none m-2">
        <View className="h-full">
          <Scoreboard currentRound={roundsPlayed + 1} roundsInMatch={roundsInMatch}></Scoreboard>

          {playMode === 'ROUND_OVER' && (
            <View className="absolute top-0 left-0 h-full w-full flex-1 flex">
              <EndOfGame winner={roundWinner?.player}></EndOfGame>
            </View>
          )}

          {playMode === 'MATCH_OVER' && (
            <View className="absolute top-0 left-0 h-full w-full flex-1 flex">
              <EndOfMatch winner={matchWinner}></EndOfMatch>
            </View>
          )}
        </View>
      </View>

      <View className="flex flex-row flex-none">
        <GameBoard
          boardState={boardState}
          allowTileSelection={!isGameOver}
          highlightTiles={gameWinner?.line}
          onTileClick={handleTileClick}
        ></GameBoard>
      </View>

      <View className="flex-auto"></View>

      <View className="debug-green flex-none m-2">
        <View className="flex flex-row justify-center gap-16">
          {playMode === 'ROUND_OVER' && (
            <>
              <Button title="Next Round" onPress={() => setPlayMode('SETUP_ROUND')} />
              <Button title="Quit Game" onPress={onExitGame} />
            </>
          )}
          {playMode === 'MATCH_OVER' && (
            <>
              <Button title="New Match" onPress={() => setPlayMode('SETUP_MATCH')} />
              <Button title="Quit Game" onPress={onExitGame} />
            </>
          )}
          {playMode === 'PLAYING' && (
            <>
              <Button title="Quit Game" onPress={onExitGame} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}
