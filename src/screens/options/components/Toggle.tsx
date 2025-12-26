import { Pressable, Text, View } from 'react-native';
import { CheckboxImage } from '@/components/images/CheckboxImage';
import { CheckedCheckboxImage } from '@/components/images/CheckedCheckboxImage';

interface Props {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
  className?: string;
}

export function Toggle({ label, value, className, onToggle }: Props) {
  return (
    <View className={`${className} flex flex-row  justify-end items-center`}>
      <Text className="flex-1  text-white outline text-2xl">{label}</Text>
      <Pressable className="flex-none h-8 w-8" onPress={() => onToggle(!value)}>
        {value ? <CheckedCheckboxImage></CheckedCheckboxImage> : <CheckboxImage></CheckboxImage>}
      </Pressable>
    </View>
  );
}
