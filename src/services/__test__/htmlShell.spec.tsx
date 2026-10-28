import { renderToStaticMarkup } from 'react-dom/server';
import Root from '../../app/+html';

describe('html shell', () => {
  it('paints html and body the app background before any JavaScript runs', () => {
    const markup = renderToStaticMarkup(<Root>{null}</Root>);

    expect(markup).toMatch(/html\s*,\s*body\s*\{[^}]*background-color:\s*#fdde97/i);
  });
});
