"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"
import { BookOpen, Plus, Eye, EyeOff, RefreshCw, ChevronRight, Users, Calendar, Send, MapPin, X } from "lucide-react"
import Sidebar from "../../layout/teacher/teacherHeader"
import "../../style/teacher-create-class.css"



const TeacherCreateClass = () => {
  const { token, role } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [className, setClassName] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(false)

  // Store all fetched codes
  const [classCodes, setClassCodes] = useState({})
  // Track which codes should be visible in UI
  const [visibleCodes, setVisibleCodes] = useState({})

  const navigate = useNavigate()

  // Fetch teacher's existing classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true)
        const response = await axios.get("http://localhost:8080/api/classes/teacher", {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Teacher-Id": JSON.parse(atob(token.split(".")[1])).sub,
          },
        })

        // Ensure response data is an array
        const classesData = Array.isArray(response.data) ? response.data : []
        setClasses(classesData)
      } catch (err) {
        console.error("Failed to fetch classes", err)
        setError("Failed to load classes. Please try again later.")
        setClasses([]) // Reset to empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchClasses()
  }, [successMessage, token]) // Refetch when a new class is added successfully

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccessMessage("")

    if (!className.trim()) {
      setError("Class name is required")
      setIsSubmitting(false)
      return
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/classes",
        {
          name: className,
          description: description,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Teacher-Id": JSON.parse(atob(token.split(".")[1])).sub,
          },
        },
      )

      setClassName("")
      setDescription("")
      setSuccessMessage(
        `Class "${response.data.class.name}" created successfully! Class Code: ${response.data.classCode}`,
      )

      // Store the new class code in both states
      const classId = response.data.class.id
      const classCode = response.data.classCode

      setClassCodes((prev) => ({
        ...prev,
        [classId]: classCode,
      }))

      setVisibleCodes((prev) => ({
        ...prev,
        [classId]: classCode, // Make it visible initially
      }))
    } catch (err) {
      console.error("Failed to create class", err)
      setError(err.response?.data || "Failed to create class. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const generateNewCode = async (classId) => {
    try {
      const response = await axios.post(
        `http://localhost:8080/api/classes/${classId}/generate-code`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Teacher-Id": JSON.parse(atob(token.split(".")[1])).sub,
          },
        },
      )

      const newCode = response.data.classCode

      // Update both states with the new code
      setClassCodes((prev) => ({
        ...prev,
        [classId]: newCode,
      }))

      setVisibleCodes((prev) => ({
        ...prev,
        [classId]: newCode,
      }))

      setSuccessMessage(`New class code generated successfully!`)
    } catch (err) {
      console.error("Failed to generate new code", err)
      setError("Failed to generate new class code. Please try again.")
    }
  }

  // Simply toggles visibility of the code (doesn't fetch a new one)
  const toggleShowCode = async (classId) => {
    // If we already have the code, just toggle visibility
    if (classCodes[classId]) {
      setVisibleCodes((prev) => {
        if (prev[classId]) {
          // Hide the code
          const newState = { ...prev }
          delete newState[classId]
          return newState
        } else {
          // Show the code
          return {
            ...prev,
            [classId]: classCodes[classId],
          }
        }
      })
      return
    }

    // If we don't have the code yet, fetch it
    try {
      const response = await axios.post(
        `http://localhost:8080/api/classes/${classId}/generate-code`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Teacher-Id": JSON.parse(atob(token.split(".")[1])).sub,
          },
        },
      )

      const code = response.data.classCode

      // Store the code
      setClassCodes((prev) => ({
        ...prev,
        [classId]: code,
      }))

      // Make it visible
      setVisibleCodes((prev) => ({
        ...prev,
        [classId]: code,
      }))
    } catch (err) {
      console.error("Failed to get class code", err)
      setError("Failed to retrieve class code. Please try again.")
    }
  }

  const viewClassDetails = (classId) => {
    navigate(`/classes/${classId}`)
  }

  return (
    <>
    
    <div className="app-container">
    <Sidebar />
    <div className="main-content1">
      <div className="manage-classes-container">
        <div className="manage-classes-header">
          <BookOpen className="manage-classes-header-icon text-emerald-600" />
          <h1 className="manage-classes-title">Manage Your Classes</h1>
        </div>
    
        <div className="grid md:grid-cols-2 gap-8">
          {/* Create Class Form */}
            <div className="card-header">
            <button 
              onClick={() => setIsModalOpen(true)}
              className="open-modal-button"
            ><Plus className="text-emerald-600" /></button>
              <h2 className="card-title">Create New Class</h2>
            </div>

    
          {/* Your Classes List */}
            <div className="card-header">
              <BookOpen className="text-emerald-600" />
              <h2 className="card-title">Your Classes</h2>
            </div>

            {loading ? (
              <div className="loading-container">
                <svg
                  className="spinner text-emerald-600"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : Array.isArray(classes) && classes.length === 0 ? (
              <div className="empty-state">
                <BookOpen className="empty-icon text-gray-300" />
                <p>You haven't created any classes yet.</p>
              </div>
            ) : (
              <div className="classes-container">
                <div className="classes-scrollable">
                  <div className="grid gap-4">
                    {classes.map((cls) => (
                      <div key={cls.id} className="class-card-horizontal">
                        {/* Column 1: Class Info */}
                        <div className="class-card-section">
                          <h3 className="class-card-title">{cls.name}</h3>
                          {cls.description && <p className="class-description">{cls.description}</p>}
                          <div className="class-card-meta">
                            <Users className="h-4 w-4" />
                            <span>{cls.studentIds?.length || 0} students</span>
                          </div>
                        </div>

                        {/* Code Container (full width below) */}
                        <div className="col-span-2 code-container">
                          {visibleCodes[cls.id] ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="code-box">
                                <span className="font-medium">Code: {visibleCodes[cls.id]}</span>
                                <button
                                  onClick={() => toggleShowCode(cls.id)}
                                  className="code-hide-button"
                                  aria-label="Hide code"
                                >
                                  <EyeOff className="code-icon" />
                                </button>
                              </div>
                              <button
                                onClick={() => generateNewCode(cls.id)}
                                className="code-new-button"
                              >
                                <RefreshCw className="code-icon" />
                                New Code
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => toggleShowCode(cls.id)}
                              className="code-show-button"
                            >
                              <Eye className="code-icon" />
                              Show Class Code
                            </button>
                          )}
                        </div>

                        {/* Column 2: Details Button */}
                        <div className="class-card-section flex items-center justify-end">
                        <button
                          onClick={() => viewClassDetails(cls.id)}
                          className="details-button-horizontal"
                        >
                          <span>Details</span>
                          <ChevronRight className="details-icon" />
                        </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

        </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title-container">
                <Plus className="modal-title-icon" />
                <h2 className="modal-title">Create New Class</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="modal-close-button"
              >
                <X className="modal-close-icon" />
              </button>
            </div>

            {/* Alert bên trong modal*/}
            <div className="modal-alerts-container">
              {error && (
                <div className="compact-alert alert-error">
                  <div className="flex items-start gap-2">
                    <svg className="compact-alert-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="compact-alert-message">{error}</p>
                      <button 
                        onClick={() => setError(null)}
                        className="compact-alert-close"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="compact-alert alert-success">
                  <div className="flex items-start gap-2">
                    <svg className="compact-alert-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <p className="compact-alert-message">{successMessage}</p>
                      <button 
                        onClick={() => setSuccessMessage(null)}
                        className="compact-alert-close"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="className">
                  Class Name*
                </label>
                <input
                  type="text"
                  id="className"
                  className="form-input"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Enter class name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  className="form-textarea"
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your class (optional)"
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="modal-cancel-button"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-submit-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="spinner"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Creating...
                    </>
                  ) : (
                    "Create Class"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
      </div>
      </div>
    </>
  )
}

export default TeacherCreateClass
