import { View } from 'react-native';
import { Tile } from '@/components/Tile';
import { TileState } from '@/types';
import { GameBoardImage } from '../../../components/images/GameBoardImage';

interface Props {
  boardState: TileState[];
  allowTileSelection: boolean;
  highlightTiles?: number[];

  onTileClick: (index: number) => void;
}

export function GameBoard({ boardState, allowTileSelection, highlightTiles, onTileClick }: Props) {
  return (
    <View className="w-full flex-auto aspect-square">
      <View>
        <GameBoardImage></GameBoardImage>
      </View>
      <View className="w-[82%] h-[82%] absolute top-[9%] left-[9%] grid grid-rows-3 grid-cols-3 gap-[1%]">
        {boardState.map((state, index) => (
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
