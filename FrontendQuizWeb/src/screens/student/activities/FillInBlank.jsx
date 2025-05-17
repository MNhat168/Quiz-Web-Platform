import { useState, useEffect, useRef } from "react";
import { Lightbulb } from "lucide-react";

const FillInBlankGame = ({ 
    activity, 
    contentItem, 
    submitting, 
    submitAnswer, 
    currentContentIndex,
    onComplete = () => {} 
}) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState([]);
    const [showFeedback, setShowFeedback] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [answered, setAnswered] = useState(false);
    const [activeBlankIndex, setActiveBlankIndex] = useState(null);
    const [feedback, setFeedback] = useState({});
    const inputRef = useRef(null);

    // Unified content handling
    const getContent = () => {
        if (contentItem && contentItem.data) return contentItem.data;
        return activity?.content || { questions: [], hints: [] };
    };

    const content = getContent();

    // Reset state when content changes
    useEffect(() => {
        setCurrentQuestionIndex(0);
        setUserAnswers([]);
        setAnswered(false);
        setCurrentAnswer("");
        setActiveBlankIndex(null);
    }, [content, activity]);

    // Initialize userAnswers when question changes
    useEffect(() => {
        if (content.questions && content.questions[currentQuestionIndex]) {
            const question = content.questions[currentQuestionIndex];
            const parts = question.question.split(/_+/g);
            const blankCount = parts.length - 1;
            setUserAnswers(new Array(blankCount).fill(""));
        }
    }, [currentQuestionIndex, content]);

    // Focus input when activeBlankIndex changes
    useEffect(() => {
        if (activeBlankIndex !== null && inputRef.current) {
            inputRef.current.focus();
        }
    }, [activeBlankIndex]);

    // Get blank count from question text
    const getBlankCount = (questionText) => {
        const parts = questionText.split(/_+/g);
        return parts.length - 1;
    };

    // Get word count for a specific blank
    const getWordCount = (questionText, blankIndex) => {
        const parts = questionText.split(/_+/g);
        if (blankIndex >= parts.length - 1) return 1;
        
        const beforeBlank = parts[blankIndex];
        const afterBlank = parts[blankIndex + 1];
        const blankText = questionText.substring(
            beforeBlank.length,
            questionText.length - afterBlank.length
        );
        
        return blankText.includes('__') ? "multiple" : 1;
    };

    // Handle answer submission
    const handleAnswer = async (blankIndex) => {
        if (!currentAnswer.trim() || submitting || answered) return;

        try {
            const currentQuestion = content.questions[currentQuestionIndex];
            const correctAnswer = currentQuestion.answer[blankIndex];
            const alternatives = currentQuestion.alternatives?.[blankIndex] || [];
            
            // Format the answer data according to backend expectations
            const answerData = {
                questionIndex: currentQuestionIndex,
                blankIndex: blankIndex,
                answer: currentAnswer.trim(),
                acceptableAnswers: {
                    [currentQuestionIndex]: {
                        [blankIndex]: [correctAnswer, ...alternatives].filter(Boolean)
                    }
                }
            };

            setAnswered(true);
            const result = await submitAnswer(answerData);
            
            // Update user answers immediately
            const newAnswers = [...userAnswers];
            newAnswers[blankIndex] = currentAnswer.trim();
            setUserAnswers(newAnswers);
            
            // Normalize answers for comparison
            const normalizedUserAnswer = currentAnswer.trim().toLowerCase();
            const normalizedCorrectAnswer = correctAnswer.toLowerCase();
            const normalizedAlternatives = alternatives.map(alt => alt.toLowerCase());
            
            // Check if the answer matches the correct answer or any alternative
            const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
            const isAlternative = normalizedAlternatives.some(alt => alt === normalizedUserAnswer);
            
            // Set feedback based on answer type
            if (isCorrect) {
                setFeedback(prev => ({
                    ...prev,
                    [blankIndex]: {
                        correct: true
                    }
                }));
            } else if (isAlternative) {
                setFeedback(prev => ({
                    ...prev,
                    [blankIndex]: {
                        correct: true,
                        isAlternative: true,
                        correctAnswer: correctAnswer
                    }
                }));
            } else {
                setFeedback(prev => ({
                    ...prev,
                    [blankIndex]: {
                        correct: false,
                        correctAnswer: correctAnswer
                    }
                }));
            }
            
            // Reset current answer and active blank
            setCurrentAnswer("");
            setActiveBlankIndex(null);
            
            // Check if all blanks are filled
            const blankCount = getBlankCount(currentQuestion.question);
            const filledBlanks = newAnswers.filter(answer => answer && answer.trim() !== "").length;

            if (filledBlanks === blankCount) {
                // Add delay before moving to next question or completing
                setTimeout(() => {
                    if (currentQuestionIndex < content.questions.length - 1) {
                        setCurrentQuestionIndex(prev => prev + 1);
                        setAnswered(false);
                        setActiveBlankIndex(null);
                        setFeedback({}); // Reset feedback when moving to next question
                    } else {
                        // Notify server that all questions are completed
                        submitAnswer({
                            completed: true,
                            questionIndex: currentQuestionIndex,
                            allAnswers: newAnswers
                        }).then(() => {
                            // Call onComplete after server is notified
                            if (typeof onComplete === 'function') {
                                onComplete();
                            }
                        });
                    }
                }, 1500); // Reduced delay to 1.5 seconds
            } else {
                // Clear feedback after 1.5 seconds for single blank
                setTimeout(() => {
                    setFeedback(prev => {
                        const newFeedback = { ...prev };
                        delete newFeedback[blankIndex];
                        return newFeedback;
                    });
                    setAnswered(false);
                }, 1500);
            }
        } catch (error) {
            console.error('Error submitting answer:', error);
            setAnswered(false);
        }
    };

    if (currentQuestionIndex >= content.questions.length) {
        return (
            <div className="!p-6 !space-y-6 !bg-white !rounded-lg !shadow-md">
                <h2 className="!text-2xl !font-bold !text-center">Activity Complete!</h2>
                <div className="!space-y-4">
                    {content.questions.map((question, index) => (
                        <div key={index} className="!p-4 !border !rounded-lg">
                            <p className="!font-medium !mb-2">{question.question}</p>
                            <div className="!space-y-2">
                                {userAnswers.map((answer, blankIndex) => (
                                    <div key={blankIndex} className="!flex !items-center !gap-2">
                                        <p className="!text-gray-600">Blank {blankIndex + 1}: {answer || "No answer"}</p>
                                        <p className="!text-green-600">Correct: {question.answer[blankIndex]}</p>
                                    </div>
                                ))}
                            </div>
                            {question.explanation && (
                                <p className="!text-gray-500 !mt-2">Explanation: {question.explanation}</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const currentQuestion = content.questions[currentQuestionIndex];
    const parts = currentQuestion.question.split(/_+/g);

    return (
        <div className="!p-6 !space-y-6 !bg-white !rounded-lg !shadow-md">
            <div className="!flex !justify-between !items-center">
                <div className="!text-lg !font-medium">
                    {activity?.title || "Fill in the Blanks"}
                </div>
            </div>

            <div className="!space-y-6">
                <div className="!flex !flex-wrap !gap-2 !items-center">
                    {parts.map((part, index) => {
                        if (index < parts.length - 1) {
                            const isActive = activeBlankIndex === index;
                            const isAnswered = userAnswers[index];
                            const wordCount = getWordCount(currentQuestion.question, index);
                            
                            return (
                                <div key={index} className="!flex !items-center !gap-2">
                                    <span className="!text-gray-700">{part}</span>
                                    <button
                                        className={`!px-4 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500 transition-all duration-300 ${
                                            isActive ? '!bg-blue-50 !border-blue-500' : 
                                            isAnswered ? '!bg-green-50 !border-green-500' : 
                                            '!bg-gray-50 !border-gray-300'
                                        }`}
                                        onClick={() => {
                                            if (!isAnswered) {
                                                setActiveBlankIndex(index);
                                                setCurrentAnswer("");
                                            }
                                        }}
                                        disabled={submitting || isAnswered}
                                    >
                                        {isAnswered ? userAnswers[index] : '_'.repeat(wordCount === "multiple" ? 2 : 1)}
                                    </button>
                                </div>
                            );
                        }
                        return <span key={index} className="!text-gray-700">{part}</span>;
                    })}
                </div>

                {/* Display feedback below the question */}
                <div className="!space-y-2">
                    {Object.entries(feedback).map(([blankIndex, feedback]) => (
                        <div key={blankIndex} className={`!text-sm transition-opacity duration-300 ${feedback.correct ? '!text-green-500' : '!text-red-500'}`}>
                            {feedback.correct ? (
                                feedback.isAlternative ? (
                                    <div>
                                        In another answer: "{feedback.correctAnswer}"
                                    </div>
                                ) : null
                            ) : (
                                <div>
                                    Correct answer is "{feedback.correctAnswer}"
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {activeBlankIndex !== null && (
                    <div className="!flex !gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            className="!flex-1 !px-4 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500 transition-all duration-300"
                            value={currentAnswer}
                            onChange={(e) => setCurrentAnswer(e.target.value)}
                            placeholder={`Type ${getWordCount(currentQuestion.question, activeBlankIndex) === "multiple" ? "multiple" : "a"} word${getWordCount(currentQuestion.question, activeBlankIndex) === "multiple" ? "s" : ""} here...`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleAnswer(activeBlankIndex);
                                }
                            }}
                            disabled={answered}
                        />
                        <button 
                            className="!px-4 !py-2 !text-white !bg-blue-600 !rounded-md hover:!bg-blue-700 focus:!outline-none focus:!ring-2 focus:!ring-blue-500 transition-all duration-300"
                            onClick={() => handleAnswer(activeBlankIndex)}
                            disabled={answered}
                        >
                            {answered ? 'Submitted' : 'Submit'}
                        </button>
                    </div>
                )}

                {(content.hints || []).length > 0 && (
                    <div className="!space-y-2">
                        <button 
                            className="!flex !items-center !gap-2 !px-4 !py-2 !text-blue-600 hover:!text-blue-800 transition-colors duration-300"
                            onClick={() => setShowFeedback(!showFeedback)}
                        >
                            <Lightbulb className="!w-4 !h-4" /> Hint
                        </button>

                        {showFeedback && (
                            <div className="!p-4 !bg-gray-50 !rounded-md transition-all duration-300">
                                {(content.hints || []).map((hint, index) => (
                                    <p key={index} className="!text-gray-600">{hint}</p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FillInBlankGame;