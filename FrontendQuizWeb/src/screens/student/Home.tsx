import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Participant {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  active: boolean;
}

const StudentHome: React.FC = () => {
  const [roomCode, setRoomCode] = useState("");
  const { token } = useAuth();
  const [stompClient, setStompClient] = useState<Client | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('LOBBY');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const navigate = useNavigate();

  // Check for saved session on component mount
  useEffect(() => {
    const savedAccessCode = localStorage.getItem('studentSessionAccessCode');
    const savedJoinedStatus = localStorage.getItem('studentJoinedStatus') === 'true';

    if (savedAccessCode && savedJoinedStatus) {
      setRoomCode(savedAccessCode);
      setJoined(true);
      setupWebSocket(savedAccessCode);
      fetchParticipants(savedAccessCode);
    }
  }, []);

  // Get student ID from token
  const getStudentId = () => {
    try {
      if (!token) return null;
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      return tokenPayload.sub;
    } catch (e) {
      console.error("Failed to extract student ID from token:", e);
      return null;
    }
  };

  // Fetch participants for an existing session
  const fetchParticipants = async (code: string) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/sessions/${code}/participants`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setParticipants(response.data);
    } catch (err) {
      console.error('Failed to fetch participants:', err);
      setJoined(false);
      localStorage.removeItem('studentSessionAccessCode');
      localStorage.removeItem('studentJoinedStatus');
    }
  };

  const setupWebSocket = (sessionAccessCode: string) => {
    if (!token) return;

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
            setParticipants(updatedParticipants);
          }
        );

        client.subscribe(
          `/topic/session/${sessionAccessCode}/status`,
          (message) => {
            const newStatus = message.body;
            setSessionStatus(newStatus);
            if (newStatus === 'ACTIVE') {
              navigate(`/student/play?accessCode=${sessionAccessCode}`);
            } else if (newStatus === 'COMPLETED') {
              setJoined(false);
              localStorage.removeItem('studentSessionAccessCode');
              localStorage.removeItem('studentJoinedStatus');
              if (stompClient) {
                stompClient.deactivate();
              }
              setParticipants([]);
              setRoomCode('');
            }
          }
        );

        const studentId = getStudentId();
        const heartbeatInterval = setInterval(() => {
          if (client.connected) {
            client.publish({
              destination: `/app/heartbeat/${sessionAccessCode}`,
              body: studentId
            });
          }
        }, 30000);

        return () => clearInterval(heartbeatInterval);
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

  const handleJoinSession = async () => {
    if (!token) {
      setError("Please login to join a session");
      return;
    }

    const studentId = getStudentId();
    setLoading(true);
    setError(null);

    try {
      if (!studentId) {
        throw new Error("Unable to identify student. Please login again.");
      }

      const response = await axios.post(
        `http://localhost:8080/api/sessions/join/${roomCode}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'X-Student-Id': studentId
          }
        }
      );

      if (response.data.success) {
        setJoined(true);
        setupWebSocket(roomCode);
        fetchParticipants(roomCode);
        localStorage.setItem('studentSessionAccessCode', roomCode);
        localStorage.setItem('studentJoinedStatus', 'true');
      }
    } catch (err) {
      console.error('Join session failed:', err);
      setError(err.response?.data?.message ||
        err.message ||
        'Failed to join session. Check access code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSession = async () => {
    const studentId = getStudentId();
    try {
      await axios.post(
        `http://localhost:8080/api/sessions/leave/${roomCode}`,
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
      setRoomCode('');
      localStorage.removeItem('studentSessionAccessCode');
      localStorage.removeItem('studentJoinedStatus');
    } catch (err) {
      console.error('Leave session failed:', err);
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
    <div className="!relative !min-h-screen !overflow-hidden">
      {/* 3D Model Background */}
      <div className="!fixed !inset-0 !z-0">
        <iframe
          src="https://my.spline.design/creatorcafeheropage-0cabd7f72e6b730c0afb760093c82350/"
          frameBorder="0"
          width="100%"
          height="100%"
          className="!w-full !h-full"
        ></iframe>
      </div>

      {/* Main Content */}
      <div className="!relative !top-100 !right-20 !z-20 !flex !flex-col !items-center !justify-center">
        {!joined ? (
          <div className="!flex !flex-col !items-center !animate-fade-in">
            <p className="!text-[#ffffff] !text-[18px] !font-bold !mb-4 !animate-fade-in">Nhập Code Room</p>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="!w-64 !p-3 !bg-transparent !border !border-gray-700 !rounded-lg !mb-6 !text-center !text-white !focus:outline-none !focus:border-[#2196F3] !focus:ring-2 !focus:ring-[#2196F3]/50 !transition-all !duration-300"
              placeholder="Enter room code"
              maxLength={6}
              pattern="[A-Z0-9]{6}"
            />
            {error && <p className="!text-red-800 !mb-4 !animate-fade-in">{error}</p>}
            <button 
              onClick={handleJoinSession}
              disabled={loading}
              className="!w-64 !py-4 !bg-[#2196F3] !text-white !font-medium !rounded-full !hover:bg-[#1E88E5] !hover:shadow-lg !hover:shadow-[#2196F3]/20 !active:transform !active:scale-95 !transition-all !duration-300 !relative !overflow-hidden"
            >
              {loading ? (
                <span className="!flex !items-center !justify-center">
                  <svg className="!animate-spin !-ml-1 !mr-2 !h-4 !w-4 !text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="!opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="!opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Joining...
                </span>
              ) : 'VÀO PHÒNG'}
            </button>
          </div>
        ) : (
          <div className="!bg-white !bg-opacity-90 !rounded-2xl !p-8 !shadow-xl !max-w-md !w-full !animate-fade-in">
            <div className="!mb-6">
              <div className="!flex !items-center !mb-2">
                <h2 className="!text-2xl !font-bold !text-gray-800">Session Status: </h2>
                <span className={`!ml-2 !px-2 !py-0.5 !text-sm !rounded-full ${
                  sessionStatus === 'LOBBY' 
                    ? '!bg-yellow-100 !text-yellow-800' 
                    : '!bg-green-100 !text-green-800'
                }`}>
                  {sessionStatus}
                </span>
              </div>
              {sessionStatus === 'LOBBY' && (
                <p className="!text-gray-600 !flex !items-center">
                  <span className="!w-2 !h-2 !bg-yellow-400 !rounded-full !mr-2 !animate-pulse"></span>
                  Waiting for teacher to start the game...
                </p>
              )}
            </div>

            <div className="!mb-6">
              <div className="!flex !items-center !justify-between !mb-4">
                <h3 className="!text-xl !font-semibold !text-gray-800">
                  Participants 
                </h3>
                <span className="!bg-blue-100 !text-blue-800 !px-2 !py-0.5 !rounded-full !text-sm">
                  {participants.length}
                </span>
              </div>
              <div className="!max-h-60 !overflow-y-auto !pr-1">
                {participants.length === 0 ? (
                  <div className="!flex !items-center !justify-center !py-4">
                    <svg className="!animate-spin !h-5 !w-5 !text-gray-500 !mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="!opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="!opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="!text-gray-500">Loading participants...</p>
                  </div>
                ) : (
                  <ul className="!space-y-2">
                    {participants.map((p, index) => (
                      <li 
                        key={p.userId} 
                        className="!flex !items-center !p-2 !bg-gray-50 !rounded-lg !transition-all !duration-300 !hover:bg-gray-100"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl || "/placeholder.svg"} alt="avatar" className="!w-8 !h-8 !rounded-full !mr-3 !border !border-gray-200" />
                        ) : (
                          <div className="!w-8 !h-8 !rounded-full !bg-blue-100 !text-blue-600 !flex !items-center !justify-center !mr-3 !font-medium">
                            {p.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="!text-gray-800 !flex-1">{p.displayName}</span>
                        <span className={`!ml-2 !w-2 !h-2 !rounded-full ${p.active ? '!bg-green-500 !animate-pulse' : '!bg-gray-400'}`} />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              onClick={handleLeaveSession}
              className="!w-full !py-3 !bg-red-500 !text-white !font-medium !rounded-lg !hover:bg-red-600 !hover:shadow-md !active:bg-red-700 !transition-all !duration-300"
            >
              Leave Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentHome;
