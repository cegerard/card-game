export const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export function elemBadge(type) {
  return `<span class="elem-badge elem-badge--${esc(type)}">${esc(type)}</span>`;
}
