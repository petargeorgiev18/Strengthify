//THIS IS THE GENERATOR OF RANDOM STRONG PASSWORDS
const chars = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~',
};

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function generatePassword(length = 14) {
  const pools = [chars.lowercase, chars.uppercase, chars.digits, chars.symbols];

  let passwordArray = [
    chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)],
    chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)],
    chars.digits[Math.floor(Math.random() * chars.digits.length)],
    chars.symbols[Math.floor(Math.random() * chars.symbols.length)],
  ];

  for (let i = passwordArray.length; i < length; i++) {
    const poolIndex = Math.floor(Math.random() * pools.length);
    const pool = pools[poolIndex];
    passwordArray.push(pool[Math.floor(Math.random() * pool.length)]);
  }

  return shuffle(passwordArray).join('');
}

const wordList = [
  'apple','river','moon','sun','tree','sky','blue','green','cloud','star',
  'mountain','ocean','forest','wind','fire','earth','light','darkness','dream',
  'STAR','MOON','SUN','SKY','TREE','RIVER','MOUNTAIN','OCEAN','FOREST','DREAM',
  'FIRE','EARTH','LIGHT','DARKNESS','1','2','3','4','5','6','7','8','9','0',
  '&','!','@','#','$','%','^','*'
];

export function generatePassphrase(words = 4) {
  let passphrase = [];
  for (let i = 0; i < words; i++) {
    passphrase.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }
  return passphrase.join('-');
}