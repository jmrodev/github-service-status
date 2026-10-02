(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))l(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const o of a.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&l(o)}).observe(document,{childList:!0,subtree:!0});function r(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function l(s){if(s.ep)return;s.ep=!0;const a=r(s);fetch(s.href,a)}})();const i={rawData:null,selectedOrg:"all",selectedRepo:"all",userGitHubToken:localStorage.getItem("gh_user_pat")||"",authenticatedUser:null,activeCategoryMap:{},pollInterval:null};function C(e){i.userGitHubToken=e,e?localStorage.setItem("gh_user_pat",e):(localStorage.removeItem("gh_user_pat"),i.authenticatedUser=null)}function $(){const e=document.getElementById("token-badge");e&&(i.userGitHubToken?(e.className="token-status-badge token-active",e.innerHTML=`🔑 Token Configurado ${i.authenticatedUser?"(@"+i.authenticatedUser+")":""}`):(e.className="token-status-badge token-missing",e.innerHTML="🔑 Configurar Mi Token"))}function O(){var n;const e=document.getElementById("input-pat-token");e&&(e.value=i.userGitHubToken),(n=document.getElementById("token-modal"))==null||n.classList.add("open")}function y(){var e;(e=document.getElementById("token-modal"))==null||e.classList.remove("open")}function w(e,n){fetch("https://api.github.com/user",{headers:{Authorization:`Bearer ${e}`,Accept:"application/vnd.github.v3+json"}}).then(r=>{if(r.ok)return r.json();throw new Error("Token inválido o expirado")}).then(r=>{i.authenticatedUser=r.login,$(),n&&n()}).catch(r=>{console.warn("Falló la validación del token personal:",r),i.authenticatedUser=null,$(),n&&n()})}function A(e){var r;const n=(r=document.getElementById("input-pat-token"))==null?void 0:r.value.trim();if(!n){alert("Por favor ingresá un token válido.");return}C(n),w(i.userGitHubToken,e),y()}function M(e){C(""),$(),y(),e&&e()}function x(e){const n="Ov23lisDXfhvBkCaiVYF",r=document.getElementById("oauth-step2"),l=document.getElementById("btn-start-oauth"),s=document.getElementById("oauth-status-text");l&&(l.disabled=!0,l.textContent="⏳ Generando código..."),s&&(s.textContent="Conectando con GitHub...",s.style.color="var(--accent)"),fetch("https://github.com/login/device/code",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},body:new URLSearchParams({client_id:n,scope:"repo read:org"})}).then(a=>a.json()).then(a=>{if(!a.device_code)throw new Error(a.error_description||a.error||"Client ID inválido o Device Flow no activado en la OAuth App");l&&(l.style.display="none"),r&&(r.style.display="flex");const o=document.getElementById("oauth-user-code");o&&(o.textContent=a.user_code);const c=document.getElementById("oauth-verify-link");c&&(c.href=a.verification_uri),s&&(s.textContent="Esperando que autorices en GitHub...",s.style.color="var(--badge-pending)");const h=(a.interval||5)*1e3;B(n,a.device_code,h,e)}).catch(a=>{l&&(l.disabled=!1,l.textContent="🚀 Generar Código de Inicio de Sesión"),s&&(s.textContent="❌ "+a.message,s.style.color="#da3633")})}function B(e,n,r,l){i.pollInterval&&clearInterval(i.pollInterval),i.pollInterval=setInterval(()=>{fetch("https://github.com/login/oauth/access_token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json"},body:new URLSearchParams({client_id:e,device_code:n,grant_type:"urn:ietf:params:oauth:grant-type:device_code"})}).then(s=>s.json()).then(s=>{if(s.access_token)clearInterval(i.pollInterval),C(s.access_token),w(i.userGitHubToken,l),y();else if(!(s.error==="authorization_pending"||s.error==="slow_down")){clearInterval(i.pollInterval);const a=document.getElementById("oauth-status-text"),o=document.getElementById("btn-start-oauth");a&&(a.textContent="Expiró o falló la autorización. Reintentá."),o&&(o.style.display="inline-block",o.disabled=!1,o.textContent="🚀 Reintentar Iniciar Sesión")}}).catch(s=>console.error("Poll device token error:",s))},r)}function p(e){return e?String(e).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):""}function v(e){if(!e)return"";try{const n=new Date(e),r=n.toLocaleDateString(),l=n.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});return`${r} ${l}`}catch{return e}}function L(e){if(!e)return'<span class="badge badge-open">ABIERTO</span>';const n=String(e).toUpperCase();return n==="MERGED"?'<span class="badge badge-merged">FUSIONADO</span>':n==="CLOSED"?'<span class="badge badge-closed">RESUELTO</span>':'<span class="badge badge-open">ABIERTO</span>'}function U(e){const n=document.getElementById("org-filter-row");if(!n||!i.rawData)return;const r=v(i.rawData.generated_at),l=document.getElementById("meta-info");l&&(l.textContent=`Generado: ${r} (${i.rawData.mode||"live"}) · Repos: ${i.rawData.total_repos||i.rawData.repos.length}`);const s=new Set;(i.rawData.repos||[]).forEach(o=>{if(o.repo&&o.repo.includes("/")){const c=o.repo.split("/");s.add(c[0])}});const a=Array.from(s);a.length>0&&(i.selectedOrg=a[0]),n.innerHTML='<span class="filter-label">Organización / Usuario:</span>',a.forEach(o=>{const c=document.createElement("button");c.dataset.org=o,c.className=i.selectedOrg===o?"on":"",c.textContent=o,n.appendChild(c)}),n.querySelectorAll("button").forEach(o=>{o.onclick=()=>{i.selectedOrg=o.dataset.org,n.querySelectorAll("button").forEach(c=>c.classList.toggle("on",c===o)),P(!0),e&&e()}}),P(!0)}function P(e=!1,n){const r=document.getElementById("repo-pills");if(!r||!i.rawData)return;r.innerHTML="";const l=(i.rawData.repos||[]).filter(s=>s.repo.startsWith(i.selectedOrg+"/"));e&&l.length>0&&(i.selectedRepo=l[0].repo),l.forEach(s=>{const a=s.repo.split("/")[1],o=document.createElement("button");o.className="repo-pill "+(i.selectedRepo===s.repo?"on":""),o.textContent=a,o.onclick=()=>{i.selectedRepo=s.repo,r.querySelectorAll(".repo-pill").forEach(c=>c.classList.toggle("on",c===o))},r.appendChild(o)})}function H(e){return!e||!e.length?'<div class="empty-state">Sin commits registrados</div>':e.map(n=>`
    <div class="list-item">
      <a href="${n.html_url||"#"}" target="_blank" rel="noopener"><code>${p(n.sha||"")}</code></a>
      ${n.is_incorporated?'<span class="badge badge-open">INCORPORADO</span>':'<span class="badge badge-pending">PENDIENTE DE MERGE</span>'}
      ${n.author?`<span class="author-tag">@${p(n.author)}</span>`:""}
      <a href="${n.html_url||"#"}" target="_blank" rel="noopener" class="item-title">${p(n.msg||"")}</a>
      ${n.date?`<span class="date-tag">📅 ${v(n.date)}</span>`:""}
    </div>
  `).join("")}function m(){const e=document.getElementById("main-content");if(!e||(e.innerHTML="",!i.rawData||!i.rawData.repos))return;const n=i.rawData.repos.filter(r=>r.repo===i.selectedRepo);if(n.length===0){e.innerHTML='<div class="empty-state">Seleccioná un repositorio en las pastillas superiores.</div>';return}n.forEach(r=>{const l=document.createElement("div");l.className="full-card",l.dataset.repo=r.repo;const s=r.issues||[],a=r.prs||[],o=r.branches&&Array.isArray(r.branches)?r.branches:[],c=r.comments&&Array.isArray(r.comments)?r.comments:[],h=r.commits||[];(!i.activeCategoryMap[r.repo]||i.activeCategoryMap[r.repo]==="all")&&(i.activeCategoryMap[r.repo]="branches");const d=i.activeCategoryMap[r.repo],_=a.length||1,E=Math.round(a.filter(t=>String(t.state).toUpperCase()==="OPEN").length/_*100),f=Math.round(a.filter(t=>String(t.state).toUpperCase()==="MERGED").length/_*100),T=Math.max(0,100-E-f),R=s.length||1,k=Math.round(s.filter(t=>String(t.state).toUpperCase()==="OPEN").length/R*100),I=Math.max(0,100-k),D=o.length||1,b=Math.round(o.filter(t=>t.is_merged).length/D*100),S=Math.max(0,100-b);l.innerHTML=`
      <h2><a href="${r.url}" target="_blank" rel="noopener">${p(r.repo)} ↗</a></h2>
      
      <div class="graphic-dashboard">
        <div class="chart-box">
          <div class="chart-title">
            <span>Pull Requests (${a.length})</span>
            <span>${f}% Fusionados</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-segment segment-merged" style="width: ${f}%" title="${f}% Fusionados"></div>
            <div class="progress-segment segment-open" style="width: ${E}%" title="${E}% Abiertos"></div>
            <div class="progress-segment segment-closed" style="width: ${T}%" title="${T}% Cerrados"></div>
          </div>
          <div class="chart-legend">
            <span><span class="legend-dot" style="background: var(--badge-merged);"></span>Fusionados (${a.filter(t=>String(t.state).toUpperCase()==="MERGED").length})</span>
            <span><span class="legend-dot" style="background: var(--badge-open);"></span>Abiertos (${a.filter(t=>String(t.state).toUpperCase()==="OPEN").length})</span>
            <span><span class="legend-dot" style="background: var(--badge-closed);"></span>Cerrados (${a.filter(t=>String(t.state).toUpperCase()==="CLOSED").length})</span>
          </div>
        </div>

        <div class="chart-box">
          <div class="chart-title">
            <span>Issues (${s.length})</span>
            <span>${I}% Resueltos</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-segment segment-open" style="width: ${I}%" title="${I}% Resueltos"></div>
            <div class="progress-segment segment-closed" style="width: ${k}%" title="${k}% Abiertos"></div>
          </div>
          <div class="chart-legend">
            <span><span class="legend-dot" style="background: var(--badge-open);"></span>Resueltos (${s.filter(t=>String(t.state).toUpperCase()==="CLOSED").length})</span>
            <span><span class="legend-dot" style="background: var(--badge-closed);"></span>Abiertos (${s.filter(t=>String(t.state).toUpperCase()==="OPEN").length})</span>
          </div>
        </div>

        <div class="chart-box">
          <div class="chart-title">
            <span>Ramas (${o.length})</span>
            <span>${b}% Incorporadas</span>
          </div>
          <div class="progress-bar-wrap">
            <div class="progress-segment segment-open" style="width: ${b}%" title="${b}% Incorporadas"></div>
            <div class="progress-segment segment-pending" style="width: ${S}%" title="${S}% Pendientes"></div>
          </div>
          <div class="chart-legend">
            <span><span class="legend-dot" style="background: var(--badge-open);"></span>Incorporadas (${o.filter(t=>t.is_merged).length})</span>
            <span><span class="legend-dot" style="background: var(--badge-pending);"></span>Pendientes (${o.filter(t=>!t.is_merged).length})</span>
          </div>
        </div>
      </div>

      <div class="counters-row">
        <span class="counter-pill ${d==="branches"?"active":""} ${o.length?"has-items":""}" data-cat="branches">Ramas (${o.length})</span>
        <span class="counter-pill ${d==="commits"?"active":""} ${h.length?"has-items":""}" data-cat="commits">Commits (${h.length})</span>
        <span class="counter-pill ${d==="prs"?"active":""} ${a.length?"has-items":""}" data-cat="prs">PRs (${a.length})</span>
        <span class="counter-pill ${d==="comments"?"active":""} ${c.length?"has-items":""}" data-cat="comments">Comentarios (${c.length})</span>
        <span class="counter-pill ${d==="issues"?"active":""} ${s.length?"has-items":""}" data-cat="issues">Issues (${s.length})</span>
      </div>

      <div class="sections-grid">
        <div class="section ${d!=="branches"?"hidden":""}" data-cat-section="branches">
          <div class="section-title">Ramas del Repositorio (${o.length}) — Tocar para ir a la rama en GitHub</div>
          ${o.length?`
            <div class="branches-wrap">
              ${o.map(t=>{let u='<span class="branch-status-badge branch-status-pending">PENDIENTE</span>';t.is_default?u='<span class="branch-status-badge branch-status-default">PRINCIPAL</span>':t.is_merged?u='<span class="branch-status-badge branch-status-merged">INCORPORADA</span>':t.ahead_by>0&&(u=`<span class="branch-status-badge branch-status-pending">+${t.ahead_by} COMMITS</span>`);const g=t.is_merged?"is-merged":"is-pending";return`
                  <a href="${t.url}" target="_blank" rel="noopener" class="branch-card ${g}">
                    <span>🌿 ${p(t.name)} ${t.author?`<span class="branch-author">(@${p(t.author)})</span>`:""}</span>
                    ${u}
                    ${t.date?`<span class="date-tag">📅 ${v(t.date)}</span>`:""} ↗
                  </a>
                `}).join("")}
            </div>
          `:'<div class="empty-state">Sin ramas secundarias</div>'}
        </div>

        <div class="section ${d!=="commits"?"hidden":""}" data-cat-section="commits">
          <div class="section-title">Historial de Commits (${h.length}) — Tocar para ir al commit en GitHub</div>
          <div class="commits-container">
            ${H(h)}
          </div>
        </div>

        <div class="section ${d!=="prs"?"hidden":""}" data-cat-section="prs">
          <div class="section-title">Todos los Pull Requests (${a.length}) — Tocar para abrir el PR en GitHub</div>
          ${a.length?a.map(t=>`
            <div class="list-item">
              ${L(t.state)}
              <a href="${t.url}" target="_blank" rel="noopener" class="item-title">PR #${t.number} — ${p(t.title||"")} ↗</a>
              ${t.createdAt?`<span class="date-tag">📅 ${v(t.createdAt)}</span>`:""}
            </div>
          `).join(""):'<div class="empty-state">Sin pull requests registrados</div>'}
        </div>

        <div class="section ${d!=="comments"?"hidden":""}" data-cat-section="comments">
          <div class="section-title">Todos los Comentarios en PRs (${c.length}) — Tocar para ir al comentario en GitHub</div>
          ${c.length?c.map(t=>`
            <div class="comment-box">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 4px;">
                <a href="${t.html_url||"#"}" target="_blank" rel="noopener">@${p(t.user||"usuario")} ↗</a>
                ${t.created_at?`<span class="date-tag">📅 ${v(t.created_at)}</span>`:""}
              </div>
              <a href="${t.html_url||"#"}" target="_blank" rel="noopener" class="comment-link">"${p(t.body||"")}"</a>
            </div>
          `).join(""):'<div class="empty-state">Sin comentarios registrados</div>'}
        </div>

        <div class="section ${d!=="issues"?"hidden":""}" data-cat-section="issues">
          <div class="section-title">Todos los Issues (${s.length}) — Tocar para abrir el issue en GitHub</div>
          ${s.length?s.map(t=>`
            <div class="list-item">
              ${L(t.state)}
              <a href="${t.url}" target="_blank" rel="noopener" class="item-title">#${t.number} — ${p(t.title||"")} ↗</a>
              ${t.createdAt?`<span class="date-tag">📅 ${v(t.createdAt)}</span>`:""}
            </div>
          `).join(""):'<div class="empty-state">Sin issues registrados</div>'}
        </div>
      </div>
    `,l.querySelectorAll(".counter-pill").forEach(t=>{t.addEventListener("click",()=>{const u=t.dataset.cat;u&&(i.activeCategoryMap[r.repo]=u,l.querySelectorAll(".counter-pill").forEach(g=>g.classList.toggle("active",g===t)),l.querySelectorAll("[data-cat-section]").forEach(g=>{g.dataset.catSection===u?g.classList.remove("hidden"):g.classList.add("hidden")}))})}),e.appendChild(l)})}async function N(e,n={},r){return window.__TAURI_INTERNALS__.invoke(e,n,r)}async function G(e,n){await N("plugin:opener|open_url",{url:e,with:n})}document.addEventListener("DOMContentLoaded",()=>{var e,n,r,l,s;(e=document.getElementById("token-badge"))==null||e.addEventListener("click",O),(n=document.getElementById("btn-close-modal"))==null||n.addEventListener("click",y),(r=document.getElementById("btn-save-token"))==null||r.addEventListener("click",()=>A(m)),(l=document.getElementById("btn-clear-token"))==null||l.addEventListener("click",()=>M(m)),(s=document.getElementById("btn-start-oauth"))==null||s.addEventListener("click",()=>x(m)),document.addEventListener("click",a=>{const o=a.target.closest("a[href]");if(o&&o.href&&(o.href.startsWith("http://")||o.href.startsWith("https://"))){a.preventDefault();const c=o.href;G(c).catch(()=>{window.open(c,"_blank","noopener,noreferrer")})}}),$(),fetch("./status.json").then(a=>a.json()).then(a=>{i.rawData=a,U(m),m(),i.userGitHubToken&&w(i.userGitHubToken,m)}).catch(a=>{const o=document.getElementById("meta-info");o&&(o.textContent="Error al cargar status.json"),console.error(a)})});
