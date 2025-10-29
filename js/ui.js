//HERE ARE THE UI HELPER FUNCTIONS FOR THE PASSWORD ANALYSER APP
import { estimateTimeToCrack } from './passwordcheck.js';

const meterFill = document.getElementById('meterFill');
const scoreText = document.getElementById('scoreText');
const breakdownEl = document.getElementById('breakdown');
const suggestList = document.getElementById('suggestList');

export function updateStrengthMeter({ score }) {
  meterFill.style.width = score + '%';
  if (score > 70) meterFill.style.backgroundColor = 'var(--good)';
  else if (score > 40) meterFill.style.backgroundColor = 'var(--warn)';
  else meterFill.style.backgroundColor = 'var(--bad)';
  scoreText.textContent = `Strength: ${score}%`;
}

export function updateBreakdown(password, repeatedSequencePenalty, charSetsInfo) {
  const breakdown = [];
  for (const key in charSetsInfo) {
    if (charSetsInfo[key].test(password)) breakdown.push(`${key}: ✅`);
    else breakdown.push(`${key}: ❌`);
  }
  breakdown.push(`Repeated sequences penalty: ${repeatedSequencePenalty(password)}`);
  breakdownEl.innerHTML = '<ul><li>' + breakdown.join('</li><li>') + '</li></ul>';
}

export function updateSuggestions(password, charSetsInfo, scoreObj) {
  const suggestions = [];
  if (!charSetsInfo.uppercase.test(password)) suggestions.push('Add uppercase letters');
  if (!charSetsInfo.lowercase.test(password)) suggestions.push('Add lowercase letters');
  if (!charSetsInfo.digits.test(password)) suggestions.push('Add numbers');
  if (!charSetsInfo.symbols.test(password)) suggestions.push('Add symbols');
  if (password.length < 12) suggestions.push('Make it longer than 12 characters');
  else{
    const element = document.getElementById("suggestList");
    suggestions.splice();
    suggestions.push('Strong password. No suggestions!');
    //element.style.display = "none";
  }
  suggestList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join('');
}

const guessTimeText = document.getElementById('guessTimeText');

export function updateGuessTime(password) {
  const timeStr = estimateTimeToCrack(password);
  guessTimeText.textContent = `Estimated time to crack: ${timeStr}`;
}