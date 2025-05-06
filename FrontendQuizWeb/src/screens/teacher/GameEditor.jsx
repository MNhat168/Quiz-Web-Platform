"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import axios from "axios"
import {Gamepad, Plus,ChevronRight, X,Edit,Clock,Award,Book, Save,CheckCircle,ArrowUp,ArrowDown,Trash2,ListOrdered,BookOpen,FilePlus} from "lucide-react"
import Sidebar from "../../layout/teacher/teacherHeader"
import MultipleChoiceForm from "./games/MultipleChoice"
import SortingForm from "./games/Sorting"
import MatchingForm from "./games/Matching"

const GameActivityEditor = () => {
    const { gameId } = useParams()
    const { token } = useAuth()
    const navigate = useNavigate()
    const [game, setGame] = useState(null)
    const [activities, setActivities] = useState([])
    const [gameActivities, setGameActivities] = useState([])
    const [isAddingActivity, setIsAddingActivity] = useState(false)
    const [isCreatingActivity, setIsCreatingActivity] = useState(false)
    const [activityTypes, setActivityTypes] = useState([]);
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")
    const [newActivity, setNewActivity] = useState({
        title: "",
        type: "MULTIPLE_CHOICE",
        instructions: "",
        timeLimit: 60,
        points: 10,
        difficulty: "MEDIUM",
        subject: "",
        topic: "",
        learningObjective: "",
        gradeLevel: "",
        tags: [],
        isPublic: false,
        content: {}
    })

    const [gameActivity, setGameActivity] = useState({
        activityId: "",
        order: 1,
        duration: 60,
        points: 10,
        requirement: {
            isRequired: true,
            minimumScore: 0,
            type: "COMPLETION"
        }
    })

    const [multipleChoiceContent, setMultipleChoiceContent] = useState({
        questions: [
            {
                question: "",
                options: [
                    { text: "", isCorrect: false, explanation: "" },
                    { text: "", isCorrect: false, explanation: "" }
                ],
                explanation: "",
                duration: 60 // Added duration field with default of 60 seconds
            }
        ],
        allowMultipleAnswers: false,
        hints: []
    });

    const [sortingContent, setSortingContent] = useState({
        instructions: "",
        items: [
            { text: "", imageUrl: "", correctPosition: 1 },
            { text: "", imageUrl: "", correctPosition: 2 }
        ],
        hints: []
    })

    const [matchingContent, setMatchingContent] = useState({
        pairs: [
            { item1: "", item2: "", item1ImageUrl: "", item2ImageUrl: "" }
        ],
        shuffleOptions: true,
        hints: []
    })

    // For showing selected activity details
    const [selectedActivities, setSelectedActivities] = useState([]);
    const [currentHint, setCurrentHint] = useState("")

    useEffect(() => {
        const fetchActivityTypes = async () => {
            try {
                const response = await axios.get("http://localhost:8080/api/activities/types", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActivityTypes(response.data);
            } catch (err) {
                console.error("Error fetching activity types:", err);
            }
        };

        fetchActivityTypes();
    }, [token]);

    useEffect(() => {
        // Inside the fetchData function in GameEditor.jsx
        const fetchData = async () => {
            setLoading(true);
            try {
                if (!token) {
                    throw new Error("Must be logged in");
                }

                // Fetch both data sources in parallel for efficiency
                const [activitiesResponse, gameResponse] = await Promise.all([
                    axios.get("http://localhost:8080/api/activities/teacher",
                        { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`http://localhost:8080/api/games/${gameId}`,
                        { headers: { Authorization: `Bearer ${token}` } })
                ]);

                const activitiesData = activitiesResponse.data;
                const gameData = gameResponse.data;

                console.log("Raw game data from API:", gameData);
                console.log("Activities in game data:", gameData.activities ? gameData.activities.length : 0);
                console.log("All teacher activities count:", activitiesData.length);

                // Create a map of activities by ID for faster lookup
                const activitiesMap = {};
                activitiesData.forEach(activity => {
                    activitiesMap[activity.id] = activity;
                });

                // Enrich game activities with full activity details
                const gameActs = gameData.activities || [];
                const enrichedActivities = gameActs.map(gameAct => {
                    const fullActivity = activitiesMap[gameAct.activityId];

                    if (!fullActivity) {
                        console.warn(`Activity with ID ${gameAct.activityId} not found in teacher's activities`);
                    }

                    return {
                        ...gameAct,
                        title: fullActivity?.title || "Unknown Activity",
                        type: fullActivity?.type || gameAct.activityType,
                        timeLimit: fullActivity?.timeLimit,
                        points: fullActivity?.points || gameAct.points,
                        difficulty: fullActivity?.difficulty,
                        subject: fullActivity?.subject,
                        topic: fullActivity?.topic
                    };
                });

                setGame(gameData);
                setActivities(activitiesData);
                setGameActivities(enrichedActivities);

            } catch (err) {
                console.error(err);
                setError(err.message || "Failed to load game data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [gameId, token]);


    // Handle activity content based on type
    useEffect(() => {
        if (newActivity.type === "MULTIPLE_CHOICE") {
            setNewActivity({ ...newActivity, content: multipleChoiceContent })
        } else if (newActivity.type === "SORTING") {
            setNewActivity({ ...newActivity, content: sortingContent })
        } else if (newActivity.type === "MATCHING") {
            setNewActivity({ ...newActivity, content: matchingContent })
        }
    }, [multipleChoiceContent, sortingContent, matchingContent, newActivity.type])

    const createActivity = async () => {
        try {
            setError("")
    
            if (!newActivity.title) {
                setError("Activity title is required")
                return
            }
    
            // Prepare content items based on activity type
            let contentItems = [];
            
            if (newActivity.type === "MULTIPLE_CHOICE") {
                contentItems = multipleChoiceContent.questions.map((question, index) => ({
                    contentId: `q_${index}`,
                    title: `Question ${index + 1}`,
                    instructions: question.question,
                    data: {
                        options: question.options,
                        explanation: question.explanation
                    },
                    duration: question.duration || 60 // Use question-specific duration
                }));
            } else if (newActivity.type === "SORTING") {
                contentItems = [{
                    contentId: "sorting_items",
                    title: "Sorting Activity",
                    instructions: sortingContent.instructions,
                    data: sortingContent.items,
                    duration: sortingContent.items.reduce((total, item) => total + (item.duration || 30), 0) // Sum of all item durations
                }];
            } else if (newActivity.type === "MATCHING") {
                contentItems = [{
                    contentId: "matching_pairs",
                    title: "Matching Activity",
                    instructions: "Match the following items",
                    data: matchingContent.pairs,
                    duration: matchingContent.pairs.reduce((total, pair) => total + (pair.duration || 30), 0) // Sum of all pair durations
                }];
            }
    
            // Create activity with contentItems
            const activityToCreate = {
                ...newActivity,
                contentItems: contentItems
            };
    
            // Create activity
            const response = await axios.post(
                "http://localhost:8080/api/activities",
                activityToCreate,
                { headers: { Authorization: `Bearer ${token}` } }
            )
    
            const { data: activitiesData } = await axios.get(
                "http://localhost:8080/api/activities/teacher",
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setActivities(activitiesData);
            
            // Add activity to activities list
            setActivities([...activities, response.data])
            setSuccessMessage(`Activity "${response.data.title}" created successfully!`)
    
            // Reset form
            resetActivityForm()
            setIsCreatingActivity(false)
    
            // Set as selected activity for adding to game
            setGameActivity({
                ...gameActivity,
                activityId: response.data.id,
                duration: response.data.timeLimit,
                points: response.data.points
            })
    
            setSelectedActivities([response.data])
    
        } catch (err) {
            console.error("Failed to create activity", err)
            setError(err.response?.data || "Failed to create activity")
        }
    }

    const enrichGameActivities = (gameActs, activitiesMap) => {
        return gameActs.map(gameAct => {
            const fullActivity = activitiesMap[gameAct.activityId];

            if (!fullActivity) {
                console.warn(`Activity with ID ${gameAct.activityId} not found in teacher's activities`);
            }

            return {
                ...gameAct,
                title: fullActivity?.title || "Unknown Activity",
                type: fullActivity?.type || gameAct.activityType,
                timeLimit: fullActivity?.timeLimit,
                points: fullActivity?.points || gameAct.points,
                difficulty: fullActivity?.difficulty,
                subject: fullActivity?.subject,
                topic: fullActivity?.topic
            };
        });
    };

    const addActivitiesToGame = async () => {
        try {
            setError("");

            if (selectedActivities.length === 0) {
                setError("Please select at least one activity to add");
                return;
            }

            // Sort activities by their selection order
            const sortedActivities = [...selectedActivities].sort((a, b) => a.selectionOrder - b.selectionOrder);

            // Keep track of successful additions
            let successCount = 0;
            let startOrder = gameActivities.length + 1;

            // Add each activity in order
            for (let i = 0; i < sortedActivities.length; i++) {
                const activity = sortedActivities[i];

                const updatedGameActivity = {
                    activityId: activity.id,
                    order: startOrder + i,
                    duration: activity.timeLimit || 60,
                    points: activity.points || 10,
                    activityType: activity.type,
                    requirement: {
                        isRequired: true,
                        minimumScore: 0,
                        type: "COMPLETION"
                    }
                };

                try {
                    const response = await axios.post(
                        `http://localhost:8080/api/activities/${updatedGameActivity.activityId}/games/${gameId}`,
                        updatedGameActivity,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    // Create a map of activities by ID for faster lookup
                    const activitiesMap = {};
                    activities.forEach(activity => {
                        activitiesMap[activity.id] = activity;
                    });

                    // Use the enriched activities
                    const enrichedActivities = enrichGameActivities(response.data.activities, activitiesMap);

                    setGameActivities(enrichedActivities);
                    setGame(response.data);
                    successCount++;
                } catch (err) {
                    console.error(`Failed to add activity ${activity.title}`, err);
                    // Continue with other activities
                }
            }

            if (successCount > 0) {
                setSuccessMessage(`${successCount} activities added to game successfully!`);
            } else {
                setError("Failed to add any activities to the game");
            }

            // Reset form
            setIsAddingActivity(false);
            setSelectedActivities([]);

        } catch (err) {
            console.error("Failed to add activities to game", err);
            setError(err.response?.data || "Failed to add activities to game");
        }
    };

    const closeAddActivityModal = () => {
        setIsAddingActivity(false);
        setSelectedActivities([]);
    };

    // Remove activity from game
    const removeActivityFromGame = async (activityId) => {
        try {
          const response = await axios.delete(
            `http://localhost:8080/api/activities/${activityId}/games/${gameId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
      
          // Create a map of activities by ID for faster lookup
          const activitiesMap = {};
          activities.forEach(activity => {
            activitiesMap[activity.id] = activity;
          });
          
          // Use the enriched activities
          const enrichedActivities = enrichGameActivities(response.data.activities, activitiesMap);
          
          setGameActivities(enrichedActivities);
          setSuccessMessage("Activity removed from game successfully!");
      
        } catch (err) {
          console.error("Failed to remove activity from game", err);
          setError(err.response?.data || "Failed to remove activity from game");
        }
      };

      const reorderActivities = async (activitiesToReorder) => {
        try {
          const response = await axios.put(
            `http://localhost:8080/api/activities/games/${gameId}/reorder`,
            activitiesToReorder,
            { headers: { Authorization: `Bearer ${token}` } }
          );
      
          // Create a map of activities by ID for faster lookup
          const activitiesMap = {};
          activities.forEach(activity => {
            activitiesMap[activity.id] = activity;
          });
          
          // Use the enriched activities
          const enrichedActivities = enrichGameActivities(response.data.activities, activitiesMap);
          
          setGameActivities(enrichedActivities);
          setSuccessMessage("Game activities reordered successfully!");
      
        } catch (err) {
          console.error("Failed to reorder activities", err);
          setError(err.response?.data || "Failed to reorder activities");
        }
      };

    // Move activity up in order
    const moveActivityUp = (index) => {
        if (index === 0) return

        const updatedActivities = [...gameActivities]
        const temp = updatedActivities[index]
        updatedActivities[index] = updatedActivities[index - 1]
        updatedActivities[index - 1] = temp

        // Update order property
        updatedActivities.forEach((activity, i) => {
            activity.order = i + 1
        })

        reorderActivities(updatedActivities)
    }

    // Move activity down in order
    const moveActivityDown = (index) => {
        if (index === gameActivities.length - 1) return

        const updatedActivities = [...gameActivities]
        const temp = updatedActivities[index]
        updatedActivities[index] = updatedActivities[index + 1]
        updatedActivities[index + 1] = temp

        // Update order property
        updatedActivities.forEach((activity, i) => {
            activity.order = i + 1
        })

        reorderActivities(updatedActivities)
    }

    const selectActivity = (activity) => {
        // Check if activity is already selected
        const alreadySelectedIndex = selectedActivities.findIndex(a => a.id === activity.id);

        if (alreadySelectedIndex >= 0) {
            // If already selected, remove it
            const updatedSelections = [...selectedActivities];
            updatedSelections.splice(alreadySelectedIndex, 1);
            setSelectedActivities(updatedSelections);
        } else {
            // If not selected, add it to the list with current order
            setSelectedActivities([...selectedActivities, {
                ...activity,
                selectionOrder: selectedActivities.length + 1
            }]);
        }
    };

    // Add hint - shared by all activity types
    const addHint = () => {
        if (!currentHint.trim()) return

        if (newActivity.type === "MULTIPLE_CHOICE") {
            setMultipleChoiceContent({
                ...multipleChoiceContent,
                hints: [...multipleChoiceContent.hints, currentHint]
            })
        } else if (newActivity.type === "SORTING") {
            setSortingContent({
                ...sortingContent,
                hints: [...sortingContent.hints, currentHint]
            })
        } else if (newActivity.type === "MATCHING") {
            setMatchingContent({
                ...matchingContent,
                hints: [...matchingContent.hints, currentHint]
            })
        }

        setCurrentHint("")
    }

    // Remove hint - shared by all activity types
    const removeHint = (index) => {
        if (newActivity.type === "MULTIPLE_CHOICE") {
            const updatedHints = [...multipleChoiceContent.hints]
            updatedHints.splice(index, 1)
            setMultipleChoiceContent({
                ...multipleChoiceContent,
                hints: updatedHints
            })
        } else if (newActivity.type === "SORTING") {
            const updatedHints = [...sortingContent.hints]
            updatedHints.splice(index, 1)
            setSortingContent({
                ...sortingContent,
                hints: updatedHints
            })
        } else if (newActivity.type === "MATCHING") {
            const updatedHints = [...matchingContent.hints]
            updatedHints.splice(index, 1)
            setMatchingContent({
                ...matchingContent,
                hints: updatedHints
            })
        }
    }

    // Reset the activity form to initial state
    const resetActivityForm = () => {
        setNewActivity({
            title: "",
            type: "MULTIPLE_CHOICE",
            instructions: "",
            timeLimit: 60,
            points: 10,
            difficulty: "MEDIUM",
            subject: "",
            topic: "",
            learningObjective: "",
            gradeLevel: "",
            tags: [],
            isPublic: false,
            content: {}
        })

        setMultipleChoiceContent({
            question: "",
            options: [
                { text: "", isCorrect: false, explanation: "" },
                { text: "", isCorrect: false, explanation: "" }
            ],
            allowMultipleAnswers: false,
            hints: []
        })

        setSortingContent({
            instructions: "",
            items: [
                { text: "", imageUrl: "", correctPosition: 1 },
                { text: "", imageUrl: "", correctPosition: 2 }
            ],
            hints: []
        })

        setMatchingContent({
            pairs: [
                { item1: "", item2: "", item1ImageUrl: "", item2ImageUrl: "" }
            ],
            shuffleOptions: true,
            hints: []
        })

        setCurrentHint("")
    }

    // Save game changes
    const saveGame = async () => {
        try {
            const response = await axios.put(
                `http://localhost:8080/api/games/${gameId}`,
                game,
                { headers: { Authorization: `Bearer ${token}` } }
            )

            setGame(response.data)
            setSuccessMessage("Game saved successfully!")
        } catch (err) {
            console.error("Failed to save game", err)
            setError(err.response?.data || "Failed to save game")
        }
    }

    if (loading) {
        return <div className="loading">Loading game editor...</div>
    }

    const renderActivityForm = () => {
        switch (newActivity.type) {
            case "MULTIPLE_CHOICE":
                return (
                    <MultipleChoiceForm
                        content={multipleChoiceContent}
                        setContent={setMultipleChoiceContent}
                        currentHint={currentHint}
                        setCurrentHint={setCurrentHint}
                        addHint={addHint}
                        removeHint={removeHint}
                    />
                )
            case "SORTING":
                return (
                    <SortingForm
                        content={sortingContent}
                        setContent={setSortingContent}
                        currentHint={currentHint}
                        setCurrentHint={setCurrentHint}
                        addHint={addHint}
                        removeHint={removeHint}
                    />
                )
            case "MATCHING":
                return (
                    <MatchingForm
                        content={matchingContent}
                        setContent={setMatchingContent}
                        currentHint={currentHint}
                        setCurrentHint={setCurrentHint}
                        addHint={addHint}
                        removeHint={removeHint}
                    />
                )
            default:
                return <div>Unsupported activity type</div>
        }
    }

    return (
        <div className="game-editor-container">
            <Sidebar />

            <div className="game-editor-content">
                {error && <div className="error-message">{error}</div>}
                {successMessage && <div className="success-message">{successMessage}</div>}

                <div className="game-header">
                    <h1><Gamepad size={24} /> {game?.title || "Game Editor"}</h1>
                    <button className="save-game-button" onClick={saveGame}>
                        <Save size={18} /> Save Game
                    </button>
                </div>

                <div className="game-details">
                    <div className="game-form-group">
                        <label>Game Title</label>
                        <input
                            type="text"
                            value={game?.title || ""}
                            onChange={(e) => setGame({ ...game, title: e.target.value })}
                            className="game-input"
                        />
                    </div>

                    <div className="game-form-group">
                        <label>Description</label>
                        <textarea
                            value={game?.description || ""}
                            onChange={(e) => setGame({ ...game, description: e.target.value })}
                            className="game-textarea"
                        />
                    </div>

                    <div className="game-form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            value={game?.subject || ""}
                            onChange={(e) => setGame({ ...game, subject: e.target.value })}
                            className="game-input"
                        />
                    </div>

                    <div className="game-form-group">
                        <label>Grade Level</label>
                        <input
                            type="text"
                            value={game?.gradeLevel || ""}
                            onChange={(e) => setGame({ ...game, gradeLevel: e.target.value })}
                            className="game-input"
                        />
                    </div>
                </div>

                <div className="game-activities-section">
                    <div className="section-header">
                        <h2>Activities</h2>
                        <button
                            className="add-activity-button"
                            onClick={() => setIsAddingActivity(true)}
                        >
                            <Plus size={18} /> Add Activities
                        </button>
                    </div>

                    <div className="game-activities-list">
                        {gameActivities && gameActivities.length > 0 ? (
                            gameActivities.map((activity, index) => (
                                <div key={`${activity.activityId}_${activity.order}`} className="game-activity-item">
                                    <div className="activity-info">
                                        <div className="activity-title">
                                            <span>{index + 1}. {activity.title}</span>
                                            <div className="activity-badges">
                                                <span className="activity-type-badge">
                                                    {activity.type === "MULTIPLE_CHOICE" ? "Multiple Choice" :
                                                        activity.type === "SORTING" ? "Sorting" :
                                                            activity.type === "MATCHING" ? "Matching" : activity.type}
                                                </span>
                                                <span className="activity-points-badge">
                                                    <Award size={14} /> {activity.points || 10} pts
                                                </span>
                                                <span className="activity-time-badge">
                                                    <Clock size={14} /> {activity.duration || 60}s
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="activity-actions">
                                        <button
                                            className="activity-move-button"
                                            onClick={() => moveActivityUp(index)}
                                            disabled={index === 0}
                                        >
                                            <ArrowUp size={16} />
                                        </button>
                                        <button
                                            className="activity-move-button"
                                            onClick={() => moveActivityDown(index)}
                                            disabled={index === gameActivities.length - 1}
                                        >
                                            <ArrowDown size={16} />
                                        </button>
                                        <button
                                            className="activity-edit-button"
                                            onClick={() => navigate(`/teacher/activities/${activity.activityId}/edit`)}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            className="activity-remove-button"
                                            onClick={() => removeActivityFromGame(activity.activityId)}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-activities">
                                <p>No activities added to this game yet.</p>
                                <button
                                    className="add-first-activity"
                                    onClick={() => setIsAddingActivity(true)}
                                >
                                    <Plus size={18} /> Add your first activity
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Activity Modal */}
            {isAddingActivity && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Add Activities to Game</h2>
                            <button className="close-modal" onClick={closeAddActivityModal}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-tabs">
                            <button className={!isCreatingActivity ? "active-tab" : ""} onClick={() => setIsCreatingActivity(false)}>
                                <BookOpen size={16} /> Select Existing
                            </button>
                            <button className={isCreatingActivity ? "active-tab" : ""} onClick={() => setIsCreatingActivity(true)}>
                                <FilePlus size={16} /> Create New
                            </button>
                        </div>

                        {isCreatingActivity ? (
                            <div className="modal-overlay" style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'flex-start',
                                zIndex: 1000,
                                overflowY: 'auto',
                                padding: '20px'
                            }}>
                                <div className="modal-content" style={{
                                    backgroundColor: 'white',
                                    borderRadius: '8px',
                                    width: '100%',
                                    maxWidth: '800px',
                                    maxHeight: '90vh',
                                    overflowY: 'auto',
                                    margin: '20px 0'
                                }}>
                                    <div className="create-activity-form">
                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="activityTitle">Activity Title *</label>
                                                <input
                                                    id="activityTitle"
                                                    type="text"
                                                    value={newActivity.title}
                                                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                                                    className="form-input"
                                                    required
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="activityType">Activity Type</label>
                                                <select
                                                    id="activityType"
                                                    value={newActivity.type}
                                                    onChange={(e) => setNewActivity({ ...newActivity, type: e.target.value })}
                                                    className="form-select"
                                                >
                                                    {activityTypes.map(type => (
                                                        <option key={type} value={type}>
                                                            {type === "MULTIPLE_CHOICE" ? "Multiple Choice" :
                                                                type === "SORTING" ? "Sorting" :
                                                                    type === "MATCHING" ? "Matching" : type}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="timeLimit">Time Limit (seconds)</label>
                                                <input
                                                    id="timeLimit"
                                                    type="number"
                                                    min="10"
                                                    value={newActivity.timeLimit}
                                                    onChange={(e) => setNewActivity({ ...newActivity, timeLimit: parseInt(e.target.value) })}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="points">Points</label>
                                                <input
                                                    id="points"
                                                    type="number"
                                                    min="0"
                                                    value={newActivity.points}
                                                    onChange={(e) => setNewActivity({ ...newActivity, points: parseInt(e.target.value) })}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="difficulty">Difficulty</label>
                                                <select
                                                    id="difficulty"
                                                    value={newActivity.difficulty}
                                                    onChange={(e) => setNewActivity({ ...newActivity, difficulty: e.target.value })}
                                                    className="form-select"
                                                >
                                                    <option value="EASY">Easy</option>
                                                    <option value="MEDIUM">Medium</option>
                                                    <option value="HARD">Hard</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label htmlFor="instructions">Instructions</label>
                                            <textarea
                                                id="instructions"
                                                value={newActivity.instructions}
                                                onChange={(e) => setNewActivity({ ...newActivity, instructions: e.target.value })}
                                                className="form-textarea"
                                            ></textarea>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="subject">Subject</label>
                                                <input
                                                    id="subject"
                                                    type="text"
                                                    value={newActivity.subject}
                                                    onChange={(e) => setNewActivity({ ...newActivity, subject: e.target.value })}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="topic">Topic</label>
                                                <input
                                                    id="topic"
                                                    type="text"
                                                    value={newActivity.topic}
                                                    onChange={(e) => setNewActivity({ ...newActivity, topic: e.target.value })}
                                                    className="form-input"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-row">
                                            <div className="form-group">
                                                <label htmlFor="learningObjective">Learning Objective</label>
                                                <input
                                                    id="learningObjective"
                                                    type="text"
                                                    value={newActivity.learningObjective}
                                                    onChange={(e) => setNewActivity({ ...newActivity, learningObjective: e.target.value })}
                                                    className="form-input"
                                                />
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="gradeLevel">Grade Level</label>
                                                <input
                                                    id="gradeLevel"
                                                    type="text"
                                                    value={newActivity.gradeLevel}
                                                    onChange={(e) => setNewActivity({ ...newActivity, gradeLevel: e.target.value })}
                                                    className="form-input"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <div className="checkbox-group">
                                                <input
                                                    type="checkbox"
                                                    id="isPublic"
                                                    checked={newActivity.isPublic}
                                                    onChange={(e) => setNewActivity({ ...newActivity, isPublic: e.target.checked })}
                                                />
                                                <label htmlFor="isPublic">Make this activity public</label>
                                            </div>
                                        </div>

                                        {renderActivityForm()}

                                        <div className="modal-actions">
                                            <button
                                                className="cancel-button"
                                                onClick={() => setIsCreatingActivity(false)}
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                className="create-button"
                                                onClick={createActivity}
                                            >
                                                Create Activity
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="select-activity-content">
                                <div className="activities-list">
                                    {activities.length > 0 ? (
                                        activities.map((activity) => {
                                            const isSelected = selectedActivities.findIndex(a => a.id === activity.id) >= 0;
                                            return (
                                                <div
                                                    key={activity.id}
                                                    className={`activity-select-item ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => selectActivity(activity)}
                                                >
                                                    <div className="activity-select-info">
                                                        <div className="activity-select-title">
                                                            <span>{activity.title}</span>
                                                            {isSelected && (
                                                                <div className="selection-order">
                                                                    {selectedActivities.find(a => a.id === activity.id).selectionOrder}
                                                                </div>
                                                            )}
                                                            <div className="activity-select-badges">
                                                                <span className="activity-type-badge">
                                                                    {activity.type === "MULTIPLE_CHOICE" ? "Multiple Choice" :
                                                                        activity.type === "SORTING" ? "Sorting" :
                                                                            activity.type === "MATCHING" ? "Matching" : activity.type}
                                                                </span>
                                                                <span className="activity-points-badge">
                                                                    <Award size={14} /> {activity.points || 10} pts
                                                                </span>
                                                                <span className="activity-time-badge">
                                                                    <Clock size={14} /> {activity.timeLimit || 60}s
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="activity-select-details">
                                                            {activity.subject && (
                                                                <span className="activity-subject">
                                                                    <Book size={14} /> {activity.subject}
                                                                </span>
                                                            )}
                                                            {activity.difficulty && (
                                                                <span className={`activity-difficulty ${activity.difficulty.toLowerCase()}`}>
                                                                    {activity.difficulty}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="activity-select-checkbox">
                                                        {isSelected && <CheckCircle size={20} />}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-activities">
                                            <p>You don't have any activities yet. Create one first!</p>
                                            <button
                                                className="create-first-activity"
                                                onClick={() => setIsCreatingActivity(true)}
                                            >
                                                <Plus size={18} /> Create Activity
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="modal-actions">
                                    <button className="cancel-button" onClick={closeAddActivityModal}>
                                        Cancel
                                    </button>
                                    <button
                                        className="add-button"
                                        onClick={addActivitiesToGame}
                                        disabled={selectedActivities.length === 0}
                                    >
                                        Add Selected Activities ({selectedActivities.length})
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default GameActivityEditor