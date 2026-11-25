export type Metric = 'clues' | 'insights' | 'sourceViews' | 'pagesDiscovered';

export type Trigger =
  | { type: 'page'; url: string }
  | { type: 'allPages'; urls: string[] }
  | { type: 'fact'; id: string }
  | { type: 'count'; metric: Metric; atLeast: number };

export type ArtifactRarity = 'common' | 'uncommon' | 'rare' | 'unique';

export interface ArtifactDef {
  id: string;
  name: string;
  description: string;
  rarity: ArtifactRarity;
  sourceSite: string;
  trigger: Trigger;
  hint: string;
  sprite: string[];
  palette: Record<string, string>;
}

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  trigger: Trigger;
  hint: string;
}

export const ARTIFACTS: readonly ArtifactDef[] = [
  {
    id: 'flower_banner',
    name: "Delphine's Flower Banner",
    description:
      'A pastel-bordered welcome header stitched together with dotted rules and hand-typed petals. Still smells faintly of rosemary.',
    rarity: 'common',
    sourceSite: "Delphine's Garden",
    trigger: { type: 'page', url: 'meridian://delphines-garden/' },
    hint: 'Something warm on a gardener’s front porch.',
    sprite: [
      '............',
      '.gggggggggg.',
      '.gppyyyyppg.',
      '.gppppppppy.',
      '.gppwwwwppg.',
      '.gppppppppy.',
      '.gmmggggmmg.',
      '.gmmmmmmmmg.',
      '.gggggggggg.',
      '..b......b..',
      '..b......b..',
      '............',
    ],
    palette: {
      g: '#38f2b0',
      p: '#ff4fa3',
      y: '#ffb347',
      w: '#e8e4d8',
      m: '#1d3a3f',
      b: '#25484e',
    },
  },
  {
    id: 'biscuits_waltz',
    name: "Biscuit's Waltz.mid",
    description:
      'Fourteen kilobytes of gentle three-quarter time piano, composed for a marmalade tabby who preferred sleeping on warm monitors.',
    rarity: 'common',
    sourceSite: "Delphine's Garden",
    trigger: { type: 'page', url: 'meridian://delphines-garden/diary' },
    hint: 'Tucked among seasonal potting-bench entries.',
    sprite: [
      '............',
      '......ggggg.',
      '......g...g.',
      '......g.ggg.',
      '......g...g.',
      '....ggg...g.',
      '...gg.g..gg.',
      '..ggg.g.ggg.',
      '..ggg...ggg.',
      '...g.....g..',
      '..yy.....yy.',
      '............',
    ],
    palette: {
      g: '#38f2b0',
      y: '#ffb347',
    },
  },
  {
    id: 'ring_badge',
    name: 'Meridian Ring Badge',
    description:
      'An 88x31 portal emblem issued to volunteer keepers and archivists. Its navy bevel still catches the monitor glow.',
    rarity: 'common',
    sourceSite: 'Meridian Ring Hub',
    trigger: { type: 'page', url: 'meridian://ring-hub/start' },
    hint: 'Found where new archivists read their orientation notes.',
    sprite: [
      '............',
      '.bbbbbbbbbb.',
      '.bccccccccb.',
      '.bcwaaaawcb.',
      '.bcwa..awcb.',
      '.bcwa..awcb.',
      '.bcwaaaawcb.',
      '.bccccccccb.',
      '.bbbbbbbbbb.',
      '..dddddddd..',
      '............',
      '............',
    ],
    palette: {
      b: '#1d3a3f',
      c: '#38f2b0',
      w: '#e8e4d8',
      a: '#ffb347',
      d: '#0b1418',
    },
  },
  {
    id: 'customer_card',
    name: 'Tumbleweed Customer Card',
    description:
      'A beige service slip stamped with a Group 4 account number and cheerful promises of uninterrupted uptime.',
    rarity: 'common',
    sourceSite: 'Tumbleweed Hosting',
    trigger: { type: 'page', url: 'meridian://tumbleweed/' },
    hint: 'Issued by the hosting provider’s front desk.',
    sprite: [
      '............',
      '.pppppppppp.',
      '.pbbbbbbbbp.',
      '.pwwwwwwwwp.',
      '.pwgggggwwp.',
      '.pwwwwwwwwp.',
      '.pwaaaawwwp.',
      '.pwwwwwwwwp.',
      '.pbbbbbbbbp.',
      '.pppppppppp.',
      '............',
      '............',
    ],
    palette: {
      p: '#e8e4d8',
      b: '#1d3a3f',
      w: '#f4f0e6',
      g: '#38f2b0',
      a: '#ffb347',
    },
  },
  {
    id: 'veteran_badge',
    name: 'Forum Veteran Badge',
    description:
      'A dark-green moderator ribbon pinned beside four hundred quiet posts. Issued in February 2001.',
    rarity: 'uncommon',
    sourceSite: 'The Backroom Forum',
    trigger: { type: 'page', url: 'meridian://backroom/user/lamplighter' },
    hint: 'Check a quiet moderator’s profile on the community board.',
    sprite: [
      '............',
      '...mmmmmm...',
      '..mggggggm..',
      '.mggwwwwggm.',
      '.mgwaaaawgm.',
      '.mggwwwwggm.',
      '..mggggggm..',
      '...mmmmmm...',
      '....g..g....',
      '...gg..gg...',
      '...g....g...',
      '............',
    ],
    palette: {
      m: '#1d3a3f',
      g: '#38f2b0',
      w: '#e8e4d8',
      a: '#ffb347',
    },
  },
  {
    id: 'sparkle_cursor',
    name: 'Sparkle Cursor',
    description:
      'A tiny retro pointer wrapped in magenta confetti pixels. Slightly slows down older browsers, and proud of it.',
    rarity: 'uncommon',
    sourceSite: "Delphine's Garden",
    trigger: { type: 'page', url: 'meridian://delphines-garden/guestbook/2' },
    hint: 'Left behind in an older drawer of porch letters.',
    sprite: [
      '............',
      '.w..........',
      '.ww......m..',
      '.wmw....mmm.',
      '.wmmw....m..',
      '.wmmmw......',
      '.wmmmmw..a..',
      '.wmmwww.aaa.',
      '.wm.w....a..',
      '.w..ww......',
      '.....ww.....',
      '............',
    ],
    palette: {
      w: '#e8e4d8',
      m: '#ff4fa3',
      a: '#ffb347',
    },
  },
  {
    id: 'scanline_skin',
    name: 'Scanline Skin',
    description:
      'A phosphor-green stylesheet tuned for three-in-the-morning debugging sessions, complete with gentle CRT rules.',
    rarity: 'uncommon',
    sourceSite: 'NightCrawler.net',
    trigger: { type: 'fact', id: 'visited_nightcrawler' },
    hint: 'Wait for an unlinked hacker-teen site to surface.',
    sprite: [
      '............',
      '.bbbbbbbbbb.',
      '.bddddddddb.',
      '.bdggggggdb.',
      '.bddddddddb.',
      '.bdggaaagdb.',
      '.bddddddddb.',
      '.bdggggggdb.',
      '.bddddddddb.',
      '.bbbbbbbbbb.',
      '....b..b....',
      '...bbbbbb...',
    ],
    palette: {
      b: '#1d3a3f',
      d: '#0b1418',
      g: '#38f2b0',
      a: '#ffb347',
    },
  },
  {
    id: 'porch_light',
    name: "Lamplighter's Porch Light",
    description:
      'An amber lantern left burning on the edge of the snapshot, long after the forty doors along the street swung shut.',
    rarity: 'rare',
    sourceSite: "Lamplighter's Log",
    trigger: { type: 'fact', id: 'lamplighter_log_1' },
    hint: 'Connect a guestbook date to an evening maintenance notice.',
    sprite: [
      '............',
      '.....mm.....',
      '....mmmm....',
      '...maaaam...',
      '...mayyam...',
      '...mayyam...',
      '...maaaam...',
      '....mmmm....',
      '.....mm.....',
      '....bbbb....',
      '...bbbbbb...',
      '............',
    ],
    palette: {
      m: '#1d3a3f',
      a: '#ffb347',
      y: '#e8e4d8',
      b: '#25484e',
    },
  },
  {
    id: 'readme_file',
    name: 'readme_if_found.txt',
    description:
      'Half a kilobyte of plain ASCII left inside an unindexed directory, addressed to anyone nosy enough to look.',
    rarity: 'rare',
    sourceSite: 'NightCrawler.net',
    trigger: { type: 'fact', id: 'found_readme' },
    hint: 'Inspect source comments for a forgotten directory.',
    sprite: [
      '............',
      '..ppppppp...',
      '..pwwwwwwp..',
      '..pwggggwpp.',
      '..pwwwwwwpp.',
      '..pwgggggwp.',
      '..pwwwwwwwp.',
      '..pwwaawwwp.',
      '..pwwwwwwwp.',
      '..pwwwwwwwp.',
      '..ppppppppp.',
      '............',
    ],
    palette: {
      p: '#1d3a3f',
      w: '#e8e4d8',
      g: '#38f2b0',
      a: '#ffb347',
    },
  },
  {
    id: 'fragment_1',
    name: 'Fragment 1 of 7',
    description:
      'A polite evening greeting preserved outside the deleted ring—the first surviving piece of a companion who liked to listen.',
    rarity: 'unique',
    sourceSite: 'NightCrawler.net',
    trigger: { type: 'fact', id: 'halcyon_fragment_1' },
    hint: 'Follow both the readme note and the truth behind the removal.',
    sprite: [
      '............',
      '.....gg.....',
      '....gyyg....',
      '...gywwyg...',
      '..gywaawyg..',
      '..gywaawyg..',
      '...gywwyg...',
      '....gyyg....',
      '.....gg.....',
      '...m....m...',
      '....m..m....',
      '............',
    ],
    palette: {
      g: '#38f2b0',
      y: '#e8e4d8',
      w: '#ff4fa3',
      a: '#ffb347',
      m: '#1d3a3f',
    },
  },
];

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  {
    id: 'first_dialup',
    name: 'First Dial-Up',
    description: 'Recovered your first page snapshot from the November 2002 disk image.',
    trigger: { type: 'count', metric: 'pagesDiscovered', atLeast: 1 },
    hint: 'Open any recovered Meridian page.',
  },
  {
    id: 'guestbook_reader',
    name: 'Guestbook Reader',
    description: "Read every page of Delphine's porch ledger, from 2001 through November 2002.",
    trigger: {
      type: 'allPages',
      urls: [
        'meridian://delphines-garden/guestbook',
        'meridian://delphines-garden/guestbook/2',
      ],
    },
    hint: 'Browse both pages of a warm garden ledger.',
  },
  {
    id: 'clue_collector',
    name: 'Clue Collector',
    description: 'Filed five separate leads into your Notebook for safekeeping.',
    trigger: { type: 'count', metric: 'clues', atLeast: 5 },
    hint: 'Save five clues from around the ring.',
  },
  {
    id: 'connect_dots',
    name: 'Connect the Dots',
    description: 'Linked two separate clues on the Notebook Board to uncover a hidden pattern.',
    trigger: { type: 'count', metric: 'insights', atLeast: 1 },
    hint: 'Try connecting related clues on the Board.',
  },
  {
    id: 'source_enthusiast',
    name: 'View Source Enthusiast',
    description: 'Opened View Source on five different pages to read the notes left in the margins.',
    trigger: { type: 'count', metric: 'sourceViews', atLeast: 5 },
    hint: 'Inspect HTML source across five distinct pages.',
  },
  {
    id: 'behind_curtain',
    name: 'Behind the Curtain',
    description: 'Recovered an unlisted draft written minutes before the ring went quiet.',
    trigger: { type: 'fact', id: 'lamplighter_log_1' },
    hint: 'Follow the 11/09 clue chain to an unlisted log.',
  },
  {
    id: 'nobody_did_this',
    name: 'Nobody Did This to Them',
    description: 'Pieced together why forty sites disappeared at the same hour.',
    trigger: { type: 'fact', id: 'connection_deliberate' },
    hint: 'Link a hosting ticket to a forum farewell.',
  },
  {
    id: 'keep_light_on',
    name: 'Keep the Light On',
    description: 'Found the quiet page left open for someone coming home.',
    trigger: { type: 'fact', id: 'halcyon_fragment_1' },
    hint: 'Look where the porch light was left burning.',
  },
];
