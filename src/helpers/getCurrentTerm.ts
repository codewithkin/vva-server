// src/utils/termUtils.ts

export type TermInfo = {
  term: 1 | 2 | 3;
  year: number;
  startDate: Date; // Added for convenience
  endDate: Date; // Added for convenience
};

const TERM_DATES_RAW = [
  // [startMonth (0-indexed), startDay, endMonth (0-indexed), endDay]
  {term: 1, start: {month: 0, day: 14}, end: {month: 3, day: 10}}, // Jan 14 - Apr 10
  {term: 2, start: {month: 4, day: 13}, end: {month: 7, day: 7}}, // May 13 - Aug 7
  {term: 3, start: {month: 8, day: 9}, end: {month: 11, day: 1}}, // Sep 9 - Dec 1
];

export function getCurrentTerm(date: Date = new Date()): TermInfo {
  const year = date.getFullYear();

  for (const {term, start, end} of TERM_DATES_RAW) {
    const startDate = new Date(year, start.month, start.day);
    // Set endDate to the end of the day to ensure it includes all invoices for that day
    const endDate = new Date(year, end.month, end.day, 23, 59, 59, 999);

    if (date >= startDate && date <= endDate) {
      return {term: term as 1 | 2 | 3, year, startDate, endDate};
    }
  }

  // If not in any defined term range, determine the logical current/next term
  const firstTermStartOfCurrentYear = new Date(
    year,
    TERM_DATES_RAW[0].start.month,
    TERM_DATES_RAW[0].start.day
  );
  const lastTermEndOfCurrentYear = new Date(
    year,
    TERM_DATES_RAW[2].end.month,
    TERM_DATES_RAW[2].end.day,
    23,
    59,
    59,
    999
  );

  if (date < firstTermStartOfCurrentYear) {
    // If current date is before the first term of the current year, it's considered the previous year's 3rd term
    const prevYear = year - 1;
    const lastTermInfo = TERM_DATES_RAW[2];
    return {
      term: 3,
      year: prevYear,
      startDate: new Date(
        prevYear,
        lastTermInfo.start.month,
        lastTermInfo.start.day
      ),
      endDate: new Date(
        prevYear,
        lastTermInfo.end.month,
        lastTermInfo.end.day,
        23,
        59,
        59,
        999
      ),
    };
  } else if (date > lastTermEndOfCurrentYear) {
    // If current date is after the last term of the current year, it's considered the next year's 1st term
    const nextYear = year + 1;
    const firstTermInfo = TERM_DATES_RAW[0];
    return {
      term: 1,
      year: nextYear,
      startDate: new Date(
        nextYear,
        firstTermInfo.start.month,
        firstTermInfo.start.day
      ),
      endDate: new Date(
        nextYear,
        firstTermInfo.end.month,
        firstTermInfo.end.day,
        23,
        59,
        59,
        999
      ),
    };
  }

  // Fallback for edge cases (e.g., gaps between terms if TERM_DATES_RAW doesn't cover all days)
  // This should ideally not be hit if TERM_DATES_RAW covers the entire academic year or transitions gracefully.
  console.warn(
    "Date does not fall cleanly within any school term. Returning current year's first term as fallback."
  );
  const firstTermInfo = TERM_DATES_RAW[0];
  return {
    term: 1,
    year: year,
    startDate: new Date(
      year,
      firstTermInfo.start.month,
      firstTermInfo.start.day
    ),
    endDate: new Date(
      year,
      firstTermInfo.end.month,
      firstTermInfo.end.day,
      23,
      59,
      59,
      999
    ),
  };
}
