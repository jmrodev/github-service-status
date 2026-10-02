import { state } from './state.js';
import { formatDateTime, escapeHtml, getBadge } from './utils.js';

export function initFilters(onRender) {
  const orgRow = document.getElementById('org-filter-row');
  if (!orgRow || !state.rawData) return;

  const formattedDate = formatDateTime(state.rawData.generated_at);
  const metaInfo = document.getElementById('meta-info');
  if (metaInfo) {
    metaInfo.textContent = `Generado: ${formattedDate} (${state.rawData.mode || 'live'}) · Repos: ${state.rawData.total_repos || state.rawData.repos.length}`;
  }

  const orgs = new Set();
  (state.rawData.repos || []).forEach(r => {
    if (r.repo && r.repo.includes('/')) {
      const parts = r.repo.split('/');
      orgs.add(parts[0]);
    }
  });

  const orgList = Array.from(orgs);
  if (orgList.length > 0) {
    state.selectedOrg = orgList[0];
  }

  orgRow.innerHTML = '<span class="filter-label">Organización / Usuario:</span>';
  orgList.forEach(org => {
    const btn = document.createElement('button');
    btn.dataset.org = org;
    btn.className = (state.selectedOrg === org ? 'on' : '');
    btn.textContent = org;
    orgRow.appendChild(btn);
  });

  orgRow.querySelectorAll('button').forEach(btn => {
    btn.onclick = () => {
      state.selectedOrg = btn.dataset.org;
      orgRow.querySelectorAll('button').forEach(b => b.classList.toggle('on', b === btn));
      updateRepoPills(true);
      if (onRender) onRender();
    };
  });

  updateRepoPills(true);
}

export function updateRepoPills(resetToFirst = false, onRender) {
  const repoPillsContainer = document.getElementById('repo-pills');
  if (!repoPillsContainer || !state.rawData) return;
  repoPillsContainer.innerHTML = '';

  const availableRepos = (state.rawData.repos || []).filter(r => r.repo.startsWith(state.selectedOrg + '/'));

  if (resetToFirst && availableRepos.length > 0) {
    state.selectedRepo = availableRepos[0].repo;
  }

  availableRepos.forEach(r => {
    const repoName = r.repo.split('/')[1];
    const btn = document.createElement('button');
    btn.className = 'repo-pill ' + (state.selectedRepo === r.repo ? 'on' : '');
    btn.textContent = repoName;
    btn.onclick = () => {
      state.selectedRepo = r.repo;
      repoPillsContainer.querySelectorAll('.repo-pill').forEach(p => p.classList.toggle('on', p === btn));
      if (onRender) onRender();
    };
    repoPillsContainer.appendChild(btn);
  });
}

export function renderCommitsList(commits) {
  if (!commits || !commits.length) {
    return '<div class="empty-state">Sin commits registrados</div>';
  }
  return commits.map(c => `
    <div class="list-item">
      <a href="${c.html_url || '#'}" target="_blank" rel="noopener"><code>${escapeHtml(c.sha || '')}</code></a>
      ${c.is_incorporated ? '<span class="badge badge-open">INCORPORADO</span>' : '<span class="badge badge-pending">PENDIENTE DE MERGE</span>'}
      ${c.author ? `<span class="author-tag">@${escapeHtml(c.author)}</span>` : ''}
      <a href="${c.html_url || '#'}" target="_blank" rel="noopener" class="item-title">${escapeHtml(c.msg || '')}</a>
      ${c.date ? `<span class="date-tag">📅 ${formatDateTime(c.date)}</span>` : ''}
    </div>
  `).join('');
}

export function renderUI() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.innerHTML = '';

  if (!state.rawData || !state.rawData.repos) return;

  const filtered = state.rawData.repos.filter(r => r.repo === state.selectedRepo);

  if (filtered.length === 0) {
    main.innerHTML = '<div class="empty-state">Seleccioná un repositorio en las pastillas superiores.</div>';
    return;
  }

  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'full-card';
    card.dataset.repo = r.repo;

    const issues = (r.issues || []);
    const prs = (r.prs || []);
    const branches = (r.branches && Array.isArray(r.branches)) ? r.branches : [];
    const comments = (r.comments && Array.isArray(r.comments)) ? r.comments : [];
    const commits = (r.commits || []);

    if (!state.activeCategoryMap[r.repo] || state.activeCategoryMap[r.repo] === 'all') {
      state.activeCategoryMap[r.repo] = 'branches';
    }
    const activeCategory = state.activeCategoryMap[r.repo];

    const totalPrs = prs.length || 1;
    const prOpenPct = Math.round(((prs.filter(p => String(p.state).toUpperCase() === 'OPEN').length) / totalPrs) * 100);
    const prMergedPct = Math.round(((prs.filter(p => String(p.state).toUpperCase() === 'MERGED').length) / totalPrs) * 100);
    const prClosedPct = Math.max(0, 100 - prOpenPct - prMergedPct);

    const totalIssues = issues.length || 1;
    const issueOpenPct = Math.round(((issues.filter(i => String(i.state).toUpperCase() === 'OPEN').length) / totalIssues) * 100);
    const issueClosedPct = Math.max(0, 100 - issueOpenPct);

    const totalBranches = branches.length || 1;
    const branchMergedPct = Math.round(((branches.filter(b => b.is_merged).length) / totalBranches) * 100);
    const branchPendingPct = Math.max(0, 100 - branchMergedPct);

    card.innerHTML = `
      <h2><a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(r.repo)} ↗</a></h2>
      
      <div class="graphic-dashboard">
        <div class="chart-box">
          <div class="chart-title">
            <span>Pull Requests (${prs.length})</span>
            <span>${prMergedPct}% Fusionados</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-segment segment-merged" style="width: ${prMergedPct}%" title="${prMergedPct}% Fusionados"></div>
            <div class="progress-segment segment-open" style="width: ${prOpenPct}%" title="${prOpenPct}% Abiertos"></div>
            <div class="progress-segment segment-closed" style="width: ${prClosedPct}%" title="${prClosedPct}% Cerrados"></div>
          </div>
          <div class="chart-legend">
            <span><span class="legend-dot" style="background: var(--badge-merged);"></span>Fusionados (${prs.filter(p => String(p.state).toUpperCase() === 'MERGED').length})</span>
            <span><span class="legend-dot" style="background: var(--badge-open);"></span>Abiertos (${prs.filter(p => String(p.state).toUpperCase() === 'OPEN').length})</span>
            <span><span class="legend-dot" style="background: var(--badge-closed);"></span>Cerrados (${prs.filter(p => String(p.state).toUpperCase() === 'CLOSED').length})</span>
          </div>
        </div>

        <div class="chart-box">
          <div class="chart-title">
            <span>Issues (${issues.length})</span>
            <span>${issueClosedPct}% Resueltos</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-segment segment-open" style="width: ${issueClosedPct}%" title="${issueClosedPct}% Resueltos"></div>
            <div class="progress-segment segment-closed" style="width: ${issueOpenPct}%" title="${issueOpenPct}% Abiertos"></div>
          </div>
          <div class="chart-legend">
            <span><span class="legend-dot" style="background: var(--badge-open);"></span>Resueltos (${issues.filter(i => String(i.state).toUpperCase() === 'CLOSED').length})</span>
            <span><span class="legend-dot" style="background: var(--badge-closed);"></span>Abiertos (${issues.filter(i => String(i.state).toUpperCase() === 'OPEN').length})</span>
          </div>
        </div>

        <div class="chart-box">
          <div class="chart-title">
            <span>Ramas (${branches.length})</span>
            <span>${branchMergedPct}% Incorporadas</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-segment segment-open" style="width: ${branchMergedPct}%" title="${branchMergedPct}% Incorporadas"></div>
            <div class="progress-segment segment-pending" style="width: ${branchPendingPct}%" title="${branchPendingPct}% Pendientes"></div>
          </div>
          <div class="chart-legend">
            <span><span class="legend-dot" style="background: var(--badge-open);"></span>Incorporadas (${branches.filter(b => b.is_merged).length})</span>
            <span><span class="legend-dot" style="background: var(--badge-pending);"></span>Pendientes (${branches.filter(b => !b.is_merged).length})</span>
          </div>
        </div>
      </div>

      <div class="counters-row">
        <span class="counter-pill ${activeCategory === 'branches' ? 'active' : ''} ${branches.length ? 'has-items' : ''}" data-cat="branches">Ramas (${branches.length})</span>
        <span class="counter-pill ${activeCategory === 'commits' ? 'active' : ''} ${commits.length ? 'has-items' : ''}" data-cat="commits">Commits (${commits.length})</span>
        <span class="counter-pill ${activeCategory === 'prs' ? 'active' : ''} ${prs.length ? 'has-items' : ''}" data-cat="prs">PRs (${prs.length})</span>
        <span class="counter-pill ${activeCategory === 'comments' ? 'active' : ''} ${comments.length ? 'has-items' : ''}" data-cat="comments">Comentarios (${comments.length})</span>
        <span class="counter-pill ${activeCategory === 'issues' ? 'active' : ''} ${issues.length ? 'has-items' : ''}" data-cat="issues">Issues (${issues.length})</span>
      </div>

      <div class="sections-grid">
        <div class="section ${activeCategory !== 'branches' ? 'hidden' : ''}" data-cat-section="branches">
          <div class="section-title">Ramas del Repositorio (${branches.length}) — Tocar para ir a la rama en GitHub</div>
          ${branches.length ? `
            <div class="branches-wrap">
              ${branches.map(b => {
                let statusBadge = '<span class="branch-status-badge branch-status-pending">PENDIENTE</span>';
                if (b.is_default) {
                  statusBadge = '<span class="branch-status-badge branch-status-default">PRINCIPAL</span>';
                } else if (b.is_merged) {
                  statusBadge = '<span class="branch-status-badge branch-status-merged">INCORPORADA</span>';
                } else if (b.ahead_by > 0) {
                  statusBadge = `<span class="branch-status-badge branch-status-pending">+${b.ahead_by} COMMITS</span>`;
                }
                
                const branchClass = b.is_merged ? 'is-merged' : 'is-pending';

                return `
                  <a href="${b.url}" target="_blank" rel="noopener" class="branch-card ${branchClass}">
                    <span>🌿 ${escapeHtml(b.name)} ${b.author ? `<span class="branch-author">(@${escapeHtml(b.author)})</span>` : ''}</span>
                    ${statusBadge}
                    ${b.date ? `<span class="date-tag">📅 ${formatDateTime(b.date)}</span>` : ''} ↗
                  </a>
                `;
              }).join('')}
            </div>
          ` : '<div class="empty-state">Sin ramas secundarias</div>'}
        </div>

        <div class="section ${activeCategory !== 'commits' ? 'hidden' : ''}" data-cat-section="commits">
          <div class="section-title">Historial de Commits (${commits.length}) — Tocar para ir al commit en GitHub</div>
          <div class="commits-container">
            ${renderCommitsList(commits)}
          </div>
        </div>

        <div class="section ${activeCategory !== 'prs' ? 'hidden' : ''}" data-cat-section="prs">
          <div class="section-title">Todos los Pull Requests (${prs.length}) — Tocar para abrir el PR en GitHub</div>
          ${prs.length ? prs.map(p => `
            <div class="list-item">
              ${getBadge(p.state)}
              <a href="${p.url}" target="_blank" rel="noopener" class="item-title">PR #${p.number} — ${escapeHtml(p.title || '')} ↗</a>
              ${p.createdAt ? `<span class="date-tag">📅 ${formatDateTime(p.createdAt)}</span>` : ''}
            </div>
          `).join('') : '<div class="empty-state">Sin pull requests registrados</div>'}
        </div>

        <div class="section ${activeCategory !== 'comments' ? 'hidden' : ''}" data-cat-section="comments">
          <div class="section-title">Todos los Comentarios en PRs (${comments.length}) — Tocar para ir al comentario en GitHub</div>
          ${comments.length ? comments.map(c => `
            <div class="comment-box">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                <a href="${c.html_url || '#'}" target="_blank" rel="noopener">@${escapeHtml(c.user || 'usuario')} ↗</a>
                ${c.created_at ? `<span class="date-tag">📅 ${formatDateTime(c.created_at)}</span>` : ''}
              </div>
              <a href="${c.html_url || '#'}" target="_blank" rel="noopener" class="comment-link">"${escapeHtml(c.body || '')}"</a>
            </div>
          `).join('') : '<div class="empty-state">Sin comentarios registrados</div>'}
        </div>

        <div class="section ${activeCategory !== 'issues' ? 'hidden' : ''}" data-cat-section="issues">
          <div class="section-title">Todos los Issues (${issues.length}) — Tocar para abrir el issue en GitHub</div>
          ${issues.length ? issues.map(i => `
            <div class="list-item">
              ${getBadge(i.state)}
              <a href="${i.url}" target="_blank" rel="noopener" class="item-title">#${i.number} — ${escapeHtml(i.title || '')} ↗</a>
              ${i.createdAt ? `<span class="date-tag">📅 ${formatDateTime(i.createdAt)}</span>` : ''}
            </div>
          `).join('') : '<div class="empty-state">Sin issues registrados</div>'}
        </div>
      </div>
    `;

    card.querySelectorAll('.counter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const cat = pill.dataset.cat;
        if (!cat) return;

        state.activeCategoryMap[r.repo] = cat;

        card.querySelectorAll('.counter-pill').forEach(p => p.classList.toggle('active', p === pill));

        card.querySelectorAll('[data-cat-section]').forEach(sec => {
          const secCat = sec.dataset.catSection;
          if (secCat === cat) {
            sec.classList.remove('hidden');
          } else {
            sec.classList.add('hidden');
          }
        });
      });
    });

    main.appendChild(card);
  });
}
