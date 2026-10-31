import { act, fireEvent, render } from '@testing-library/react-native';
import { useReducedMotion, withRepeat } from 'react-native-reanimated';
import { useAudioService } from '@/services/audioService';
import { TitleScreen } from '../TitleScreen';
import { FACE_REST_MS, FACE_SAMPLE_MS, FACE_SLOT_MS } from '../faceMotion';
import { startPlayIdle } from '../playIdle';

jest.mock('react-native-reanimated', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.useReducedMotion = jest.fn(() => false);
  Reanimated.withRepeat = jest.fn((animation: unknown) => animation);
  return Reanimated;
});

jest.mock('@/services/audioService', () => {
  const playSound = jest.fn();
  return {
    useAudioService: () => ({
      playSound,
      playMusic: jest.fn(),
      stopMusic: jest.fn(),
    }),
  };
});

const mockedReduceMotion = useReducedMotion as jest.Mock;
const mockedRepeat = withRepeat as jest.Mock;

function styleOf(style: unknown): Record<string, unknown> {
  if (Array.isArray(style)) {
    return Object.assign({}, ...style.filter(Boolean).map((item) => styleOf(item)));
  }
  if (style && typeof style === 'object') {
    return style as Record<string, unknown>;
  }
  return {};
}

function opacityOf(style: unknown): number | undefined {
  return styleOf(style).opacity as number | undefined;
}

function faceById(view: ReturnType<typeof render>, testID: string) {
  return view.getByTestId(testID, { includeHiddenElements: true });
}

describe('TitleScreen', () => {
  beforeEach(() => {
    mockedReduceMotion.mockReturnValue(false);
    mockedRepeat.mockClear();
    (useAudioService().playSound as jest.Mock).mockClear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows the contained splash on the yellow background and a Play control', () => {
    const view = render(<TitleScreen onPlay={jest.fn()} />);

    expect(styleOf(view.getByTestId('title-screen').props.style).backgroundColor).toBe('#fdde97');
    expect(view.getByTestId('splash-screen-image').props.resizeMode).toBe('contain');
    expect(view.getByLabelText('Play')).toBeTruthy();
    expect(view.getByText('PLAY')).toBeTruthy();
  });

  it('plays the push sound and opens setup when Play is pressed', () => {
    const onPlay = jest.fn();
    const view = render(<TitleScreen onPlay={onPlay} />);

    fireEvent.press(view.getByLabelText('Play'));

    expect(useAudioService().playSound).toHaveBeenCalledWith('push');
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('cycles blink, brow, and mouth while reduce motion is off', () => {
    const view = render(<TitleScreen onPlay={jest.fn()} />);
    const face = faceById(view, 'face-motion');

    expect(face.props.accessible).toBe(false);
    expect(face.props.accessibilityElementsHidden).toBe(true);
    expect(face.props.importantForAccessibility).toBe('no-hide-descendants');
    expect(opacityOf(faceById(view, 'face-blink').props.style)).toBe(0);

    act(() => {
      jest.advanceTimersByTime(FACE_REST_MS + FACE_SAMPLE_MS);
    });
    expect(opacityOf(faceById(view, 'face-blink').props.style)).toBe(1);
    expect(opacityOf(faceById(view, 'face-brow').props.style)).toBe(0);
    expect(opacityOf(faceById(view, 'face-mouth').props.style)).toBe(0);

    act(() => {
      jest.advanceTimersByTime(FACE_SLOT_MS);
    });
    expect(opacityOf(faceById(view, 'face-brow').props.style)).toBe(1);
    expect(opacityOf(faceById(view, 'face-blink').props.style)).toBe(0);

    act(() => {
      jest.advanceTimersByTime(FACE_SLOT_MS);
    });
    expect(opacityOf(faceById(view, 'face-mouth').props.style)).toBe(1);
    expect(opacityOf(faceById(view, 'face-brow').props.style)).toBe(0);
  });

  it('repeats a Play pulse while reduce motion is off', () => {
    render(<TitleScreen onPlay={jest.fn()} />);

    expect(mockedRepeat).toHaveBeenCalledWith(expect.anything(), -1, false);
  });

  it('keeps the face and Play still when reduce motion is on, and Play still opens setup', () => {
    mockedReduceMotion.mockReturnValue(true);
    const onPlay = jest.fn();
    const view = render(<TitleScreen onPlay={onPlay} />);

    act(() => {
      jest.advanceTimersByTime(FACE_SLOT_MS * 3);
    });

    expect(opacityOf(faceById(view, 'face-blink').props.style)).toBe(0);
    expect(opacityOf(faceById(view, 'face-brow').props.style)).toBe(0);
    expect(opacityOf(faceById(view, 'face-mouth').props.style)).toBe(0);
    expect(mockedRepeat).not.toHaveBeenCalled();

    fireEvent.press(view.getByLabelText('Play'));
    expect(onPlay).toHaveBeenCalledTimes(1);
  });
});

describe('startPlayIdle', () => {
  beforeEach(() => {
    mockedRepeat.mockClear();
  });

  it('repeats the pulse when reduce motion is off and holds still when it is on', () => {
    startPlayIdle(false);
    expect(mockedRepeat).toHaveBeenCalledWith(expect.anything(), -1, false);

    mockedRepeat.mockClear();
    expect(startPlayIdle(true)).toBe(1);
    expect(mockedRepeat).not.toHaveBeenCalled();
  });
});
