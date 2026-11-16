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

// AI rewrite settings
const showKey = (key) => {
  const has = !!key;
  $('savedRow').hidden = !has; $('keyForm').hidden = has;
  $('last4').textContent = has ? key.slice(-4) : '';
  $('aiState').textContent = has ? 'On' : 'Off'; $('aiState').classList.toggle('on', has);
};
chrome.storage.local.get({ apiKey: '', model: 'claude-haiku-5-5' }, (v) => { showKey(v.apiKey); $('model').value = v.model; });
$('keyForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const k = $('apikey').value.trim(), err = $('err');
  if (!/^sk-ant-[\w-]{20,}$/.test(k)) { err.textContent = 'That does not look like an Anthropic API key. It should start with sk-ant-.'; err.hidden = false; return; }
  err.hidden = true; chrome.storage.local.set({ apiKey: k }, () => { $('apikey').value = ''; showKey(k); });
});
$('remove').addEventListener('click', () => chrome.storage.local.remove('apiKey', () => showKey('')));
$('model').addEventListener('change', (e) => chrome.storage.local.set({ model: e.target.value }));
