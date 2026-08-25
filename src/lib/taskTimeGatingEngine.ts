import { TeacherTask } from '../types/academic';
import { DEFAULT_PERIOD_TIMINGS } from './storage';

/**
 * Standard KVS default period finishing times fallback (24-hour format HH:mm)
 */
export const DEFAULT_KVS_PERIOD_END_TIMES: Record<number, string> = {
  1: '08:30',
  2: '09:10',
  3: '09:50',
  4: '10:30',
  5: '11:40',
  6: '12:20',
  7: '13:00',
  8: '13:40',
  9: '14:20'
};

/**
 * Normalizes any time string (e.g. "01:40 PM", "1:40PM", "13:40", "08:30 AM", "01:40")
 * to strict 24-hour "HH:mm" format.
 */
export function normalizeTo24HourTime(rawStr?: string | null): string | null {
  if (!rawStr || typeof rawStr !== 'string') return null;
  const match = rawStr.match(/(\d{1,2}):(\d{2})(?:\s*([ap]m))?/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const ampm = match[3]?.toUpperCase();

  // In Indian school daily schedule (07:00 to 18:00):
  // 1. Hours 7, 8, 9, 10, 11 are morning (07:00 - 11:59 AM). Even if a typo says '11:40 PM', in school period context it is 11:40 AM.
  if (h >= 7 && h <= 11) {
    // Remains 07:xx - 11:xx AM
  } else if (h === 12) {
    // 12:xx midday PM
    h = 12;
  } else if (h >= 1 && h <= 6) {
    // 1 PM - 6 PM -> 13:xx - 18:xx
    h += 12;
  } else if (h > 12 && h <= 23) {
    // Already 24-hour (e.g. 13:40)
  }

  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formats a 24-hour HH:mm string to a human-readable 12-hour string with AM/PM.
 * Example: "08:30" -> "8:30 AM", "13:40" -> "1:40 PM"
 */
export function formatTime12h(time24?: string | null): string {
  if (!time24 || !time24.includes(':')) return time24 || '';
  const normalized = normalizeTo24HourTime(time24) || time24;
  const [hStr, mStr] = normalized.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = mStr.substring(0, 2);
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Parses the end time from a period slot string (e.g. "01:00 PM - 01:40 PM" or "08:00 to 08:40" or "13:40").
 * Returns "HH:mm" in strict 24-hour format.
 */
export function parseEndTimeFromSlotString(slotStr?: string | null): string | null {
  if (!slotStr || typeof slotStr !== 'string') return null;
  const cleaned = slotStr.replace(/[–—]/g, '-').trim();

  // If format "07:50 AM - 08:30 AM" or "01:00 PM - 01:40 PM"
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    const endPart = parts[parts.length - 1].trim();
    const result = normalizeTo24HourTime(endPart);
    if (result) return result;
  }

  // If format "08:00 to 08:40"
  if (cleaned.toLowerCase().includes('to')) {
    const parts = cleaned.toLowerCase().split('to');
    const endPart = parts[parts.length - 1].trim();
    const result = normalizeTo24HourTime(endPart);
    if (result) return result;
  }

  return normalizeTo24HourTime(cleaned);
}

/**
 * Extracts period number from task ID, title, or tags (e.g. "p8", "Period 8", "Period-8").
 */
export function extractPeriodNumber(task: TeacherTask): number | null {
  // Check id
  const idMatch = task.id.match(/-p(\d+)/i) || task.id.match(/period[-_]?(\d+)/i);
  if (idMatch && idMatch[1]) return parseInt(idMatch[1], 10);

  // Check title
  const titleMatch = (task.title || '').match(/Period[- ]*(\d+)/i) || (task.title || '').match(/\(Period[- ]*(\d+)\)/i);
  if (titleMatch && titleMatch[1]) return parseInt(titleMatch[1], 10);

  // Check tags
  if (task.tags && Array.isArray(task.tags)) {
    for (const tag of task.tags) {
      const tagMatch = tag.match(/Period[- ]*(\d+)/i);
      if (tagMatch && tagMatch[1]) return parseInt(tagMatch[1], 10);
    }
  }

  return null;
}

/**
 * Calculates the scheduled end / finishing time of a task as an "HH:mm" 24-hour string.
 * Dynamically resolves against the school's active period timings config.
 */
export function getTaskScheduledEndTime(
  task: TeacherTask,
  periodTimings?: Record<number, { time: string; label: string }> | null
): string | null {
  const activeTimings = periodTimings && Object.keys(periodTimings).length > 0 ? periodTimings : DEFAULT_PERIOD_TIMINGS;

  // 1. Teaching Period tasks (Period N)
  const periodNumber = extractPeriodNumber(task);
  if (periodNumber !== null) {
    if (activeTimings && activeTimings[periodNumber]?.time) {
      const parsedEnd = parseEndTimeFromSlotString(activeTimings[periodNumber].time);
      if (parsedEnd) return parsedEnd;
    }

    if (DEFAULT_KVS_PERIOD_END_TIMES[periodNumber]) {
      return DEFAULT_KVS_PERIOD_END_TIMES[periodNumber];
    }
  }

  // 2. Campus Duties (Morning Gate, Recess, Afternoon Gate)
  const titleLower = (task.title || '').toLowerCase();
  const descLower = (task.description || '').toLowerCase();

  // Morning School Assembly & Gate Duty (ends when Period 1 starts)
  if (
    task.id.startsWith('task-gate-morning') ||
    titleLower.includes('morning school assembly') ||
    titleLower.includes('morning gate')
  ) {
    if (activeTimings && activeTimings[1]?.time) {
      const match = activeTimings[1].time.match(/(\d{1,2}):(\d{2})(?:\s*([ap]m))?/i);
      if (match) {
        const p1Start = normalizeTo24HourTime(match[0]);
        if (p1Start) return p1Start;
      }
    }
    return '07:50';
  }

  // Recess Duty (ends when Period 5 starts)
  if (
    task.id.startsWith('task-recess') ||
    titleLower.includes('recess duty') ||
    descLower.includes('lunch-time') ||
    descLower.includes('recess supervision')
  ) {
    if (activeTimings && activeTimings[5]?.time) {
      const match = activeTimings[5].time.match(/(\d{1,2}):(\d{2})(?:\s*([ap]m))?/i);
      if (match) {
        const p5Start = normalizeTo24HourTime(match[0]);
        if (p5Start) return p5Start;
      }
    }
    return '11:00';
  }

  // Afternoon Gate & Dispersal (Period 8 end time + 30 mins dispersal buffer)
  if (
    task.id.startsWith('task-gate-afternoon') ||
    titleLower.includes('afternoon gate') ||
    titleLower.includes('dispersal & bus stand')
  ) {
    if (activeTimings && activeTimings[8]?.time) {
      const p8End = parseEndTimeFromSlotString(activeTimings[8].time);
      if (p8End) {
        const [h, m] = p8End.split(':').map(Number);
        const total = h * 60 + m + 30; // 30 minutes dispersal buffer
        const endH = Math.floor(total / 60) % 24;
        const endM = total % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
    }
    return '14:10';
  }

  // 3. Custom / Timed Tasks with dueTime
  if (task.dueTime) {
    const timeStr = task.dueTime.trim();

    // If timeSlot range like "11:00 - 11:40" or "01:00 PM - 01:40 PM"
    if (timeStr.includes('-') || timeStr.includes('–') || timeStr.toLowerCase().includes('to')) {
      const parsed = parseEndTimeFromSlotString(timeStr);
      if (parsed) return parsed;
    }

    // Single time like "13:40" or "01:40 PM"
    const parsedStart = normalizeTo24HourTime(timeStr);
    if (parsedStart) {
      const [startH, startM] = parsedStart.split(':').map(Number);
      const duration = task.estimatedMinutes && task.estimatedMinutes > 0 ? task.estimatedMinutes : 0;
      if (duration > 0) {
        const totalMinutes = startH * 60 + startM + duration;
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
      return parsedStart;
    }
  }

  return null;
}

export interface TaskTimeRangeDisplay {
  startTime: string;
  endTime: string;
  startTime12h: string;
  endTime12h: string;
  display: string;
}

/**
 * Derives the formatted start time and end time range for any task
 * based on active period timings config or custom task properties.
 */
export function getTaskTimeRangeDisplay(
  task: TeacherTask,
  periodTimings?: Record<number, { time: string; label: string }> | null
): TaskTimeRangeDisplay | null {
  const activeTimings = periodTimings && Object.keys(periodTimings).length > 0 ? periodTimings : DEFAULT_PERIOD_TIMINGS;

  // 1. Teaching Periods
  const periodNumber = extractPeriodNumber(task);
  if (periodNumber !== null) {
    if (activeTimings && activeTimings[periodNumber]?.time) {
      const slotStr = activeTimings[periodNumber].time;
      const cleaned = slotStr.replace(/[–—]/g, '-').trim();
      if (cleaned.includes('-')) {
        const [startPart, endPart] = cleaned.split('-').map(s => s.trim());
        const start24 = normalizeTo24HourTime(startPart);
        const end24 = normalizeTo24HourTime(endPart);
        if (start24 && end24) {
          const s12 = formatTime12h(start24);
          const e12 = formatTime12h(end24);
          return {
            startTime: start24,
            endTime: end24,
            startTime12h: s12,
            endTime12h: e12,
            display: `${s12} – ${e12}`
          };
        }
      }
    }
    if (DEFAULT_KVS_PERIOD_END_TIMES[periodNumber]) {
      const end24 = DEFAULT_KVS_PERIOD_END_TIMES[periodNumber];
      const e12 = formatTime12h(end24);
      return {
        startTime: '',
        endTime: end24,
        startTime12h: '',
        endTime12h: e12,
        display: `Period ${periodNumber} (Finishes ${e12})`
      };
    }
  }

  // 2. Campus Duties
  const titleLower = (task.title || '').toLowerCase();
  const descLower = (task.description || '').toLowerCase();

  // Morning Assembly & Gate (07:15 - Period 1 start)
  if (
    task.id.startsWith('task-gate-morning') ||
    titleLower.includes('morning school assembly') ||
    titleLower.includes('morning gate')
  ) {
    let p1Start = '07:50';
    if (activeTimings && activeTimings[1]?.time) {
      const match = activeTimings[1].time.match(/(\d{1,2}):(\d{2})(?:\s*([ap]m))?/i);
      if (match) {
        const parsed = normalizeTo24HourTime(match[0]);
        if (parsed) p1Start = parsed;
      }
    }
    return {
      startTime: '07:15',
      endTime: p1Start,
      startTime12h: '7:15 AM',
      endTime12h: formatTime12h(p1Start),
      display: `7:15 AM – ${formatTime12h(p1Start)}`
    };
  }

  // Recess (Period 4 end - Period 5 start)
  if (
    task.id.startsWith('task-recess') ||
    titleLower.includes('recess duty') ||
    descLower.includes('lunch-time') ||
    descLower.includes('recess supervision')
  ) {
    let p4End = '10:30';
    let p5Start = '11:00';
    if (activeTimings && activeTimings[4]?.time) {
      const endParsed = parseEndTimeFromSlotString(activeTimings[4].time);
      if (endParsed) p4End = endParsed;
    }
    if (activeTimings && activeTimings[5]?.time) {
      const match = activeTimings[5].time.match(/(\d{1,2}):(\d{2})(?:\s*([ap]m))?/i);
      if (match) {
        const parsed = normalizeTo24HourTime(match[0]);
        if (parsed) p5Start = parsed;
      }
    }
    return {
      startTime: p4End,
      endTime: p5Start,
      startTime12h: formatTime12h(p4End),
      endTime12h: formatTime12h(p5Start),
      display: `${formatTime12h(p4End)} – ${formatTime12h(p5Start)}`
    };
  }

  // Afternoon Gate & Dispersal
  if (
    task.id.startsWith('task-gate-afternoon') ||
    titleLower.includes('afternoon gate') ||
    titleLower.includes('dispersal & bus stand')
  ) {
    let p8End = '13:40';
    let dispersalEnd = '14:10';
    if (activeTimings && activeTimings[8]?.time) {
      const parsed = parseEndTimeFromSlotString(activeTimings[8].time);
      if (parsed) {
        p8End = parsed;
        const [h, m] = p8End.split(':').map(Number);
        const total = h * 60 + m + 30;
        dispersalEnd = `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
      }
    }
    return {
      startTime: p8End,
      endTime: dispersalEnd,
      startTime12h: formatTime12h(p8End),
      endTime12h: formatTime12h(dispersalEnd),
      display: `${formatTime12h(p8End)} – ${formatTime12h(dispersalEnd)}`
    };
  }

  // 3. Custom / Timed Tasks with dueTime
  if (task.dueTime) {
    const timeStr = task.dueTime.trim();
    if (timeStr.includes('-') || timeStr.includes('–') || timeStr.toLowerCase().includes('to')) {
      const parts = timeStr.replace(/[–—]/g, '-').split(timeStr.includes('-') ? '-' : 'to').map(s => s.trim());
      if (parts.length >= 2) {
        const s24 = normalizeTo24HourTime(parts[0]);
        const e24 = normalizeTo24HourTime(parts[1]);
        if (s24 && e24) {
          const s12 = formatTime12h(s24);
          const e12 = formatTime12h(e24);
          return {
            startTime: s24,
            endTime: e24,
            startTime12h: s12,
            endTime12h: e12,
            display: `${s12} – ${e12}`
          };
        }
      }
    }

    const parsedStart = normalizeTo24HourTime(timeStr);
    if (parsedStart) {
      const [startH, startM] = parsedStart.split(':').map(Number);
      const duration = task.estimatedMinutes && task.estimatedMinutes > 0 ? task.estimatedMinutes : 0;
      let end24 = parsedStart;
      if (duration > 0) {
        const totalMinutes = startH * 60 + startM + duration;
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        end24 = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
      const s12 = formatTime12h(parsedStart);
      const e12 = formatTime12h(end24);
      return {
        startTime: parsedStart,
        endTime: end24,
        startTime12h: s12,
        endTime12h: e12,
        display: duration > 0 ? `${s12} – ${e12}` : s12
      };
    }
  }

  return null;
}

export interface TaskCompletionEligibility {
  allowed: boolean;
  isLocked: boolean;
  scheduledEndTime: string | null;
  scheduledEndTime12h: string | null;
  reason?: string;
}

/**
 * Validates whether a task can be marked as Completed on the active working date.
 * Rule: Tasks on activeWorkingDate cannot be marked completed until active time passes their scheduled finishing time.
 * Dynamically resolves scheduled finishing time from the active period timings config.
 */
export function isTaskCompletionAllowed(
  task: TeacherTask,
  activeWorkingDate: string,
  periodTimings?: Record<number, { time: string; label: string }> | null,
  customCurrentTime?: string
): TaskCompletionEligibility {
  // If the task is already marked Completed, unmarking / reverting back to incomplete is always allowed
  if (task.status === 'Completed') {
    return {
      allowed: true,
      isLocked: false,
      scheduledEndTime: null,
      scheduledEndTime12h: null
    };
  }

  const taskDueDate = task.dueDate ? task.dueDate.trim() : activeWorkingDate;

  // 1. Past Working Dates: All events for that day have already ended
  if (taskDueDate < activeWorkingDate) {
    return {
      allowed: true,
      isLocked: false,
      scheduledEndTime: null,
      scheduledEndTime12h: null
    };
  }

  // 2. Future Working Dates: Cannot mark future days' tasks complete today
  if (taskDueDate > activeWorkingDate) {
    return {
      allowed: false,
      isLocked: true,
      scheduledEndTime: null,
      scheduledEndTime12h: null,
      reason: `Scheduled for future date (${taskDueDate}). Cannot complete ahead of date.`
    };
  }

  // 3. Active Working Date: Evaluate dynamic scheduled finishing time
  const scheduledEndTime = getTaskScheduledEndTime(task, periodTimings);
  if (!scheduledEndTime) {
    // Untimed task for today: allowed anytime
    return {
      allowed: true,
      isLocked: false,
      scheduledEndTime: null,
      scheduledEndTime12h: null
    };
  }

  // Determine current clock time (HH:mm in 24-hour format)
  let nowHHmm = customCurrentTime;
  if (!nowHHmm) {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    nowHHmm = `${h}:${m}`;
  }

  const isLocked = nowHHmm < scheduledEndTime;
  const scheduledEndTime12h = formatTime12h(scheduledEndTime);

  if (isLocked) {
    return {
      allowed: false,
      isLocked: true,
      scheduledEndTime,
      scheduledEndTime12h,
      reason: `Available after ${scheduledEndTime12h} (Finishes at ${scheduledEndTime12h}).`
    };
  }

  return {
    allowed: true,
    isLocked: false,
    scheduledEndTime,
    scheduledEndTime12h
  };
}
