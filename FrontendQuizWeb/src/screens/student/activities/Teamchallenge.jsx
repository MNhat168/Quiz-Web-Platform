import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import { ReactSketchCanvas } from 'react-sketch-canvas';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

const TeamChallengeActivity = ({ activity, content, accessCode, contentItem }) => {
    const [teams, setTeams] = useState([]);
    const [userTeam, setUserTeam] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [challengeStatus, setChallengeStatus] = useState({});
    const [guess, setGuess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);
    const canvasRef = useRef(null);
    const statusPollingRef = useRef(null);
    const teamsPollingRef = useRef(null);
    const lastStatusRef = useRef(null);
    const lastTeamsRef = useRef(null);
    const { token } = useAuth();

    
    const stompClientRef = useRef(null);
    const subscriptionRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);

    const studentId = useMemo(() => {
        try {
            const tokenPayload = JSON.parse(atob(token.split(".")[1]));
            return tokenPayload.sub;
        } catch (e) {
            console.error("Failed to extract student ID from token:", e);
            return null;
        }
    }, [token]);

    const isEqual = (obj1, obj2) => {
        return JSON.stringify(obj1) === JSON.stringify(obj2);
    };

    const fetchTeams = useCallback(async () => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/sessions/${accessCode}/teams`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const teamsData = response.data && response.data.teams ? response.data.teams :
                (Array.isArray(response.data) ? response.data : []);
            if (!isEqual(teamsData, lastTeamsRef.current)) {
                lastTeamsRef.current = teamsData;

                if (teamsData.length > 0) {
                    setTeams(teamsData);
                    const currentUserTeam = teamsData.find(team =>
                        team.teamMembers && team.teamMembers.includes(studentId)
                    );

                    if (currentUserTeam) {
                        setUserTeam(currentUserTeam);
                        const isDrawer = currentUserTeam.currentDrawerId === studentId;
                        setUserRole(isDrawer ? 'drawer' : 'guesser');
                    }
                } else if (challengeStatus && challengeStatus.teams) {
                    const statusTeams = challengeStatus.teams;
                    setTeams(statusTeams);
                    const currentUserTeam = statusTeams.find(team =>
                        team.teamMembers && team.teamMembers.some(member => member === studentId)
                    );

                    if (currentUserTeam) {
                        setUserTeam(currentUserTeam);
                        const isDrawer = currentUserTeam.currentDrawerId === studentId;
                        setUserRole(isDrawer ? 'drawer' : 'guesser');
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch teams:', error);
            setError('Failed to load teams');
        }
    }, [accessCode, token, studentId, challengeStatus]);

    const fetchChallengeStatus = useCallback(async () => {
        try {
            const response = await axios.get(
                `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/status`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const newStatus = response.data;
            if (!isEqual(newStatus, lastStatusRef.current)) {
                lastStatusRef.current = newStatus;
                setChallengeStatus(newStatus);
                if (!userTeam) {
                    if (newStatus.teams && newStatus.teams.length > 0) {
                        const currentUserTeam = newStatus.teams.find(team =>
                            team.teamMembers && team.teamMembers.includes(studentId)
                        );

                        if (currentUserTeam) {
                            setUserTeam(currentUserTeam);
                            const isDrawer = currentUserTeam.currentDrawerId === studentId;
                            setUserRole(isDrawer ? 'drawer' : 'guesser');
                        }
                    }
                    if (newStatus.teamInfo && newStatus.teamInfo.length > 0) {
                        const currentUserTeam = newStatus.teamInfo.find(team =>
                            team.members && team.members.some(member => member.userId === studentId)
                        );

                        if (currentUserTeam) {
                            setUserTeam({
                                id: currentUserTeam.id,
                                teamId: currentUserTeam.id,
                                teamName: currentUserTeam.name,
                                teamScore: currentUserTeam.score,
                                currentDrawerId: currentUserTeam.currentDrawerId,
                                teamMembers: currentUserTeam.members.map(m => m.userId),
                                members: currentUserTeam.members
                            });

                            const isDrawer = currentUserTeam.currentDrawerId === studentId;
                            setUserRole(isDrawer ? 'drawer' : 'guesser');
                        }
                    }
                } else if (userTeam && newStatus.teamInfo) {
                    const updatedTeam = newStatus.teamInfo.find(team =>
                        team.id === userTeam.id || team.id === userTeam.teamId
                    );
                    if (updatedTeam && updatedTeam.currentDrawerId !== userTeam.currentDrawerId) {
                        const prevDrawerId = String(userTeam.currentDrawerId);
                        const newDrawerId = String(updatedTeam.currentDrawerId);
                        if (prevDrawerId !== newDrawerId) {
                            const isDrawer = newDrawerId === String(studentId);
                            setUserRole(isDrawer ? 'drawer' : 'guesser');
                            setUserTeam(prev => ({
                                ...prev,
                                currentDrawerId: updatedTeam.currentDrawerId
                            }));
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to fetch challenge status:', error);
            if (error.response && error.response.status !== 404) {
                setError('Failed to load challenge status');
            }
        }
    }, [accessCode, token, studentId, userTeam]);

    useEffect(() => {
        if (initialized) return;

        const initializeData = async () => {
            setLoading(true);
            setError('');

            try {
                let retryCount = 0;
                let teamsCreated = false;
                while (retryCount < 3 && !teamsCreated) {
                    try {
                        await axios.post(
                            `http://localhost:8080/api/sessions/${accessCode}/teams?autoAssign=true`,
                            {},
                            { headers: { Authorization: `Bearer ${token}` } }
                        );
                        teamsCreated = true;
                    } catch (err) {
                        retryCount++;
                        console.warn(`Attempt ${retryCount} to create teams failed:`, err.message);
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
                await fetchChallengeStatus();
                await fetchTeams();
                setInitialized(true);
            } catch (err) {
                console.error('Error initializing data:', err);
                setError('Failed to load initial data. Please refresh the page and try again.');
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [accessCode, token, fetchChallengeStatus, fetchTeams, initialized]);

    useEffect(() => {
        if (!initialized) return;
        if (statusPollingRef.current) clearInterval(statusPollingRef.current);
        if (teamsPollingRef.current) clearInterval(teamsPollingRef.current);
        statusPollingRef.current = setInterval(() => {
            fetchChallengeStatus();
        }, 5000);
        if (!userTeam) {
            teamsPollingRef.current = setInterval(() => {
                if (challengeStatus.status === 'ACTIVE') {
                    fetchTeams();
                }
            }, 3000);
        }
        return () => {
            if (statusPollingRef.current) clearInterval(statusPollingRef.current);
            if (teamsPollingRef.current) clearInterval(teamsPollingRef.current);
        };
    }, [initialized, userTeam, challengeStatus.status, fetchChallengeStatus, fetchTeams]);

    useEffect(() => {
        if (userTeam && teamsPollingRef.current) {
            clearInterval(teamsPollingRef.current);
            teamsPollingRef.current = null;
            console.log("Cleared teams polling interval - user team found");
        }
    }, [userTeam]);

    useEffect(() => {
        if (challengeStatus.status === 'COMPLETED' && statusPollingRef.current) {
            clearInterval(statusPollingRef.current);
            statusPollingRef.current = null;
            console.log("Cleared status polling interval - challenge completed");
        }
    }, [challengeStatus.status]);

    const clearCanvas = () => {
        if (userRole !== 'drawer' || !canvasRef.current) return;
        canvasRef.current.clearCanvas();
    };

    const submitGuess = async () => {
        if (userRole !== 'guesser' || !userTeam || !guess.trim()) return;
        setIsSubmitting(true);
        try {
            const teamId = userTeam.id || userTeam.teamId;

            if (!teamId) {
                throw new Error("Team ID is missing");
            }
            const guessData = {
                teamId: teamId,
                guess: guess.trim()
            };

            await axios.post(
                `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/guess`,
                guessData,  // Send as a plain object, Axios will handle JSON conversion
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'X-Student-Id': studentId
                    }
                }
            );
            setGuess('');
            await fetchChallengeStatus();
        } catch (error) {
            console.error('Failed to submit guess:', error);
            if (error.response) {
                console.error('Error response:', error.response.data);
                setError(`Failed to submit guess: ${error.response.data.error || error.message}`);
            } else {
                setError(`Failed to submit guess: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchDrawer = async (newDrawerId) => {
        if (!userTeam) return;
        try {
            const teamId = userTeam.id || userTeam.teamId;

            await axios.post(
                `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/switch-drawer`,
                { teamId, newDrawerId },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            await fetchTeams();
            await fetchChallengeStatus();
        } catch (error) {
            console.error('Failed to switch drawer:', error);
            setError('Failed to switch drawer');
        }
    };


    // WebSocket connection setup
    useEffect(() => {
        const socket = new SockJS('http://localhost:8080/ws');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setIsConnected(true);
                console.log('WebSocket connected');

                // Subscribe only if userTeam exists
                if (userTeam) {
                    const teamGuessTopic = `/topic/session/${accessCode}/teamchallenge/guess/${userTeam.teamId}`;
                    subscriptionRef.current = client.subscribe(
                        teamGuessTopic,
                        (message) => {
                            const guessResult = JSON.parse(message.body);
                            console.log('New guess:', guessResult);
                            fetchChallengeStatus();
                        }
                    );
                }
            },
            onDisconnect: () => {
                setIsConnected(false);
                console.log('WebSocket disconnected');
            }
        });

        stompClientRef.current = client;
        client.activate();

        return () => {
            client.deactivate();
            subscriptionRef.current?.unsubscribe();
        };
    }, [accessCode]); // Only re-run if accessCode changes

    // Handle team-specific subscriptions when userTeam changes
    useEffect(() => {
        if (!isConnected || !userTeam) return;

        const teamGuessTopic = `/topic/session/${accessCode}/teamchallenge/guess/${userTeam.teamId}`;

        // Unsubscribe previous if exists
        if (subscriptionRef.current) {
            subscriptionRef.current.unsubscribe();
        }

        // Create new subscription
        subscriptionRef.current = stompClientRef.current.subscribe(
            teamGuessTopic,
            (message) => {
                const guessResult = JSON.parse(message.body);
                console.log('Team guess update:', guessResult);
                fetchChallengeStatus();
            }
        );
    }, [userTeam, isConnected, accessCode]);

    const handleManualRefresh = async () => {
        await fetchChallengeStatus();
        await fetchTeams();
    };

    const renderPrompt = () => {
        if (!userTeam || userRole !== 'drawer') {
            return null;
        }
        if (!userTeam) {
            return <p>You need to be assigned to a team to participate.</p>;
        }

        const currentPromptIndex = challengeStatus.currentPromptIndex || 0;

        // Try different sources for the prompt
        const currentWord = challengeStatus.currentWord ||
            getPromptFromContentStructure(currentPromptIndex) ||
            getLegacyPrompt(currentPromptIndex);

        if (!currentWord) {
            console.error("No prompt found in:", {
                challengeStatus,
                content,
                contentItem,
                currentPromptIndex
            });
            return <p>Waiting for word...</p>;
        }

        return (
            <div className="drawing-prompt">
                <h4>Draw this word:</h4>
                <p className="prompt-word">{currentWord}</p>
            </div>
        );
    };

    // Helper functions
    const getPromptFromContentStructure = (index) => {
        // Handle new content format with string array
        if (content?.prompts && Array.isArray(content.prompts)) {
            return content.prompts[index];
        }
        return null;
    };

    const getLegacyPrompt = (index) => {
        // Handle legacy format if needed
        if (contentItem?.data?.prompts?.[index]?.prompt) {
            return contentItem.data.prompts[index].prompt;
        }
        return null;
    };

    // Add this debug function to help troubleshoot issues
    const debugChallengeData = () => {
        if (!challengeStatus || !content || !contentItem) {
            return null;
        }

        // Only show debug info for teachers or in development
        const isTeacher = studentId?.includes("teacher");
        if (!isTeacher && process.env.NODE_ENV !== 'development') {
            return null;
        }

        return (
            <div className="debug-info" style={{
                border: '1px dashed #999',
                padding: '10px',
                marginTop: '20px',
                fontSize: '12px',
                backgroundColor: '#f8f9fa'
            }}>
                <h5>Debug Info (Only visible to teachers/devs)</h5>
                <div>
                    <strong>Challenge Status:</strong> {challengeStatus.status || 'N/A'}
                </div>
                <div>
                    <strong>Current Prompt Index:</strong> {challengeStatus.currentPromptIndex || 0}
                </div>
                <div>
                    <strong>Content Prompts Available:</strong> {content?.prompts?.length || 0}
                </div>
                <div>
                    <strong>Content Item Prompts Available:</strong> {contentItem?.prompts?.length || 0}
                </div>
                <button onClick={() => console.log({ challengeStatus, content, contentItem, userTeam })} style={{ marginTop: '5px' }}>
                    Log Details to Console
                </button>
            </div>
        );
    };

    const renderDrawingInterface = () => {
        if (userRole !== 'drawer') return null;
        const canvasStyle = {
            border: '1px solid #000',
            boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
            borderRadius: '5px'
        };
        return (
            <div className="drawing-interface">
                <ReactSketchCanvas
                    key={userTeam?.id} // Use team ID as a stable key
                    ref={canvasRef}
                    style={canvasStyle}
                    width="500px"
                    height="400px"
                    strokeWidth={4}
                    strokeColor="black"
                    eraserWidth={20}
                    canvasColor="white"
                />
                <div className="drawing-controls" style={{ marginTop: '10px' }}>
                    <button
                        onClick={clearCanvas}
                        disabled={isSubmitting}
                        style={{ marginRight: '10px', padding: '5px 10px' }}
                    >
                        Clear
                    </button>
                </div>
            </div>
        );
    };

    const renderGuessingInterface = () => {
        if (userRole !== 'guesser') return null;
        return (
            <div className="guessing-interface">
                {challengeStatus.currentRound?.currentDrawing && (
                    <div className="current-drawing">
                        <img
                            src={challengeStatus.currentRound.currentDrawing}
                            alt="Current drawing"
                            style={{ maxWidth: '500px', maxHeight: '400px', border: '1px solid #ddd' }}
                        />
                    </div>
                )}
                <div className="guess-input" style={{ marginTop: '10px' }}>
                    <input
                        type="text"
                        value={guess}
                        onChange={(e) => setGuess(e.target.value)}
                        placeholder="Enter your guess..."
                        disabled={isSubmitting}
                        style={{ padding: '5px', marginRight: '10px', width: '250px' }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isSubmitting && guess.trim()) {
                                submitGuess();
                            }
                        }}
                    />
                    <button
                        onClick={submitGuess}
                        disabled={isSubmitting || !guess.trim()}
                        style={{ padding: '5px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none' }}
                    >
                        Submit Guess
                    </button>
                </div>
            </div>
        );
    };

    const renderTeamInfo = () => {
        if (loading) {
            return <p>Loading team information...</p>;
        }
        if (!userTeam) {
            return (
                <div className="no-team-info">
                    <p>Teams will be created automatically when the challenge starts.</p>
                    {challengeStatus.status === 'ACTIVE' && (
                        <div className="refresh-teams-btn">
                            <p>Challenge has started - refreshing team assignments...</p>
                            <button onClick={handleManualRefresh}>
                                Refresh Teams
                            </button>
                        </div>
                    )}
                </div>
            );
        }
        const teamId = userTeam.id || userTeam.teamId;
        const teamName = userTeam.teamName || userTeam.name || 'Your Team';
        const teamScore = userTeam.teamScore || userTeam.score || 0;
        const currentDrawerId = userTeam.currentDrawerId;
        return (
            <div className="team-info" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                <h4>Your Team: {teamName}</h4>
                <p>Role: {userRole === 'drawer' ? 'Drawer' : 'Guesser'}</p>
                <p>Score: {teamScore}</p>

                <div className="team-members">
                    <h5>Team Members:</h5>
                    <ul style={{ listStyleType: 'none', padding: '0' }}>
                        {userTeam.members ? (
                            userTeam.members.map(member => (
                                <li key={member.userId} style={{ margin: '5px 0', padding: '5px', backgroundColor: member.userId === currentDrawerId ? '#e3f2fd' : 'transparent' }}>
                                    {member.displayName || member.userId}
                                    {member.userId === currentDrawerId && ' (Drawer)'}
                                    {userRole === 'drawer' && member.userId !== currentDrawerId && (
                                        <button
                                            onClick={() => switchDrawer(member.userId)}
                                            disabled={isSubmitting}
                                            style={{ marginLeft: '10px', padding: '2px 5px', fontSize: '0.8em' }}
                                        >
                                            Make Drawer
                                        </button>
                                    )}
                                </li>
                            ))
                        ) : userTeam.teamMembers ? (
                            userTeam.teamMembers.map(memberId => {
                                let displayName = memberId;
                                if (challengeStatus.teamInfo) {
                                    const team = challengeStatus.teamInfo.find(t =>
                                        t.members && t.members.some(m => m.userId === memberId)
                                    );
                                    if (team) {
                                        const member = team.members.find(m => m.userId === memberId);
                                        if (member && member.displayName) {
                                            displayName = member.displayName;
                                        }
                                    }
                                }
                                return (
                                    <li key={memberId} style={{ margin: '5px 0', padding: '5px', backgroundColor: memberId === currentDrawerId ? '#e3f2fd' : 'transparent' }}>
                                        {displayName}
                                        {memberId === currentDrawerId && ' (Drawer)'}
                                        {userRole === 'drawer' && memberId !== currentDrawerId && (
                                            <button
                                                onClick={() => switchDrawer(memberId)}
                                                disabled={isSubmitting}
                                                style={{ marginLeft: '10px', padding: '2px 5px', fontSize: '0.8em' }}
                                            >
                                                Make Drawer
                                            </button>
                                        )}
                                    </li>
                                )
                            })
                        ) : (
                            <li>No team members found</li>
                        )}
                    </ul>
                </div>
            </div>
        );
    };

    const renderChallengeStatus = () => {
        if (loading) {
            return <p>Loading challenge status...</p>;
        }
        if (!challengeStatus || Object.keys(challengeStatus).length === 0) {
            return <p>Waiting for challenge to start...</p>;
        }
        return (
            <div className="challenge-status" style={{ marginBottom: '20px' }}>
                <h4>Round: {challengeStatus.currentRound?.index + 1 || 1}</h4>
                {challengeStatus.timeRemaining && (
                    <p>Time Remaining: {challengeStatus.timeRemaining}s</p>
                )}
                {challengeStatus.currentRound?.guesses?.length > 0 && (
                    <div className="guess-history" style={{ marginTop: '10px' }}>
                        <h5>Recent Guesses:</h5>
                        <ul style={{ listStyleType: 'none', padding: '5px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                            {challengeStatus.currentRound.guesses
                                .filter(guess => guess.teamId === userTeam?.teamId) // Filter by current team
                                .map((guess, index) => (
                                    <li key={index}
                                        style={{
                                            padding: '3px 5px',
                                            backgroundColor: guess.correct ? '#dff0d8' : 'transparent',
                                            color: guess.correct ? '#3c763d' : 'inherit'
                                        }}>
                                        {guess.playerName}: {guess.guess}
                                        {guess.correct && ' ✓'}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return <div className="loading">Loading game...</div>;
        }
        if (challengeStatus.status !== 'ACTIVE') {
            return (
                <div className="waiting">
                    {teams.length === 0 ? (
                        <div>
                            <p>Teams will be created automatically when the activity starts.</p>
                            <p>Please wait for the teacher to start the activity.</p>
                        </div>
                    ) : (
                        <p>Waiting for the challenge to start...</p>
                    )}
                </div>
            );
        }
        if (!userTeam) {
            return (
                <div className="waiting-assignment">
                    <p>The challenge has started and teams are being assigned.</p>
                    <p>You'll be automatically placed on a team momentarily...</p>
                    <div className="refresh-teams-btn">
                        <button onClick={handleManualRefresh}>Refresh Teams</button>
                    </div>
                </div>
            );
        }
        return (
            <>
                {renderPrompt()}
                <div className="challenge-interface">
                    {renderDrawingInterface()}
                    {renderGuessingInterface()}
                </div>
            </>
        );
    };
    return (
        <div className="team-challenge-activity" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h3>{activity.title || 'Team Drawing Challenge'}</h3>
            {activity.instructions && <p>{activity.instructions}</p>}
            {error && <p className="error-message" style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            {debugChallengeData()}
            {renderChallengeStatus()}
            {renderTeamInfo()}
            {renderContent()}

        </div>
    );
};

export default TeamChallengeActivity;