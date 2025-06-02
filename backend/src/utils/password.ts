import * as crypto from 'crypto';

export function generateTemporaryPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  password += charset.match(/[a-z]/)[0]; // lowercase
  password += charset.match(/[A-Z]/)[0]; // uppercase
  password += charset.match(/[0-9]/)[0]; // number
  password += charset.match(/[!@#$%^&*]/)[0]; // special char
  
  // Fill the rest randomly
  while (password.length < length) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
} 