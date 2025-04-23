import React from 'react';

const TrueFalseActivity = ({ activity, submitting, submitAnswer }) => {
    return (
        <div className="true-false-activity">
            <h3>{activity.title}</h3>
            <p>{activity.instructions}</p>
            <div className="tf-options">
                <button
                    onClick={() => submitAnswer(true)}
                    className="tf-option"
                    disabled={submitting}
                >
                    True
                </button>
                <button
                    onClick={() => submitAnswer(false)}
                    className="tf-option"
                    disabled={submitting}
                >
                    False
                </button>
            </div>
        </div>
    );
};

export default TrueFalseActivity;