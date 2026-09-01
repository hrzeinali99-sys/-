/**
 * Iranian National ID, Mobile, IBAN, and Form Validators
 */

/**
 * Validate Iranian National ID (کد ملی)
 * 10 digits with Luhn-like weighted modulus algorithm
 */
export function isValidIranianNationalId(code?: string | null): boolean {
  if (!code) return false;
  const cleaned = code.trim().replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776));
  
  if (!/^\d{10}$/.test(cleaned)) return false;

  // Check if all digits are the same (e.g. 1111111111 is invalid)
  if (/^(\d)\1{9}$/.test(cleaned)) return false;

  const digits = cleaned.split('').map(Number);
  const checkDigit = digits[9];
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += digits[i] * (10 - i);
  }

  const remainder = sum % 11;

  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
}

/**
 * Validate Iranian Mobile Number
 * Starts with 09 and followed by 9 digits
 */
export function isValidIranianMobile(mobile?: string | null): boolean {
  if (!mobile) return false;
  const cleaned = mobile.trim().replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776));
  return /^(0|\+98)?9\d{9}$/.test(cleaned);
}

/**
 * Validate Iranian IBAN (شماره شبا)
 * Format: IR + 24 digits
 */
export function isValidIranianIban(iban?: string | null): boolean {
  if (!iban) return false;
  let cleaned = iban.trim().toUpperCase().replace(/\s+/g, '');
  if (!cleaned.startsWith('IR')) {
    cleaned = 'IR' + cleaned;
  }
  if (!/^IR\d{24}$/.test(cleaned)) return false;

  // ISO 7064 Mod 97-10 check
  // Move 'IR' + 2 check digits to end: 'IR' -> '1827'
  const rearranged = cleaned.substring(4) + '1827' + cleaned.substring(2, 4);
  
  // Large number mod 97 calculation
  let remainder = 0;
  for (let i = 0; i < rearranged.length; i++) {
    remainder = (remainder * 10 + parseInt(rearranged[i], 10)) % 97;
  }
  return remainder === 1;
}

export const isValidIranianIBAN = isValidIranianIban;

/**
 * Validate Iranian Postal Code (کد پستی ۱۰ رقمی)
 */
export function isValidPostalCode(code?: string | null): boolean {
  if (!code) return false;
  const cleaned = code.trim().replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776));
  return /^\d{10}$/.test(cleaned) && !cleaned.includes('00000');
}

/**
 * Validate Card Number (16 digits)
 */
export function isValidBankCard(cardNumber?: string | null): boolean {
  if (!cardNumber) return false;
  const cleaned = cardNumber.trim().replace(/[\s-]+/g, '');
  if (!/^\d{16}$/.test(cleaned)) return false;

  // Standard Luhn algorithm
  let sum = 0;
  for (let i = 0; i < 16; i++) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

/**
 * Mask sensitive bank card number (e.g. 6037 **** **** 1234)
 */
export function maskCardNumber(cardNumber?: string | null): string {
  if (!cardNumber) return '**** **** **** ****';
  const clean = cardNumber.replace(/\s+/g, '');
  if (clean.length < 16) return '**** **** **** ****';
  return `${clean.substring(0, 4)} **** **** ${clean.substring(12)}`;
}

/**
 * Mask sensitive National ID (e.g. 001****345)
 */
export function maskNationalId(nationalId?: string | null): string {
  if (!nationalId || nationalId.length < 10) return '**********';
  return `${nationalId.substring(0, 3)}****${nationalId.substring(7)}`;
}
