import React, { useState, useEffect } from 'react';
import './App.css';
import { parseCourses } from './utils/courseParser';
import { readExcelFile } from './utils/excelReader';

function App() {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [originalCourses, setOriginalCourses] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalECTS, setTotalECTS] = useState(0);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [possibleSchedules, setPossibleSchedules] = useState([]);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);
  const [testCourse, setTestCourse] = useState(null);
  const [ignoreConflicts, setIgnoreConflicts] = useState(false);

  // Excel verilerini yükle
  useEffect(() => {
    // Excel dosyası yüklenene kadar boş kalacak
  }, []);

  // Haftalık program için zaman aralıkları
  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    timeSlots.push(`${hour}:00 - ${hour + 1}:00`);
  }

  const weekDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

  // Çakışma tercihini değiştirme fonksiyonu
  const toggleConflictPreference = () => {
    setIgnoreConflicts(!ignoreConflicts);
  };

  // Renk paleti tanımlayalım (yeşil ve mavi tonları)
  const courseColors = [
    // Yeşil tonları
    '#87A96B',  // Kuşkonmaz rengi
    '#66FF00',  // Parlak yeşil
    '#78866B',  // Kamuflaj yeşili
    '#98FF98',  // Soluk deniz yeşili
    '#90EE90',  // Açık yeşil
    '#50C878',  // Zümrüt yeşili
    
    // Mavi tonları
    '#F0F8FF',  // Alice mavisi
    '#87CEEB',  // Gök mavisi
    '#89CFF0',  // Bebek mavisi
    '#0000FF',  // Mavi
    '#2A52BE',  // Cerulean
    '#2A52BE',  // Cerulean blue
    '#0047AB',  // Kobalt mavisi
    '#6495ED',  // Peygamber çiçeği mavisi
    '#00008B',  // Koyu mavi
    '#1560BD',  // Kot rengi
    '#1E90FF',  // Dodger blue
    '#4B0082',  // Çivit mavisi
    '#002FA7',  // International Klein Blue
    '#ADD8E6',  // Açık mavi
    '#191970',  // Gece mavisi
    '#000080',  // Lacivert
    '#7B68EE',  // Cezayir menekşesi rengi
    '#4169E1',  // Acem mavisi
    '#B0E0E6',  // Toz mavi
    '#003153',  // Prusya mavisi
    '#4169E1',  // Kraliyet mavisi
    '#0F52BA',  // Safir rengi
    '#4682B4'   // Çelik mavisi
  ];

  const handleCourseSelect = (course) => {
    console.log('Selecting course:', course);

    if (selectedCourses.some(selected => selected.code === course.code)) {
      alert('Bu ders zaten eklenmiş!');
      return;
    }

    const newTotalCredits = totalCredits + Number(course.credits);
    if (newTotalCredits > 25) {
      alert('Maksimum 25 kredi seçebilirsiniz!');
      return;
    }

    const hasConflict = selectedCourses.some(selectedCourse => {
      return selectedCourse.schedule.some(selectedTime => {
        return course.schedule.some(newTime => {
          return selectedTime.day === newTime.day && 
                 ((selectedTime.startHour <= newTime.startHour && selectedTime.endHour > newTime.startHour) ||
                  (selectedTime.startHour < newTime.endHour && selectedTime.endHour >= newTime.endHour));
        });
      });
    });

    if (!hasConflict || ignoreConflicts) {
      setSelectedCourses([...selectedCourses, course]);
      setTotalCredits(newTotalCredits);
      setTotalECTS(prev => prev + Number(course.ects));
      
      // Seçilen dersin tüm sectionlarını kaldır
      const baseCode = course.code.split('_')[0];
      setCourses(prevCourses => prevCourses.filter(c => !c.code.startsWith(baseCode)));
    }
  };

  // Olası ders programlarını oluştur
  const generatePossibleSchedules = (courses) => {
    let schedules = [[]]; // Başlangıçta boş bir program

    courses.forEach(course => {
      const newSchedules = [];
      
      schedules.forEach(schedule => {
        // Bu dersin schedule'ı ile mevcut schedule'ın çakışıp çakışmadığını kontrol et
        const hasConflict = schedule.some(existingCourse => {
          return existingCourse.schedule.some(existingTime => {
            return course.schedule.some(newTime => {
              return existingTime.day === newTime.day && 
                     ((existingTime.startHour <= newTime.startHour && existingTime.endHour > newTime.startHour) ||
                      (existingTime.startHour < newTime.endHour && existingTime.endHour >= newTime.endHour));
            });
          });
        });

        if (!hasConflict) {
          newSchedules.push([...schedule, course]);
        }
      });

      schedules = newSchedules;
    });

    return schedules;
  };

  const handleCourseRemove = (courseToRemove) => {
    setSelectedCourses(selectedCourses.filter(course => course.code !== courseToRemove.code));
    setTotalCredits(prev => prev - Number(courseToRemove.credits));
    setTotalECTS(prev => prev - Number(courseToRemove.ects));
    
    // Silinen dersin tüm sectionlarını geri ekle
    const baseCode = courseToRemove.code.split('_')[0];
    const allSectionsOfCourse = originalCourses.filter(c => c.code.startsWith(baseCode));
    
    // Mevcut dersleri güncelle, aynı dersleri önle
    setCourses(prevCourses => {
      const coursesWithoutDuplicate = prevCourses.filter(c => !c.code.startsWith(baseCode));
      return [...coursesWithoutDuplicate, ...allSectionsOfCourse].sort((a, b) => a.code.localeCompare(b.code));
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const excelData = await readExcelFile(file);
        const parsedCourses = parseCourses(excelData);
        setCourses(parsedCourses);
        setOriginalCourses(parsedCourses);
        setIsFileUploaded(true);
      } catch (error) {
        console.error('Excel dosyası okunurken hata oluştu:', error);
        alert('Excel dosyası okunurken bir hata oluştu!');
      }
    }
  };

  const filteredCourses = courses.filter(course => 
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Program değiştirme butonları
  const ProgramControls = () => (
    <div className="program-controls">
      <button 
        onClick={() => setSelectedScheduleIndex(prev => Math.max(0, prev - 1))}
        disabled={selectedScheduleIndex === 0}
      >
        ← Önceki Program
      </button>
      <span>Program {selectedScheduleIndex + 1} / {possibleSchedules.length}</span>
      <button 
        onClick={() => setSelectedScheduleIndex(prev => Math.min(possibleSchedules.length - 1, prev + 1))}
        disabled={selectedScheduleIndex === possibleSchedules.length - 1}
      >
        Sonraki Program →
      </button>
    </div>
  );

  // Render fonksiyonunu güncelle
  const renderScheduleCell = (day, timeSlot) => {
    const hour = parseInt(timeSlot.split(':')[0]);

    const coursesInSlot = selectedCourses.filter(course => 
      course.schedule.some(scheduleItem => 
        scheduleItem.day === day && 
        parseInt(scheduleItem.startHour) <= hour && 
        parseInt(scheduleItem.endHour) > hour
      )
    );

    if (coursesInSlot.length > 0) {
      const hasConflict = coursesInSlot.length > 1;
      
      return (
        <div 
          className="scheduled-course"
          style={{
            backgroundColor: hasConflict ? '#ff6b6b' : courseColors[selectedCourses.indexOf(coursesInSlot[0]) % courseColors.length],
            color: hasConflict ? 'white' : '#000000', // Koyu renkli yazı
            padding: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px'
          }}
        >
          {coursesInSlot.map((course, index) => (
            <div key={index}>
              {course.code.split('_')[0]} - Section {course.code.split('_')[1]}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  const handleTestButtonClick = () => {
    // Örnek bir ders seçimi
    const exampleCourse = {
      code: 'TEST_01',
      schedule: [
        { day: 'Pazartesi', startHour: 9, endHour: 11 },
        { day: 'Çarşamba', startHour: 14, endHour: 16 }
      ]
    };
    setTestCourse(exampleCourse);
  };

  return (
    <div className="App">
      <div className="container split-layout">
        <div className="weekly-schedule">
          {possibleSchedules.length > 1 && <ProgramControls />}
          <table>
            <thead>
              <tr>
                <th>Saat</th>
                {weekDays.map(day => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, index) => (
                <tr key={index}>
                  <td>{timeSlot}</td>
                  {weekDays.map(day => (
                    <td key={`${day}-${timeSlot}`}>
                      {renderScheduleCell(day, timeSlot)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="course-selection">
          <div className="selection-header">
            <h2>Ders Seçimi</h2>
            <div className="credits-info">
              <span>Toplam Kredi: {totalCredits}</span>
              <label className="conflict-toggle">
                <input
                  type="checkbox"
                  checked={ignoreConflicts}
                  onChange={toggleConflictPreference}
                />
                Ders çakışmalarına izin ver
              </label>
            </div>
          </div>
          
          <div className="search-bar">
            <input
              type="text"
              placeholder="Ders kodu veya ismi ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="available-courses">
            <div className="course-list">
              {filteredCourses.map((course, index) => {
                const [code, sectionFull] = course.code.split('_');
                const section = sectionFull ? sectionFull.split('-')[0] : '';
                
                return (
                  <div 
                    key={index} 
                    className="course-item"
                    onClick={() => handleCourseSelect(course)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="course-info">
                      <div className="course-header">
                        <span className="course-code">{code}</span>
                        <span className="section-code">{section}</span>
                        <span className="course-name">{course.name}</span>
                      </div>
                      <div className="course-details">
                        <span>{course.credits} Kredi</span>
                        <span className="separator">-</span>
                        <span>{course.lecturer}</span>
                      </div>
                      <div className="course-schedule">
                        {course.schedule.map(s => 
                          `${s.day} ${s.startHour}:00-${s.endHour}:00`
                        ).join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="selected-courses">
            {selectedCourses.map((course, index) => (
              <div 
                key={index} 
                className="selected-course-item"
                onClick={() => handleCourseRemove(course)}
              >
                <span>{course.code} - {course.name}</span>
                <span>{course.schedule.map(s => `${s.day} ${s.startHour}:00-${s.endHour}:00`).join(', ')}</span>
              </div>
            ))}
          </div>

          {!isFileUploaded && (
            <div className="file-upload">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="file-input"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
