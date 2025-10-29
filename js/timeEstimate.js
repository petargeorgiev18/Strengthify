// js/timeEstimate.js
function humanTime(seconds) {
  if (!isFinite(seconds) || seconds <= 0) return '<1 sec';
  if (seconds < 60) return `${Math.round(seconds)} sec`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)} h`;
  const days = hours / 24;
  if (days < 365) return `${Math.round(days)} days`;
  const years = days / 365;
  if (years < 1e6) return `${Math.round(years)} years`;
  return '>1M years';
}

function countCharSets(s){
  return {
    lower: /[a-z]/.test(s),
    upper: /[A-Z]/.test(s),
    digit: /[0-9]/.test(s),
    symbol: /[^A-Za-z0-9]/.test(s)
  };
}

function repeatedPenalty(s){
  if(!s) return 0;
  const runs = s.match(/(.)\1{2,}/g) || [];
  return runs.length * 2;
}

function seqPenalty(s){
  if(!s) return 0;
  let pen = 0;
  const lower = s.toLowerCase();
  const nums = lower.match(/(?:012|123|234|345|456|567|678|789|987|876|765|654|543|432|321|210)/g) || [];
  pen += nums.length * 3;
  const alphaSeqRegex = /(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|zyx|yxw|xwv|wvu)/g;
  const alphas = lower.match(alphaSeqRegex) || [];
  pen += alphas.length * 3;
  return pen;
}

function commonSubstringPenalty(s){
  if(!s) return 0;
  const commons = ['password','qwerty','1234','123','admin','letmein','qwe','asdf','zxcv','iloveyou','welcome'];
  const lower = s.toLowerCase();
  let pen = 0;
  for(const c of commons){
    if(lower.includes(c)) pen += Math.max(4, Math.floor(c.length));
  }
  return pen;
}

export function estimateEntropyBits(password){
  if(!password) return 0;
  const sets = countCharSets(password);
  let pool = 0;
  if(sets.lower) pool += 26;
  if(sets.upper) pool += 26;
  if(sets.digit) pool += 10;
  if(sets.symbol) pool += 32;
  pool = Math.max(pool, 1);
  const rawBits = Math.log2(pool) * password.length;
  const rep = repeatedPenalty(password);
  const seq = seqPenalty(password);
  const common = commonSubstringPenalty(password);
  const totalPenaltyBits = (rep * 2) + (seq * 2) + (common * 2);
  const bits = Math.max(0, Math.round(rawBits - totalPenaltyBits));
  return bits;
}

export function estimateTimeToCrack(password){
  if(!password) return { label: 'N/A', details: null };
  const bits = estimateEntropyBits(password);
  const expectedGuesses = Math.pow(2, Math.max(0, bits - 1));

  const speeds = {
    'slow (online / throttled)': 1e1,
    'moderate (bcrypt-ish)': 1e3,
    'fast (GPU)': 1e7,
    'very fast (big GPU cluster)': 1e10
  };

  const times = {};
  for(const label in speeds){
    const R = speeds[label];
    const seconds = expectedGuesses / R;
    times[label] = { seconds, human: humanTime(seconds) };
  }

  const headline = times['fast (GPU)'].human;

  return {
    label: headline,
    bits,
    guesses: expectedGuesses,
    times
  };
}