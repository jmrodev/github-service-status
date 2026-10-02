# GitHub Service Status

An agnostic, lightweight GitHub service status dashboard designed to provide a unified overview across personal user repositories (e.g. `jmrodev`) and organization projects (e.g. `3roTECDA2026`, `Tecdron`, `tecda-maniqui-factory`) without client-side token exposure or framework build overhead.

---

## 🏛️ Architecture Overview

The system operates in a **dual-mode, decoupled architecture**:

```
 ┌────────────────────────────────────────────────────────┐
 │                   Data Collector                       │
 │  (Python stdlib / gh CLI / GitHub Actions Cron)         │
 └──────────────────────────┬─────────────────────────────┘
                            │ (materializes)
                            ▼
                    ┌──────────────┐
                    │ status.json  │
                    └──────┬───────┘
                           │ (read via fetch)
                           ▼
 ┌────────────────────────────────────────────────────────┐
 │                    Static Dark SPA                     │
 │      (index.html - Zero Dependencies / No Build)       │
 └────────────────────────────────────────────────────────┘
```

1. **Materialized Data View (`status.json`)**:
   - Fetches repository data (`issues`, `pull requests`, `commits`, `branches`) using the official GitHub CLI (`gh`).
   - Generates a static, single-source-of-truth JSON file containing item details and direct links (`url`, `html_url`).

2. **Zero-Build Static Dashboard (`index.html`)**:
   - Pure HTML5 / CSS3 / Vanilla JS single-page application.
   - Dark theme using system fonts and CSS variables (`color-scheme: dark`).
   - Filters repositories by scope (e.g., All, Organizations, Personal/Loose repos).

3. **Dual Execution Modes**:
   - **Local-Live**: Runs generator script locally utilizing local `gh auth` credentials.
   - **GitHub Pages / Actions**: Runs on a scheduled GitHub Actions workflow (cron / `workflow_dispatch`), writing `status.json` and hosting via GitHub Pages without API rate limit hits or CORS issues in the browser.

---

## 📁 Repository Structure

```
.
├── index.html               # Minimalist Dark SPA (Dashboard UI)
├── targets.json             # Target repositories, orgs, and query limits
├── status.json              # Materialized status snapshot (generated)
├── scripts/
│   └── generate-status.py   # Python stdlib data generator using gh CLI
└── .atl/
    └── skill-registry.md    # SDD skill registry index
```

---

## ⚙️ Configuration (`targets.json`)

Configure user profiles, organization lists, test slices, and query caps in `targets.json`:

```json
{
  "users": ["jmrodev"],
  "orgs": ["3roTECDA2026"],
  "testSlice": [
    "3roTECDA2026/edu-track-front",
    "3roTECDA2026/edu-track-back",
    "3roTECDA2026/sababook-front-cont",
    "3roTECDA2026/sababook-back-cont"
  ],
  "limits": {
    "issues": 10,
    "prs": 10,
    "commits": 5,
    "comments": 5,
    "branches": 30
  },
  "projectsOptIn": false
}
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** (standard library only, no `pip` packages required)
- **GitHub CLI (`gh`)** authenticated with read access to the targeted repositories.

### Running the Generator Locally

1. Authenticate GitHub CLI (if not already authenticated):
   ```bash
   gh auth login
   ```

2. Run the status generator:
   ```bash
   python3 scripts/generate-status.py
   ```

3. Open `index.html` in your browser or serve it using any simple static HTTP server:
   ```bash
   python3 -m http.server 8000
   ```
   Navigate to `http://localhost:8000`.

---

## 🛡️ Security & Design Considerations

- **No Client-Side Token Exposure**: The browser never handles GitHub Personal Access Tokens (PATs).
- **Rate Limit Safety**: Materialized JSON generation prevents client-side N+1 query API exhaustion.
- **Direct Deep Linking**: Every issue, PR, commit sha, and branch links directly to its origin URL on GitHub.
