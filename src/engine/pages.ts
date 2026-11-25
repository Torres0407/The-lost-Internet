import type { PageDef } from './types';

export type Page = PageDef;

export { coerceAddressInput, HOME_URL, normalizeMeridianUrl } from './url';

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function createNotFoundPage(
  requestedUrl: string,
  customNotice?: string
): PageDef {
  const safeUrl = escapeHtml(requestedUrl);
  const safeNotice = customNotice ? escapeHtml(customNotice) : null;

  const bodyCopy = safeNotice
    ? `<p>${safeNotice}</p>`
    : `<p>The Lantern restoration index could not locate a readable copy of:</p>
       <div class="nf-url">${safeUrl}</div>
       <p>This node may have been deleted before the Quiet Night, or its sectors on the drive image remain unindexed.</p>`;

  return {
    url: requestedUrl,
    title: '404 — Node Not Recovered',
    html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>404 — Node Not Recovered</title>
  <style>
    :host, .nf-body {
      background: #0e1a1f;
      color: #e8e4d8;
      font-family: 'DM Sans', Verdana, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
      padding: 28px 20px;
    }
    .nf-panel {
      max-width: 560px;
      margin: 12px auto;
      background: #162b30;
      border: 2px solid #ffb347;
      padding: 22px 24px;
    }
    .nf-code {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: #ffb347;
      margin: 0 0 8px 0;
    }
    h1 {
      margin: 0 0 10px 0;
      font-size: 20px;
      color: #e8e4d8;
    }
    .nf-url {
      font-family: 'Courier New', monospace;
      background: #0b1418;
      border: 1px solid #2b5057;
      color: #38f2b0;
      padding: 8px 10px;
      margin: 12px 0;
      word-break: break-all;
      font-size: 13px;
    }
    a {
      color: #38f2b0;
      font-weight: bold;
    }
  </style>
</head>
<body class="nf-body">
  <div class="nf-panel">
    <p class="nf-code">MERIDIAN ARCHIVE ERROR 404</p>
    <h1>Page Not Recovered Yet</h1>
    ${bodyCopy}
    <p><a href="meridian://ring-hub/">Return to Meridian Ring Hub</a></p>
  </div>
</body>
</html>`,
  };
}
