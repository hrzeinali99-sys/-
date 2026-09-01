/**
 * Persian Number & Currency Formatters
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const ENGLISH_DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

export function toPersianDigits(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const str = String(input);
  return str.replace(/\d/g, (d) => PERSIAN_DIGITS[parseInt(d, 10)]);
}

export function toEnglishDigits(input: string | null | undefined): string {
  if (!input) return '';
  return input.replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 1776));
}

export function formatCurrencyToman(amount?: number | null, showUnit: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '۰';
  const formatted = Math.round(amount).toLocaleString('fa-IR');
  return showUnit ? `${formatted} تومان` : formatted;
}

export const formatToman = formatCurrencyToman;

export function formatCurrencyRials(amount?: number | null, showUnit: boolean = true): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '۰';
  const formatted = Math.round(amount).toLocaleString('fa-IR');
  return showUnit ? `${formatted} ریال` : formatted;
}

export const formatRial = formatCurrencyRials;

export function formatNumber(num?: number | null): string {
  if (num === undefined || num === null || isNaN(num)) return '۰';
  return num.toLocaleString('fa-IR');
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '۰ بایت';
  const k = 1024;
  const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${toPersianDigits(val)} ${sizes[i]}`;
}

const ONES = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
const TEENS = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
const TENS = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
const HUNDREDS = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
const SCALES = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

function convertThreeDigitGroup(num: number): string {
  if (num === 0) return '';
  const parts: string[] = [];
  
  const h = Math.floor(num / 100);
  const remainder = num % 100;
  
  if (h > 0) {
    parts.push(HUNDREDS[h]);
  }
  
  if (remainder >= 10 && remainder < 20) {
    parts.push(TEENS[remainder - 10]);
  } else {
    const t = Math.floor(remainder / 10);
    const u = remainder % 10;
    if (t > 0) parts.push(TENS[t]);
    if (u > 0) parts.push(ONES[u]);
  }
  
  return parts.join(' و ');
}

export function numberToPersianWords(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return 'صفر';
  const parsed = typeof num === 'string' ? parseInt(num.replace(/,/g, ''), 10) : Math.round(num);
  if (isNaN(parsed) || parsed === 0) return 'صفر';
  if (parsed < 0) return `منفی ${numberToPersianWords(Math.abs(parsed))}`;
  
  let temp = parsed;
  const groups: number[] = [];
  
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }
  
  const wordParts: string[] = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupVal = groups[i];
    if (groupVal > 0) {
      const groupText = convertThreeDigitGroup(groupVal);
      const scaleText = SCALES[i];
      if (scaleText) {
        wordParts.push(`${groupText} ${scaleText}`);
      } else {
        wordParts.push(groupText);
      }
    }
  }
  
  return wordParts.join(' و ');
}

