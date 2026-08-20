/**
 * Smart Natural Language Date & Time Parser for Task Manager
 * Supports common Indian English patterns:
 * - "today", "tonight", "tomorrow", "day after tomorrow"
 * - "next Monday", "this Friday", "coming Sunday", "on Wednesday"
 * - "at 9", "at 9am", "9:30 am", "3pm", "14:00", "by 4pm"
 * - "in 2 days", "next week", "25th Aug", "Aug 25"
 * Zero external dependencies.
 */

export interface ParsedDateResult {
  matchedText: string;
  cleanTitle: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  displayText: string; // e.g. "Tomorrow, 09:00" or "Friday, 15:00"
}

const MONTHS: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3,
  thursday: 4, thu: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6
};

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseSmartDate(rawText: string, baseDate: Date = new Date()): ParsedDateResult | null {
  if (!rawText || !rawText.trim()) return null;

  let text = rawText;
  let targetDate: Date | null = null;
  let targetTime: string = '12:00';
  let matchedSegments: string[] = [];
  let displayDateStr = '';
  let displayTimeStr = '';

  // 1. Check for specific time expressions first:
  // e.g. "at 9:30 am", "at 9am", "at 9", "9:30am", "3pm", "15:00", "by 4pm", "in the morning", "in the evening"
  const timeRegex = /\b(?:at|by)?\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\b|\b(?:at|by)\s*(\d{1,2})(?::(\d{2}))?\b|\b(?:in the\s+)?(morning|afternoon|evening|night|noon)\b/i;
  const timeMatch = text.match(timeRegex);

  if (timeMatch) {
    matchedSegments.push(timeMatch[0]);
    if (timeMatch[3]) {
      // 12-hour format with am/pm
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = timeMatch[3].toLowerCase().replace(/\./g, '');
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      targetTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      displayTimeStr = targetTime;
    } else if (timeMatch[4]) {
      // "at 9" or "at 14:00"
      let hours = parseInt(timeMatch[4], 10);
      const minutes = timeMatch[5] ? parseInt(timeMatch[5], 10) : 0;
      if (hours >= 1 && hours <= 6) hours += 12;
      targetTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      displayTimeStr = targetTime;
    } else if (timeMatch[6]) {
      // Named times of day
      const period = timeMatch[6].toLowerCase();
      if (period === 'morning') targetTime = '09:00';
      else if (period === 'noon') targetTime = '12:00';
      else if (period === 'afternoon') targetTime = '14:00';
      else if (period === 'evening') targetTime = '17:00';
      else if (period === 'night') targetTime = '20:00';
      displayTimeStr = targetTime;
    }
  }

  // 2. Relative day expressions:
  // "day after tomorrow", "tomorrow", "today", "tonight", "yesterday"
  const relativeDayRegex = /\b(?:on\s+)?(day after tomorrow|tomorrow|today|tonight)\b/i;
  const relMatch = text.match(relativeDayRegex);

  if (relMatch) {
    matchedSegments.push(relMatch[0]);
    const term = relMatch[1].toLowerCase();
    const d = new Date(baseDate);
    if (term === 'today') {
      targetDate = d;
      displayDateStr = 'Today';
    } else if (term === 'tonight') {
      targetDate = d;
      if (!displayTimeStr) {
        targetTime = '20:00';
        displayTimeStr = '20:00';
      }
      displayDateStr = 'Tonight';
    } else if (term === 'tomorrow') {
      d.setDate(d.getDate() + 1);
      targetDate = d;
      displayDateStr = 'Tomorrow';
    } else if (term === 'day after tomorrow') {
      d.setDate(d.getDate() + 2);
      targetDate = d;
      displayDateStr = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }

  // 3. Weekday expressions:
  // "next monday", "this friday", "coming wednesday", "on thursday", "friday"
  if (!targetDate) {
    const weekdayRegex = /\b(?:on\s+|by\s+)?(?:(next|this|coming)\s+)?(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thurs|friday|fri|saturday|sat)\b/i;
    const weekdayMatch = text.match(weekdayRegex);

    if (weekdayMatch) {
      matchedSegments.push(weekdayMatch[0]);
      const modifier = weekdayMatch[1] ? weekdayMatch[1].toLowerCase() : '';
      const dayName = weekdayMatch[2].toLowerCase();
      const targetDayIndex = WEEKDAYS[dayName];

      if (targetDayIndex !== undefined) {
        const d = new Date(baseDate);
        const currentDayIndex = d.getDay();
        let daysToAdd = (targetDayIndex - currentDayIndex + 7) % 7;

        if (daysToAdd === 0) {
          if (modifier === 'next') daysToAdd = 7;
        } else if (modifier === 'next' && daysToAdd < 7) {
          daysToAdd += 7;
        }

        d.setDate(d.getDate() + daysToAdd);
        targetDate = d;
        displayDateStr = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      }
    }
  }

  // 4. "Next week" or "in X days"
  if (!targetDate) {
    const inDaysRegex = /\b(?:in\s+(\d+)\s+days?|next\s+week)\b/i;
    const inDaysMatch = text.match(inDaysRegex);

    if (inDaysMatch) {
      matchedSegments.push(inDaysMatch[0]);
      const d = new Date(baseDate);
      if (inDaysMatch[1]) {
        d.setDate(d.getDate() + parseInt(inDaysMatch[1], 10));
      } else {
        d.setDate(d.getDate() + 7);
      }
      targetDate = d;
      displayDateStr = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
    }
  }

  // 5. Month & Date: e.g. "25th Aug", "25 August", "Aug 25", "15th of August"
  if (!targetDate) {
    const monthDateRegex = /\b(?:on\s+)?(?:(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)|(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\s+(\d{1,2})(?:st|nd|rd|th)?)\b/i;
    const monthMatch = text.match(monthDateRegex);

    if (monthMatch) {
      matchedSegments.push(monthMatch[0]);
      let day = 1;
      let monthName = '';

      if (monthMatch[1] && monthMatch[2]) {
        day = parseInt(monthMatch[1], 10);
        monthName = monthMatch[2].toLowerCase();
      } else if (monthMatch[3] && monthMatch[4]) {
        monthName = monthMatch[3].toLowerCase();
        day = parseInt(monthMatch[4], 10);
      }

      const monthIndex = MONTHS[monthName];
      if (monthIndex !== undefined) {
        const d = new Date(baseDate);
        d.setMonth(monthIndex, day);
        if (d < baseDate && d.getMonth() < baseDate.getMonth()) {
          d.setFullYear(d.getFullYear() + 1);
        }
        targetDate = d;
        displayDateStr = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      }
    }
  }

  // If only time was specified with no explicit date, assume Today
  if (!targetDate && displayTimeStr) {
    targetDate = new Date(baseDate);
    displayDateStr = 'Today';
  }

  if (!targetDate) {
    return null;
  }

  // Create clean title with matched date/time phrases removed
  let cleanTitle = rawText;
  for (const seg of matchedSegments) {
    const segEscaped = seg.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleanTitle = cleanTitle.replace(new RegExp(`\\b(?:on|at|by|for)?\\s*${segEscaped}\\b|\\b${segEscaped}\\b`, 'gi'), '');
  }
  // Remove leftover hanging prepositions at end of string e.g. "by", "on", "at"
  cleanTitle = cleanTitle.replace(/\b(?:by|on|at|for)\s*$/i, '');
  cleanTitle = cleanTitle.replace(/\s{2,}/g, ' ').trim();
  if (!cleanTitle) cleanTitle = rawText.trim();

  const formattedDueDate = formatDate(targetDate);
  const displayText = displayTimeStr ? `${displayDateStr}, ${targetTime}` : displayDateStr;

  return {
    matchedText: matchedSegments.join(' '),
    cleanTitle,
    dueDate: formattedDueDate,
    dueTime: targetTime,
    displayText
  };
}
