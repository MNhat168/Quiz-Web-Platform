import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();

  // Extract teacher ID from token
  const getTeacherId = () => {
    try {
      return JSON.parse(atob(token.split(".")[1])).sub;
    } catch (e) {
      console.error("Failed to extract teacher ID from token:", e);
      return null;
    }
  };

  // Fetch available games and classes for the teacher
  useEffect(() => {
    fetchGamesAndClasses();
  }, [token]); // Only depend on token, not user

  // Setup WebSocket connection when access code is available
  useEffect(() => {
    if (accessCode) {
      setupWebSocket();
    }
    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [accessCode]);

  const fetchGamesAndClasses = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Starting API calls to fetch games and classes");
      const teacherId = getTeacherId();
      
      if (!teacherId) {
        throw new Error("Could not determine teacher ID from token");
      }
      
      // Fetch teacher's games - with better error logging
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
        // Continue with classes even if games fetch failed
      }
      
      // Fetch teacher's classes - with better error logging
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
        // Continue anyway so we at least set loading to false
      }
      
      // Update state even if one of the requests failed
      setGames(gamesData);
      setClasses(classesData);
      setLoading(false);
      
      // Show error if both failed
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
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-sessions'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('WebSocket Connected!');

        // Subscribe to participants updates
        client.subscribe(
          `/topic/session/${accessCode}/participants`,
          (message) => {
            const participantsData = JSON.parse(message.body);
            setParticipants(participantsData);
          }
        );

        // Subscribe to session status updates
        client.subscribe(
          `/topic/session/${accessCode}/status`,
          (message) => {
            const status = message.body;
            setGameState(status);

            if (status === 'COMPLETED') {
              navigate(`/session/${sessionId}/results`);
            }
          }
        );
      },
      onStompError: (frame) => {
        console.error('WebSocket Error:', frame);
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket Closed:', event);
      },
      reconnectDelay: 5000
    });

    client.activate();
    setStompClient(client);
  };

  const createRoom = async () => {
    const teacherId = getTeacherId();
    
    if (!teacherId) {
      alert('Unable to identify teacher. Please login again.');
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:8080/api/sessions/create`, 
        null, // No request body needed 
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
      setSessionId(data.sessionId);
      setAccessCode(data.accessCode);
      setGameState('LOBBY');
    } catch (error) {
      console.error('Room creation failed:', error);
      alert('Failed to create room');
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
    } catch (error) {
      console.error('Failed to start game:', error);
      alert('Failed to start game');
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
    } catch (error) {
      console.error('Failed to end game:', error);
      alert('Failed to end game');
    }
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
            disabled={!selectedGame || !selectedClass}
            className="create-session-btn"
          >
            Create Game Session
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
              <span className="participant-score">Final Score: {p.totalScore}</span>
            </li>
          ))}
        </ul>
      </div>

      <button onClick={() => setGameState('SETUP')} className="new-game-btn">
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