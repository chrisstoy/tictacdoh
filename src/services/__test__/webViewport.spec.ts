import fs from 'fs';
import path from 'path';
import { WEB_VIEWPORT_CONTENT } from '../webViewport';

describe('web viewport', () => {
  it('covers the display so safe-area insets include the notch and home indicator', () => {
    expect(WEB_VIEWPORT_CONTENT).toContain('width=device-width');
    expect(WEB_VIEWPORT_CONTENT).toContain('viewport-fit=cover');
  });

  it('is the viewport on the shared web document', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../app/+html.tsx'), 'utf8');

    expect(html).toContain('WEB_VIEWPORT_CONTENT');
    expect(html).toContain('name="viewport"');
  });
});
