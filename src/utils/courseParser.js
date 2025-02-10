export function parseCourses(coursesData) {
  // Dersleri gruplara ayır
  const courseGroups = {};
  
  coursesData.forEach(row => {
    const baseCode = row.Code.split('_')[0];
    if (!courseGroups[baseCode]) {
      courseGroups[baseCode] = {
        code: baseCode,
        name: fixTurkishChars(row.Name),
        credits: row.Cr,
        ects: row.ECTS,
        sections: []
      };
    }
    
    courseGroups[baseCode].sections.push({
      code: `${baseCode}_${(courseGroups[baseCode].sections.length + 1).toString().padStart(2, '0')}`,
      lecturer: fixTurkishChars(row.Lecturer),
      room: row.Room,
      schedule: parseSchedule(row.Schedule)
    });
  });

  return Object.values(courseGroups);
}

function parseSchedule(scheduleStr) {
  if (!scheduleStr) return [];
  
  const days = {
    'Mo': 'Pazartesi',
    'Tu': 'Salı',
    'We': 'Çarşamba',
    'Th': 'Perşembe',
    'Fr': 'Cuma'
  };

  const schedules = [];
  
  // Birden fazla gün içeren formatları ayır (örn: "Tu/Fr" -> ["Tu", "Fr"])
  const processDay = (dayStr) => {
    if (dayStr.includes('/')) {
      return dayStr.split('/').filter(d => d);
    }
    return [dayStr];
  };

  // Günleri ve saatleri ayır
  const schedulePattern = /([A-Za-z/]+)\s*(\d{1,2})\s*-\s*(\d{1,2})/g;
  let match;

  while ((match = schedulePattern.exec(scheduleStr)) !== null) {
    const [_, dayPart, startHour, endHour] = match;
    const start = parseInt(startHour, 10);
    const end = parseInt(endHour, 10);

    // Birden fazla gün varsa hepsi için aynı saat aralığını kullan
    const dayList = processDay(dayPart);
    dayList.forEach(day => {
      if (days[day] && !isNaN(start) && !isNaN(end)) {
        schedules.push({
          day: days[day],
          startHour: start,
          endHour: end
        });
        console.log('Parsed Schedule:', { 
          day: days[day], 
          startHour: start, 
          endHour: end 
        });
      }
    });
  }

  return schedules;
}

function fixTurkishChars(str) {
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
} 