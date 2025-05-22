"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"
import { BookOpen, Plus, Eye, EyeOff, RefreshCw, ChevronRight, Users, Calendar, Send, MapPin, X } from "lucide-react"
import Sidebar from "../../layout/teacher/teacherSidebar"
import Header from "../../layout/teacher/teacherHeader";
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
      <Header />
      <div className="app-container">
        <Sidebar />
        <div className="main-content1">
          <div className="manage-classes-container !p-6 animate-fade-in">
            <div className="grid md:grid-cols-2 gap-8">
              {/* Create Class Form */}
              <div className="!bg-gradient-to-br !from-emerald-50 !to-teal-50 !rounded-2xl !p-6 !shadow-lg !border !border-emerald-100 !transform !transition-all !duration-300 !hover:shadow-xl !hover:scale-[1.02]">
                <div className="card-header !flex !items-center !gap-4 !mb-4">
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="open-modal-button !bg-white !w-12 !h-12 !rounded-full !flex !items-center !justify-center !shadow-md !text-emerald-600 !transition-all !duration-300 !hover:bg-emerald-500 !hover:text-white !transform !hover:rotate-90"
                  >
                    <span className="!w-6 !h-6 !flex !items-center !justify-center !text-green-500 !text-2xl">+</span>
                  </button>
                  <h2 className="card-title !text-xl !font-bold !text-emerald-800 !relative">
                    Create New Class
                    <span className="!absolute !bottom-0 !left-0 !w-full !h-1 !bg-emerald-300 !rounded-full !transform !scale-x-0 !transition-transform !duration-300 !origin-left !group-hover:scale-x-100"></span>
                  </h2>
                </div>
                
                <div className="!mt-4 !bg-white !bg-opacity-60 !rounded-xl !p-5 !flex !flex-col !items-center !justify-center !min-h-[180px]">
                  <div className="!w-20 !h-20 !bg-emerald-100 !rounded-full !flex !items-center !justify-center !mb-4 animate-pulse-slow">
                    <BookOpen className="!w-10 !h-10 !text-emerald-500" />
                  </div>
                  <p className="!text-emerald-700 !text-center !font-medium">Click the plus button to create your first class!</p>
                  <div className="!mt-3 !flex !space-x-1">
                    <span className="!w-2 !h-2 !bg-emerald-400 !rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                    <span className="!w-2 !h-2 !bg-emerald-400 !rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                    <span className="!w-2 !h-2 !bg-emerald-400 !rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
  
              {/* Your Classes List */}
              <div className="!bg-gradient-to-br !from-blue-50 !to-indigo-50 !rounded-2xl !p-6 !shadow-lg !border !border-blue-100 !relative !overflow-hidden">
                <div className="card-header !flex !items-center !gap-4 !mb-4 !relative !z-10">
                  <div className="!w-10 !h-10 !bg-white !rounded-full !flex !items-center !justify-center !shadow-md">
                    <BookOpen className="!w-5 !h-5 !text-emerald-600" />
                  </div>
                  <h2 className="card-title !text-xl !font-bold !text-blue-800">Your Classes</h2>
                </div>
                
                {/* Decorative elements */}
                <div className="!absolute !top-0 !right-0 !w-32 !h-32 !bg-blue-200 !rounded-full !opacity-10 !transform !translate-x-16 !-translate-y-16"></div>
                <div className="!absolute !bottom-0 !left-0 !w-24 !h-24 !bg-indigo-200 !rounded-full !opacity-10 !transform !-translate-x-12 !translate-y-12"></div>
  
                {loading ? (
                  <div className="loading-container !flex !flex-col !items-center !justify-center !py-10 animate-fade-in">
                    <div className="!relative !w-16 !h-16 !mb-4">
                      <div className="!absolute !inset-0 !border-4 !border-blue-200 !rounded-full"></div>
                      <div className="!absolute !inset-0 !border-4 !border-transparent !border-t-emerald-500 !rounded-full animate-spin"></div>
                      
                      {/* Cute loading face */}
                      <div className="!absolute !inset-0 !flex !items-center !justify-center">
                        <div className="!relative !w-8 !h-8">
                          <div className="!absolute !w-1.5 !h-1.5 !bg-blue-600 !rounded-full !top-2 !left-1.5 animate-blink"></div>
                          <div className="!absolute !w-1.5 !h-1.5 !bg-blue-600 !rounded-full !top-2 !right-1.5 animate-blink" style={{ animationDelay: '0.3s' }}></div>
                          <div className="!absolute !w-3 !h-1.5 !bg-blue-600 !rounded-full !bottom-2 !left-2.5 animate-loading-smile"></div>
                        </div>
                      </div>
                    </div>
                    <p className="!text-blue-600 !font-medium animate-pulse">Loading your classes...</p>
                  </div>
                ) : Array.isArray(classes) && classes.length === 0 ? (
                  <div className="empty-state !flex !flex-col !items-center !justify-center !py-10 !text-center animate-fade-in">
                    <div className="!w-20 !h-20 !bg-blue-100 !rounded-full !flex !items-center !justify-center !mb-4 animate-float-slow">
                      <BookOpen className="empty-icon !w-10 !h-10 !text-blue-300" />
                    </div>
                    <p className="!text-blue-600 !font-medium">You haven't created any classes yet.</p>
                    <p className="!text-blue-500 !text-sm !mt-1">Click the plus button to get started!</p>
                    <div className="!mt-3 !flex !space-x-1">
                      <span className="!w-2 !h-2 !bg-blue-400 !rounded-full animate-bounce" style={{ animationDelay: '0s' }}></span>
                      <span className="!w-2 !h-2 !bg-blue-400 !rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                      <span className="!w-2 !h-2 !bg-blue-400 !rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                ) : (
                  <div className="classes-container !relative !z-10">
                    <div className="classes-scrollable !max-h-[400px] !overflow-y-auto !pr-2 !scrollbar-thin !scrollbar-thumb-blue-200 !scrollbar-track-blue-50">
                      <div className="grid gap-4">
                        {classes.map((cls, index) => (
                          <div 
                            key={cls.id} 
                            className="class-card-horizontal !bg-white !rounded-xl !p-4 !shadow-md !border !border-blue-100 !transition-all !duration-300 !hover:shadow-lg !hover:border-blue-300 animate-slide-up" 
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            {/* Column 1: Class Info */}
                            <div className="class-card-section !flex-1">
                              <h3 className="class-card-title !text-lg !font-bold !text-blue-800 !mb-1">{cls.name}</h3>
                              {cls.description && (
                                <p className="!text-sm !text-gray-700 !mb-3 !leading-relaxed">
                                  {cls.description}
                                </p>
                              )}
                              <div className="class-card-meta !flex !items-center !gap-1.5 !text-xs !text-blue-600 !bg-blue-50 !px-2 !py-1 !rounded-full !w-fit">
                                <Users className="!h-3.5 !w-3.5" />
                                <span className="!font-medium">{cls.studentIds?.length || 0} students</span>
                              </div>
                            </div>
  
                            {/* Code Container (full width below) */}
                            <div className="col-span-2 code-container !mt-3 !border-t !border-blue-100 !pt-3">
                              {visibleCodes[cls.id] ? (
                                <div className="!flex !flex-wrap !items-center !gap-2">
                                  <div className="code-box !bg-indigo-50 !border !border-indigo-200 !rounded-lg !px-3 !py-2 !flex !items-center !justify-between animate-fade-in">
                                    <span className="!font-medium !text-indigo-700">Code: {visibleCodes[cls.id]}</span>
                                    <button
                                      onClick={() => toggleShowCode(cls.id)}
                                      className="code-hide-button !ml-2 !text-indigo-500 !hover:text-indigo-700 !transition-colors"
                                      aria-label="Hide code"
                                    >
                                      <EyeOff className="code-icon !w-4 !h-4" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => generateNewCode(cls.id)}
                                    className="code-new-button !bg-white !border !border-indigo-200 !text-indigo-600 !rounded-lg !px-3 !py-2 !text-sm !font-medium !flex !items-center !gap-1.5 !hover:bg-indigo-50 !transition-colors"
                                  >
                                    <RefreshCw className="code-icon !w-3.5 !h-3.5 animate-spin-slow" />
                                    New Code
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => toggleShowCode(cls.id)}
                                  className="code-show-button !bg-white !border !border-indigo-200 !text-indigo-600 !rounded-lg !px-3 !py-2 !text-sm !font-medium !flex !items-center !gap-1.5 !hover:bg-indigo-50 !transition-colors animate-pulse-subtle"
                                >
                                  <Eye className="code-icon !w-4 !h-4" />
                                  Show Class Code
                                </button>
                              )}
                            </div>
  
                            {/* Column 2: Details Button */}
                            <div className="class-card-section !flex !items-center !justify-end !mt-3">
                              <button
                                onClick={() => viewClassDetails(cls.id)}
                                className="details-button-horizontal !bg-gradient-to-r !from-emerald-500 !to-teal-500 !text-white !rounded-lg !px-4 !py-2 !text-sm !font-medium !flex !items-center !gap-1.5 !transition-all !duration-300 !hover:shadow-md !hover:translate-x-0.5"
                              >
                                <span>Details</span>
                                <ChevronRight className="details-icon !w-4 !h-4 !transition-transform !duration-300 !group-hover:translate-x-0.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
  
            {/* Modal */}
            {isModalOpen && (
              <div className="modal-overlay !fixed !inset-0 !bg-black !bg-opacity-50 !backdrop-blur-sm !flex !items-center !justify-center !z-50 animate-fade-in">
                <div className="modal-container !bg-white !rounded-2xl !shadow-2xl !w-full !max-w-md !mx-auto !overflow-hidden animate-scale-in">
                  <div className="modal-header !bg-gradient-to-r !from-emerald-500 !to-teal-500 !px-6 !py-4 !flex !justify-between !items-center">
                    <div className="modal-title-container !flex !items-center !gap-3">
                      <div className="!w-8 !h-8 !bg-white !bg-opacity-20 !rounded-full !flex !items-center !justify-center">
                        <Plus className="modal-title-icon !w-5 !h-5 !text-white" />
                      </div>
                      <h2 className="modal-title !text-xl !font-bold !text-white">Create New Class</h2>
                    </div>
                    <button 
                      onClick={() => setIsModalOpen(false)}
                      className="modal-close-button !w-8 !h-8 !rounded-full !flex !items-center !justify-center !text-white !bg-white !bg-opacity-20 !hover:bg-opacity-30 !transition-colors"
                    >
                      <X className="modal-close-icon !w-5 !h-5" />
                    </button>
                  </div>
  
                  {/* Alert bên trong modal*/}
                  <div className="modal-alerts-container !px-6 !pt-4">
                    {error && (
                      <div className="compact-alert alert-error !bg-red-50 !border-l-4 !border-red-500 !p-3 !rounded-lg !mb-4 animate-shake">
                        <div className="!flex !items-start !gap-2">
                          <svg className="compact-alert-icon !w-5 !h-5 !text-red-500 !flex-shrink-0 !mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="!flex-1">
                            <p className="compact-alert-message !text-sm !text-red-700">{error}</p>
                            <button 
                              onClick={() => setError(null)}
                              className="compact-alert-close !absolute !top-2 !right-2 !text-red-400 !hover:text-red-600 !transition-colors"
                            >
                              <X className="!w-4 !h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
  
                    {successMessage && (
                      <div className="compact-alert alert-success !bg-green-50 !border-l-4 !border-green-500 !p-3 !rounded-lg !mb-4 animate-bounce-in">
                        <div className="!flex !items-start !gap-2">
                          <svg className="compact-alert-icon !w-5 !h-5 !text-green-500 !flex-shrink-0 !mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div className="!flex-1">
                            <p className="compact-alert-message !text-sm !text-green-700">{successMessage}</p>
                            <button 
                              onClick={() => setSuccessMessage(null)}
                              className="compact-alert-close !absolute !top-2 !right-2 !text-green-400 !hover:text-green-600 !transition-colors"
                            >
                              <X className="!w-4 !h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
  
                  <form onSubmit={handleSubmit} className="modal-form !p-6 !pt-4">
                    <div className="form-group !mb-4">
                      <label className="form-label !block !text-sm !font-medium !text-gray-700 !mb-1" htmlFor="className">
                        Class Name*
                      </label>
                      <input
                        type="text"
                        id="className"
                        className="form-input !w-full !px-4 !py-2.5 !bg-gray-50 !border !border-gray-200 !rounded-lg !focus:ring-2 !focus:ring-emerald-500 !focus:border-emerald-500 !transition-colors"
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        placeholder="Enter class name"
                        required
                      />
                    </div>
  
                    <div className="form-group !mb-6">
                      <label className="form-label !block !text-sm !font-medium !text-gray-700 !mb-1" htmlFor="description">
                        Description
                      </label>
                      <textarea
                        id="description"
                        className="form-textarea !w-full !px-4 !py-2.5 !bg-gray-50 !border !border-gray-200 !rounded-lg !focus:ring-2 !focus:ring-emerald-500 !focus:border-emerald-500 !transition-colors"
                        rows="4"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your class (optional)"
                      ></textarea>
                    </div>
  
                    <div className="modal-actions !flex !justify-end !gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="modal-cancel-button !px-4 !py-2 !bg-gray-100 !text-gray-700 !rounded-lg !text-sm !font-medium !hover:bg-gray-200 !transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="modal-submit-button !px-5 !py-2 !bg-gradient-to-r !from-emerald-500 !to-teal-500 !text-white !rounded-lg !text-sm !font-medium !hover:shadow-md !transition-all !flex !items-center !gap-2"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <svg
                              className="spinner !w-4 !h-4 animate-spin"
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
                                className="!opacity-25"
                              ></circle>
                              <path
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                className="!opacity-75"
                              ></path>
                            </svg>
                            Creating...
                          </>
                        ) : (
                          <>
                            <span>Create Class</span>
                            <span className="!w-5 !h-5 !bg-white !bg-opacity-20 !rounded-full !flex !items-center !justify-center">
                              <ChevronRight className="!w-3 !h-3" />
                            </span>
                          </>
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
      
      {/* Đã chuyển toàn bộ animation sang class Tailwind inline. Nếu cần custom thêm, hãy thêm vào tailwind.config.js */}
    </>
  )
}

export default TeacherCreateClass
