import { useState } from "react"
import "../../style/teacher-dashboard.css"
import React from "react"
import Sidebar from "../../layout/teacher/teacherSidebar"
import Header from "../../layout/teacher/teacherHeader";

const TeacherDashboard = () => {
  const [currentMonth, setCurrentMonth] = useState("September 2021")
  const [selectedDay, setSelectedDay] = useState(4)

  // Mock data for quizzes
  const recentQuiz = {
    title: "Statistics Math Quiz",
    subject: "Math",
    questions: 12,
    completion: 76,
  }

  const liveQuizzes = [
    {
      id: 1,
      title: "Math Quizzes",
      subject: "Math",
      questions: 12,
      color: "multi",
    },
    {
      id: 2,
      title: "Classic Novel",
      subject: "Literature",
      questions: 12,
      color: "multi-blue",
    },
    {
      id: 3,
      title: "Earth Vocabulary",
      subject: "English",
      questions: 20,
      color: "blue",
    },
    {
      id: 4,
      title: "Tenses Grammar",
      subject: "English",
      questions: 30,
      color: "multi-green",
    },
  ]

  // Calendar data
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"]
  const dates = [1, 2, 3, 4, 5, 6, 7]

  const handlePrevMonth = () => {
    // In a real app, this would change the month
    console.log("Previous month")
  }

  const handleNextMonth = () => {
    // In a real app, this would change the month
    console.log("Next month")
  }

  const handleDayClick = (day) => {
    setSelectedDay(day)
  }

  return (
    <div className="dashboard-container">
      <Header />

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Sidebar */}
        <Sidebar/>

        {/* Main Area */}
        <main className="main-content">
          <div className="hero-section">
            <h2 className="hero-title">What Are You Teaching Today?</h2>
            <div className="search-container">
              <i className="icon-search"></i>
              <input type="text" className="search-input" placeholder="Search for any topic...." />
            </div>
          </div>

          <div className="dashboard-grid">
            {/* Recent Quiz Section */}
            <section className="dashboard-card recent-quiz">
              <h3 className="section-title">Recent Quiz</h3>
              <div className="recent-quiz-card">
                <div className="quiz-info">
                  <h4 className="quiz-title">{recentQuiz.title}</h4>
                  <p className="quiz-meta">
                    {recentQuiz.subject} • {recentQuiz.questions} Questions
                  </p>
                </div>
                <div className="completion-circle">
                  <svg width="60" height="60" viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="#e0e0e0" strokeWidth="6" />
                    <circle
                      cx="30"
                      cy="30"
                      r="24"
                      fill="none"
                      stroke="#2196f3"
                      strokeWidth="6"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (150.8 * recentQuiz.completion) / 100}
                      transform="rotate(-90 30 30)"
                    />
                    <text x="30" y="30" textAnchor="middle" dy=".3em" fontSize="12" fontWeight="bold">
                      {recentQuiz.completion}%
                    </text>
                  </svg>
                </div>
              </div>
            </section>

            {/* Ongoing Quiz Section */}
            <section className="dashboard-card ongoing-quiz">
              <div className="section-header">
                <h3 className="section-title">Ongoing Quiz</h3>
                <a href="#" className="see-all-link">
                  See all
                </a>
              </div>

              <div className="calendar">
                <div className="calendar-header">
                  <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                    &lt;
                  </button>
                  <h4 className="calendar-month">{currentMonth}</h4>
                  <button className="calendar-nav-btn" onClick={handleNextMonth}>
                    &gt;
                  </button>
                </div>

                <div className="calendar-grid">
                  <div className="calendar-days">
                    {days.map((day, index) => (
                      <div key={index} className="calendar-day-name">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="calendar-dates">
                    {dates.map((date) => (
                      <div
                        key={date}
                        className={`calendar-date ${date === selectedDay ? "selected" : ""}`}
                        onClick={() => handleDayClick(date)}
                      >
                        {date}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Live Quiz Section */}
            <section className="dashboard-card live-quiz">
              <div className="section-header">
                <h3 className="section-title">Live Quiz</h3>
                <a href="#" className="see-all-link">
                  See all
                </a>
              </div>

              <div className="quiz-grid">
                {liveQuizzes.map((quiz) => (
                  <div key={quiz.id} className="quiz-card">
                    <div className={`quiz-logo ${quiz.color}`}>
                      <span>QUIZ</span>
                    </div>
                    <div className="quiz-details">
                      <h4 className="quiz-card-title">{quiz.title}</h4>
                      <p className="quiz-card-meta">
                        {quiz.subject} • {quiz.questions} questions
                      </p>
                    </div>
                    <button className="quiz-menu-btn">•••</button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TeacherDashboard
