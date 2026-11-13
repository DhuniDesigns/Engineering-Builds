const $ = (id) => document.getElementById(id);
const MAC = /Mac/.test(navigator.platform || navigator.userAgent);
$('key').textContent = MAC ? '⌥T' : 'Alt+T';
$('v').textContent = chrome.runtime.getManifest().version;
function paint(enabled, saved) {
  $('on').checked = enabled;
  $('state').textContent = enabled ? 'On for claude.ai' : 'Paused';
  document.body.classList.toggle('off', !enabled);
  $('saved').textContent = '~' + Math.round(saved).toLocaleString();
}
chrome.storage.local.get({ enabled: true, saved: 0 }, (v) => paint(v.enabled !== false, +v.saved || 0));
$('on').addEventListener('change', (e) => {
  chrome.storage.local.set({ enabled: e.target.checked });
  chrome.storage.local.get({ saved: 0 }, (v) => paint(e.target.checked, +v.saved || 0));
});
