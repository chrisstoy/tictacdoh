import { Button, Text, View } from 'react-native';
import { GameBoard } from '@/screens/play/components/GameBoard';
import { Scoreboard } from './components/Scoreboard';

interface Props {
  onSetupGame: () => void;
  onReplayGame: () => void;
}

export function PlayGameScreen({
  onSetupGame: handleSetupGame,
  onReplayGame: handleReplayGame,
}: Props) {
  return (
    <View>
      <Text className=" text-white outline text-2xl">Play Game</Text>
      <Scoreboard></Scoreboard>
      <View>
        <GameBoard></GameBoard>
      </View>
      <Button title="Setup Game" onPress={handleSetupGame} />
    </View>
  );
}
