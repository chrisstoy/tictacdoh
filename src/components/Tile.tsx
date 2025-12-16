import { TileState } from '../types';
import { OImage } from './images/OImage';
import { XImage } from './images/XImage';

interface Props {
  index?: number;
  state: TileState;
  allowMove: boolean;
  isOnWinningLine: boolean;
  onClick?: () => void;
}

export function Tile({ index, state, allowMove, isOnWinningLine, onClick }: Props) {
  return (
    <div onClick={() => onClick?.()}>
      {typeof index !== 'undefined' && <div>{index}</div>}
      {state === 'X' && <XImage></XImage>}
      {state === 'O' && <OImage></OImage>}
    </div>
  );
}
