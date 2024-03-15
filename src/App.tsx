import { css } from '@emotion/react';
import { GameBoard } from './components/GameBoard';

function App() {
  return (
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
  );
}

export default App;
