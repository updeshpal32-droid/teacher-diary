/**
 * Official Holiday Master Data for Kendriya Vidyalaya Kutra, Sundargarh, Odisha (2026)
 * As per KVS Regional Office, Bhubaneswar File No. 15038/2/2025/के.वि.सं.(भु)/प्रशा/26654(6) dated 26th Dec 2025.
 */

export interface KvsHolidayItem {
  id: string;
  sn: number;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  nameHindi: string;
  nameEnglish: string;
  type: 'GH' | 'RH-1' | 'RH-2' | 'RH-3' | 'RH-4' | 'RH-5' | 'RH-6' | 'RH-7' | 'Vacation';
  isGazetted: boolean;
  isRestricted: boolean;
  isVacation: boolean;
}

export interface KvsVacationBreak {
  id: string;
  nameHindi: string;
  nameEnglish: string;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  totalDays: number;
}

// 1. Official Gazetted and Restricted Holidays (2026)
export const KV_KUTRA_HOLIDAYS_2026: KvsHolidayItem[] = [
  {
    id: 'hol-2026-01-14',
    sn: 1,
    date: '2026-01-14',
    dayOfWeek: 'Wednesday',
    nameHindi: 'मकर संक्रांति',
    nameEnglish: 'Makar Sankranti',
    type: 'RH-1',
    isGazetted: false,
    isRestricted: true,
    isVacation: false
  },
  {
    id: 'hol-2026-01-23',
    sn: 2,
    date: '2026-01-23',
    dayOfWeek: 'Friday',
    nameHindi: 'बसंत पंचमी',
    nameEnglish: 'Basant Panchami',
    type: 'RH-2',
    isGazetted: false,
    isRestricted: true,
    isVacation: false
  },
  {
    id: 'hol-2026-01-26',
    sn: 3,
    date: '2026-01-26',
    dayOfWeek: 'Monday',
    nameHindi: 'गणतंत्र दिवस',
    nameEnglish: 'Republic Day',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-03-04',
    sn: 4,
    date: '2026-03-04',
    dayOfWeek: 'Wednesday',
    nameHindi: 'होली',
    nameEnglish: 'Holi',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-03-21',
    sn: 5,
    date: '2026-03-21',
    dayOfWeek: 'Saturday',
    nameHindi: 'ईद-उल-फ़ितर',
    nameEnglish: 'Id-ul-Fitr',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-03-31',
    sn: 6,
    date: '2026-03-31',
    dayOfWeek: 'Tuesday',
    nameHindi: 'महावीर जयंती',
    nameEnglish: 'Mahavir Jayanti',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-04-03',
    sn: 7,
    date: '2026-04-03',
    dayOfWeek: 'Friday',
    nameHindi: 'गुड फ्राइडे',
    nameEnglish: 'Good Friday',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-04-14',
    sn: 8,
    date: '2026-04-14',
    dayOfWeek: 'Tuesday',
    nameHindi: 'डॉ. अम्बेडकर जयंती',
    nameEnglish: 'Ambedkar Jayanti',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-05-01',
    sn: 9,
    date: '2026-05-01',
    dayOfWeek: 'Friday',
    nameHindi: 'बुद्ध पूर्णिमा',
    nameEnglish: 'Buddha Purnima',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-05-27',
    sn: 10,
    date: '2026-05-27',
    dayOfWeek: 'Wednesday',
    nameHindi: 'ईद-उल-जुहा (बकरीद)',
    nameEnglish: 'Id-ul-Zuha (Bakrid)',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-06-26',
    sn: 11,
    date: '2026-06-26',
    dayOfWeek: 'Friday',
    nameHindi: 'मुहर्रम',
    nameEnglish: 'Muharram',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-07-16',
    sn: 12,
    date: '2026-07-16',
    dayOfWeek: 'Thursday',
    nameHindi: 'रथ यात्रा',
    nameEnglish: 'Ratha Yatra',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-08-15',
    sn: 13,
    date: '2026-08-15',
    dayOfWeek: 'Saturday',
    nameHindi: 'स्वतंत्रता दिवस',
    nameEnglish: 'Independence Day',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-08-26',
    sn: 14,
    date: '2026-08-26',
    dayOfWeek: 'Wednesday',
    nameHindi: 'ईद-ए-मिलाद',
    nameEnglish: 'Id-e-Milad',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-08-28',
    sn: 15,
    date: '2026-08-28',
    dayOfWeek: 'Friday',
    nameHindi: 'रक्षा बंधन',
    nameEnglish: 'Raksha Bandhan',
    type: 'RH-3',
    isGazetted: false,
    isRestricted: true,
    isVacation: false
  },
  {
    id: 'hol-2026-09-14',
    sn: 16,
    date: '2026-09-14',
    dayOfWeek: 'Monday',
    nameHindi: 'गणेश चतुर्थी',
    nameEnglish: 'Ganesh Chaturthi',
    type: 'RH-4',
    isGazetted: false,
    isRestricted: true,
    isVacation: false
  },
  {
    id: 'hol-2026-10-02',
    sn: 17,
    date: '2026-10-02',
    dayOfWeek: 'Friday',
    nameHindi: 'गांधी जयंती',
    nameEnglish: 'Gandhi Jayanti',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-10-19',
    sn: 18,
    date: '2026-10-19',
    dayOfWeek: 'Monday',
    nameHindi: 'महा नवमी',
    nameEnglish: 'Maha Navami',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-10-20',
    sn: 19,
    date: '2026-10-20',
    dayOfWeek: 'Tuesday',
    nameHindi: 'दशहरा (विजयदशमी)',
    nameEnglish: 'Dussehra',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-11-08',
    sn: 20,
    date: '2026-11-08',
    dayOfWeek: 'Sunday',
    nameHindi: 'दीपावली',
    nameEnglish: 'Diwali',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-11-09',
    sn: 21,
    date: '2026-11-09',
    dayOfWeek: 'Monday',
    nameHindi: 'गोवर्धन पूजा',
    nameEnglish: 'Govardhan Puja',
    type: 'RH-5',
    isGazetted: false,
    isRestricted: true,
    isVacation: false
  },
  {
    id: 'hol-2026-11-24',
    sn: 22,
    date: '2026-11-24',
    dayOfWeek: 'Tuesday',
    nameHindi: 'गुरु नानक जयंती',
    nameEnglish: 'Guru Nanak Jayanti',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  },
  {
    id: 'hol-2026-12-25',
    sn: 23,
    date: '2026-12-25',
    dayOfWeek: 'Friday',
    nameHindi: 'क्रिसमस डे',
    nameEnglish: 'Christmas Day',
    type: 'GH',
    isGazetted: true,
    isRestricted: false,
    isVacation: false
  }
];

// 2. Official Breaks & Vacations (2026-27)
export const KV_KUTRA_VACATIONS_2026: KvsVacationBreak[] = [
  {
    id: 'vac-summer-2026',
    nameHindi: 'ग्रीष्मावकाश (Summer Vacation)',
    nameEnglish: 'Summer Vacation',
    fromDate: '2026-05-03',
    toDate: '2026-06-20',
    totalDays: 49
  },
  {
    id: 'vac-autumn-2026',
    nameHindi: 'शरदकालीन अवकाश (Autumn Break)',
    nameEnglish: 'Autumn Break',
    fromDate: '2026-10-15',
    toDate: '2026-10-24',
    totalDays: 10
  },
  {
    id: 'vac-winter-2026',
    nameHindi: 'शीतकालीन अवकाश (Winter Break)',
    nameEnglish: 'Winter Break',
    fromDate: '2026-12-23',
    toDate: '2027-01-02',
    totalDays: 11
  }
];

// 3. Fast O(1) Pre-computed Lookups
const HOLIDAY_MAP: Map<string, KvsHolidayItem> = new Map();
KV_KUTRA_HOLIDAYS_2026.forEach(h => HOLIDAY_MAP.set(h.date, h));

/**
 * Check if a date falls on a Sunday
 */
export function isSundayDate(dateStr: string): boolean {
  const d = new Date(dateStr);
  return d.getDay() === 0;
}

/**
 * Check if a date falls on a 2nd Saturday (KVS non-instructional day)
 */
export function isSecondSaturday(dateStr: string): boolean {
  const d = new Date(dateStr);
  if (d.getDay() !== 6) return false;
  const dayOfMonth = d.getDate();
  return dayOfMonth >= 8 && dayOfMonth <= 14;
}

/**
 * Check if a date is inside a Vacation / Break range
 */
export function getVacationForDate(dateStr: string): KvsVacationBreak | null {
  for (const vac of KV_KUTRA_VACATIONS_2026) {
    if (dateStr >= vac.fromDate && dateStr <= vac.toDate) {
      return vac;
    }
  }
  return null;
}

/**
 * Get unified Day Type for the Daily Student Attendance Grid
 */
export interface DayStatusResult {
  isHolidayOrOff: boolean;
  badgeLabel: string;
  fullTitle: string;
  colorType: 'sunday' | 'gazetted' | 'restricted' | 'vacation' | 'working';
}

export function getDayStatusInfo(dateStr: string): DayStatusResult {
  // 1. Vacation Check
  const vac = getVacationForDate(dateStr);
  if (vac) {
    return {
      isHolidayOrOff: true,
      badgeLabel: vac.nameEnglish.toUpperCase(),
      fullTitle: `${vac.nameEnglish} (${vac.nameHindi})`,
      colorType: 'vacation'
    };
  }

  // 2. Sunday Check
  if (isSundayDate(dateStr)) {
    return {
      isHolidayOrOff: true,
      badgeLabel: 'SUNDAY',
      fullTitle: 'Sunday (Weekly Off)',
      colorType: 'sunday'
    };
  }

  // 3. 2nd Saturday Check
  if (isSecondSaturday(dateStr)) {
    return {
      isHolidayOrOff: true,
      badgeLabel: 'SECOND SATURDAY',
      fullTitle: 'Second Saturday (Official Off)',
      colorType: 'sunday'
    };
  }

  // 4. Gazetted / Restricted Holiday Check
  const hol = HOLIDAY_MAP.get(dateStr);
  if (hol) {
    return {
      isHolidayOrOff: true,
      badgeLabel: hol.nameEnglish.toUpperCase(),
      fullTitle: `${hol.nameEnglish} (${hol.nameHindi}) - ${hol.type}`,
      colorType: hol.isGazetted ? 'gazetted' : 'restricted'
    };
  }

  // 5. Normal Working Day
  return {
    isHolidayOrOff: false,
    badgeLabel: 'WORKING',
    fullTitle: 'Instructional Day',
    colorType: 'working'
  };
}