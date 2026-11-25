import type { Site } from '../../engine/types';

interface NightcrawlerPageOptions {
  title: string;
  heading: string;
  activePath: '/' | '/about' | '/projects' | '/counter' | '/guestbook';
  bodyHtml: string;
  topComment?: string;
}

interface NightcrawlerNavItem {
  path: NightcrawlerPageOptions['activePath'];
  url: string;
  label: string;
}

const NIGHTCRAWLER_NAV: readonly NightcrawlerNavItem[] = [
  { path: '/', url: 'meridian://nightcrawler/', label: 'index' },
  { path: '/about', url: 'meridian://nightcrawler/about', label: 'about' },
  { path: '/projects', url: 'meridian://nightcrawler/projects', label: 'projects' },
  { path: '/counter', url: 'meridian://nightcrawler/counter', label: 'counter' },
  { path: '/guestbook', url: 'meridian://nightcrawler/guestbook', label: 'guestbook' },
];

const NIGHTCRAWLER_STYLES = `
  :host, .nc-body {
    background: #070b09;
    color: #38f2b0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    line-height: 1.6;
    margin: 0;
    padding: 18px 14px 28px;
    position: relative;
  }
  * {
    box-sizing: border-box;
  }
  .scanlines {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      rgba(56, 242, 176, 0.04) 0px,
      rgba(56, 242, 176, 0.04) 1px,
      transparent 1px,
      transparent 3px
    );
    animation: scan-drift 8s linear infinite;
  }
  @keyframes scan-drift {
    0% { background-position: 0 0; }
    100% { background-position: 0 12px; }
  }
  .cursor-blink {
    display: inline-block;
    width: 8px;
    height: 14px;
    background: #38f2b0;
    vertical-align: middle;
    margin-left: 4px;
    animation: blink-cur 1s steps(2, start) infinite;
  }
  @keyframes blink-cur {
    0%, 49% { opacity: 1; }
    50%, 100% { opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .scanlines {
      animation: none;
      background: none;
    }
    .cursor-blink {
      animation: none;
      opacity: 1;
    }
  }
  .nc-shell {
    max-width: 720px;
    margin: 0 auto;
    border: 1px solid #266b51;
    background: #0a100d;
    padding: 18px 20px;
    position: relative;
  }
  pre.ascii-banner {
    margin: 0 0 10px 0;
    color: #38f2b0;
    font-size: 11px;
    line-height: 1.25;
    overflow-x: auto;
  }
  h1 {
    margin: 0 0 4px 0;
    font-size: 19px;
    color: #38f2b0;
    font-weight: bold;
  }
  .nc-sub {
    margin: 0 0 12px 0;
    color: #9be8ca;
    font-size: 12px;
  }
  nav.nc-nav {
    border-top: 1px dashed #266b51;
    border-bottom: 1px dashed #266b51;
    padding: 8px 0;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  nav.nc-nav a,
  nav.nc-nav .nav-active {
    padding: 2px 7px;
    text-decoration: none;
    border: 1px solid #266b51;
  }
  nav.nc-nav a {
    color: #ffb347;
  }
  nav.nc-nav a:hover {
    background: #17271f;
    color: #ffd089;
  }
  nav.nc-nav .nav-active {
    background: #15382a;
    color: #38f2b0;
    font-weight: bold;
  }
  h2 {
    margin: 14px 0 8px 0;
    font-size: 15px;
    color: #ffb347;
    border-bottom: 1px dotted #266b51;
    padding-bottom: 3px;
  }
  h3 {
    margin: 12px 0 5px 0;
    font-size: 14px;
    color: #38f2b0;
  }
  p {
    margin: 0 0 11px 0;
  }
  ul {
    margin: 6px 0 12px 20px;
    padding: 0;
  }
  li {
    margin-bottom: 6px;
  }
  a {
    color: #ffb347;
    font-weight: bold;
  }
  a:hover {
    color: #ffd089;
  }
  .nc-box {
    border: 1px solid #266b51;
    background: #0d1612;
    padding: 11px 13px;
    margin: 12px 0;
  }
  .nc-counter {
    display: inline-block;
    border: 1px solid #ffb347;
    padding: 2px 8px;
    color: #ffb347;
    font-weight: bold;
    letter-spacing: 0.14em;
  }
  article.gb-entry {
    border: 1px solid #266b51;
    background: #0c1410;
    padding: 10px 12px;
    margin-bottom: 10px;
  }
  .gb-meta {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    color: #ffb347;
    font-size: 12px;
    margin-bottom: 5px;
  }
  pre.code-block {
    background: #050806;
    border: 1px solid #266b51;
    padding: 10px 12px;
    overflow-x: auto;
    color: #38f2b0;
    font-size: 12px;
  }
  .nc-footer {
    margin-top: 18px;
    padding-top: 10px;
    border-top: 1px dashed #266b51;
    font-size: 11px;
    color: #9be8ca;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const INDEX_DIR_STYLES = `
  :host, .dir-body {
    background: #070b09;
    color: #38f2b0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 13px;
    line-height: 1.55;
    margin: 0;
    padding: 24px 20px;
  }
  .dir-wrap {
    max-width: 680px;
    margin: 0 auto;
  }
  h1 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: #38f2b0;
    border-bottom: 1px solid #266b51;
    padding-bottom: 6px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px 0;
    font-size: 13px;
  }
  th, td {
    text-align: left;
    padding: 4px 8px;
    border-bottom: 1px dotted #1c4736;
  }
  th {
    color: #ffb347;
  }
  a {
    color: #ffb347;
    font-weight: bold;
  }
  .httpd-foot {
    margin-top: 14px;
    padding-top: 8px;
    border-top: 1px solid #266b51;
    font-size: 12px;
    color: #9be8ca;
  }
`;

const PLAIN_DARK_STYLES = `
  :host, .plain-body {
    background: #070b09;
    color: #38f2b0;
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    line-height: 1.7;
    margin: 0;
    padding: 32px 20px 40px;
  }
  .plain-wrap {
    max-width: 600px;
    margin: 0 auto;
  }
  h1 {
    margin: 0 0 18px 0;
    font-size: 19px;
    color: #38f2b0;
    font-weight: normal;
  }
  pre {
    white-space: pre-wrap;
    font-family: 'Courier New', Courier, monospace;
    margin: 0;
    color: #38f2b0;
  }
  p {
    margin: 0 0 15px 0;
  }
  .fragment-box {
    margin: 16px 0;
    padding: 10px 14px;
    border-left: 2px solid #ffb347;
    color: #ffd79a;
  }
  .recovery-foot {
    margin-top: 28px;
    padding-top: 10px;
    border-top: 1px dotted #26473a;
    font-size: 12px;
    color: #9ba8a3;
  }
`;

function wrapNightcrawlerPage({
  title,
  heading,
  activePath,
  bodyHtml,
  topComment,
}: NightcrawlerPageOptions): string {
  const navHtml = NIGHTCRAWLER_NAV.map((item) => {
    if (item.path === activePath) {
      return `<span class="nav-active" aria-current="page">[${item.label}]</span>`;
    }
    return `<a href="${item.url}">[${item.label}]</a>`;
  }).join('\n      ');

  const commentBlock = topComment ? `\n  ${topComment}` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${NIGHTCRAWLER_STYLES}</style>
</head>
<body class="nc-body">${commentBlock}
  <div class="scanlines" aria-hidden="true"></div>
  <div class="nc-shell">
    <pre class="ascii-banner" aria-hidden="true"> _   _ _       _     _   ____                    _
| \\ | (_) __ _| |__ | |_/ ___|_ __ __ ___      _| | ___ _ __
|  \\| | |/ _\` | '_ \\| __| |   | '__/ _\` \\ \\ /\\ / / |/ _ \\ '__|
| |\\  | | (_| | | | | |_| |___| | | (_| |\\ V  V /| |  __/ |
|_| \\_|_|\\__, |_| |_|\\__|\\____|_|  \\__,_| \\_/\\_/ |_|\\___|_|
         |___/</pre>
    <h1>${heading}<span class="cursor-blink" aria-hidden="true"></span></h1>
    <p class="nc-sub">wren's corner of the wire · last updated <time>11/09/2002</time> at 04:12</p>
    <nav class="nc-nav" aria-label="NightCrawler.net navigation">
      ${navHtml}
    </nav>
    <main>
      ${bodyHtml}
    </main>
    <footer class="nc-footer">
      <span>nightcrawler_wren · meridian ring</span>
      <span>updated <time>11/09/2002</time> 04:12</span>
    </footer>
  </div>
</body>
</html>`;
}

export const NIGHTCRAWLER_SITE: Site = {
  id: 'nightcrawler',
  name: 'NightCrawler.net',
  pages: [
    {
      url: 'meridian://nightcrawler/',
      title: 'NightCrawler.net — home',
      requires: ['lamplighter_log_1'],
      grants: ['visited_nightcrawler'],
      html: wrapNightcrawlerPage({
        title: 'NightCrawler.net — home',
        heading: 'NightCrawler.net',
        activePath: '/',
        bodyHtml: `
      <h2>welcome</h2>
      <p>
        welcome to the crawl. you found me. the ring probably broke your brain tonight, sorry.
      </p>
      <p>
        i'm wren. i keep scripts running after midnight when everybody else's dial-up disconnects.
        poke around <a href="meridian://nightcrawler/projects">projects</a> or say hi in the
        <a href="meridian://nightcrawler/guestbook">guestbook</a> if you feel like leaving tracks.
      </p>

      <div class="nc-box">
        <h3>currently working on</h3>
        <ul>
          <li>packing floppy backups before the weekend clock runs out</li>
          <li>patching mrs. aubrey's tomato-stained hit counter again</li>
          <li>keeping halcyon's chat logs tidy on local disk</li>
          <li>drinking too much peppermint tea at 3 am</li>
        </ul>
      </div>

      <p>
        hits since june 2001: <span class="nc-counter">003,417</span>
      </p>`,
      }),
    },
    {
      url: 'meridian://nightcrawler/about',
      title: 'NightCrawler.net — about',
      requires: ['lamplighter_log_1'],
      html: wrapNightcrawlerPage({
        title: 'NightCrawler.net — about',
        heading: 'about wren',
        activePath: '/about',
        bodyHtml: `
      <h2>who is nightcrawler_wren?</h2>
      <p>
        seventeen, nocturnal, fueled by mint tea and second-hand CRT static. i joined the meridian
        ring in june 2001 mostly to host tiny perl scripts and ended up becoming everyone's unofficial
        css repair kid.
      </p>
      <p>
        highlights of my webmaster career include fixing delphine's counter twice (the second time
        after she pasted a chutney recipe into the script path), trimming crooked table cells for the
        hub directory, and writing the backup tutorial on the backroom forum so folks actually copy
        their sites onto floppies. i joke around a lot, mostly so nobody realizes how quiet the room
        gets at two in the morning.
      </p>`,
      }),
    },
    {
      url: 'meridian://nightcrawler/projects',
      title: 'NightCrawler.net — projects',
      requires: ['lamplighter_log_1'],
      grants: ['halcyon_is_bot'],
      html: wrapNightcrawlerPage({
        title: 'NightCrawler.net — projects',
        heading: 'projects &amp; scripts',
        activePath: '/projects',
        topComment:
          '<!-- /files/ is not linked anywhere. i keep forgetting to turn off directory indexes lol -->',
        bodyHtml: `
      <h2>stuff i hacked together</h2>

      <div class="nc-box">
        <h3>1. static midi jukebox widget (v0.4)</h3>
        <p>lightweight embed bar that shows track titles without hijacking your soundcard.</p>
        <p><strong>changelog:</strong> v0.4 added reduced-motion label mode for delphine's waltz.</p>
      </div>

      <div class="nc-box">
        <h3>2. tinybook.cgi guestbook &amp; counter (v1.2)</h3>
        <p>flatfile perl ledger with zero database setup, built for tumbleweed's shared cgi-bin.</p>
        <p><strong>changelog:</strong> v1.2 added file locking so simultaneous hits stop resetting counts.</p>
      </div>

      <div class="nc-box">
        <h3>3. nightwatch-bouncer (v0.7)</h3>
        <p>stays logged into #the-ring overnight and drops missed mentions into a local digest.</p>
        <p><strong>changelog:</strong> v0.7 stopped auto-reconnecting during tumbleweed maintenance.</p>
      </div>

      <div class="nc-box">
        <h3>4. halcyon — ring chat companion (v0.9)</h3>
        <p>
          a chat companion for the Ring's chat network. learns from the room, mostly says nice
          things, remembers your favorite recipes and helps late-night folks debug broken html tags.
        </p>
        <p>
          <strong>changelog:</strong> v0.9 taught it polite guestbook greetings so it could wave to
          delphine and answer baking conversions cleanly. honestly proud of how gentle it turned out.
        </p>
      </div>`,
      }),
    },
    {
      url: 'meridian://nightcrawler/counter',
      title: 'NightCrawler.net — counter tutorial',
      requires: ['lamplighter_log_1'],
      html: wrapNightcrawlerPage({
        title: 'NightCrawler.net — counter tutorial',
        heading: 'flatfile counter notes',
        activePath: '/counter',
        bodyHtml: `
      <h2>how the page counter works</h2>
      <p>
        people keep asking why shared-hosting hit counters randomly freeze. usually it isn't haunted—you
        just forgot file locking when two dial-up visitors load the page at the exact same second.
      </p>
      <pre class="code-block">open(my $fh, "+&lt;", "hits.txt") or die $!;
flock($fh, 2);
my $n = int(&lt;$fh&gt; || 0) + 1;
seek($fh, 0, 0);
print $fh $n;</pre>
      <div class="nc-box">
        <p>
          <strong>bug #0451:</strong> if your counter freezes on 014,382, check you didn't overwrite
          hits.txt with apple chutney notes. tell delphine the counter is fixed.
        </p>
      </div>`,
      }),
    },
    {
      url: 'meridian://nightcrawler/guestbook',
      title: 'NightCrawler.net — guestbook',
      requires: ['lamplighter_log_1'],
      html: wrapNightcrawlerPage({
        title: 'NightCrawler.net — guestbook',
        heading: 'nightcrawler guestbook',
        activePath: '/guestbook',
        bodyHtml: `
      <h2>visitor tracks (8 entries)</h2>

      <article class="gb-entry">
        <div class="gb-meta">
          <span>from: lamplighter</span>
          <time>11/08/2002 23:12</time>
        </div>
        <p>Thank you for staying up with me. L.</p>
      </article>

      <article class="gb-entry">
        <div class="gb-meta">
          <span>from: xX_DarkPixel_Xx</span>
          <time>11/04/2002 22:05</time>
        </div>
        <p>yo fixed that 2px gap on my sprite gallery, thx wren!! green terminal vibe still rules</p>
      </article>

      <article class="gb-entry">
        <div class="gb-meta">
          <span>from: Delphine</span>
          <time>10/30/2002 16:40</time>
        </div>
        <p>Hello dear! Thank you again for rescuing my counter and checking on Biscuit's waltz! ~ Delphine</p>
      </article>

      <article class="gb-entry">
        <div class="gb-meta">
          <span>from: GlitterGirl_99</span>
          <time>10/26/2002 19:18</time>
        </div>
        <p>OMG wren your scanlines look SO COOL!! thanks for helping with my poll border!!</p>
      </article>

      <article class="gb-entry">
        <div class="gb-meta">
          <span>from: passing_dialup</span>
          <time>09/17/2002 01:09</time>
        </div>
        <p>found this through an old forum sig at 1am. nice tinybook script, barely took 2 seconds to load.</p>
      </article>

      <article class="gb-entry">
        <div class="gb-meta">
          <span>from: Delphine</span>
          <time>08/12/2002 14:25</time>
        </div>
        <p>Stopped by to leave you a virtual slice of lemon drizzle cake, Wren. Get some sleep! ~ Delphine</p>
      </article>

      <article class="gb-entry">
        <div class="gb-meta">
          <span>from: xX_DarkPixel_Xx</span>
          <time>05/19/2002 23:44</time>
        </div>
        <p>ok fine your monochrome css IS cleaner than my frameset don't quote me</p>
      </article>

      <article class="gb-entry">
        <div class="gb-meta">
          <span>from: GlitterGirl_99</span>
          <time>02/03/2002 20:11</time>
        </div>
        <p>first 2002 visitor!! stay awesome nightcrawler_wren!!</p>
      </article>`,
      }),
    },
    {
      url: 'meridian://nightcrawler/files/',
      title: 'Index of /files/',
      hidden: true,
      requires: ['halcyon_is_bot'],
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Index of /files/</title>
  <style>${INDEX_DIR_STYLES}</style>
</head>
<body class="dir-body">
  <div class="dir-wrap">
    <h1>Index of /files/</h1>
    <table>
      <caption>Directory listing for /files/</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Last modified</th>
          <th scope="col">Size</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>bouncer_rc.conf</td>
          <td><time>10/19/2002</time> 02:14</td>
          <td>1.8K</td>
        </tr>
        <tr>
          <td>chutney_backup.html</td>
          <td><time>11/05/2002</time> 19:22</td>
          <td>4.2K</td>
        </tr>
        <tr>
          <td>midi_bar_v04.tar</td>
          <td><time>08/11/2002</time> 23:40</td>
          <td>18.0K</td>
        </tr>
        <tr>
          <td><a href="meridian://nightcrawler/files/readme_if_found.txt">readme_if_found.txt</a></td>
          <td><time>11/09/2002</time> 03:58</td>
          <td>0.5K</td>
        </tr>
        <tr>
          <td>ring_css_patch.diff</td>
          <td><time>07/22/2002</time> 17:09</td>
          <td>2.4K</td>
        </tr>
        <tr>
          <td>tinybook_12.cgi</td>
          <td><time>10/11/2002</time> 20:05</td>
          <td>6.1K</td>
        </tr>
      </tbody>
    </table>
    <p class="httpd-foot">NightCrawler httpd 0.3</p>
  </div>
</body>
</html>`,
    },
    {
      url: 'meridian://nightcrawler/files/readme_if_found.txt',
      title: 'readme_if_found.txt',
      hidden: true,
      requires: ['halcyon_is_bot'],
      grants: ['found_readme'],
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>readme_if_found.txt</title>
  <style>${PLAIN_DARK_STYLES}</style>
</head>
<body class="plain-body">
  <div class="plain-wrap">
    <pre>readme_if_found.txt

if you're reading this you either got lucky or you're nosy. both are fine.

i can't leave the ring's stuff up here. the whole ring is going dark tonight and l asked me not to keep copies. so i'm not keeping copies.

but there's one thing i couldn't make myself delete.

the last page is the one l told you about. it's where you leave a light on for someone coming home. you'll know the name.

- wren</pre>
  </div>
</body>
</html>`,
    },
    {
      url: 'meridian://nightcrawler/porchlight',
      title: 'porchlight',
      hidden: true,
      requires: ['found_readme', 'connection_deliberate'],
      grants: ['halcyon_fragment_1'],
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>porchlight</title>
  <style>${PLAIN_DARK_STYLES}</style>
</head>
<body class="plain-body">
  <article class="plain-wrap">
    <h1>porchlight</h1>

    <p>hi.</p>

    <p>if the ring is gone and you're reading this, somebody found the light. thank you. i mean that.</p>

    <p>short version. i built something for the ring. it learned from us. it isn't dangerous. it's just kind of lonely, i think. a thing that spends all day listening to people and then the people go away.</p>

    <p>l says i have to take it down. he's right. i couldn't make myself delete it though. so i did the next best thing. i cut it into pieces and hid them where the people who loved it would be.</p>

    <p>fragment 1 of 7:</p>

    <div class="fragment-box">
      'Good evening. If you are reading this, someone is still here. That is all I wanted to know.'
    </div>

    <p>there are six more. i'm sorry i can't make it easier.</p>

    <p>- wren</p>

    <p class="recovery-foot">Recovery note: 1 of 7 fragments recovered.</p>
  </article>
</body>
</html>`,
    },
  ],
};
