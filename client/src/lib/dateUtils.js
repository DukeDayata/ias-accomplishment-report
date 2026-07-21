export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Gets all Mondays for a given month and year.
 * @param {number} year 
 * @param {number} monthIndex (0 = Jan, 11 = Dec)
 * @returns {Array} List of weeks with weekNumber, day, and formatted date
 */
export function getMondaysForMonth(year, monthIndex) {
  const mondays = [];
  let d = new Date(year, monthIndex, 1);
  
  // Set to the first Monday of the month
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1);
  }

  let weekNumber = 1;
  while (d.getMonth() === monthIndex) {
    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    mondays.push({
      weekNumber: weekNumber++,
      day: d.getDate(),
      date: formattedDate
    });
    
    // Move to next Monday
    d.setDate(d.getDate() + 7);
  }

  return mondays;
}
