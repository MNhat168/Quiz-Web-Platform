// StudentJoinRoom.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';


const StudentJoinRoom = () => {
  const { token, role } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [stompClient, setStompClient] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (joined) {
      setupWebSocket();
    }
    return () => {
      if (stompClient) stompClient.disconnect();
    };
  }, [joined]);

  const setupWebSocket = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-sessions'),
      onConnect: () => {
          // Send heartbeat every 10 seconds
          client.publish({
              destination: `/app/heartbeat/${accessCode}`,
              body: JSON.stringify({ userId: currentUser })
          });
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.activate();
    setStompClient(client);
  };

  const joinRoom = async () => {
    if (role !== 'STUDENT') {
      alert('Only students can join rooms');
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/sessions/join/${accessCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Student-Id': JSON.parse(atob(token.split('.')[1])).sub // Extract user ID from JWT
        }
      });
      
      if (response.ok) {
          setJoined(true);
          setCurrentUser(JSON.parse(atob(token.split('.')[1])).sub);
      }
    } catch (error) {
      console.error('Join failed:', error);
    }
  };

const leaveRoom = async () => {
    try {
        await fetch(`http://localhost:8080/api/sessions/leave/${accessCode}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Student-Id': currentUser
            }
        });
        setJoined(false);
        setCurrentUser(null);
    } catch (error) {
        console.error('Leave failed:', error);
    }
};

  return (
    <div className="container">
      <h1>Join Classroom</h1>
      {!joined ? (
        <div>
          <input
            type="text"
            placeholder="Enter Access Code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <h2>Joined Room: {accessCode}</h2>
          <h3>Participants ({participants.length})</h3>
          <ul>
            {participants.map((p, i) => (
              <li key={i}>{p.displayName}</li>
            ))}
          </ul>
          <ul>
              {participants.map((p, i) => (
                  <li key={i}>
                      {p.displayName}
                      <span style={{color: p.isActive ? 'green' : 'gray'}}>
                          ●
                      </span>
                  </li>
              ))}
          </ul>
          <button onClick={leaveRoom}>Leave Room</button>
        </div>
      )}
    </div>
  );
};

export default StudentJoinRoom;