import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const TeacherCreateRoom = () => {
  const { token } = useAuth();
  const [sessionId, setSessionId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [gameState, setGameState] = useState('SETUP'); // SETUP, LOBBY, ACTIVE, COMPLETED
  const [games, setGames] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoCreateAttempted, setAutoCreateAttempted] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const getTeacherId = () => {
    try {
      return JSON.parse(atob(token.split(".")[1])).sub;
    } catch (e) {
      console.error("Failed to extract teacher ID from token:", e);
      return null;
    }
  };

  useEffect(() => {
    const savedSessionId = localStorage.getItem('teacherSessionId');
    const savedAccessCode = localStorage.getItem('teacherAccessCode');
    const savedGameState = localStorage.getItem('teacherGameState');

    if (savedSessionId && savedAccessCode && savedGameState) {
      setSessionId(savedSessionId);
      setAccessCode(savedAccessCode);
      setGameState(savedGameState);

      if (savedGameState === 'LOBBY' || savedGameState === 'ACTIVE') {
        fetchSessionDetails(savedAccessCode);
      }
    }
  }, []);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const classIdParam = queryParams.get('classId');
    const gameIdParam = queryParams.get('gameId');

    if (classIdParam) {
      setSelectedClass(classIdParam);
    }

    if (gameIdParam) {
      setSelectedGame(gameIdParam);
    }
  }, [location.search]);

  useEffect(() => {
    fetchGamesAndClasses();
  }, [token]);

  useEffect(() => {
    const shouldAutoCreate = selectedClass && selectedGame && !autoCreateAttempted && !loading && gameState === 'SETUP';
    if (shouldAutoCreate) {
      const timer = setTimeout(() => {
        console.log("Auto-creating game session...");
        setAutoCreateAttempted(true);
        createRoom();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [selectedClass, selectedGame, loading, autoCreateAttempted, gameState]);

  useEffect(() => {
    if (accessCode && (gameState === 'LOBBY' || gameState === 'ACTIVE')) {
      setupWebSocket();
    }
    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [accessCode, gameState]);

  const fetchSessionDetails = async (code) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/sessions/${code}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const session = response.data;
      setParticipants(session.participants || []);
      const participantsResponse = await axios.get(
        `http://localhost:8080/api/sessions/${code}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (participantsResponse.data) {
        setParticipants(participantsResponse.data);
      }
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      resetSession();
    }
  };

  const resetSession = () => {
    setSessionId('');
    setAccessCode('');
    setGameState('SETUP');
    setParticipants([]);
    localStorage.removeItem('teacherSessionId');
    localStorage.removeItem('teacherAccessCode');
    localStorage.removeItem('teacherGameState');
  };

  const fetchGamesAndClasses = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Starting API calls to fetch games and classes");
      const teacherId = getTeacherId();

      if (!teacherId) {
        throw new Error("Could not determine teacher ID from token");
      }
      let gamesData = [];
      try {
        console.log("Fetching games...");
        const gamesResponse = await axios.get('http://localhost:8080/api/games/teacher', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Teacher-Id': teacherId
          },
          timeout: 5000
        });
        console.log("Games response received:", gamesResponse);
        gamesData = Array.isArray(gamesResponse.data) ? gamesResponse.data : [];
      } catch (gamesError) {
        console.error("Games fetch error:", gamesError);
      }

      let classesData = [];
      try {
        console.log("Fetching classes...");
        const classesResponse = await axios.get('http://localhost:8080/api/classes/teacher', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Teacher-Id': teacherId
          },
          timeout: 5000
        });
        console.log("Classes response received:", classesResponse);
        classesData = Array.isArray(classesResponse.data) ? classesResponse.data : [];
      } catch (classesError) {
        console.error("Classes fetch error:", classesError);
      }
      setGames(gamesData);
      setClasses(classesData);
      setLoading(false);
      if (gamesData.length === 0 && classesData.length === 0) {
        setError("Could not load games or classes. Check console for details.");
      }
    } catch (error) {
      console.error('General error fetching games and classes:', error);
      setError('Failed to load data. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    console.log('Setting up WebSocket with access code:', accessCode);

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-sessions'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('WebSocket Connected!');
        fetchSessionDetails(accessCode);

        client.subscribe(
          `/topic/session/${accessCode}/participants`,
          (message) => {
            try {
              const updatedParticipants = JSON.parse(message.body);
              setParticipants(updatedParticipants);
            } catch (error) {
              console.error('Error parsing participants update:', error);
            }
          }
        );

        client.subscribe(
          `/topic/session/${accessCode}/status`,
          (message) => {
            console.log('Received status update:', message.body);
            setGameState(message.body);
            localStorage.setItem('teacherGameState', message.body);
            if (message.body === 'COMPLETED') {
              setTimeout(() => {
                resetSession();
              }, 300000); // 5 minutes
            }
          }
        );

        client.subscribe(
          `/topic/session/${accessCode}/leaderboard`,
          (message) => {
            try {
              const leaderboardData = JSON.parse(message.body);
              console.log('Received leaderboard update:', leaderboardData);
              setParticipants(currentParticipants => {
                return currentParticipants.map(participant => {
                  const scoreData = leaderboardData.find(
                    item => item.userId === participant.userId
                  );
                  if (scoreData) {
                    return {
                      ...participant,
                      totalScore: scoreData.score
                    };
                  }
                  return participant;
                });
              });
            } catch (error) {
              console.error('Error parsing leaderboard update:', error);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        setError('Connection error: ' + frame.headers.message);
      },
      onWebSocketError: (event) => {
        console.error('WebSocket Error:', event);
        setError('WebSocket connection error. Please try again.');
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket Closed:', event);
        console.log('Close Code:', event.code);
        console.log('Close Reason:', event.reason);
      },
      debug: (str) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    client.activate();
    setStompClient(client);
  };

  const createRoom = async () => {
    const teacherId = getTeacherId();

    if (!teacherId) {
      setError('Unable to identify teacher. Please login again.');
      return;
    }

    try {
      setLoading(true);
      console.log(`Creating room with gameId: ${selectedGame} and classId: ${selectedClass}`);

      const response = await axios.post(
        `http://localhost:8080/api/sessions/create`,
        null,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Teacher-Id': teacherId
          },
          params: {
            gameId: selectedGame,
            classId: selectedClass
          }
        }
      );
      const data = response.data;
      console.log("Room created successfully:", data);
      setSessionId(data.sessionId);
      setAccessCode(data.accessCode);
      setGameState('LOBBY');
      localStorage.setItem('teacherSessionId', data.sessionId);
      localStorage.setItem('teacherAccessCode', data.accessCode);
      localStorage.setItem('teacherGameState', 'LOBBY');
    } catch (error) {
      console.error('Room creation failed:', error);
      setError('Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startGame = async () => {
    const teacherId = getTeacherId();

    try {
      await axios.post(`http://localhost:8080/api/sessions/start/${sessionId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Teacher-Id': teacherId
        },
      });

      setGameState('ACTIVE');
      localStorage.setItem('teacherGameState', 'ACTIVE');
    } catch (error) {
      console.error('Failed to start game:', error);
      setError('Failed to start game. Please try again.');
    }
  };

  const endGame = async () => {
    const teacherId = getTeacherId();

    try {
      await axios.post(`http://localhost:8080/api/sessions/end/${sessionId}`, null, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Teacher-Id': teacherId
        },
      });

      setGameState('COMPLETED');
      localStorage.setItem('teacherGameState', 'COMPLETED');
    } catch (error) {
      console.error('Failed to end game:', error);
      setError('Failed to end game. Please try again.');
    }
  };

  const createNewSession = () => {
    resetSession();
    setAutoCreateAttempted(false);
  };

  const renderSetupPhase = () => (
    <div className="setup-container">
      <h2>Create New Game Session</h2>

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
          <p>Loading games and classes...</p>
        </div>
      ) : error ? (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchGamesAndClasses} className="retry-button">Try Again</button>
        </div>
      ) : (
        <>
          <div className="form-group">
            <label>Select Game:</label>
            <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)}>
              <option value="">-- Select a Game --</option>
              {games.map(game => (
                <option key={game.id} value={game.id}>{game.title}</option>
              ))}
            </select>
            {games.length === 0 && <p className="no-data-message">No games available. Create games first.</p>}
          </div>

          <div className="form-group">
            <label>Select Class:</label>
            <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="">-- Select a Class --</option>
              {classes.map(cls => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
            {classes.length === 0 && <p className="no-data-message">No classes available. Create a class first.</p>}
          </div>

          <button
            onClick={createRoom}
            disabled={!selectedGame || !selectedClass || loading}
            className="create-session-btn"
          >
            {loading ? 'Creating...' : 'Create Game Session'}
          </button>
        </>
      )}
    </div>
  );

  const renderLobbyPhase = () => (
    <div className="lobby-container">
      <h2>Game Lobby</h2>
      <div className="access-code-display">
        <h3>Access Code: <span className="code">{accessCode}</span></h3>
        <p>Share this code with your students to join the session</p>
      </div>

      <div className="participants-list">
        <h3>Participants ({participants.length})</h3>
        {participants.length === 0 ? (
          <p>Waiting for students to join...</p>
        ) : (
          <ul>
            {participants.map((p) => (
              <li key={p.userId}>
                {p.avatarUrl && <img src={p.avatarUrl} alt="avatar" className="participant-avatar" />}
                <span className="participant-name">{p.displayName}</span>
                <span className={`status-indicator ${p.active ? 'active' : 'inactive'}`}></span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={startGame}
        disabled={participants.length === 0}
        className="start-game-btn"
      >
        Start Game
      </button>
    </div>
  );

  const renderActiveGamePhase = () => (
    <div className="active-game-container">
      <h2>Game in Progress</h2>

      <div className="participants-list">
        <h3>Participants ({participants.length})</h3>
        <ul>
          {participants.map((p) => (
            <li key={p.userId}>
              {p.avatarUrl && <img src={p.avatarUrl} alt="avatar" className="participant-avatar" />}
              <span className="participant-name">{p.displayName}</span>
              <span className="participant-score">Score: {p.totalScore}</span>
              <span className={`status-indicator ${p.active ? 'active' : 'inactive'}`}></span>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={endGame}
        className="end-game-btn"
      >
        End Game
      </button>
    </div>
  );

  const renderCompletedPhase = () => (
    <div className="completed-game-container">
      <h2>Game Completed</h2>

      <div className="results-summary">
        <h3>Results Summary</h3>
        {/* Display summary statistics here */}
      </div>

      <div className="participants-results">
        <h3>Participant Results</h3>
        <ul>
          {participants.map((p) => (
            <li key={p.userId}>
              {p.avatarUrl && <img src={p.avatarUrl} alt="avatar" className="participant-avatar" />}
              <span className="participant-name">{p.displayName}</span>
              <span className="participant-score">Score: {p.totalScore !== undefined ? p.totalScore : 0}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={createNewSession} className="new-game-btn">
        Create New Game
      </button>
    </div>
  );

  const renderGamePhase = () => {
    switch (gameState) {
      case 'SETUP':
        return renderSetupPhase();
      case 'LOBBY':
        return renderLobbyPhase();
      case 'ACTIVE':
        return renderActiveGamePhase();
      case 'COMPLETED':
        return renderCompletedPhase();
      default:
        return renderSetupPhase();
    }
  };

  return (
    <div className="teacher-game-session-container">
      <h1>Teacher Game Session</h1>
      {renderGamePhase()}
    </div>
  );
};

export default TeacherCreateRoom;