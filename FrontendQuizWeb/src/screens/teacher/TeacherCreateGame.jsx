"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"
import {
  Gamepad,
  Plus,
  ChevronRight,
  Search,
  CheckCircle,
  X,
  Clock,
  Award,
  Book,
  Layers,
  Settings,
  Save,
  Share
} from "lucide-react"
import Sidebar from "../../layout/teacher/teacherSidebar"
import Header from "../../layout/teacher/teacherHeader";
import "../../style/teacher-create-game.css"

const TeacherCreateGame = () => {
  const { token } = useAuth()
  const navigate = useNavigate()

  // Game states
  const [games, setGames] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [createdGameId, setCreatedGameId] = useState(null)
  const [successMessage, setSuccessMessage] = useState("")

  // Form states
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [subject, setSubject] = useState("")
  const [gradeLevel, setGradeLevel] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [tags, setTags] = useState([])
  const [currentTag, setCurrentTag] = useState("")
  const [topics, setTopics] = useState([])
  const [currentTopic, setCurrentTopic] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Game settings
  const [gameSettings, setGameSettings] = useState({
    powerUpsEnabled: true,
    randomizeActivities: false,
    teamBased: false,
    globalTimeLimit: 0,
    pointsStrategy: "CUMULATIVE",
    adaptiveDifficulty: false,
    showFeedbackImmediately: true,
    allowRetries: true,
    maxRetries: 3,
    powerUpSettings: {
      baseThreshold: 100,
      thresholdIncrement: 50,
      maxPowerUpsPerPlayer: 3,
      enabledPowerUpIds: []
    }
  })

  // Fetch teacher's existing games
  useEffect(() => {
    const fetchGames = async () => {
      try {
        setLoading(true)
        const response = await axios.get("http://localhost:8080/api/games/teacher", {
          headers: {
            Authorization: `Bearer ${token}`
          },
        })

        // Ensure response data is an array
        const gamesData = Array.isArray(response.data) ? response.data : []
        setGames(gamesData)
      } catch (err) {
        console.error("Failed to fetch games", err)
        setError("Failed to load games. Please try again later.")
        setGames([]) // Reset to empty array on error
      } finally {
        setLoading(false)
      }
    }

    fetchGames()
  }, [successMessage, token]) // Refetch when a new game is added successfully

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()])
      setCurrentTag("")
    }
  }

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  const handleAddTopic = () => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()])
      setCurrentTopic("")
    }
  }

  const handleRemoveTopic = (topicToRemove) => {
    setTopics(topics.filter(topic => topic !== topicToRemove))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    setSuccessMessage("")

    if (!title.trim()) {
      setError("Game title is required")
      setIsSubmitting(false)
      return
    }

    try {
      const newGame = {
        title,
        description,
        isPublic,
        tags,
        subject,
        gradeLevel,
        topics,
        settings: gameSettings,
        activities: []  // Empty initially, activities will be added in the game editor
      }

      const response = await axios.post(
        "http://localhost:8080/api/games",
        newGame,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      )
      setCreatedGameId(response.data.id)
      setSuccessMessage(`Game "${response.data.title}" created successfully!`)

      // Reset form
      setTitle("")
      setDescription("")
      setSubject("")
      setGradeLevel("")
      setIsPublic(false)
      setTags([])
      setTopics([])

      setTimeout(() => {
        setIsModalOpen(false)
        navigate(`/games/edit/${response.data.id}`)
      }, 1500)

    } catch (err) {
      console.error("Failed to create game", err)
      setError(err.response?.data || "Failed to create game. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const viewGameDetails = (gameId) => {
    navigate(`/games/${gameId}`)
  }

  const editGame = (gameId) => {
    navigate(`/games/edit/${gameId}`)
  }

  return (
    <>
      <Header />
        <div className="game-management-app">
        <Sidebar />
        
        <div className="game-main-content">
          <div className="game-card-grid">

            <div className="card-header">
              <button
                onClick={() => setIsModalOpen(true)}
                className="create-quiz-button"
              >
                Create Game <span className="plus-icon">+</span>
              </button>
            </div>

            {/* Games List Content */}
            {loading ? (
              <div className="game-loading-container">
                <svg
                  className="game-spinner text-purple-600"
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
            ) : Array.isArray(games) && games.length === 0 ? (
              <div className="game-empty-state">
                <Gamepad className="game-empty-icon text-gray-300" />
                <p>You haven't created any games yet.</p>
              </div>
            ) : (
              <div className="game-list-container">
                <div className="game-card-grid">
                  {games.map((game) => (
                    <div key={game.id} className="game-item-card bg-white rounded-lg shadow p-4">
                      {/* Title and Description - Top Left */}
                      <div className="game-header-section mb-2">
                        <h3 className="game-card-title font-semibold text-lg">{game.title}</h3>
                        {game.description && (
                          <p className="game-description text-gray-600 text-sm line-clamp-2">
                            {game.description}
                          </p>
                        )}
                      </div>

                      {/* Meta and Tags - Bottom Left */}
                      <div className="game-meta-section mt-auto">
                        <div className="game-meta flex items-center text-xs text-gray-500 mb-2">
                          <Book className="h-4 w-4 mr-1" />
                          <span>{game.subject}</span>
                          <Layers className="h-4 w-4 ml-3 mr-1" />
                          <span>{game.activities?.length || 0} activities</span>
                        </div>

                        {game.tags && game.tags.length > 0 && (
                          <div className="game-tags-container flex flex-wrap  ">
                            {game.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="game-tag bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded mr-2 mb-2"
                              >
                                {tag}
                              </span>
                            ))}
                            {game.tags.length > 3 && (
                              <span className="game-more-tag bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded italic">
                                +{game.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions - Bottom Right */}
                      <div className="game-actions-section flex justify-end items-center mt-3 pt-3 border-t border-gray-100">
                        <button
                          onClick={() => editGame(game.id)}
                          className="game-edit-button flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => viewGameDetails(game.id)}
                          className="game-edit-button flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm"
                        >
                          <span>Detail</span>
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Game Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title-container">
                <Gamepad className="modal-title-icon" />
                <h2 className="modal-title">Create New Game</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-close-button"
              >
                <X className="modal-close-icon" />
              </button>
            </div>

            {/* Alert container */}
            <div className="modal-alerts-container">
              {error && (
                <div className="modal-overlay ">
                  <div className="compact-alert">
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
                <label className="form-label" htmlFor="title">
                  Game Title*
                </label>
                <input
                  type="text"
                  id="title"
                  className="form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter game title"
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
                  rows="3"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your game (optional)"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label" htmlFor="subject">
                    Subject
                  </label>
                  <select
                    id="subject"
                    className="form-select"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  >
                    <option value="">Select a subject</option>
                    <option value="Math">Math</option>
                    <option value="Science">Science</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Geography">Geography</option>
                    <option value="Art">Art</option>
                    <option value="Music">Music</option>
                    <option value="Physical Education">Physical Education</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Foreign Language">Foreign Language</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="gradeLevel">
                    Grade Level
                  </label>
                  <select
                    id="gradeLevel"
                    className="form-select"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                  >
                    <option value="">Select grade level</option>
                    <option value="K">Kindergarten</option>
                    <option value="1">1st Grade</option>
                    <option value="2">2nd Grade</option>
                    <option value="3">3rd Grade</option>
                    <option value="4">4th Grade</option>
                    <option value="5">5th Grade</option>
                    <option value="6">6th Grade</option>
                    <option value="7">7th Grade</option>
                    <option value="8">8th Grade</option>
                    <option value="9">9th Grade</option>
                    <option value="10">10th Grade</option>
                    <option value="11">11th Grade</option>
                    <option value="12">12th Grade</option>
                    <option value="College">College</option>
                    <option value="Adult">Adult Education</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="form-group">
                <label className="form-label" htmlFor="tags">
                  Tags
                </label>
                <div className="tags-input-container">
                  <div className="tags-display">
                    {tags.map((tag, index) => (
                      <div key={index} className="tag-pill">
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="tag-remove"
                        >
                          <X className="tag-remove-icon" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="tag-input-wrapper">
                    <input
                      type="text"
                      id="tags"
                      className="tag-input"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag and press +"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTag()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="tag-add-button"
                    >
                      <Plus className="tag-add-icon" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Topics */}
              <div className="form-group">
                <label className="form-label" htmlFor="topics">
                  Topics
                </label>
                <div className="tags-input-container">
                  <div className="tags-display">
                    {topics.map((topic, index) => (
                      <div key={index} className="tag-pill topic-pill">
                        <span>{topic}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(topic)}
                          className="tag-remove"
                        >
                          <X className="tag-remove-icon" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="tag-input-wrapper">
                    <input
                      type="text"
                      id="topics"
                      className="tag-input"
                      value={currentTopic}
                      onChange={(e) => setCurrentTopic(e.target.value)}
                      placeholder="Add a topic and +"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddTopic()
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      className="tag-add-button"
                    >
                      <Plus className="tag-add-icon" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Public Toggle */}
              <div className="form-group">
                <div className="public-toggle-container">
                  <label className="form-toggle-label" htmlFor="isPublic">
                    Make this game public for other teachers
                  </label>
                  <label className="switch">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
                <p className="toggle-help-text">
                  Public games can be discovered and used by other teachers in the platform.
                </p>
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
                  {successMessage && createdGameId ? (
                    <div className="mt-4 text-center">
                      <button
                        onClick={() => navigate(`/games/edit/${createdGameId}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                      >
                        Continue to Editor
                      </button>
                    </div>
                  ) : (
                    isSubmitting ? 'Creating...' : 'Create'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default TeacherCreateGame