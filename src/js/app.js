import { state } from './state.js';
import { updateTokenBadgeUI, openTokenModal, closeTokenModal, saveUserToken, clearUserToken, startDeviceFlow, validateTokenWithGitHub } from './auth.js';
import { initFilters, renderUI } from './render.js';

import { openUrl } from '@tauri-apps/plugin-opener';

document.addEventListener('DOMContentLoaded', () => {
  // Bind UI Events
  document.getElementById('token-badge')?.addEventListener('click', openTokenModal);
  document.getElementById('btn-close-modal')?.addEventListener('click', closeTokenModal);
  document.getElementById('btn-save-token')?.addEventListener('click', () => saveUserToken(renderUI));
  document.getElementById('btn-clear-token')?.addEventListener('click', () => clearUserToken(renderUI));
  document.getElementById('btn-start-oauth')?.addEventListener('click', () => startDeviceFlow(renderUI));

  // Handle external link clicks (works in both desktop Tauri app and browser)
  document.addEventListener('click', async (e) => {
    const anchor = e.target.closest('a[href]');
    if (anchor && anchor.href && (anchor.href.startsWith('http://') || anchor.href.startsWith('https://'))) {
      e.preventDefault();
      try {
        await openUrl(anchor.href);
      } catch (err) {
        window.open(anchor.href, '_blank', 'noopener,noreferrer');
      }
    }
  });

  updateTokenBadgeUI();

  fetch('./status.json')
    .then(res => res.json())
    .then(data => {
      state.rawData = data;
      initFilters(renderUI);
      renderUI();
      if (state.userGitHubToken) {
        validateTokenWithGitHub(state.userGitHubToken, renderUI);
      }
    })
    .catch(err => {
      const meta = document.getElementById('meta-info');
      if (meta) meta.textContent = 'Error al cargar status.json';
      console.error(err);
    });
});
