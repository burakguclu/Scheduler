export function parseCourses(coursesData) {
  return coursesData.map(row => {
    const scheduleStr = row.Schedule;
    const schedules = parseSchedule(scheduleStr);
    
    return {
      code: row.Code,
      name: row.Name,
      section: row.Section,
      lecturer: row.Lecturer,
      room: row.Room,
      schedule: schedules,
      credits: row.Cr,
      ects: row.ECTS
    };
  });
}

function parseSchedule(scheduleStr) {
  if (!scheduleStr) return [];
  
  // Örnek format: "Mo 09-11 We 13-15"
  const days = {
    'Mo': 'Pazartesi',
    'Tu': 'Salı',
    'We': 'Çarşamba',
    'Th': 'Perşembe',
    'Fr': 'Cuma'
  };

  const schedules = [];
  const parts = scheduleStr.split(' ');
  
  for (let i = 0; i < parts.length; i += 2) {
    const day = days[parts[i]];
    if (day && parts[i + 1]) {
      const [start, end] = parts[i + 1].split('-');
      schedules.push({
        day,
        startHour: parseInt(start),
        endHour: parseInt(end)
      });
    }
  }
  
  return schedules;
} 