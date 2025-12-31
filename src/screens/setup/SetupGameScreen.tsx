import { View } from 'react-native';
import { JiggleButton } from '@/components/JiggleButton';
import { ChoosePlayersImage } from '@/components/images/ChoosePlayersImage';
import { GearImage } from '@/components/images/GearImage';
import { StartGameImage } from '@/components/images/StartGameImage';
import { TitleImage } from '@/components/images/TitleImage';
import { selectIsPlayerCPU, useMatchActions, useMatchStore } from '@/services/matchState';
import { PlayerChoice } from './components/PlayerChoice';
import { RoundsInMatch } from './components/RoundsInMatch';

interface Props {
  onStartGame: () => void;
  onOptions: () => void;
}

export function SetupGameScreen({ onStartGame, onOptions }: Props) {
  const { setPlayerIsCPU, setPlayMode } = useMatchActions();
  const isPlayerXCPU = useMatchStore(selectIsPlayerCPU('X'));
  const isPlayerOCPU = useMatchStore(selectIsPlayerCPU('O'));

  return (
    <View className="h-max flex-1 flex-col">
      <View className="flex-[0.3] m-2">
        <View className="h-full">
          <TitleImage></TitleImage>
        </View>
      </View>

      <View className="flex-[0.5] flex">
        <View className="mx-2 h-1/4">
          <ChoosePlayersImage></ChoosePlayersImage>
        </View>

        <View className="flex flex-row flex-auto">
          <View className="h-full flex-1 flex-row justify-evenly">
            <PlayerChoice
              className="w-1/3 "
              player="X"
              isCPU={isPlayerXCPU}
              onClick={() => {
                setPlayerIsCPU('X', !isPlayerXCPU);
              }}
            />
            <PlayerChoice
              className="w-1/3 "
              player="O"
              isCPU={isPlayerOCPU}
              onClick={() => {
                setPlayerIsCPU('O', !isPlayerOCPU);
              }}
            />
          </View>
        </View>
      </View>

      <View className="flex-[0.05]">
        <RoundsInMatch></RoundsInMatch>
      </View>

      <View className="flex-[0.15]">
        <JiggleButton
          className="flex flex-auto self-center w-1/2 pt-4"
          onClick={() => {
            setPlayMode('SETUP_MATCH');
            onStartGame();
          }}
        >
          <StartGameImage></StartGameImage>
        </JiggleButton>
      </View>

      <View className="flex-[0.1]">
        <JiggleButton className="flex flex-auto w-1/4 m-2 self-end" onClick={onOptions}>
          <GearImage></GearImage>
        </JiggleButton>
      </View>
    </View>
  );
}
