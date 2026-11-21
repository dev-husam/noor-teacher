// ─────────────────────────────────────────────────────────────
// Islamic learning content + classroom defaults (Arabic first)
// ─────────────────────────────────────────────────────────────

export type Surah = { n: number; ar: string; en: string; ayat: number };

// Al-Fatiha + Juz' Amma (the usual memorisation path for children)
export const SURAHS: Surah[] = [
  { n: 1, ar: 'الفاتحة', en: 'Al-Fatiha', ayat: 7 },
  { n: 114, ar: 'الناس', en: 'An-Nas', ayat: 6 },
  { n: 113, ar: 'الفلق', en: 'Al-Falaq', ayat: 5 },
  { n: 112, ar: 'الإخلاص', en: 'Al-Ikhlas', ayat: 4 },
  { n: 111, ar: 'المسد', en: 'Al-Masad', ayat: 5 },
  { n: 110, ar: 'النصر', en: 'An-Nasr', ayat: 3 },
  { n: 109, ar: 'الكافرون', en: 'Al-Kafirun', ayat: 6 },
  { n: 108, ar: 'الكوثر', en: 'Al-Kawthar', ayat: 3 },
  { n: 107, ar: 'الماعون', en: "Al-Ma'un", ayat: 7 },
  { n: 106, ar: 'قريش', en: 'Quraysh', ayat: 4 },
  { n: 105, ar: 'الفيل', en: 'Al-Fil', ayat: 5 },
  { n: 104, ar: 'الهمزة', en: 'Al-Humazah', ayat: 9 },
  { n: 103, ar: 'العصر', en: "Al-'Asr", ayat: 3 },
  { n: 102, ar: 'التكاثر', en: 'At-Takathur', ayat: 8 },
  { n: 101, ar: 'القارعة', en: "Al-Qari'ah", ayat: 11 },
  { n: 100, ar: 'العاديات', en: "Al-'Adiyat", ayat: 11 },
  { n: 99, ar: 'الزلزلة', en: 'Az-Zalzalah', ayat: 8 },
  { n: 98, ar: 'البينة', en: 'Al-Bayyinah', ayat: 8 },
  { n: 97, ar: 'القدر', en: 'Al-Qadr', ayat: 5 },
  { n: 96, ar: 'العلق', en: "Al-'Alaq", ayat: 19 },
  { n: 95, ar: 'التين', en: 'At-Tin', ayat: 8 },
  { n: 94, ar: 'الشرح', en: 'Ash-Sharh', ayat: 8 },
  { n: 93, ar: 'الضحى', en: 'Ad-Duha', ayat: 11 },
  { n: 92, ar: 'الليل', en: 'Al-Layl', ayat: 21 },
  { n: 91, ar: 'الشمس', en: 'Ash-Shams', ayat: 15 },
  { n: 90, ar: 'البلد', en: 'Al-Balad', ayat: 20 },
  { n: 89, ar: 'الفجر', en: 'Al-Fajr', ayat: 30 },
  { n: 88, ar: 'الغاشية', en: 'Al-Ghashiyah', ayat: 26 },
  { n: 87, ar: 'الأعلى', en: "Al-A'la", ayat: 19 },
  { n: 86, ar: 'الطارق', en: 'At-Tariq', ayat: 17 },
  { n: 85, ar: 'البروج', en: 'Al-Buruj', ayat: 22 },
  { n: 84, ar: 'الانشقاق', en: 'Al-Inshiqaq', ayat: 25 },
  { n: 83, ar: 'المطففين', en: 'Al-Mutaffifin', ayat: 36 },
  { n: 82, ar: 'الانفطار', en: 'Al-Infitar', ayat: 19 },
  { n: 81, ar: 'التكوير', en: 'At-Takwir', ayat: 29 },
  { n: 80, ar: 'عبس', en: "'Abasa", ayat: 42 },
  { n: 79, ar: 'النازعات', en: "An-Nazi'at", ayat: 46 },
  { n: 78, ar: 'النبأ', en: 'An-Naba', ayat: 40 },
];

// 0 = not started, 1 = learning, 2 = memorised, 3 = mastered (with tajweed)
export const QURAN_LEVELS = [
  { ar: 'لم يبدأ', en: 'Not started', color: 'var(--q0)', emoji: '⚪' },
  { ar: 'يحفظ الآن', en: 'Learning', color: 'var(--q1)', emoji: '📖' },
  { ar: 'حفظ', en: 'Memorised', color: 'var(--q2)', emoji: '✅' },
  { ar: 'متقن', en: 'Mastered', color: 'var(--q3)', emoji: '🌟' },
];

export type Behavior = { id: string; ar: string; en: string; emoji: string; value: number };

export const DEFAULT_BEHAVIORS: Behavior[] = [
  { id: 'b1', ar: 'مشاركة', en: 'Participation', emoji: '🙋', value: 1 },
  { id: 'b2', ar: 'تلاوة متقنة', en: 'Great recitation', emoji: '📖', value: 2 },
  { id: 'b3', ar: 'تعاون', en: 'Teamwork', emoji: '🤝', value: 1 },
  { id: 'b4', ar: 'أدب وأخلاق', en: 'Good manners', emoji: '😊', value: 1 },
  { id: 'b5', ar: 'نظافة وترتيب', en: 'Tidy & clean', emoji: '🧹', value: 1 },
  { id: 'b6', ar: 'إنجاز الواجب', en: 'Homework done', emoji: '✅', value: 1 },
  { id: 'b7', ar: 'حفظ دعاء', en: 'Learned a dua', emoji: '🤲', value: 2 },
  { id: 'b8', ar: 'اجتهاد', en: 'Hard work', emoji: '💪', value: 1 },
  { id: 'b9', ar: 'مساعدة زميل', en: 'Helped a friend', emoji: '💝', value: 2 },
  { id: 'b10', ar: 'صدق وأمانة', en: 'Honesty', emoji: '🌟', value: 2 },
  { id: 'n1', ar: 'كلام بدون إذن', en: 'Talking out of turn', emoji: '🗣️', value: -1 },
  { id: 'n2', ar: 'تأخّر', en: 'Late', emoji: '⏰', value: -1 },
  { id: 'n3', ar: 'عدم الانتباه', en: 'Not focused', emoji: '😴', value: -1 },
  { id: 'n4', ar: 'إزعاج الزملاء', en: 'Disturbing others', emoji: '😤', value: -1 },
  { id: 'n5', ar: 'لم ينجز الواجب', en: 'No homework', emoji: '📝', value: -1 },
  { id: 'n6', ar: 'سلوك غير لائق', en: 'Inappropriate', emoji: '🚫', value: -2 },
];

export type Reward = { id: string; ar: string; en: string; emoji: string; cost: number };

export const DEFAULT_REWARDS: Reward[] = [
  { id: 'r1', ar: 'قائد الصف ليوم', en: 'Class leader for a day', emoji: '👑', cost: 30 },
  { id: 'r2', ar: 'اختيار القصة', en: 'Choose the story', emoji: '📚', cost: 20 },
  { id: 'r3', ar: 'وقت رسم حر', en: 'Free drawing time', emoji: '🎨', cost: 25 },
  { id: 'r4', ar: 'الجلوس بجانب صديق', en: 'Sit next to a friend', emoji: '🪑', cost: 15 },
  { id: 'r5', ar: 'مساعد المعلم', en: "Teacher's helper", emoji: '🔔', cost: 20 },
  { id: 'r6', ar: 'هدية مفاجأة', en: 'Surprise gift', emoji: '🎁', cost: 50 },
  { id: 'r7', ar: 'ملصق نجمة', en: 'Star sticker', emoji: '⭐', cost: 10 },
  { id: 'r8', ar: 'شهادة تميّز', en: 'Excellence certificate', emoji: '📜', cost: 60 },
];

export const AVATARS = ['🦁', '🐯', '🐼', '🐨', '🦊', '🐰', '🐻', '🐸', '🐵', '🦄', '🐧', '🦉', '🐢', '🐬', '🦋', '🐝', '🐞', '🐳', '🦒', '🐘', '🐪', '🦅', '🐿️', '🦔', '🌻', '🌙', '⭐', '🚀', '⚽', '🍉'];

export const COLORS = ['#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0EA5E9', '#F97316', '#14B8A6', '#EF4444', '#6366F1', '#84CC16', '#D946EF', '#06B6D4'];

// Growth levels: a seed grows into a full moon 🌱 → 🌙
export const LEVELS = [
  { min: 0, ar: 'بذرة', en: 'Seed', emoji: '🌱' },
  { min: 20, ar: 'برعم', en: 'Sprout', emoji: '🌿' },
  { min: 50, ar: 'زهرة', en: 'Flower', emoji: '🌸' },
  { min: 100, ar: 'شجرة', en: 'Tree', emoji: '🌳' },
  { min: 180, ar: 'نخلة', en: 'Palm', emoji: '🌴' },
  { min: 300, ar: 'نجمة', en: 'Star', emoji: '⭐' },
  { min: 500, ar: 'بدر', en: 'Full moon', emoji: '🌕' },
];

export function levelOf(total: number) {
  let i = 0;
  LEVELS.forEach((l, idx) => { if (total >= l.min) i = idx; });
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  const pct = next ? (total - cur.min) / (next.min - cur.min) : 1;
  return { index: i, cur, next, pct: Math.max(0, Math.min(1, pct)) };
}

export const TEAM_PRESETS = [
  { name: 'الصقور', en: 'Falcons', emoji: '🦅', color: '#0EA5E9' },
  { name: 'النخيل', en: 'Palms', emoji: '🌴', color: '#10B981' },
  { name: 'النجوم', en: 'Stars', emoji: '⭐', color: '#F59E0B' },
  { name: 'الأقمار', en: 'Moons', emoji: '🌙', color: '#8B5CF6' },
  { name: 'الأسود', en: 'Lions', emoji: '🦁', color: '#F97316' },
  { name: 'الورود', en: 'Roses', emoji: '🌹', color: '#EC4899' },
];

export const DEMO_NAMES = [
  ['أحمد', 'boy'], ['فاطمة', 'girl'], ['يوسف', 'boy'], ['مريم', 'girl'], ['عمر', 'boy'], ['خديجة', 'girl'],
  ['علي', 'boy'], ['عائشة', 'girl'], ['حمزة', 'boy'], ['زينب', 'girl'], ['إبراهيم', 'boy'], ['سارة', 'girl'],
  ['خالد', 'boy'], ['نور', 'girl'], ['آدم', 'boy'], ['ليان', 'girl'],
] as const;

// ───────── Daily inspiration ─────────
export const VERSES = [
  { text: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', ref: 'طه: ١١٤' },
  { text: 'فَإِنَّ مَعَ الْعُسْرِ يُسْرًا', ref: 'الشرح: ٥' },
  { text: 'وَقُولُوا لِلنَّاسِ حُسْنًا', ref: 'البقرة: ٨٣' },
  { text: 'إِنَّ اللَّهَ يُحِبُّ الْمُحْسِنِينَ', ref: 'البقرة: ١٩٥' },
  { text: 'فَاذْكُرُونِي أَذْكُرْكُمْ', ref: 'البقرة: ١٥٢' },
  { text: 'وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ', ref: 'المائدة: ٢' },
  { text: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ', ref: 'البقرة: ١٥٣' },
];

export const HADITHS = [
  { text: 'إنما الأعمال بالنيات', ref: 'متفق عليه' },
  { text: 'تبسُّمك في وجه أخيك لك صدقة', ref: 'رواه الترمذي' },
  { text: 'خيركم من تعلّم القرآن وعلّمه', ref: 'رواه البخاري' },
  { text: 'الكلمة الطيبة صدقة', ref: 'متفق عليه' },
  { text: 'لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه', ref: 'متفق عليه' },
  { text: 'الطُّهور شطر الإيمان', ref: 'رواه مسلم' },
  { text: 'لا تغضب', ref: 'رواه البخاري' },
];

// ───────── Duas (flip cards) ─────────
export const DUAS = [
  { when: 'قبل الطعام', emoji: '🍽️', color: '#F97316', text: 'بِسْمِ اللَّهِ' },
  { when: 'بعد الطعام', emoji: '😋', color: '#10B981', text: 'الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ' },
  { when: 'قبل النوم', emoji: '🛏️', color: '#6366F1', text: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا' },
  { when: 'عند الاستيقاظ', emoji: '🌅', color: '#F59E0B', text: 'الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ' },
  { when: 'الخروج من المنزل', emoji: '🚪', color: '#0EA5E9', text: 'بِسْمِ اللَّهِ، تَوَكَّلْتُ عَلَى اللَّهِ، وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ' },
  { when: 'دخول المسجد', emoji: '🕌', color: '#14B8A6', text: 'اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ' },
  { when: 'الخروج من المسجد', emoji: '👣', color: '#8B5CF6', text: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ' },
  { when: 'دخول الخلاء', emoji: '🚻', color: '#64748B', text: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْخُبُثِ وَالْخَبَائِثِ' },
  { when: 'الخروج من الخلاء', emoji: '🧼', color: '#06B6D4', text: 'غُفْرَانَكَ' },
  { when: 'لبس الثوب', emoji: '👕', color: '#EC4899', text: 'الْحَمْدُ لِلَّهِ الَّذِي كَسَانِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلَا قُوَّةٍ' },
  { when: 'نزول المطر', emoji: '🌧️', color: '#0284C7', text: 'اللَّهُمَّ صَيِّبًا نَافِعًا' },
  { when: 'عند العطاس', emoji: '🤧', color: '#84CC16', text: 'الْحَمْدُ لِلَّهِ ــ ويُقال له: يَرْحَمُكَ اللَّهُ' },
  { when: 'قبل المذاكرة', emoji: '📚', color: '#D946EF', text: 'رَّبِّ زِدْنِي عِلْمًا' },
  { when: 'ركوب السيارة', emoji: '🚗', color: '#EF4444', text: 'سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ، وَإِنَّا إِلَى رَبِّنَا لَمُنْقَلِبُونَ' },
];

export const NAMES_OF_ALLAH = [
  { name: 'الرَّحْمَٰن', meaning: 'رحمته وسعت كل شيء' },
  { name: 'الرَّحِيم', meaning: 'يرحم عباده المؤمنين' },
  { name: 'الخَالِق', meaning: 'خلق كل شيء من العدم' },
  { name: 'الرَّزَّاق', meaning: 'يرزق كل المخلوقات' },
  { name: 'السَّمِيع', meaning: 'يسمع كل الأصوات' },
  { name: 'البَصِير', meaning: 'يرى كل شيء' },
  { name: 'العَلِيم', meaning: 'يعلم كل شيء' },
  { name: 'الكَرِيم', meaning: 'كثير العطاء والخير' },
  { name: 'الغَفُور', meaning: 'يغفر الذنوب لمن تاب' },
  { name: 'اللَّطِيف', meaning: 'رفيق بعباده' },
  { name: 'الوَدُود', meaning: 'يحب عباده الصالحين' },
  { name: 'الحَفِيظ', meaning: 'يحفظنا ويحمينا' },
  { name: 'السَّلَام', meaning: 'منه السلام والأمان' },
  { name: 'القَوِيّ', meaning: 'لا يعجزه شيء' },
  { name: 'الحَكِيم', meaning: 'يضع كل شيء في مكانه' },
  { name: 'المَلِك', meaning: 'مالك كل شيء' },
];

// ───────── Quiz ─────────
export type Q = { cat: string; q: string; a: string[]; c: number };

export const QUIZ_CATS = [
  { id: 'arkan', ar: 'أركان الإسلام والإيمان', emoji: '🕋', color: '#10B981' },
  { id: 'salah', ar: 'الصلاة والطهارة', emoji: '🧎', color: '#0EA5E9' },
  { id: 'quran', ar: 'القرآن الكريم', emoji: '📖', color: '#8B5CF6' },
  { id: 'anbiya', ar: 'الأنبياء والسيرة', emoji: '🌴', color: '#F59E0B' },
  { id: 'adab', ar: 'الآداب والأخلاق', emoji: '💝', color: '#EC4899' },
];

export const QUIZ: Q[] = [
  { cat: 'arkan', q: 'كم عدد أركان الإسلام؟', a: ['ثلاثة', 'خمسة', 'ستة', 'سبعة'], c: 1 },
  { cat: 'arkan', q: 'ما هو الركن الأول من أركان الإسلام؟', a: ['الصلاة', 'الصوم', 'الشهادتان', 'الحج'], c: 2 },
  { cat: 'arkan', q: 'كم عدد أركان الإيمان؟', a: ['أربعة', 'خمسة', 'ستة', 'ثمانية'], c: 2 },
  { cat: 'arkan', q: 'في أي شهر يصوم المسلمون؟', a: ['شعبان', 'رمضان', 'رجب', 'شوال'], c: 1 },
  { cat: 'arkan', q: 'أين يحج المسلمون؟', a: ['مكة المكرمة', 'المدينة المنورة', 'القدس', 'الطائف'], c: 0 },
  { cat: 'arkan', q: 'ما اسم العيد الذي يأتي بعد رمضان؟', a: ['عيد الأضحى', 'عيد الفطر', 'يوم عرفة', 'يوم الجمعة'], c: 1 },
  { cat: 'arkan', q: 'إلى أين يتجه المسلم في صلاته؟', a: ['المسجد الأقصى', 'الكعبة المشرفة', 'جبل عرفات', 'المسجد النبوي'], c: 1 },
  { cat: 'arkan', q: 'ما اسم الملَك الذي نزل بالوحي؟', a: ['ميكائيل', 'إسرافيل', 'جبريل', 'مالك'], c: 2 },
  { cat: 'salah', q: 'كم عدد الصلوات المفروضة في اليوم؟', a: ['ثلاث', 'أربع', 'خمس', 'ست'], c: 2 },
  { cat: 'salah', q: 'كم عدد ركعات صلاة الفجر؟', a: ['ركعتان', 'ثلاث', 'أربع', 'ركعة'], c: 0 },
  { cat: 'salah', q: 'كم عدد ركعات صلاة المغرب؟', a: ['ركعتان', 'ثلاث', 'أربع', 'خمس'], c: 1 },
  { cat: 'salah', q: 'كم عدد ركعات صلاة الظهر؟', a: ['ركعتان', 'ثلاث', 'أربع', 'ست'], c: 2 },
  { cat: 'salah', q: 'ماذا نفعل قبل الصلاة لنكون طاهرين؟', a: ['نأكل', 'نتوضأ', 'ننام', 'نلعب'], c: 1 },
  { cat: 'salah', q: 'ما أول صلاة في اليوم؟', a: ['الظهر', 'العشاء', 'الفجر', 'العصر'], c: 2 },
  { cat: 'salah', q: 'ما اسم النداء للصلاة؟', a: ['الإقامة', 'الأذان', 'التكبير', 'التسبيح'], c: 1 },
  { cat: 'salah', q: 'ماذا نقول في الركوع؟', a: ['سبحان ربي العظيم', 'سبحان ربي الأعلى', 'الله أكبر', 'سمع الله لمن حمده'], c: 0 },
  { cat: 'salah', q: 'ماذا نقول في السجود؟', a: ['سبحان ربي العظيم', 'سبحان ربي الأعلى', 'ربنا ولك الحمد', 'آمين'], c: 1 },
  { cat: 'salah', q: 'ما أول عمل في الوضوء؟', a: ['غسل الوجه', 'النية والتسمية', 'مسح الرأس', 'غسل الرجلين'], c: 1 },
  { cat: 'quran', q: 'ما أول سورة في القرآن الكريم؟', a: ['البقرة', 'الناس', 'الفاتحة', 'الإخلاص'], c: 2 },
  { cat: 'quran', q: 'ما آخر سورة في القرآن الكريم؟', a: ['الفلق', 'الناس', 'الإخلاص', 'الكوثر'], c: 1 },
  { cat: 'quran', q: 'ما أطول سورة في القرآن؟', a: ['آل عمران', 'النساء', 'البقرة', 'يس'], c: 2 },
  { cat: 'quran', q: 'ما أقصر سورة في القرآن؟', a: ['الكوثر', 'العصر', 'النصر', 'الإخلاص'], c: 0 },
  { cat: 'quran', q: 'كم عدد سور القرآن الكريم؟', a: ['١٠٠', '١١٠', '١١٤', '١٢٠'], c: 2 },
  { cat: 'quran', q: 'كم عدد أجزاء القرآن الكريم؟', a: ['٢٠', '٣٠', '٤٠', '٦٠'], c: 1 },
  { cat: 'quran', q: 'في أي شهر نزل القرآن الكريم؟', a: ['رمضان', 'شوال', 'محرم', 'ذو الحجة'], c: 0 },
  { cat: 'quran', q: 'ما السورة التي تعدل ثلث القرآن؟', a: ['الفاتحة', 'الإخلاص', 'الناس', 'الكافرون'], c: 1 },
  { cat: 'quran', q: 'سورة باسم حيوان كبير:', a: ['الفيل', 'النمل', 'النحل', 'العنكبوت'], c: 0 },
  { cat: 'anbiya', q: 'من هو خاتم الأنبياء والمرسلين؟', a: ['موسى عليه السلام', 'عيسى عليه السلام', 'محمد ﷺ', 'إبراهيم عليه السلام'], c: 2 },
  { cat: 'anbiya', q: 'من هو أول الأنبياء؟', a: ['نوح عليه السلام', 'آدم عليه السلام', 'إدريس عليه السلام', 'شيث عليه السلام'], c: 1 },
  { cat: 'anbiya', q: 'من النبي الذي بنى السفينة؟', a: ['يونس عليه السلام', 'نوح عليه السلام', 'هود عليه السلام', 'صالح عليه السلام'], c: 1 },
  { cat: 'anbiya', q: 'من النبي الذي ابتلعه الحوت؟', a: ['يونس عليه السلام', 'يوسف عليه السلام', 'موسى عليه السلام', 'أيوب عليه السلام'], c: 0 },
  { cat: 'anbiya', q: 'في أي مدينة وُلد النبي محمد ﷺ؟', a: ['المدينة', 'مكة المكرمة', 'الطائف', 'القدس'], c: 1 },
  { cat: 'anbiya', q: 'ما اسم أم النبي محمد ﷺ؟', a: ['خديجة', 'آمنة بنت وهب', 'حليمة', 'فاطمة'], c: 1 },
  { cat: 'anbiya', q: 'من النبي الذي بنى الكعبة مع ابنه إسماعيل؟', a: ['إبراهيم عليه السلام', 'نوح عليه السلام', 'موسى عليه السلام', 'داود عليه السلام'], c: 0 },
  { cat: 'anbiya', q: 'من النبي الذي كلّمه الله تعالى؟', a: ['عيسى عليه السلام', 'موسى عليه السلام', 'يحيى عليه السلام', 'لوط عليه السلام'], c: 1 },
  { cat: 'anbiya', q: 'إلى أي مدينة هاجر النبي ﷺ؟', a: ['الطائف', 'المدينة المنورة', 'الحبشة', 'الشام'], c: 1 },
  { cat: 'adab', q: 'ماذا نقول عندما نلقى أحدًا؟', a: ['مرحبًا فقط', 'السلام عليكم', 'وداعًا', 'لا شيء'], c: 1 },
  { cat: 'adab', q: 'بأي يد نأكل؟', a: ['اليسرى', 'اليمنى', 'كلتاهما', 'لا يهم'], c: 1 },
  { cat: 'adab', q: 'ماذا نقول قبل الأكل؟', a: ['الحمد لله', 'بسم الله', 'سبحان الله', 'الله أكبر'], c: 1 },
  { cat: 'adab', q: 'ماذا نقول بعد العطاس؟', a: ['الحمد لله', 'أستغفر الله', 'بسم الله', 'ما شاء الله'], c: 0 },
  { cat: 'adab', q: 'التبسّم في وجه أخيك:', a: ['صدقة', 'عيب', 'مضيعة للوقت', 'غير مهم'], c: 0 },
  { cat: 'adab', q: 'كيف نتعامل مع والدينا؟', a: ['بالبر والإحسان', 'برفع الصوت', 'بالتجاهل', 'بالعناد'], c: 0 },
  { cat: 'adab', q: 'إذا وجدت شيئًا ليس لك فإنك:', a: ['تأخذه', 'تعيده لصاحبه', 'ترميه', 'تخفيه'], c: 1 },
  { cat: 'adab', q: 'بأي رِجل ندخل المسجد؟', a: ['اليمنى', 'اليسرى', 'كلتاهما معًا', 'لا يهم'], c: 0 },
];

// ───────── Ordering games (drag to sort) ─────────
export const ORDER_GAMES = [
  {
    id: 'wudu', ar: 'رتّب خطوات الوضوء', emoji: '💧', color: '#0EA5E9',
    steps: ['النية والتسمية', 'غسل الكفين', 'المضمضة والاستنشاق', 'غسل الوجه', 'غسل اليدين إلى المرفقين', 'مسح الرأس والأذنين', 'غسل الرجلين إلى الكعبين'],
  },
  {
    id: 'arkan', ar: 'رتّب أركان الإسلام', emoji: '🕋', color: '#10B981',
    steps: ['الشهادتان', 'إقام الصلاة', 'إيتاء الزكاة', 'صوم رمضان', 'حج البيت'],
  },
  {
    id: 'salawat', ar: 'رتّب الصلوات الخمس', emoji: '🕌', color: '#8B5CF6',
    steps: ['الفجر', 'الظهر', 'العصر', 'المغرب', 'العشاء'],
  },
  {
    id: 'muawwidhat', ar: 'رتّب السور من الأقصر للأطول', emoji: '📖', color: '#F59E0B',
    steps: ['الكوثر (٣)', 'الإخلاص (٤)', 'الفلق (٥)', 'الناس (٦)', 'الفاتحة (٧)'],
  },
];

// ───────── Memory pairs ─────────
export const MEMORY_PAIRS = [
  { e: '🕋', w: 'الكعبة' },
  { e: '🕌', w: 'المسجد' },
  { e: '📖', w: 'القرآن' },
  { e: '🌙', w: 'رمضان' },
  { e: '🤲', w: 'الدعاء' },
  { e: '💧', w: 'الوضوء' },
  { e: '🐪', w: 'الهجرة' },
  { e: '🌴', w: 'التمر' },
  { e: '📿', w: 'التسبيح' },
  { e: '🏮', w: 'الفانوس' },
];

// ───────── Class signals ─────────
export const SIGNALS = [
  { id: 'quiet', ar: 'صمت تام', en: 'Silence', emoji: '🤫', color: '#6366F1', sub: 'نستمع بهدوء' },
  { id: 'whisper', ar: 'همس', en: 'Whisper', emoji: '🙊', color: '#0EA5E9', sub: 'صوت منخفض جدًا' },
  { id: 'group', ar: 'عمل جماعي', en: 'Group work', emoji: '👥', color: '#10B981', sub: 'نتعاون بصوت هادئ' },
  { id: 'hand', ar: 'ارفع يدك', en: 'Raise hand', emoji: '✋', color: '#F59E0B', sub: 'قبل أن تتكلم' },
  { id: 'listen', ar: 'انتبهوا', en: 'Eyes on me', emoji: '👀', color: '#EC4899', sub: 'العيون على المعلّم' },
  { id: 'read', ar: 'وقت القراءة', en: 'Reading time', emoji: '📖', color: '#8B5CF6', sub: 'نقرأ ونتدبّر' },
  { id: 'prayer', ar: 'وقت الصلاة', en: 'Prayer time', emoji: '🕌', color: '#14B8A6', sub: 'نتوضأ ونستعد' },
  { id: 'break', ar: 'استراحة', en: 'Break', emoji: '🧃', color: '#F97316', sub: 'نرتاح قليلًا' },
  { id: 'tidy', ar: 'ترتيب الصف', en: 'Tidy up', emoji: '🧹', color: '#84CC16', sub: 'كل شيء في مكانه' },
  { id: 'line', ar: 'الوقوف في الطابور', en: 'Line up', emoji: '🚶', color: '#EF4444', sub: 'بهدوء ونظام' },
];

export const PRAISE = ['ما شاء الله! 🌟', 'بارك الله فيك! 💚', 'أحسنت يا بطل! 🏆', 'رائع جدًا! ✨', 'جزاك الله خيرًا! 🤲', 'تبارك الله! 🌙', 'ممتاز! 🎉'];
