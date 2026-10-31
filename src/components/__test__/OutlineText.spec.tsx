import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { OutlineText } from '../OutlineText';

describe('OutlineText', () => {
  const originalOS = Platform.OS;

  afterEach(() => {
    Platform.OS = originalOS;
  });

  it('strokes web glyphs by the full outline width in pixels', () => {
    Platform.OS = 'web';

    const view = render(
      <OutlineText outlineColor="#51200b" outlineWidth={3} style={{ color: '#e86a2a' }}>
        PLAY
      </OutlineText>
    );

    expect(JSON.stringify(view.getByText('PLAY').props.style)).toContain('3px #51200b');
  });
});
