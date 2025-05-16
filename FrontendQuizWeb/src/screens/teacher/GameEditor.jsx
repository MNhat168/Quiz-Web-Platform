import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  Gamepad,
  Plus,
  ChevronRight,
  X,
  Edit,
  Clock,
  Award,
  Book,
  Save,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  ListOrdered,
  BookOpen,
  FilePlus,
} from "lucide-react";
import MultipleChoiceForm from "./games/MultipleChoice";
import SortingForm from "./games/Sorting";
import MatchingForm from "./games/Matching";
import TeamChallengeForm from "./games/TeamChallenge";
import FillInBlankForm from "./games/FillInBlank";
import Sidebar from "../../layout/teacher/teacherSidebar";
import Header from "../../layout/teacher/teacherHeader";
import "../../style/game-editor.css";

const GameActivityEditor = () => {
  const { gameId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [activities, setActivities] = useState([]);
  const [gameActivities, setGameActivities] = useState([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const [activeTypeFilter, setActiveTypeFilter] = useState("ALL");
  const [activityTypes, setActivityTypes] = useState([
    "MULTIPLE_CHOICE",
    "SORTING",
    "MATCHING",
    "FILL_IN_BLANK",
  ]);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [hints, setHints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activitiesPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredActivities = activities.filter((activity) => {
    const typeMatch =
      activeTypeFilter === "ALL" || activity.type === activeTypeFilter;
    const searchMatch =
      searchQuery === "" ||
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (activity.subject &&
        activity.subject.toLowerCase().includes(searchQuery.toLowerCase()));

    return typeMatch && searchMatch;
  });

  const totalPages = Math.ceil(filteredActivities.length / activitiesPerPage);
  const indexOfLastActivity = currentPage * activitiesPerPage;
  const indexOfFirstActivity = indexOfLastActivity - activitiesPerPage;
  const paginatedActivities = filteredActivities.slice(
    indexOfFirstActivity,
    indexOfLastActivity
  );
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
    contentItems: [], // Changed from content to contentItems
  });
  const [gameActivity, setGameActivity] = useState({
    activityId: "",
    order: 1,
    duration: 60,
    points: 10,
    requirement: {
      isRequired: true,
      minimumScore: 0,
      type: "COMPLETION",
    },
  });

  const [sortingContent, setSortingContent] = useState({
    instructions: "",
    items: [
      { text: "", imageUrl: "", correctPosition: 1 },
      { text: "", imageUrl: "", correctPosition: 2 },
    ],
    hints: [],
  });

  const [selectedActivities, setSelectedActivities] = useState([]);
  const [currentHint, setCurrentHint] = useState("");

  useEffect(() => {
    const fetchActivityTypes = async () => {
      try {
        const response = await axios.get(
          "http://localhost:8080/api/activities/types",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setActivityTypes(response.data);
      } catch (err) {
        console.error("Error fetching activity types:", err);
      }
    };

    fetchActivityTypes();
  }, [token]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (!token) {
          throw new Error("Must be logged in");
        }
        const [activitiesResponse, gameResponse] = await Promise.all([
          axios.get("http://localhost:8080/api/activities/teacher", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`http://localhost:8080/api/games/${gameId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const activitiesData = activitiesResponse.data;
        const gameData = gameResponse.data;
        const activitiesMap = {};
        activitiesData.forEach((activity) => {
          activitiesMap[activity.id] = activity;
        });
        const gameActs = gameData.activities || [];
        const enrichedActivities = gameActs.map((gameAct) => {
          const fullActivity = activitiesMap[gameAct.activityId];
          return {
            ...gameAct,
            title: fullActivity?.title || "Unknown Activity",
            type: fullActivity?.type || gameAct.activityType,
            timeLimit: fullActivity?.timeLimit,
            points: fullActivity?.points || gameAct.points,
            difficulty: fullActivity?.difficulty,
            subject: fullActivity?.subject,
            topic: fullActivity?.topic,
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

  useEffect(() => {
    // Clear contentItems when switching types
    setNewActivity((prev) => ({
      ...prev,
      contentItems: [],
    }));
  }, [newActivity.type]);

  const createActivity = async () => {
    try {
      setError("");

      if (!newActivity.title) {
        setError("Activity title is required");
        return;
      }
      const activityToCreate = {
        ...newActivity,
        content: null,
        contentItems: newActivity.contentItems.map((item) => {
          const baseItem = {
            contentId: item.contentId,
            data: item.data,
            instructions: "",
          };
          switch (newActivity.type) {
            case "TEAM_CHALLENGE":
              return {
                ...baseItem,
                title: `Team Challenge - ${
                  item.data.prompts[0]?.substring(0, 20) || "Untitled"
                }`, // Truncate long prompts
                duration: item.data.roundTime,
              };
            case "FILL_IN_BLANK":
              return {
                ...baseItem,
                title: `Fill-in-Blank - ${
                  item.data.questionText?.substring(0, 30) || "Untitled"
                }`,
                duration: item.duration, // Correct reference
              };
            case "MULTIPLE_CHOICE":
              return {
                ...baseItem,
                title: `MCQ - ${
                  item.data.question?.substring(0, 30) || "Untitled"
                }`,
                duration: item.data.duration,
              };
            case "MATCHING":
              return {
                ...baseItem,
                title: `Matching - ${item.data.item1 || "Pair"}`,
                duration: item.duration, // Correct reference
              };
            default:
              return {
                ...baseItem,
                title: "Activity",
                duration: 60,
              };
          }
        }),
      };

      const response = await axios.post(
        "http://localhost:8080/api/activities",
        activityToCreate,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data: activitiesData } = await axios.get(
        "http://localhost:8080/api/activities/teacher",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActivities(activitiesData);
      setActivities([...activities, response.data]);
      setSuccessMessage(
        `Activity "${response.data.title}" created successfully!`
      );
      setTimeout(() => setSuccessMessage(""), 5000);
      resetActivityForm();
      setIsCreatingActivity(false);
      setGameActivity({
        ...gameActivity,
        activityId: response.data.id,
        duration: response.data.timeLimit,
        points: response.data.points,
      });
      setSelectedActivities([response.data]);
    } catch (err) {
      console.error("Failed to create activity", err);
      setError(err.response?.data || "Failed to create activity");
    }
  };

  const enrichGameActivities = (gameActs, activitiesMap) => {
    return gameActs.map((gameAct) => {
      const fullActivity = activitiesMap[gameAct.activityId];

      if (!fullActivity) {
        console.warn(
          `Activity with ID ${gameAct.activityId} not found in teacher's activities`
        );
      }
      return {
        ...gameAct,
        title: fullActivity?.title || "Unknown Activity",
        type: fullActivity?.type || gameAct.activityType,
        timeLimit: fullActivity?.timeLimit,
        points: fullActivity?.points || gameAct.points,
        difficulty: fullActivity?.difficulty,
        subject: fullActivity?.subject,
        topic: fullActivity?.topic,
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
      const sortedActivities = [...selectedActivities].sort(
        (a, b) => a.selectionOrder - b.selectionOrder
      );
      let successCount = 0;
      let startOrder = gameActivities.length + 1;
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
            type: "COMPLETION",
          },
        };
        try {
          const response = await axios.post(
            `http://localhost:8080/api/activities/${updatedGameActivity.activityId}/games/${gameId}`,
            updatedGameActivity,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const activitiesMap = {};
          activities.forEach((activity) => {
            activitiesMap[activity.id] = activity;
          });
          const enrichedActivities = enrichGameActivities(
            response.data.activities,
            activitiesMap
          );

          setGameActivities(enrichedActivities);
          setGame(response.data);
          successCount++;
        } catch (err) {
          console.error(`Failed to add activity ${activity.title}`, err);
        }
      }
      if (successCount > 0) {
        setSuccessMessage(
          `${successCount} activities added to game successfully!`
        );
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        setError("Failed to add any activities to the game");
        setTimeout(() => setError(""), 5000);
      }
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

  const removeActivityFromGame = async (activityId) => {
    try {
      const response = await axios.delete(
        `http://localhost:8080/api/activities/${activityId}/games/${gameId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const activitiesMap = {};
      activities.forEach((activity) => {
        activitiesMap[activity.id] = activity;
      });
      const enrichedActivities = enrichGameActivities(
        response.data.activities,
        activitiesMap
      );
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
      const activitiesMap = {};
      activities.forEach((activity) => {
        activitiesMap[activity.id] = activity;
      });
      const enrichedActivities = enrichGameActivities(
        response.data.activities,
        activitiesMap
      );
      setGameActivities(enrichedActivities);
      setSuccessMessage("Game activities reordered successfully!");
    } catch (err) {
      console.error("Failed to reorder activities", err);
      setError(err.response?.data || "Failed to reorder activities");
    }
  };

  const moveActivityUp = (index) => {
    if (index === 0) return;
    const updatedActivities = [...gameActivities];
    const temp = updatedActivities[index];
    updatedActivities[index] = updatedActivities[index - 1];
    updatedActivities[index - 1] = temp;
    updatedActivities.forEach((activity, i) => {
      activity.order = i + 1;
    });
    reorderActivities(updatedActivities);
  };

  const moveActivityDown = (index) => {
    if (index === gameActivities.length - 1) return;
    const updatedActivities = [...gameActivities];
    const temp = updatedActivities[index];
    updatedActivities[index] = updatedActivities[index + 1];
    updatedActivities[index + 1] = temp;
    updatedActivities.forEach((activity, i) => {
      activity.order = i + 1;
    });
    reorderActivities(updatedActivities);
  };

  const selectActivity = (activity) => {
    if (activity.type === "TEAM_CHALLENGE") {
      setGame((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          teamBased: true,
          teamSettings: prev.settings.teamSettings || {
            autoAssignTeams: true,
            numberOfTeams: 2,
            membersPerTeam: 2,
          },
        },
      }));
    }
    const alreadySelectedIndex = selectedActivities.findIndex(
      (a) => a.id === activity.id
    );
    if (alreadySelectedIndex >= 0) {
      const updatedSelections = [...selectedActivities];
      updatedSelections.splice(alreadySelectedIndex, 1);
      setSelectedActivities(updatedSelections);
    } else {
      setSelectedActivities([
        ...selectedActivities,
        {
          ...activity,
          selectionOrder: selectedActivities.length + 1,
        },
      ]);
    }
  };

  const addHint = () => {
    if (!currentHint.trim()) return;
    if (newActivity.type === "MULTIPLE_CHOICE") {
      setMultipleChoiceContent({
        ...multipleChoiceContent,
        hints: [...multipleChoiceContent.hints, currentHint],
      });
    } else if (newActivity.type === "SORTING") {
      setSortingContent({
        ...sortingContent,
        hints: [...sortingContent.hints, currentHint],
      });
    } else if (newActivity.type === "MATCHING") {
      setMatchingContent({
        ...matchingContent,
        hints: [...matchingContent.hints, currentHint],
      });
    } else if (newActivity.type === "TEAM_CHALLENGE") {
      setTeamChallengeContent({
        ...teamChallengeContent,
        hints: [...teamChallengeContent.hints, currentHint],
      });
    } else if (newActivity.type === "FILL_IN_BLANK") {
      setFillInBlankContent({
        ...fillInBlankContent,
        hints: [...fillInBlankContent.hints, currentHint],
      });
    }
    setCurrentHint("");
  };

  const removeHint = (index) => {
    if (newActivity.type === "MULTIPLE_CHOICE") {
      const updatedHints = [...multipleChoiceContent.hints];
      updatedHints.splice(index, 1);
      setMultipleChoiceContent({
        ...multipleChoiceContent,
        hints: updatedHints,
      });
    } else if (newActivity.type === "SORTING") {
      const updatedHints = [...sortingContent.hints];
      updatedHints.splice(index, 1);
      setSortingContent({
        ...sortingContent,
        hints: updatedHints,
      });
    } else if (newActivity.type === "MATCHING") {
      const updatedHints = [...matchingContent.hints];
      updatedHints.splice(index, 1);
      setMatchingContent({
        ...matchingContent,
        hints: updatedHints,
      });
    } else if (newActivity.type === "TEAM_CHALLENGE") {
      const updatedHints = [...teamChallengeContent.hints];
      updatedHints.splice(index, 1);
      setTeamChallengeContent({
        ...teamChallengeContent,
        hints: updatedHints,
      });
    } else if (newActivity.type === "FILL_IN_BLANK") {
      const updatedHints = [...fillInBlankContent.hints];
      updatedHints.splice(index, 1);
      setFillInBlankContent({
        ...fillInBlankContent,
        hints: updatedHints,
      });
    }
  };

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
      contentItems: [], // Reset to empty array instead of using content
    });

    // We don't need to reset these state variables anymore since we're using contentItems
    // setMultipleChoiceContent, setSortingContent, etc. are not needed

    setCurrentHint("");
  };

  const saveGame = async () => {
    try {
      const response = await axios.put(
        `http://localhost:8080/api/games/${gameId}`,
        game,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setGame(response.data);
      setSuccessMessage("Game saved successfully!");
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Failed to save game", err);
      setError(err.response?.data || "Failed to save game");
    }
  };

  if (loading) {
    return <div className="loading">Loading game editor...</div>;
  }
  const renderActivityForm = () => {
    switch (newActivity.type) {
      case "MULTIPLE_CHOICE":
        return (
          <MultipleChoiceForm
            contentItems={newActivity.contentItems}
            setContentItems={(items) =>
              setNewActivity({ ...newActivity, contentItems: items })
            }
            currentHint={currentHint}
            setCurrentHint={setCurrentHint}
            addHint={addHint}
            removeHint={removeHint}
          />
        );
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
        );
      case "MATCHING":
        return (
          <MatchingForm
            contentItems={newActivity.contentItems}
            setContentItems={(items) =>
              setNewActivity({ ...newActivity, contentItems: items })
            }
            shuffleOptions={shuffleOptions}
            setShuffleOptions={setShuffleOptions}
            hints={hints}
            setHints={setHints}
            currentHint={currentHint}
            setCurrentHint={setCurrentHint}
            addHint={addHint}
            removeHint={removeHint}
          />
        );
      case "TEAM_CHALLENGE":
        return (
          <TeamChallengeForm
            contentItems={newActivity.contentItems}
            setContentItems={(items) =>
              setNewActivity({ ...newActivity, contentItems: items })
            }
            currentHint={currentHint}
            setCurrentHint={setCurrentHint}
            addHint={addHint}
            removeHint={removeHint}
          />
        );
      case "FILL_IN_BLANK":
        return (
          <FillInBlankForm
            contentItems={newActivity.contentItems}
            setContentItems={(items) =>
              setNewActivity({ ...newActivity, contentItems: items })
            }
            currentHint={currentHint}
            setCurrentHint={setCurrentHint}
            addHint={addHint}
            removeHint={removeHint}
          />
        );
      default:
        return <div>Unsupported activity type</div>;
    }
  };

  return (
    <>
      <Header />
      <div className="game-manage-container !flex !min-h-screen !bg-gray-50">
        <Sidebar />

        <div className="game-editor-content !flex-1 !p-6 !max-w-6xl !mx-auto !w-full">
          {error && (
            <div className="error-message !bg-red-50 !border-l-4 !border-red-500 !text-red-700 !p-4 !mb-6 !rounded-r-md !shadow-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="success-message !bg-green-50 !border-l-4 !border-green-500 !text-green-700 !p-4 !mb-6 !rounded-r-md !shadow-sm">
              {successMessage}
            </div>
          )}

          <div className="game-header !flex !justify-between !items-center !mb-6">
            <h1 className="!text-2xl !font-bold !text-gray-800 !flex !items-center">
              <Gamepad size={24} className="!text-indigo-600 !mr-3" />{" "}
              {game?.title || "Game Editor"}
            </h1>
            <button
              className="save-game-button !bg-indigo-600 !hover:bg-indigo-700 !text-white !font-medium !py-2 !px-4 !rounded-lg !shadow-sm !transition-all !duration-200 !flex !items-center !gap-2"
              onClick={saveGame}
            >
              <Save size={18} /> Save Game
            </button>
          </div>

          <div className="game-details !bg-white !rounded-xl !shadow-sm !p-6 !mb-8 !border !border-gray-100">
            <div className="game-form-grid !grid !grid-cols-1 !md:grid-cols-2 !gap-6">
              <div className="game-form-group full-width !col-span-full">
                <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                  Game Title
                </label>
                <input
                  type="text"
                  value={game?.title || ""}
                  onChange={(e) => setGame({ ...game, title: e.target.value })}
                  className="game-input !w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors"
                />
              </div>
              <div className="game-form-group full-width !col-span-full">
                <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                  Description
                </label>
                <textarea
                  value={game?.description || ""}
                  onChange={(e) =>
                    setGame({ ...game, description: e.target.value })
                  }
                  className="game-textarea !w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors !min-h-[100px] !resize-y"
                />
              </div>
              <div className="game-form-group half-width">
                <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={game?.subject || ""}
                  onChange={(e) =>
                    setGame({ ...game, subject: e.target.value })
                  }
                  className="game-input !w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors"
                />
              </div>

              <div className="game-form-group half-width">
                <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                  Grade Level
                </label>
                <input
                  type="text"
                  value={game?.gradeLevel || ""}
                  onChange={(e) =>
                    setGame({ ...game, gradeLevel: e.target.value })
                  }
                  className="game-input !w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors"
                />
              </div>
              <div className="form-group checkbox-container !col-span-full">
                <div className="checkbox-group !flex !items-center !space-x-3 !bg-gray-50 !p-4 !rounded-lg !border !border-gray-100">
                  <input
                    type="checkbox"
                    id="teamBased"
                    checked={game?.settings?.teamBased || false}
                    onChange={(e) =>
                      setGame({
                        ...game,
                        settings: {
                          ...game?.settings,
                          teamBased: e.target.checked,
                        },
                      })
                    }
                    className="!w-5 !h-5 !text-indigo-600 !rounded !border-gray-300 !focus:ring-indigo-500 !transition-colors"
                  />
                  <label
                    htmlFor="teamBased"
                    className="!text-gray-700 !font-medium !select-none"
                  >
                    Enable Team-Based Game
                  </label>
                </div>
              </div>

              {game?.settings?.teamBased && (
                <div className="team-settings-subsection !col-span-full !bg-indigo-50 !rounded-lg !p-5 !border !border-indigo-100 !animate-fade-in">
                  <h4 className="!text-indigo-700 !font-medium !mb-4 !flex !items-center">
                    <svg
                      className="!w-5 !h-5 !mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                    </svg>
                    Team Configuration
                  </h4>
                  <div className="form-row !grid !grid-cols-1 !sm:grid-cols-2 !gap-4">
                    <div className="form-group">
                      <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                        Min Team Size
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={game.settings.teamSettings?.minTeamSize || 2}
                        onChange={(e) =>
                          setGame({
                            ...game,
                            settings: {
                              ...game.settings,
                              teamSettings: {
                                ...game.settings.teamSettings,
                                minTeamSize: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="!w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors"
                      />
                    </div>
                    <div className="form-group">
                      <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                        Max Team Size
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={game.settings.teamSettings?.maxTeamSize || 5}
                        onChange={(e) =>
                          setGame({
                            ...game,
                            settings: {
                              ...game.settings,
                              teamSettings: {
                                ...game.settings.teamSettings,
                                maxTeamSize: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="!w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="game-activities-section !bg-white !rounded-xl !shadow-sm !border !border-gray-100 !overflow-hidden !mt-8">
            <div className="section-header !flex !justify-between !items-center !p-6 !border-b !border-gray-100">
              <h2 className="!text-xl !font-semibold !text-gray-800 !flex !items-center">
                <svg
                  className="!w-5 !h-5 !mr-2 !text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  ></path>
                </svg>
                Activities
              </h2>
              <button
                className="add-activity-button !bg-indigo-100 !hover:bg-indigo-200 !text-indigo-700 !font-medium !py-2 !px-4 !rounded-lg !transition-colors !duration-200 !flex !items-center !gap-2"
                onClick={() => setIsAddingActivity(true)}
              >
                <Plus size={18} />
                Add Activities
              </button>
            </div>

            <div className="game-activities-list !p-6">
              {gameActivities && gameActivities.length > 0 ? (
                <div className="!space-y-3">
                  {gameActivities.map((activity, index) => (
                    <div
                      key={`${activity.activityId}_${activity.order}`}
                      className="game-activity-item !bg-white !border !border-gray-200 !rounded-lg !shadow-sm !overflow-hidden !transition-all !duration-200 !hover:shadow-md !hover:border-indigo-200"
                    >
                      <div className="!flex !flex-col !sm:flex-row !sm:items-center !justify-between !p-4 !gap-4">
                        <div className="activity-info !flex-1">
                          <div className="activity-title !flex !items-center !gap-2">
                            <div className="!flex !items-center !justify-center !w-8 !h-8 !rounded-full !bg-indigo-100 !text-indigo-700 !font-semibold !text-sm">
                              {index + 1}
                            </div>
                            <h3 className="!text-lg !font-medium !text-gray-800">
                              {activity.title}
                            </h3>
                          </div>
                          <div className="activity-badges !flex !flex-wrap !gap-2 !mt-2">
                            <span className="activity-type-badge !inline-flex !items-center !px-2.5 !py-0.5 !rounded-full !text-xs !font-medium !bg-blue-100 !text-blue-800">
                              {activity.activityType === "MULTIPLE_CHOICE"
                                ? "Multiple Choice"
                                : activity.activityType === "SORTING"
                                ? "Sorting"
                                : activity.activityType === "MATCHING"
                                ? "Matching"
                                : activity.activityType}
                            </span>
                            <span className="activity-points-badge !inline-flex !items-center !px-2.5 !py-0.5 !rounded-full !text-xs !font-medium !bg-yellow-100 !text-yellow-800">
                              <Award size={14} className="!mr-1" />{" "}
                              {activity.points || 10} pts
                            </span>
                            <span className="activity-time-badge !inline-flex !items-center !px-2.5 !py-0.5 !rounded-full !text-xs !font-medium !bg-green-100 !text-green-800">
                              <Clock size={14} className="!mr-1" />{" "}
                              {activity.duration || 60}s
                            </span>
                          </div>
                        </div>
                        <div className="activity-actions !flex !items-center !gap-2">
                          <button
                            className="activity-move-button !p-2 !rounded-full !text-gray-500 !hover:text-indigo-600 !hover:bg-indigo-50 !transition-colors !disabled:opacity-50 !disabled:cursor-not-allowed"
                            onClick={() => moveActivityUp(index)}
                            disabled={index === 0}
                            title="Move Up"
                          >
                            <ArrowUp size={16} />
                          </button>
                          <button
                            className="activity-move-button !p-2 !rounded-full !text-gray-500 !hover:text-indigo-600 !hover:bg-indigo-50 !transition-colors !disabled:opacity-50 !disabled:cursor-not-allowed"
                            onClick={() => moveActivityDown(index)}
                            disabled={index === gameActivities.length - 1}
                            title="Move Down"
                          >
                            <ArrowDown size={16} />
                          </button>
                          <button
                            className="activity-edit-button !p-2 !rounded-full !text-gray-500 !hover:text-blue-600 !hover:bg-blue-50 !transition-colors"
                            onClick={() =>
                              navigate(
                                `/teacher/activities/${activity.activityId}/edit`
                              )
                            }
                            title="Edit Activity"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            className="activity-remove-button !p-2 !rounded-full !text-gray-500 !hover:text-red-600 !hover:bg-red-50 !transition-colors"
                            onClick={() =>
                              removeActivityFromGame(activity.activityId)
                            }
                            title="Remove Activity"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-activities !bg-gray-50 !rounded-xl !p-10 !flex !flex-col !items-center !justify-center !text-center !border-2 !border-dashed !border-gray-200">
                  <div className="!w-16 !h-16 !bg-indigo-100 !rounded-full !flex !items-center !justify-center !mb-4">
                    <svg
                      className="!w-8 !h-8 !text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      ></path>
                    </svg>
                  </div>
                  <p className="!text-gray-600 !mb-4">
                    No activities added to this game yet.
                  </p>
                  <button
                    className="add-first-activity !bg-indigo-600 !hover:bg-indigo-700 !text-white !font-medium !py-2 !px-4 !rounded-lg !shadow-sm !transition-all !duration-200 !flex !items-center !gap-2"
                    onClick={() => setIsAddingActivity(true)}
                  >
                    <Plus size={18} />
                    Add your first activity
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isAddingActivity && (
          <div className="modal-overlay !fixed !inset-0 !bg-black !bg-opacity-50 !flex !items-center !justify-center !z-50 !p-4 !overflow-y-auto">
            <div className="modal-content activity-modal !bg-white !rounded-xl !shadow-xl !w-full !max-w-4xl !max-h-[90vh] !flex !flex-col !animate-scale-in">
              <div className="modal-header !flex !justify-between !items-center !p-6 !border-b !border-gray-200">
                <h2 className="!text-xl !font-semibold !text-gray-800">
                  Add Activities to Game
                </h2>
                <button
                  className="close-modal !p-2 !rounded-full !text-gray-500 !hover:text-gray-700 !hover:bg-gray-100 !transition-colors"
                  onClick={closeAddActivityModal}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="modal-tabs !flex !border-b !border-gray-200">
                <button
                  className={`!flex-1 !py-3 !px-4 !font-medium !flex !items-center !justify-center !gap-2 !transition-colors ${
                    !isCreatingActivity
                      ? "!bg-indigo-50 !text-indigo-700 !border-b-2 !border-indigo-500 active-tab"
                      : "!text-gray-600 !hover:bg-gray-50"
                  }`}
                  onClick={() => setIsCreatingActivity(false)}
                >
                  <BookOpen size={16} /> Select Existing
                </button>
                <button
                  className={`!flex-1 !py-3 !px-4 !font-medium !flex !items-center !justify-center !gap-2 !transition-colors ${
                    isCreatingActivity
                      ? "!bg-indigo-50 !text-indigo-700 !border-b-2 !border-indigo-500 active-tab"
                      : "!text-gray-600 !hover:bg-gray-50"
                  }`}
                  onClick={() => setIsCreatingActivity(true)}
                >
                  <FilePlus size={16} /> Create New
                </button>
              </div>

              {isCreatingActivity ? (
                <div
                  className="modal-overlay !fixed !inset-0 !bg-black !bg-opacity-50 !flex !items-center !justify-center !z-50 !p-4 !overflow-y-auto"
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "flex-start",
                    zIndex: 1000,
                    overflowY: "auto",
                    padding: "20px",
                  }}
                >
                  <div
                    className="modal-content !bg-white !rounded-xl !shadow-xl !w-full !max-w-4xl !max-h-[90vh] !overflow-y-auto !animate-scale-in"
                    style={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      width: "100%",
                      maxWidth: "1000px",
                      maxHeight: "90vh",
                      overflowY: "auto",
                      margin: "20px 0",
                    }}
                  >
                    <div className="create-activity-form !p-6">
                      <div className="form-row !grid !grid-cols-1 !md:grid-cols-2 !gap-6 !mb-6">
                        <div className="form-group">
                          <label
                            htmlFor="activityTitle"
                            className="!block !text-sm !font-medium !text-gray-700 !mb-1"
                          >
                            Activity Title{" "}
                            <span className="!text-red-500">*</span>
                          </label>
                          <input
                            id="activityTitle"
                            type="text"
                            value={newActivity.title}
                            onChange={(e) =>
                              setNewActivity({
                                ...newActivity,
                                title: e.target.value,
                              })
                            }
                            className="form-input !w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors"
                            required
                            placeholder="Enter activity title"
                          />
                        </div>
                        <div className="form-group">
                          <label
                            htmlFor="activityType"
                            className="!block !text-sm !font-medium !text-gray-700 !mb-1"
                          >
                            Activity Type
                          </label>
                          <select
                            id="activityType"
                            value={newActivity.type}
                            onChange={(e) =>
                              setNewActivity({
                                ...newActivity,
                                type: e.target.value,
                              })
                            }
                            className="form-select !w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors !appearance-none !bg-white"
                          >
                            {activityTypes.map((type) => (
                              <option key={type} value={type}>
                                {type === "MULTIPLE_CHOICE"
                                  ? "Multiple Choice"
                                  : type === "SORTING"
                                  ? "Sorting"
                                  : type === "MATCHING"
                                  ? "Matching"
                                  : type === "FILL_IN_BLANK"
                                  ? "Fill In Blank"
                                  : type}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-row !grid !grid-cols-1 !md:grid-cols-1 !gap-6 !mb-6">
                        <div className="form-group">
                          <label
                            htmlFor="difficulty"
                            className="!block !text-sm !font-medium !text-gray-700 !mb-1"
                          >
                            Difficulty
                          </label>
                          <select
                            id="difficulty"
                            value={newActivity.difficulty}
                            onChange={(e) =>
                              setNewActivity({
                                ...newActivity,
                                difficulty: e.target.value,
                              })
                            }
                            className="form-select !w-full !px-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors !appearance-none !bg-white"
                          >
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HARD">Hard</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group !col-span-full !mb-6">
                        <div className="checkbox-group !flex !items-center !space-x-3 !bg-gray-50 !p-4 !rounded-lg !border !border-gray-100">
                          <input
                            type="checkbox"
                            id="isPublic"
                            checked={newActivity.isPublic}
                            onChange={(e) =>
                              setNewActivity({
                                ...newActivity,
                                isPublic: e.target.checked,
                              })
                            }
                            className="!w-5 !h-5 !text-indigo-600 !rounded !border-gray-300 !focus:ring-indigo-500 !transition-colors"
                          />
                          <label
                            htmlFor="isPublic"
                            className="!text-gray-700 !font-medium !select-none"
                          >
                            Make this activity public
                          </label>
                        </div>
                      </div>

                      <div className="!bg-gray-50 !rounded-xl !p-6 !mb-6 !border !border-gray-200">
                        {renderActivityForm()}
                      </div>

                      <div className="modal-actions !flex !justify-end !gap-3 !mt-6">
                        <button
                          className="cancel-button !px-4 !py-2 !border !border-gray-300 !text-gray-700 !font-medium !rounded-lg !hover:bg-gray-50 !transition-colors"
                          onClick={() => setIsCreatingActivity(false)}
                        >
                          Cancel
                        </button>
                        <button
                          className="create-button !px-4 !py-2 !bg-indigo-600 !hover:bg-indigo-700 !text-white !font-medium !rounded-lg !shadow-sm !transition-colors !flex !items-center !gap-2"
                          onClick={createActivity}
                        >
                          <svg
                            className="!w-5 !h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            ></path>
                          </svg>
                          Create Activity
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="select-activity-content !flex !flex-col !flex-1 !overflow-hidden">
                  <div className="activity-selection-container !flex !flex-1 !overflow-hidden">
                    {/* Vertical sidebar for activity type filters */}
                    <div className="activity-type-sidebar !w-64 !border-r !border-gray-200 !bg-gray-50 !overflow-y-auto">
                      <div className="activity-type-sidebar-header !p-4 !border-b !border-gray-200">
                        <h3 className="!text-sm !font-semibold !text-gray-500 !uppercase !tracking-wider">
                          Filter Types
                        </h3>
                      </div>
                      <div className="activity-type-list !py-2">
                        <button
                          className={`activity-type-item !w-full !text-left !px-4 !py-2 !flex !items-center !gap-2 !transition-colors ${
                            activeTypeFilter === "ALL"
                              ? "!bg-indigo-50 !text-indigo-700 !font-medium active"
                              : "!text-gray-700 !hover:bg-gray-100"
                          }`}
                          onClick={() => setActiveTypeFilter("ALL")}
                        >
                          <ListOrdered size={16} /> All Types
                        </button>

                        {activityTypes.map((type) => {
                          let icon;
                          switch (type) {
                            case "MULTIPLE_CHOICE":
                              icon = <CheckCircle size={16} />;
                              break;
                            case "SORTING":
                              icon = <ArrowDown size={16} />;
                              break;
                            case "MATCHING":
                              icon = <ChevronRight size={16} />;
                              break;
                            case "FILL_IN_BLANK":
                              icon = <Edit size={16} />;
                              break;
                            case "TEAM_CHALLENGE":
                              icon = <Award size={16} />;
                              break;
                            default:
                              icon = <Book size={16} />;
                          }

                          return (
                            <button
                              key={type}
                              className={`activity-type-item !w-full !text-left !px-4 !py-2 !flex !items-center !gap-2 !transition-colors ${
                                activeTypeFilter === type
                                  ? "!bg-indigo-50 !text-indigo-700 !font-medium active"
                                  : "!text-gray-700 !hover:bg-gray-100"
                              }`}
                              onClick={() => setActiveTypeFilter(type)}
                            >
                              {icon}
                              <span className="!truncate">
                                {type === "MULTIPLE_CHOICE"
                                  ? "Multiple Choice"
                                  : type === "SORTING"
                                  ? "Sorting"
                                  : type === "MATCHING"
                                  ? "Matching"
                                  : type === "FILL_IN_BLANK"
                                  ? "Fill In Blank"
                                  : type === "TEAM_CHALLENGE"
                                  ? "Team Challenge"
                                  : type}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Activities list container with pagination */}
                    <div className="activities-list-container !flex-1 !flex !flex-col !overflow-hidden">
                      <div className="activities-list-header !p-4 !border-b !border-gray-200 !flex !justify-between !items-center !bg-white">
                        <h3 className="!font-medium !text-gray-700">
                          Activities ({filteredActivities.length})
                        </h3>
                        <div className="activities-search !relative">
                          <input
                            type="text"
                            placeholder="Search activities..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="activity-search-input !pl-9 !pr-4 !py-2 !border !border-gray-300 !rounded-lg !shadow-sm !focus:ring-2 !focus:ring-indigo-500 !focus:border-indigo-500 !transition-colors !w-64"
                          />
                          <svg
                            className="!w-5 !h-5 !text-gray-400 !absolute !left-3 !top-1/2 !transform !-translate-y-1/2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            ></path>
                          </svg>
                        </div>
                      </div>
                      <div className="activities-list-scrollable !flex-1 !overflow-y-auto !p-4">
                        {filteredActivities.length > 0 ? (
                          <div className="!space-y-3">
                            {paginatedActivities.map((activity) => {
                              const isSelected =
                                selectedActivities.findIndex(
                                  (a) => a.id === activity.id
                                ) >= 0;
                              return (
                                <div
                                  key={activity.id}
                                  className={`activity-select-item !border !rounded-lg !overflow-hidden !transition-all !duration-200 !cursor-pointer !hover:shadow-md ${
                                    isSelected
                                      ? "!border-indigo-500 !bg-indigo-50 selected"
                                      : "!border-gray-200 !bg-white !hover:border-indigo-200"
                                  }`}
                                  onClick={() => selectActivity(activity)}
                                >
                                  <div className="!p-4 !flex !items-center !justify-between !gap-4">
                                    <div className="activity-select-info !flex-1 !min-w-0">
                                      <div className="activity-select-title !flex !items-center !gap-2">
                                        <h3 className="!font-medium !text-gray-800 !truncate">
                                          {activity.title}
                                        </h3>
                                      </div>

                                      <div className="activity-select-badges !flex !flex-wrap !gap-2 !mt-2">
                                        <span className="activity-type-badge !inline-flex !items-center !px-2.5 !py-0.5 !rounded-full !text-xs !font-medium !bg-blue-100 !text-blue-800">
                                          {activity.type === "MULTIPLE_CHOICE"
                                            ? "Multiple Choice"
                                            : activity.type === "SORTING"
                                            ? "Sorting"
                                            : activity.type === "MATCHING"
                                            ? "Matching"
                                            : activity.type === "FILL_IN_BLANK"
                                            ? "Fill In Blank"
                                            : activity.type}
                                        </span>
                                        <span className="activity-points-badge !inline-flex !items-center !px-2.5 !py-0.5 !rounded-full !text-xs !font-medium !bg-yellow-100 !text-yellow-800">
                                          <Award size={14} className="!mr-1" />{" "}
                                          {activity.points || 10} pts
                                        </span>
                                        <span className="activity-time-badge !inline-flex !items-center !px-2.5 !py-0.5 !rounded-full !text-xs !font-medium !bg-green-100 !text-green-800">
                                          <Clock size={14} className="!mr-1" />{" "}
                                          {activity.timeLimit || 60}s
                                        </span>
                                      </div>

                                      <div className="activity-select-details !flex !items-center !gap-3 !mt-2 !text-sm !text-gray-500">
                                        {activity.subject && (
                                          <span className="activity-subject !flex !items-center !gap-1">
                                            <Book size={14} />
                                            {activity.subject}
                                          </span>
                                        )}
                                        {activity.difficulty && (
                                          <span
                                            className={`activity-difficulty !flex !items-center !gap-1 ${
                                              activity.difficulty === "EASY"
                                                ? "!text-green-600"
                                                : activity.difficulty ===
                                                  "MEDIUM"
                                                ? "!text-yellow-600"
                                                : "!text-red-600"
                                            } ${activity.difficulty.toLowerCase()}`}
                                          >
                                            <svg
                                              className="!w-4 !h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                              xmlns="http://www.w3.org/2000/svg"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M13 10V3L4 14h7v7l9-11h-7z"
                                              ></path>
                                            </svg>
                                            {activity.difficulty}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="activity-select-checkbox !flex !items-center !justify-center">
                                      {isSelected && (
                                        <>
                                          <div className="selection-order !absolute !top-0 !left-0 !transform !-translate-x-1/2 !-translate-y-1/2 !w-6 !h-6 !rounded-full !bg-indigo-600 !text-white !flex !items-center !justify-center !text-xs !font-bold">
                                            {
                                              selectedActivities.find(
                                                (a) => a.id === activity.id
                                              ).selectionOrder
                                            }
                                          </div>
                                          <div className="!w-10 !h-10 !rounded-full !bg-indigo-100 !text-indigo-600 !flex !items-center !justify-center">
                                            <CheckCircle size={20} />
                                          </div>
                                        </>
                                      )}
                                      {!isSelected && (
                                        <div className="!w-6 !h-6 !rounded-full !border-2 !border-gray-300"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="no-activities !bg-gray-50 !rounded-xl !p-10 !flex !flex-col !items-center !justify-center !text-center !border-2 !border-dashed !border-gray-200">
                            <div className="!w-16 !h-16 !bg-indigo-100 !rounded-full !flex !items-center !justify-center !mb-4">
                              <svg
                                className="!w-8 !h-8 !text-indigo-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                ></path>
                              </svg>
                            </div>
                            <p className="!text-gray-600 !mb-4">
                              No activities found. Try adjusting your search or
                              filter.
                            </p>
                            <button
                              className="create-first-activity !bg-indigo-600 !hover:bg-indigo-700 !text-white !font-medium !py-2 !px-4 !rounded-lg !shadow-sm !transition-all !duration-200 !flex !items-center !gap-2"
                              onClick={() => setIsCreatingActivity(true)}
                            >
                              <Plus size={18} />
                              Create Activity
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Pagination Controls */}
                      {filteredActivities.length > activitiesPerPage && (
                        <div className="pagination-controls !p-4 !border-t !border-gray-200 !bg-white !flex !items-center !justify-between">
                          <div className="!flex !items-center !gap-2">
                            <button
                              className="pagination-button !p-2 !rounded !text-gray-500 !hover:text-indigo-600 !hover:bg-indigo-50 !transition-colors !disabled:opacity-50 !disabled:cursor-not-allowed"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(1)}
                              title="First Page"
                            >
                              <svg
                                className="!w-5 !h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                                ></path>
                              </svg>
                            </button>
                            <button
                              className="pagination-button !p-2 !rounded !text-gray-500 !hover:text-indigo-600 !hover:bg-indigo-50 !transition-colors !disabled:opacity-50 !disabled:cursor-not-allowed"
                              disabled={currentPage === 1}
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              title="Previous Page"
                            >
                              <svg
                                className="!w-5 !h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 19l-7-7 7-7"
                                ></path>
                              </svg>
                            </button>
                          </div>

                          <span className="pagination-info !text-sm !text-gray-600">
                            Page {currentPage} of {totalPages}
                          </span>

                          <div className="!flex !items-center !gap-2">
                            <button
                              className="pagination-button !p-2 !rounded !text-gray-500 !hover:text-indigo-600 !hover:bg-indigo-50 !transition-colors !disabled:opacity-50 !disabled:cursor-not-allowed"
                              disabled={currentPage === totalPages}
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPages)
                                )
                              }
                              title="Next Page"
                            >
                              <svg
                                className="!w-5 !h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M9 5l7 7-7 7"
                                ></path>
                              </svg>
                            </button>
                            <button
                              className="pagination-button !p-2 !rounded !text-gray-500 !hover:text-indigo-600 !hover:bg-indigo-50 !transition-colors !disabled:opacity-50 !disabled:cursor-not-allowed"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(totalPages)}
                              title="Last Page"
                            >
                              <svg
                                className="!w-5 !h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                ></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="modal-actions !p-4 !border-t !border-gray-200 !bg-gray-50 !flex !justify-end !gap-3">
                    <button
                      className="cancel-button !px-4 !py-2 !border !border-gray-300 !text-gray-700 !font-medium !rounded-lg !hover:bg-gray-100 !transition-colors"
                      onClick={closeAddActivityModal}
                    >
                      Cancel
                    </button>
                    <button
                      className="add-button !px-4 !py-2 !bg-indigo-600 !hover:bg-indigo-700 !text-white !font-medium !rounded-lg !shadow-sm !transition-colors !flex !items-center !gap-2 !disabled:opacity-50 !disabled:cursor-not-allowed"
                      onClick={addActivitiesToGame}
                      disabled={selectedActivities.length === 0}
                    >
                      <svg
                        className="!w-5 !h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        ></path>
                      </svg>
                      Add Selected Activities ({selectedActivities.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default GameActivityEditor;
