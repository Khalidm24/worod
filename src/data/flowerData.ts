import { Product, Category, Testimonial } from '../types';

export const CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    key: 'birthday',
    name: 'أعياد ميلاد',
    description: 'ألوان مبهجة وتنسيقات مليئة بالفرح لتشاركهم أجمل اللحظات',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80',
    itemCount: 14,
    badge: 'الأكثر رواجاً'
  },
  {
    id: 'cat-2',
    key: 'wedding',
    name: 'زفاف وخطوبة',
    description: 'أناقة بيضاء كلاسيكية وباقات عرائس وتنسيقات ملكية فاخرة',
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80',
    itemCount: 18,
    badge: 'تصميم خاص'
  },
  {
    id: 'cat-3',
    key: 'anniversary',
    name: 'ذكرى وحب',
    description: 'جوري أحمر مخملي يعبر عن أصدق المشاعر والرومانسية الدافئة',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
    itemCount: 16,
    badge: 'مفضل العشاق'
  },
  {
    id: 'cat-4',
    key: 'get-well',
    name: 'شفاء وتهنئة',
    description: 'أزهار منعشة بألوان التفاؤل والبهجة لسلامتهم وعافيتهم',
    image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=800&q=80',
    itemCount: 12
  },
  {
    id: 'cat-5',
    key: 'newborn',
    name: 'مواليد جدد',
    description: 'درجات الوردي والبيبي بلو الناعمة لاستقبال أغلى القادمين',
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=80',
    itemCount: 10
  },
  {
    id: 'cat-6',
    key: 'vip',
    name: 'باقات فاخرة VIP',
    description: 'فازات كريستال وتنسيقات أوركيد وهولندا النادرة لأصحاب الذوق الرفيع',
    image: 'https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&w=800&q=80',
    itemCount: 8,
    badge: 'حصري'
  }
];

export const PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'باقة همس الياسمين الملكية',
    nameEn: 'Royal Jasmine Whisper Bouquet',
    price: 380,
    originalPrice: 450,
    rating: 4.9,
    reviewsCount: 128,
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=900&q=80',
    category: 'anniversary',
    categoryLabel: 'ذكرى وحب',
    tag: 'الأكثر طلباً',
    description: 'تنسيق فاخر يجمع بين الجوري الإكوادوري الأحمر المخملي وزهور الهايدرنجا الوردية مع لمسات من أوراق الأوكالبتوس العطرية، مغلفة بقماش التول السويسري الأنيق وشريط حريري بلون الزمرد.',
    flowerTypes: [
      '24 وردة جوري إكوادوري نخب أول',
      'زهور الهايدرنجا الهولندية الفاخرة',
      'فروع الكينا وأوراق الأوكالبتوس العطرية',
      'تغليف مزدوج أنيق مع شريط ساتان مخملي'
    ],
    inStock: true,
    isBestseller: true
  },
  {
    id: 'prod-2',
    name: 'باقة الفرح الوردي (بينك بريز)',
    nameEn: 'Pink Breeze Bouquet',
    price: 295,
    originalPrice: 340,
    rating: 4.8,
    reviewsCount: 94,
    image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80',
    category: 'birthday',
    categoryLabel: 'أعياد ميلاد',
    tag: 'خصم 15%',
    description: 'باقة رقيقة تشع حيوية ونضارة، متناغمة بألوان الباستيل الهادئة مع زهور الليليوم الوردية والبيبي روز المنعش، مثالية لإسعاد القلوب في أعياد الميلاد والمناسبات الخاصة.',
    flowerTypes: [
      '18 زهرة بيبي روز باستيل وردي',
      'زهور الليليوم العطرة الناعمة',
      'لمسات من زهور الجيبسوفيلا البيضاء',
      'تغليف كوري مقاوم للماء بدرجات الوردي واللؤلؤي'
    ],
    inStock: true,
    isBestseller: true
  },
  {
    id: 'prod-3',
    name: 'تنسيق عروس النقاء الأبيض',
    nameEn: 'Pure Elegance Bridal Arrangement',
    price: 520,
    originalPrice: 620,
    rating: 5.0,
    reviewsCount: 86,
    image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=900&q=80',
    category: 'wedding',
    categoryLabel: 'زفاف وخطوبة',
    tag: 'تصميم ملكي',
    description: 'رمز الرقي والصفاء؛ تنسيق متقن للعروس والمناسبات الرسمية يمزج الكالا ليلي الأبيض مع أندر زهور التوليب الهولندي وزهور الفاوانيا البيضاء الأخّاذة.',
    flowerTypes: [
      '30 زهرة بيضاء مختارة بعناية فائقة',
      'زهور الكالا وزهور الفاوانيا (Peonies)',
      'سنابل الليمونيوم وحشائش الزينة الفاخرة',
      'مقبض حريري مريح مطرز يدويًا'
    ],
    inStock: true,
    isBestseller: false,
    isNew: true
  },
  {
    id: 'prod-4',
    name: 'فازة النخبة الإمبراطورية (VIP)',
    nameEn: 'Imperial Elite Orchid Vase',
    price: 780,
    originalPrice: 900,
    rating: 4.9,
    reviewsCount: 63,
    image: 'https://images.unsplash.com/photo-1533616688419-b7a585564566?auto=format&fit=crop&w=900&q=80',
    category: 'vip',
    categoryLabel: 'باقات فاخرة VIP',
    tag: 'إصدار فاخر VIP',
    description: 'تحفة بصرية مقدمة في فازة زجاجية إيطالية مضلعة، تضم فروع الأوركيد الفاخرة ناصعة البياض مع ورود استوائية تدوم لأسابيع مع عناية ميسرة.',
    flowerTypes: [
      'فروع أوركيد فالينوبسيس نادرة',
      'أنتوريوم أبيض فاخر ومميز',
      'فازة كريستال إيطالية فاخرة قابلة لإعادة الاستخدام',
      'محلول غذائي خاص لإطالة نضارة الزهور'
    ],
    inStock: true,
    isBestseller: false
  },
  {
    id: 'prod-5',
    name: 'باقة شروق الشمس والبهجة',
    nameEn: 'Golden Sunshine Bouquet',
    price: 245,
    originalPrice: 280,
    rating: 4.7,
    reviewsCount: 79,
    image: 'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?auto=format&fit=crop&w=900&q=80',
    category: 'get-well',
    categoryLabel: 'شفاء وتهنئة',
    tag: 'توصيل سريع',
    description: 'باقة تحمل دفء الشمس وأمنيات الشفاء العاجل والبهجة؛ مزيج رائع من زهور دوار الشمس المشرقة والأقحوان الذهبي مع لمسات لافندر لطيفة.',
    flowerTypes: [
      'زهور عباد الشمس الذهبية الطازجة',
      'أقحوان أصفر وبرتقالي دافئ',
      'أغصان اللافندر العطرية المهدئة',
      'ورق كرافت طبيعي صديق للبيئة'
    ],
    inStock: true
  },
  {
    id: 'prod-6',
    name: 'باقة ملاك الروح (مواليد جدد)',
    nameEn: 'Sweet Angel Newborn Bouquet',
    price: 310,
    rating: 4.9,
    reviewsCount: 52,
    image: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=900&q=80',
    category: 'newborn',
    categoryLabel: 'مواليد جدد',
    tag: 'جديد',
    description: 'تنسيق ناعم مصمم خصيصاً للاحتفال بقدوم المولود الجديد، مع إمكانية إضافة دمية تذكارية صغيرة وشريط أزرق سماوي أو وردي بودري حسب الرغبة.',
    flowerTypes: [
      'زهور الكارنيشن الهولندي الهادئ',
      'بيبي روز بلون الخوخ واللؤلؤ',
      'زهور السوليداجو الرقيقة',
      'بطاقة إهداء مذهبة مطبوعة باسم المولود'
    ],
    inStock: true,
    isNew: true
  },
  {
    id: 'prod-7',
    name: 'صندوق الأناقة المخملي الأسود',
    nameEn: 'Black Velvet Luxury Rose Box',
    price: 490,
    originalPrice: 560,
    rating: 5.0,
    reviewsCount: 110,
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    category: 'anniversary',
    categoryLabel: 'ذكرى وحب',
    tag: 'الأعلى تقييماً',
    description: 'صندوق أسطواني أسود فاخر مكسو بالمخمل الإيطالي، يحوي 36 وردة جوري أحمر داكن منتقاة بدقة هندسية ساحرة تدوم طويلاً وتترك انطباعاً مبهراً.',
    flowerTypes: [
      '36 وردة جوري أحمر مخملي منتقاة يدوياً',
      'صندوق جلدي مخملي فاخر قابل للاحتفاظ',
      'إسفنج ترطيب مائي عالي الجودة',
      'ختم شمعي أصيل على ظرف الإهداء'
    ],
    inStock: true,
    isBestseller: true
  },
  {
    id: 'prod-8',
    name: 'باقة لافندر الحقول الفرنسية',
    nameEn: 'French Fields Lavender Bouquet',
    price: 270,
    originalPrice: 310,
    rating: 4.8,
    reviewsCount: 68,
    image: 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=900&q=80',
    category: 'birthday',
    categoryLabel: 'أعياد ميلاد',
    tag: 'رائحة عطرية',
    description: 'رحلة حسية إلى حقول بروفانس الساحرة؛ باقة زهور طبيعية تمتاز برائحتها العطرية الفواحة التي تملأ الأرجاء سكينة وهدوءاً وسعادة.',
    flowerTypes: [
      'لافندر طبيعي فواح',
      'زهور الليزيانثوس البنفسجية الرقيقة',
      'ستاتيس بيضاء وأغصان الكافور الفضية',
      'تغليف طبيعي راقٍ باللون المشمشي الهادئ'
    ],
    inStock: true
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    name: 'نادية المرابطي',
    city: 'القنيطرة - حي ميموزا (Mimosa)',
    rating: 5,
    comment: 'طلبت باقة همس الياسمين لعيد ميلاد أختي بالقنيطرة، وصلوها في الوقت المحدد والتغليف الملكي كيحمر الوجه! الزهور كانت طرية وفواحة مع بطاقة إهداء مطبوعة بعناية فائقة. أفضل متجر زهور بالقنيطرة.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    date: 'منذ يومين',
    verified: true,
    boughtProduct: 'باقة همس الياسمين الملكية'
  },
  {
    id: 'test-2',
    name: 'المهدي بنجلون',
    city: 'القنيطرة - أولاد أوجيه (Ouled Oujih)',
    rating: 5,
    comment: 'خدمة راقية وسريعة بزاف فالواتساب. طلبت توصيل مفاجئ للزوجة ديالي في حي أولاد أوجيه، وصلات الباقة فريش ومنسقة بطريقة هولندية احترافية والدفع كان عند الاستلام كاش بكل سهولة.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    date: 'منذ 4 أيام',
    verified: true,
    boughtProduct: 'صندوق الأناقة المخملي'
  },
  {
    id: 'test-3',
    name: 'سناء التازي',
    city: 'القنيطرة - لافيل أوت (La Ville Haute)',
    rating: 5,
    comment: 'الجودة ديال الورد عندهم ممتازة، كيبقى طري لأكثر من أسبوعين. التغليف والريحة الزوينة ديال الزهور مع الظرف المختوم بالشمع كيعطي إحساس بالفخامة. شكراً لفريق باقة وورد القنيطرة.',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    date: 'منذ أسبوع',
    verified: true,
    boughtProduct: 'باقة الفرح الوردي'
  },
  {
    id: 'test-4',
    name: 'ياسين العمراني',
    city: 'القنيطرة - المهدية الشاطئ (Mehdia)',
    rating: 5,
    comment: 'التوصيل السريع خلال ساعتين حتى للمهدية كان في المستوى المطلوب! منسق الورد ذوقه رفيع والورد الهولندي يشرفك قدام أي شخص. بالتوفيق ليكم ديما كنوثق فيكم.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    date: 'منذ 10 أيام',
    verified: true,
    boughtProduct: 'فازة النخبة الإمبراطورية'
  }
];

export const TRUST_POINTS = [
  {
    title: 'زهور طبيعية 100% طازجة',
    desc: 'مستوردة ومحفوظة بعناية فائقة لتدوم طازجة وندية',
    icon: 'Flower2'
  },
  {
    title: 'توصيل سريع داخل القنيطرة',
    desc: 'توصيل في أقل من ساعتين لجميع أحياء القنيطرة والمهدية',
    icon: 'Truck'
  },
  {
    title: 'بطاقة إهداء مخصصة ومجانية',
    desc: 'رسالتك مطبوعة بدقة مع ختم شمعي تقليدي فاخر',
    icon: 'MailOpen'
  },
  {
    title: 'دفع مرن وآمن بالمغرب',
    desc: 'الدفع عند الاستلام كاش، أو بالبطاقة البنكية والتحويل الفوري',
    icon: 'ShieldCheck'
  }
];
