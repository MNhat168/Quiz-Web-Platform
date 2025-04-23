import React from 'react';

const TextInputActivity = ({ activity, submitting, submitAnswer, textAnswer, setTextAnswer }) => {
    return (
        <div className="text-input-activity">
            <h3>{activity.title}</h3>
            <p>{activity.instructions}</p>
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
                    {submitting ? 'Submitting...' : 'Submit'}
                </button>
            </form>
        </div>
    );
};

export default TextInputActivity;