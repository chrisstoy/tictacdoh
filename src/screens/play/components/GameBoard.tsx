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
    <View className="w-full flex-1 aspect-square">
      <View>
        <GameBoardImage></GameBoardImage>
      </View>
      <View className="w-[82%] h-[82%] absolute top-[9%] left-[9%] flex-row flex-wrap">
        {boardState.map((state, index) => (
          <Tile
            key={index}
            className=""
            style={{ width: '33.33%', height: '33.33%' }}
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
