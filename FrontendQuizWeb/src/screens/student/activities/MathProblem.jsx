import React from 'react';

const MathProblemActivity = ({ activity, submitting, submitAnswer, textAnswer, setTextAnswer }) => {
    const mathContent = activity.content || {};

    return (
        <div className="math-problem-activity">
            <h3>{activity.title}</h3>
            <p>{activity.instructions}</p>
            <div className="math-problem">
                <p>{mathContent.problem}</p>
            </div>
            <form onSubmit={(e) => {
                e.preventDefault();
                submitAnswer(textAnswer);
            }}>
                <input
                    type="text"
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Enter your answer"
                    disabled={submitting}
                />
                <button type="submit" disabled={submitting}>
                    Submit Answer
                </button>
            </form>
        </div>
    );
};

export default MathProblemActivity;