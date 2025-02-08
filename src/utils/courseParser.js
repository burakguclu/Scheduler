export function parseCourses(coursesData) {
  // Dersleri gruplara ayır
  const courseGroups = {};
  
  coursesData.forEach(row => {
    const baseCode = row.Code.split('_')[0]; // CMPE 326_01 -> CMPE 326
    if (!courseGroups[baseCode]) {
      courseGroups[baseCode] = [];
    }
    courseGroups[baseCode].push(row);
  });

  // Her grup için section numarası ata ve tüm dersleri birleştir
  const parsedCourses = [];
  
  Object.values(courseGroups).forEach(group => {
    group.forEach((row, index) => {
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

      parsedCourses.push({
        code: `${row.Code.split('_')[0]}_${(index + 1).toString().padStart(2, '0')}`, // CMPE 326_01
        name: fixTurkishChars(row.Name),
        section: (index + 1).toString().padStart(2, '0'), // 01, 02, vs.
        lecturer: fixTurkishChars(row.Lecturer),
        room: row.Room,
        schedule: schedules,
        credits: row.Cr,
        ects: row.ECTS
      });
    });
  });

  // Dersleri koda göre sırala
  return parsedCourses.sort((a, b) => a.code.localeCompare(b.code));
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
        console.log('Parsed Schedule:', { day, startHour: start, endHour: end });
      }
    }
  }
  
  return schedules;
} 