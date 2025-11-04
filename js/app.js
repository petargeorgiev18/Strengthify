import { charSetsInfo, repeatedSequencePenalty, scoreFromEntropyAndSets } from './passwordcheck.js';
import { generatePassword, generatePassphrase } from './generator.js';
import { updateStrengthMeter, updateBreakdown, updateSuggestions, renderTimeEstimate, renderLeakStatus } from './ui.js';
import { estimateTimeToCrack } from './timeEstimate.js';

const pw = document.getElementById('pw');
const toggleShow = document.getElementById('toggleShow');
const copyBtn = document.getElementById('copyBtn');
const genPassBtn = document.getElementById('genPassBtn');
const genPhraseBtn = document.getElementById('genPhraseBtn');
const genLen = document.getElementById('genLen');
const phraseWords = document.getElementById('phraseWords');
const themeSelector = document.getElementById('themeSelector');

let leakTimeout;

async function sha1(password) {
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function checkPasswordLeak(password) {
  if (!password) return false;
  const hash = (await sha1(password)).toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false;
    const text = await res.text();
    return text.split("\n").some(line => line.startsWith(suffix));
  } catch { return false; }
}

async function updateLeakStatus(password) {
  clearTimeout(leakTimeout);
  leakTimeout = setTimeout(async () => {
    const leaked = await checkPasswordLeak(password);
    renderLeakStatus(leaked);
  }, 200);
}

async function updateAll() {
  const val = pw.value || '';
  const scoreObj = scoreFromEntropyAndSets(val);
  updateStrengthMeter(scoreObj);
  updateBreakdown(val, repeatedSequencePenalty, charSetsInfo);
  await updateSuggestions(val, charSetsInfo, scoreObj);
  updateLeakStatus(val);
  renderTimeEstimate(estimateTimeToCrack(val));
}

copyBtn.addEventListener('click', async () => {
  if (!pw.value) { alert('Nothing to copy'); return; }
  try {
    await navigator.clipboard.writeText
    await navigator.clipboard.writeText(pw.value);
    copyBtn.textContent = 'Copied ✓';
    setTimeout(() => copyBtn.textContent = 'Copy', 1200);
  } catch {
    alert('Copy failed.');
  }
});

toggleShow.addEventListener('click', () => {
  if (pw.type === 'password') {
    pw.type = 'text';
    toggleShow.textContent = 'Hide';
  } else {
    pw.type = 'password';
    toggleShow.textContent = 'Show';
  }
});

genPassBtn.addEventListener('click', () => {
  const len = Math.max(6, Math.min(64, Number(genLen.value) || 14));
  pw.value = generatePassword(len);
  updateAll();
});

genPhraseBtn.addEventListener('click', () => {
  const words = Math.max(2, Math.min(8, Number(phraseWords.value) || 4));
  pw.value = generatePassphrase(words);
  updateAll();
});

pw.addEventListener('input', updateAll);
pw.addEventListener('paste', () => setTimeout(updateAll, 0));

function applyTheme(theme) {
  document.body.classList.remove('theme-dark', 'theme-matrix');
  if (theme === 'dark') document.body.classList.add('theme-dark');
  else if (theme === 'matrix') document.body.classList.add('theme-matrix');
}

const savedTheme = localStorage.getItem('theme') || 'light';
themeSelector.value = savedTheme;
applyTheme(savedTheme);

themeSelector.addEventListener('change', () => {
  const val = themeSelector.value;
  applyTheme(val);
  localStorage.setItem('theme', val);
});

window.addEventListener('DOMContentLoaded', () => {
  const globalTheme = localStorage.getItem('theme') || 'light';
  applyTheme(globalTheme);
});

updateAll();