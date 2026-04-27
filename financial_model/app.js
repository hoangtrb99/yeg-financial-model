// ============================================================
//  APP ENTRY POINT
// ============================================================

let activeTab = 'cover';

function showTab(name) {
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  activeTab = name;
  renderTab(name);
}

function renderTab(name) {
  const r = compute();
  switch(name) {
    case 'cover':       renderCover(r);       break;
    case 'assumptions': renderAssumptions(r); break;
    case 'is':          renderIS(r);          break;
    case 'bs':          renderBS(r);          break;
    case 'cf':          renderCF(r);          break;
    case 'ratios':      renderRatios(r);      break;
    case 'dcf':         renderDCF(r);         break;
  }
}

function refreshAll() {
  renderTab(activeTab);
}

// Boot
window.addEventListener('DOMContentLoaded', () => {
  showTab('cover');
});
