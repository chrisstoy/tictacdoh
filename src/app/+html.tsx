import type { PropsWithChildren } from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import { WEB_VIEWPORT_CONTENT } from '@/services/webViewport';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content={WEB_VIEWPORT_CONTENT} />
        <ScrollViewStyleReset />
        {/* Before the bundle styles the page the canvas is white, which flashes after the splash. */}
        <style dangerouslySetInnerHTML={{ __html: 'html,body{background-color:#fdde97}' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
