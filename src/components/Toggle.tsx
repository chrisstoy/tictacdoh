import { Text, View } from 'react-native';
import { PushButton } from '@/components/PushButton';
import { CheckboxImage } from '@/components/images/CheckboxImage';
import { CheckedCheckboxImage } from '@/components/images/CheckedCheckboxImage';

interface Props extends React.ComponentProps<typeof View> {
  label: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

export function Toggle({ label, value, className, onToggle, ...rest }: Props) {
  return (
    <View
      className={`${className} flex flex-row justify-between items-center p-2 text-background`}
      {...rest}
    >
      <Text className="flex-1 ui-text text-2xl">{label}</Text>
      <PushButton className="flex-none h-8 w-8" onPress={() => onToggle(!value)}>
        {value ? <CheckedCheckboxImage></CheckedCheckboxImage> : <CheckboxImage></CheckboxImage>}
      </PushButton>
    </View>
  );
}
