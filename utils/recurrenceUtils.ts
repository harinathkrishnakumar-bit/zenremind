
import { Reminder, RecurrenceType } from '../types';

export const getOccurrencesInRange = (reminder: Reminder, start: Date, end: Date): Reminder[] => {
  if (!reminder.recurrence || reminder.recurrence.type === RecurrenceType.NONE) {
    const due = new Date(reminder.dueDate);
    return (due >= start && due <= end) ? [reminder] : [];
  }

  const occurrences: Reminder[] = [];
  let current = new Date(reminder.dueDate);
  const recurrenceEnd = reminder.recurrence.endDate ? new Date(reminder.recurrence.endDate) : end;
  const actualEnd = new Date(Math.min(end.getTime(), recurrenceEnd.getTime()));

  // Safety cap for calculations
  let safetyCounter = 0;
  const maxOccurrences = 400;

  while (current <= actualEnd && safetyCounter < maxOccurrences) {
    if (current >= start) {
      let matches = true;
      if (reminder.recurrence.type === RecurrenceType.CUSTOM && reminder.recurrence.daysOfWeek) {
        matches = reminder.recurrence.daysOfWeek.includes(current.getDay());
      }

      if (matches) {
        occurrences.push({
          ...reminder,
          // Use a robust double-colon separator for virtual IDs
          id: `${reminder.id}::${current.getTime()}`,
          dueDate: current.toISOString(),
        });
      }
    }

    // Advance to next slot
    switch (reminder.recurrence.type) {
      case RecurrenceType.DAILY:
        current.setDate(current.getDate() + 1);
        break;
      case RecurrenceType.WEEKLY:
      case RecurrenceType.CUSTOM:
        current.setDate(current.getDate() + 1);
        if (reminder.recurrence.type === RecurrenceType.WEEKLY && current.getDay() !== new Date(reminder.dueDate).getDay()) {
          while(current.getDay() !== new Date(reminder.dueDate).getDay() && current <= actualEnd) {
            current.setDate(current.getDate() + 1);
          }
        }
        break;
      case RecurrenceType.MONTHLY:
        current.setMonth(current.getMonth() + 1);
        break;
      case RecurrenceType.YEARLY:
        current.setFullYear(current.getFullYear() + 1);
        break;
      default:
        current.setDate(actualEnd.getDate() + 1);
    }
    safetyCounter++;
  }

  return occurrences;
};
