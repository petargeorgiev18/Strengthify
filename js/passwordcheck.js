//THIS IS THE PASSWORD CHECKER AND ANALYSER MODULE OF THE APPLICATION
import { estimateEntropyBits } from './timeEstimate.js';

export const charSetsInfo = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  digits: /[0-9]/,
  symbols: /[^a-zA-Z0-9]/,
};

export function repeatedSequencePenalty(password) {
  if (!password) return 0;
  const runs = password.match(/(.)\1{2,}/g) || [];
  return runs.length;
}

export function scoreFromEntropyAndSets(password) {
  password = password.trim();
  if (!password) return { score: 0, entropy: 0, setsUsed: 0 };

  const bits = estimateEntropyBits(password);
  let setsUsed = 0;
  for (const k in charSetsInfo) {
    if (charSetsInfo[k].test(password)) setsUsed++;
  }

  const score = Math.min(100, Math.round((bits / 128) * 100));

  return {
    score,
    entropy: bits,
    setsUsed,
  };
}