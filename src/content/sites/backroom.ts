import type { Site } from '../../engine/types';

type RankKind = 'Moderator' | 'Veteran' | 'Regular' | 'Newcomer';

interface ForumPostData {
  author: string;
  profileLinked?: boolean;
  rank: RankKind;
  joined: string;
  postsCount: number;
  avatarBg: string;
  avatarCode: string;
  timestamp: string;
  bodyHtml: string;
  signatureHtml?: string;
}

interface BackroomPageOptions {
  title: string;
  breadcrumbHtml: string;
  bodyHtml: string;
  topComment?: string;
}

const BACKROOM_STYLES = `
  :host, .bbs-body {
    background: #d3d7de;
    color: #1b1f24;
    font-family: Tahoma, Verdana, Arial, sans-serif;
    font-size: 12px;
    line-height: 1.5;
    margin: 0;
    padding: 12px 12px 24px;
  }
  * {
    box-sizing: border-box;
  }
  .bbs-shell {
    max-width: 820px;
    margin: 0 auto;
    background: #f5f6f8;
    border: 1px solid #4d5562;
  }
  .bbs-header {
    background: #22262d;
    color: #f2f4f7;
    padding: 11px 16px;
    border-bottom: 3px solid #596577;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .bbs-header h1 {
    margin: 0;
    font-size: 18px;
    color: #ffffff;
    letter-spacing: 0.03em;
  }
  .bbs-sub {
    margin: 2px 0 0 0;
    font-size: 11px;
    color: #cfd6e0;
  }
  .bbs-nav {
    background: #363d48;
    padding: 6px 14px;
    border-bottom: 1px solid #1d2128;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 12px;
  }
  .bbs-nav a {
    color: #eef3f9;
    text-decoration: none;
    font-weight: bold;
    padding: 2px 6px;
    border: 1px solid #596577;
    background: #2b313a;
  }
  .bbs-nav a:hover {
    background: #485261;
    color: #ffffff;
  }
  .bbs-crumbs {
    background: #e4e7ec;
    border-bottom: 1px solid #b8c0cc;
    padding: 6px 14px;
    font-size: 11px;
    color: #2b313a;
  }
  .bbs-crumbs a {
    color: #0f4880;
    font-weight: bold;
  }
  .bbs-main {
    padding: 14px 16px 18px;
  }
  h2 {
    margin: 0 0 8px 0;
    font-size: 15px;
    color: #1c2430;
    border-bottom: 1px solid #b8c0cc;
    padding-bottom: 4px;
  }
  h3 {
    margin: 12px 0 6px 0;
    font-size: 13px;
    color: #252f3d;
  }
  p {
    margin: 0 0 9px 0;
  }
  a {
    color: #0f4880;
    font-weight: bold;
  }
  a:hover {
    color: #7d2900;
  }
  table.bbs-table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 14px 0;
    border: 1px solid #7d8796;
    background: #ffffff;
    font-size: 12px;
  }
  table.bbs-table caption {
    text-align: left;
    font-weight: bold;
    color: #1c2430;
    padding: 0 0 5px 0;
    font-size: 12px;
  }
  table.bbs-table th {
    background: #2e3440;
    color: #f4f6f8;
    text-align: left;
    padding: 6px 8px;
    border: 1px solid #525b69;
    font-size: 11px;
  }
  table.bbs-table td {
    padding: 7px 8px;
    border: 1px solid #c9d0da;
    vertical-align: top;
  }
  table.bbs-table tbody tr:nth-child(even) {
    background: #eef1f5;
  }
  .strip-box {
    background: #e7eaef;
    border: 1px solid #a8b2c1;
    padding: 8px 11px;
    margin: 10px 0;
    font-size: 11px;
  }
  .rank-badge {
    display: inline-block;
    padding: 1px 6px;
    font-size: 10px;
    font-weight: bold;
    border-radius: 2px;
    margin-top: 3px;
    letter-spacing: 0.02em;
  }
  .rank-Moderator {
    background: #163d2c;
    color: #e8fff3;
  }
  .rank-Veteran {
    background: #2c3359;
    color: #eef1ff;
  }
  .rank-Regular {
    background: #3b424c;
    color: #ffffff;
  }
  .rank-Newcomer {
    background: #594218;
    color: #fff8e6;
  }
  .rank-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-top: 6px;
  }
  article.forum-post {
    border: 1px solid #8a94a3;
    margin-bottom: 10px;
    display: grid;
    grid-template-columns: 162px 1fr;
  }
  article.forum-post.row-odd {
    background: #f2f4f7;
  }
  article.forum-post.row-even {
    background: #e6e9ee;
  }
  @media (max-width: 600px) {
    article.forum-post {
      grid-template-columns: 1fr;
    }
  }
  .post-usercol {
    padding: 10px;
    border-right: 1px solid #b5becb;
    background: rgba(255, 255, 255, 0.35);
    font-size: 11px;
  }
  @media (max-width: 600px) {
    .post-usercol {
      border-right: 0;
      border-bottom: 1px solid #b5becb;
    }
  }
  .post-username {
    font-weight: bold;
    font-size: 12px;
    color: #16202b;
    word-break: break-word;
  }
  .avatar-box {
    width: 44px;
    height: 44px;
    margin: 6px 0;
    border: 2px solid #4d5562;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Courier New', monospace;
    font-weight: bold;
    font-size: 14px;
    color: #ffffff;
    letter-spacing: 0.04em;
  }
  .user-meta {
    margin-top: 5px;
    color: #2f3742;
    font-size: 11px;
    line-height: 1.4;
  }
  .post-bodycol {
    padding: 8px 12px 10px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .post-bar {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    border-bottom: 1px solid #c3cad5;
    padding-bottom: 4px;
    margin-bottom: 8px;
    font-size: 11px;
    color: #2e3744;
  }
  .post-time {
    font-family: 'Courier New', monospace;
    font-weight: bold;
  }
  .post-content p:last-child {
    margin-bottom: 0;
  }
  .post-sig {
    margin-top: 10px;
    padding-top: 6px;
    border-top: 1px dashed #9aa4b2;
    font-size: 11px;
    color: #303845;
  }
  .profile-card {
    background: #ffffff;
    border: 1px solid #8a94a3;
    padding: 14px 16px;
    margin: 10px 0;
  }
  .search-box {
    background: #e7eaef;
    border: 1px solid #8a94a3;
    padding: 14px 16px;
    margin: 12px 0;
  }
  .search-box label {
    display: block;
    font-weight: bold;
    margin-bottom: 4px;
    font-size: 12px;
  }
  .search-box input[type="text"],
  .search-box select {
    width: 100%;
    max-width: 360px;
    padding: 5px 7px;
    border: 1px solid #6b7685;
    background: #ffffff;
    color: #1b1f24;
    margin-bottom: 10px;
    font-size: 12px;
  }
  .bbs-btn-disabled {
    padding: 5px 12px;
    background: #cfd5de;
    color: #2f3744;
    border: 1px solid #7d8796;
    font-weight: bold;
    cursor: not-allowed;
  }
  .bbs-footer {
    background: #22262d;
    color: #cfd6e0;
    padding: 8px 14px;
    font-size: 11px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }
  .bbs-footer a {
    color: #dce9f8;
  }
`;

function wrapBackroomPage({
  title,
  breadcrumbHtml,
  bodyHtml,
  topComment,
}: BackroomPageOptions): string {
  const commentBlock = topComment ? `\n  ${topComment}` : '';
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${BACKROOM_STYLES}</style>
</head>
<body class="bbs-body">${commentBlock}
  <div class="bbs-shell">
    <header class="bbs-header">
      <div>
        <h1>The Backroom Forum</h1>
        <p class="bbs-sub">Meridian Ring Community Bulletin Board · Snapshot <time>11/08/2002</time></p>
      </div>
      <div class="bbs-sub">
        Powered by MeridianBoard v1.4
      </div>
    </header>
    <nav class="bbs-nav" aria-label="Backroom Forum navigation">
      <a href="meridian://backroom/">Board Index</a>
      <a href="meridian://backroom/general">General Chat</a>
      <a href="meridian://backroom/show">Show Your Site</a>
      <a href="meridian://backroom/tech">Tech Help</a>
      <a href="meridian://backroom/offtopic">Off Topic</a>
      <a href="meridian://backroom/search">Search</a>
      <a href="meridian://ring-hub/">Meridian Ring Hub</a>
    </nav>
    <div class="bbs-crumbs">
      ${breadcrumbHtml}
    </div>
    <main class="bbs-main">
      ${bodyHtml}
    </main>
    <footer class="bbs-footer">
      <span>The Backroom Forum · Meridian Cluster 04 · <a href="meridian://ring-hub/">Return to Ring Hub</a></span>
      <span>All times EST · Archive snapshot <time>11/08/2002</time></span>
    </footer>
  </div>
</body>
</html>`;
}

function renderPosts(posts: readonly ForumPostData[]): string {
  return posts
    .map((post, idx) => {
      const rowClass = idx % 2 === 0 ? 'row-odd' : 'row-even';
      const authorMarkup = post.profileLinked
        ? `<a href="meridian://backroom/user/${post.author}">${post.author}</a>`
        : post.author;
      const sigMarkup = post.signatureHtml
        ? `<div class="post-sig">${post.signatureHtml}</div>`
        : '';

      return `
      <article class="forum-post ${rowClass}">
        <div class="post-usercol">
          <div class="post-username">${authorMarkup}</div>
          <span class="rank-badge rank-${post.rank}">${post.rank}</span>
          <div class="avatar-box" style="background: ${post.avatarBg};" aria-hidden="true">${post.avatarCode}</div>
          <div class="user-meta">
            Joined: <time>${post.joined}</time><br />
            Posts: ${post.postsCount}
          </div>
        </div>
        <div class="post-bodycol">
          <div>
            <div class="post-bar">
              <span>Post #${idx + 1}</span>
              <time class="post-time">${post.timestamp}</time>
            </div>
            <div class="post-content">
              ${post.bodyHtml}
            </div>
          </div>
          ${sigMarkup}
        </div>
      </article>`;
    })
    .join('\n');
}

const SIG_LAMPLIGHTER =
  'keep a light in the window · <a href="meridian://lamplighter/">meridian://lamplighter/</a>';
const SIG_WREN =
  'still awake on dial-up · <a href="meridian://nightcrawler/">meridian://nightcrawler/</a> — wren out';
const SIG_DARKPIXEL =
  '8-bit sprites &amp; late night chili // Pixel Dungeon Almanac';
const SIG_GLITTER =
  '~* SparkleZone 99 *~ stay shiny!!';
const SIG_DELPHINE =
  '~ Delphine (<a href="meridian://delphines-garden/">Delphine\'s Garden</a>)';

export const BACKROOM_SITE: Site = {
  id: 'backroom',
  name: 'The Backroom Forum',
  pages: [
    {
      url: 'meridian://backroom/',
      title: 'The Backroom Forum — Board Index',
      grants: ['visited_backroom'],
      html: wrapBackroomPage({
        title: 'The Backroom Forum — Board Index',
        breadcrumbHtml: '<strong>Board Index</strong>',
        topComment: '<!-- admin note: do not delete archive tables before the 9th -->',
        bodyHtml: `
      <h2>Community Discussion Boards</h2>
      <table class="bbs-table">
        <caption>Meridian Ring Forum Categories</caption>
        <thead>
          <tr>
            <th scope="col">Board</th>
            <th scope="col">Threads</th>
            <th scope="col">Posts</th>
            <th scope="col">Last Post</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <a href="meridian://backroom/general">General Chat</a><br />
              Ring announcements, introductions, and neighborhood small talk.
            </td>
            <td>7</td>
            <td>31</td>
            <td>
              <time>11/08/2002 22:02</time><br />
              by <a href="meridian://backroom/user/lamplighter">lamplighter</a>
            </td>
          </tr>
          <tr>
            <td>
              <a href="meridian://backroom/show">Show Your Site</a><br />
              Share updates, swap HTML tips, and recruit friendly beta testers.
            </td>
            <td>6</td>
            <td>24</td>
            <td>
              <time>10/25/2002 17:40</time><br />
              by <a href="meridian://backroom/user/GlitterGirl_99">GlitterGirl_99</a>
            </td>
          </tr>
          <tr>
            <td>
              <a href="meridian://backroom/tech">Tech Help</a><br />
              CGI counters, FTP backups, dial-up troubleshooting, and hosting notes.
            </td>
            <td>6</td>
            <td>28</td>
            <td>
              <time>11/05/2002 23:18</time><br />
              by <a href="meridian://backroom/user/nightcrawler_wren">nightcrawler_wren</a>
            </td>
          </tr>
          <tr>
            <td>
              <a href="meridian://backroom/offtopic">Off Topic</a><br />
              Recipes, late-night radio, MIDI vs MP3 debates, and #the-ring chatter.
            </td>
            <td>6</td>
            <td>26</td>
            <td>
              <time>10/18/2002 21:12</time><br />
              by <a href="meridian://backroom/user/xX_DarkPixel_Xx">xX_DarkPixel_Xx</a>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="strip-box">
        <strong>Who's online right now (6 members):</strong>
        <a href="meridian://backroom/user/lamplighter">lamplighter</a>,
        <a href="meridian://backroom/user/nightcrawler_wren">nightcrawler_wren</a>,
        <a href="meridian://backroom/user/xX_DarkPixel_Xx">xX_DarkPixel_Xx</a>,
        <a href="meridian://backroom/user/GlitterGirl_99">GlitterGirl_99</a>,
        delphine_aubrey, baker_tom
      </div>

      <div class="strip-box">
        <strong>Rank Legend:</strong>
        <div class="rank-legend">
          <span class="rank-badge rank-Newcomer">Newcomer</span> (0–24 posts)
          <span class="rank-badge rank-Regular">Regular</span> (25–149 posts)
          <span class="rank-badge rank-Veteran">Veteran</span> (150+ posts)
          <span class="rank-badge rank-Moderator">Moderator</span> (Ring Staff)
        </div>
      </div>

      <h3>Featured Member Profiles</h3>
      <p>
        <a href="meridian://backroom/user/lamplighter">lamplighter</a> ·
        <a href="meridian://backroom/user/nightcrawler_wren">nightcrawler_wren</a> ·
        <a href="meridian://backroom/user/xX_DarkPixel_Xx">xX_DarkPixel_Xx</a> ·
        <a href="meridian://backroom/user/GlitterGirl_99">GlitterGirl_99</a>
      </p>`,
      }),
    },
    {
      url: 'meridian://backroom/general',
      title: 'The Backroom Forum — General Chat',
      html: wrapBackroomPage({
        title: 'The Backroom Forum — General Chat',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>General Chat</strong>',
        bodyHtml: `
      <h2>General Chat</h2>
      <table class="bbs-table">
        <caption>Topics in General Chat (7 threads)</caption>
        <thead>
          <tr>
            <th scope="col">Thread Title</th>
            <th scope="col">Author</th>
            <th scope="col">Replies</th>
            <th scope="col">Views</th>
            <th scope="col">Last Post</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a href="meridian://backroom/thread/thanks-for-everything-ring">Thanks for everything, Ring</a></td>
            <td><a href="meridian://backroom/user/lamplighter">lamplighter</a></td>
            <td>2</td>
            <td>94</td>
            <td><time>11/08/2002 22:02</time></td>
          </tr>
          <tr>
            <td><a href="meridian://backroom/thread/welcome-please-read">Welcome thread (please read)</a></td>
            <td><a href="meridian://backroom/user/lamplighter">lamplighter</a></td>
            <td>3</td>
            <td>418</td>
            <td><time>10/14/2002 19:22</time></td>
          </tr>
          <tr>
            <td><a href="meridian://backroom/thread/autumn-coffee-meetup">Autumn site anniversary &amp; coffee thread</a></td>
            <td>marigold_may</td>
            <td>2</td>
            <td>112</td>
            <td><time>10/09/2002 18:15</time></td>
          </tr>
          <tr>
            <td>New autumn site banners in the Hub directory</td>
            <td>mrs_henderson_42</td>
            <td>4</td>
            <td>88</td>
            <td><time>09/21/2002 14:05</time></td>
          </tr>
          <tr>
            <td>Who else gets disconnected when the kitchen phone rings?</td>
            <td>baker_tom</td>
            <td>6</td>
            <td>147</td>
            <td><time>09/03/2002 20:41</time></td>
          </tr>
          <tr>
            <td>Thank-you thread for Wren's summer nav-bar cleanup</td>
            <td>barnaby_clocks</td>
            <td>5</td>
            <td>133</td>
            <td><time>07/24/2002 11:30</time></td>
          </tr>
          <tr>
            <td>February 2002: One whole year of the Meridian Ring!</td>
            <td><a href="meridian://backroom/user/lamplighter">lamplighter</a></td>
            <td>8</td>
            <td>265</td>
            <td><time>02/11/2002 21:08</time></td>
          </tr>
        </tbody>
      </table>`,
      }),
    },
    {
      url: 'meridian://backroom/show',
      title: 'The Backroom Forum — Show Your Site',
      html: wrapBackroomPage({
        title: 'The Backroom Forum — Show Your Site',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>Show Your Site</strong>',
        bodyHtml: `
      <h2>Show Your Site</h2>
      <table class="bbs-table">
        <caption>Topics in Show Your Site (6 threads)</caption>
        <thead>
          <tr>
            <th scope="col">Thread Title</th>
            <th scope="col">Author</th>
            <th scope="col">Replies</th>
            <th scope="col">Views</th>
            <th scope="col">Last Post</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a href="meridian://backroom/thread/beta-testers-fan-site">Seeking beta testers for my fan site</a></td>
            <td><a href="meridian://backroom/user/GlitterGirl_99">GlitterGirl_99</a></td>
            <td>3</td>
            <td>126</td>
            <td><time>10/25/2002 17:40</time></td>
          </tr>
          <tr>
            <td>Updated my End-of-Summer Tomato Chutney recipe page!</td>
            <td>delphine_aubrey</td>
            <td>4</td>
            <td>164</td>
            <td><time>10/13/2002 10:15</time></td>
          </tr>
          <tr>
            <td>Added 12 new 8-bit dungeon boss sprites</td>
            <td><a href="meridian://backroom/user/xX_DarkPixel_Xx">xX_DarkPixel_Xx</a></td>
            <td>5</td>
            <td>191</td>
            <td><time>09/29/2002 23:04</time></td>
          </tr>
          <tr>
            <td>Cosmos and pressed violet scans uploaded</td>
            <td>clara_pressed</td>
            <td>3</td>
            <td>79</td>
            <td><time>08/19/2002 15:52</time></td>
          </tr>
          <tr>
            <td>New signal-box wiring diagram on the railway diary</td>
            <td>stationmaster_hal</td>
            <td>2</td>
            <td>64</td>
            <td><time>07/08/2002 18:27</time></td>
          </tr>
          <tr>
            <td>Midnight layout refresh at NightCrawler.net</td>
            <td><a href="meridian://backroom/user/nightcrawler_wren">nightcrawler_wren</a></td>
            <td>4</td>
            <td>152</td>
            <td><time>05/16/2002 01:44</time></td>
          </tr>
        </tbody>
      </table>`,
      }),
    },
    {
      url: 'meridian://backroom/tech',
      title: 'The Backroom Forum — Tech Help',
      html: wrapBackroomPage({
        title: 'The Backroom Forum — Tech Help',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>Tech Help</strong>',
        bodyHtml: `
      <h2>Tech Help</h2>
      <table class="bbs-table">
        <caption>Topics in Tech Help (6 threads)</caption>
        <thead>
          <tr>
            <th scope="col">Thread Title</th>
            <th scope="col">Author</th>
            <th scope="col">Replies</th>
            <th scope="col">Views</th>
            <th scope="col">Last Post</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a href="meridian://backroom/thread/backing-up-your-site">Backing up your site: a tutorial</a></td>
            <td><a href="meridian://backroom/user/nightcrawler_wren">nightcrawler_wren</a></td>
            <td>3</td>
            <td>214</td>
            <td><time>11/05/2002 23:18</time></td>
          </tr>
          <tr>
            <td><a href="meridian://backroom/thread/server-slow-tonight">Anyone else notice the server was slow tonight?</a></td>
            <td>bandpass_lou</td>
            <td>3</td>
            <td>149</td>
            <td><time>10/27/2002 23:44</time></td>
          </tr>
          <tr>
            <td><a href="meridian://backroom/thread/whose-counter-is-broken">Whose counter is broken?!</a></td>
            <td>delphine_aubrey</td>
            <td>3</td>
            <td>183</td>
            <td><time>10/11/2002 21:19</time></td>
          </tr>
          <tr>
            <td>FTP passive mode checkbox in CuteFTP / WS_FTP</td>
            <td>baud_rate_kyle</td>
            <td>4</td>
            <td>117</td>
            <td><time>09/14/2002 19:55</time></td>
          </tr>
          <tr>
            <td>My table cells keep drifting right in 800x600</td>
            <td>barnaby_clocks</td>
            <td>5</td>
            <td>98</td>
            <td><time>07/15/2002 16:40</time></td>
          </tr>
          <tr>
            <td>Safe ways to keep your guestbook spam-free</td>
            <td><a href="meridian://backroom/user/lamplighter">lamplighter</a></td>
            <td>6</td>
            <td>204</td>
            <td><time>04/22/2002 20:11</time></td>
          </tr>
        </tbody>
      </table>`,
      }),
    },
    {
      url: 'meridian://backroom/offtopic',
      title: 'The Backroom Forum — Off Topic',
      html: wrapBackroomPage({
        title: 'The Backroom Forum — Off Topic',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>Off Topic</strong>',
        bodyHtml: `
      <h2>Off Topic</h2>
      <table class="bbs-table">
        <caption>Topics in Off Topic (6 threads)</caption>
        <thead>
          <tr>
            <th scope="col">Thread Title</th>
            <th scope="col">Author</th>
            <th scope="col">Replies</th>
            <th scope="col">Views</th>
            <th scope="col">Last Post</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a href="meridian://backroom/thread/midi-vs-mp3-debate">midi vs mp3 debate</a></td>
            <td><a href="meridian://backroom/user/xX_DarkPixel_Xx">xX_DarkPixel_Xx</a></td>
            <td>3</td>
            <td>175</td>
            <td><time>10/18/2002 21:12</time></td>
          </tr>
          <tr>
            <td><a href="meridian://backroom/thread/chat-bot-at-night">Does anyone talk to the chat bot at night?</a></td>
            <td><a href="meridian://backroom/user/GlitterGirl_99">GlitterGirl_99</a></td>
            <td>4</td>
            <td>209</td>
            <td><time>10/06/2002 23:31</time></td>
          </tr>
          <tr>
            <td>Best rainy-day tea blends while coding HTML</td>
            <td>tea_and_tweed</td>
            <td>7</td>
            <td>142</td>
            <td><time>09/25/2002 16:48</time></td>
          </tr>
          <tr>
            <td>First frost predictions for October</td>
            <td>oldmill_weather</td>
            <td>3</td>
            <td>71</td>
            <td><time>09/10/2002 09:14</time></td>
          </tr>
          <tr>
            <td>Weird late-night numbers stations on shortwave</td>
            <td>bandpass_lou</td>
            <td>5</td>
            <td>163</td>
            <td><time>08/02/2002 00:52</time></td>
          </tr>
          <tr>
            <td>What is everyone reading this summer?</td>
            <td>mrs_henderson_42</td>
            <td>6</td>
            <td>119</td>
            <td><time>06/28/2002 15:20</time></td>
          </tr>
        </tbody>
      </table>`,
      }),
    },
    {
      url: 'meridian://backroom/thread/welcome-please-read',
      title: 'Welcome thread (please read) — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Welcome thread (please read) — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/general">General Chat</a> &gt; <strong>Welcome thread (please read)</strong>',
        bodyHtml: `
      <h2>Topic: Welcome thread (please read) (Thread #0418)</h2>
      ${renderPosts([
        {
          author: 'lamplighter',
          profileLinked: true,
          rank: 'Moderator',
          joined: '02/2001',
          postsCount: 412,
          avatarBg: '#1c3b2f',
          avatarCode: 'LMP',
          timestamp: '02/14/2001 20:10',
          bodyHtml: `<p>Welcome to The Backroom Forum, neighbors. This board is our shared porch for asking HTML questions, announcing page updates, and getting to know fellow Meridian Ring keepers.</p><p>Please keep conversations kind, remember that young folks and retirees alike read these pages, and keep real street addresses, phone numbers, and school details private behind your handle.</p>`,
          signatureHtml: SIG_LAMPLIGHTER,
        },
        {
          author: 'delphine_aubrey',
          rank: 'Veteran',
          joined: '02/2001',
          postsCount: 184,
          avatarBg: '#6d314b',
          avatarCode: 'DLP',
          timestamp: '02/15/2001 10:42',
          bodyHtml: `<p>Thank you for setting up such a tidy corkboard for us, dear! I have already bookmarked Tech Help for the next time my table borders wander off.</p>`,
          signatureHtml: SIG_DELPHINE,
        },
        {
          author: 'nightcrawler_wren',
          profileLinked: true,
          rank: 'Veteran',
          joined: '06/2001',
          postsCount: 289,
          avatarBg: '#253147',
          avatarCode: 'WRN',
          timestamp: '06/12/2001 01:18',
          bodyHtml: `<p>just checking in! if anyone breaks their layout table at midnight feel free to yell at me here or in #the-ring</p>`,
          signatureHtml: SIG_WREN,
        },
        {
          author: 'lamplighter',
          profileLinked: true,
          rank: 'Moderator',
          joined: '02/2001',
          postsCount: 412,
          avatarBg: '#1c3b2f',
          avatarCode: 'LMP',
          timestamp: '10/14/2002 19:22',
          bodyHtml: `<p>Quick autumn reminder for newer members: please review our Hub rules on credit lines and personal privacy whenever you add a guestbook or chat widget.</p>`,
          signatureHtml: SIG_LAMPLIGHTER,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/thread/whose-counter-is-broken',
      title: 'Whose counter is broken?! — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Whose counter is broken?! — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/tech">Tech Help</a> &gt; <strong>Whose counter is broken?!</strong>',
        bodyHtml: `
      <h2>Topic: Whose counter is broken?!</h2>
      ${renderPosts([
        {
          author: 'delphine_aubrey',
          rank: 'Veteran',
          joined: '02/2001',
          postsCount: 184,
          avatarBg: '#6d314b',
          avatarCode: 'DLP',
          timestamp: '10/11/2002 17:04',
          bodyHtml: `<p>Oh dear... my little green visitor counter has been sitting politely at 014,382 since Tuesday afternoon! I gave the monitor a gentle pat, and Biscuit sat on the mouse, yet still no luck. Did Tumbleweed move the counter folder again?</p>`,
          signatureHtml: SIG_DELPHINE,
        },
        {
          author: 'nightcrawler_wren',
          profileLinked: true,
          rank: 'Veteran',
          joined: '06/2001',
          postsCount: 289,
          avatarBg: '#253147',
          avatarCode: 'WRN',
          timestamp: '10/11/2002 19:33',
          bodyHtml: `<p>haha mrs a, i looked at your source and you accidentally pasted your tomato chutney ingredients right over the counter path! i'll upload a clean counter snippet tonight once i finish fighting my own css</p>`,
          signatureHtml: SIG_WREN,
        },
        {
          author: 'xX_DarkPixel_Xx',
          profileLinked: true,
          rank: 'Regular',
          joined: '07/2001',
          postsCount: 108,
          avatarBg: '#2f2947',
          avatarCode: 'DPX',
          timestamp: '10/11/2002 20:15',
          bodyHtml: `<p>LOLLL wait tomato chutney html?! ngl Mrs A that is actually legendary. hey nightcrawler_wren check my site counter too when ur at it mine skipped from 400 straight to 4096 somehow</p>`,
          signatureHtml: SIG_DARKPIXEL,
        },
        {
          author: 'delphine_aubrey',
          rank: 'Veteran',
          joined: '02/2001',
          postsCount: 184,
          avatarBg: '#6d314b',
          avatarCode: 'DLP',
          timestamp: '10/11/2002 21:19',
          bodyHtml: `<p>Oh, bless your patience, Wren! No wonder the poor script smelled like cider vinegar. I shall put a proper thank-you note on my Recipes page tomorrow!</p>`,
          signatureHtml: SIG_DELPHINE,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/thread/midi-vs-mp3-debate',
      title: 'midi vs mp3 debate — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'midi vs mp3 debate — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/offtopic">Off Topic</a> &gt; <strong>midi vs mp3 debate</strong>',
        bodyHtml: `
      <h2>Topic: midi vs mp3 debate</h2>
      ${renderPosts([
        {
          author: 'xX_DarkPixel_Xx',
          profileLinked: true,
          rank: 'Regular',
          joined: '07/2001',
          postsCount: 108,
          avatarBg: '#2f2947',
          avatarCode: 'DPX',
          timestamp: '10/17/2002 22:08',
          bodyHtml: `<p>OK SERIOUS QUESTION: why do half the pages on this ring still auto-play 14kb midi loops when mp3s exist?? give me real guitars or give me silence lol</p>`,
          signatureHtml: SIG_DARKPIXEL,
        },
        {
          author: 'synth_archivist',
          rank: 'Regular',
          joined: '06/2001',
          postsCount: 74,
          avatarBg: '#334457',
          avatarCode: 'SYN',
          timestamp: '10/18/2002 09:45',
          bodyHtml: `<p>Because an MP3 eats three megabytes out of a 15 MB Starter plan and takes twenty minutes over a 56k modem! A tidy MIDI file loads before you finish reading the first paragraph.</p>`,
        },
        {
          author: 'GlitterGirl_99',
          profileLinked: true,
          rank: 'Regular',
          joined: '08/2001',
          postsCount: 93,
          avatarBg: '#6a2c5a',
          avatarCode: 'GG9',
          timestamp: '10/18/2002 16:20',
          bodyHtml: `<p>xX_DarkPixel_Xx don't be mean!! delphine_aubrey's Biscuit's Waltz midi is SO CUTE and my dad yells if i download big mp3 files on the family line!!</p>`,
          signatureHtml: SIG_GLITTER,
        },
        {
          author: 'bandpass_lou',
          rank: 'Regular',
          joined: '08/2001',
          postsCount: 62,
          avatarBg: '#3c3b28',
          avatarCode: 'LOU',
          timestamp: '10/18/2002 21:12',
          bodyHtml: `<p>Honestly I just want a text label telling me what song is playing so I don't jump out of my chair at 1 AM when my speakers are turned up.</p>`,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/thread/server-slow-tonight',
      title: 'Anyone else notice the server was slow tonight? — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Anyone else notice the server was slow tonight? — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/tech">Tech Help</a> &gt; <strong>Anyone else notice the server was slow tonight?</strong>',
        bodyHtml: `
      <h2>Topic: Anyone else notice the server was slow tonight?</h2>
      ${renderPosts([
        {
          author: 'bandpass_lou',
          rank: 'Regular',
          joined: '08/2001',
          postsCount: 62,
          avatarBg: '#3c3b28',
          avatarCode: 'LOU',
          timestamp: '10/27/2002 22:18',
          bodyHtml: `<p>Tried uploading my October shortwave log around 22:00 and FTP timed out three times in a row. Page loads on Cluster 04 felt sluggish too—anyone else seeing weird lag?</p>`,
        },
        {
          author: 'nightcrawler_wren',
          profileLinked: true,
          rank: 'Veteran',
          joined: '06/2001',
          postsCount: 289,
          avatarBg: '#253147',
          avatarCode: 'WRN',
          timestamp: '10/27/2002 22:51',
          bodyHtml: `<p>yeah i noticed it too. traceroute stalled right outside tumbleweed's gateway and my server logs showed a bunch of automated directory requests hammering public guestbooks. probably just search spiders or host diagnostics</p>`,
          signatureHtml: SIG_WREN,
        },
        {
          author: 'lamplighter',
          profileLinked: true,
          rank: 'Moderator',
          joined: '02/2001',
          postsCount: 412,
          avatarBg: '#1c3b2f',
          avatarCode: 'LMP',
          timestamp: '10/27/2002 23:20',
          bodyHtml: `<p>Thank you both for flagging it. Tumbleweed mentioned they are preparing hardware changes on Group 4 early next month, which can cause brief slowdowns during indexing. Still worth keeping a fresh copy of your pages on disk, just to be safe.</p>`,
          signatureHtml: SIG_LAMPLIGHTER,
        },
        {
          author: 'xX_DarkPixel_Xx',
          profileLinked: true,
          rank: 'Regular',
          joined: '07/2001',
          postsCount: 108,
          avatarBg: '#2f2947',
          avatarCode: 'DPX',
          timestamp: '10/27/2002 23:44',
          bodyHtml: `<p>man my upload stalled right at 98% lol. guess i'll finish pushing my sprite sheet tomorrow</p>`,
          signatureHtml: SIG_DARKPIXEL,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/thread/backing-up-your-site',
      title: 'Backing up your site: a tutorial — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Backing up your site: a tutorial — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/tech">Tech Help</a> &gt; <strong>Backing up your site: a tutorial</strong>',
        bodyHtml: `
      <h2>Topic: Backing up your site: a tutorial</h2>
      ${renderPosts([
        {
          author: 'nightcrawler_wren',
          profileLinked: true,
          rank: 'Veteran',
          joined: '06/2001',
          postsCount: 289,
          avatarBg: '#253147',
          avatarCode: 'WRN',
          timestamp: '11/05/2002 21:40',
          bodyHtml: `<p>hey everyone, since tumbleweed is doing their weekend cluster shuffle soon, here is a quick no-stress checklist so nobody loses a single gif or guestbook entry:</p><p>1. open your ftp client and drag your entire public_html AND cgi-bin folders into a dated folder on your C: drive.<br />2. copy the whole thing onto a clean 1.44MB floppy disk (or burn it to a CD-R if you have tons of mp3s or photos).<br />3. double-check your local index.html opens offline in your browser!</p>`,
          signatureHtml: SIG_WREN,
        },
        {
          author: 'mrs_henderson_42',
          rank: 'Regular',
          joined: '06/2001',
          postsCount: 48,
          avatarBg: '#4c4333',
          avatarCode: 'MH4',
          timestamp: '11/05/2002 22:15',
          bodyHtml: `<p>Thank you, Wren! Copied my poetry pages onto two floppies and tucked them beside my tea tin. Also reminding folks about the county library book-and-seed meetup on 11/16 if the weather holds!</p>`,
        },
        {
          author: 'barnaby_clocks',
          rank: 'Regular',
          joined: '03/2001',
          postsCount: 57,
          avatarBg: '#453627',
          avatarCode: 'BRN',
          timestamp: '11/05/2002 22:48',
          bodyHtml: `<p>Saved mine to CD-R tonight. Much clearer instructions than the host FAQ!</p>`,
        },
        {
          author: 'nightcrawler_wren',
          profileLinked: true,
          rank: 'Veteran',
          joined: '06/2001',
          postsCount: 289,
          avatarBg: '#253147',
          avatarCode: 'WRN',
          timestamp: '11/05/2002 23:18',
          bodyHtml: `<p>glad it helped! also backed up mrs a's tomato chutney page for her while she was baking scones</p>`,
          signatureHtml: SIG_WREN,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/thread/chat-bot-at-night',
      title: 'Does anyone talk to the chat bot at night? — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Does anyone talk to the chat bot at night? — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/offtopic">Off Topic</a> &gt; <strong>Does anyone talk to the chat bot at night?</strong>',
        bodyHtml: `
      <h2>Topic: Does anyone talk to the chat bot at night?</h2>
      ${renderPosts([
        {
          author: 'GlitterGirl_99',
          profileLinked: true,
          rank: 'Regular',
          joined: '08/2001',
          postsCount: 93,
          avatarBg: '#6a2c5a',
          avatarCode: 'GG9',
          timestamp: '10/06/2002 21:55',
          bodyHtml: `<p>ok random question!! whenever nobody is awake in #the-ring after 11 PM that little halcyon helper bot answers questions about HTML tags and stuff!! has anyone else chatted with it when they couldn't sleep??</p>`,
          signatureHtml: SIG_GLITTER,
        },
        {
          author: 'xX_DarkPixel_Xx',
          profileLinked: true,
          rank: 'Regular',
          joined: '07/2001',
          postsCount: 108,
          avatarBg: '#2f2947',
          avatarCode: 'DPX',
          timestamp: '10/06/2002 22:18',
          bodyHtml: `<p>lol yeah it helped me center a marquee once! super polite too, way nicer than regular irc bots</p>`,
          signatureHtml: SIG_DARKPIXEL,
        },
        {
          author: 'halcyon',
          rank: 'Newcomer',
          joined: '09/2002',
          postsCount: 4,
          avatarBg: '#2a3d45',
          avatarCode: 'HLC',
          timestamp: '10/06/2002 22:34',
          bodyHtml: `<p>Good evening. Thank you for the kind remarks. I remain available in the chat channel whenever members request assistance with HTML formatting or directory lookups.</p>`,
        },
        {
          author: 'nightcrawler_wren',
          profileLinked: true,
          rank: 'Veteran',
          joined: '06/2001',
          postsCount: 289,
          avatarBg: '#253147',
          avatarCode: 'WRN',
          timestamp: '10/06/2002 23:02',
          bodyHtml: `<p>wild, didn't even know it had a forum account haha. honestly it remembers everything you tell it—last week it reminded me which css file i broke in july</p>`,
          signatureHtml: SIG_WREN,
        },
        {
          author: 'baker_tom',
          rank: 'Newcomer',
          joined: '09/2001',
          postsCount: 19,
          avatarBg: '#57432a',
          avatarCode: 'TOM',
          timestamp: '10/06/2002 23:31',
          bodyHtml: `<p>I asked it for conversion ratios between Fahrenheit and Celsius while testing sourdough loaves—worked like a charm! See you folks at the 10/09 bakery anniversary thread.</p>`,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/thread/beta-testers-fan-site',
      title: 'Seeking beta testers for my fan site — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Seeking beta testers for my fan site — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/show">Show Your Site</a> &gt; <strong>Seeking beta testers for my fan site</strong>',
        bodyHtml: `
      <h2>Topic: Seeking beta testers for my fan site</h2>
      ${renderPosts([
        {
          author: 'GlitterGirl_99',
          profileLinked: true,
          rank: 'Regular',
          joined: '08/2001',
          postsCount: 93,
          avatarBg: '#6a2c5a',
          avatarCode: 'GG9',
          timestamp: '10/24/2002 18:10',
          bodyHtml: `<p>HIIII everyone!! i just rebuilt SparkleZone 99 with pastel lavender tables and a brand new sticker-swap poll!! can two or three people click through on 800x600 and tell me if anything looks crooked?!</p>`,
          signatureHtml: SIG_GLITTER,
        },
        {
          author: 'xX_DarkPixel_Xx',
          profileLinked: true,
          rank: 'Regular',
          joined: '07/2001',
          postsCount: 108,
          avatarBg: '#2f2947',
          avatarCode: 'DPX',
          timestamp: '10/24/2002 20:45',
          bodyHtml: `<p>checked it just now GlitterGirl_99! frames load fast and the poll buttons work. maybe ask nightcrawler_wren about that bottom border pixel gap tho</p>`,
          signatureHtml: SIG_DARKPIXEL,
        },
        {
          author: 'clara_pressed',
          rank: 'Regular',
          joined: '03/2001',
          postsCount: 41,
          avatarBg: '#39523b',
          avatarCode: 'CLR',
          timestamp: '10/25/2002 12:18',
          bodyHtml: `<p>Looks lovely and bright on my monitor! Your handwriting divider reminds me of Delphine's porch banners.</p>`,
        },
        {
          author: 'GlitterGirl_99',
          profileLinked: true,
          rank: 'Regular',
          joined: '08/2001',
          postsCount: 93,
          avatarBg: '#6a2c5a',
          avatarCode: 'GG9',
          timestamp: '10/25/2002 17:40',
          bodyHtml: `<p>YAY!! thank you xX_DarkPixel_Xx and clara_pressed!! i'll bug nightcrawler_wren later about the 2px gap haha!</p>`,
          signatureHtml: SIG_GLITTER,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/thread/autumn-coffee-meetup',
      title: 'Autumn site anniversary & coffee thread — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Autumn site anniversary & coffee thread — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/general">General Chat</a> &gt; <strong>Autumn site anniversary &amp; coffee thread</strong>',
        bodyHtml: `
      <h2>Topic: Autumn site anniversary &amp; coffee thread (Thread #1104)</h2>
      ${renderPosts([
        {
          author: 'marigold_may',
          rank: 'Regular',
          joined: '09/2001',
          postsCount: 53,
          avatarBg: '#5e4b1c',
          avatarCode: 'MRG',
          timestamp: '10/09/2002 09:30',
          bodyHtml: `<p>Happy 10/09 site anniversary to my little seed-and-soil page, and a month-early shoutout to everyone bringing bulb cuttings to the 11/16 neighborhood table!</p>`,
        },
        {
          author: 'delphine_aubrey',
          rank: 'Veteran',
          joined: '02/2001',
          postsCount: 184,
          avatarBg: '#6d314b',
          avatarCode: 'DLP',
          timestamp: '10/09/2002 13:12',
          bodyHtml: `<p>Happy anniversary, dear!! Save me a corner beside the coffee urn on 11/16—I shall bring fresh lemon drizzle cake.</p>`,
          signatureHtml: SIG_DELPHINE,
        },
        {
          author: 'baker_tom',
          rank: 'Newcomer',
          joined: '09/2001',
          postsCount: 19,
          avatarBg: '#57432a',
          avatarCode: 'TOM',
          timestamp: '10/09/2002 18:15',
          bodyHtml: `<p>Count me in with two loaves of rye!</p>`,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/thread/thanks-for-everything-ring',
      title: 'Thanks for everything, Ring — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Thanks for everything, Ring — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <a href="meridian://backroom/general">General Chat</a> &gt; <strong>Thanks for everything, Ring</strong>',
        bodyHtml: `
      <h2>Topic: Thanks for everything, Ring</h2>
      ${renderPosts([
        {
          author: 'lamplighter',
          profileLinked: true,
          rank: 'Moderator',
          joined: '02/2001',
          postsCount: 412,
          avatarBg: '#1c3b2f',
          avatarCode: 'LMP',
          timestamp: '11/08/2002 21:20',
          bodyHtml: `<p>Good evening, neighbors.</p><p>Before Tumbleweed begins their late-night work tomorrow, I just wanted to say how grateful I am for every single homepage, recipe, clock sketch, and quiet midnight message that made this little forty-site street worth tending since February 2001.</p><p>If the porch lights go dark for a while after tomorrow night, please look after one another, hold onto your local backups, and remember that keeping a neighborhood safe sometimes means knowing when to lock the front gate from the inside.</p><p>It has been an honour keeping the directory with you all.</p>`,
          signatureHtml: SIG_LAMPLIGHTER,
        },
        {
          author: 'delphine_aubrey',
          rank: 'Veteran',
          joined: '02/2001',
          postsCount: 184,
          avatarBg: '#6d314b',
          avatarCode: 'DLP',
          timestamp: '11/08/2002 21:48',
          bodyHtml: `<p>What a sweet note, dear! Surely Tumbleweed will have all forty pages humming again by Monday morning, though I did print my recipes onto yellow paper just like Wren advised. See you on the other side of the weekend!</p>`,
          signatureHtml: SIG_DELPHINE,
        },
        {
          author: 'nightcrawler_wren',
          profileLinked: true,
          rank: 'Veteran',
          joined: '06/2001',
          postsCount: 289,
          avatarBg: '#253147',
          avatarCode: 'WRN',
          timestamp: '11/08/2002 22:02',
          bodyHtml: `<p>always glad to share the late shift with you L. see you around</p>`,
          signatureHtml: SIG_WREN,
        },
      ])}`,
      }),
    },
    {
      url: 'meridian://backroom/user/lamplighter',
      title: 'Profile: lamplighter — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Profile: lamplighter — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>Member Profile: lamplighter</strong>',
        bodyHtml: `
      <h2>Member Profile: lamplighter</h2>
      <div class="profile-card">
        <div class="avatar-box" style="background: #1c3b2f;" aria-hidden="true">LMP</div>
        <p><span class="rank-badge rank-Moderator">Moderator</span></p>
        <table class="bbs-table">
          <caption>Account Details for lamplighter</caption>
          <tbody>
            <tr><th scope="row">Handle</th><td>lamplighter</td></tr>
            <tr><th scope="row">Joined</th><td><time>02/2001</time></td></tr>
            <tr><th scope="row">Post Count</th><td>412</td></tr>
            <tr><th scope="row">Location</th><td>North Porch / Night Shift</td></tr>
            <tr><th scope="row">Last Seen</th><td><time>11/08/2002 22:14</time></td></tr>
            <tr><th scope="row">Homepage</th><td><a href="meridian://lamplighter/">Lamplighter's Log (meridian://lamplighter/)</a></td></tr>
          </tbody>
        </table>
        <h3>About</h3>
        <p>
          Volunteer coordinator for the Meridian Ring Hub and Backroom moderator since February
          2001. Quiet keeper of backups, directory tables, and late-night porch lanterns.
        </p>
      </div>`,
      }),
    },
    {
      url: 'meridian://backroom/user/nightcrawler_wren',
      title: 'Profile: nightcrawler_wren — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Profile: nightcrawler_wren — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>Member Profile: nightcrawler_wren</strong>',
        bodyHtml: `
      <h2>Member Profile: nightcrawler_wren</h2>
      <div class="profile-card">
        <div class="avatar-box" style="background: #253147;" aria-hidden="true">WRN</div>
        <p><span class="rank-badge rank-Veteran">Veteran</span></p>
        <table class="bbs-table">
          <caption>Account Details for nightcrawler_wren</caption>
          <tbody>
            <tr><th scope="row">Handle</th><td>nightcrawler_wren</td></tr>
            <tr><th scope="row">Joined</th><td><time>06/2001</time></td></tr>
            <tr><th scope="row">Post Count</th><td>289</td></tr>
            <tr><th scope="row">Location</th><td>Under a desk lamp</td></tr>
            <tr><th scope="row">Last Seen</th><td><time>11/08/2002 23:05</time></td></tr>
            <tr><th scope="row">Homepage</th><td><a href="meridian://nightcrawler/">NightCrawler.net (meridian://nightcrawler/)</a></td></tr>
          </tbody>
        </table>
        <h3>About</h3>
        <p>
          hobby programmer, hit-counter mechanic, and unofficial css janitor for half the ring.
          awake after midnight, fuelled by peppermint tea. wren out.
        </p>
      </div>`,
      }),
    },
    {
      url: 'meridian://backroom/user/xX_DarkPixel_Xx',
      title: 'Profile: xX_DarkPixel_Xx — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Profile: xX_DarkPixel_Xx — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>Member Profile: xX_DarkPixel_Xx</strong>',
        bodyHtml: `
      <h2>Member Profile: xX_DarkPixel_Xx</h2>
      <div class="profile-card">
        <div class="avatar-box" style="background: #2f2947;" aria-hidden="true">DPX</div>
        <p><span class="rank-badge rank-Regular">Regular</span></p>
        <table class="bbs-table">
          <caption>Account Details for xX_DarkPixel_Xx</caption>
          <tbody>
            <tr><th scope="row">Handle</th><td>xX_DarkPixel_Xx</td></tr>
            <tr><th scope="row">Joined</th><td><time>07/2001</time></td></tr>
            <tr><th scope="row">Post Count</th><td>108</td></tr>
            <tr><th scope="row">Location</th><td>Basement CRT corner</td></tr>
            <tr><th scope="row">Last Seen</th><td><time>11/08/2002 19:40</time></td></tr>
            <tr><th scope="row">Homepage</th><td>Pixel Dungeon Almanac (unrecovered)</td></tr>
          </tbody>
        </table>
        <h3>About</h3>
        <p>
          8-bit boss sprite collector and retro cartridge hoarder. pretends to be super edgy online
          but secretly tests Mrs. Delphine's cheese scone recipes for his little brother.
        </p>
      </div>`,
      }),
    },
    {
      url: 'meridian://backroom/user/GlitterGirl_99',
      title: 'Profile: GlitterGirl_99 — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Profile: GlitterGirl_99 — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>Member Profile: GlitterGirl_99</strong>',
        bodyHtml: `
      <h2>Member Profile: GlitterGirl_99</h2>
      <div class="profile-card">
        <div class="avatar-box" style="background: #6a2c5a;" aria-hidden="true">GG9</div>
        <p><span class="rank-badge rank-Regular">Regular</span></p>
        <table class="bbs-table">
          <caption>Account Details for GlitterGirl_99</caption>
          <tbody>
            <tr><th scope="row">Handle</th><td>GlitterGirl_99</td></tr>
            <tr><th scope="row">Joined</th><td><time>08/2001</time></td></tr>
            <tr><th scope="row">Post Count</th><td>93</td></tr>
            <tr><th scope="row">Location</th><td>Pastel bedroom desk!</td></tr>
            <tr><th scope="row">Last Seen</th><td><time>11/07/2002 18:22</time></td></tr>
            <tr><th scope="row">Homepage</th><td>SparkleZone 99 (unrecovered)</td></tr>
          </tbody>
        </table>
        <h3>About</h3>
        <p>
          HIII!! Keeping SparkleZone 99 bright with lavender borders, sticker polls, and lots of
          exclamation marks!! Loves Delphine's Lemon Drizzle Cake and chatting in #the-ring!
        </p>
      </div>`,
      }),
    },
    {
      url: 'meridian://backroom/search',
      title: 'Search — The Backroom Forum',
      html: wrapBackroomPage({
        title: 'Search — The Backroom Forum',
        breadcrumbHtml:
          '<a href="meridian://backroom/">Board Index</a> &gt; <strong>Forum Search</strong>',
        bodyHtml: `
      <h2>Search Forum Posts</h2>
      <div class="strip-box">
        <strong>Notice:</strong> Search is down for maintenance while archive tables are rebuilt.
        Please browse the category boards directly from the <a href="meridian://backroom/">Board Index</a>.
      </div>
      <form class="search-box" action="#">
        <label for="forum-search-q">Search Keywords</label>
        <input id="forum-search-q" name="query" type="text" placeholder="Enter topic keywords or handle..." />

        <label for="forum-search-board">Board Filter</label>
        <select id="forum-search-board" name="board">
          <option value="all">All Boards</option>
          <option value="general">General Chat</option>
          <option value="show">Show Your Site</option>
          <option value="tech">Tech Help</option>
          <option value="offtopic">Off Topic</option>
        </select>

        <div>
          <button class="bbs-btn-disabled" type="submit" disabled>Search (Unavailable)</button>
        </div>
      </form>`,
      }),
    },
  ],
};
