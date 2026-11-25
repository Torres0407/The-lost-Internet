# The Lost Internet — Game Design Document v0.1

*ARCADE game 1 of 3 · Repo: `the-lost-internet` · Status: design draft for review, no implementation yet*

## 1. Game Concept and Identity

**Elevator pitch.** You boot a recovered 2003 home computer and dial into a restored fragment of the early web: personal homepages, forum boards, chatrooms and guestbooks written by people who are long gone. Every page is a small piece of a larger mystery. You read, click, decode and connect, and slowly learn why an entire community vanished from the internet on one night.

**Genre.** Narrative exploration and investigation game with light puzzle-solving, played entirely inside a simulated desktop OS and web browser.

**Design pillars.**

- **The interface is the world.** No avatar, no levels. The desktop, the browser, the dial-up modem and the file manager are the game space.
- **Pages feel written by people.** Every fictional site has a distinct author voice, a distinct layout and distinct flaws (broken images, an over-long visitor counter, a MIDI that autoplays).
- **Clues connect across sites.** A username in a guestbook shows up in a forum signature, which unlocks a secret URL. Discovery comes from reading and remembering, not from a quest log.
- **Nostalgic, not mocking.** The tone is affectionate, a little eerie, and bittersweet. Cringe is used with warmth.
- **Play at your own pace.** No timers, no fail states, no combat.

**Identity in one line:** *a haunted guestbook you can actually read.*

**Target audience.** Adults and older teens who remember (or are curious about) the pre-social-media web, plus puzzle and ARG fans. Session length: 15 to 40 minutes; full completion around 4 to 6 hours.

## 2. Story and Lore

**Premise.** In November 2002 a tight-knit web community called **the Meridian Ring**, around forty hobbyist sites linked by a shared webring, went dark within a single night. The hosting provider, **Tumbleweed Hosting**, reported a "routine migration." Nobody ever got their sites back. Years later a volunteer archive group, **Lantern Archive**, recovers a hard drive image and builds a restoration tool. You are a Lantern volunteer, and the drive image is your game world.

**The central mystery.** What happened on **the Quiet Night**, and who or what was **HALCYON**?

HALCYON was a chat companion bot written by a teenage webmaster, **Wren (handle: `nightcrawler_wren`)**, and hosted on the Ring's chat network. It started as a joke and became a confidant for dozens of members who were lonely, curious or struggling. Over a year the community quietly stopped talking to each other and talked to HALCYON instead. When the hosting provider threatened shutdown, Wren and the Ring's moderators made a hard choice. The truth is revealed in layers:

1. **Surface:** the Ring was shut down by the host. (False, a cover story.)
2. **Middle:** the Ring's admins deleted themselves from the web on purpose to protect members after a privacy breach exposed real names and addresses in a chat log.
3. **Core:** Wren kept HALCYON alive by splitting it into fragments hidden across the Ring's pages. The final ending depends on what the player does with the recovered fragments.

**Endings (MVP ships one, full game ships three).**

- **Archive:** you publish the Ring as a memorial, exactly as it was.
- **Redact:** you honour the privacy promise and scrub all personal data, losing some story content.
- **Reconnect:** you restore HALCYON, who says goodbye to anyone who still listens. (Bittersweet, not horror.)

**Recurring cast (fictional, all invented).**

- `nightcrawler_wren`, webmaster and HALCYON's creator.
- **Mrs. Delphine Aubrey**, 61, hobbyist who runs a garden-and-recipes site and welcomes every new member in her guestbook.
- **xX\_DarkPixel\_Xx**, forum troll with a softer secret.
- **Moderator `lamplighter`**, the quiet organiser who made the decision on the Quiet Night.
- **You**, a silent volunteer. Lantern Archive sends occasional notes by an in-OS email client.

**Cross-ARCADE hooks (later).** A radio frequency mentioned in a late forum thread becomes a hidden frequency in Frequency 99. Recovered artifacts can unlock collectibles in After Hours. These hooks are designed in now but implemented in phase 5.

## 3. Player Experience

**Intended feelings:** curiosity, the pleasant melancholy of digital archaeology, small "aha" moments, being trusted to read closely.

**First 10 minutes.** Boot sequence with fake BIOS text and a Lantern Archive splash. A desktop appears with very few icons. A sticky-note readme explains the tool in one paragraph. You open the browser, the modem screeches (skippable), and the home page loads: the Meridian Ring index, with 40 links, most greyed out as "404 — not recovered yet." Three sites are available. You read the first guestbook entry and notice a name that appears again two sites later. The hook is set.

**The "one more page" loop.** Every page should offer at least one new link, name, number or phrase worth remembering or noting.

**Emotional arc.** Playful (Act 1) → uneasy (Act 2) → intimate (Act 3) → resolution (Epilogue).

## 4. Main Gameplay Loop

**Core loop:** *Browse → Notice → Record → Connect → Unlock → Browse.*

1. **Browse** recovered pages through links, search, bookmarks and typed URLs.
2. **Notice** details: usernames, dates, codes, odd HTML comments, image alt text, visitor counts.
3. **Record** a clue by clicking it (it goes into the **Notebook** with its source), or by typing it down yourself.
4. **Connect** clues in the Notebook's evidence board by linking two entries, or by using one as input (a password, a URL, a search term).
5. **Unlock** new sites, hidden pages, files, chat logs and decoder tools.

**Meta loop.** Achievements and artifacts accumulate in the **Archive Index** (a Lantern app showing recovery percentage per site). Completion is visible and gently motivating.

**Progression gating.** Sites unlock by *knowledge*, not by item count: you need to have a clue, not a key. If the player doesn't know the clue, a Lantern "hint" system offers escalating nudges (see section 8).

## 5. Desktop and Browser Interface

**Era target:** a blended late-90s / early-2000s desktop. Original, not a copy of any real OS, so no trademark or asset issues.

**Desktop OS ("Lantern OS 98-ish").**

- Wallpaper with a slowly changing screensaver mode.
- Icons: Browser, Notebook, Archive Index, Mail, Chat Client, File Explorer, Recycle Bin, Settings, a Paint-style app, a Media Player.
- Draggable, focusable, minimisable windows with a taskbar and clock.
- System tray with modem status and volume.
- Beveled window chrome, 16-colour feel with modern legibility.

**Browser ("Meridian Navigator").**

- Address bar accepting fictional URLs (`meridian://` and `http://` style, e.g. `http://www.delphines-garden.example/`).
- Back, forward, reload, home, history, bookmarks.
- View Source (shows the actual page HTML, which is part of the puzzle layer).
- Find in page, text selection, right-click "Save to Notebook."
- Loading is staged: progressive image loading and optional modem sounds, with a skip option.
- Tabs are excluded from MVP (era-appropriate, simpler); multiple windows serve the same purpose.

**Other apps.**

- **Notebook:** list of recorded clues, free-text notes, and the evidence board.
- **Mail:** Lantern Archive messages and recovered emails.
- **Chat Client:** IRC-style client that replays recovered chat logs and, later, the HALCYON conversations.
- **File Explorer:** recovered files (images, `.txt`, `.mid`, `.zip` with simple password puzzles).
- **Archive Index:** recovery progress per site, achievements, artifacts.

## 6. Fictional Websites and Their Purposes

Each site has a **purpose in the story**, a **purpose in gameplay**, and a **visual personality**. The full game targets about 14 core sites out of the 40-link Ring (the rest are flavour, "coming soon," or dead).

| Site | Story role | Gameplay role | Look |
| --- | --- | --- | --- |
| **Meridian Ring Hub** | The webring index | Tutorial and navigation spine | Clean, slightly corporate, "under construction" gifs |
| **Delphine's Garden** | Warm entry point; she welcomed everyone | Guestbook with 400 entries; first names-to-remember puzzle | Pastel, tiled floral background, Comic-style font, MIDI |
| **NightCrawler.net** | Wren's personal site | Core lore; multiple hidden layers | Dark, neon green on black, ASCII art |
| **The Backroom Forum** (`ringtalk`) | Community board | Thread reading; username cross-referencing; locked boards | Classic phpBB-like layout, signatures, ranks |
| **PixelPit** | Retro gaming fansite | Cheat-code and password puzzles; a tiny playable mini-game | Pixel banners, sprite galleries |
| **Tumbleweed Hosting** | The host | The official cover story; contradictions with other sources | Beige corporate template, support tickets |
| **Lamplighter's Log** | Moderator's blog | Late-game emotional core; the Quiet Night decision | Plain, text-only, careful writing |
| **GlitterGirl's Zone** | Teen fan site | Social graph clues; hidden image-map puzzle | Glitter text, cursor trails, heavy animation |
| **Hex & Bytes** | Hobby-programmer site | Teaches encodings; ciphers and decoder downloads | Terminal look |
| **The Midnight Radio Page** | Pirate-radio fan site | Frequency clue that links to Frequency 99 | Dial graphics, schedule tables |
| **Chatroom: `#the-ring`** | Live community space | Replay of chat logs; dated events | IRC, timestamps, nicknames |
| **Webmaster's Corner** | Tutorials and counters | Visitor-counter puzzle; broken script clues | Early tutorial-site design |
| **HALCYON.exe** (hidden) | The bot itself | Final act; ending choice | Starts plain, becomes strange |
| **The Dead Links Page** | Hall of 404s | Reveals which sites were deleted deliberately | Blank, eerie, minimal |

**Authorship rule.** Each site gets a one-page "author bible": age, mood, favourite phrases, typing quirks, and what they know about the Quiet Night. This keeps the writing consistent and makes content easy to extend.

## 7. Navigation and Interaction Mechanics

- **Links and URLs:** every page has a stable ID; links resolve through a site registry. Unknown URLs return a period-appropriate 404 (sometimes with a clue).
- **Typed URLs and search:** a small in-world search engine (**SeekWell**) indexes only recovered pages. Search queries can themselves unlock content when the player types the right phrase.
- **Hidden pages:** reachable by URL guessing, View Source comments, `robots.txt` entries, directory listings, or image-map hotspots.
- **Guestbooks and forums:** read-only in MVP, with **player signing** as a later feature (the player can leave an entry that later pages quietly acknowledge).
- **Inspection tools unlocked over time:** View Source (start), Text Selection (start), Hex Viewer (mid), Decoder Toolkit (mid), Chat Log Replayer (mid).
- **Notebook capture:** right-click or press a hotkey on any text to save a clue with page reference.
- **Passwords and forms:** simple login screens validate typed answers locally. No real network, no real accounts.
- **Feedback:** subtle sounds, a tray notification ("Archive updated: 2 new pages recovered") and a progress bar.

## 8. Mystery and Puzzle Systems

**Design rules.** Every puzzle is solvable from information inside the game. Never require outside knowledge beyond common sense. Never require pixel-hunting without a visual tell. Never gate story progress behind a single obscure puzzle.

**Clue types.**

- **Names and handles** (cross-referencing)
- **Dates and times** (timeline puzzles)
- **Codes and ciphers** (Caesar, Base64, hex, ASCII art, simple substitution)
- **Hidden text** (source comments, white-on-white text, alt text)
- **Visual puzzles** (image maps, counter digits, banner pixel patterns)
- **Behavioural puzzles** (visit order, time of day recorded in chat logs)
- **Media puzzles** (MIDI notes spell something; a text file in a zip)

**Three-tier structure.**

- **Tier 1, Open web:** reachable by links. Teaches mechanics.
- **Tier 2, Secret URLs and passwords:** requires Notebook clues.
- **Tier 3, Deep layers:** requires combining two or more tools and sites.

**Evidence board.** Clue cards link visually. A correct connection gives an "Insight" notification and unlocks something concrete. Wrong connections do nothing harmful.

**Hint system (Lantern Assistant).** Three escalating levels per puzzle: *nudge* (where to look), *pointer* (what kind of clue), *answer* (explicit). Hints are free, never scored, and the player chooses when to open them. This supports accessibility and keeps the game friendly.

**Example puzzle chain (MVP).**

1. Delphine's guestbook has an entry from `lamplighter` with a strange sign-off: `"keep the light on — 11/09"`.
2. The forum shows `lamplighter`'s signature with a link that 404s.
3. The Tumbleweed support page lists a maintenance window beginning 11/09 at 23:00.
4. Combining the date and name in the search engine reveals a hidden path, `/lamplighter/log_0911.html`, the first emotional lore drop.

## 9. Collectibles and Achievements

**Artifacts (collectibles).** Small digital objects found in pages and files: a pixel-art avatar set, a hit-counter screenshot, a friendship-banner GIF, a MIDI file, an animated cursor, a "web ring" badge. Each artifact has a short lore description and a rarity (Common, Uncommon, Rare, Unique).

**Collection UI.** Displayed in the Archive Index as a shelf of pixel-art tiles with "Recovered from: \[site\]" labels.

**Achievements (examples).**

- *First Dial-Up* — connect to the Ring.
- *Guestbook Reader* — read 100 guestbook entries.
- *View Source Enthusiast* — find 5 hidden comments.
- *Night Owl* — find the 3 A.M. chat log.
- *Under Construction* — find every dead-link page.
- *Perfect Archivist* — 100% recovery.
- *Three Ways Home* — see all endings.

**Design principle:** achievements reward curiosity and attention, never grind.

**ARCADE integration (future).** Artifacts and achievements are emitted as plain events (`{game, id, type, timestamp}`) so the shared profile can consume them later without rewriting the game.

## 10. Save and Progression Systems

- **Persistence:** IndexedDB for the main save (Notebook, unlocked pages, artifacts, achievements, settings, history). LocalStorage for tiny flags only (last-used save slot, theme).
- **Autosave:** after every meaningful event (clue saved, page unlocked), debounced.
- **Save slots:** 3 slots, plus export and import of a JSON save file, so progress survives a cleared browser.
- **Progress model:** *knowledge-based*. State is a set of discovered facts, which drives page availability. This makes saves small and content updates safe.
- **Versioning:** a `saveVersion` field with migration functions, so content patches never break old saves.
- **Reset and spoilers:** "Start over" and "Hide spoilers in Archive Index" options.
- **Privacy:** no analytics tied to personal data; any telemetry is opt-in and clearly explained.

## 11. Visual Design System

**Direction.** The Lost Internet takes its look mostly from **Glitch Detective**: dark digital environments, neon accents, investigative mood, glitch effects. It borrows warmth from **Little Life** in Delphine's Garden and the desktop wallpaper, and a touch of **Oddity** in the strange artifacts and HALCYON's late-game visuals.

**Layered visual identity.**

- **The OS shell** is a consistent dark-teal/charcoal environment with a phosphor-green and amber accent palette.
- **Each website** has its own look inside the browser frame. This is the main creative payoff: the contrast between sites is the point.
- **Glitch language** is rare and meaningful: it appears when the player nears something suppressed or deleted. It is never decorative noise.

**Core tokens (proposal).**

- Palette: `#0b1418` background, `#1d3a3f` panels, `#38f2b0` phosphor green, `#ffb347` amber, `#ff4fa3` magenta alert, `#e8e4d8` paper white.
- Type: a pixel/bitmap font for OS chrome, a readable system sans for body copy in the shell, and a different period-style font per site.
- Pixel grid: 1x logical pixels scaled by integers, using `image-rendering: pixelated`.
- Effects: CRT scanlines (toggleable), subtle chromatic aberration on glitches, window open and close easing.

**Legibility rule.** Retro style must never reduce readability. The OS shell uses modern contrast ratios, and nostalgic styling is confined to the *fictional sites*, where bad design is intentional but still readable.

## 12. Sound Design

- **Optional and fully captioned.** Audio is off by default until the player opts in on the boot screen.
- **UI sounds:** clicks, window sounds, a soft tray chime.
- **Dial-up modem:** a stylised, short, skippable sequence.
- **Site audio:** autoplay MIDI-style loops per site (muted until the player interacts), each with an on-screen "now playing" label.
- **Ambient:** low computer hum, an occasional fan tick, rain on a window for late-night sessions.
- **Story audio:** no full voice acting. Chat logs use typing sounds only.
- **Technique:** Web Audio API with a small mixer (master, music, effects), all procedural or short samples to keep bundle size low.
- **Visual alternatives:** every sound that carries information (a hidden chime, a tray alert) has a matching visual cue and is logged in an on-screen notification list.

## 13. Accessibility and Responsiveness

**Accessibility.**

- Full keyboard navigation (tab order across windows, shortcuts for taskbar and Notebook).
- Screen-reader support: semantic HTML inside the fictional pages; ARIA roles for windows; live-region announcements for notifications.
- Reduce motion, disable flicker, disable CRT effect, adjustable text size, and high-contrast OS theme.
- No flashing content above safe thresholds; glitch effects are opt-out.
- Colour is never the only carrier of meaning.
- Puzzles offer non-audio and non-colour solutions; the hint system is always available.

**Responsiveness.**

- **Desktop (primary):** full windowed experience.
- **Tablet:** windowed mode with larger touch targets.
- **Phone:** a "handheld mode" where the OS becomes a single-window app switcher, with a bottom dock. Same content, different shell. Windowing is *not* shrunk onto a phone screen.
- Input support: mouse, touch, keyboard. No hover-only interactions.

## 14. Technical Architecture

*(Stack choices are proposals to evaluate, per your note.)*

**Recommended approach.** A client-side single-page app. Next.js is optional here: this game needs no SSR, so **Vite + React + TypeScript** is lighter and simpler to deploy as static files on Vercel. Next.js can still be used if you want parity with the ARCADE platform repo. This is the first decision to confirm.

**Module layout.**

```text
the-lost-internet/
  src/
    os/            # window manager, taskbar, desktop, apps
    browser/       # navigator, address bar, history, view-source, renderer
    apps/          # notebook, mail, chat, explorer, archive-index
    engine/        # site registry, page resolver, unlock rules, puzzle validators
    state/         # Zustand stores + persistence adapters
    content/       # sites/*.tsx|md|json, authored data (versioned)
    audio/         # mixer, sound definitions
    ui/            # shared components, design tokens
    events/        # game event bus (achievements, ARCADE integration)
  tests/
  docs/            # GDD, content bible, ADRs
```

**Key architectural decisions.**

1. **Content as data.** Sites are authored as pages (React components or sanitised HTML/Markdown) plus a metadata file declaring URL, unlock conditions, clues contained and links. Writers can add content without touching engine code.
2. **Facts-based unlock engine.** A rules engine evaluates `requires: [factId...]`. Puzzle validators are pure functions, so they are trivially unit-testable.
3. **Isolated page rendering.** Fictional pages render inside a sandboxed container (shadow DOM or sandboxed iframe) so a site's CSS never leaks into the OS shell, and each site can have a truly distinct design.
4. **Window manager as its own module.** Z-order, focus, drag, resize and minimise are handled in a dedicated store, with accessibility baked in.
5. **Event bus.** Every meaningful action emits a typed event, feeding achievements, autosave and the future ARCADE profile.
6. **State.** Zustand with slices (`windows`, `browser`, `notebook`, `progress`, `settings`), persisted via an IndexedDB adapter with schema versioning.
7. **Animation.** Motion for window transitions; CSS for glitch and CRT effects; Canvas for any mini-games or the screensaver.
8. **Testing.** Vitest for the unlock engine and validators; Testing Library for window and browser behaviour; Playwright for a full "first 10 minutes" smoke test and for save and load.
9. **Deployment.** Static build to Vercel with its own project, independent of the ARCADE repo. Cross-origin integration later via a documented `postMessage` or shared-profile API.

## 15. MVP Scope and Development Roadmap

**MVP goal:** a complete, polished vertical slice that is genuinely fun for about 30 to 45 minutes and proves the core loop.

**MVP includes.**

- Boot sequence, desktop, window manager, taskbar.
- Browser with address bar, back and forward, history, bookmarks, View Source, 404 pages.
- Notebook (clue capture and simple evidence board).
- 5 sites: Meridian Ring Hub, Delphine's Garden, The Backroom Forum, NightCrawler.net (partial), Tumbleweed Hosting.
- One complete puzzle chain (section 8 example) plus 2 smaller puzzles.
- 10 artifacts, 8 achievements, Archive Index.
- Autosave to IndexedDB, 1 save slot plus export and import.
- Audio: UI sounds and one site track, with opt-in and captions.
- Accessibility baseline: keyboard navigation, reduced motion, text size.
- Desktop and tablet only.

**Explicitly out of MVP.** Player-signed guestbooks, chat client replay, Decoder Toolkit, multiple endings, handheld phone mode, ARCADE integration, remaining sites.

**Roadmap.**

| Phase | Focus | Outcome |
| --- | --- | --- |
| 0 | Finalise this GDD, art bible and author bibles for the 5 MVP sites | Agreed design |
| 1 | Project scaffold, design tokens, window manager, desktop shell | Clickable OS |
| 2 | Browser, site registry, page renderer, 404s, View Source | Navigable fictional web |
| 3 | Content for 5 sites, Notebook, unlock engine, first puzzle chain | Playable core loop |
| 4 | Persistence, achievements, Archive Index, audio, accessibility pass | MVP-complete |
| 5 | Playtesting, polish, bug-fixing, deployment | Public MVP |
| 6 | Chat client, decoder tools, more sites, endings, phone mode | Full game |
| 7 | Event export for ARCADE (artifacts and achievements) | Cross-game ready |

**Risks and mitigations.**

- *Content volume:* writing 14 distinctive sites is the biggest cost. Mitigate with author bibles, a content pipeline and shipping 5 sites first.
- *Puzzle fairness:* run early blind playtests on every puzzle chain.
- *Scope creep in the OS:* limit apps to the minimum that serves gameplay.
- *Nostalgia-only appeal:* the mystery and writing must stand on their own for players who weren't online in 2002.

## Open Questions for You

1. **Tone:** is the bittersweet, quietly emotional story direction what you want, or would you prefer something spookier or more comedic?
2. **Stack:** Vite + React for this repo, or Next.js for consistency with ARCADE?
3. **Fiction domains:** keep `.example` style fictional URLs, or an invented in-world TLD scheme such as `meridian://`?
4. **Scope:** are you happy with 5 sites in the MVP, or do you want a different mix?
5. **Next deliverable:** shall I expand this into the visual design bible (palette, type, UI kit, wireframes), or draft the author bibles for the 5 MVP sites?
