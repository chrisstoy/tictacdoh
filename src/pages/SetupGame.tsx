import { css } from '@emotion/react';
import { PlayerChoice } from '../components/PlayerChoice';
import { useState } from 'react';

interface Props {
  onStartGame: () => void;
}

export function SetupGame({ onStartGame }: Props) {
  const [isCPUX, setIsCPUX] = useState(false);
  const [isCPUO, setIsCPUO] = useState(false);

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
      <h1>Tic Tac DOH!</h1>
      <div
        css={css`
          justify-content: center;
          align-items: center;
          display: flex;
          flex-direction: column;
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
            isCPU={isCPUX}
            onClick={() => {
              setIsCPUX(!isCPUX);
            }}
          ></PlayerChoice>
          <PlayerChoice
            player="O"
            isCPU={isCPUO}
            onClick={() => {
              setIsCPUO(!isCPUO);
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
