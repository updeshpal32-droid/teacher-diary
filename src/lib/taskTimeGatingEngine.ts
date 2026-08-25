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
  8: '13:40'
};

/**
 * Formats a 24-hour HH:mm string to a human-readable 12-hour string with AM/PM.
 * Example: "08:30" -> "8:30 AM", "13:40" -> "1:40 PM"
 */
export function formatTime12h(time24?: string | null): string {
  if (!time24 || !time24.includes(':')) return time24 || '';
  const [hStr, mStr] = time24.split(':');
  const hours = parseInt(hStr, 10);
  const minutes = mStr.substring(0, 2);
  if (isNaN(hours)) return time24;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Parses the end time from a period slot string (e.g. "08:00 - 08:40" or "08:00 to 08:40" or "08:40").
 * Returns "HH:mm" in 24-hour format.
 */
export function parseEndTimeFromSlotString(slotStr?: string | null): string | null {
  if (!slotStr || typeof slotStr !== 'string') return null;
  const cleaned = slotStr.replace(/[–—]/g, '-').trim();

  // If format "08:00 - 08:40"
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-');
    const endPart = parts[parts.length - 1].trim();
    const match = endPart.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  // If format "08:00 to 08:40"
  if (cleaned.toLowerCase().includes('to')) {
    const parts = cleaned.toLowerCase().split('to');
    const endPart = parts[parts.length - 1].trim();
    const match = endPart.match(/(\d{1,2}):(\d{2})/);
    if (match) {
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  const singleMatch = cleaned.match(/(\d{1,2}):(\d{2})/);
  if (singleMatch) {
    const h = parseInt(singleMatch[1], 10);
    const m = parseInt(singleMatch[2], 10);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return null;
}

/**
 * Calculates the scheduled end / finishing time of a task as an "HH:mm" string.
 * Dynamically resolves against the school's active period timings config.
 */
export function getTaskScheduledEndTime(
  task: TeacherTask,
  periodTimings?: Record<number, { time: string; label: string }> | null
): string | null {
  const activeTimings = periodTimings && Object.keys(periodTimings).length > 0 ? periodTimings : DEFAULT_PERIOD_TIMINGS;

  // 1. Teaching Period tasks (e.g. task-teaching-YYYY-MM-DD-p5 or Period N in tags / title)
  const periodMatch = task.id.match(/-p(\d+)/i) || (task.title || '').match(/Period\s*(\d+)/i);
  let periodNumber: number | null = null;
  if (periodMatch && periodMatch[1]) {
    periodNumber = parseInt(periodMatch[1], 10);
  }

  if (periodNumber === null && task.tags) {
    for (const tag of task.tags) {
      const tagMatch = tag.match(/Period\s*(\d+)/i);
      if (tagMatch && tagMatch[1]) {
        periodNumber = parseInt(tagMatch[1], 10);
        break;
      }
    }
  }

  if (periodNumber !== null) {
    // Check dynamic active period timings config first
    if (activeTimings && activeTimings[periodNumber]?.time) {
      const parsedEnd = parseEndTimeFromSlotString(activeTimings[periodNumber].time);
      if (parsedEnd) return parsedEnd;
    }

    // Fallback to default KVS period end time
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
      // Period 1 start time is Morning Gate finish time
      const match = activeTimings[1].time.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
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
      const match = activeTimings[5].time.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        return `${match[1].padStart(2, '0')}:${match[2]}`;
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
        const total = h * 60 + m + 30; // 30 minutes dispersal
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

    // If timeSlot range like "11:00 - 11:40" or "08:00-08:40"
    if (timeStr.includes('-') || timeStr.includes('–')) {
      const parsed = parseEndTimeFromSlotString(timeStr);
      if (parsed) return parsed;
    }

    // Single time like "14:00"
    const singleMatch = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (singleMatch) {
      const startH = parseInt(singleMatch[1], 10);
      const startM = parseInt(singleMatch[2], 10);
      const duration = task.estimatedMinutes && task.estimatedMinutes > 0 ? task.estimatedMinutes : 0;
      if (duration > 0) {
        const totalMinutes = startH * 60 + startM + duration;
        const endH = Math.floor(totalMinutes / 60) % 24;
        const endM = totalMinutes % 60;
        return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      }
      return `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
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
      reason: `This period/task is scheduled until ${scheduledEndTime12h}. It can be marked completed once the finishing time has passed.`
    };
  }

  return {
    allowed: true,
    isLocked: false,
    scheduledEndTime,
    scheduledEndTime12h
  };
}
