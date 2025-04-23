import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
// import '../../style/leaderboard.css'; // You'll need to create this CSS file

const GameCompletedLeaderboard = () => {
  const { token } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Get the access code either from URL params or localStorage
    const queryParams = new URLSearchParams(location.search);
    const accessCode = queryParams.get('accessCode') || localStorage.getItem('studentSessionAccessCode');
    
    if (!accessCode) {
      // If no access code is available, redirect to join room
      navigate('/student/join');
      return;
    }
    
    // Fetch the final leaderboard data
    fetchLeaderboard(accessCode);
  }, [location.search, navigate]);

  const fetchLeaderboard = async (accessCode) => {
    try {
      setLoading(true);
      // Fetch final leaderboard data
      const leaderboardResponse = await axios.get(
        `http://localhost:8080/api/sessions/${accessCode}/leaderboard`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Fetch session details (game title, etc)
      const sessionResponse = await axios.get(
        `http://localhost:8080/api/sessions/${accessCode}/details`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      setLeaderboardData(leaderboardResponse.data);
      setSessionDetails(sessionResponse.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    // Clear session data
    localStorage.removeItem('studentSessionAccessCode');
    localStorage.removeItem('studentJoinedStatus');
    
    // Navigate back to join screen
    navigate('/student/join');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading final results...</p>
      </div>
    );
  }

  return (
    <div className="game-completed-container">
      <h1>Game Completed!</h1>
      
      {sessionDetails && (
        <div className="session-info">
          <h2>{sessionDetails.title}</h2>
          <p>Thanks for participating!</p>
        </div>
      )}
      
      <div className="final-leaderboard">
        <h2>Final Leaderboard</h2>
        
        {leaderboardData.length === 0 ? (
          <p>No scores available</p>
        ) : (
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <span className="rank-header">Rank</span>
              <span className="name-header">Player</span>
              <span className="score-header">Score</span>
            </div>
            
            {leaderboardData.map((entry, index) => (
              <div 
                key={entry.userId} 
                className={`leaderboard-row ${index < 3 ? `top-${index + 1}` : ''}`}
              >
                <span className="rank">{index + 1}</span>
                <span className="player-name">{entry.displayName}</span>
                <span className="score">{entry.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <button onClick={handleContinue} className="continue-button">
        Join Another Game
      </button>
    </div>
  );
};

export default GameCompletedLeaderboard;