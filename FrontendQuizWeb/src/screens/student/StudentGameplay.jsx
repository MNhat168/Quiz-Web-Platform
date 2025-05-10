import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useNavigate } from 'react-router-dom';
import '../../style/gameplay.css';

import MultipleChoiceActivity from './activities/MultipleChoice';
import TrueFalseActivity from './activities/TrueFalse';
import TextInputActivity from './activities/TextInput';
import SortingActivity from './activities/Sorting';
import MatchingActivity from './activities/Matching';
import MathProblemActivity from './activities/MathProblem';
import TeamChallengeActivity from './activities/Teamchallenge';
import FillInBlankGame from './activities/FillInBlank';


const StudentGamePlay = () => {
    const [textAnswer, setTextAnswer] = useState('');
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [game, setGame] = useState(null);
    const [currentActivity, setCurrentActivity] = useState(null);
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    const [currentContentItem, setCurrentContentItem] = useState(null);
    const [stompClient, setStompClient] = useState(null);
    const [sessionStatus, setSessionStatus] = useState('ACTIVE');
    const [submitting, setSubmitting] = useState(false);
    const [submissionResult, setSubmissionResult] = useState(null);
    const [participantScores, setParticipantScores] = useState([]);
    const [transitionActive, setTransitionActive] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [contentTransitioning, setContentTransitioning] = useState(false);
    const [gameCompleted, setGameCompleted] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        setTextAnswer('');
        resetContentTimer();
        setSubmissionResult(null);
    }, [currentActivity, currentContentItem]);

    const accessCode = new URLSearchParams(window.location.search).get('accessCode') ||
        localStorage.getItem('studentSessionAccessCode');

    const getStudentId = () => {
        try {
            const tokenPayload = JSON.parse(atob(token.split(".")[1]));
            return tokenPayload.sub;
        } catch (e) {
            console.error("Failed to extract student ID from token:", e);
            return null;
        }
    };

    useEffect(() => {
        return () => {
            clearContentTimer(); 
        };
    }, []);

    useEffect(() => {
        if (!accessCode) {
            navigate('/student/join');
            return;
        }
        fetchGameContent();
        setupWebSocket();
        return () => {
            if (stompClient) {
                stompClient.deactivate();
            }
            clearContentTimer();
        };
    }, [accessCode]);

    const fetchGameContent = async () => {
        try {
            setLoading(true);
            const response = await axios.get(
                `http://localhost:8080/api/sessions/${accessCode}/game`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setGame(response.data);
            if (response.data.currentActivity) {
                setCurrentActivity(response.data.currentActivity);
                if (response.data.currentActivity.contentItems &&
                    response.data.currentActivity.contentItems.length > 0) {
                    setCurrentContentIndex(0);
                    setCurrentContentItem(response.data.currentActivity.contentItems[0]);
                    startContentTimer(response.data.currentActivity.contentItems[0]);
                } else {
                    setCurrentContentItem(null);
                    startContentTimer(response.data.currentActivity);
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch game content:', error);
            setLoading(false);
        }
    };

    const setupWebSocket = () => {
        const client = new Client({
            webSocketFactory: () => new SockJS('http://localhost:8080/ws-sessions'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            onConnect: () => {
                console.log('WebSocket connected for game play');
                client.subscribe(`/topic/session/${accessCode}/activity`, (message) => {
                    const activityData = JSON.parse(message.body);
                    console.log(activityData)
                    setCurrentActivity(activityData);
                    setCurrentContentIndex(0);
                    setCurrentContentItem(activityData.contentItems?.[0] || null);
                });

                client.subscribe(
                    `/topic/session/${accessCode}/status`,
                    (message) => {
                        console.log('Received session status update:', message.body);
                        const newStatus = message.body;
                        setSessionStatus(newStatus);
                        if (newStatus === 'COMPLETED') {
                            setGameCompleted(true);
                        }
                    }
                );

                client.subscribe(
                    `/topic/session/${accessCode}/leaderboard`,
                    (message) => {
                        const leaderboardData = JSON.parse(message.body);
                        setParticipantScores(leaderboardData);
                    }
                );

                client.subscribe(`/topic/session/${accessCode}/content`, (message) => {
                    const contentData = JSON.parse(message.body);
                    if (contentData.status === 'advanced_content') {
                        clearContentTimer();
                        setTimeRemaining(0);
                        setTimeout(() => {
                            handleContentTransition(contentData.contentItem, contentData.currentIndex);
                        }, 50);
                    }
                });
            },
            onStompError: (frame) => {
                console.error('STOMP Error:', frame);
            }
        });

        client.activate();
        setStompClient(client);
    };

    const handleReturnToLobby = () => {
        localStorage.removeItem('studentSessionAccessCode');
        localStorage.removeItem('studentJoinedStatus');
        navigate('/student/join');
    };

    const renderFinalLeaderboard = () => {
        return (
            <div className="final-leaderboard-container">
                <div className="final-leaderboard-overlay">
                    <div className="final-leaderboard">
                        <h2>Game Complete!</h2>
                        <h3>Final Results</h3>

                        {participantScores.length === 0 ? (
                            <p>Loading final scores...</p>
                        ) : (
                            <div className="final-scores">
                                {participantScores.slice(0, 10).map((entry, index) => (
                                    <div key={entry.userId} className={`leaderboard-entry ${index < 3 ? 'top-' + (index + 1) : ''}`}>
                                        <span className="rank">{index + 1}</span>
                                        <span className="player-name">{entry.displayName}</span>
                                        <span className="score">{entry.score} points</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {(() => {
                            const studentId = getStudentId();
                            const userPosition = participantScores.findIndex(p => p.userId === studentId);
                            if (userPosition !== -1) {
                                const userScore = participantScores[userPosition];
                                return (
                                    <div className="your-score">
                                        <h4>Your Score</h4>
                                        <p>Rank: {userPosition + 1}</p>
                                        <p>Score: {userScore.score} points</p>
                                    </div>
                                );
                            }
                            return null;
                        })()}

                        <button
                            className="return-to-lobby-button"
                            onClick={handleReturnToLobby}>
                            Return to Lobby
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const handleActivityTransition = (newActivity) => {
        setTransitionActive(true);
        clearContentTimer();
        setSubmissionResult(null);

        setTimeout(() => {
            setCurrentActivity(newActivity);
            setCurrentContentIndex(0);
            if (newActivity.contentItems && newActivity.contentItems.length > 0) {
                setCurrentContentItem(newActivity.contentItems[0]);
                startContentTimer(newActivity.contentItems[0]);
            } else {
                setCurrentContentItem(null);
                startContentTimer(newActivity);
            }
            setTransitionActive(false);
        }, 1000);
    };

    const handleContentTransition = (newContentItem, newIndex) => {
        clearContentTimer(); 
        setContentTransitioning(true);
        setTimeRemaining(0);
        setSubmissionResult(null);

        setTimeout(() => {
            setCurrentContentItem(newContentItem);
            setCurrentContentIndex(newIndex);
            startContentTimer(newContentItem); 
            setContentTransitioning(false);
        }, 500);
    };

    const contentTimerId = useRef(null);

    const startContentTimer = (contentOrActivity) => {
        clearContentTimer(); 
        const duration = contentOrActivity?.duration || 60;
        setTimeRemaining(duration);

        contentTimerId.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(contentTimerId.current);
                    advanceToNextContent();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const clearContentTimer = () => {
        if (contentTimerId.current) {
            clearInterval(contentTimerId.current);
            contentTimerId.current = null;
        }
    };

    const advanceToNextContent = useCallback(async () => {
        if (contentTransitioning) return;
        if (!currentActivity) return;
        if (currentActivity.contentItems && currentActivity.contentItems.length > 0) {
            if (currentContentIndex < currentActivity.contentItems.length - 1) {
                setContentTransitioning(true);
                setTransitionActive(true);

                setTimeout(() => {
                    const nextIndex = currentContentIndex + 1;
                    setCurrentContentIndex(nextIndex);
                    setCurrentContentItem(currentActivity.contentItems[nextIndex]);
                    startContentTimer(currentActivity.contentItems[nextIndex]);
                    setSubmissionResult(null);
                    setTransitionActive(false);
                    setContentTransitioning(false);
                }, 500);
            } else {
                advanceToNextActivity();
            }
        } else {
            advanceToNextActivity();
        }
    }, [currentActivity, currentContentIndex, contentTransitioning]);

    const resetContentTimer = () => {
        if (currentContentItem) {
            startContentTimer(currentContentItem);
        } else if (currentActivity) {
            startContentTimer(currentActivity);
        }
    };

    const advanceToNextActivity = useCallback(async () => {
        if (!game || !currentActivity || contentTransitioning) return;

        try {
            const sessionResponse = await axios.get(
                `http://localhost:8080/api/sessions/${accessCode}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const freshActivityId = sessionResponse.data.currentActivity?.activityId;

            if (!freshActivityId || freshActivityId !== currentActivity.id) {
                handleActivityTransition(sessionResponse.data.currentActivity);
                return;
            }
            await axios.post(
                `http://localhost:8080/api/sessions/${accessCode}/activity/${freshActivityId}/advance-content`,
                { currentContentIndex },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (error) {
            console.error('Failed to advance:', error);
            fetchGameContent(); 
        }
    }, [accessCode, token, currentActivity, contentTransitioning]);

    const submitAnswer = async (answer) => {
        const studentId = getStudentId();
        if (!studentId || !currentActivity || !currentActivity.id) {
            console.error('Missing required information for submission');
            return;
        }
        setSubmitting(true);
        setSubmissionResult(null);

        try {
            const contentId = currentContentItem ? currentContentItem.contentId : "legacy";

            const response = await axios.post(
                `http://localhost:8080/api/sessions/${accessCode}/submit`,
                {
                    activityId: currentActivity.id,
                    contentId: contentId,
                    answer: answer,
                    contentIndex: currentContentIndex  
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Student-Id': studentId
                    }
                }
            );

            if (response.data.valid === false) {
                setSubmissionResult({
                    correct: false,
                    explanation: response.data.error || "Invalid submission."
                });
                return;
            }
            console.log('Submitting answer:', JSON.stringify(answer));
            console.log('Submission response:', response.data);
            setSubmissionResult(response.data);
            clearContentTimer();
            return response.data;
        } catch (error) {
            console.error('Failed to submit answer:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const renderSubmissionResult = () => {
        if (!submissionResult) return null;

        return (
            <div className={`submission-result ${submissionResult.correct ? 'correct' : 'incorrect'}`}>
                <h4>{submissionResult.correct ? 'Correct!' : 'Incorrect'}</h4>
                {submissionResult.explanation && (
                    <p className="explanation">{submissionResult.explanation}</p>
                )}
                {submissionResult.pointsEarned && (
                    <p className="points">+ {submissionResult.pointsEarned} points</p>
                )}
            </div>
        );
    };

    const renderLeaderboard = () => {
        if (!participantScores || participantScores.length === 0) {
            return null;
        }

        return (
            <div className="leaderboard">
                <h3>Leaderboard</h3>
                <ul>
                    {participantScores.slice(0, 5).map((entry, index) => (
                        <li key={entry.userId} className="leaderboard-entry">
                            <span className="rank">{index + 1}</span>
                            <span className="player-name">{entry.displayName}</span>
                            <span className="score">{entry.score}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderContentNavigation = () => {
        if (!currentActivity || !currentActivity.contentItems || currentActivity.contentItems.length <= 1) {
            return null;
        }

        return (
            <div className="content-navigation">
                <div className="content-progress">
                    {Array.from({ length: currentActivity.contentItems.length }).map((_, index) => (
                        <div
                            key={index}
                            className={`progress-dot ${index === currentContentIndex ? 'active' : ''} ${index < currentContentIndex ? 'completed' : ''}`}
                        />
                    ))}
                </div>
                <div className="content-counter">
                    {currentContentIndex + 1} / {currentActivity.contentItems.length}
                </div>
                {timeRemaining > 0 && (
                    <div className="time-remaining">
                        Time left: {timeRemaining}s
                    </div>
                )}
            </div>
        );
    };

    const getCurrentContent = () => {
        if (currentContentItem) {
            return currentContentItem.data;
        } else if (currentActivity) {
            return currentActivity.content;
        }
        return null;
    };

    const renderActivity = () => {
        if (!currentActivity) {
            return <div>No active activity</div>;
        }

        const content = getCurrentContent();
        const commonProps = {
            activity: currentActivity,
            content: content,
            submitting: submitting,
            submitAnswer: submitAnswer,
            textAnswer: textAnswer,
            setTextAnswer: setTextAnswer,
            contentItem: currentContentItem,
            accessCode: accessCode,  
            currentContentIndex: currentContentIndex
        };

        switch (currentActivity.type) {
            case 'MULTIPLE_CHOICE':
                return <MultipleChoiceActivity {...commonProps} />;
            case 'TRUE_FALSE':
                return <TrueFalseActivity {...commonProps} />;
            case 'OPEN_ENDED':
                return <TextInputActivity {...commonProps} />;
            case 'FILL_IN_BLANK':
                return <FillInBlankGame {...commonProps} currentContentIndex={currentContentIndex} />;
            case 'SORTING':
                return <SortingActivity {...commonProps} />;
            case 'MATCHING':
                return <MatchingActivity {...commonProps} contentItem={currentContentItem} />;
            case 'MATH_PROBLEM':
                return <MathProblemActivity {...commonProps} />;
            case 'TEAM_CHALLENGE':
                return <TeamChallengeActivity {...commonProps} />;
            default:
                return (
                    <div className="unsupported-activity">
                        <h3>{currentActivity.title}</h3>
                        <p>{currentActivity.instructions}</p>
                        <p>Activity type '{currentActivity.type}' is not fully supported yet.</p>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading game content...</p>
            </div>
        );
    }

    return (
        <div className={`student-game-play ${transitionActive ? 'activity-transition' : ''}`}>
            {gameCompleted ? (
                renderFinalLeaderboard()
            ) : (
                <>
                    <div className="game-header">
                        <h2>{game?.title}</h2>
                        {currentActivity && (
                            <div className="activity-info">
                                <span className="activity-number">
                                    Activity {(game?.currentActivityIndex || 0) + 1} of {game?.activities?.length || 1}
                                </span>
                                {renderContentNavigation()}
                            </div>
                        )}
                    </div>

                    <div className="activity-container">
                        {renderActivity()}
                        {renderSubmissionResult()}
                    </div>

                    <div className="game-footer">
                        {renderLeaderboard()}
                    </div>
                </>
            )}
        </div>
    );
};

export default StudentGamePlay;