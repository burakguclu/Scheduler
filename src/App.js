import React, { useState } from 'react';
import './App.css';
import { parseCourses } from './utils/courseParser';
import { readExcelFile } from './utils/excelReader';

function App() {
  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [totalCredits, setTotalCredits] = useState(0);
  const [totalECTS, setTotalECTS] = useState(0);
  const [scheduleOptions, setScheduleOptions] = useState([[]]);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [ignoreConflicts, setIgnoreConflicts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const timeSlots = Array.from({ length: 13 }, (_, i) => `${i + 9}:00`);

  const filteredCourses = courses.filter(course => 
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateAllScheduleCombinations = (selectedCourses) => {
    if (!selectedCourses || selectedCourses.length === 0) return [[]];
    
    let combinations = [[]];
    
    selectedCourses.forEach(course => {
      if (!course.sections || course.sections.length === 0) return;
      
      const newCombinations = [];
      combinations.forEach(combo => {
        course.sections.forEach(section => {
          if (!section.schedule) return;
          
          const hasConflict = combo.some(existingSection => {
            if (!existingSection.schedule) return false;
            return existingSection.schedule.some(existingTime => 
              section.schedule.some(newTime => 
                existingTime.day === newTime.day && 
                ((existingTime.startHour <= newTime.startHour && existingTime.endHour > newTime.startHour) ||
                 (existingTime.startHour < newTime.endHour && existingTime.endHour >= newTime.endHour))
              )
            );
          });
          
          if (!hasConflict || ignoreConflicts) {
            newCombinations.push([...combo, { 
              ...section, 
              courseName: course.name,
              courseCode: course.code 
            }]);
          }
        });
      });
      
      if (newCombinations.length > 0) {
        combinations = newCombinations;
      }
    });
    
    return combinations;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const excelData = await readExcelFile(file);
        const parsedCourses = parseCourses(excelData);
        setCourses(parsedCourses || []);
      } catch (error) {
        console.error('Excel dosyası okunurken hata oluştu:', error);
        alert('Excel dosyası okunurken bir hata oluştu!');
      }
    }
  };

  const handleCourseSelect = (course) => {
    if (!course) return;
    
    if (selectedCourses.some(selected => selected.code === course.code)) {
      alert('Bu ders zaten eklenmiş!');
      return;
    }

    const newTotalCredits = totalCredits + Number(course.credits);
    if (newTotalCredits > 25) {
      alert('Maksimum 25 kredi seçebilirsiniz!');
      return;
    }

    const newSelectedCourses = [...selectedCourses, course];
    setSelectedCourses(newSelectedCourses);
    setTotalCredits(newTotalCredits);
    setTotalECTS(prev => prev + Number(course.ects));

    const newOptions = generateAllScheduleCombinations(newSelectedCourses);
    setScheduleOptions(newOptions);
    setCurrentScheduleIndex(0);
  };

  const handlePrevSchedule = () => {
    if (currentScheduleIndex > 0) {
      setCurrentScheduleIndex(prev => prev - 1);
    }
  };

  const handleNextSchedule = () => {
    if (currentScheduleIndex < scheduleOptions.length - 1) {
      setCurrentScheduleIndex(prev => prev + 1);
    }
  };

  const renderScheduleCell = (day, timeSlot) => {
    if (!scheduleOptions[currentScheduleIndex]) return null;
    
    const hour = parseInt(timeSlot.split(':')[0]);
    const currentSchedule = scheduleOptions[currentScheduleIndex];

    const coursesInSlot = currentSchedule.filter(section => 
      section && section.schedule && section.schedule.some(scheduleItem => 
        scheduleItem.day === day && 
        parseInt(scheduleItem.startHour) <= hour && 
        parseInt(scheduleItem.endHour) > hour
      )
    );

    if (coursesInSlot && coursesInSlot.length > 0) {
      const hasConflict = coursesInSlot.length > 1;
      
      return (
        <div 
          className="scheduled-course"
          style={{
            backgroundColor: hasConflict ? '#ff6b6b' : '#87A96B',
            color: hasConflict ? 'white' : '#000000',
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
          {coursesInSlot.map((section, index) => (
            <div key={index}>
              {section.courseCode} - Section {section.code.split('_')[1]}
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="App">
      <div className="container split-layout">
        <div className="weekly-schedule">
          {scheduleOptions.length > 1 && (
            <div className="program-controls">
              <button onClick={handlePrevSchedule} disabled={currentScheduleIndex === 0}>
                ← Önceki Program
              </button>
              <span>Program {currentScheduleIndex + 1} / {scheduleOptions.length}</span>
              <button onClick={handleNextSchedule} disabled={currentScheduleIndex === scheduleOptions.length - 1}>
                Sonraki Program →
              </button>
            </div>
          )}
          <table>
            <thead>
              <tr>
                <th>Saat</th>
                <th>Pazartesi</th>
                <th>Salı</th>
                <th>Çarşamba</th>
                <th>Perşembe</th>
                <th>Cuma</th>
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(timeSlot => (
                <tr key={timeSlot}>
                  <td>{timeSlot}</td>
                  {['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'].map(day => (
                    <td key={day}>
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
                  onChange={() => setIgnoreConflicts(!ignoreConflicts)}
                />
                Ders çakışmalarına izin ver
              </label>
            </div>
          </div>

          <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
          
          <div className="selected-courses">
            <h3>Seçili Dersler</h3>
            {selectedCourses.map((course, index) => (
              <div key={index} className="selected-course-item">
                <div className="course-info">
                  <strong>{course.code}</strong>
                  <p>{course.name}</p>
                  <p>Kredi: {course.credits} | AKTS: {course.ects}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Ders ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="course-list">
            {filteredCourses.map((course, index) => (
              <div key={index} className="course-item" onClick={() => handleCourseSelect(course)}>
                <div className="course-info">
                  <strong>{course.code}</strong>
                  <p>{course.name}</p>
                  <p>Kredi: {course.credits} | AKTS: {course.ects}</p>
                  <p>Section Sayısı: {course.sections ? course.sections.length : 0}</p>
                  <div className="section-list">
                    {course.sections && course.sections.map((section, idx) => (
                      <div key={idx} className="section-info">
                        <small>Section {section.code.split('_')[1]} - {section.lecturer}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
