import { View } from 'react-native';
import { Tile } from '@/components/Tile';
import { useGameStore } from '@/services/gameState';
import { GameBoardImage } from '../../../components/images/GameBoardImage';

interface Props {
  onTileClick: (index: number) => void;
  allowTileSelection: boolean;
  highlightTiles?: number[];
}

export function GameBoard({ allowTileSelection, highlightTiles, onTileClick }: Props) {
  const gameStore = useGameStore();

  return (
    <View className="w-full flex-auto aspect-square">
      <View>
        <GameBoardImage></GameBoardImage>
      </View>
      <View className="w-[82%] h-[82%] absolute top-[9%] left-[9%] grid grid-rows-3 grid-cols-3 gap-[1%]">
        {gameStore.boardState.map((state, index) => (
          <Tile
            key={index}
            className=""
            index={index}
            state={state}
            allowMove={allowTileSelection && state === ' '}
            isOnWinningLine={highlightTiles?.includes(index) ?? false}
            onClick={() => {
              onTileClick(index);
            }}
          />
        ))}
      </View>
    </View>
  );
}
