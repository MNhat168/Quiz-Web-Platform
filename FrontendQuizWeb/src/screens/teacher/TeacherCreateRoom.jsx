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
    <div className="!min-h-screen !flex !items-center !justify-center !p-6 !bg-transparent">
      <div className="!bg-white/90 backdrop-blur-sm !rounded-3xl !shadow-xl !p-10 !max-w-xl !w-full !mx-auto !border !border-gray-100 !animate-fade-in">
        <h2 className="!text-3xl !font-bold !text-gray-800 !mb-6 !text-center !relative">
          <span className="!relative !z-10">Create New Game Session</span>
          <span className="!absolute !bottom-0 !left-0 !right-0 !h-3 !bg-emerald-100 !opacity-50 !-z-10 !transform !-rotate-1"></span>
        </h2>

        {loading ? (
          <div className="!flex !flex-col !items-center !justify-center !py-8 !animate-fade-in">
            <svg
              className="!w-14 !h-14 !text-emerald-600 !animate-spin !mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="!opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="!opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="!text-lg !text-gray-600 !animate-pulse">Loading games and classes...</p>
          </div>
        ) : error ? (
          <div className="!bg-red-50 !border-l-4 !border-red-500 !p-5 !rounded-r-lg !mb-6 !animate-slide-up">
            <div className="!flex !items-center">
              <svg className="!w-7 !h-7 !text-red-500 !mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <p className="!text-base !text-red-700">{error}</p>
            </div>
            <button
              onClick={fetchGamesAndClasses}
              className="!mt-3 !bg-red-100 !text-red-700 !px-5 !py-2.5 !rounded-lg !font-medium !hover:bg-red-200 !transition-colors !duration-300 !flex !items-center !text-base"
            >
              <svg className="!w-5 !h-5 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              Try Again
            </button>
          </div>
        ) : (
          <>
            <div className="!mb-6 !animate-slide-up">
              <label className="!block !text-lg !text-gray-700 !font-medium !mb-2">Select Game:</label>
              <div className="!relative">
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="!appearance-none !block !w-full !px-5 !py-3.5 !text-base !bg-gray-50 !border !border-gray-200 !rounded-xl !text-gray-700 !focus:outline-none !focus:ring-2 !focus:ring-emerald-500 !focus:border-transparent !transition-all !duration-300"
                >
                  <option value="">-- Select a Game --</option>
                  {games.map(game => (
                    <option key={game.id} value={game.id}>{game.title}</option>
                  ))}
                </select>
                <div className="!pointer-events-none !absolute !inset-y-0 !right-0 !flex !items-center !px-4 !text-gray-500">
                  <svg className="!w-5 !h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              {games.length === 0 && (
                <p className="!mt-2 !text-amber-600 !text-base !flex !items-center">
                  <svg className="!w-5 !h-5 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  No games available. Create games first.
                </p>
              )}
            </div>

            <div className="!mb-8 !animate-slide-up !delay-100">
              <label className="!block !text-lg !text-gray-700 !font-medium !mb-2">Select Class:</label>
              <div className="!relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="!appearance-none !block !w-full !px-5 !py-3.5 !text-base !bg-gray-50 !border !border-gray-200 !rounded-xl !text-gray-700 !focus:outline-none !focus:ring-2 !focus:ring-emerald-500 !focus:border-transparent !transition-all !duration-300"
                >
                  <option value="">-- Select a Class --</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
                <div className="!pointer-events-none !absolute !inset-y-0 !right-0 !flex !items-center !px-4 !text-gray-500">
                  <svg className="!w-5 !h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
              {classes.length === 0 && (
                <p className="!mt-2 !text-amber-600 !text-base !flex !items-center">
                  <svg className="!w-5 !h-5 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  No classes available. Create a class first.
                </p>
              )}
            </div>

            <button
              onClick={createRoom}
              disabled={!selectedGame || !selectedClass || loading}
              className="!w-full !py-5 !text-lg !bg-gradient-to-r !from-emerald-500 !to-teal-500 !text-white !font-medium !rounded-xl !shadow-md !hover:shadow-lg !transform !transition-all !duration-300 !hover:-translate-y-1 !active:translate-y-0 !disabled:opacity-50 !disabled:cursor-not-allowed !disabled:hover:transform-none !animate-slide-up !delay-200 !relative !overflow-hidden"
            >
              <span className="!relative !z-10">
                {loading ? (
                  <span className="!flex !items-center !justify-center">
                    <svg className="!animate-spin !-ml-1 !mr-2 !h-5 !w-5 !text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="!opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="!opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : 'Create Game Session'}
              </span>
              <span className="!absolute !inset-0 !bg-gradient-to-r !from-emerald-400/0 !via-white/20 !to-emerald-400/0 !transform !translate-x-[-100%] !animate-shimmer"></span>
            </button>
          </>
        )}
      </div>
    </div>
  );
  const renderLobbyPhase = () => (
    <div className="!min-h-screen !flex !flex-col !items-center !justify-center !p-6 !bg-transparent">
      {/* Card: Game Lobby + Access Code + Participants Counter + Start Game */}
      <div className="!bg-white/20 backdrop-blur-sm !rounded-3xl !shadow-xl !p-10 !max-w-xl !w-full !mx-auto !border !border-gray-100 !mb-10">
        <h2 className="!text-4xl !font-bold !text-gray-800 !mb-8 !text-center">Game Lobby</h2>
        <div className="!bg-gradient-to-r !from-indigo-50 !to-purple-50 !rounded-2xl !p-8 !mb-8 !text-center">
          <h3 className="!text-2xl !text-gray-700 !mb-5 !font-semibold">Access Code:</h3>
          <div className="!flex !items-center !justify-center !mb-6">
            <span className="!bg-white/90 backdrop-blur-sm !px-10 !py-5 !rounded-2xl !text-4xl !font-extrabold !tracking-widest !text-indigo-700 !shadow-md !border !border-indigo-200 !animate-pulse-slow">
              {accessCode}
            </span>
            <button
              className="!ml-4 !p-3 !bg-indigo-100 !text-indigo-600 !rounded-xl !hover:bg-indigo-200 !transition-colors !duration-300"
              onClick={() => navigator.clipboard.writeText(accessCode)}
              title="Copy to clipboard"
            >
              <svg className="!w-7 !h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path>
              </svg>
            </button>
          </div>
          <p className="!text-lg !text-gray-600 !flex !items-center !justify-center mb-8">
            <svg className="!w-6 !h-6 !mr-2 !text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Share this code with your students to join the session
          </p>
          <div className="!flex !items-center !justify-between !gap-6">
            <span className="!bg-indigo-100 !text-indigo-800 !px-6 !py-3 !rounded-full !text-xl !font-semibold">{participants.length}</span>
            <button
              onClick={startGame}
              disabled={participants.length === 0}
              className="!py-3 !px-10 !text-xl !bg-gradient-to-r !from-indigo-500 !to-purple-500 !text-white !font-bold !rounded-xl !shadow-lg !hover:shadow-xl !transition-all !duration-300 !hover:-translate-y-1 !active:translate-y-0 !disabled:opacity-50 !disabled:cursor-not-allowed"
            >
              Start Game
            </button>
          </div>
        </div>
      </div>

      {/* Participants List: Không căn giữa, tối ưu chiều ngang */}
      <div className="!w-full !flex !flex-wrap !gap-6 !justify-start !items-start !max-w-5xl">
        {participants.length === 0 ? (
          <div className="!text-gray-500 !text-lg">Waiting for students to join...</div>
        ) : (
          participants.map((p, index) => (
            <div
              key={p.userId}
              className="!flex !flex-col !items-center !p-5 !bg-white !rounded-xl !shadow-md !hover:shadow-lg !transition-all !duration-300 !animate-slide-right !w-[180px]"
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="!relative !mb-2">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl || "/placeholder.svg"} alt="avatar" className="!w-16 !h-16 !rounded-full !border-2 !border-gray-200" />
                ) : (
                  <div className="!w-16 !h-16 !rounded-full !bg-gradient-to-r !from-green-300 !to-teal-300 !flex !items-center !justify-center !text-white !text-xl !font-bold">
                    {p.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`!absolute !bottom-0 !right-0 !w-4 !h-4 !rounded-full !border-2 !border-white ${p.active ? '!bg-green-500 !animate-pulse' : '!bg-gray-400'}`} />
              </div>
              <span className="!text-base !text-gray-800 !font-medium !text-center !truncate !w-full !mb-2">{p.displayName}</span>
              <div className="!flex !items-center !w-full !mb-1">
                <div className="!w-full !bg-gray-200 !rounded-full !h-2.5">
                  <div
                    className="!bg-gradient-to-r !from-green-500 !to-teal-500 !h-2.5 !rounded-full"
                    style={{
                      width: `${Math.min(100, (p.totalScore / Math.max(...participants.map(p => p.totalScore || 1))) * 100)}%`,
                      transition: 'width 1s ease-in-out'
                    }}
                  ></div>
                </div>
              </div>
              <span className="!text-sm !font-bold !text-green-600">{p.totalScore || 0}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
  const renderActiveGamePhase = () => (
    <div className="!min-h-screen !flex !flex-col !items-center !p-6 !bg-transparent">
      <div className="!bg-white/90 backdrop-blur-sm !rounded-3xl !shadow-xl !p-10 !max-w-4xl !w-full !mx-auto !border !border-gray-100 !animate-fade-in !mb-8">
        <div className="!flex !items-center !justify-center !mb-8">
          <div className="!relative">
            <h2 className="!text-3xl !font-bold !text-gray-800 !relative !z-10">Game in Progress</h2>
            <span className="!absolute !bottom-0 !left-0 !right-0 !h-3 !bg-green-100 !opacity-50 !-z-10 !transform !-rotate-1"></span>
          </div>
        </div>

        <button
          onClick={endGame}
          className="!w-full !py-5 !text-lg !bg-gradient-to-r !from-red-500 !to-pink-500 !text-white !font-medium !rounded-xl !shadow-md !hover:shadow-lg !transform !transition-all !duration-300 !hover:-translate-y-1 !active:translate-y-0 !animate-slide-up !delay-200 !relative !overflow-hidden !flex !items-center !justify-center"
        >
          <svg className="!w-6 !h-6 !mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10v4m0 0h6m-6 0H9"></path>
          </svg>
          <span className="!relative !z-10">End Game</span>
          <span className="!absolute !inset-0 !bg-gradient-to-r !from-red-400/0 !via-white/20 !to-red-400/0 !transform !translate-x-[-100%] !animate-shimmer"></span>
        </button>
      </div>

      {/* Participants Section */}
      <div className="!bg-white/90 backdrop-blur-sm !rounded-3xl !shadow-xl !p-8 !max-w-7xl !w-full !mx-auto !border !border-gray-100 !animate-fade-in">
        <div className="!flex !items-center !justify-between !mb-6">
          <h3 className="!text-2xl !font-semibold !text-gray-800 !flex !items-center">
            <svg className="!w-6 !h-6 !text-green-500 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            Participants
          </h3>
          <span className="!bg-green-100 !text-green-800 !px-4 !py-2 !rounded-full !text-base !font-medium">
            {participants.length} Players
          </span>
        </div>

        {participants.length === 0 ? (
          <div className="!bg-gray-50 !rounded-xl !p-8 !flex !flex-col !items-center !justify-center !text-gray-500">
            <p className="!text-lg !text-center">No participants in the game.</p>
          </div>
        ) : (
          <div className="!flex !flex-wrap !gap-4 !justify-center !items-start !p-4">
            {participants.map((p, index) => (
              <div
                key={p.userId}
                className="!flex !flex-col !items-center !p-4 !bg-white !border !border-gray-100 !rounded-xl !shadow-sm !hover:shadow-md !transition-all !duration-300 !animate-slide-right !w-[180px]"
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                <div className="!relative !mb-2">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl || "/placeholder.svg"} alt="avatar" className="!w-16 !h-16 !rounded-full !border-2 !border-gray-200" />
                  ) : (
                    <div className="!w-16 !h-16 !rounded-full !bg-gradient-to-r !from-green-300 !to-teal-300 !flex !items-center !justify-center !text-white !text-xl !font-bold">
                      {p.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className={`!absolute !bottom-0 !right-0 !w-4 !h-4 !rounded-full !border-2 !border-white ${p.active ? '!bg-green-500 !animate-pulse' : '!bg-gray-400'}`} />
                </div>

                <span className="!text-base !text-gray-800 !font-medium !text-center !truncate !w-full !mb-2">{p.displayName}</span>

                <div className="!flex !items-center !w-full !mb-1">
                  <div className="!w-full !bg-gray-200 !rounded-full !h-2.5">
                    <div
                      className="!bg-gradient-to-r !from-green-500 !to-teal-500 !h-2.5 !rounded-full"
                      style={{
                        width: `${Math.min(100, (p.totalScore / Math.max(...participants.map(p => p.totalScore || 1))) * 100)}%`,
                        transition: 'width 1s ease-in-out'
                      }}
                    ></div>
                  </div>
                </div>
                <span className="!text-sm !font-bold !text-green-600">{p.totalScore || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  const renderCompletedPhase = () => (
    <div className="!min-h-screen !flex !items-center !justify-center !p-4 !bg-transparent">
      <div className="!bg-white/90 backdrop-blur-sm !rounded-2xl !shadow-lg !p-6 !max-w-xl !w-full !mx-auto !border !border-gray-100 !animate-fade-in">
        <div className="!flex !items-center !justify-center !mb-6">
          <div className="!relative">
            <h2 className="!text-2xl !font-bold !text-gray-800 !relative !z-10 !flex !items-center">
              <svg className="!w-6 !h-6 !text-yellow-500 !mr-2 !animate-bounce-slow" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              Game Completed
              <svg className="!w-6 !h-6 !text-yellow-500 !ml-2 !animate-bounce-slow" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd"></path>
              </svg>
            </h2>
            <span className="!absolute !bottom-0 !left-0 !right-0 !h-2 !bg-yellow-100 !opacity-50 !-z-10 !transform !-rotate-1"></span>
          </div>
        </div>

        <div className="!bg-gradient-to-r !from-yellow-50 !to-amber-50 !rounded-xl !p-5 !mb-5 !animate-slide-up">
          <h3 className="!text-lg !font-semibold !text-gray-800 !mb-3 !flex !items-center">
            <svg className="!w-5 !h-5 !text-yellow-500 !mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
            </svg>
            Results Summary
          </h3>

          <div className="!grid !grid-cols-2 !gap-4">
            <div className="!bg-white/90 backdrop-blur-sm !rounded-lg !p-3 !text-center !shadow-sm">
              <p className="!text-gray-500 !text-sm !mb-1">Total Participants</p>
              <p className="!text-2xl !font-bold !text-gray-800">{participants.length}</p>
            </div>
            <div className="!bg-white/90 backdrop-blur-sm !rounded-lg !p-3 !text-center !shadow-sm">
              <p className="!text-gray-500 !text-sm !mb-1">Avg. Score</p>
              <p className="!text-2xl !font-bold !text-gray-800">
                {participants.length > 0
                  ? Math.round(participants.reduce((sum, p) => sum + (p.totalScore || 0), 0) / participants.length)
                  : 0}
              </p>
            </div>
            <div className="!bg-white/90 backdrop-blur-sm !rounded-lg !p-3 !text-center !shadow-sm">
              <p className="!text-gray-500 !text-sm !mb-1">Highest Score</p>
              <p className="!text-2xl !font-bold !text-yellow-600">
                {participants.length > 0
                  ? Math.max(...participants.map(p => p.totalScore || 0))
                  : 0}
              </p>
            </div>
            <div className="!bg-white/90 backdrop-blur-sm !rounded-lg !p-3 !text-center !shadow-sm">
              <p className="!text-gray-500 !text-sm !mb-1">Completion Time</p>
              <p className="!text-2xl !font-bold !text-gray-800">10:25</p>
            </div>
          </div>
        </div>

        <div className="!mb-6 !animate-slide-up !delay-100">
          <h3 className="!text-lg !font-semibold !text-gray-800 !mb-3 !flex !items-center">
            <svg className="!w-5 !h-5 !text-yellow-500 !mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
            </svg>
            Participant Results
          </h3>

          <div className="!max-h-[280px] !overflow-y-auto !pr-2 !scrollbar-thin !scrollbar-thumb-gray-300 !scrollbar-track-gray-100 !rounded-lg">
            {participants.length === 0 ? (
              <div className="!bg-gray-50 !rounded-xl !p-5 !flex !flex-col !items-center !justify-center !text-gray-500">
                <p className="!text-center">No participants in the game.</p>
              </div>
            ) : (
              <ul className="!space-y-3">
                {[...participants]
                  .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                  .map((p, index) => (
                    <li
                      key={p.userId}
                      className={`!flex !items-center !p-3 !rounded-xl !shadow-sm !transition-all !duration-300 !animate-slide-right ${index === 0
                        ? '!bg-gradient-to-r !from-yellow-100 !to-yellow-50 !border-l-4 !border-yellow-400'
                        : index === 1
                          ? '!bg-gradient-to-r !from-gray-100 !to-gray-50 !border-l-4 !border-gray-400'
                          : index === 2
                            ? '!bg-gradient-to-r !from-amber-100 !to-amber-50 !border-l-4 !border-amber-600'
                            : '!bg-white !border !border-gray-100'
                        }`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="!w-8 !h-8 !flex !items-center !justify-center !rounded-full !mr-3 !font-bold !text-sm !shadow-inner !bg-white !text-gray-700">
                        {index + 1}
                      </div>

                      <div className="!flex !items-center !flex-1">
                        {p.avatarUrl ? (
                          <img src={p.avatarUrl || "/placeholder.svg"} alt="avatar" className="!w-10 !h-10 !rounded-full !mr-3 !border-2 !border-gray-200" />
                        ) : (
                          <div className="!w-10 !h-10 !rounded-full !bg-gradient-to-r !from-yellow-300 !to-amber-300 !mr-3 !flex !items-center !justify-center !text-white !font-bold">
                            {p.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="!text-gray-800 !font-medium !flex-1">{p.displayName}</span>

                        <div className="!flex !items-center">
                          {index === 0 && (
                            <span className="!text-yellow-500 !mr-2 !animate-bounce-slow">👑</span>
                          )}
                          <span className={`!px-3 !py-1 !rounded-full !text-sm !font-semibold ${index === 0
                            ? '!bg-yellow-200 !text-yellow-800'
                            : index === 1
                              ? '!bg-gray-200 !text-gray-800'
                              : index === 2
                                ? '!bg-amber-200 !text-amber-800'
                                : '!bg-gray-100 !text-gray-800'
                            }`}>
                            {p.totalScore !== undefined ? p.totalScore : 0}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        <button
          onClick={createNewSession}
          className="!w-full !py-4 !bg-gradient-to-r !from-blue-500 !to-indigo-500 !text-white !font-medium !rounded-xl !shadow-md !hover:shadow-lg !transform !transition-all !duration-300 !hover:-translate-y-1 !active:translate-y-0 !animate-slide-up !delay-200 !relative !overflow-hidden !flex !items-center !justify-center"
        >
          <svg className="!w-5 !h-5 !mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          <span className="!relative !z-10">Create New Game</span>
          <span className="!absolute !inset-0 !bg-gradient-to-r !from-blue-400/0 !via-white/20 !to-blue-400/0 !transform !translate-x-[-100%] !animate-shimmer"></span>
        </button>

        {/* Confetti effect for celebration */}
        <div className="!fixed !inset-0 !pointer-events-none !z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="!absolute !animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                backgroundColor: ['#FFD700', '#FFC0CB', '#87CEFA', '#90EE90', '#FF6347'][Math.floor(Math.random() * 5)],
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
                animationDuration: `${Math.random() * 3 + 2}s`,
                animationDelay: `${Math.random() * 0.5}s`
              }}
            ></div>
          ))}
        </div>
      </div>
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
    <div className="teacher-game-session-container relative min-h-screen bg-gray-50">
      {/* Background Image */}
      <div className="fixed inset-0 bg-[url('../../../public/gametest.gif')] bg-cover bg-center bg-no-repeat opacity-20"></div>

      {/* Content */}
      <div className="relative z-10">
        {renderGamePhase()}
      </div>
    </div>
  );
};

export default TeacherCreateRoom;