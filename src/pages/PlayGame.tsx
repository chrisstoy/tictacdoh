import { css } from '@emotion/react';
import { useGameStore } from '../services/gameState';
import { Scoreboard } from '../components/Scoreboard';
import { GameBoard } from '../components/GameBoard';
import { useEffect } from 'react';

interface Props {
  onSetupGame: () => void;
  onReplayGame: () => void;
}
export function PlayGame({ onSetupGame, onReplayGame }: Props) {
  const gameStore = useGameStore();

  useEffect(() => {
    gameStore.reset();
  }, []);

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
        <GameBoard></GameBoard>
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
        <div
          css={css`
            display: flex;
            flex-direction: row;
            justify-content: space-around;
            width: 100%;
          `}
        >
          <button onClick={onSetupGame}>New Game</button>
          <button
            disabled={gameStore.winner === undefined}
            onClick={onReplayGame}
          >
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}
