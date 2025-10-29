//THIS IS THE GENERATOR OF RANDOM STRONG PASSWORDS
const chars = {
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?/~',
};

export function generatePassword(length = 14) {
  const all = Object.values(chars).join('');
  let pw = '';
  for (let i = 0; i < length; i++) {
    pw += all[Math.floor(Math.random() * all.length)];
  }
  return pw;
}

const wordList = ['apple','river','moon','sun','tree','sky','blue','green','cloud','star',
    'mountain','ocean','forest','wind','fire','earth','light','darkness','dream','1','2','3','4','5','6','7','8','9','0', '&','!','@','#','$','%','^','*',
    'STAR','MOON','SUN','SKY','TREE','RIVER','MOUNTAIN','OCEAN','FOREST','DREAM','FIRE','EARTH','LIGHT','DARKNESS'];

export function generatePassphrase(words = 4) {
  let passphrase = [];
  for (let i = 0; i < words; i++) {
    passphrase.push(wordList[Math.floor(Math.random() * wordList.length)]);
  }
  return passphrase.join('-');
}