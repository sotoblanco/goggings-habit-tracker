import { RecurringTask } from '../types';

export const getLocalDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isRecurringOnDate = (task: RecurringTask, dateStr: string): boolean => {
    const checkDate = new Date(dateStr + 'T00:00:00');
    const startDate = new Date(task.startDate + 'T00:00:00');

    if (checkDate < startDate) {
        return false;
    }

    const dayOfWeek = checkDate.getDay();

    switch (task.recurrenceRule) {
        case 'Daily':
            return true;
        case 'Weekly':
            return dayOfWeek === startDate.getDay();
        case 'Weekdays':
            return dayOfWeek >= 1 && dayOfWeek <= 5;
        case 'Weekends':
            return dayOfWeek === 0 || dayOfWeek === 6;
        default:
            return false;
    }
};

export const getDatesInRange = (startDate: Date, endDate: Date): Date[] => {
    const dates: Date[] = [];
    let currentDate = new Date(startDate.toISOString().split('T')[0] + 'T00:00:00');
    const finalDate = new Date(endDate.toISOString().split('T')[0] + 'T00:00:00');

    while (currentDate <= finalDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
};

// ISO 8601 week number
export const getWeekKey = (d: Date): string => {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  // Return array of year and week number
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const getStartOfWeek = (d: Date): Date => {
    const date = new Date(d);
    // Sunday - 0, Monday - 1, ...
    const day = date.getDay();
    // diff is the number of days to subtract to get to the start of the week (Monday)
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    const startOfWeek = new Date(date.setDate(diff));
    startOfWeek.setHours(0,0,0,0);
    return startOfWeek;
};

export const getEndOfWeek = (d: Date): Date => {
    const startOfWeek = getStartOfWeek(d);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek;
};
