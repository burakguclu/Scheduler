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
          const conflict = selectedTime.day === newTime.day && 
                 ((selectedTime.startHour <= newTime.startHour && selectedTime.endHour > newTime.startHour) ||
                  (selectedTime.startHour < newTime.endHour && selectedTime.endHour >= newTime.endHour));
          
          if (conflict) {
            console.log('Conflict detected:', {
              existingCourse: selectedCourse.code,
              newCourse: course.code,
              existingTime: selectedTime,
              newTime: newTime
            });
          }
          
          return conflict;
        });
      });
    });

    if (hasConflict) {
      alert('Bu ders seçili derslerle çakışıyor!');
      return;
    }

    setSelectedCourses([...selectedCourses, course]);
    setTotalCredits(newTotalCredits);
    setTotalECTS(prev => prev + Number(course.ects));
    
    // Ders detaylarını kullanıcıya bildir
    const scheduleDetails = course.schedule.map(s => `${s.day} ${s.startHour}:00-${s.endHour}:00`).join(', ');
    alert(`Ders Seçildi:\nDers: ${course.name}\nSection: ${course.code.split('_')[1]}\nÖğretim Üyesi: ${course.lecturer}\nSaatler: ${scheduleDetails}`);
    
    console.log('Course added successfully:', {
      updatedCourses: [...selectedCourses, course],
      newTotalCredits,
      schedule: course.schedule
    });
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
    
    // Çıkarılan dersin tüm sectionlarını alfabetik sırayla geri ekle
    const baseCode = courseToRemove.code.split('_')[0];
    const allSectionsOfCourse = originalCourses.filter(c => c.code.startsWith(baseCode));
    setCourses(prevCourses => {
      const newCourses = [...prevCourses, ...allSectionsOfCourse];
      return newCourses.sort((a, b) => a.code.localeCompare(b.code));
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

    const courseInSlot = selectedCourses.find(course => 
      course.schedule.some(scheduleItem => 
        scheduleItem.day === day && 
        parseInt(scheduleItem.startHour) <= hour && 
        parseInt(scheduleItem.endHour) > hour
      )
    );

    if (courseInSlot) {
      console.log('Rendering course in slot:', {
        courseCode: courseInSlot.code,
        day,
        hour
      });

      return (
        <div 
          className="scheduled-course"
          style={{
            backgroundColor: `hsl(${hashCode(courseInSlot.code) % 360}, 70%, 60%)`,
            color: 'white',
            padding: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {courseInSlot.code.split('_')[0]} - Section {courseInSlot.code.split('_')[1]}
        </div>
      );
    }

    return null;
  };

  // Renk oluşturmak için yardımcı fonksiyon
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
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
