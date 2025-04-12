"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"
import { BookOpen, Plus, Eye, EyeOff, RefreshCw, ChevronRight, Users } from "lucide-react"
import Sidebar from "../../layout/teacher/teacherHeader"

const TeacherCreateClass = () => {
  const { token, role } = useAuth()
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
    <><Sidebar /><div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <BookOpen className="h-8 w-8 text-emerald-600" />
        <h1 className="text-3xl font-bold text-gray-800">Manage Your Classes</h1>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-md mb-6 shadow-sm">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd" />
            </svg>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Create Class Form */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Plus className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-800">Create New Class</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="className">
                Class Name*
              </label>
              <input
                type="text"
                id="className"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter class name"
                required />
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your class (optional)"
              ></textarea>
            </div>

            <div>
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
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

        {/* Your Classes List */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-semibold text-gray-800">Your Classes</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <svg
                className="animate-spin h-8 w-8 text-emerald-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          ) : Array.isArray(classes) && classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <BookOpen className="h-12 w-12 mb-2 text-gray-300" />
              <p>You haven't created any classes yet.</p>
            </div>
          ) : (
            Array.isArray(classes) && (
              <ul className="divide-y divide-gray-100">
                {classes.map((cls) => (
                  <li key={cls.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{cls.name}</h3>
                          {cls.description && <p className="text-sm text-gray-600 mt-1">{cls.description}</p>}
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <Users className="h-3.5 w-3.5 mr-1" />
                            <span>{cls.studentIds?.length || 0} students enrolled</span>
                          </div>
                        </div>
                        <button
                          onClick={() => viewClassDetails(cls.id)}
                          className="flex items-center text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                        >
                          Details
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </button>
                      </div>

                      <div className="mt-3">
                        {visibleCodes[cls.id] ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-100 border border-gray-200 rounded-md px-3 py-2 font-mono text-sm flex items-center justify-between">
                                <span className="font-medium">Code: {visibleCodes[cls.id]}</span>
                                <button
                                  onClick={() => toggleShowCode(cls.id)}
                                  className="text-gray-500 hover:text-gray-700 ml-2"
                                  aria-label="Hide code"
                                >
                                  <EyeOff className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            <button
                              onClick={() => generateNewCode(cls.id)}
                              className="inline-flex items-center text-xs bg-white border border-gray-300 text-gray-700 rounded-md px-2 py-1 hover:bg-gray-50"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              New Code
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleShowCode(cls.id)}
                            className="inline-flex items-center text-sm text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Show Class Code
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )
          )}
        </div>
      </div>
    </div></>
  )
}

export default TeacherCreateClass
