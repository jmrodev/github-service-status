import { state, setToken } from './state.js';

export function updateTokenBadgeUI() {
  const badge = document.getElementById('token-badge');
  if (!badge) return;

  if (state.userGitHubToken) {
    badge.className = 'token-status-badge token-active';
    badge.innerHTML = `🔑 Token Configurado ${state.authenticatedUser ? '(@' + state.authenticatedUser + ')' : ''}`;
  } else {
    badge.className = 'token-status-badge token-missing';
    badge.innerHTML = '🔑 Configurar Mi Token';
  }
}

export function openTokenModal() {
  const input = document.getElementById('input-pat-token');
  if (input) input.value = state.userGitHubToken;
  document.getElementById('token-modal')?.classList.add('open');
}

export function closeTokenModal() {
  document.getElementById('token-modal')?.classList.remove('open');
}

export function validateTokenWithGitHub(token, onComplete) {
  fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  })
  .then(res => {
    if (res.ok) return res.json();
    throw new Error('Token inválido o expirado');
  })
  .then(user => {
    state.authenticatedUser = user.login;
    updateTokenBadgeUI();
    if (onComplete) onComplete();
  })
  .catch(err => {
    console.warn('Falló la validación del token personal:', err);
    state.authenticatedUser = null;
    updateTokenBadgeUI();
    if (onComplete) onComplete();
  });
}

export function saveUserToken(onComplete) {
  const inputVal = document.getElementById('input-pat-token')?.value.trim();
  if (!inputVal) {
    alert('Por favor ingresá un token válido.');
    return;
  }
  setToken(inputVal);
  validateTokenWithGitHub(state.userGitHubToken, onComplete);
  closeTokenModal();
}

export function clearUserToken(onRender) {
  setToken('');
  updateTokenBadgeUI();
  closeTokenModal();
  if (onRender) onRender();
}

export function startDeviceFlow(onComplete) {
  const CLIENT_ID = 'Ov23lisDXfhvBkCaiVYF';
  
  const step2 = document.getElementById('oauth-step2');
  const btnStart = document.getElementById('btn-start-oauth');
  const statusText = document.getElementById('oauth-status-text');

  if (btnStart) {
    btnStart.disabled = true;
    btnStart.textContent = '⏳ Generando código...';
  }
  if (statusText) {
    statusText.textContent = 'Conectando con GitHub...';
    statusText.style.color = 'var(--accent)';
  }

  fetch('https://github.com/login/device/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      scope: 'repo read:org'
    })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.device_code) {
      throw new Error(data.error_description || data.error || 'Client ID inválido o Device Flow no activado en la OAuth App');
    }

    if (btnStart) btnStart.style.display = 'none';
    if (step2) step2.style.display = 'flex';
    
    const userCodeEl = document.getElementById('oauth-user-code');
    if (userCodeEl) userCodeEl.textContent = data.user_code;
    
    const verifyLinkEl = document.getElementById('oauth-verify-link');
    if (verifyLinkEl) verifyLinkEl.href = data.verification_uri;

    if (statusText) {
      statusText.textContent = 'Esperando que autorices en GitHub...';
      statusText.style.color = 'var(--badge-pending)';
    }

    const intervalSec = (data.interval || 5) * 1000;
    pollDeviceToken(CLIENT_ID, data.device_code, intervalSec, onComplete);
  })
  .catch(err => {
    if (btnStart) {
      btnStart.disabled = false;
      btnStart.textContent = '🚀 Generar Código de Inicio de Sesión';
    }
    if (statusText) {
      statusText.textContent = '❌ ' + err.message;
      statusText.style.color = '#da3633';
    }
  });
}

function pollDeviceToken(clientId, deviceCode, intervalMs, onComplete) {
  if (state.pollInterval) clearInterval(state.pollInterval);

  state.pollInterval = setInterval(() => {
    fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: clientId,
        device_code: deviceCode,
        grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.access_token) {
        clearInterval(state.pollInterval);
        setToken(data.access_token);
        validateTokenWithGitHub(state.userGitHubToken, onComplete);
        closeTokenModal();
      } else if (data.error === 'authorization_pending' || data.error === 'slow_down') {
        // Continue waiting
      } else {
        clearInterval(state.pollInterval);
        const statusText = document.getElementById('oauth-status-text');
        const btnStart = document.getElementById('btn-start-oauth');
        if (statusText) statusText.textContent = 'Expiró o falló la autorización. Reintentá.';
        if (btnStart) {
          btnStart.style.display = 'inline-block';
          btnStart.disabled = false;
          btnStart.textContent = '🚀 Reintentar Iniciar Sesión';
        }
      }
    })
    .catch(err => console.error('Poll device token error:', err));
  }, intervalMs);
}
