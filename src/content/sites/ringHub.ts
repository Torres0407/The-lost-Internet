import type { Site } from '../../engine/types';

interface HubPageOptions {
  title: string;
  heading: string;
  subtitle: string;
  activePath: '/' | '/members' | '/news' | '/rules' | '/join' | '/start';
  bodyHtml: string;
  topComment?: string;
}

interface HubNavItem {
  path: HubPageOptions['activePath'];
  url: string;
  label: string;
}

const HUB_NAV_ITEMS: readonly HubNavItem[] = [
  { path: '/', url: 'meridian://ring-hub/', label: 'Portal Home' },
  { path: '/start', url: 'meridian://ring-hub/start', label: 'Recovery Notes' },
  { path: '/members', url: 'meridian://ring-hub/members', label: 'Member Directory (40)' },
  { path: '/news', url: 'meridian://ring-hub/news', label: 'Ring News & Notices' },
  { path: '/rules', url: 'meridian://ring-hub/rules', label: 'Community Rules' },
  { path: '/join', url: 'meridian://ring-hub/join', label: 'How to Join' },
];

const HUB_STYLES = `
  :host, .hub-page {
    background: #dde9f5;
    color: #1b2a38;
    font-family: Verdana, Tahoma, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.55;
    margin: 0;
    padding: 16px 14px 26px;
  }
  * {
    box-sizing: border-box;
  }
  .portal-shell {
    max-width: 780px;
    margin: 0 auto;
    background: #ffffff;
    border: 1px solid #6b849e;
    box-shadow: 0 2px 10px rgba(16, 37, 66, 0.12);
  }
  .portal-header {
    background: linear-gradient(180deg, #16335b 0%, #102542 100%);
    color: #ffffff;
    padding: 14px 18px;
    border-bottom: 3px solid #486581;
  }
  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 8px;
  }
  .portal-kicker {
    margin: 0 0 3px 0;
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #cfe0f2;
  }
  .portal-header h1 {
    margin: 0;
    font-size: 20px;
    font-weight: bold;
    color: #ffffff;
    letter-spacing: 0.02em;
  }
  .portal-subtitle {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #d9e6f2;
  }
  .header-meta {
    font-size: 11px;
    color: #dbe8f5;
    white-space: nowrap;
  }
  .portal-columns {
    display: grid;
    grid-template-columns: 188px 1fr;
    align-items: stretch;
  }
  @media (max-width: 640px) {
    .portal-columns {
      grid-template-columns: 1fr;
    }
  }
  .portal-sidebar {
    background: #eef4fa;
    border-right: 1px solid #9fb3c8;
    padding: 14px 12px;
  }
  @media (max-width: 640px) {
    .portal-sidebar {
      border-right: 0;
      border-bottom: 1px solid #9fb3c8;
    }
  }
  .sidebar-heading {
    margin: 0 0 8px 0;
    padding-bottom: 4px;
    border-bottom: 1px solid #829ab1;
    font-size: 12px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #102542;
  }
  ul.hub-nav {
    list-style: none;
    margin: 0 0 16px 0;
    padding: 0;
  }
  ul.hub-nav li {
    margin-bottom: 5px;
  }
  ul.hub-nav a,
  ul.hub-nav .nav-active {
    display: block;
    padding: 5px 8px;
    font-size: 12px;
    border: 1px solid #b0c4d8;
    background: #ffffff;
    text-decoration: none;
  }
  ul.hub-nav .nav-active {
    background: #102542;
    border-color: #102542;
    color: #ffffff;
    font-weight: bold;
  }
  .sidebar-box {
    background: #ffffff;
    border: 1px solid #9fb3c8;
    padding: 9px 10px;
    margin-bottom: 12px;
    font-size: 11px;
    color: #243b53;
  }
  .sidebar-box strong {
    color: #102542;
  }
  .counter-box {
    background: #ffffff;
    border: 1px solid #9fb3c8;
    padding: 8px;
    text-align: center;
  }
  .counter-caption {
    display: block;
    font-size: 11px;
    color: #334e68;
    margin-bottom: 4px;
  }
  .portal-counter {
    display: inline-block;
    background: #0f2238;
    color: #e6f4ff;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    font-weight: bold;
    letter-spacing: 0.12em;
    padding: 3px 8px;
    border: 1px solid #486581;
  }
  .portal-main {
    padding: 18px 20px 22px;
    background: #ffffff;
  }
  h2 {
    margin: 0 0 10px 0;
    padding-bottom: 5px;
    border-bottom: 2px solid #cbd9e6;
    font-size: 17px;
    color: #102542;
  }
  h3 {
    margin: 14px 0 7px 0;
    font-size: 14px;
    color: #1b3b6f;
  }
  p {
    margin: 0 0 11px 0;
  }
  ul.portal-list,
  ol.portal-list {
    margin: 6px 0 12px 20px;
    padding: 0;
  }
  ul.portal-list li,
  ol.portal-list li {
    margin-bottom: 6px;
  }
  a {
    color: #0c4a85;
    font-weight: bold;
  }
  a:hover {
    color: #8a3b00;
  }
  .callout-start {
    background: #e9f2fc;
    border: 1px solid #5c85b5;
    border-left: 4px solid #16335b;
    padding: 11px 14px;
    margin: 0 0 16px 0;
  }
  .panel {
    background: #f8fafc;
    border: 1px solid #bcccdc;
    padding: 12px 14px;
    margin: 14px 0;
  }
  .feature-box {
    background: #f0f5fa;
    border: 1px solid #829ab1;
    padding: 12px 14px;
    margin: 14px 0;
  }
  .notice-construction {
    background: #fff7db;
    border: 1px dashed #b57b14;
    color: #4d2d00;
    padding: 10px 13px;
    margin: 12px 0 16px 0;
    font-size: 12px;
  }
  table.hub-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 12px;
    background: #ffffff;
    border: 1px solid #829ab1;
  }
  table.hub-table caption {
    text-align: left;
    font-weight: bold;
    color: #102542;
    padding: 0 0 6px 0;
    font-size: 12px;
  }
  table.hub-table th {
    background: #dbe6f2;
    color: #102542;
    text-align: left;
    padding: 7px 8px;
    border: 1px solid #9fb3c8;
    font-size: 12px;
  }
  table.hub-table td {
    padding: 6px 8px;
    border: 1px solid #d9e2ec;
    vertical-align: top;
  }
  table.hub-table tbody tr:nth-child(even) {
    background: #f7f9fc;
  }
  article.news-item {
    border: 1px solid #bcccdc;
    background: #fbfdff;
    padding: 12px 14px;
    margin: 12px 0;
  }
  .news-meta {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 12px;
    color: #334e68;
    border-bottom: 1px solid #d9e2ec;
    padding-bottom: 5px;
    margin-bottom: 8px;
  }
  .news-title {
    font-weight: bold;
    color: #102542;
  }
  .join-form {
    background: #f8fafc;
    border: 1px solid #9fb3c8;
    padding: 14px 16px;
    margin: 14px 0;
  }
  .join-form fieldset {
    border: 1px solid #bcccdc;
    padding: 12px 14px;
    margin: 0;
  }
  .join-form legend {
    font-weight: bold;
    color: #102542;
    padding: 0 6px;
    font-size: 12px;
  }
  .form-row {
    margin-bottom: 11px;
  }
  .form-row label {
    display: block;
    font-weight: bold;
    font-size: 12px;
    color: #1b2a38;
    margin-bottom: 4px;
  }
  .form-row input[type="text"],
  .form-row select,
  .form-row textarea {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #829ab1;
    background: #ffffff;
    color: #1b2a38;
    font-family: Verdana, Tahoma, Arial, sans-serif;
    font-size: 12px;
  }
  .form-check {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 10px 0 14px 0;
    font-size: 12px;
  }
  .join-submit {
    padding: 6px 14px;
    background: #d9e2ec;
    color: #334e68;
    border: 1px solid #829ab1;
    font-family: Verdana, Tahoma, Arial, sans-serif;
    font-size: 12px;
    font-weight: bold;
    cursor: not-allowed;
  }
  .signoff {
    font-weight: bold;
    color: #102542;
    margin-top: 8px;
  }
  .portal-footer {
    background: #eef4fa;
    border-top: 1px solid #9fb3c8;
    padding: 9px 16px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
    color: #243b53;
  }
`;

function wrapHubPage({
  title,
  heading,
  subtitle,
  activePath,
  bodyHtml,
  topComment,
}: HubPageOptions): string {
  const navHtml = HUB_NAV_ITEMS.map((item) => {
    if (item.path === activePath) {
      return `<li><span class="nav-active" aria-current="page">${item.label}</span></li>`;
    }
    return `<li><a href="${item.url}">${item.label}</a></li>`;
  }).join('\n            ');

  const commentBlock = topComment ? `\n  ${topComment}` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${HUB_STYLES}</style>
</head>
<body class="hub-page">${commentBlock}
  <div class="portal-shell">
    <header class="portal-header">
      <div class="header-top">
        <div>
          <p class="portal-kicker">Meridian Community Webring Portal · Est. 02/2001</p>
          <h1>${heading}</h1>
          <p class="portal-subtitle">${subtitle}</p>
        </div>
        <div class="header-meta">
          Updated: <time>11/07/2002</time>
        </div>
      </div>
    </header>
    <div class="portal-columns">
      <aside class="portal-sidebar">
        <h2 class="sidebar-heading">Directory Menu</h2>
        <nav aria-label="Meridian Ring Hub navigation">
          <ul class="hub-nav">
            ${navHtml}
          </ul>
        </nav>
        <div class="sidebar-box">
          <strong>Ring Status:</strong><br />
          39 sites and growing!<br />
          Moderated by <strong>lamplighter</strong> &amp; volunteer staff.
        </div>
        <div class="counter-box">
          <span class="counter-caption">Portal Hits Since 02/2001:</span>
          <span class="portal-counter">087,214</span>
        </div>
      </aside>
      <main class="portal-main">
        ${bodyHtml}
      </main>
    </div>
    <footer class="portal-footer">
      <span>Meridian Ring Hub · Maintained by The Ring Moderators · Last updated <time>11/07/2002</time></span>
      <span>Best viewed at 800x600</span>
    </footer>
  </div>
</body>
</html>`;
}

export const RING_HUB_SITE: Site = {
  id: 'ring-hub',
  name: 'Meridian Ring Hub',
  pages: [
    {
      url: 'meridian://ring-hub/',
      title: 'Meridian Ring — Central Index',
      grants: ['visited_ring_hub'],
      html: wrapHubPage({
        title: 'Meridian Ring — Central Index',
        heading: 'THE MERIDIAN RING HUB',
        subtitle: 'Official Directory & Member Index · Snapshot Mirror: 11/07/2002',
        activePath: '/',
        bodyHtml: `
        <div class="callout-start">
          <strong>New here? <a href="meridian://ring-hub/start">Start with the recovery notes</a></strong><br />
          Read the Lantern Archive guide on navigating snapshots, saving clues, inspecting View Source, and connecting leads on your Notebook Board.
        </div>

        <h2>Welcome to the Meridian Ring</h2>
        <p>
          <strong>What is the Meridian Ring?</strong> Founded in February 2001, the Meridian Ring is an
          independent neighborhood of personal homepages, hobby journals, kitchen collections, and
          late-night coding corners—currently <strong>39 sites and growing!</strong> Every site in our
          ring is reviewed by volunteer moderators led by <strong>lamplighter</strong> to keep our
          little street welcoming, ad-free, and tidy.
        </p>

        <div class="panel">
          <h3>New This Month (November 2002)</h3>
          <ul class="portal-list">
            <li>
              <strong><time>11/07/2002</time> — Backup Reminder Posted:</strong> Read lamplighter's routine housekeeping reminder in <a href="meridian://ring-hub/news">Ring News &amp; Notices</a>, alongside <a href="meridian://tumbleweed/">Tumbleweed Hosting</a> (<a href="meridian://tumbleweed/support">Support Bulletin</a>).
            </li>
            <li>
              <strong><time>11/05/2002</time> — Autumn Guestbook Letters:</strong> New visitor replies and chutney notes are live in <a href="meridian://delphines-garden/guestbook">Delphine's Guestbook (Page 1)</a> and <a href="meridian://backroom/">The Backroom Forum</a>.
            </li>
            <li>
              <strong><time>11/02/2002</time> — Full Directory Updated:</strong> All 40 roster entries have been verified for our autumn index in the <a href="meridian://ring-hub/members">Member Directory</a>.
            </li>
          </ul>
        </div>

        <div class="feature-box">
          <h3>Site of the Month: Delphine's Garden</h3>
          <p>
            Congratulations to Mrs. Delphine Aubrey on winning November's Site of the Month! Her
            warm garden diary, heirloom tomato chutney recipe, and personally answered guestbook embody
            the very best of the Meridian Ring spirit.
          </p>
          <p>
            <a href="meridian://delphines-garden/">Visit Delphine's Garden &amp; Recipes</a> ·
            <a href="meridian://delphines-garden/guestbook">Read Delphine's Guestbook</a>
          </p>
        </div>

        <div class="panel">
          <h3>Hub Sections &amp; Community Links</h3>
          <ul class="portal-list">
            <li><a href="meridian://ring-hub/members">Member Directory (40)</a> — Full member roster and active snapshot links.</li>
            <li><a href="meridian://backroom/">The Backroom Forum</a> — Ring message board, site showcase, and member profiles.</li>
            <li><a href="meridian://tumbleweed/">Tumbleweed Hosting</a> — Shared hosting plans, FAQ, and cluster notices.</li>
            <li><a href="meridian://ring-hub/news">Ring News &amp; Notices</a> — Moderator announcements from 2002.</li>
            <li><a href="meridian://ring-hub/rules">Community Rules</a> — Guidelines for keeping our neighborhood welcoming.</li>
            <li><a href="meridian://ring-hub/join">How to Join</a> — Application information and review schedule.</li>
            <li><a href="meridian://ring-hub/start">Lantern Archive: Recovery Notes</a> — How to explore and log recovered clues.</li>
          </ul>
        </div>

        <p class="signoff">— The Ring Moderators</p>`,
      }),
    },
    {
      url: 'meridian://ring-hub/members',
      title: 'Meridian Ring — Member Directory',
      html: wrapHubPage({
        title: 'Meridian Ring — Member Directory',
        heading: 'MERIDIAN RING MEMBER DIRECTORY',
        subtitle: 'Complete Roster of Registered Sites & Community Infrastructure',
        activePath: '/members',
        topComment: '<!-- 3 slots reserved - L. says to keep them quiet for now -->',
        bodyHtml: `
        <h2>Registered Ring Roster</h2>
        <p>
          Below is the complete 40-entry directory as of <time>11/07/2002</time>. Sites recovered in
          the current archive snapshot are linked directly; unrecovered pages appear in plain text for
          reference.
        </p>

        <table class="hub-table">
          <caption>Meridian Ring Member Sites (39 community listings plus primary hosting notice)</caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Site name</th>
              <th scope="col">Owner handle</th>
              <th scope="col">Joined</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">1</th>
              <td>Lamplighter's Log</td>
              <td>lamplighter</td>
              <td><time>02/2001</time></td>
              <td>Ring coordinator notes, directory housekeeping &amp; night-shift journal.</td>
            </tr>
            <tr>
              <th scope="row">2</th>
              <td><a href="meridian://delphines-garden/">Delphine's Garden</a></td>
              <td>delphine_aubrey</td>
              <td><time>02/2001</time></td>
              <td>Heirloom tomatoes, kitchen baking, cat Biscuit &amp; visitor guestbook.</td>
            </tr>
            <tr>
              <th scope="row">3</th>
              <td>Old Mill Weather Log</td>
              <td>oldmill_weather</td>
              <td><time>02/2001</time></td>
              <td>Backyard barometer readings, frost tables &amp; pencil cloud sketches.</td>
            </tr>
            <tr>
              <th scope="row">4</th>
              <td>Barnaby's Brass &amp; Clocks</td>
              <td>barnaby_clocks</td>
              <td><time>03/2001</time></td>
              <td>Mantel clock mainspring care, chime diagrams &amp; antique gears.</td>
            </tr>
            <tr>
              <th scope="row">5</th>
              <td>Clara's Pressed Flowers</td>
              <td>clara_pressed</td>
              <td><time>03/2001</time></td>
              <td>Wildflower field guides, cosmos pressings &amp; ribbon bookmarks.</td>
            </tr>
            <tr>
              <th scope="row">6</th>
              <td>Brambleberry Tea Room</td>
              <td>tea_and_tweed</td>
              <td><time>04/2001</time></td>
              <td>Herbal tea steep charts, rainy-day reading lists &amp; scones.</td>
            </tr>
            <tr>
              <th scope="row">7</th>
              <td>Willowbrook Birding Journal</td>
              <td>piper_jane</td>
              <td><time>04/2001</time></td>
              <td>Seasonal songbird sightings along the creek &amp; binocular tips.</td>
            </tr>
            <tr>
              <th scope="row">8</th>
              <td>Signal Box 14 Model Railways</td>
              <td>stationmaster_hal</td>
              <td><time>05/2001</time></td>
              <td>HO-scale timber trestle builds, track wiring &amp; timetable notes.</td>
            </tr>
            <tr>
              <th scope="row">9</th>
              <td>NightCrawler.net</td>
              <td>nightcrawler_wren</td>
              <td><time>06/2001</time></td>
              <td>Hobby-programmer HTML snippets, hit counters &amp; late-night logs.</td>
            </tr>
            <tr>
              <th scope="row">10</th>
              <td>Velvet Wave MIDI Vault</td>
              <td>synth_archivist</td>
              <td><time>06/2001</time></td>
              <td>Original 16-channel MIDI waltzes, soundfont tips &amp; sheet notes.</td>
            </tr>
            <tr>
              <th scope="row">11</th>
              <td>Quiet Porch Poetry Corner</td>
              <td>mrs_henderson_42</td>
              <td><time>06/2001</time></td>
              <td>Short lyric poems, county library book picks &amp; autumn essays.</td>
            </tr>
            <tr>
              <th scope="row">12</th>
              <td>Pixel Dungeon Almanac</td>
              <td>xX_DarkPixel_Xx</td>
              <td><time>07/2001</time></td>
              <td>Retro games fansite, 8-bit sprite galleries &amp; cheat notebooks.</td>
            </tr>
            <tr>
              <th scope="row">13</th>
              <td>SparkleZone 99</td>
              <td>GlitterGirl_99</td>
              <td><time>08/2001</time></td>
              <td>Teen fan site with pastel dividers, diary polls &amp; sticker swaps.</td>
            </tr>
            <tr>
              <th scope="row">14</th>
              <td>Shortwave Drift FM</td>
              <td>bandpass_lou</td>
              <td><time>08/2001</time></td>
              <td>Pirate-radio fan page, antenna wire lengths &amp; midnight station logs.</td>
            </tr>
            <tr>
              <th scope="row">15</th>
              <td>Marigold's Seed &amp; Soil</td>
              <td>marigold_may</td>
              <td><time>09/2001</time></td>
              <td>Community seed-swap calendars, compost ratios &amp; marigold borders.</td>
            </tr>
            <tr>
              <th scope="row">16</th>
              <td>Hearthstone Bread &amp; Rye</td>
              <td>baker_tom</td>
              <td><time>09/2001</time></td>
              <td>Sourdough starter diaries, cast-iron loaves &amp; oven temperature charts.</td>
            </tr>
            <tr>
              <th scope="row">17</th>
              <td>Pat's Porch Petunias</td>
              <td>petunia_pat</td>
              <td><time>09/2001</time></td>
              <td>Hanging basket watering schedules, dahlia bulbs &amp; patio sketches.</td>
            </tr>
            <tr>
              <th scope="row">18</th>
              <td>Amber Lantern Zine</td>
              <td>paper_moth</td>
              <td><time>10/2001</time></td>
              <td>Photocopied mini-zine scans, ink pen reviews &amp; mail-art swaps.</td>
            </tr>
            <tr>
              <th scope="row">19</th>
              <td>Cedar Creek Canoe Notes</td>
              <td>paddle_greg</td>
              <td><time>10/2001</time></td>
              <td>Weekend river put-ins, cedar paddle varnishing &amp; campfire coffee.</td>
            </tr>
            <tr>
              <th scope="row">20</th>
              <td>Bitwise Kitchenette</td>
              <td>c_pointer_sal</td>
              <td><time>11/2001</time></td>
              <td>Small Pascal utilities, floppy disk label templates &amp; coffee reviews.</td>
            </tr>
            <tr>
              <th scope="row">21</th>
              <td>Silver Nitrate Darkroom</td>
              <td>shutter_nadia</td>
              <td><time>11/2001</time></td>
              <td>35mm black-and-white film timings, thrift camera repairs &amp; prints.</td>
            </tr>
            <tr>
              <th scope="row">22</th>
              <td>Sunflower Postal Club</td>
              <td>sunshine_sam</td>
              <td><time>12/2001</time></td>
              <td>Vintage postcard collecting, fountain pen inks &amp; stamp lore.</td>
            </tr>
            <tr>
              <th scope="row">23</th>
              <td>Greenhouse Pea Trellis</td>
              <td>sugar_pea</td>
              <td><time>01/2002</time></td>
              <td>Cold-frame salad greens, trellis twine knots &amp; early spring peas.</td>
            </tr>
            <tr>
              <th scope="row">24</th>
              <td>Tin Roof Astronomy</td>
              <td>comet_watcher</td>
              <td><time>01/2002</time></td>
              <td>Backyard telescope star charts, lunar eclipse notes &amp; red flashlights.</td>
            </tr>
            <tr>
              <th scope="row">25</th>
              <td>Cross-Stitch &amp; Calico</td>
              <td>thimble_rose</td>
              <td><time>02/2002</time></td>
              <td>Pixel-grid embroidery patterns, quilt blocks &amp; darning tutorials.</td>
            </tr>
            <tr>
              <th scope="row">26</th>
              <td>Arcade Cabinet 1984</td>
              <td>coinop_danny</td>
              <td><time>02/2002</time></td>
              <td>Classic CRT monitor repair logs, high-score tables &amp; marquee art.</td>
            </tr>
            <tr>
              <th scope="row">27</th>
              <td>Rainy Day Origami</td>
              <td>crane_fold_lin</td>
              <td><time>03/2002</time></td>
              <td>Step-by-step paper cranes, patterned foil sources &amp; desk ornaments.</td>
            </tr>
            <tr>
              <th scope="row">28</th>
              <td>Copper Kettle Folk Lyrics</td>
              <td>banjo_eddie</td>
              <td><time>04/2002</time></td>
              <td>Public-domain folk chords, banjo tunings &amp; porch jam notes.</td>
            </tr>
            <tr>
              <th scope="row">29</th>
              <td>Beacon Hill Lighthouse</td>
              <td>keeper_otto</td>
              <td><time>04/2002</time></td>
              <td>Coastal Fresnel lens history, foghorn logs &amp; maritime weather lore.</td>
            </tr>
            <tr>
              <th scope="row">30</th>
              <td>DotMatrix Sketchbook</td>
              <td>ascii_tessa</td>
              <td><time>05/2002</time></td>
              <td>Text-mode banners, ANSI borders &amp; monochrome tile studies.</td>
            </tr>
            <tr>
              <th scope="row">31</th>
              <td>Fossil &amp; Pebble Drawer</td>
              <td>shale_hunter</td>
              <td><time>05/2002</time></td>
              <td>Creekbed trilobite finds, mineral labeling &amp; wooden display boxes.</td>
            </tr>
            <tr>
              <th scope="row">32</th>
              <td>Maple Street Apiary</td>
              <td>honeycomb_bea</td>
              <td><time>06/2002</time></td>
              <td>Backyard beehive inspections, wildflower honey jars &amp; wax candles.</td>
            </tr>
            <tr>
              <th scope="row">33</th>
              <td>Midnight Cassette Exchange</td>
              <td>tape_deck_jules</td>
              <td><time>07/2002</time></td>
              <td>Homemade mixtape sleeve art, walkman belt fixes &amp; indie reviews.</td>
            </tr>
            <tr>
              <th scope="row">34</th>
              <td>Paperback Attic</td>
              <td>spine_crack_al</td>
              <td><time>07/2002</time></td>
              <td>Used mystery novel checklists, library stamp finds &amp; shelf photos.</td>
            </tr>
            <tr>
              <th scope="row">35</th>
              <td>Trackside Steam Whistle</td>
              <td>caboose_verne</td>
              <td><time>08/2002</time></td>
              <td>Regional branch-line depot snapshots &amp; preserved locomotive rosters.</td>
            </tr>
            <tr>
              <th scope="row">36</th>
              <td>Modem Handshake Museum</td>
              <td>baud_rate_kyle</td>
              <td><time>08/2002</time></td>
              <td>Dial-up troubleshooting notes, serial cable pinouts &amp; terminal tricks.</td>
            </tr>
            <tr>
              <th scope="row">37</th>
              <td>Lavender Linen &amp; Soap</td>
              <td>soapmaker_ivy</td>
              <td><time>09/2002</time></td>
              <td>Cold-process olive oil soap bars, dried lavender sachets &amp; gift wrap.</td>
            </tr>
            <tr>
              <th scope="row">38</th>
              <td>Puddle Jumper Kite Club</td>
              <td>kite_string_ben</td>
              <td><time>09/2002</time></td>
              <td>Ripstop diamond kite plans, wind-speed gauges &amp; park meetups.</td>
            </tr>
            <tr>
              <th scope="row">39</th>
              <td><a href="meridian://backroom/">The Backroom Forum</a></td>
              <td>lamplighter</td>
              <td><time>02/2001</time></td>
              <td>Official Meridian Ring bulletin board, site showcase &amp; tech help.</td>
            </tr>
            <tr>
              <th scope="row">40</th>
              <td><a href="meridian://tumbleweed/">Tumbleweed Hosting</a></td>
              <td>tumbleweed_ops</td>
              <td><time>02/2001</time></td>
              <td>Shared hosting operations &amp; Meridian Cluster 04 status notices.</td>
            </tr>
          </tbody>
        </table>

        <p class="signoff">— The Ring Moderators</p>`,
      }),
    },
    {
      url: 'meridian://ring-hub/news',
      title: 'Meridian Ring — News & Notices',
      html: wrapHubPage({
        title: 'Meridian Ring — News & Notices',
        heading: 'RING NEWS & ANNOUNCEMENTS',
        subtitle: 'Official Community Bulletins & Moderator Updates (2002)',
        activePath: '/news',
        topComment: '<!-- remember to back up the member database before Friday -->',
        bodyHtml: `
        <h2>2002 Ring Announcements</h2>
        <p>
          Keep up to date with directory milestones, maintenance schedules, and monthly features
          posted by our volunteer team.
        </p>

        <article class="news-item">
          <div class="news-meta">
            <span class="news-title">Routine Backup Reminder Before Weekend Server Tidying</span>
            <time>11/07/2002</time>
          </div>
          <p>
            Hello everyone! Just a friendly housekeeping note from the desk: our hosting provider is
            tidying up the servers over the weekend, so we encourage all members to download a
            personal copy of their HTML pages, recipes, and guestbook files now and then via FTP.
            Everything should stay smooth on Cluster 04, and keeping a spare copy on your home
            floppy or hard drive is always good practice.
          </p>
          <p class="signoff">— lamplighter, on behalf of The Ring Moderators</p>
        </article>

        <article class="news-item">
          <div class="news-meta">
            <span class="news-title">November Site of the Month: Delphine's Garden</span>
            <time>10/19/2002</time>
          </div>
          <p>
            We are delighted to feature <a href="meridian://delphines-garden/">Delphine's Garden</a> as
            our upcoming autumn spotlight! Thank you to every member who left warm notes in her
            guestbook and shared seasonal recipes across the ring.
          </p>
          <p class="signoff">— The Ring Moderators</p>
        </article>

        <article class="news-item">
          <div class="news-meta">
            <span class="news-title">Welcome to Our Early-Autumn Additions</span>
            <time>09/08/2002</time>
          </div>
          <p>
            Please say hello to Soapmaker Ivy, Kite String Ben, and our newest garden and craft pages!
            As always, remember to double-check your image attribution lines and keep external links
            tidy so the ring navigation bar stays brisk on dial-up.
          </p>
          <p class="signoff">— The Ring Moderators</p>
        </article>

        <article class="news-item">
          <div class="news-meta">
            <span class="news-title">Summer Navigation Bar &amp; Counter Repairs</span>
            <time>07/22/2002</time>
          </div>
          <p>
            Many thanks to <strong>nightcrawler_wren</strong> for volunteering a spare Saturday to trim
            broken table cells out of the shared webring snippet. Pages should now align properly on
            both 800x600 and 1024x768 displays.
          </p>
          <p class="signoff">— The Ring Moderators</p>
        </article>

        <article class="news-item">
          <div class="news-meta">
            <span class="news-title">Spring Milestone: Thirty-Five Member Sites</span>
            <time>05/14/2002</time>
          </div>
          <p>
            What began as a dozen friends trading weather logs and recipes has grown to thirty-five
            active homepages! Thank you for making the Meridian Ring a polite and steady refuge on
            the web.
          </p>
          <p class="signoff">— The Ring Moderators</p>
        </article>

        <article class="news-item">
          <div class="news-meta">
            <span class="news-title">One Year of the Meridian Ring</span>
            <time>02/09/2002</time>
          </div>
          <p>
            Happy first anniversary to everyone who helped launch our directory in February 2001.
            Here is to another year of thoughtful personal pages, clean HTML, and friendly guestbook
            conversations.
          </p>
          <p class="signoff">— The Ring Moderators</p>
        </article>`,
      }),
    },
    {
      url: 'meridian://ring-hub/rules',
      title: 'Meridian Ring — Community Rules',
      html: wrapHubPage({
        title: 'Meridian Ring — Community Rules',
        heading: 'COMMUNITY GUIDELINES & ETIQUETTE',
        subtitle: 'Five Simple Promises Shared by All Meridian Ring Members',
        activePath: '/rules',
        bodyHtml: `
        <h2>Meridian Ring Community Rules</h2>
        <p>
          Our directory runs on goodwill and mutual respect rather than heavy policing. Every site
          keeper agrees to the five friendly guidelines below when joining:
        </p>

        <ol class="portal-list">
          <li>
            <strong>Be Kind &amp; Neighborly:</strong> Treat every homepage as though you were
            visiting someone's living room. Disagreements belong in polite private messages, never
            in public guestbook rows.
          </li>
          <li>
            <strong>No Spam or Commercial Solicitation:</strong> The Meridian Ring is strictly a
            non-commercial hobbyist community. Affiliate banners, pop-ups, and automated chain ads
            are not permitted.
          </li>
          <li>
            <strong>Sign the Guestbooks:</strong> When you hop along the ring bar, take half a
            minute to leave a thoughtful hello in a neighbor's guestbook—it brightens a keeper's week!
          </li>
          <li>
            <strong>Credit Your Graphics &amp; Scripts:</strong> Whenever you borrow a tiled
            background, MIDI file, divider bar, or counter script from another member, include a
            small thank-you credit on your page or in your footer.
          </li>
          <li>
            <strong>Keep Personal Details Private:</strong> To help keep everyone's porch cozy and
            worry-free, we gently ask members to stick with friendly screen handles rather than
            posting full street addresses, phone numbers, real names, or school schedules on public
            pages—and to treat casual conversations from our member chat room with the same quiet
            courtesy by keeping them off public mirrors.
          </li>
        </ol>

        <div class="panel">
          <h3>Questions or Corrections?</h3>
          <p>
            If a ring link breaks or a guestbook receives unwanted spam, let
            <strong>lamplighter</strong> know and the moderation team will help sort it out promptly.
          </p>
        </div>

        <p class="signoff">— The Ring Moderators</p>`,
      }),
    },
    {
      url: 'meridian://ring-hub/join',
      title: 'Meridian Ring — How to Join',
      html: wrapHubPage({
        title: 'Meridian Ring — How to Join',
        heading: 'HOW TO JOIN THE MERIDIAN RING',
        subtitle: 'Membership Information & Application Form',
        activePath: '/join',
        bodyHtml: `
        <h2>Apply for Membership</h2>
        <p>
          Do you keep a personal homepage about gardening, crafts, astronomy, retro hobbies, or
          everyday life? All membership applications are reviewed personally by
          <strong>lamplighter</strong> and our volunteer moderators to ensure every newcomer fits
          our friendly neighborhood tone.
        </p>

        <div class="notice-construction">
          <strong>UNDER CONSTRUCTION:</strong> Our automated CGI application form is currently
          offline during the November snapshot archive. Please review the required fields below;
          live submissions will reopen once Tumbleweed Hosting finishes its weekend tidying.
        </div>

        <form class="join-form" action="#">
          <fieldset>
            <legend>Meridian Ring Application Form (Preview Only)</legend>

            <div class="form-row">
              <label for="join-site-title">Homepage Title</label>
              <input id="join-site-title" name="siteTitle" type="text" placeholder="e.g. Maple Street Apiary" />
            </div>

            <div class="form-row">
              <label for="join-handle">Preferred Owner Handle</label>
              <input id="join-handle" name="ownerHandle" type="text" placeholder="e.g. honeycomb_bea" />
            </div>

            <div class="form-row">
              <label for="join-category">Primary Topic</label>
              <select id="join-category" name="category">
                <option value="garden">Gardening, Nature &amp; Weather</option>
                <option value="crafts">Crafts, Baking &amp; Home</option>
                <option value="hobbies">Music, Railways &amp; Collecting</option>
                <option value="tech">Retro Computing &amp; Webcraft</option>
              </select>
            </div>

            <div class="form-row">
              <label for="join-desc">Short Directory Description (1–2 sentences)</label>
              <textarea id="join-desc" name="description" rows="3" placeholder="Tell neighbors what they will find on your page..."></textarea>
            </div>

            <div class="form-check">
              <input id="join-rules" name="agreeRules" type="checkbox" />
              <label for="join-rules">I have read and agree to the <a href="meridian://ring-hub/rules">Meridian Ring Community Rules</a>.</label>
            </div>

            <button class="join-submit" type="submit" disabled>Submit Application (Offline in Snapshot)</button>
          </fieldset>
        </form>

        <p class="signoff">— The Ring Moderators</p>`,
      }),
    },
    {
      url: 'meridian://ring-hub/start',
      title: 'Lantern Archive: Recovery Notes',
      grants: ['read_recovery_notes'],
      html: wrapHubPage({
        title: 'Lantern Archive: Recovery Notes',
        heading: 'LANTERN ARCHIVE: RECOVERY NOTES',
        subtitle: 'Orientation Guide from the Volunteer Archive Team',
        activePath: '/start',
        bodyHtml: `
        <h2>Welcome to the Lantern Archive</h2>
        <p>
          Thank you for helping us piece together the November 2002 Meridian Ring disk image. Before
          you start browsing the recovered pages, here are a few friendly notes on how this archive
          works:
        </p>

        <div class="panel">
          <h3>How to Explore &amp; Investigate</h3>
          <ol class="portal-list">
            <li>
              <strong>Recovered Snapshots:</strong> Every page you open is a preserved snapshot from
              late 2002. You are browsing a quiet historical mirror rather than the live web.
            </li>
            <li>
              <strong>Missing &amp; Unrecovered Links:</strong> Some directory entries and links lead
              to pages that have not been recovered yet—when that happens, the browser will show a
              missing-page notice. Check back as you uncover new leads!
            </li>
            <li>
              <strong>Saving Clues to Your Notebook:</strong> Whenever a date, phrase, or handle
              catches your eye on a page, highlight the text with your mouse and click
              <strong>Save selection</strong> in the toolbar (or right-click and choose
              <strong>Save to Notebook</strong>) to file it away.
            </li>
            <li>
              <strong>Reading View Source:</strong> Page keepers often tucked reminders, to-do notes,
              and comments into their HTML. Choose <strong>View Source</strong> in the browser menu
              to inspect a page's hidden notes.
            </li>
            <li>
              <strong>Connecting Clues on the Board:</strong> Open your <strong>Notebook</strong>
              app and switch to the <strong>Board</strong> view to link related clues together.
              Spotting how two separate clues relate can reveal where to look next.
            </li>
          </ol>
        </div>

        <p>
          Ready to begin? Head back to the <a href="meridian://ring-hub/">Meridian Ring Hub</a>, browse
          the <a href="meridian://ring-hub/members">Member Directory</a>, or pay a visit to
          <a href="meridian://delphines-garden/">Delphine's Garden</a>.
        </p>

        <p class="signoff">— The Volunteer Archive Team</p>`,
      }),
    },
  ],
};
