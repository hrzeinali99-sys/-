import * as jalaali from 'jalaali-js';

/**
 * Persian (Jalali) Date Helpers
 */

export function toJalaliDate(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  
  const gy = d.getFullYear();
  const gm = d.getMonth() + 1;
  const gd = d.getDate();
  
  const j = jalaali.toJalaali(gy, gm, gd);
  const jm = String(j.jm).padStart(2, '0');
  const jd = String(j.jd).padStart(2, '0');
  return `${j.jy}/${jm}/${jd}`;
}

export function toJalaliDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  
  const jDate = toJalaliDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${jDate} - ${hours}:${minutes}`;
}

export function toJalaliTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function jalaliToGregorianDate(jDateString: string): string | null {
  if (!jDateString || !jDateString.includes('/')) return null;
  const parts = jDateString.trim().split('/');
  if (parts.length !== 3) return null;
  
  const jy = parseInt(parts[0], 10);
  const jm = parseInt(parts[1], 10);
  const jd = parseInt(parts[2], 10);
  
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return null;
  if (jm < 1 || jm > 12 || jd < 1 || jd > 31) return null;
  
  try {
    const g = jalaali.toGregorian(jy, jm, jd);
    const gm = String(g.gm).padStart(2, '0');
    const gd = String(g.gd).padStart(2, '0');
    return `${g.gy}-${gm}-${gd}`;
  } catch (err) {
    return null;
  }
}

export function getCurrentJalaliDate(): string {
  return toJalaliDate(new Date());
}

export function getJalaliMonthName(monthNumber: number): string {
  const months = [
    'فروردین', 'اردیبهشت', 'خرداد',
    'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر',
    'دی', 'بهمن', 'اسفند'
  ];
  return months[monthNumber - 1] || '';
}

export function getJalaliCurrentYear(): number {
  const d = new Date();
  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return j.jy;
}

export function calculateDurationInPersian(startDateStr?: string, endDateStr?: string): string {
  if (!startDateStr) return '-';
  const start = new Date(startDateStr);
  const end = endDateStr ? new Date(endDateStr) : new Date();
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '-';
  
  let diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  if (end.getDate() < start.getDate()) {
    diffMonths--;
  }
  
  if (diffMonths < 0) return '۰ ماه';
  
  const years = Math.floor(diffMonths / 12);
  const months = diffMonths % 12;
  
  if (years === 0 && months === 0) return 'کمتر از ۱ ماه';
  if (years === 0) return `${months} ماه`;
  if (months === 0) return `${years} سال`;
  return `${years} سال و ${months} ماه`;
}

export function calculateAge(birthDateStr?: string): number {
  if (!birthDateStr) return 0;
  // If string contains Jalali slash (e.g. 1370/05/20)
  if (birthDateStr.includes('/')) {
    const gDate = jalaliToGregorianDate(birthDateStr);
    if (gDate) return calculateAge(gDate);
  }
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return 0;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function calculateAgeFromJalali(jalaliDateStr?: string): number {
  if (!jalaliDateStr) return 0;
  const gDate = jalaliToGregorianDate(jalaliDateStr);
  if (gDate) return calculateAge(gDate);
  return calculateAge(jalaliDateStr);
}

export function getJalaliMonthDays(year: number, month: number): number {
  if (month >= 1 && month <= 6) return 31;
  if (month >= 7 && month <= 11) return 30;
  return jalaali.isLeapJalaaliYear(year) ? 30 : 29;
}

export function calculateContractEndDate(startDateJalali: string, durationMonths: number): string {
  if (!startDateJalali || !startDateJalali.includes('/')) return '';
  const parts = startDateJalali.trim().split('/');
  if (parts.length !== 3) return '';
  
  let jy = parseInt(parts[0], 10);
  let jm = parseInt(parts[1], 10);
  let jd = parseInt(parts[2], 10);
  
  if (isNaN(jy) || isNaN(jm) || isNaN(jd)) return '';
  
  // If starting on 1st of month, ending is typically the last day of (startMonth + duration - 1)
  if (jd === 1) {
    let targetMonth = jm + durationMonths - 1;
    while (targetMonth > 12) {
      jy++;
      targetMonth -= 12;
    }
    const lastDay = getJalaliMonthDays(jy, targetMonth);
    const mStr = String(targetMonth).padStart(2, '0');
    const dStr = String(lastDay).padStart(2, '0');
    return `${jy}/${mStr}/${dStr}`;
  }
  
  // Otherwise, add durationMonths and subtract 1 day
  let targetMonth = jm + durationMonths;
  while (targetMonth > 12) {
    jy++;
    targetMonth -= 12;
  }
  
  let targetDay = jd - 1;
  if (targetDay === 0) {
    targetMonth--;
    if (targetMonth === 0) {
      targetMonth = 12;
      jy--;
    }
    targetDay = getJalaliMonthDays(jy, targetMonth);
  } else {
    const maxDays = getJalaliMonthDays(jy, targetMonth);
    if (targetDay > maxDays) targetDay = maxDays;
  }
  
  const mStr = String(targetMonth).padStart(2, '0');
  const dStr = String(targetDay).padStart(2, '0');
  return `${jy}/${mStr}/${dStr}`;
}

