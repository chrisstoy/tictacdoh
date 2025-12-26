import { View } from 'react-native';
import { ChoosePlayersImage } from '@/components/images/ChoosePlayersImage';
import { TitleImage } from '@/components/images/TitleImage';
import { useGameStore } from '@/services/gameState';
import { OptionsButton } from './components/OptionsButton';
import { PlayerChoice } from './components/PlayerChoice';
import { StartGameButton } from './components/StartGameButton';

interface Props {
  onStartGame: () => void;
  onOptions: () => void;
}

export function SetupGameScreen({ onStartGame, onOptions }: Props) {
  const gameStore = useGameStore();

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
              isCPU={gameStore.isCPU['X']}
              onClick={() => {
                gameStore.setIsCPU('X', !gameStore.isCPU['X']);
              }}
            />
            <PlayerChoice
              className="w-1/3 "
              player="O"
              isCPU={gameStore.isCPU['O']}
              onClick={() => {
                gameStore.setIsCPU('O', !gameStore.isCPU['O']);
              }}
            />
          </View>
        </View>
      </View>

      <View className="flex-[0.2]">
        <StartGameButton
          className="flex flex-auto self-center w-1/2 my-2"
          onClick={onStartGame}
        ></StartGameButton>
      </View>

      <View className="flex-[0.1]">
        <OptionsButton
          className="flex flex-auto w-1/4 m-2 self-end"
          onClick={onOptions}
        ></OptionsButton>
      </View>
    </View>
  );
}
