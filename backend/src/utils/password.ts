import * as crypto from 'crypto';

export function generateTemporaryPassword(length: number = 12): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each category
  const lowercaseMatch = charset.match(/[a-z]/);
  const uppercaseMatch = charset.match(/[A-Z]/);
  const numberMatch = charset.match(/[0-9]/);
  const specialMatch = charset.match(/[!@#$%^&*]/);
  
  if (lowercaseMatch) password += lowercaseMatch[0]; // lowercase
  if (uppercaseMatch) password += uppercaseMatch[0]; // uppercase
  if (numberMatch) password += numberMatch[0]; // number
  if (specialMatch) password += specialMatch[0]; // special char
  
  // Fill the rest randomly
  while (password.length < length) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

export function generatePassword(length = 12): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one of each character type
  const lowercaseMatch = charset.match(/[a-z]/);
  const uppercaseMatch = charset.match(/[A-Z]/);
  const numberMatch = charset.match(/[0-9]/);
  const specialMatch = charset.match(/[!@#$%^&*]/);
  
  if (lowercaseMatch) password += lowercaseMatch[0]; // lowercase
  if (uppercaseMatch) password += uppercaseMatch[0]; // uppercase
  if (numberMatch) password += numberMatch[0]; // number
  if (specialMatch) password += specialMatch[0]; // special char
  
  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  // Shuffle the password characters
  return password.split('').sort(() => Math.random() - 0.5).join('');
} 