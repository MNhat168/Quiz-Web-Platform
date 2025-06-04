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
    const lastStatusRef = useRef(null);
    const lastTeamsRef = useRef(null);
    const { token } = useAuth();
    const [canvasReady, setCanvasReady] = useState(false);
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
                setChallengeStatus({
                    ...newStatus,
                    currentPromptIndex: userTeam?.currentPromptIndex || 0
                });
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

    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    const handlePathsChange = useCallback((updatedPaths) => {
        if (userRole === 'drawer' && userTeam?.teamId) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                axios.post(
                    `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/save-drawing`,
                    {
                        teamId: userTeam.teamId,
                        paths: updatedPaths
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }, 1000); // Debounce 1 second
        }
    }, [userRole, accessCode, userTeam?.teamId, token]);

    const requestInitialCanvas = useCallback(() => {
        if (userTeam?.teamId) {
            console.log(`Requesting initial canvas data as ${userRole}`);
            axios.get(
                `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/drawing/${userTeam.teamId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            )
                .then(response => {
                    console.log('Received REST drawing data:', response.data);
                    if (canvasRef.current && response.data) {
                        canvasRef.current.loadPaths(response.data);
                    }
                })
                .catch(error => {
                    console.warn('Could not get drawing via REST, falling back to WebSocket:', error);
                    if (stompClientRef.current?.connected) {
                        stompClientRef.current.publish({
                            destination: `/app/session/${accessCode}/teamchallenge/request-drawing/${userTeam.teamId}`,
                            body: JSON.stringify(studentId)
                        });
                    }
                });
        }
    }, [userRole, accessCode, userTeam?.teamId, studentId, token]);

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
        if (userTeam?.teamId && userRole === 'guesser' && isConnected) {
            requestInitialCanvas();
        }
    }, [userTeam?.teamId, userRole, isConnected, requestInitialCanvas]);

    const clearCanvas = () => {
        if (userRole !== 'drawer' || !canvasRef.current) return;

        if (canvasRef.current && typeof canvasRef.current.clearCanvas === 'function') {
            Promise.resolve(canvasRef.current.clearCanvas())
                .then(() => {
                    console.log('Canvas cleared, sending empty paths');
                    if (stompClientRef.current?.connected) {
                        stompClientRef.current.publish({
                            destination: `/app/session/${accessCode}/teamchallenge/drawing/${userTeam.teamId}`,
                            body: JSON.stringify({
                                type: 'clear',
                                data: []
                            })
                        });
                    }
                    axios.post(
                        `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/save-drawing`,
                        {
                            teamId: userTeam.teamId,
                            paths: []
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                })
                .catch(error => {
                    console.error('Error clearing canvas:', error);
                });
        } else {
            console.warn('Canvas reference not ready, sending clear command directly');
            if (stompClientRef.current?.connected && userTeam?.teamId) {
                stompClientRef.current.publish({
                    destination: `/app/session/${accessCode}/teamchallenge/drawing/${userTeam.teamId}`,
                    body: JSON.stringify({
                        type: 'clear',
                        data: []
                    })
                });
            }
            axios.post(
                `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/save-drawing`,
                {
                    teamId: userTeam.teamId,
                    paths: []
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        }
    };

    const submitGuess = async () => {
        if (userRole !== 'guesser' || !userTeam || !guess.trim()) return;
        setIsSubmitting(true);
        try {
            const teamId = userTeam.id || userTeam.teamId;
            const guessData = {
                teamId: teamId,
                guess: guess.trim()
            };

            // Add explicit content type header
            await axios.post(
                `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/guess`,
                guessData,
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
                // Handle structured error response
                const errorMsg = error.response.data.error || error.message;
                setError(`Failed to submit guess: ${errorMsg}`);
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

    const getDuration = () => {
        const currentPromptIndex = challengeStatus.currentPromptIndex ?? userTeam?.currentContentIndex ?? 0;
        const prompts = contentItem?.data?.prompts || [];
        const currentPrompt = prompts[currentPromptIndex];

        if (currentPrompt?.timeLimit) return currentPrompt.timeLimit;
        return contentItem?.data?.duration || contentItem?.data?.roundTime || 60;
    };

    useEffect(() => {
        if (challengeStatus.status === 'ACTIVE') {
            const newDuration = getDuration();
            setTimeRemaining(newDuration);
        }
    }, [challengeStatus.currentPromptIndex, userTeam?.currentContentIndex]);



    const [timeRemaining, setTimeRemaining] = useState(getDuration());

    useEffect(() => {
        if (challengeStatus.status !== 'ACTIVE' || !timeRemaining) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => prev > 0 ? prev - 1 : 0);
        }, 1000);

        return () => clearInterval(timer);
    }, [challengeStatus.status, timeRemaining]);

    const [revealedHints, setRevealedHints] = useState([]);

    // Function to get current prompt details
    const getCurrentPrompt = useCallback(() => {
        const currentPromptIndex = userTeam?.currentContentIndex || 0;
        return contentItem?.data?.prompts?.[currentPromptIndex] || {};
    }, [userTeam, contentItem]);

    // Effect to manage hint revealing based on time
    useEffect(() => {
        if (userRole !== 'guesser' || challengeStatus.status !== 'ACTIVE') return;

        const prompt = getCurrentPrompt();
        const hints = prompt.hints || [];
        if (hints.length === 0) return;

        const totalTime = getDuration();
        const hintIntervals = hints.map((_, i) =>
            Math.max(10, totalTime * (1 - (i + 1) / (hints.length + 1))
            ));

        const newRevealed = [];
        for (let i = 0; i < hints.length; i++) {
            if (timeRemaining <= hintIntervals[i]) {
                newRevealed.push(i);
            }
        }

        setRevealedHints(newRevealed);
    }, [timeRemaining, userRole, challengeStatus.status, getCurrentPrompt]);

    const handleStroke = useCallback((stroke) => {
        if (userRole === 'drawer' && userTeam?.teamId && canvasRef.current) {
            if (stompClientRef.current?.connected) {
                stompClientRef.current.publish({
                    destination: `/app/session/${accessCode}/teamchallenge/drawing/${userTeam.teamId}`,
                    body: JSON.stringify({
                        type: 'stroke',
                        data: stroke
                    })
                });
            }

            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(() => {
                canvasRef.current.exportPaths().then(paths => {
                    axios.post(
                        `http://localhost:8080/api/sessions/${accessCode}/teamchallenge/save-drawing`,
                        {
                            teamId: userTeam.teamId,
                            paths: paths
                        },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (stompClientRef.current?.connected) {
                        stompClientRef.current.publish({
                            destination: `/app/session/${accessCode}/teamchallenge/drawing/${userTeam.teamId}`,
                            body: JSON.stringify({
                                type: 'full',
                                data: paths
                            })
                        });
                    }
                }).catch(console.error);
            }, 1000);
        }
    }, [userRole, accessCode, userTeam?.teamId, token]);

    useEffect(() => {
        if (!userTeam?.teamId) return;
        const socket = new SockJS('http://localhost:8080/ws-sessions');
        const client = new Client({
            webSocketFactory: () => socket,
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setIsConnected(true);
                console.log('WebSocket connected');

                const personalQueue = `/user/queue/drawing-init`;
                client.subscribe(personalQueue, (message) => {
                    try {
                        console.log('Received initial drawing data');
                        const paths = JSON.parse(message.body);
                        if (canvasRef.current && paths && paths.length > 0) {
                            console.log('Loading initial paths:', paths.length);
                            canvasRef.current.loadPaths(paths);
                        } else {
                            console.log('No paths to load or invalid data');
                        }
                    } catch (error) {
                        console.error("Error processing initial drawing data:", error);
                    }
                });

                if (userTeam?.teamId) {
                    const pathsRef = { current: [] };

                    const drawingTopic = `/topic/session/${accessCode}/teamchallenge/drawing/${userTeam.teamId}`;
                    client.subscribe(drawingTopic, (message) => {
                        try {
                            const update = JSON.parse(message.body);
                            if (update.type === 'stroke' && userRole === 'guesser') {
                                const stroke = update.data;
                                if (canvasRef.current && stroke) {
                                    pathsRef.current.push(stroke);
                                    canvasRef.current.loadPaths(pathsRef.current);
                                }
                            } else if (update.type === 'clear') {
                                if (canvasRef.current) {
                                    console.log('Received clear command - clearing canvas');
                                    canvasRef.current.clearCanvas();
                                    pathsRef.current = [];
                                }
                            } else if (update.type === 'full') {
                                const paths = update.data;
                                if (canvasRef.current && paths) {
                                    if (paths.length === 0) {
                                        canvasRef.current.clearCanvas();
                                    } else {
                                        pathsRef.current = paths;
                                        canvasRef.current.loadPaths(paths);
                                    }
                                }
                            } else if (Array.isArray(update)) {
                                if (canvasRef.current) {
                                    if (update.length === 0) {
                                        canvasRef.current.clearCanvas();
                                        pathsRef.current = [];
                                    } else {
                                        pathsRef.current = update;
                                        canvasRef.current.loadPaths(update);
                                    }
                                }
                            }
                        } catch (error) {
                            console.error("Error processing drawing update:", error);
                        }
                    });
                    const promptTopic = `/topic/session/${accessCode}/teamchallenge/prompts`;
                    client.subscribe(promptTopic, (message) => {
                        const update = JSON.parse(message.body);
                        if (update.teamId === userTeam.teamId) {
                            setGuess('');
                            setError('');
                            fetchChallengeStatus();
                        }
                    });

                    // Modify guess handling to remove canvas clearing
                    const teamGuessTopic = `/topic/session/${accessCode}/teamchallenge/guess/${userTeam.teamId}`;
                    client.subscribe(teamGuessTopic, (message) => {
                        const guessResult = JSON.parse(message.body);
                        // Only update status without modifying canvas
                        fetchChallengeStatus();
                        fetchTeams();
                    });
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
            if (client.connected) {
                client.deactivate();
            }
        };
    }, [accessCode, userTeam?.teamId, userRole, fetchChallengeStatus]);
    const renderPrompt = () => {
        if (!userTeam || userRole !== 'drawer') return null;

        const prompt = getCurrentPrompt();
        const promptText = prompt.text || prompt.prompt || '';

        return (
            <div className="drawing-prompt">
                <h4>Draw this word:</h4>
                <p className="prompt-word">{promptText}</p>
                {challengeStatus.currentPromptIndex < (challengeStatus.totalPrompts - 1) && (
                    <p className="prompt-counter">
                        Word {challengeStatus.currentPromptIndex + 1} of {challengeStatus.totalPrompts}
                    </p>
                )}
            </div>
        );
    };


    useEffect(() => {
        if (challengeStatus.teams) {
            const currentTeamStatus = challengeStatus.teams.find(t => t.teamId === userTeam?.teamId);
            if (currentTeamStatus) {
                setUserTeam(prev => ({
                    ...prev,
                    currentContentIndex: currentTeamStatus.currentPromptIndex
                }));
            }
        }
    }, [challengeStatus.teams, userTeam?.teamId]);

    const getPromptFromContentStructure = (index) => {
        if (contentItem?.data?.prompts) {
            const prompt = contentItem.data.prompts[index];
            if (!prompt) return null;
            if (typeof prompt === 'object') {
                return prompt.text || prompt.prompt || '';
            }
            return prompt;
        }
        return null;
    };

    const getLegacyPrompt = (index) => {
        // Handle legacy format where prompts are directly in activity content
        if (content?.prompts?.[index]) {
            return content.prompts[index];
        }
        return null;
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
                    key={`draw-${userTeam?.teamId}`} // Use stable key with role prefix
                    ref={(ref) => {
                        canvasRef.current = ref;
                        setCanvasReady(!!ref);
                    }}
                    style={canvasStyle}
                    width="500px"
                    height="400px"
                    strokeWidth={4}
                    strokeColor="black"
                    eraserWidth={20}
                    canvasColor="white"
                    onStroke={handleStroke}
                    readOnly={false}
                    exportWithBackgroundImage={false}
                />
                <div className="drawing-controls" style={{ marginTop: '10px' }}>
                    <button
                        onClick={clearCanvas}
                        disabled={isSubmitting || !canvasReady}
                        style={{ marginRight: '10px', padding: '5px 10px' }}
                    >
                        Clear
                    </button>
                </div>
            </div>
        );
    };

    const renderGuessingInterface = () => {
        const prompt = getCurrentPrompt();
        const hints = prompt.hints || [];
        if (userRole !== 'guesser') return null;
        return (
            <div className="guessing-interface">
                <div className="current-drawing" style={{ marginBottom: '10px' }}>
                    <ReactSketchCanvas
                        key={`guess-${userTeam?.teamId}`}
                        ref={canvasRef}
                        style={{ border: '1px solid #000', boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)', borderRadius: '5px' }}
                        width="500px"
                        height="400px"
                        strokeWidth={4}
                        strokeColor="black"
                        canvasColor="white"
                        readOnly={true}
                        allowOnlyPointerType="none"
                        exportWithBackgroundImage={false}
                    />
                    <button
                        onClick={async () => {
                            await requestInitialCanvas();
                        }}
                        style={{ padding: '5px 10px', marginTop: '10px' }}
                    >
                        Refresh Canvas
                    </button>
                </div>
                {/* Add hints display for guesser */}
                {hints.length > 0 && (
                    <div className="hints-container" style={{
                        marginTop: '15px',
                        padding: '10px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '5px',
                        borderLeft: '4px solid #4caf50'
                    }}>
                        <h5 style={{ marginBottom: '8px', color: '#2e7d32' }}>
                            <i className="fas fa-lightbulb" style={{ marginRight: '5px' }}></i>
                            Hints
                        </h5>
                        <ul style={{ listStyleType: 'none', padding: 0 }}>
                            {hints.map((hint, idx) => (
                                <li key={idx} style={{
                                    padding: '5px 0',
                                    display: revealedHints.includes(idx) ? 'block' : 'none'
                                }}>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '25px',
                                        height: '25px',
                                        lineHeight: '25px',
                                        textAlign: 'center',
                                        backgroundColor: '#4caf50',
                                        color: 'white',
                                        borderRadius: '50%',
                                        marginRight: '10px'
                                    }}>{idx + 1}</span>
                                    {hint}
                                </li>
                            ))}
                        </ul>
                        {revealedHints.length < hints.length && (
                            <p style={{
                                marginTop: '8px',
                                fontSize: '0.9em',
                                color: '#6c757d',
                                fontStyle: 'italic'
                            }}>
                                More hints will appear as time runs out...
                            </p>
                        )}
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
                <div className="teamchallenge-timer">
                    Time Remaining: {timeRemaining}s
                </div>
                {challengeStatus.currentRound?.guesses?.length > 0 && (
                    <div className="guess-history" style={{ marginTop: '10px' }}>
                        <h5>Recent Guesses:</h5>
                        <ul style={{ listStyleType: 'none', padding: '5px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
                            {challengeStatus.currentRound.guesses
                                .filter(guess => guess.teamId === userTeam?.teamId) 
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
        return (
            <>
                {renderPrompt()}
                <div className="challenge-interface">
                    {renderDrawingInterface()}
                    {userRole === 'guesser' && renderGuessingInterface()}
                </div>
            </>
        );
    };
    return (
        <div className="team-challenge-activity" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h3>{activity.title || 'Team Drawing Challenge'}</h3>
            {activity.instructions && <p>{activity.instructions}</p>}
            {error && <p className="error-message" style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            {renderChallengeStatus()}
            {renderTeamInfo()}
            {renderContent()}

        </div>
    );
};

export default TeamChallengeActivity;