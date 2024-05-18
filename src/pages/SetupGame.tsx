import { css } from '@emotion/react';
import { PlayerChoice } from '../components/PlayerChoice';
import { useGameStore } from '../services/gameState';

interface Props {
  onStartGame: () => void;
}

export function SetupGame({ onStartGame }: Props) {
  const gameStore = useGameStore();

  return (
    <div
      css={css`
        display: flex;
        flex: 1 1 auto;
        align-items: center;
        flex-direction: column;
        justify-content: center;
      `}
    >
      <h1
        css={css`
          font-size: 3.5rem;
          text-shadow: black 3px 2px 10px;
          color: white;
          text-align: center;
        `}
      >
        Tic Tac DOH!
      </h1>
      <div
        css={css`
          justify-content: center;
          align-items: center;
          display: flex;
          flex-direction: column;
          margin: 2rem 0;
        `}
      >
        <h2>Choose Players</h2>
        <div
          css={css`
            flex-direction: row;
            display: flex;
            justify-content: space-evenly;
            font-size: x-large;
            margin: 1em;
          `}
        >
          <PlayerChoice
            player="X"
            isCPU={gameStore.isCPU['X']}
            onClick={() => {
              gameStore.setIsCPU('X', !gameStore.isCPU['X']);
            }}
          ></PlayerChoice>
          <PlayerChoice
            player="O"
            isCPU={gameStore.isCPU['O']}
            onClick={() => {
              gameStore.setIsCPU('O', !gameStore.isCPU['O']);
            }}
          ></PlayerChoice>
        </div>
      </div>
      <div>
        <button
          onClick={() => {
            onStartGame();
          }}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
