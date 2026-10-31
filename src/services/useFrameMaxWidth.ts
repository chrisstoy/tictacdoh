import { useEffect, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { frameMaxWidth } from './frameWidth';

// No cap until mounted, so the server prerender and the first client render agree.
export function useFrameMaxWidth(): number | undefined {
  const { width, height } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? frameMaxWidth(width, height) : undefined;
}
