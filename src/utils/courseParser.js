export function parseCourses(coursesData) {
  return coursesData.map(row => {
    const scheduleStr = row.Schedule;
    const schedules = parseSchedule(scheduleStr);
    
    // Türkçe karakterleri düzelt
    const fixTurkishChars = (str) => {
      if (!str) return '';
      return str
        .replace(/Ý/g, 'İ')
        .replace(/ý/g, 'ı')
        .replace(/þ/g, 'ş')
        .replace(/ð/g, 'ğ')
        .replace(/ü/g, 'ü')
        .replace(/ç/g, 'ç')
        .replace(/ö/g, 'ö')
        .replace(/Ð/g, 'Ğ')
        .replace(/Þ/g, 'Ş')
        .replace(/Ç/g, 'Ç')
        .replace(/Ö/g, 'Ö')
        .replace(/Ü/g, 'Ü');
    };

    return {
      code: row.Code,
      name: fixTurkishChars(row.Name),
      section: row.Section,
      lecturer: fixTurkishChars(row.Lecturer),
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
      const [start, end] = parts[i + 1].split('-').map(Number);
      if (!isNaN(start) && !isNaN(end)) {
        schedules.push({
          day,
          startHour: start,
          endHour: end
        });
      }
    }
  }
  
  return schedules;
} 