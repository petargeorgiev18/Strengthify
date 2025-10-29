//THIS IS THE PASSWORD CHECKER AND ANALYSER MODULE OF THE APPLICATION
export const charSetsInfo = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  digits: /[0-9]/,
  symbols: /[^a-zA-Z0-9]/,
};

export function repeatedSequencePenalty(password) {
  if (!password) return 0;
  const runs = password.match(/(.)\1{2,}/g) || [];
  let repSubs = 0;
  for (let len = 1; len <= Math.min(4, Math.floor(password.length / 2)); len++) {
    const sub = password.slice(0, len);
    const count = (password.match(new RegExp(sub, 'g')) || []).length;
    if (count > 2) repSubs += count - 2;
  }
  return runs.length + repSubs;
}

export function estimateEntropy(password) {
  if (!password) return 0;
  const sets = charSetsInfo;
  let pool = 0;
  if (sets.lowercase.test(password)) pool += 26;
  if (sets.uppercase.test(password)) pool += 26;
  if (sets.digits.test(password)) pool += 10;
  if (sets.symbols.test(password)) pool += 32;
  pool = Math.max(pool, 1);
  const entropy = Math.log2(pool) * password.length;
  return Math.max(0, Math.round(entropy));
}

export function scoreFromEntropyAndSets(password) {
  if (!password) return { score: 0, entropy: 0, setsUsed: 0 };

  const entropy = estimateEntropy(password);
  let setsUsed = 0;
  for (const k in charSetsInfo) {
    if (charSetsInfo[k].test(password)) setsUsed++;
  }

  const len = password.length;
  const lengthScore = Math.min(40, Math.round((len / 20) * 40));
  const varietyScore = Math.round(((Math.max(1, setsUsed) - 1) / 3) * 30);
  const ENTROPY_FULL = 60;
  const entropyScore = Math.min(30, Math.round((entropy / ENTROPY_FULL) * 30));

  const rawPenalty = repeatedSequencePenalty(password);
  const penaltyPoints = Math.min(30, rawPenalty * 5);

  let score = lengthScore + varietyScore + entropyScore - penaltyPoints;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    entropy,
    setsUsed,
    lengthScore,
    varietyScore,
    entropyScore,
    penaltyPoints
  };
}

export function estimateGuessesPerSecond() {
  return 1e10;
}

export function estimateTimeToCrack(password) {
  if (!password) return 'N/A';
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 32;

  const combinations = Math.pow(pool || 1, password.length);
  const seconds = combinations / estimateGuessesPerSecond();

  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} hours`;
  const days = hours / 24;
  if (days < 365) return `${Math.round(days)} days`;
  const years = days / 365;
  if (years < 1e6) return `${Math.round(years)} years`;
  return '>1 million years';
}