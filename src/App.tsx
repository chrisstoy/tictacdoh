import { css } from '@emotion/react';
import { GameBoard } from './components/GameBoard';
import { useGameStore } from './services/gameState';
import { useEffect } from 'react';
import { Player } from './components/Player';
import { Score } from './components/Score';

function App() {
  const gameStore = useGameStore();

  useEffect(() => {
    gameStore.reset();
  }, []);

  return (
    <div>
      <div
        css={css`
          display: flex;
          flex-direction: row;
          justify-content: space-evenly;
        `}
      >
        <Player
          player={'X'}
          isCPU={false}
          playersTurn={gameStore.turn === 'X'}
        ></Player>
        <Score></Score>
        <Player
          player={'O'}
          isCPU={true}
          playersTurn={gameStore.turn === 'O'}
        ></Player>
      </div>

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
        {gameStore.isDraw && <div>Draw</div>}
        {gameStore.winner !== 'none' && <div>{gameStore.winner} won</div>}
        <button onClick={gameStore.reset}>Reset</button>
      </div>
    </div>
  );
}

export default App;
