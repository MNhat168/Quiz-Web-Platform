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
    const [countdown, setCountdown] = useState(null);
    const [isCountdownDone, setIsCountdownDone] = useState(false);
    const navigate = useNavigate();

    const rankColors = [
        '!bg-yellow-100 !text-yellow-800',  // 1st
        '!bg-gray-100 !text-gray-800',      // 2nd
        '!bg-orange-100 !text-orange-800',  // 3rd
        '!bg-blue-50 !text-blue-800',       // others
    ];

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
            navigate('/student');
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
                if (response.data.currentActivity.contentItems?.length > 0) {
                    setCurrentContentIndex(0);
                    setCurrentContentItem(response.data.currentActivity.contentItems[0]);
                    // Remove startContentTimer call here
                } else {
                    setCurrentContentItem(null);
                    // Remove startContentTimer call here
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

                client.subscribe(`/topic/session/${accessCode}/status`, (message) => {
                    const newStatus = message.body;
                    setSessionStatus(newStatus);
                    if (newStatus === 'COMPLETED') {
                        setGameCompleted(true);
                        setIsCountdownDone(false);
                        setCountdown(null);
                        // Force a re-render by resetting current activity/content
                        setCurrentActivity(null);
                        setCurrentContentItem(null);
                    } else if (newStatus === 'ACTIVE') {
                        setIsCountdownDone(false);
                    }
                });

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
        navigate('/student');
    };

    const renderFinalLeaderboard = () => {
        // Sắp xếp top 3 đúng thứ tự: top1 ở giữa, top2 trái, top3 phải
        const sortedTop3 = [...participantScores]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        while (sortedTop3.length < 3) sortedTop3.push({ displayName: '', score: 0, userId: `empty${sortedTop3.length}` });
        const podiumOrder = [1, 0, 2];
        const podiumHeights = ['!h-24', '!h-32', '!h-20'];
        const borderColors = ['!border-gray-300', '!border-yellow-400', '!border-amber-700'];
        const bgPodium = ['!bg-gray-200', '!bg-yellow-300', '!bg-amber-200'];
        const medalIcons = [
            <span className="!text-2xl">🥈</span>,
            <span className="!text-3xl">🏆</span>,
            <span className="!text-xl">🥉</span>
        ];

        return (
          <div className="!relative !min-h-screen !flex !items-center !justify-center !z-10 !overflow-hidden">
            {/* SHAPE NỀN với animation Tailwind */}
            <div className="!absolute !top-0 !left-0 !w-96 !h-96 !bg-blue-400 !rounded-full !opacity-20 !-translate-x-1/2 !-translate-y-1/2 !z-0 !animate-[float-slow_8s_ease-in-out_infinite]" />
            <div className="!absolute !bottom-0 !right-0 !w-96 !h-96 !bg-orange-300 !rounded-full !opacity-20 !translate-x-1/2 !translate-y-1/2 !z-0 !animate-[float-medium_7s_ease-in-out_infinite]" />
            
            {/* CARD CHÍNH */}
            <div className="!relative !w-[95%] !max-w-[1200px] !bg-white !rounded-3xl !shadow-xl !p-6 !z-10 !animate-fadeIn">
              {/* HEADER */}
              <div className="!flex !items-center !justify-between !mb-8">
                <div className="!flex !items-center !gap-4">
                  <button
                    className="!flex !items-center !gap-2 !px-4 !py-2 !rounded-full !bg-gray-100 !hover:bg-gray-200 !text-gray-700 !font-semibold !shadow !transition-all !duration-200 !group"
                    onClick={handleReturnToLobby}
                  >
                    <svg
                      className="!w-5 !h-5 !text-purple-600 !group-hover:-translate-x-1 !transition-transform !duration-200"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                    <span className="!hidden sm:!inline">Back to Lobby</span>
                  </button>
                  <div className="!flex !items-center !gap-2">
                    <div className="!flex !items-center !justify-center !w-10 !h-10 !rounded-full !bg-purple-600 !text-white !font-bold !text-lg !animate-pulse">
                      {game?.currentActivityIndex + 1}/{game?.activities?.length || 1}
                    </div>
                    <div>
                      <h2 className="!font-bold !text-xl">{game?.title}</h2>
                      <p className="!text-gray-500 !text-sm">Activity</p>
                    </div>
                  </div>
                </div>
                
                <div className="!flex !items-center !gap-3">
                  <div className="!bg-orange-300 !text-orange-800 !rounded-xl !px-4 !py-2 !font-semibold !animate-bounce">
                    Code: {accessCode}
                  </div>
                  <div className="!bg-purple-700 !text-white !rounded-xl !px-4 !py-2 !font-bold !flex !items-center !gap-1 !animate-pulse">
                    <svg className="!w-5 !h-5 !inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 17.75V6.25" strokeWidth="2" strokeLinecap="round"/><path d="M18.25 12L12 17.75L5.75 12" strokeWidth="2" strokeLinecap="round"/></svg>
                    {participantScores.findIndex(entry => entry.userId === getStudentId()) + 1}st
                  </div>
                  <div className="!bg-purple-700 !text-white !rounded-xl !px-4 !py-2 !font-bold !animate-pulse">
                    {participantScores.find(entry => entry.userId === getStudentId())?.score || 0} Points
                  </div>
                </div>
              </div>
              
              {/* PODIUM TOP 3 */}
              <div className="!flex !justify-center !items-end !gap-8 !mb-12">
                {podiumOrder.map((orderIdx, idx) => {
                  const entry = sortedTop3[orderIdx];
                  return (
                    <div
                      key={entry.userId}
                      className={`!flex !flex-col !items-center !relative !transition-all !duration-500 ${
                        idx === 1 ? '!z-10 !scale-110' : '!z-0'
                      } !animate-slideUp`}
                      style={{ animationDelay: `${idx * 0.1 + 0.2}s` }}
                    >
                      <div
                        className={`!relative !rounded-full !border-4 ${borderColors[idx]} !bg-gray-100 !flex !items-center !justify-center !overflow-hidden !shadow-lg ${
                          idx === 1 ? '!w-28 !h-28' : idx === 0 ? '!w-24 !h-24' : '!w-20 !h-20'
                        } !animate-popIn`}
                        style={{ animationDelay: `${idx * 0.1 + 0.3}s` }}
                      >
                        {entry.avatarUrl
                          ? <img src={entry.avatarUrl} className="!w-full !h-full !object-cover" />
                          : <span className="!text-3xl !font-bold !text-gray-500">{entry.displayName?.charAt(0) || ''}</span>
                        }
                      </div>
                      {/* Podium base */}
                      <div className="!mt-2 !flex !flex-col !items-center">
                        <div className={`!w-16 ${podiumHeights[idx]} ${bgPodium[idx]} !rounded-t-lg !flex !items-center !justify-center !mb-1 !animate-shine`}>
                          {medalIcons[idx]}
                        </div>
                        <div className="!font-bold !text-center">{entry.displayName}</div>
                        <div className="!text-gray-500 !text-sm">{entry.score} pts</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* LEADERBOARD TABLE */}
              <div className="!bg-white !rounded-2xl !shadow-lg !p-6 !border !border-purple-100 !animate-slide-up !delay-300">
                <h3 className="!text-xl !font-bold !text-gray-800 !mb-4 !flex !items-center !gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="!w-6 !h-6 !text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Leaderboard
                </h3>
                <div className="!grid !grid-cols-4 !gap-4 !text-gray-600 !border-b !pb-3 !font-semibold !text-sm !md:text-base">
                  <div>Rank</div>
                  <div>Player</div>
                  <div>Correct Answers</div>
                  <div>Accuracy</div>
                </div>
                {participantScores.slice(0, 10).map((entry, idx) => {
                  const totalAnswers = entry.correctCount + entry.incorrectCount;
                  const correctPercentage = totalAnswers > 0
                    ? (entry.correctCount / totalAnswers) * 100
                    : 0;
                  const isCurrentUser = entry.userId === getStudentId();
                  return (
                    <div 
                      key={entry.userId} 
                      className={`!grid !grid-cols-4 !gap-4 !py-3 !items-center !border-b !transition-all !duration-300 ${isCurrentUser ? '!bg-purple-50' : idx % 2 === 0 ? '!bg-gray-50' : ''} !hover:bg-purple-50 !rounded-lg !my-1 !animate-fade-in`} 
                      style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
                    >
                      <div className="!flex !items-center !gap-2">
                        <div className={`!w-8 !h-8 !rounded-full ${idx < 3 ? rankColors[idx] : rankColors[3]} !flex !items-center !justify-center !font-bold !shadow-sm`}>
                          {idx + 1}
                        </div>
                      </div>
                      <div className="!flex !items-center !gap-3">
                        {entry.avatarUrl
                          ? <img src={entry.avatarUrl} className="!w-10 !h-10 !rounded-full !border-2 !border-gray-200 !shadow-sm" />
                          : <div className="!w-10 !h-10 !rounded-full !bg-gradient-to-br !from-purple-100 !to-blue-100 !flex !items-center !justify-center !shadow-sm">
                              <span className="!text-purple-500 !font-bold">{entry.displayName.charAt(0)}</span>
                            </div>
                        }
                        <span className={`!font-medium ${isCurrentUser ? '!text-purple-700' : ''}`}>{entry.displayName}</span>
                        {isCurrentUser && (
                          <span className="!bg-purple-200 !text-purple-800 !text-xs !px-2 !py-0.5 !rounded-full">You</span>
                        )}
                      </div>
                      <div className="!flex !items-center !gap-2">
                        <div className="!w-6 !h-6 !rounded-full !bg-green-100 !flex !items-center !justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="!w-4 !h-4 !text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="!font-medium">{entry.correctCount}</span>
                      </div>
                      <div>
                        <div className="!w-full !bg-gray-200 !rounded-full !h-2.5 !mb-1 !max-w-[120px]">
                          <div 
                            className="!h-2.5 !rounded-full !bg-gradient-to-r !from-green-400 !to-green-500" 
                            style={{ width: `${correctPercentage}%` }}
                          ></div>
                        </div>
                        <span className={`!text-xs !font-semibold !px-2 !py-1 !rounded-full ${
                          correctPercentage >= 80 ? '!bg-green-100 !text-green-700' : 
                          correctPercentage >= 50 ? '!bg-yellow-100 !text-yellow-700' : 
                          '!bg-red-100 !text-red-700'
                        }`}>
                          {correctPercentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
    };
    useEffect(() => {
        if (sessionStatus === 'ACTIVE' && !isCountdownDone) {
            setCountdown(3);
            const countdownInterval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(countdownInterval);
                        setIsCountdownDone(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

            return () => clearInterval(countdownInterval);
        }
    }, [sessionStatus, isCountdownDone]);

    const renderCountdown = () => {
        if (countdown === null || countdown === 0) return null;

        return (
            <div className="!fixed !inset-0 !bg-black/80 !flex !items-center !justify-center !z-[1000]">
                <div className="!text-white !text-9xl !font-bold !animate-pulse">
                    {countdown}
                </div>
            </div>
        );
    };

    useEffect(() => {
        if (isCountdownDone && currentContentItem) {
            resetContentTimer();
        }
    }, [isCountdownDone, currentContentItem]);

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
        const duration = contentOrActivity?.duration || contentOrActivity?.data?.duration || 60;
        console.log('Starting timer with duration:', duration);
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
        if (currentActivity.type === 'TEAM_CHALLENGE') {
            try {
                await axios.post(
                    `http://localhost:8080/api/sessions/${accessCode}/activity/${currentActivity.id}/advance-content`,
                    { currentContentIndex },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (error) {
                console.error('Failed to advance team challenge:', error);
            }
        }
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
    }, [currentActivity, contentTransitioning, accessCode, token, currentContentIndex]);

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
                    answer: {
                        ...answer,
                        timeRemaining: timeRemaining
                    },
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
                setTimeout(() => {
                    setSubmissionResult(null);
                }, 1500);
                return;
            }
            console.log('Submitting answer:', JSON.stringify(answer));
            console.log('Submission response:', response.data);
            setSubmissionResult(response.data);
            setTimeout(() => {
                setSubmissionResult(null);
            }, 1500);
            clearContentTimer();
            return response.data;
        } catch (error) {
            console.error('Failed to submit answer:', error);
            setSubmissionResult({
                correct: false,
                explanation: "Failed to submit answer. Please try again."
            });
            setTimeout(() => {
                setSubmissionResult(null);
            }, 1500);
        } finally {
            setSubmitting(false);
        }
    };

    const renderSubmissionResult = () => {
        if (!submissionResult) return null;

        return (
            <div className={`notification ${submissionResult.correct ? 'correct' : 'incorrect'}`}>
                <div className="notification-content">
                    <div className={`notification-icon ${submissionResult.correct ? 'correct' : 'incorrect'}`}>
                        {submissionResult.correct ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        )}
                    </div>

                    <div className="notification-text">
                        <h4 className={submissionResult.correct ? 'text-green-700' : 'text-red-700'}>
                            {submissionResult.correct ? 'Correct!' : 'Incorrect'}
                        </h4>

                        {submissionResult.pointsEarned && (
                            <span className="points-earned">
                                +{submissionResult.pointsEarned} points
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderLeaderboard = () => {
        if (!participantScores || participantScores.length === 0) {
            return null;
        }

        const currentStudentId = getStudentId();
        const currentStudentRank = participantScores.findIndex(entry => entry.userId === currentStudentId) + 1;
        const currentStudentScore = participantScores.find(entry => entry.userId === currentStudentId)?.score || 0;

        return (
            <div className="!w-full">
                <h3 className="!text-purple-600 !text-lg !font-bold !mb-3 !text-center !flex !items-center !justify-center !gap-2">
                    <svg className="!w-5 !h-5 !text-yellow-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                    </svg>
                    Leaderboard
                </h3>

                {/* Enhanced Current Student's Rank Display */}
                <div className="!mb-4 !p-3 !bg-gradient-to-r !from-purple-50 !to-pink-50 !rounded-xl !border !border-purple-200 !shadow-sm">
                    <div className="!flex !items-center !justify-between !mb-2">
                        <div className="!flex !items-center !gap-2">
                            <div className="!w-8 !h-8 !flex !items-center !justify-center !rounded-full !bg-gradient-to-r !from-purple-500 !to-pink-500 !text-white !font-bold !text-sm">
                                #{currentStudentRank}
                            </div>
                            <span className="!text-sm !font-medium !text-purple-700">Your Position</span>
                        </div>
                        <div className="!flex !items-center !gap-1 !text-yellow-500">
                            <svg className="!w-5 !h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                            </svg>
                        </div>
                    </div>
                    <div className="!flex !items-center !justify-between !mt-2">
                        <div className="!flex !items-center !gap-1">
                            <svg className="!w-4 !h-4 !text-purple-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"></path>
                            </svg>
                            <span className="!text-sm !font-bold !text-purple-600">{currentStudentScore} points</span>
                        </div>
                        <div className="!text-xs !text-purple-500 !font-medium">
                            {currentStudentRank === 1 ? '🏆 Leading!' :
                                currentStudentRank <= 3 ? '🔥 Top 3!' :
                                    currentStudentRank <= 5 ? '⭐ Top 5!' : 'Keep going!'}
                        </div>
                    </div>
                </div>

                <div className="!space-y-2 !max-h-[300px] !overflow-y-auto !pr-1">
                    {participantScores.slice(0, 5).map((entry, idx) => (
                        <div
                            key={entry.userId}
                            className={`!flex !items-center !p-2 !rounded-lg !transition-all !duration-300 ${entry.userId === currentStudentId
                                    ? '!bg-purple-100 !border !border-purple-200'
                                    : '!bg-gray-50'
                                }`}
                        >
                            <span className="!w-6 !h-6 !flex !items-center !justify-center !rounded-full !mr-2 !text-sm !font-medium !bg-purple-100 !text-purple-600">
                                {idx + 1}
                            </span>
                            <span className="!flex-1 !text-sm !font-medium !text-gray-700 !truncate">
                                {entry.displayName}
                                {idx === 0 && <span className="!inline-block !ml-1">👑</span>}
                            </span>
                            <span className="!text-sm !font-bold !text-purple-600">
                                {entry.score}
                            </span>
                        </div>
                    ))}
                </div>
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
            return (
                <div className="!flex !flex-col !items-center !justify-center !p-8 !bg-gradient-to-r !from-purple-50 !to-pink-50 !rounded-2xl !shadow-md !animate-fade-in !min-h-[200px]">
                    <div className="!w-16 !h-16 !mb-4 !rounded-full !bg-purple-100 !flex !items-center !justify-center !animate-pulse">
                        <svg className="!w-8 !h-8 !text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                    </div>
                    <p className="!text-lg !font-medium !text-purple-700 !text-center !animate-slide-up">No active activity</p>
                    <p className="!text-sm !text-purple-500 !mt-2 !text-center !max-w-xs !animate-slide-up !delay-100">Please select an activity to begin your learning journey!</p>
                </div>
            );
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
                return <FillInBlankGame
                    {...commonProps}
                    currentContentIndex={currentContentIndex}
                    onComplete={() => {
                        // Clear the timer when activity is completed
                        clearContentTimer();
                        // Advance to next content or activity
                        advanceToNextContent();
                    }}
                />;
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
                    <div className="!bg-white !rounded-xl !shadow-md !p-6 !border !border-yellow-200 !animate-fade-in">
                        <div className="!flex !items-center !justify-center !mb-4">
                            <div className="!w-12 !h-12 !rounded-full !bg-yellow-100 !flex !items-center !justify-center !text-yellow-500">
                                <svg className="!w-6 !h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                </svg>
                            </div>
                        </div>
                        <h3 className="!text-lg !font-bold !text-gray-800 !mb-3 !text-center">{currentActivity.title}</h3>
                        <p className="!text-gray-600 !mb-4 !text-center">{currentActivity.instructions}</p>
                        <div className="!bg-yellow-50 !border-l-4 !border-yellow-400 !p-4 !rounded-r-lg">
                            <p className="!text-yellow-700 !flex !items-center">
                                <svg className="!w-5 !h-5 !mr-2 !inline" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                                </svg>
                                Activity type '{currentActivity.type}' is not fully supported yet.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    if (loading) {
        return (
            <div className="!fixed !inset-0 !flex !flex-col !items-center !justify-center !bg-white !bg-opacity-90 !z-50">
                <div className="!w-16 !h-16 !relative !mb-6">
                    <div className="!absolute !inset-0 !border-4 !border-blue-200 !rounded-full"></div>
                    <div className="!absolute !inset-0 !border-4 !border-transparent !border-t-blue-500 !rounded-full !animate-spin"></div>
                </div>
                <p className="!text-lg !font-medium !text-gray-700 !animate-pulse">Loading game content...</p>
            </div>
        );
    }

    return (
        <div className={`background-container !min-h-screen !p-4 !md:p-6 !transition-all !duration-500 !relative !overflow-hidden ${transitionActive ? '!opacity-50' : '!opacity-100'}`}>
            {/* Floating game elements */}
            <div className="!absolute !w-20 !h-20 !bg-yellow-200 !rounded-full !opacity-20 !top-[10%] !left-[5%] !animate-float-slow"></div>
            <div className="!absolute !w-16 !h-16 !bg-blue-200 !rounded-full !opacity-20 !top-[30%] !right-[8%] !animate-float-medium"></div>
            <div className="!absolute !w-12 !h-12 !bg-purple-200 !rounded-full !opacity-20 !bottom-[15%] !left-[15%] !animate-float-fast"></div>
            <div className="!absolute !w-24 !h-24 !bg-pink-200 !rounded-full !opacity-20 !bottom-[25%] !right-[12%] !animate-float-slow"></div>

            {/* Decorative game elements */}
            <div className="!absolute !top-10 !left-10 !transform !rotate-12 !hidden !lg:block">
                <div className="!w-10 !h-10 !text-yellow-400 !opacity-30 !animate-spin-very-slow">✦</div>
            </div>
            <div className="!absolute !bottom-10 !right-20 !transform !-rotate-12 !hidden !lg:block">
                <div className="!w-10 !h-10 !text-purple-400 !opacity-30 !animate-spin-very-slow">✦</div>
            </div>

            {renderCountdown()}

            {gameCompleted ? (
                renderFinalLeaderboard()
            ) : !isCountdownDone ? null : (
                <div className="!max-w-6xl !mx-auto !space-y-6 !relative !z-10">
                    {/* Header Section */}
                    <div className="!bg-white !bg-opacity-95 !backdrop-blur-sm !rounded-2xl !shadow-lg !p-5 !animate-drop-in !border-2 !border-indigo-100">
                        <div className="!flex !flex-row !items-center !justify-between !gap-4">
                            <div className="!space-y-2">
                                <h2 className="!text-2xl !font-bold !text-gray-800 !flex !items-center">
                                    <span className="!w-8 !h-8 !mr-2 !bg-indigo-100 !rounded-full !flex !items-center !justify-center !animate-pulse-slow !leading-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="!h-5 !w-5 !text-indigo-600 !align-middle" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </span>
                                    <span className="!animate-text-glow">{game?.title}</span>
                                </h2>
                                {currentActivity && (
                                    <div className="!flex !items-center !gap-2">
                                        <span className="!px-4 !py-1.5 !bg-gradient-to-r !from-blue-500 !to-indigo-500 !text-white !rounded-full !text-sm !font-medium !shadow-sm !animate-pulse-subtle !flex !items-center">
                                            <span className="!w-5 !h-5 !bg-white !bg-opacity-20 !rounded-full !flex !items-center !justify-center !mr-2">
                                                {(game?.currentActivityIndex || 0) + 1}
                                            </span>
                                            Activity {(game?.currentActivityIndex || 0) + 1} of {game?.activities?.length || 1}
                                        </span>
                                        {renderContentNavigation()}
                                    </div>
                                )}
                            </div>
                            {timeRemaining > 0 && (
                                <div className="!px-5 !py-2.5 !bg-gradient-to-r !from-purple-500 !to-pink-500 !text-white !rounded-full !text-sm !font-medium !shadow-md !flex !items-center !animate-pulse-subtle">
                                    <div className="!w-6 !h-6 !mr-2 !relative">
                                        <div className="!absolute !inset-0 !border-3 !border-white !border-opacity-30 !rounded-full"></div>
                                        <div
                                            className="!absolute !inset-0 !border-3 !border-transparent !border-t-white !rounded-full !animate-spin"
                                            style={{ animationDuration: '2s' }}
                                        ></div>
                                    </div>
                                    <span className="!animate-text-pulse">Time Remaining: {timeRemaining}s</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Content Area with Flexbox Layout */}
                    <div className="!flex !flex-row !gap-6">
                        {/* Left Column - Activity (3/4 width) */}
                        <div className="!flex-1 lg:!w-3/4">
                            <div className="!bg-white !bg-opacity-95 !backdrop-blur-sm !rounded-2xl !shadow-lg !p-5 !animate-slide-up !border-2 !border-indigo-100 !relative !overflow-hidden">
                                {/* Decorative corner elements */}
                                <div className="!absolute !top-0 !left-0 !w-16 !h-16 !overflow-hidden">
                                    <div className="!absolute !top-0 !left-0 !w-20 !h-20 !bg-indigo-100 !rounded-full !-translate-x-10 !-translate-y-10"></div>
                                </div>
                                <div className="!absolute !bottom-0 !right-0 !w-16 !h-16 !overflow-hidden">
                                    <div className="!absolute !bottom-0 !right-0 !w-20 !h-20 !bg-indigo-100 !rounded-full !translate-x-10 !translate-y-10"></div>
                                </div>

                                <div className="!relative !z-10">
                                    {renderActivity()}
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Leaderboard (1/4 width) */}
                        <div className="!w-full lg:!w-1/4 !flex-shrink-0 !sticky !top-6 !h-fit">
                            <div className="!bg-white !bg-opacity-95 !backdrop-blur-sm !rounded-2xl !shadow-lg !p-5 !animate-slide-left !border-2 !border-indigo-100 !relative">
                                {/* Decorative element */}
                                <div className="!absolute !top-0 !right-0 !w-20 !h-20 !bg-gradient-to-br !from-yellow-200 !to-yellow-100 !opacity-50 !rounded-full !-translate-y-10 !translate-x-10"></div>

                                {/* Leaderboard content with margin instead of padding */}
                                <div className="!relative !z-20 ">
                                    {renderLeaderboard()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderSubmissionResult()}
                </div>
            )}

            {/* Activity transition overlay */}
            {transitionActive && (
                <div className="!fixed !inset-0 !bg-gradient-to-br !from-indigo-500/70 !to-purple-600/70 !backdrop-blur-sm !flex !items-center !justify-center !z-50 !animate-fade-in">
                    <div className="!relative">
                        <div className="!w-24 !h-24 !relative">
                            <div className="!absolute !inset-0 !border-4 !border-indigo-200 !rounded-full"></div>
                            <div className="!absolute !inset-0 !border-4 !border-transparent !border-t-indigo-500 !rounded-full !animate-spin"></div>
                        </div>

                        {/* Cute loading character */}
                        <div className="!absolute !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 !w-12 !h-12">
                            <div className="!w-12 !h-12 !bg-white !rounded-full !flex !items-center !justify-center !animate-bounce-slow">
                                <div className="!relative !w-8 !h-8">
                                    <div className="!absolute !w-2 !h-2 !bg-indigo-600 !rounded-full !top-1 !left-1.5 !animate-blink"></div>
                                    <div className="!absolute !w-2 !h-2 !bg-indigo-600 !rounded-full !top-1 !right-1.5 !animate-blink" style={{ animationDelay: '0.3s' }}></div>
                                    <div className="!absolute !w-4 !h-2 !bg-indigo-600 !rounded-full !bottom-1.5 !left-2 !animate-smile"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom animations */}
            <style jsx>{`
                .background-container {
                    background-image: url('/backgroundgame.jpg');
                    background-size: cover;
                    background-position: center;
                    background-attachment: fixed;
                }
                
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                @keyframes float-medium {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes float-fast {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                @keyframes blink {
                    0%, 90%, 100% { transform: scaleY(1); }
                    95% { transform: scaleY(0.1); }
                }
                @keyframes smile {
                    0%, 100% { transform: scaleX(1); }
                    50% { transform: scaleX(1.2) translateY(-1px); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.8; transform: scale(0.95); }
                }
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.95; transform: scale(0.98); }
                }
                @keyframes text-pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.8; }
                }
                @keyframes text-glow {
                    0%, 100% { text-shadow: 0 0 0 rgba(79, 70, 229, 0); }
                    50% { text-shadow: 0 0 10px rgba(79, 70, 229, 0.3); }
                }
                @keyframes drop-in {
                    0% { transform: translateY(-20px); opacity: 0; }
                    100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes slide-left {
                    0% { transform: translateX(20px); opacity: 0; }
                    100% { transform: translateX(0); opacity: 1; }
                }
                @keyframes spin-very-slow {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                .animate-float-slow { animation: float-slow 6s ease-in-out infinite; }
                .animate-float-medium { animation: float-medium 4s ease-in-out infinite; }
                .animate-float-fast { animation: float-fast 3s ease-in-out infinite; }
                .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
                .animate-blink { animation: blink 4s ease-in-out infinite; }
                .animate-smile { animation: smile 3s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 2s ease-in-out infinite; }
                .animate-pulse-subtle { animation: pulse-subtle 3s ease-in-out infinite; }
                .animate-text-pulse { animation: text-pulse 2s ease-in-out infinite; }
                .animate-text-glow { animation: text-glow 2s ease-in-out infinite; }
                .animate-drop-in { animation: drop-in 0.5s ease-out forwards; }
                .animate-slide-left { animation: slide-left 0.5s ease-out forwards; }
                .animate-spin-very-slow { animation: spin-very-slow 15s linear infinite; }
                
                .notification {
                    position: fixed;
                    top: 1rem;
                    right: 1rem;
                    max-width: 24rem;
                    padding: 1.2rem 1.5rem;
                    border-radius: 1rem;
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                    z-index: 50;
                    animation: slideInRight 0.4s ease-out forwards, fadeOut 2s ease-out forwards;
                    transform-origin: center right;
                }

                .notification.correct {
                    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
                    border: 2px solid #86efac;
                    color: #166534;
                }

                .notification.incorrect {
                    background: linear-gradient(135deg, #fee2e2, #fecaca);
                    border: 2px solid #fca5a5;
                    color: #991b1b;
                }

                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .notification-icon {
                    width: 3rem;
                    height: 3rem;
                    border-radius: 9999px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 1.5s infinite;
                }

                .notification-icon.correct {
                    background: linear-gradient(135deg, #bbf7d0, #86efac);
                    color: #166534;
                }

                .notification-icon.incorrect {
                    background: linear-gradient(135deg, #fecaca, #fca5a5);
                    color: #991b1b;
                }

                .notification-text {
                    display: flex;
                    flex-direction: column;
                }

                .notification-text h4 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin: 0;
                }

                .points-earned {
                    font-weight: 700;
                    font-size: 1.125rem;
                    color: #059669;
                    animation: bounce 1s infinite;
                }

                @keyframes slideInRight {
                    0% {
                        transform: translateX(100%) scale(0.8);
                        opacity: 0;
                    }
                    100% {
                        transform: translateX(0) scale(1);
                        opacity: 1;
                    }
                }

                @keyframes fadeOut {
                    0%, 70% {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(10%) scale(0.9);
                    }
                }
                
                @keyframes pulse {
                    0%, 100% {
                        transform: scale(1);
                    }
                    50% {
                        transform: scale(1.1);
                    }
                }
                
                @keyframes bounce {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-5px);
                    }
                }
            `}</style>
        </div>
    );
};

export default StudentGamePlay;