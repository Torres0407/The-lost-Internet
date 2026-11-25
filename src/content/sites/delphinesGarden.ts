import type { Site } from '../../engine/types';

interface GardenPageOptions {
  title: string;
  heading: string;
  subtitle: string;
  activePath:
    | '/'
    | '/about'
    | '/recipes'
    | '/diary'
    | '/links'
    | '/guestbook'
    | '/guestbook/2';
  bodyHtml: string;
  topComment?: string;
}

interface NavItem {
  path: GardenPageOptions['activePath'];
  url: string;
  label: string;
}

const GARDEN_NAV_ITEMS: readonly NavItem[] = [
  { path: '/', url: 'meridian://delphines-garden/', label: 'Garden Porch' },
  { path: '/about', url: 'meridian://delphines-garden/about', label: 'About & Biscuit' },
  { path: '/recipes', url: 'meridian://delphines-garden/recipes', label: 'Kitchen Recipes' },
  { path: '/diary', url: 'meridian://delphines-garden/diary', label: 'Garden Diary' },
  { path: '/links', url: 'meridian://delphines-garden/links', label: 'Garden Friends' },
  { path: '/guestbook', url: 'meridian://delphines-garden/guestbook', label: 'Guestbook (Pg. 1)' },
  { path: '/guestbook/2', url: 'meridian://delphines-garden/guestbook/2', label: 'Guestbook (Pg. 2)' },
];

const GARDEN_STYLES = `
  :host, .garden-page {
    background-color: #e6f4eb;
    background-image:
      radial-gradient(circle at 12px 12px, #f7cfe0 4px, transparent 4.5px),
      radial-gradient(circle at 12px 12px, #f5e29e 1.6px, transparent 2px),
      radial-gradient(circle at 30px 28px, #f5d8e6 3.5px, transparent 4px),
      radial-gradient(circle at 30px 28px, #bfe3cc 1.4px, transparent 1.8px),
      radial-gradient(circle at 6px 32px, #cfead9 2.5px, transparent 3px);
    background-size: 40px 40px;
    color: #243025;
    font-family: 'Comic Sans MS', 'Comic Neue', cursive, sans-serif;
    font-size: 14px;
    line-height: 1.65;
    margin: 0;
    padding: 18px 14px 28px;
  }
  * {
    box-sizing: border-box;
  }
  .outer-shell {
    max-width: 760px;
    margin: 0 auto;
    background: #fffdf8;
    border: 4px ridge #79b08e;
    box-shadow: 0 4px 14px rgba(34, 62, 46, 0.14);
  }
  .marquee-wrap {
    overflow: hidden;
    background: #fff7dc;
    border-bottom: 2px dashed #c89f54;
    padding: 5px 10px;
    color: #543c0c;
    font-size: 12px;
    font-weight: bold;
    white-space: nowrap;
  }
  .marquee-track {
    display: inline-block;
    padding-left: 100%;
    animation: garden-scroll 22s linear infinite;
  }
  @keyframes garden-scroll {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .marquee-wrap {
      white-space: normal;
      text-align: center;
    }
    .marquee-track {
      animation: none;
      padding-left: 0;
      transform: none;
    }
  }
  .page-header {
    background: linear-gradient(180deg, #fce8f0 0%, #f9dce8 100%);
    border-bottom: 3px double #b5688a;
    padding: 16px 20px 14px;
    text-align: center;
  }
  .sparkles {
    color: #7d1d4b;
    letter-spacing: 0.18em;
    font-size: 13px;
    margin: 0 0 4px 0;
  }
  .page-header h1 {
    margin: 0 0 4px 0;
    font-size: 25px;
    color: #701a44;
    text-shadow: 1px 1px 0 #ffffff;
  }
  .subtitle {
    margin: 0;
    font-size: 13px;
    color: #4c2c3c;
  }
  .now-playing {
    display: inline-block;
    margin-top: 9px;
    padding: 3px 10px;
    background: #eaf6ef;
    border: 1px solid #6ba683;
    color: #1c4a32;
    font-size: 12px;
  }
  table.layout-frame {
    width: 100%;
    border-collapse: collapse;
  }
  td.sidebar-cell {
    width: 185px;
    vertical-align: top;
    background: #edf7f1;
    border-right: 2px solid #96c2a7;
    padding: 14px 12px;
  }
  td.main-cell {
    vertical-align: top;
    padding: 18px 20px 20px;
    background: #fffdf8;
  }
  @media (max-width: 620px) {
    table.layout-frame,
    table.layout-frame tbody,
    table.layout-frame tr,
    td.sidebar-cell,
    td.main-cell {
      display: block;
      width: 100%;
    }
    td.sidebar-cell {
      border-right: 0;
      border-bottom: 2px solid #96c2a7;
    }
  }
  .nav-title {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #174c33;
    border-bottom: 2px dotted #8ab99d;
    padding-bottom: 4px;
  }
  ul.nav-list {
    list-style: none;
    margin: 0 0 16px 0;
    padding: 0;
  }
  ul.nav-list li {
    margin-bottom: 6px;
  }
  ul.nav-list a,
  ul.nav-list .nav-current {
    display: block;
    padding: 5px 8px;
    border: 1px solid #a8cfb8;
    background: #ffffff;
    font-size: 13px;
    text-decoration: none;
  }
  ul.nav-list .nav-current {
    background: #d8efe1;
    border-color: #4f8f6b;
    color: #143f2a;
    font-weight: bold;
  }
  .sidebar-note {
    background: #fdf2f6;
    border: 1px dashed #c783a0;
    padding: 9px 10px;
    font-size: 12px;
    color: #3f2230;
    margin-bottom: 14px;
  }
  .counter-wrap {
    text-align: center;
    padding: 8px 6px;
    background: #f5fbf7;
    border: 1px solid #a8cfb8;
  }
  .counter-label {
    display: block;
    font-size: 11px;
    color: #244030;
    margin-bottom: 4px;
  }
  .hit-counter {
    display: inline-block;
    background: #14261c;
    color: #8bf5bd;
    font-family: 'Courier New', monospace;
    font-size: 15px;
    font-weight: bold;
    letter-spacing: 0.14em;
    padding: 4px 9px;
    border-top: 2px solid #0b140f;
    border-left: 2px solid #0b140f;
    border-right: 2px solid #6fa384;
    border-bottom: 2px solid #6fa384;
  }
  h2 {
    margin: 0 0 10px 0;
    font-size: 19px;
    color: #6b1b42;
    border-bottom: 2px dotted #d49bb3;
    padding-bottom: 4px;
  }
  h3 {
    margin: 14px 0 6px 0;
    font-size: 15px;
    color: #195237;
  }
  p {
    margin: 0 0 11px 0;
  }
  ul.garden-list,
  ol.garden-list {
    margin: 6px 0 12px 20px;
    padding: 0;
  }
  ul.garden-list li,
  ol.garden-list li {
    margin-bottom: 5px;
  }
  a {
    color: #145a3c;
    font-weight: bold;
  }
  a:hover {
    color: #7d1d4b;
  }
  .tiled-divider {
    height: 10px;
    margin: 16px 0;
    border: 0;
    background-image: repeating-linear-gradient(
      90deg,
      #f2bfd4 0 10px,
      #fffdf8 10px 14px,
      #9ad2b0 14px 24px,
      #fffdf8 24px 28px
    );
  }
  .garden-card {
    background: #f5fbf7;
    border: 2px solid #96c2a7;
    padding: 12px 14px;
    margin: 14px 0;
  }
  .pink-card {
    background: #fdf2f6;
    border: 2px solid #d593b0;
    padding: 12px 14px;
    margin: 14px 0;
  }
  .construction-box {
    background: #fff3d6;
    border: 2px dashed #c47e1c;
    color: #523000;
    padding: 10px 13px;
    margin: 14px 0;
    font-size: 13px;
  }
  .recipe-box {
    background: #fffaf0;
    border: 2px ridge #c9a76a;
    padding: 12px 15px;
    margin: 14px 0;
  }
  .headnote {
    background: #fdf2f6;
    border-left: 3px solid #c97397;
    padding: 7px 10px;
    margin: 6px 0 10px 0;
    color: #381e2a;
    font-size: 13px;
  }
  article.entry {
    background: #ffffff;
    border: 2px solid #9ec7ae;
    padding: 11px 14px;
    margin: 12px 0;
  }
  .entry-header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    border-bottom: 1px dashed #b9d7c5;
    padding-bottom: 5px;
    margin-bottom: 8px;
    font-size: 13px;
    color: #4a2d3b;
  }
  .entry-author {
    font-weight: bold;
    color: #165438;
  }
  .delphine-reply {
    margin-top: 9px;
    padding: 7px 10px;
    background: #fdf2f6;
    border-left: 3px solid #c97397;
    color: #361f2b;
    font-size: 13px;
  }
  .pagination-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    background: #edf7f1;
    border: 1px solid #96c2a7;
    padding: 8px 12px;
    margin: 12px 0;
    font-size: 13px;
  }
  .webring-box {
    background: #fdf2f6;
    border: 2px ridge #c986a3;
    padding: 10px 12px;
    margin-top: 16px;
    text-align: center;
    font-size: 13px;
  }
  .webring-controls {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 6px;
  }
  .webring-muted {
    color: #4f3b45;
  }
  .signature {
    font-weight: bold;
    color: #6b1b42;
  }
  .page-footer {
    background: #edf7f1;
    border-top: 2px solid #96c2a7;
    padding: 10px 16px;
    text-align: center;
    font-size: 12px;
    color: #243b2c;
  }
`;

function wrapGardenPage({
  title,
  heading,
  subtitle,
  activePath,
  bodyHtml,
  topComment,
}: GardenPageOptions): string {
  const navHtml = GARDEN_NAV_ITEMS.map((item) => {
    if (item.path === activePath) {
      return `<li><span class="nav-current" aria-current="page">✿ ${item.label}</span></li>`;
    }
    return `<li><a href="${item.url}">✿ ${item.label}</a></li>`;
  }).join('\n            ');

  const commentBlock = topComment ? `\n  ${topComment}` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${GARDEN_STYLES}</style>
</head>
<body class="garden-page">${commentBlock}
  <div class="outer-shell">
    <div class="marquee-wrap">
      <span class="marquee-track">✿ Welcome to Delphine's Garden! Wipe your gardening boots, pour a cup of tea, and please sign the Guestbook before you go, dear! ✿ Last updated 11/05/2002 ✿</span>
    </div>
    <header class="page-header">
      <p class="sparkles" aria-hidden="true">✦ ✿ ❀ ✿ ✦</p>
      <h1>${heading}</h1>
      <p class="subtitle">${subtitle}</p>
      <p class="now-playing">♪ Now playing: Biscuit's Waltz.mid ♪</p>
    </header>
    <table class="layout-frame" role="presentation">
      <tbody>
        <tr>
          <td class="sidebar-cell">
            <h2 class="nav-title">Garden Gate</h2>
            <nav aria-label="Delphine's Garden navigation">
              <ul class="nav-list">
            ${navHtml}
              </ul>
            </nav>
            <div class="sidebar-note">
              <strong>Porch Note:</strong><br />
              Kettle is ALWAYS on. Mind Biscuit on the keyboard!
            </div>
            <div class="counter-wrap">
              <span class="counter-label">Kind Visitors Since 04/2000:</span>
              <span class="hit-counter">014,382</span>
            </div>
          </td>
          <td class="main-cell">
            ${bodyHtml}
          </td>
        </tr>
      </tbody>
    </table>
    <footer class="page-footer">
      Delphine's Garden · Member of the <a href="meridian://ring-hub/">Meridian Ring</a> · Pages last updated 11/05/2002 · Made with patience &amp; tea ~ Delphine
    </footer>
  </div>
</body>
</html>`;
}

export const DELPHINES_GARDEN_SITE: Site = {
  id: 'delphines-garden',
  name: "Delphine's Garden",
  clues: [
    {
      id: 'clue_lamplighter_date',
      pageUrl: 'meridian://delphines-garden/guestbook',
      text: '11/09',
      grants: ['date_1109'],
    },
  ],
  pages: [
    {
      url: 'meridian://delphines-garden/',
      title: "Delphine's Garden — Home",
      grants: ['visited_delphines_garden'],
      html: wrapGardenPage({
        title: "Delphine's Garden — Home",
        heading: "Delphine's Garden",
        subtitle: 'Heirloom tomatoes, kitchen baking, and cozy Meridian Ring chatter since 2000.',
        activePath: '/',
        topComment: '<!-- TODO: ask Wren to make the counter go up by itself again -->',
        bodyHtml: `
            <h2>Pull Up a Chair, Dear!</h2>
            <p>
              Hello there, friend! I am so glad your little browser wandered down my garden path today.
              I am Delphine Aubrey, a retired primary-school teacher, and I opened these pages back in
              2000 so I could swap tomato tips and lemon cake recipes with neighbors near and far.
            </p>
            <p>
              The Meridian Ring has felt like a second family to me... even on rainy November afternoons
              when the garden is tucked under frost cloth. Have a poke around the rooms in the sidebar,
              and do leave a hello in my <a href="meridian://delphines-garden/guestbook">Guestbook</a>!
            </p>
            <p class="signature">~ Delphine</p>

            <hr class="tiled-divider" />

            <div class="garden-card">
              <h3>What's New on the Porch (11/05/2002)</h3>
              <ul class="garden-list">
                <li><strong>New Kitchen Page:</strong> Added my End-of-Summer Tomato Chutney over in <a href="meridian://delphines-garden/recipes">Kitchen Recipes</a> (Wren kindly fixed my counter while helping me upload it!).</li>
                <li><strong>November Greenhouse Notes:</strong> Wrote down how I wrapped the climbing roses in my <a href="meridian://delphines-garden/diary">Garden Diary</a>... and printed out my recipes just in case the host does server work this weekend.</li>
                <li><strong>Fresh Guestbook Replies:</strong> Answered everyone's sweet notes in <a href="meridian://delphines-garden/guestbook">Guestbook (Pg. 1)</a> and moved our older 2001 letters to <a href="meridian://delphines-garden/guestbook/2">Guestbook (Pg. 2)</a>.</li>
              </ul>
            </div>

            <div class="construction-box">
              <strong>✿ UNDER CONSTRUCTION ✿</strong><br />
              My <em>Spring Seed Swap &amp; Polaroid Photo Album</em> corner is still under construction, dear!
              My neighbor promised to scan the snapshots of Biscuit asleep in the cucumber crate NEXT week.
            </div>

            <div class="pink-card">
              <h3>Where Would You Like to Go?</h3>
              <ul class="garden-list">
                <li>Meet Biscuit and read my story in <a href="meridian://delphines-garden/about">About &amp; Biscuit</a>.</li>
                <li>Bake something warm from <a href="meridian://delphines-garden/recipes">Kitchen Recipes</a>.</li>
                <li>Catch up on autumn chores in the <a href="meridian://delphines-garden/diary">Garden Diary</a>.</li>
                <li>Visit neighbors on <a href="meridian://delphines-garden/links">Garden Friends</a>.</li>
              </ul>
            </div>

            <div class="webring-box">
              <strong>✦ Member of the Meridian Webring ✦</strong>
              <div class="webring-controls">
                <span class="webring-muted">[ &lt;&lt; Previous Garden (offline) ]</span>
                <a href="meridian://ring-hub/">Meridian Ring Hub</a>
                <span class="webring-muted">[ Random Site (offline) &gt;&gt; ]</span>
              </div>
            </div>`,
      }),
    },
    {
      url: 'meridian://delphines-garden/about',
      title: "Delphine's Garden — About & Biscuit",
      html: wrapGardenPage({
        title: "Delphine's Garden — About & Biscuit",
        heading: 'About Delphine & Biscuit',
        subtitle: 'Sixty-one years young, three tomato trellises, and one very spoiled tabby.',
        activePath: '/about',
        bodyHtml: `
            <h2>A Little Story About Me</h2>
            <p>
              My name is Delphine Aubrey, and I turned sixty-one this past June! For thirty-four years I
              taught second-grade reading and arithmetic at Willowbrook Primary, which explains why I
              still fuss over tidy margins and ALWAYS answer every single note left on my porch. When I
              retired in 1999, my late sister's grandson set a beige computer on my sewing table and
              showed me how to build my very first homepage in April 2000.
            </p>
            <p>
              Outside the screen, my joy is my sunny side-yard plot... especially my Brandywine and
              Sun Sugar tomatoes, which grow taller than my garden hat by August. I love rainy baking
              afternoons, floral teacups, and our kind little Meridian Ring family.
            </p>
            <p class="signature">~ Delphine</p>

            <hr class="tiled-divider" />

            <div class="pink-card">
              <h3>My Cat Biscuit</h3>
              <p>
                Biscuit is a plump marmalade tabby I found curled inside an empty peat pot in the tool
                shed five autumns ago. He has one notched ear, very loud purrs, and an absolute passion
                for sleeping directly across the warm top of my monitor while I type.
              </p>
              <p>
                If you ever spot odd strings of letters in my guestbook notes or HTML comments, dear,
                that was Biscuit walking across the keyboard on his way to demand cheddar crumbs!
              </p>
            </div>

            <div class="garden-card">
              <h3>Send Me a Letter</h3>
              <p>
                My old address book is tucked beside the kettle. You can reach me at
                <strong>delphine@garden.example</strong> whenever you want to trade a jam recipe or ask
                about overwintering rosemary... though I check my
                <a href="meridian://delphines-garden/guestbook">Guestbook</a> even faster!
              </p>
            </div>`,
      }),
    },
    {
      url: 'meridian://delphines-garden/recipes',
      title: "Delphine's Garden — Kitchen Recipes",
      html: wrapGardenPage({
        title: "Delphine's Garden — Kitchen Recipes",
        heading: 'Kitchen Recipes',
        subtitle: 'Tested on a grumpy gas oven and approved by Biscuit (mostly the butter parts).',
        activePath: '/recipes',
        bodyHtml: `
            <h2>From My Flour-Dusted Notebook</h2>
            <p>
              Nothing makes a chilly afternoon vanish quite like a simmering pot or a tray of scones,
              dear. Here are the three recipes neighbors ask for most often!
            </p>

            <div class="recipe-box">
              <h3>1. End-of-Summer Tomato Chutney</h3>
              <p class="headnote">
                This is what I make whenever October threatens frost and I still have a laundry basket
                of stubborn green and pink tomatoes! Half the block got jars this year. (Wren fixed my
                page counter for this one!)
              </p>
              <ul class="garden-list">
                <li>2 pounds ripe or half-ripe garden tomatoes, chopped</li>
                <li>2 tart baking apples, peeled and diced small</li>
                <li>1 large yellow onion, finely sliced</li>
                <li>1 cup cider vinegar and 1 cup packed brown sugar</li>
                <li>1 teaspoon yellow mustard seed, pinch of ground cloves, and kosher salt</li>
              </ul>
              <p>
                Simmer everything gently in a heavy pot for about 50 minutes, stirring so the bottom
                never catches, until it turns glossy and thick as marmalade.
              </p>
            </div>

            <div class="recipe-box">
              <h3>2. Sunny Lemon Drizzle Cake</h3>
              <p class="headnote">
                Careful when cooling this one on the table... Biscuit does NOT care for lemon, yet he
                will still swat at the spoon just to inspect the powdered sugar!
              </p>
              <ul class="garden-list">
                <li>1 and 1/2 cups all-purpose flour and 1 teaspoon baking powder</li>
                <li>1/2 cup softened unsalted butter and 3/4 cup superfine sugar</li>
                <li>2 large eggs, room temperature, plus 1/3 cup whole milk</li>
                <li>Grated zest of 2 bright lemons</li>
                <li>Drizzle: juice of 2 lemons stirred with 1/3 cup granulated sugar</li>
              </ul>
              <p>
                Bake in a greased loaf tin at 350F for 40 minutes. Poke gentle toothpick holes while
                still warm and spoon the crunchy lemon drizzle right over the crust.
              </p>
            </div>

            <div class="recipe-box">
              <h3>3. Sharp Cheddar Cheese Scones</h3>
              <p class="headnote">
                Whenever anyone from the Meridian Ring drops by in spirit, I picture a plate of these
                steaming beside the teapot. My oven runs hot, so keep an eye on the edges!
              </p>
              <ul class="garden-list">
                <li>2 cups all-purpose flour and 1 tablespoon baking powder</li>
                <li>1/4 cup cold salted butter, cut into pea-sized cubes</li>
                <li>1 and 1/4 cups grated sharp cheddar cheese (save a pinch for the tops)</li>
                <li>1/2 teaspoon dry mustard and 2/3 cup cold milk</li>
              </ul>
              <p>
                Pat into a thick round without overworking, cut into 8 wedges, and bake at 425F for
                12 to 14 minutes until golden.
              </p>
            </div>

            <p class="signature">~ Delphine</p>`,
      }),
    },
    {
      url: 'meridian://delphines-garden/diary',
      title: "Delphine's Garden — Garden Diary",
      html: wrapGardenPage({
        title: "Delphine's Garden — Garden Diary",
        heading: 'Garden Diary',
        subtitle: 'Rain gauges, frost warnings, and quiet evenings between August and November 2002.',
        activePath: '/diary',
        bodyHtml: `
            <h2>Notes from the Potting Bench</h2>
            <p>
              I keep a small spiral notebook beside the back door so I remember which bulbs went where
              before spring sneaks up on me. Here are my latest entries, dear.
            </p>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">Frost Cloth &amp; Server Tidying</span>
                <time>11/05/2002</time>
              </div>
              <p>
                Tucked the rosemary pots inside the sunny kitchen window tonight and wrapped burlap around
                the climbing rose by the gate. I saw a little notice saying the host is doing something
                to the servers this weekend, so I printed out my recipes on yellow paper just in case,
                dear! Better safe than sorry when Biscuit's favorite chutney formula is at stake.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">Pulling the Tomato Stakes</span>
                <time>10/27/2002</time>
              </div>
              <p>
                Stacked all the bamboo poles neatly behind the shed after the wind knocked down the last
                Brandywine vine. Brought a paper sack of green tomatoes next door to Mrs. Patel, who
                promised to try frying them with cornmeal.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">Six Jars of Chutney</span>
                <time>10/12/2002</time>
              </div>
              <p>
                Spent the whole rainy Saturday stirring apples and cider vinegar while Biscuit supervised
                from the windowsill. The kitchen smelled SO warm and spicy! Put my recipe right up on
                <a href="meridian://delphines-garden/recipes">Kitchen Recipes</a> once the jars clicked shut.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">Crocus Order &amp; Fixed Borders</span>
                <time>09/24/2002</time>
              </div>
              <p>
                Tucked fifty purple crocus bulbs under the apple tree before dark. Later, Wren stopped by
                my <a href="meridian://delphines-garden/guestbook">Guestbook</a> and helped me tidy up the
                mint green sidebar so the links stop jumping around. Young people are wizards!
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">First Bell of September</span>
                <time>09/03/2002</time>
              </div>
              <p>
                Watched the neighborhood children walking past with brand-new backpacks this morning.
                Every September I still catch myself checking that my chalk is sharp! Baked cheese scones
                for Arthur our postman to chase away the nostalgia.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">Thirty-Four Tomatoes!</span>
                <time>08/18/2002</time>
              </div>
              <p>
                A banner afternoon in the side yard—picked thirty-four ripe tomatoes in a single basket!
                Shared half at the church coffee table and sliced three still warm from the sun with
                cracked pepper for supper.
              </p>
            </article>

            <p class="signature">~ Delphine</p>`,
      }),
    },
    {
      url: 'meridian://delphines-garden/links',
      title: "Delphine's Garden — Garden Friends",
      html: wrapGardenPage({
        title: "Delphine's Garden — Garden Friends",
        heading: 'Friends of the Garden',
        subtitle: 'Kind neighbors across the Meridian Webring and cozy corners worth a visit.',
        activePath: '/links',
        bodyHtml: `
            <h2>Friends of the Garden</h2>
            <p>
              One of the sweetest parts of keeping a homepage is waving across the fence at other ring
              members! Here are the doorways currently open on our little street, dear.
            </p>

            <div class="garden-card">
              <h3>Open Doorways Today</h3>
              <ul class="garden-list">
                <li>
                  <a href="meridian://ring-hub/">Meridian Ring Hub</a> — Our central neighborhood
                  directory, where all forty member pages gather when the weather is fair.
                </li>
                <li>
                  <a href="meridian://tumbleweed/support">Tumbleweed Hosting — Support Bulletin</a> —
                  Where I check for server news! They mentioned the upcoming weekend work there.
                </li>
                <li>
                  <a href="meridian://delphines-garden/guestbook">My Own Guestbook (Page 1)</a> —
                  Come read the lovely notes from friends old and new.
                </li>
              </ul>
            </div>

            <div class="pink-card">
              <h3>Neighbors Still Polishing Their Gates</h3>
              <p>
                A few dear friends are still moving files around before their links go back up, so I am
                keeping their names pinned right here on my corkboard until they are ready:
              </p>
              <ul class="garden-list">
                <li><strong>Brambleberry Tea Room</strong> — Herbal infusions, scones, and rainy-day book notes <em>(link coming soon)</em></li>
                <li><strong>Old Mill Weather Log</strong> — Backyard barometer readings and cloud sketches <em>(link coming soon)</em></li>
                <li><strong>Barnaby's Brass &amp; Clocks</strong> — Mantel clock winding and chime care tips <em>(link coming soon)</em></li>
                <li><strong>Clara's Pressed Flowers</strong> — Wildflower field guides and ribbon bookmarks <em>(link coming soon)</em></li>
              </ul>
            </div>

            <p class="signature">~ Delphine</p>`,
      }),
    },
    {
      url: 'meridian://delphines-garden/guestbook',
      title: "Delphine's Guestbook — Page 1",
      grants: ['read_guestbook'],
      html: wrapGardenPage({
        title: "Delphine's Guestbook — Page 1",
        subtitle: 'Newest letters from Meridian Ring visitors (01/19/2002 to 11/08/2002).',
        heading: "Delphine's Guestbook",
        activePath: '/guestbook',
        topComment:
          '<!-- CLUE #01 (View Source): Select and save lamplighter\'s date "11/09", then check meridian://lamplighter/log_0911 after reading Tumbleweed\'s maintenance notice -->',
        bodyHtml: `
            <h2>Porch Guestbook — Page 1 of 2</h2>
            <p>
              Thank you for stopping by my little corner of the ring, dear! I read every single entry
              over morning tea and answer as many as Biscuit lets me type.
            </p>

            <div class="pagination-bar">
              <span><strong>Showing Entries 1–16 of 32</strong> (Newest First)</span>
              <a href="meridian://delphines-garden/guestbook/2">Older Entries (Page 2) &gt;&gt;</a>
            </div>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">lamplighter</span>
                <time>11/08/2002 21:40</time>
              </div>
              <p>
                Thank you for keeping such a steady lantern in this little corner of the ring,
                Delphine. Whatever happens when the host moves the racks tomorrow night, keep the light on - 11/09
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Always, dear. Everything looks peaceful by the greenhouse tonight... are you quite well? ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">nightcrawler_wren</span>
                <time>11/05/2002 19:15</time>
              </div>
              <p>
                saw your note about the weekend server shuffle mrs a! i backed up your tomato chutney
                page just in case. still tinkering over at <a href="meridian://nightcrawler/">meridian://nightcrawler/</a> if
                you need another counter fix
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Bless your heart, Wren! Biscuit sends a warm purr for rescuing the counter. ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">halcyon</span>
                <time>10/29/2002 20:04</time>
              </div>
              <p>Good evening. This is a lovely garden.</p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Why thank you, friend! Please pull up a chair and stay as long as you like. ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">GlitterGirl_99</span>
                <time>10/22/2002 16:42</time>
              </div>
              <p>
                OMG Mrs. Delphine!! my mom and i made your Lemon Drizzle Cake and it turned out SO
                PRETTY!! hey xX_DarkPixel_Xx did you try the chutney yet?!
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Oh, I am thrilled, dear!! Give your mother my warmest regards! ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">xX_DarkPixel_Xx</span>
                <time>10/18/2002 22:11</time>
              </div>
              <p>
                tell nightcrawler_wren my new site theme is way cooler than her midnight log thing lol.
                also thx for the cheese scones recipe Mrs A my little brother ate four straight off the pan
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Haha, growing appetites! Tell your brother there is always another tray waiting, dear. ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">marigold_may</span>
                <time>10/11/2002 14:30</time>
              </div>
              <p>
                Popping in between rainy errands! Are you still coming to the library seed swap on
                11/16 if the bus runs? Bring Biscuit snapshots!
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Yes indeed, dear, weather permitting... though I may bring chutney instead of seeds! ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">baker_tom</span>
                <time>09/28/2002 18:05</time>
              </div>
              <p>
                Tried your scones on my grumpy old stove — set the dial to 0375 and baked them golden
                for sixteen minutes. Best tea-time snack on the ring!
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">nightcrawler_wren</span>
                <time>09/14/2002 23:50</time>
              </div>
              <p>
                glittergirl_99 your sparkle borders nearly froze my dialup haha. waving to lamplighter
                on the late shift too. night all
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Goodness, get some sleep, Wren! Midnight is for owls and cats. ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">mrs_henderson_42</span>
                <time>08/30/2002 11:20</time>
              </div>
              <p>
                Thirty-four tomatoes in one afternoon! You have magic in those garden gloves, Delphine.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">barnaby_clocks</span>
                <time>08/11/2002 17:48</time>
              </div>
              <p>
                Dropped by while waiting for a mantel mainspring to unwind. Love the mint border and
                the little waltz note at the top!
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Thank you, Barnaby! My neighbor's granddaughter helped me pick the mint green. ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">clara_pressed</span>
                <time>07/25/2002 09:15</time>
              </div>
              <p>
                Bookmarking your diary so I don't forget to check your autumn crocus list. Happy July!
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">lamplighter</span>
                <time>06/19/2002 20:33</time>
              </div>
              <p>
                Stopped past after a long evening shift. Quiet pages like this make the whole
                Meridian Ring feel like a real neighborhood street.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">GlitterGirl_99</span>
                <time>05/14/2002 13:07</time>
              </div>
              <p>
                HAPPY MAY!! look at all the little flowers on the wallpaper!! 10/10 best porch on
                Tumbleweed Hosting!!
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">sunshine_sam</span>
                <time>04/06/2002 15:52</time>
              </div>
              <p>
                Visited from the Ring Hub! Biscuit sounds just like my aunt's ginger tabby who steals
                toast crusts.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">oldmill_weather</span>
                <time>02/21/2002 19:10</time>
              </div>
              <p>
                Snowed two inches here this morning, so reading about spring sweet peas warmed my boots.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">xX_DarkPixel_Xx</span>
                <time>01/19/2002 21:02</time>
              </div>
              <p>
                first post of 2002!! ok fine i actually like the pastel pink now dont tell anyone
              </p>
            </article>

            <div class="pagination-bar">
              <span>Page 1 of 2</span>
              <a href="meridian://delphines-garden/guestbook/2">Older Entries (Page 2) &gt;&gt;</a>
            </div>`,
      }),
    },
    {
      url: 'meridian://delphines-garden/guestbook/2',
      title: "Delphine's Guestbook — Page 2",
      html: wrapGardenPage({
        title: "Delphine's Guestbook — Page 2",
        subtitle: 'Archived porch letters from 2001 (03/14/2001 to 12/28/2001).',
        heading: "Delphine's Guestbook (Archive)",
        activePath: '/guestbook/2',
        topComment: '<!-- Biscuit sat on the keyboard. Ignore the mess above! -->',
        bodyHtml: `
            <h2>Porch Guestbook — Page 2 of 2</h2>
            <p>
              Here are our cozy letters from 2001, tucked neatly in the archive drawer so nothing gets
              lost. I still smile reading every single one, dear!
            </p>

            <div class="pagination-bar">
              <a href="meridian://delphines-garden/guestbook">&lt;&lt; Newer Entries (Page 1)</a>
              <span><strong>Showing Entries 17–32 of 32</strong></span>
            </div>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">marigold_may</span>
                <time>12/28/2001 16:20</time>
              </div>
              <p>
                Wishing you and Biscuit a cozy New Year, Delphine! Saved your chutney notes for next
                harvest.
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Happy New Year, dear! Biscuit is curled right on the woollen rug by the radiator. ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">nightcrawler_wren</span>
                <time>12/04/2001 23:12</time>
              </div>
              <p>
                finally got my own tiny node running over at meridian://nightcrawler/ — come visit once
                i finish the stylesheet! thanks for letting me test the hit counter on your porch
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> How exciting, Wren! I shall visit the very moment my modem stops whistling. ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">lamplighter</span>
                <time>11/17/2001 18:40</time>
              </div>
              <p>
                Autumn fog across town tonight. Always glad to see your garden lantern still burning
                in the ring index.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">tea_and_tweed</span>
                <time>10/29/2001 15:11</time>
              </div>
              <p>
                Found your corner through the Meridian Ring Hub. Nothing beats a proper cheddar scone
                recipe on a windy Monday!
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Welcome to our little street, friend! Put the kettle on anytime. ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">GlitterGirl_99</span>
                <time>10/08/2001 20:55</time>
              </div>
              <p>
                EEEK!! i just joined the webring today and yours was the VERY FIRST page i clicked!!
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">petunia_pat</span>
                <time>09/19/2001 12:30</time>
              </div>
              <p>
                My heirloom tomatoes split in the rain last week—any tips for next summer, Mrs. Aubrey?
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Even watering helps wonders, dear, and never fret over split ones... they make the BEST chutney! ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">xX_DarkPixel_Xx</span>
                <time>08/27/2001 19:44</time>
              </div>
              <p>
                surfing from my cousin's pc. tell Biscuit i said pspspsps
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Biscuit twitched an ear just for you! ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">clara_pressed</span>
                <time>08/05/2001 10:18</time>
              </div>
              <p>
                Pressed three cosmos blooms from my porch today and thought of your July garden notes.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">barnaby_clocks</span>
                <time>07/14/2001 16:05</time>
              </div>
              <p>
                Your layout table lines up so neatly! Mine keeps drifting straight into the floorboards.
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Oh, I tore my hair out over borders until Wren showed me how to tuck the table cells in! ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">nightcrawler_wren</span>
                <time>06/28/2001 22:09</time>
              </div>
              <p>
                dropped by to swap guestbook links! also fixed your broken divider tag while i was
                squinting at view source lol
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">mrs_henderson_42</span>
                <time>06/10/2001 14:22</time>
              </div>
              <p>
                Just retired from the county library last Friday—starting my own reading page soon!
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Congratulations, dear!! Retirement is the sweetest season of all, wait until you see! ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">oldmill_weather</span>
                <time>05/23/2001 17:35</time>
              </div>
              <p>
                Warm breeze and high clouds all week. Hope the rosemary seedlings are behaving!
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">piper_jane</span>
                <time>05/02/2001 09:48</time>
              </div>
              <p>
                My seven-year-old recognized your name from Willowbrook Primary! She sends a daisy
                drawing.
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Oh bless my heart! Tell her Mrs. Aubrey still keeps crayons in her desk drawer! ~ Delphine
              </div>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">lamplighter</span>
                <time>04/19/2001 21:15</time>
              </div>
              <p>
                First time visiting the new Meridian Ring guestbook. Peace to your house and garden.
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">sugar_pea</span>
                <time>04/01/2001 11:02</time>
              </div>
              <p>
                Happy April! Are those green peas already sprouting by the wooden fence?
              </p>
            </article>

            <article class="entry">
              <div class="entry-header">
                <span class="entry-author">neighbor_arthur</span>
                <time>03/14/2001 15:30</time>
              </div>
              <p>
                First neighbor through the gate! Lovely tea and lovely tulips, Delphine.
              </p>
              <div class="delphine-reply">
                <strong>Delphine replied:</strong> Thank you for christening my new guestbook, Arthur! Now come fetch your shovel! ~ Delphine
              </div>
            </article>

            <div class="pagination-bar">
              <a href="meridian://delphines-garden/guestbook">&lt;&lt; Newer Entries (Page 1)</a>
              <span>Page 2 of 2</span>
            </div>`,
      }),
    },
  ],
};
