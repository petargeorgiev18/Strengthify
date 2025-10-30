//HERE ARE THE UI HELPER FUNCTIONS FOR THE PASSWORD ANALYSER APP
export function updateStrengthMeter({ score }) {
  const meterFill = document.getElementById('meterFill');
  const scoreText = document.getElementById('scoreText');
  const pwInput = document.getElementById('pw');
  pwInput.classList.remove('weak', 'medium', 'strong');
  let level = '', color = '', width = 0;
  if (score < 40) { level = 'Weak'; color = '#e74c3c'; width = 33; pwInput.classList.add('weak'); }
  else if (score < 75) { level = 'Medium'; color = '#f1c40f'; width = 66; pwInput.classList.add('medium'); }
  else { level = 'Strong'; color = '#2ecc71'; width = 100; pwInput.classList.add('strong'); }
  meterFill.style.width = `${width}%`;
  meterFill.style.backgroundColor = color;
  scoreText.textContent = level;
}

export function updateBreakdown(password, repeatedSequencePenalty, charSetsInfo) {
  const breakdownEl = document.getElementById('breakdown');
  const breakdown = [];
  for (const key in charSetsInfo) breakdown.push(`${key}: ${charSetsInfo[key].test(password) ? '✅' : '❌'}`);
  breakdown.push(`Repeated sequences penalty: ${repeatedSequencePenalty(password)}`);
  breakdownEl.innerHTML = '<ul><li>' + breakdown.join('</li><li>') + '</li></ul>';
}

export async function updateSuggestions(password, charSetsInfo, scoreObj) {
  const suggestList = document.getElementById('suggestList');
  const suggestions = [];
  if (!charSetsInfo.uppercase.test(password)) suggestions.push('Add uppercase letters');
  if (!charSetsInfo.lowercase.test(password)) suggestions.push('Add lowercase letters');
  if (!charSetsInfo.digits.test(password)) suggestions.push('Add numbers');
  if (!charSetsInfo.symbols.test(password)) suggestions.push('Add symbols');
  if (password.length < 12) suggestions.push('Make it longer than 12 characters');
  if (scoreObj.entropy < 60) suggestions.push('Avoid common patterns or sequences');
  if (scoreObj.score >= 75 && suggestions.length === 0) suggestions.push('Strong password. No suggestions!');
  suggestList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
}

export function renderTimeEstimate(result) {
  const timeEstimateEl = document.getElementById('timeEstimate');
  if (!result || !result.bits) { timeEstimateEl.textContent = 'Estimated time for cracking: N/A'; return; }
  timeEstimateEl.innerHTML = `<strong>Estimated time (fast GPU):</strong> ${result.label} <br><small>${result.bits} bits entropy</small>`;
}

export function renderLeakStatus(leaked) {
  const el = document.getElementById('leakStatus');
  if (!el) return;
  if (leaked) { el.textContent = "⚠️ This password has appeared in data breaches!"; el.style.color = '#ef4444'; }
  else { el.textContent = "This password has not been found in data breaches."; el.style.color = '#16a34a'; }
}