import { Platform, Text as RNText, StyleSheet, TextProps, View } from 'react-native';

interface OutlineTextProps extends TextProps {
  outlineColor?: string;
  outlineWidth?: number;
}

export function OutlineText({
  children,
  style,
  className,
  outlineColor = '#2b262c',
  outlineWidth = 1.0,
  ...props
}: OutlineTextProps) {
  if (Platform.OS === 'web') {
    // Use CSS text-stroke for web
    return (
      <RNText
        {...props}
        className={className}
        style={[
          style,
          {
            // @ts-ignore - WebkitTextStroke is not in RN types but works on web
            WebkitTextStroke: `${outlineWidth / 4}px ${outlineColor}`,
            // @ts-ignore
            textStroke: `${outlineWidth / 4}px ${outlineColor}`,
          },
        ]}
      >
        {children}
      </RNText>
    );
  }

  // For native platforms, layer multiple Text components to create outline effect
  const shadowOffsets = [
    { width: -outlineWidth, height: -outlineWidth },
    { width: outlineWidth, height: -outlineWidth },
    { width: -outlineWidth, height: outlineWidth },
    { width: outlineWidth, height: outlineWidth },
    { width: -outlineWidth, height: 0 },
    { width: outlineWidth, height: 0 },
    { width: 0, height: -outlineWidth },
    { width: 0, height: outlineWidth },
  ];

  return (
    <View style={styles.container}>
      {/* Render outline layers */}
      {shadowOffsets.map((offset, index) => (
        <RNText
          key={index}
          {...props}
          className={className}
          style={[
            style,
            styles.outline,
            {
              color: outlineColor,
              transform: [{ translateX: offset.width }, { translateY: offset.height }],
            },
          ]}
        >
          {children}
        </RNText>
      ))}
      {/* Render main text on top */}
      <RNText {...props} className={className} style={[style, styles.mainText]}>
        {children}
      </RNText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  outline: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  mainText: {
    position: 'relative',
  },
});
