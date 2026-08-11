export function StatusBar() {
  const footer = document.createElement('footer');
  footer.className = 'status-bar';
  footer.innerHTML = `
    <span>Foundation ready</span>
    <span class="status-bar-separator" aria-hidden="true"></span>
    <span>Local runtime</span>
  `;
  return footer;
}
