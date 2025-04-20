import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const StudentJoinRoom = () => {
  const { token, user } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [joined, setJoined] = useState(false);
  const [sessionStatus, setSessionStatus] = useState(null);

  useEffect(() => {
    if (joined) {
      setupWebSocket();
    }
    return () => {
      if (stompClient) {
        stompClient.deactivate();
      }
    };
  }, [joined]);

  const setupWebSocket = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-sessions'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      onConnect: () => {
        console.log('WebSocket Connected!');
        
        client.subscribe(
          `/topic/session/${accessCode}/participants`,
          (message) => {
            setParticipants(JSON.parse(message.body));
          }
        );
        
        client.subscribe(
          `/topic/session/${accessCode}/status`,
          (message) => {
            const status = message.body;
            setSessionStatus(status);
            
            if (status === 'COMPLETED') {
              alert('This session has ended');
              leaveRoom();
            }
          }
        );
        
        const intervalId = setInterval(() => {
          client.publish({
            destination: `/app/session/${accessCode}/heartbeat`,
            body: JSON.stringify({ studentId: user.id })
          });
        }, 10000);
  
        client.onDisconnect = () => {
          clearInterval(intervalId);
        };
      },
      onStompError: (frame) => {
        console.error('WebSocket Error:', frame);
      },
      onWebSocketClose: (event) => {
        console.log('WebSocket Closed:', event);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
  
    client.activate();
    setStompClient(client);
  };

  const joinRoom = async () => {
    if (!user || user.role !== 'STUDENT') {
      alert('Only students can join rooms');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/sessions/join/${accessCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Student-Id': user.id
        }
      });
      
      if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setJoined(true);
            setCurrentUser(user.id);
            
            const participantsResponse = await fetch(`http://localhost:8080/api/sessions/${accessCode}/participants`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (participantsResponse.ok) {
              const participantsData = await participantsResponse.json();
              setParticipants(participantsData);
            }
            
            const sessionResponse = await fetch(`http://localhost:8080/api/sessions/${accessCode}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (sessionResponse.ok) {
              const sessionData = await sessionResponse.json();
              setSessionStatus(sessionData.status);
            }
          }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to join session');
      }
    } catch (error) {
      console.error('Join failed:', error);
      alert('Failed to join session');
    }
  };

  const leaveRoom = async () => {
    if (!joined) return;
    
    try {
        await fetch(`http://localhost:8080/api/sessions/leave/${accessCode}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Student-Id': user.id
            }
        });
        
        if (stompClient) {
          stompClient.deactivate();
        }
        
        setJoined(false);
        setCurrentUser(null);
        setParticipants([]);
        setSessionStatus(null);
    } catch (error) {
        console.error('Leave failed:', error);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (joined) {
        navigator.sendBeacon(
          `http://localhost:8080/api/sessions/leave/${accessCode}`,
          JSON.stringify({ studentId: user?.id })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (joined) {
        leaveRoom();
      }
    };
  }, [joined, accessCode, user]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Join Classroom</h1>
      {!joined ? (
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              className="border p-2 rounded"
              type="text"
              placeholder="Enter Access Code"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={joinRoom}
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-100 p-4 rounded">
            <h2 className="text-xl font-semibold">Joined Room: {accessCode}</h2>
            <div className="text-sm">
              Status: <span className={`font-medium ${
                sessionStatus === 'ACTIVE' ? 'text-green-600' : 
                sessionStatus === 'LOBBY' ? 'text-blue-600' : 
                sessionStatus === 'PAUSED' ? 'text-yellow-600' : 
                sessionStatus === 'COMPLETED' ? 'text-red-600' : ''
              }`}>{sessionStatus}</span>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold">Participants ({participants.length})</h3>
            {participants.length === 0 ? (
              <p className="text-gray-500">No other participants yet</p>
            ) : (
              <ul className="bg-white rounded-lg shadow overflow-hidden">
                {participants.map((p) => (
                  <li key={p.userId} className="border-b last:border-0 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center">
                      {p.avatarUrl && (
                        <img src={p.avatarUrl} alt="avatar" className="w-8 h-8 rounded-full mr-2" />
                      )}
                      <span className="font-medium">{p.displayName}</span>
                      {user.id === p.userId && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">You</span>}
                    </div>
                    <div className="flex items-center">
                      <span className="mr-2">{p.totalScore} pts</span>
                      <span className={`inline-block w-3 h-3 rounded-full ${p.active ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <button 
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            onClick={leaveRoom}
          >
            Leave Room
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentJoinRoom;