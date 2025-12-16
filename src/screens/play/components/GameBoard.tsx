import { View } from 'react-native';
import { useGameStore } from '@/services/gameState';
import { GameBoardImage } from '../../../components/images/GameBoardImage';

export function GameBoard() {
  const gameStore = useGameStore();

  return (
    <View className="w-full flex-auto aspect-square">
      <GameBoardImage></GameBoardImage>
      {gameStore.boardState.map((state, index) => (
        <div key={index}>
          {/* <Tile
            index={index}
            state={state}
            allowMove={allowTileSelection && state === ' '}
            isOnWinningLine={highlightTiles?.includes(index) ?? false}
            onClick={() => {
              onTileClick(index);
            }}
          /> */}
        </div>
      ))}
    </View>
  );
}
