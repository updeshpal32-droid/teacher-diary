import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from './storage';

/**
 * Returns today's date in local calendar time as YYYY-MM-DD (never UTC offset).
 */
export function getLocalTodayDateString(): string {
  const dt = new Date();
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export const DEFAULT_ACTIVE_WORKING_DATE = getLocalTodayDateString();
export const STORAGE_KEY_ACTIVE_DATE = 'setup:active_working_date';
export const EVENT_ACTIVE_DATE_CHANGED = 'kvs-active-date-changed';

// In-memory cache for fast synchronous initial render
let cachedActiveDate: string = (() => {
  const today = getLocalTodayDateString();
  try {
    if (typeof window !== 'undefined') {
      const isPinned = sessionStorage.getItem('session_date_pinned') === 'true';
      const fromSession = sessionStorage.getItem('session_working_date');
      if (fromSession && fromSession.includes('-')) {
        if (isPinned) {
          return fromSession;
        }
        // Stale unpinned past date in session: discard
        if (fromSession < today) {
          sessionStorage.removeItem('session_working_date');
        } else if (fromSession === today) {
          return today;
        }
      }

      const fromStorage = localStorage.getItem(STORAGE_KEY_ACTIVE_DATE);
      if (fromStorage && fromStorage.includes('-')) {
        if (fromStorage >= today) {
          return fromStorage;
        }
      }
    }
  } catch (_) {}
  return today;
})();

/**
 * Pure mathematical day-of-week derivation from a YYYY-MM-DD date string.
 * Returns empty string if invalid or empty. Never coerces or assumes a day.
 */
export function getDayOfWeekFromDate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dateObj = new Date(y, m - 1, d);
  const dayIdx = dateObj.getDay();
  return days[dayIdx] || '';
}

/**
 * Formats a YYYY-MM-DD date string to localized UK/Indian date (e.g. "18 August 2026").
 * Returns empty string if invalid.
 */
export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string' || !dateStr.includes('-')) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d) || m < 1 || m > 12 || d < 1 || d > 31) return '';
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Synchronous getter from cache / local memory.
 */
export function getActiveWorkingDateSync(): string {
  return cachedActiveDate;
}

/**
 * Asynchronously fetch the active working date from storage.
 */
export async function getActiveWorkingDate(): Promise<string> {
  const today = getLocalTodayDateString();
  try {
    const isPinned = typeof window !== 'undefined' && sessionStorage.getItem('session_date_pinned') === 'true';
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const fromSession = sessionStorage.getItem('session_working_date');
      if (fromSession && fromSession.includes('-')) {
        if (isPinned) {
          cachedActiveDate = fromSession;
          return fromSession;
        }
        // Stale unpinned past date in session: discard and advance
        if (fromSession < today) {
          sessionStorage.removeItem('session_working_date');
        } else {
          cachedActiveDate = fromSession;
          return fromSession;
        }
      }
    }

    const stored = await db.get<string>(STORAGE_KEY_ACTIVE_DATE);
    if (stored && typeof stored === 'string' && stored.includes('-')) {
      // If stored date is in the past relative to today, advance to today
      if (stored < today && !isPinned) {
        cachedActiveDate = today;
        await setActiveWorkingDate(today, false);
        return today;
      }
      cachedActiveDate = stored;
      try {
        localStorage.setItem(STORAGE_KEY_ACTIVE_DATE, stored);
      } catch (_) {}
      return stored;
    }
  } catch (err) {
    console.warn('[ActiveDate] Error reading active date from db:', err);
  }
  cachedActiveDate = today;
  return today;
}

/**
 * Update the active working date system-wide (Admin/Principal action).
 * Persists to IndexedDB, updates cache & localStorage, and broadcasts event.
 */
export async function setActiveWorkingDate(dateStr: string, isPinned = true): Promise<void> {
  if (!dateStr || !dateStr.includes('-')) return;
  const today = getLocalTodayDateString();
  const shouldPin = isPinned && dateStr !== today;
  cachedActiveDate = dateStr;
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem('session_working_date', dateStr);
      if (shouldPin) {
        sessionStorage.setItem('session_date_pinned', 'true');
      } else {
        sessionStorage.removeItem('session_date_pinned');
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_DATE, dateStr);
    }
  } catch (_) {}
  try {
    await db.set(STORAGE_KEY_ACTIVE_DATE, dateStr);
  } catch (err) {
    console.error('[ActiveDate] Error persisting active date:', err);
  }

  // Broadcast system-wide event so all open views immediately react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENT_ACTIVE_DATE_CHANGED, { detail: { activeDate: dateStr } })
    );
  }
}

/**
 * React hook to consume and react to the Unified Active Working Date.
 */
export function useActiveWorkingDate() {
  const [activeDate, setDateState] = useState<string>(cachedActiveDate);

  useEffect(() => {
    // Initial fetch from storage
    getActiveWorkingDate().then(storedDate => {
      if (storedDate && storedDate !== activeDate) {
        setDateState(storedDate);
      }
    });

    const handleDateChange = (e: any) => {
      const newDate = e.detail?.activeDate || e.detail;
      if (newDate && typeof newDate === 'string' && newDate.includes('-')) {
        setDateState(newDate);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(EVENT_ACTIVE_DATE_CHANGED, handleDateChange);
      return () => {
        window.removeEventListener(EVENT_ACTIVE_DATE_CHANGED, handleDateChange);
      };
    }
  }, []);

  const updateActiveDate = useCallback(async (newDate: string) => {
    const today = getLocalTodayDateString();
    const isPinned = newDate !== today;
    await setActiveWorkingDate(newDate, isPinned);
    setDateState(newDate);
  }, []);

  const resetToToday = useCallback(async () => {
    const today = getLocalTodayDateString();
    await setActiveWorkingDate(today, false);
    setDateState(today);
  }, []);

  const activeDayName = useMemo(() => getDayOfWeekFromDate(activeDate), [activeDate]);
  const formattedDate = useMemo(() => formatDisplayDate(activeDate), [activeDate]);
  const isWeekend = useMemo(() => activeDayName === 'Sunday' || activeDayName === 'Saturday', [activeDayName]);

  return {
    activeDate,
    activeDayName,
    formattedDate,
    isWeekend,
    setActiveDate: updateActiveDate,
    resetToToday
  };
}

/**
 * Safe local calendar arithmetic (strictly avoids UTC / ISO timezone offsets).
 * Adds or subtracts days without ever skipping or getting offset by timezone.
 */
export function addDaysToDate(dateStr: string, delta: number): string {
  if (!dateStr || !dateStr.includes('-')) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}


/**
 * Parses user typed date in various formats (DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD) into YYYY-MM-DD.
 * Returns null if invalid.
 */
export function parseAnyDateStringToISO(input: string): string | null {
  if (!input) return null;
  const clean = input.trim();
  
  // 1. Check YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(clean)) {
    const [y, m, d] = clean.split('-').map(Number);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }

  // 2. Check DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const match = clean.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (match) {
    const d = Number(match[1]);
    const m = Number(match[2]);
    const y = Number(match[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
      const dt = new Date(y, m - 1, d);
      if (dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d) {
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
  }

  return null;
}

