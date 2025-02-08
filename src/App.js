import React, { useState, useEffect } from 'react';
import './App.css';
import { parseCourses } from './utils/courseParser';
import { readExcelFile } from './utils/excelReader';

function App() {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalECTS, setTotalECTS] = useState(0);

  // Excel verilerini yükle
  useEffect(() => {
    const excelData = [
      {
        Year: '2024',
        Period: '002',
        Code: 'CMPE 114',
        Name: 'Fundamentals of Programming II',
        Section: 'CMPE 114_01',
        Lecturer: 'Özlem Albayrak',
        Room: 'D026 A514-PC-L',
        Schedule: 'Mo 13-15 We 16-18',
        Cr: '3',
        ECTS: '6'
      },
      // Diğer dersleri de buraya ekleyin...
    ];
    
    const parsedCourses = parseCourses(excelData);
    setCourses(parsedCourses);
  }, []);

  // Haftalık program için zaman aralıkları
  const timeSlots = [];
  for (let hour = 9; hour <= 21; hour++) {
    timeSlots.push(`${hour}:00 - ${hour + 1}:00`);
  }

  const weekDays = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];

  const handleCourseSelect = (course) => {
    // Çakışma kontrolü
    const hasConflict = selectedCourses.some(selectedCourse => {
      return selectedCourse.schedule.some(selectedTime => {
        return course.schedule.some(newTime => {
          return selectedTime.day === newTime.day && 
                 ((selectedTime.startHour <= newTime.startHour && selectedTime.endHour > newTime.startHour) ||
                  (selectedTime.startHour < newTime.endHour && selectedTime.endHour >= newTime.endHour));
        });
      });
    });

    if (hasConflict) {
      alert('Bu ders seçili derslerle çakışıyor!');
      return;
    }

    setSelectedCourses([...selectedCourses, course]);
    setTotalCredits(prev => prev + Number(course.credits));
    setTotalECTS(prev => prev + Number(course.ects));
  };

  const handleCourseRemove = (courseToRemove) => {
    setSelectedCourses(selectedCourses.filter(course => course.code !== courseToRemove.code));
    setTotalCredits(prev => prev - Number(courseToRemove.credits));
    setTotalECTS(prev => prev - Number(courseToRemove.ects));
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const excelData = await readExcelFile(file);
        const parsedCourses = parseCourses(excelData);
        setCourses(parsedCourses);
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

  // Haftalık program hücresinin içeriğini render eden fonksiyon
  const renderScheduleCell = (day, timeSlot) => {
    const hour = parseInt(timeSlot.split(':')[0]);
    const coursesInSlot = selectedCourses.filter(course => 
      course.schedule.some(s => 
        s.day === day && 
        s.startHour <= hour && 
        s.endHour > hour
      )
    );

    return coursesInSlot.map((course, idx) => (
      <div 
        key={`${course.code}-${idx}`} 
        className="scheduled-course"
        style={{
          backgroundColor: `hsl(${hashCode(course.code) % 360}, 70%, 60%)`,
          padding: '4px',
          marginBottom: coursesInSlot.length > 1 ? '2px' : '0'
        }}
      >
        <div className="course-code">{course.code}</div>
        <div className="course-room">{course.room}</div>
      </div>
    ));
  };

  // Renk oluşturmak için yardımcı fonksiyon
  const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
  };

  return (
    <div className="App">
      <div className="container split-layout">
        <div className="weekly-schedule">
          <h2>Haftalık Program</h2>
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
          <h2>Ders Seçimi</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Ders kodu veya ismi ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="credits-info">
            <p>Toplam Kredi: {totalCredits}</p>
            <p>Toplam AKTS: {totalECTS}</p>
          </div>

          <div className="selected-courses">
            <h3>Seçili Dersler</h3>
            {selectedCourses.map((course, index) => (
              <div key={index} className="selected-course-item">
                <span>{course.code} - {course.name}</span>
                <span>{course.schedule.map(s => `${s.day} ${s.startHour}:00-${s.endHour}:00`).join(', ')}</span>
                <button 
                  onClick={() => handleCourseRemove(course)}
                  className="remove-button"
                >
                  Çıkar
                </button>
              </div>
            ))}
          </div>

          <div className="available-courses">
            <h3>Mevcut Dersler</h3>
            <div className="course-list">
              {filteredCourses.map((course, index) => (
                <div key={index} className="course-item">
                  <div className="course-info">
                    <strong>{course.code}</strong>
                    <p>{course.name}</p>
                    <p>Kredi: {course.credits} | AKTS: {course.ects}</p>
                    <p>Öğretim Üyesi: {course.lecturer}</p>
                    <p>Derslik: {course.room}</p>
                    <p>
                      {course.schedule.map(s => 
                        `${s.day} ${s.startHour}:00-${s.endHour}:00`
                      ).join(', ')}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleCourseSelect(course)}
                    className="add-button"
                  >
                    Ekle
                  </button>
                </div>
              ))}
            </div>
          </div>

          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="file-input"
          />
        </div>
      </div>
    </div>
  );
}

export default App;
