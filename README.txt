# Rota Updater — Edge Extension

Updates the UK Rota GitHub Pages site directly from your browser
when you're on the Verifone office network.

---

## One-time setup (takes ~5 minutes)

### Step 1 — Get a GitHub Token

1. Go to: https://github.com/settings/tokens/new
2. Give it a name like "Rota Updater"
3. Set expiry to "No expiration" (or 1 year)
4. Under Scopes, tick **repo**
5. Click "Generate token"
6. Copy the token (starts with `ghp_`) — save it somewhere safe,
   you only see it once

---

### Step 2 — Install the extension in Edge

1. Open Edge and go to: `edge://extensions`
2. Turn on **Developer mode** (toggle, bottom-left)
3. Click **Load unpacked**
4. Select the `rota-extension` folder (this folder)
5. The extension appears — you'll see a small icon in the toolbar

---

### Step 3 — Pin the extension

1. Click the puzzle piece icon (Extensions) in the Edge toolbar
2. Find "Verifone Rota Updater"
3. Click the pin icon so it always shows in your toolbar

---

### Step 4 — Enter your token

1. Click the extension icon in the toolbar
2. Paste your GitHub token into the token field
3. It saves automatically — you only need to do this once

---

## Using it

Whenever you want to update the rota:

1. Make sure you're on the **Verifone office network**
2. Click the extension icon in the Edge toolbar
3. Click **⟳ Update Rota Now**
4. Wait ~5 seconds
5. You'll see "✓ Updated successfully — [Month]"
6. The GitHub Pages site updates within 30 seconds

The rota page at https://mony-vf.github.io/rota/ will show
"✓ Live [date/time]" in the header when running on live data.

---

## Troubleshooting

**"Failed to fetch rota"**
→ You're not on the Verifone office network. Connect to the
  office network or office WiFi and try again.

**"GitHub push failed: Bad credentials"**
→ Your token has expired or is wrong. Generate a new one
  (Step 1 above) and paste it in.

**"Could not parse rota data"**
→ The internal rota page layout may have changed. Let Mony know
  so the parser can be updated.
