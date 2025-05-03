import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const StudentJoinRoom = () => {
  const { token } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [error, setError] = useState(null);
  const [joined, setJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('LOBBY');
  const navigate = useNavigate();
  const location = useLocation();

  // Check for saved session on component mount
  useEffect(() => {
    const savedAccessCode = localStorage.getItem('studentSessionAccessCode');
    const savedJoinedStatus = localStorage.getItem('studentJoinedStatus') === 'true';

    if (savedAccessCode && savedJoinedStatus) {
      setAccessCode(savedAccessCode);
      setJoined(true);
      setupWebSocket(savedAccessCode);
      fetchParticipants(savedAccessCode);
    } else {
      // Check for access code in URL parameters
      const queryParams = new URLSearchParams(location.search);
      const accessCodeParam = queryParams.get('accessCode');
      if (accessCodeParam) {
        setAccessCode(accessCodeParam.toUpperCase());
      }
    }
  }, [location.search]);

  // Get student ID from token
  const getStudentId = () => {
    try {
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      return tokenPayload.sub;
    } catch (e) {
      console.error("Failed to extract student ID from token:", e);
      setError("Authentication error. Please log in again.");
      return null;
    }
  };

  // Fetch participants for an existing session
  const fetchParticipants = async (code) => {
    try {
      console.log(`Fetching participants for session with code: ${code}`);
      const response = await axios.get(
        `http://localhost:8080/api/sessions/${code}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log("Participants received:", response.data);
      setParticipants(response.data);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      const errorMessage = err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to fetch participants, session may have ended';
      setError(errorMessage);
      // If we can't fetch, session might have ended
      setJoined(false);
      localStorage.removeItem('studentSessionAccessCode');
      localStorage.removeItem('studentJoinedStatus');
    }
  };

  const setupWebSocket = (sessionAccessCode) => {
    console.log('Setting up WebSocket with access code:', sessionAccessCode);

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-sessions'),
      connectHeaders: { Authorization: `Bearer ${token}` },
      onConnect: () => {
        console.log('WebSocket Connected!');
        fetchParticipants(sessionAccessCode);

        client.subscribe(
          `/topic/session/${sessionAccessCode}/participants`,
          (message) => {
            const updatedParticipants = JSON.parse(message.body);
            console.log('Received participants update:', updatedParticipants);
            setParticipants(updatedParticipants);
          }
        );

        client.subscribe(
          `/topic/session/${sessionAccessCode}/status`,
          (message) => {
            const newStatus = message.body;
            setSessionStatus(newStatus);
            console.log(`Session status changed to: ${newStatus}`);
            if (newStatus === 'COMPLETED') {
              setJoined(false);
              localStorage.removeItem('studentSessionAccessCode');
              localStorage.removeItem('studentJoinedStatus');
              if (stompClient) {
                stompClient.deactivate();
              }
              setParticipants([]);
              setAccessCode('');
              setError('This session has ended.');
            }
          }
        );

        const studentId = getStudentId();
        if (studentId) {
          const heartbeatInterval = setInterval(() => {
            if (client.connected) {
              console.log('Sending heartbeat...');
              client.publish({
                destination: `/app/heartbeat/${sessionAccessCode}`,
                body: studentId
              });
            }
          }, 30000);

          return () => clearInterval(heartbeatInterval);
        }
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        setError('Connection error: ' + frame.headers.message);
      },
      onWebSocketClose: () => {
        console.log('WebSocket disconnected');
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    client.activate();
    setStompClient(client);
  };

  useEffect(() => {
    if (sessionStatus === 'ACTIVE' && joined) {
      navigate(`/student/play?accessCode=${accessCode}`);
    }
  }, [sessionStatus, joined, accessCode, navigate]); 
  
  const handleJoinSession = async (e) => {
    e.preventDefault();
    const studentId = getStudentId();
    setLoading(true);
    setError(null);

    try {
      if (!studentId) {
        throw new Error("Unable to identify student. Please login again.");
      }

      // Normalize access code to uppercase
      const normalizedAccessCode = accessCode.toUpperCase();
      console.log(`Attempting to join session with code: ${normalizedAccessCode}, student ID: ${studentId}`);

      // Join the session
      const response = await axios.post(
        `http://localhost:8080/api/sessions/join/${normalizedAccessCode}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Student-Id': studentId
          }
        }
      );

      console.log("Join response:", response.data);

      if (response.data.success) {
        setJoined(true);
        setupWebSocket(normalizedAccessCode);
        fetchParticipants(normalizedAccessCode);

        // Save session info to localStorage
        localStorage.setItem('studentSessionAccessCode', normalizedAccessCode);
        localStorage.setItem('studentJoinedStatus', 'true');
        
        // Update access code in state to normalized version
        setAccessCode(normalizedAccessCode);
      } else {
        setError(response.data.message || "Failed to join session.");
      }
    } catch (err) {
      console.error('Join session failed:', err);
      const errorMessage = err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to join session. Check access code and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSession = async () => {
    const studentId = getStudentId();
    try {
      console.log(`Leaving session with code: ${accessCode}, student ID: ${studentId}`);
      await axios.post(
        `http://localhost:8080/api/sessions/leave/${accessCode}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Student-Id': studentId
          }
        }
      );

      if (stompClient) {
        stompClient.deactivate();
      }
      setJoined(false);
      setParticipants([]);
      setAccessCode('');
      setError(null);

      // Remove session info from localStorage
      localStorage.removeItem('studentSessionAccessCode');
      localStorage.removeItem('studentJoinedStatus');
      
      console.log('Successfully left session');
    } catch (err) {
      console.error('Leave session failed:', err);
      const errorMessage = err.response?.data?.message || 
        err.response?.data?.error || 
        'Failed to leave session.';
      setError(errorMessage);
    }
  };

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [stompClient]);

  return (
    <div className="student-session-container">
      <h1>Join Game Session</h1>

      {!joined ? (
        <form onSubmit={handleJoinSession} className="join-form">
          <div className="form-group">
            <label>Enter Access Code:</label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              placeholder="ABCDEF"
              maxLength="6"
              pattern="[A-Z0-9]{6}"
              required
              className="access-code-input"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" disabled={loading} className="join-button">
            {loading ? 'Joining...' : 'Join Session'}
          </button>
        </form>
      ) : (
        <div className="session-lobby">
          <div className="session-info">
            <h2>Session Code: {accessCode}</h2>
          </div>
          
          <div className="session-status">
            <h2>Session Status: {sessionStatus}</h2>
            {sessionStatus === 'LOBBY' && <p>Waiting for teacher to start the game...</p>}
            {sessionStatus === 'ACTIVE' && <p>Game is in progress!</p>}
          </div>

          <div className="participants-list">
            <h2>Participants in Session ({participants.length})</h2>
            {participants.length === 0 ? (
              <p>Loading participants...</p>
            ) : (
              <ul>
                {participants.map((p) => (
                  <li key={p.userId} className="participant-item">
                    {p.avatarUrl && (
                      <img src={p.avatarUrl} alt="avatar" className="participant-avatar" />
                    )}
                    <span className="participant-name">{p.displayName}</span>
                    <span className={`status-indicator ${p.active ? 'active' : 'inactive'}`} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          <button onClick={handleLeaveSession} className="leave-button">
            Leave Session
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentJoinRoom;