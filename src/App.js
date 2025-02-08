import React, { useState, useEffect } from 'react';
import './App.css';
import { parseCourses } from './utils/courseParser';

function App() {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [courses, setCourses] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalECTS, setTotalECTS] = useState(0);

  // Excel verilerini yükle
  useEffect(() => {
    // Burada Excel verilerini parse edip courses state'ine atayacağız
    const excelData = []; // Excel verilerini buraya ekleyeceğiz
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

  const filteredCourses = courses.filter(course => 
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="App">
      <div className="container">
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

          <div className="course-list">
            <h3>Mevcut Dersler</h3>
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
                      {selectedCourses.map(course => {
                        const hour = parseInt(timeSlot.split(':')[0]);
                        const scheduledClass = course.schedule.find(
                          s => s.day === day && 
                          s.startHour <= hour && 
                          s.endHour > hour
                        );
                        if (scheduledClass) {
                          return (
                            <div className="scheduled-course">
                              {course.code}
                              <br />
                              {course.room}
                            </div>
                          );
                        }
                        return null;
                      })}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
