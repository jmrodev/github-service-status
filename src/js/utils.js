export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString();
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return `${date} ${time}`;
  } catch (e) {
    return dateStr;
  }
}

export function getBadge(state) {
  if (!state) return '<span class="badge badge-open">ABIERTO</span>';
  const st = String(state).toUpperCase();
  if (st === 'MERGED') return '<span class="badge badge-merged">FUSIONADO</span>';
  if (st === 'CLOSED') return '<span class="badge badge-closed">RESUELTO</span>';
  return '<span class="badge badge-open">ABIERTO</span>';
}
