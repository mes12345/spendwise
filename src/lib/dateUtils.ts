
import { format, getDate, getDay } from 'date-fns';

export function getOrdinalSuffix(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export function getRecurrenceLabel(date: Date) {
  const dayName = format(date, 'EEEE');
  const dayOfMonth = getDate(date);
  const weekIndex = Math.ceil(dayOfMonth / 7);
  const weekNames = ['first', 'second', 'third', 'fourth', 'fifth'];
  
  // Check if it's the last one
  const nextWeekSameDay = new Date(date);
  nextWeekSameDay.setDate(dayOfMonth + 7);
  const isLast = nextWeekSameDay.getMonth() !== date.getMonth();
  
  const ordinal = isLast ? 'last' : weekNames[weekIndex - 1];
  return {
    dayLabel: `${dayOfMonth}${getOrdinalSuffix(dayOfMonth)} of every month`,
    weekLabel: `the ${ordinal} ${dayName} of every month`,
    weekIndex: isLast ? -1 : weekIndex,
    dayOfWeek: getDay(date)
  };
}
