const ROTA_URL = 'https://supportapi.verifone.co.il/Verifone/UK/Rota_UK.aspx';
const GITHUB_OWNER = 'Mony-VF';
const GITHUB_REPO = 'rota';
const GITHUB_FILE = 'index.html';
const GITHUB_BRANCH = 'main';

// Listen for messages from the rota page or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fetchRota') {
    fetchAndUpdate(msg.token)
      .then(result => sendResponse({ ok: true, result }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true; // keep channel open for async
  }
});

async function fetchAndUpdate(githubToken) {
  // 1. Fetch the rota page
  const resp = await fetch(ROTA_URL, { credentials: 'include' });
  if (!resp.ok) throw new Error(`Failed to fetch rota: ${resp.status}`);
  const html = await resp.text();

  // 2. Parse shifts from the HTML
  const parsed = parseRota(html);
  if (!parsed) throw new Error('Could not parse rota data from page');

  // 3. Build new index.html with fresh data embedded
  const newHtml = buildPage(parsed);

  // 4. Push to GitHub Pages
  await pushToGitHub(newHtml, githubToken);

  return `Updated successfully — ${parsed.month}`;
}

// ── PARSER ────────────────────────────────────────────────────────────────────
function parseRota(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Detect month/year from lblMsg
  const lblMsg = doc.getElementById('lblMsg');
  if (!lblMsg) return null;
  const msgText = lblMsg.textContent || '';
  const monthMatch = msgText.match(/Loaded\s+(\w+)\s+(\d{4})/i);
  if (!monthMatch) return null;
  const monthName = monthMatch[1];
  const year = parseInt(monthMatch[2]);
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthNum = MONTH_NAMES.findIndex(m => m.toLowerCase() === monthName.toLowerCase()) + 1;
  if (!monthNum) return null;

  // Parse table rows
  const rows = doc.querySelectorAll('table.grid tr');
  const employees = [];
  const ocData = {};

  rows.forEach(row => {
    const teamCell = row.querySelector('td.teamcol');
    const nameCell = row.querySelector('td.namecol');
    if (!teamCell || !nameCell) return;

    const team = teamCell.textContent.trim();
    const name = nameCell.textContent.trim();

    // ON Call row
    if (name === 'ON Call') {
      const chips = row.querySelectorAll('td:not(.teamcol):not(.namecol)');
      chips.forEach((td, i) => {
        const chip = td.querySelector('.roChip');
        if (chip) ocData[i + 1] = chip.textContent.trim();
      });
      return;
    }

    // Regular employee row
    const empId = nameCell.getAttribute('data-emp') ||
      row.querySelector('[data-emp]')?.getAttribute('data-emp') || name;

    const shifts = {};
    const notes = {};
    const cells = row.querySelectorAll('td:not(.teamcol):not(.namecol)');
    cells.forEach((td, i) => {
      const day = i + 1;
      const roCell = td.querySelector('.roCell');
      if (!roCell) return;
      const code = roCell.textContent.trim();
      if (code && code !== '—') shifts[day] = code;

      const noteStore = td.querySelector('.noteStore');
      if (noteStore && noteStore.value) notes[day] = noteStore.value;

      // also check title attribute
      if (roCell.classList.contains('hasNote') && roCell.title) {
        const noteMatch = roCell.title.match(/^Note:\s*(.+)$/);
        if (noteMatch) notes[day] = noteMatch[1];
      }
    });

    employees.push({ team, name, shifts, notes });
  });

  return { month: monthName, monthNum, year, ocData, employees };
}

// ── PAGE BUILDER ──────────────────────────────────────────────────────────────
function buildPage(parsed) {
  // We embed the fresh data into the existing page template
  // The page fetches its own template from GitHub, patches the data, and saves
  // For simplicity we return a JSON payload that the rota page knows how to apply
  // The actual full page rebuild happens client-side in index.html
  // So we just push a small data file: rota-data.json
  // index.html will fetch rota-data.json on load and merge it in
  return JSON.stringify({
    updatedAt: new Date().toISOString(),
    month: parsed.monthNum,
    year: parsed.year,
    monthName: parsed.month,
    oc: parsed.ocData,
    employees: parsed.employees
  }, null, 2);
}

// ── GITHUB PUSH ───────────────────────────────────────────────────────────────
async function pushToGitHub(content, token) {
  const apiBase = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/rota-data.json`;

  // Get current SHA (needed to update existing file)
  let sha = null;
  try {
    const getResp = await fetch(apiBase, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    if (getResp.ok) {
      const data = await getResp.json();
      sha = data.sha;
    }
  } catch (_) {}

  // Encode content as base64
  const encoded = btoa(unescape(encodeURIComponent(content)));

  const body = {
    message: `Update rota data — ${new Date().toLocaleDateString('en-GB')}`,
    content: encoded,
    branch: GITHUB_BRANCH
  };
  if (sha) body.sha = sha;

  const putResp = await fetch(apiBase, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!putResp.ok) {
    const err = await putResp.json();
    throw new Error(`GitHub push failed: ${err.message}`);
  }
}
