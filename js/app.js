//THIS IS THE MAIN APP ENTRY POINT AND BUSINESS LOGIC FOR THE PASSWORD ANALYSER
import { charSetsInfo, repeatedSequencePenalty, scoreFromEntropyAndSets } from './passwordcheck.js';
import { generatePassword, generatePassphrase } from './generator.js';
import { updateStrengthMeter, updateBreakdown, updateSuggestions, updateGuessTime } from './ui.js';
import { estimateTimeToCrack } from './timeEstimate.js';

const pw = document.getElementById('pw');
const toggleShow = document.getElementById('toggleShow');
const copyBtn = document.getElementById('copyBtn');

const genPassBtn = document.getElementById('genPassBtn');
const genPhraseBtn = document.getElementById('genPhraseBtn');
const genLen = document.getElementById('genLen');
const phraseWords = document.getElementById('phraseWords');

function updateAll() {
  const val = pw.value || '';
  const scoreObj = scoreFromEntropyAndSets(val);
  updateStrengthMeter(scoreObj);
  updateBreakdown(val, repeatedSequencePenalty, charSetsInfo);
  updateSuggestions(val, charSetsInfo, scoreObj);
  updateGuessTime(val);

  const timeEl = document.getElementById('timeEstimate');
  const result = estimateTimeToCrack(pw.value || '');
  if (!result || !result.bits) {
    timeEl.textContent = 'Estimated time to crack: N/A';
  } else {
    timeEl.innerHTML = `
    <strong>Estimated (fast GPU):</strong> ${result.label}
    <br><small>${result.bits} bits entropy</small>`;
  }
}

copyBtn.addEventListener('click', async () => {
  if (!pw.value) { alert('Nothing to copy'); return; }
  try {
    await navigator.clipboard.writeText(pw.value); copyBtn.textContent = 'Copied ✓';
    setTimeout(() => copyBtn.textContent = 'Copy', 1200);
  } catch { alert('Copy failed.'); }
});

toggleShow.addEventListener('click', () => {
  if (pw.type === 'password') { pw.type = 'text'; toggleShow.textContent = 'Hide'; }
  else { pw.type = 'password'; toggleShow.textContent = 'Show'; }
});

genPassBtn.addEventListener('click', () => {
  const len = Math.max(6, Math.min(64, Number(genLen.value) || 14));
  pw.value = generatePassword(len); updateAll();
});

genPhraseBtn.addEventListener('click', () => {
  const words = Math.max(2, Math.min(8, Number(phraseWords.value) || 4));
  pw.value = generatePassphrase(words); updateAll();
});

pw.addEventListener('input', updateAll);
pw.addEventListener('paste', () => setTimeout(updateAll, 0));

updateAll();