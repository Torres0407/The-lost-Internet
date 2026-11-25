import type { Site } from '../../engine/types';

interface TumbleweedPageOptions {
  title: string;
  heading: string;
  subtitle: string;
  activePath:
    | '/'
    | '/support'
    | '/status'
    | '/faq'
    | '/terms'
    | '/contact'
    | '/tickets'
    | '/tickets/20417';
  bodyHtml: string;
  topComment?: string;
}

interface TumbleweedNavItem {
  path: TumbleweedPageOptions['activePath'];
  url: string;
  label: string;
}

const TUMBLEWEED_NAV_ITEMS: readonly TumbleweedNavItem[] = [
  { path: '/', url: 'meridian://tumbleweed/', label: 'Hosting Home' },
  { path: '/support', url: 'meridian://tumbleweed/support', label: 'Support Bulletin' },
  { path: '/status', url: 'meridian://tumbleweed/status', label: 'Service Status' },
  { path: '/faq', url: 'meridian://tumbleweed/faq', label: 'Customer FAQ' },
  { path: '/tickets', url: 'meridian://tumbleweed/tickets', label: 'Resolved Tickets' },
  { path: '/terms', url: 'meridian://tumbleweed/terms', label: 'Terms of Service' },
  { path: '/contact', url: 'meridian://tumbleweed/contact', label: 'Contact Support' },
];

const TUMBLEWEED_STYLES = `
  :host, .tw-body {
    background: #e3dccb;
    color: #26231d;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 13px;
    line-height: 1.55;
    margin: 0;
    padding: 16px 14px 26px;
  }
  * {
    box-sizing: border-box;
  }
  .tw-shell {
    max-width: 780px;
    margin: 0 auto;
    background: #faf7f0;
    border: 2px solid #8a7f68;
    box-shadow: 0 2px 10px rgba(38, 35, 29, 0.14);
  }
  .tw-topbar {
    background: #162a45;
    color: #ffffff;
    padding: 14px 20px;
    border-bottom: 4px solid #b59e72;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .brand-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .css-logo {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    border: 3px solid #e5d4b0;
    background: radial-gradient(circle at 38% 36%, #d9c398 0 24%, transparent 25%),
                repeating-linear-gradient(35deg, #274973 0 4px, #b59e72 4px 6px);
    position: relative;
    flex-shrink: 0;
  }
  .css-logo::after {
    content: "";
    position: absolute;
    inset: 7px;
    border-radius: 50%;
    border: 2px dashed #faf7f0;
  }
  .tw-brand-title {
    margin: 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 20px;
    color: #ffffff;
    letter-spacing: 0.02em;
  }
  .tw-brand-sub {
    margin: 2px 0 0 0;
    font-size: 11px;
    color: #dce6f2;
  }
  .tw-meta {
    font-size: 11px;
    color: #e6eef7;
    text-align: right;
  }
  .tw-nav {
    background: #efe9da;
    border-bottom: 1px solid #b8ad96;
    padding: 8px 16px;
  }
  .tw-nav ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .tw-nav a,
  .tw-nav .nav-current {
    display: inline-block;
    padding: 4px 10px;
    font-size: 12px;
    border: 1px solid #a89c84;
    background: #faf7f0;
    text-decoration: none;
  }
  .tw-nav .nav-current {
    background: #162a45;
    border-color: #162a45;
    color: #ffffff;
    font-weight: bold;
  }
  .tw-main {
    padding: 18px 22px 22px;
  }
  h2 {
    margin: 0 0 10px 0;
    padding-bottom: 5px;
    border-bottom: 1px solid #c4b89f;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 18px;
    color: #162a45;
  }
  h3 {
    margin: 14px 0 7px 0;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px;
    color: #2c2419;
  }
  p {
    margin: 0 0 11px 0;
  }
  a {
    color: #184273;
    font-weight: bold;
  }
  a:hover {
    color: #733900;
  }
  .notices-panel {
    background: #f3ede0;
    border: 2px solid #8a7f68;
    border-left: 5px solid #162a45;
    padding: 12px 14px;
    margin: 14px 0;
  }
  .status-normal {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    background: #e6f5ec;
    border: 1px solid #3f7a57;
    color: #144a2a;
    padding: 9px 12px;
    margin: 0 0 14px 0;
    font-weight: bold;
  }
  .highlight-box {
    background: #fffdf7;
    border: 1px solid #b8ad96;
    padding: 12px 14px;
    margin: 12px 0;
  }
  .counter-strip {
    background: #efe9da;
    border: 1px solid #b8ad96;
    padding: 8px 12px;
    margin: 14px 0;
    text-align: center;
    font-weight: bold;
    color: #2b251b;
  }
  table.tw-table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0 16px 0;
    background: #ffffff;
    border: 1px solid #9e927a;
    font-size: 12px;
  }
  table.tw-table caption {
    text-align: left;
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: bold;
    color: #162a45;
    padding: 0 0 6px 0;
    font-size: 13px;
  }
  table.tw-table th {
    background: #dfd6c3;
    color: #1c1914;
    text-align: left;
    padding: 8px 9px;
    border: 1px solid #9e927a;
  }
  table.tw-table td {
    padding: 7px 9px;
    border: 1px solid #d4cab4;
    vertical-align: top;
  }
  table.tw-table tbody tr:nth-child(even) {
    background: #f8f5ec;
  }
  .faq-item {
    background: #ffffff;
    border: 1px solid #cfc5af;
    padding: 10px 13px;
    margin: 10px 0;
  }
  .faq-item h3 {
    margin: 0 0 5px 0;
    font-size: 14px;
  }
  .ticket-post {
    background: #ffffff;
    border: 1px solid #b8ad96;
    padding: 12px 14px;
    margin: 12px 0;
  }
  .ticket-post-hdr {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    border-bottom: 1px solid #dfd6c3;
    padding-bottom: 5px;
    margin-bottom: 8px;
    font-size: 12px;
    color: #3d362a;
  }
  .ticket-id {
    font-family: 'Courier New', monospace;
    font-size: 12px;
    font-weight: bold;
    color: #5c3a0e;
    margin: 0 0 6px 0;
  }
  .tw-form {
    background: #f3ede0;
    border: 1px solid #a89c84;
    padding: 14px 16px;
    margin: 14px 0;
  }
  .tw-form fieldset {
    border: 1px solid #b8ad96;
    padding: 12px 14px;
    margin: 0;
    background: #faf7f0;
  }
  .tw-form legend {
    font-family: Georgia, 'Times New Roman', serif;
    font-weight: bold;
    color: #162a45;
    padding: 0 6px;
  }
  .form-row {
    margin-bottom: 11px;
  }
  .form-row label {
    display: block;
    font-weight: bold;
    font-size: 12px;
    color: #26231d;
    margin-bottom: 4px;
  }
  .form-row input[type="text"],
  .form-row input[type="email"],
  .form-row select,
  .form-row textarea {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid #9e927a;
    background: #ffffff;
    color: #26231d;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 12px;
  }
  .tw-submit {
    padding: 6px 14px;
    background: #dfd6c3;
    color: #3d362a;
    border: 1px solid #8a7f68;
    font-weight: bold;
    font-size: 12px;
    cursor: not-allowed;
  }
  .signoff {
    font-weight: bold;
    color: #162a45;
    margin-top: 10px;
  }
  .tw-footer {
    background: #efe9da;
    border-top: 1px solid #b8ad96;
    padding: 10px 18px;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11px;
    color: #3d362a;
  }
`;

function wrapTumbleweedPage({
  title,
  heading,
  subtitle,
  activePath,
  bodyHtml,
  topComment,
}: TumbleweedPageOptions): string {
  const navHtml = TUMBLEWEED_NAV_ITEMS.map((item) => {
    if (item.path === activePath) {
      return `<li><span class="nav-current" aria-current="page">${item.label}</span></li>`;
    }
    return `<li><a href="${item.url}">${item.label}</a></li>`;
  }).join('\n          ');

  const commentBlock = topComment ? `\n  ${topComment}` : '';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>${TUMBLEWEED_STYLES}</style>
</head>
<body class="tw-body">${commentBlock}
  <div class="tw-shell">
    <header class="tw-topbar">
      <div class="brand-row">
        <div class="css-logo" aria-hidden="true"></div>
        <div>
          <h1 class="tw-brand-title">${heading}</h1>
          <p class="tw-brand-sub">${subtitle}</p>
        </div>
      </div>
      <div class="tw-meta">
        Customer Operations Portal<br />
        Last updated: <time>11/08/2002</time>
      </div>
    </header>
    <nav class="tw-nav" aria-label="Tumbleweed Hosting navigation">
      <ul>
          ${navHtml}
      </ul>
    </nav>
    <main class="tw-main">
      ${bodyHtml}
    </main>
    <footer class="tw-footer">
      <span>Tumbleweed Shared Hosting Solutions · <a href="meridian://ring-hub/">Meridian Ring Hub</a></span>
      <span>Copyright 1999–2002 Tumbleweed Hosting · Updated <time>11/08/2002</time></span>
    </footer>
  </div>
</body>
</html>`;
}

export const TUMBLEWEED_SITE: Site = {
  id: 'tumbleweed',
  name: 'Tumbleweed Hosting',
  pages: [
    {
      url: 'meridian://tumbleweed/',
      title: 'Tumbleweed Hosting — Reliable Personal & Community Web Space',
      grants: ['visited_tumbleweed'],
      html: wrapTumbleweedPage({
        title: 'Tumbleweed Hosting — Reliable Personal & Community Web Space',
        heading: 'Tumbleweed Shared Hosting',
        subtitle: 'Dependable Homepages, Community Rings & Small-Business Accounts Since 1999',
        activePath: '/',
        topComment: '<!-- legacy group 4 pages to be removed from nginx config after migration -->',
        bodyHtml: `
      <h2>Welcome, Valued Customers</h2>
      <p>
        At Tumbleweed Hosting, we believe personal websites and community webrings deserve steady
        uptime, courteous customer service, and straightforward pricing with zero surprises. Whether
        you are publishing a family recipe ledger or managing a forty-site hobby ring, our shared
        servers keep your corner online around the clock.
      </p>

      <div class="counter-strip">
        Over 12,000 happy sites hosted! · 99.4% Annual Shared-Cluster Availability
      </div>

      <div class="notices-panel">
        <h3>Customer Notices</h3>
        <p>
          Please review our latest advisory regarding scheduled optimisation on Meridian Ring
          Cluster 04 this weekend. We apologise for any inconvenience during brief transfer windows.
        </p>
        <p>
          <a href="meridian://tumbleweed/support">Read the Customer Support Bulletin &amp; Maintenance Notice</a>
        </p>
      </div>

      <table class="tw-table">
        <caption>Tumbleweed Shared Hosting Plans (Autumn 2002 Schedule)</caption>
        <thead>
          <tr>
            <th scope="col">Plan Tier</th>
            <th scope="col">Monthly Fee</th>
            <th scope="col">Disk Space</th>
            <th scope="col">Monthly Transfer</th>
            <th scope="col">Included Features</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Free Starter</th>
            <td>$0.00 / mo</td>
            <td>15 MB</td>
            <td>500 MB</td>
            <td>Static HTML, FTP upload, compact footer banner</td>
          </tr>
          <tr>
            <th scope="row">Plus</th>
            <td>$4.95 / mo</td>
            <td>75 MB</td>
            <td>2.5 GB</td>
            <td>Ad-free pages, custom CGI guestbooks, 3 POP3 mailboxes</td>
          </tr>
          <tr>
            <th scope="row">Pro</th>
            <td>$12.95 / mo</td>
            <td>250 MB</td>
            <td>8.0 GB</td>
            <td>15 POP3 mailboxes, group directory tools, priority ticket queue</td>
          </tr>
        </tbody>
      </table>

      <p>
        Looking for quick answers? Browse our <a href="meridian://tumbleweed/faq">Customer FAQ</a>,
        check live advisories on <a href="meridian://tumbleweed/status">Service Status</a>, or review
        <a href="meridian://tumbleweed/tickets">Recent Resolved Tickets</a>.
      </p>

      <p class="signoff">— The Tumbleweed Team</p>`,
      }),
    },
    {
      url: 'meridian://tumbleweed/support',
      title: 'Tumbleweed Hosting — Support Bulletin',
      grants: ['maintenance_window_known'],
      html: wrapTumbleweedPage({
        title: 'Tumbleweed Hosting — Support Bulletin',
        heading: 'Tumbleweed Customer Operations',
        subtitle: 'Service Advisories, Scheduled Optimisation & Helpdesk Resources',
        activePath: '/support',
        bodyHtml: `
      <div class="status-normal">
        <span>Current Platform Status: All systems normal</span>
        <span>Updated <time>11/08/2002</time></span>
      </div>

      <h2>Service Advisory — Meridian Ring Cluster (Group 4)</h2>
      <p>
        Dear valued customers, as part of our autumn hardware refresh, Tumbleweed Hosting will
        perform a routine migration to new infrastructure for all hobbyist domains hosted on shared
        group 4.
      </p>

      <div class="highlight-box">
        <p class="ticket-id">BULLETIN #2002-1109 · SCHEDULED OPTIMISATION</p>
        <p>
          All accounts on Meridian Cluster 04 will enter a planned
          <strong>maintenance window starting on <time>11/09/2002</time> at 23:00</strong>.
          FTP uploads and shell logins will be temporarily paused during this routine migration to
          new infrastructure so directory records remain consistent.
        </p>
        <p>
          We apologise for any inconvenience and appreciate your patience while our engineers
          complete this scheduled optimisation.
        </p>
      </div>

      <h3>Customer Helpdesk Resources</h3>
      <ul>
        <li><a href="meridian://tumbleweed/tickets">Recent Resolved Tickets</a> — Review anonymised operations logs and completion notices.</li>
        <li><a href="meridian://tumbleweed/faq">Customer FAQ</a> — Common questions on migrations, backups, and billing.</li>
        <li><a href="meridian://tumbleweed/status">Service Status History</a> — Past and upcoming platform maintenance records.</li>
        <li><a href="meridian://tumbleweed/contact">Contact Support</a> — Submit an account inquiry or reach our phone desk.</li>
      </ul>

      <p class="signoff">— The Tumbleweed Team</p>`,
      }),
    },
    {
      url: 'meridian://tumbleweed/status',
      title: 'Tumbleweed Hosting — Service Status',
      html: wrapTumbleweedPage({
        title: 'Tumbleweed Hosting — Service Status',
        heading: 'Tumbleweed Service Status',
        subtitle: 'Scheduled Maintenance & Cluster Operations Ledger',
        activePath: '/status',
        bodyHtml: `
      <div class="status-normal">
        <span>Current Platform Status: All systems normal</span>
        <span>Last checked <time>11/08/2002</time></span>
      </div>

      <h2>Recent &amp; Upcoming Service Events</h2>
      <p>
        Our engineering team logs scheduled optimisation windows and resolved cluster notices here
        for the convenience of our valued customers.
      </p>

      <table class="tw-table">
        <caption>Last 8 Platform Service Events (MM/DD/YYYY)</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Cluster / Scope</th>
            <th scope="col">Event Summary</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><time>11/09/2002</time></td>
            <td>Shared Group 4</td>
            <td>Scheduled: migration of legacy shared servers (group 4)</td>
            <td>Scheduled</td>
          </tr>
          <tr>
            <td><time>10/28/2002</time></td>
            <td>Mail Relay 02</td>
            <td>POP3 queue throttling cleared following spam filter update</td>
            <td>Resolved</td>
          </tr>
          <tr>
            <td><time>10/14/2002</time></td>
            <td>Shared Group 4</td>
            <td>Scheduled optimisation of CGI guestbook lock files</td>
            <td>Completed</td>
          </tr>
          <tr>
            <td><time>09/30/2002</time></td>
            <td>Core Switch B</td>
            <td>Firmware patch applied during early-morning quiet hours</td>
            <td>Completed</td>
          </tr>
          <tr>
            <td><time>09/12/2002</time></td>
            <td>FTP Gateway</td>
            <td>Passive-mode port range expanded for dial-up clients</td>
            <td>Resolved</td>
          </tr>
          <tr>
            <td><time>08/29/2002</time></td>
            <td>Shared Group 1</td>
            <td>Power supply unit swap on secondary storage shelf</td>
            <td>Completed</td>
          </tr>
          <tr>
            <td><time>08/19/2002</time></td>
            <td>DNS Primary</td>
            <td>Zone transfer timing adjustment across regional mirrors</td>
            <td>Completed</td>
          </tr>
          <tr>
            <td><time>08/04/2002</time></td>
            <td>Shared Group 4</td>
            <td>Routine disk defragmentation and quota audit</td>
            <td>Completed</td>
          </tr>
        </tbody>
      </table>

      <p class="signoff">— The Tumbleweed Team</p>`,
      }),
    },
    {
      url: 'meridian://tumbleweed/faq',
      title: 'Tumbleweed Hosting — Customer FAQ',
      html: wrapTumbleweedPage({
        title: 'Tumbleweed Hosting — Customer FAQ',
        heading: 'Tumbleweed Customer FAQ',
        subtitle: 'Frequently Asked Questions Regarding Hosting, Migrations & Backups',
        activePath: '/faq',
        bodyHtml: `
      <h2>Frequently Asked Questions</h2>
      <p>
        Below are answers to the most common support questions received from our valued customers.
        If you need further help, please visit our <a href="meridian://tumbleweed/contact">Contact Support</a> page.
      </p>

      <div class="faq-item">
        <h3>1. Do I need to re-upload my files during a scheduled server migration?</h3>
        <p>
          Customer data is always migrated automatically; no action is needed. Our technicians copy
          all HTML files, images, and guestbook databases directly to the new volume prior to cutover.
        </p>
      </div>

      <div class="faq-item">
        <h3>2. What happens to my files if an account is closed or removed?</h3>
        <p>
          Backups of removed accounts are kept for 30 days on our offline recovery tapes before
          scheduled rotation. After 30 days, archived volumes are permanently recycled.
        </p>
      </div>

      <div class="faq-item">
        <h3>3. Why is FTP paused during a maintenance window?</h3>
        <p>
          Temporarily locking FTP prevents half-uploaded files from changing while disk snapshots are
          in progress. We apologise for any inconvenience this short pause may cause.
        </p>
      </div>

      <div class="faq-item">
        <h3>4. Can I still run a Perl or CGI guestbook on a Plus plan?</h3>
        <p>
          Yes! Plus and Pro plans include a pre-configured cgi-bin folder suitable for lightweight
          visitor counters, guestbooks, and simple feedback forms.
        </p>
      </div>

      <div class="faq-item">
        <h3>5. How do community webring groups handle billing?</h3>
        <p>
          Sponsored webring clusters are billed through the designated group administrator account,
          which manages member slots and collective storage quotas on behalf of the ring.
        </p>
      </div>

      <div class="faq-item">
        <h3>6. What should I do if my hit counter stops incrementing?</h3>
        <p>
          Check that your counter file retains write permissions in your public folder, or ask your
          ring coordinator to verify the script path after any routine optimisation.
        </p>
      </div>

      <div class="faq-item">
        <h3>7. How quickly are support tickets answered?</h3>
        <p>
          Standard inquiries are answered within one business day, and urgent group-administration
          requests are typically processed within four hours once account ownership is verified.
        </p>
      </div>

      <div class="faq-item">
        <h3>8. Where can I read Tumbleweed's cancellation and privacy policies?</h3>
        <p>
          Full details on account stewardship and closure procedures are always available in our
          <a href="meridian://tumbleweed/terms">Terms of Service</a>.
        </p>
      </div>

      <p class="signoff">— The Tumbleweed Team</p>`,
      }),
    },
    {
      url: 'meridian://tumbleweed/terms',
      title: 'Tumbleweed Hosting — Terms of Service',
      html: wrapTumbleweedPage({
        title: 'Tumbleweed Hosting — Terms of Service',
        heading: 'Tumbleweed Terms of Service',
        subtitle: 'Customer Account Agreement · Revised 04/15/2002',
        activePath: '/terms',
        bodyHtml: `
      <h2>Shared Hosting Terms of Service</h2>
      <p>
        By maintaining an individual or group-sponsored account with Tumbleweed Shared Hosting,
        valued customers agree to the following service provisions:
      </p>

      <div class="highlight-box">
        <h3>1. Acceptable Content &amp; Fair Resource Use</h3>
        <p>
          Hosted pages must remain lawful, non-abusive, and within allotted disk and monthly
          transfer limits. Tumbleweed reserves the right to perform scheduled optimisation to keep
          shared clusters responsive for all neighbors.
        </p>
      </div>

      <div class="highlight-box">
        <h3>2. Account Ownership &amp; Group Administration</h3>
        <p>
          For bundled community clusters, the registered group administrator holds sole authority
          over membership allocation, sub-account activation, and collective administrative requests.
        </p>
      </div>

      <div class="highlight-box">
        <h3>3. Account Removal &amp; Confidentiality</h3>
        <p>
          Account removal requests made by a verified account owner or group administrator are
          processed without delay and without notification to third parties. Tumbleweed Hosting
          relies upon the requesting administrator to communicate any schedule changes to their
          sub-account users directly.
        </p>
      </div>

      <div class="highlight-box">
        <h3>4. Limitation of Liability</h3>
        <p>
          While Tumbleweed strives for continuous availability, service may pause briefly during
          planned maintenance. We apologise for any inconvenience arising from scheduled hardware
          transitions.
        </p>
      </div>

      <p class="signoff">— The Tumbleweed Team</p>`,
      }),
    },
    {
      url: 'meridian://tumbleweed/contact',
      title: 'Tumbleweed Hosting — Contact Support',
      html: wrapTumbleweedPage({
        title: 'Tumbleweed Hosting — Contact Support',
        heading: 'Contact Tumbleweed Support',
        subtitle: 'Helpdesk Hours, Phone Desk & Web Inquiry Form',
        activePath: '/contact',
        bodyHtml: `
      <h2>Customer Support Desk</h2>
      <p>
        Our friendly support representatives are pleased to assist valued customers with billing,
        FTP setup, and scheduled maintenance questions.
      </p>

      <div class="highlight-box">
        <p><strong>Telephone Desk (Mon–Fri, 08:00–18:00 EST):</strong> (555) 014-8820</p>
        <p><strong>Electronic Mail:</strong> support@tumbleweed-hosting.example</p>
        <p><strong>Resolved Log Archive:</strong> <a href="meridian://tumbleweed/tickets">View Recent Resolved Tickets</a></p>
      </div>

      <form class="tw-form" action="#">
        <fieldset>
          <legend>Submit a Support Request (Offline in Snapshot)</legend>

          <div class="form-row">
            <label for="tw-name">Account Name or Handle</label>
            <input id="tw-name" name="accountName" type="text" placeholder="e.g. delphine_aubrey" />
          </div>

          <div class="form-row">
            <label for="tw-email">Reply Email Address</label>
            <input id="tw-email" name="replyEmail" type="email" placeholder="customer@domain.example" />
          </div>

          <div class="form-row">
            <label for="tw-topic">Inquiry Category</label>
            <select id="tw-topic" name="topic">
              <option value="migration">Scheduled Optimisation &amp; Migrations</option>
              <option value="ftp">FTP &amp; CGI Permissions</option>
              <option value="billing">Billing &amp; Group Plans</option>
              <option value="other">General Account Question</option>
            </select>
          </div>

          <div class="form-row">
            <label for="tw-msg">Message Details</label>
            <textarea id="tw-msg" name="message" rows="4" placeholder="Please include your cluster number if known..."></textarea>
          </div>

          <button class="tw-submit" type="submit" disabled>Send Ticket (Unavailable in Snapshot)</button>
        </fieldset>
      </form>

      <p class="signoff">— The Tumbleweed Team</p>`,
      }),
    },
    {
      url: 'meridian://tumbleweed/tickets',
      title: 'Tumbleweed Hosting — Recent Resolved Tickets',
      html: wrapTumbleweedPage({
        title: 'Tumbleweed Hosting — Recent Resolved Tickets',
        heading: 'Public Operations Log',
        subtitle: 'Recent Resolved & Closed Customer Support Tickets',
        activePath: '/tickets',
        bodyHtml: `
      <h2>Recent Resolved Tickets</h2>
      <p>
        For transparency across our shared hosting clusters, anonymised summaries of recent
        completed operations tickets are listed below.
      </p>

      <table class="tw-table">
        <caption>Anonymised Customer Support Ticket Summaries (October–November 2002)</caption>
        <thead>
          <tr>
            <th scope="col">Ticket ID</th>
            <th scope="col">Date</th>
            <th scope="col">Subject</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">#20417</th>
            <td><time>11/06/2002</time></td>
            <td><a href="meridian://tumbleweed/tickets/20417">Bulk account removal, shared group 4</a></td>
            <td>Resolved</td>
          </tr>
          <tr>
            <th scope="row">#20403</th>
            <td><time>11/05/2002</time></td>
            <td>POP3 mailbox quota reset, cluster 2</td>
            <td>Resolved</td>
          </tr>
          <tr>
            <th scope="row">#20388</th>
            <td><time>11/04/2002</time></td>
            <td>Request: export of chat logs</td>
            <td>Closed</td>
          </tr>
          <tr>
            <th scope="row">#20361</th>
            <td><time>10/29/2002</time></td>
            <td>CGI guestbook permissions adjustment</td>
            <td>Resolved</td>
          </tr>
          <tr>
            <th scope="row">#20344</th>
            <td><time>10/22/2002</time></td>
            <td>Billing invoice resend (autumn cycle)</td>
            <td>Resolved</td>
          </tr>
          <tr>
            <th scope="row">#20319</th>
            <td><time>10/14/2002</time></td>
            <td>FTP password reset verification</td>
            <td>Closed</td>
          </tr>
        </tbody>
      </table>

      <p>
        Valued customers with questions about an open request may reach us via
        <a href="meridian://tumbleweed/contact">Contact Support</a>.
      </p>

      <p class="signoff">— The Tumbleweed Team</p>`,
      }),
    },
    {
      url: 'meridian://tumbleweed/tickets/20417',
      title: 'Tumbleweed Hosting — Ticket #20417',
      grants: ['read_ticket_20417'],
      html: wrapTumbleweedPage({
        title: 'Tumbleweed Hosting — Ticket #20417',
        heading: 'Ticket #20417 — Operations Thread',
        subtitle: 'Archived Support Transcript · Status: Resolved',
        activePath: '/tickets/20417',
        topComment: '<!-- internal: customer verified by phone, 11/06 -->',
        bodyHtml: `
      <h2>Ticket #20417: Bulk account removal, shared group 4</h2>
      <p>
        <a href="meridian://tumbleweed/tickets">&lt;&lt; Back to Recent Resolved Tickets</a>
      </p>

      <article class="ticket-post">
        <div class="ticket-post-hdr">
          <span><strong>From:</strong> L. (group admin)</span>
          <time>11/06/2002 14:18</time>
        </div>
        <p>
          Hello Tumbleweed support,
        </p>
        <p>
          I am writing as the registered administrator for shared group 4. Please schedule the
          removal of all 40 group accounts at 11/09/2002 23:00, including the directory web root
          and guestbook CGI volumes.
        </p>
        <p>
          Per section 3 of our hosting terms, please do not announce this, the members have been
          told in person. Thank you for handling this promptly.
        </p>
        <p>— L. (group admin)</p>
      </article>

      <article class="ticket-post">
        <div class="ticket-post-hdr">
          <span><strong>From:</strong> Tumbleweed Customer Operations (Desk #04)</span>
          <time>11/06/2002 15:02</time>
        </div>
        <p>
          Dear valued customer,
        </p>
        <p>
          Thank you for reaching out to Tumbleweed Hosting! We are delighted to confirm that your
          scheduled request for shared group 4 has been queued for 11/09/2002 at 23:00 in full
          accordance with our Terms of Service. No public notices will be sent to individual
          sub-account holders, and our automated queue will list the evening as routine
          scheduled optimisation on the public calendar.
        </p>
        <p>
          We appreciate your business and have marked this ticket <strong>Resolved</strong>. Please
          let us know if we may assist you with anything further!
        </p>
        <p class="signoff">— The Tumbleweed Team</p>
      </article>`,
      }),
    },
  ],
};
