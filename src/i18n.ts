import { useStore } from './store';

// Arabic is the source language; English is the fallback translation.
const EN: Record<string, string> = {
  'نور': 'Noor',
  'المعلّم الإسلامي الذكي': 'The Smart Islamic Teacher',
  'الرئيسية': 'Home',
  'الطلاب': 'Students',
  'الحضور': 'Attendance',
  'أدوات الصف': 'Class tools',
  'القرآن': 'Quran',
  'الألعاب': 'Games',
  'تعلّم': 'Learn',
  'المكافآت': 'Rewards',
  'لوحة الشرف': 'Leaderboard',
  'التقارير': 'Reports',
  'الإعدادات': 'Settings',
  'صباح الخير': 'Good morning',
  'مساء الخير': 'Good evening',
  'السلام عليكم': 'Assalamu alaikum',
  'معلّمنا': 'Teacher',
  'إضافة طالب': 'Add student',
  'إضافة طلاب': 'Add students',
  'نقاط اليوم': "Today's points",
  'نسبة الحضور': 'Attendance rate',
  'سور محفوظة': 'Surahs memorised',
  'عدد الطلاب': 'Students',
  'آية اليوم': 'Verse of the day',
  'حديث اليوم': 'Hadith of the day',
  'نجم اليوم': 'Star of the day',
  'وصول سريع': 'Quick actions',
  'آخر النشاطات': 'Recent activity',
  'ماكينة الفشار': 'Popcorn machine',
  'اختيار عشوائي': 'Random pick',
  'المؤقّت': 'Timer',
  'مقياس الهدوء': 'Noise meter',
  'المجموعات': 'Groups',
  'إشارات الصف': 'Class signals',
  'انتباه!': 'Attention!',
  'تراجع': 'Undo',
  'حفظ': 'Save',
  'إلغاء': 'Cancel',
  'حذف': 'Delete',
  'تعديل': 'Edit',
  'إغلاق': 'Close',
  'بحث عن طالب...': 'Search student...',
  'تحديد متعدد': 'Multi-select',
  'الصف كاملًا': 'Whole class',
  'تحديد الكل': 'Select all',
  'سلوك إيجابي': 'Positive',
  'يحتاج تحسين': 'Needs work',
  'نقطة': 'pts',
  'حاضر': 'Present',
  'غائب': 'Absent',
  'متأخر': 'Late',
  'بعذر': 'Excused',
  'الكل حاضر': 'All present',
  'تجربة بيانات': 'Demo class',
  'ابدأ الآن': 'Start now',
  'المتجر': 'Store',
  'الأوسمة': 'Badges',
  'الفرق': 'Teams',
  'طباعة': 'Print',
  'تصدير': 'Export',
  'استيراد': 'Import',
  'اللغة': 'Language',
  'الصوت': 'Sound',
  'الوضع الليلي': 'Night mode',
  'الأرقام العربية': 'Arabic digits',
  'الصفوف': 'Classes',
};

export function useT() {
  const lang = useStore((s) => s.settings.lang);
  return (ar: string) => (lang === 'en' ? EN[ar] ?? ar : ar);
}

export function useNum() {
  const ad = useStore((s) => s.settings.arabicDigits && s.settings.lang === 'ar');
  return (n: number | string) => {
    const s = String(n);
    return ad ? s.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]) : s;
  };
}

export function hijriToday(lang: 'ar' | 'en') {
  try {
    return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-SA-u-ca-islamic-umalqura' : 'en-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric',
    }).format(new Date());
  } catch {
    return '';
  }
}

export function gregToday(lang: 'ar' | 'en') {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());
}

export function timeAgo(at: number, lang: 'ar' | 'en') {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });
  const s = Math.round((at - Date.now()) / 1000);
  if (Math.abs(s) < 60) return rtf.format(s, 'second');
  const m = Math.round(s / 60);
  if (Math.abs(m) < 60) return rtf.format(m, 'minute');
  const h = Math.round(m / 60);
  if (Math.abs(h) < 24) return rtf.format(h, 'hour');
  return rtf.format(Math.round(h / 24), 'day');
}
