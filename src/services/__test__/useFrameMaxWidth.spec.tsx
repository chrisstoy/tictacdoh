import { renderHook } from '@testing-library/react-native';
import { useWindowDimensions } from 'react-native';
import { frameMaxWidth } from '../frameWidth';
import { useFrameMaxWidth } from '../useFrameMaxWidth';

jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockedDimensions = useWindowDimensions as jest.Mock;

describe('useFrameMaxWidth', () => {
  // The static export prerenders with a 0x0 window, which baked max-width:0px into
  // the HTML. React does not repair mismatched style attributes on hydration, so the
  // layout stayed collapsed until a resize. The first render must apply no cap.
  it('applies no cap on the first render, then the real cap once mounted', () => {
    mockedDimensions.mockReturnValue({ width: 500, height: 760 });
    const seen: (number | undefined)[] = [];

    const { result } = renderHook(() => {
      const value = useFrameMaxWidth();
      seen.push(value);
      return value;
    });

    expect(seen[0]).toBeUndefined();
    expect(result.current).toBe(frameMaxWidth(500, 760));
  });
});
