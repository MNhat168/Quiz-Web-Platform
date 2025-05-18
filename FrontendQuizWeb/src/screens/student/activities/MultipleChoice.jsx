import React, { useState, useEffect } from 'react';

const MultipleChoiceActivity = ({ activity, submitting, submitAnswer, contentItem }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answered, setAnswered] = useState(false);

    useEffect(() => {
        setCurrentQuestionIndex(0);
        setAnswered(false);
    }, [activity, contentItem]);

    const getContent = () => {
        if (contentItem && contentItem.data) {
            return contentItem.data;
        }
        return activity.content || {};
    };

    const extractQuestions = (content) => {
        let questions = [];
        if (Array.isArray(content)) {
            questions = content;
        } else if (content.questions && Array.isArray(content.questions)) {
            questions = content.questions;
        } else if (typeof content === 'object') {
            questions = [content];
        }
        return questions;
    };

    const moveToNextQuestion = () => {
        const mcQuestions = extractQuestions(getContent());
        if (currentQuestionIndex < mcQuestions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setAnswered(false);
        }
    };

    const mcContent = getContent();
    const mcQuestions = extractQuestions(mcContent);
    if (mcQuestions.length === 0) {
        return (
            <div className="quiz-activity">
                <h3>{activity.title}</h3>
                <p>{activity.instructions}</p>
                <div className="error-message">
                    <p>This activity appears to be missing content.</p>
                </div>
            </div>
        );
    }
    const currentQuestion = mcQuestions[currentQuestionIndex];
    let options = [];

    if (currentQuestion) {
        if (Array.isArray(currentQuestion.options)) {
            options = currentQuestion.options;
        } else if (currentQuestion.options && typeof currentQuestion.options === 'object') {
            options = Object.values(currentQuestion.options);
        }
    }

    const handleSubmitAnswer = (answer, index) => {
        if (answered) return;
        submitAnswer({
            questionIndex: currentQuestionIndex,
            selectedOption: index // Send the index instead of text
        });
        setAnswered(true);
    };

    return (
        <div className="quiz-activity">
            <h3>{activity.title}</h3>
            <p>{activity.instructions}</p>

            <h4>{currentQuestion.question || currentQuestion.text || "Question"}</h4>
            <div className="flex flex-row gap-2 py-2 overflow-x-auto">  {/* Removed overflow-x-auto */}
                {options.length > 0 ? (
                    options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => handleSubmitAnswer(option, index)}
                            className={`flex-1 min-w-[120px] p-3 rounded-lg transition-colors whitespace-nowrap ${
                                answered 
                                    ? 'bg-gray-200 cursor-default text-gray-800' 
                                    : 'bg-white hover:bg-blue-100 text-gray-800 border border-gray-300'
                            } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={submitting || answered}
                        >
                            {typeof option === 'object' ? option.text : option}
                        </button>
                    ))
                ) : (
                    <p className="no-options">No answer options available</p>
                )}
            </div>
        </div>
    );
};

export default MultipleChoiceActivity;