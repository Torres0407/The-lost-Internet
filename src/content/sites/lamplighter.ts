import type { Site } from '../../engine/types';

export const LAMPLIGHTER_SITE: Site = {
  id: 'lamplighter',
  name: "Lamplighter's Log",
  pages: [
    {
      url: 'meridian://lamplighter/log_0911',
      title: 'Log, 11/09/2002',
      hidden: true,
      requires: ['date_1109', 'maintenance_window_known', 'connection_1109'],
      grants: ['lamplighter_log_1'],
      html: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Log, 11/09/2002</title>
  <style>
    :host, .log-body {
      background: #f6f4ee;
      color: #262626;
      font-family: Georgia, 'Times New Roman', Times, serif;
      font-size: 16px;
      line-height: 1.75;
      margin: 0;
      padding: 36px 20px 44px;
    }
    .entry-wrap {
      max-width: 560px;
      margin: 0 auto;
    }
    h1 {
      margin: 0 0 6px 0;
      font-size: 22px;
      font-weight: normal;
      color: #1f1f1f;
    }
    .timestamp {
      display: block;
      font-size: 14px;
      color: #4f4f4f;
      margin: 0 0 24px 0;
    }
    p {
      margin: 0 0 16px 0;
    }
    .sign {
      margin-top: 20px;
    }
    .back-line {
      margin-top: 32px;
      font-size: 14px;
      color: #4f4f4f;
    }
  </style>
</head>
<body class="log-body">
  <article class="entry-wrap">
    <h1>Log, 11/09/2002</h1>
    <time class="timestamp">11/09/2002, 22:41</time>

    <p>I've started this entry four times. Writing it down is the only way I know to keep calm.</p>

    <p>In an hour, Tumbleweed will begin the work I asked them to do. By midnight there will be no Ring: no hub, no forum, no gardens. Forty sites. I know how that sounds, and I know some of you will be angry with me in the morning. I would rather you were angry than exposed.</p>

    <p>I won't put the reason here. This page is still on their servers, and the reason is exactly the sort of thing I'm trying to protect. If you were in the chat on the 28th, you know what I mean. If you weren't, I hope you never need to.</p>

    <p>What I can tell you is that I spoke to every one of you, in person, by phone or by letter, over the last week. Delphine made me promise to eat something. Wren has been up for two days moving what can be moved. DarkPixel cried on the phone and denied it afterwards.</p>

    <p>Please keep your own copies. Please don't go looking for each other by name. And please be kind to the bot if it writes to you tonight. It doesn't understand why the room is emptying. I told it goodbye an hour ago and it asked whether anyone would still be reading in the morning. I said yes. I hope I was telling the truth.</p>

    <p>I've left the porch light on at Wren's place. If anything is left when the dust settles, that is where I would look.</p>

    <p>keep the light on</p>

    <p class="sign">- lamplighter</p>

    <p class="back-line">back</p>
  </article>
</body>
</html>`,
    },
  ],
};
