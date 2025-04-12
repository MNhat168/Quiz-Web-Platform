// TeacherCreateRoom.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useAuth } from '../../context/AuthContext';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const TeacherCreateRoom = () => {
  const { token, role } = useAuth();
  const [accessCode, setAccessCode] = useState('');
  const [participants, setParticipants] = useState([]);
  const [stompClient, setStompClient] = useState(null);

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

  const setupWebSocket = () => {
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws-sessions'),
      onConnect: () => {
        client.subscribe(
          `/topic/session/${accessCode}/participants`,
          (message) => {
            setParticipants(JSON.parse(message.body));
          }
        );
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      }
    });

    client.activate();
    setStompClient(client);
  };

  const createRoom = async () => {
    if (role !== 'TEACHER') {
      alert('Only teachers can create rooms');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/sessions/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Teacher-Id': JSON.parse(atob(token.split('.')[1])).sub // Extract user ID from JWT
        }
      });
      const data = await response.json();
      setAccessCode(data.accessCode);
    } catch (error) {
      console.error('Room creation failed:', error);
    }
  };

  return (
    <div className="container">
      <h1>Create Classroom</h1>
      {!accessCode ? (
        <button onClick={createRoom}>Create New Room</button>
      ) : (
        <div>
          <h2>Room Access Code: {accessCode}</h2>
          <h3>Participants ({participants.length})</h3>
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
        </div>
      )}
    </div>
  );
};

export default TeacherCreateRoom;