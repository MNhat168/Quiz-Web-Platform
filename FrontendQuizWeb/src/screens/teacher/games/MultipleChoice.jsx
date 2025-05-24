import { useState } from "react";
import { v4 as uuidv4 } from 'uuid';

const MultipleChoiceForm = ({ contentItems, setContentItems, currentHint, setCurrentHint, addHint, removeHint }) => {
    const [newQuestion, setNewQuestion] = useState({
        question: "",
        options: [
            { text: "", isCorrect: false, explanation: "" },
            { text: "", isCorrect: false, explanation: "" }
        ],
        explanation: "",
        duration: 60,
        multipleAnswers: false // New property to track if multiple answers are allowed
    });
    // Track which questions are collapsed
    const [collapsedQuestions, setCollapsedQuestions] = useState({});

    const addQuestionToItems = () => {
        if (!newQuestion.question.trim()) return;

        const newContentItem = {
            contentId: uuidv4(),
            title: `Question ${contentItems.length + 1}`,
            instructions: "",
            data: { ...newQuestion },
        };

        setContentItems([...contentItems, newContentItem]);
        setNewQuestion({
            question: "",
            options: [
                { text: "", isCorrect: false, explanation: "" },
                { text: "", isCorrect: false, explanation: "" }
            ],
            explanation: "",
            duration: 60,
            multipleAnswers: false
        });
    };

    const updateQuestion = (index, field, value) => {
        const updatedItems = [...contentItems];
        updatedItems[index].data[field] = value;
        setContentItems(updatedItems);
    };

    const updateOption = (itemIndex, optionIndex, field, value) => {
        const updatedItems = [...contentItems];
        updatedItems[itemIndex].data.options[optionIndex][field] = value;
        setContentItems(updatedItems);
    };

    const toggleOptionCorrect = (itemIndex, optionIndex) => {
        const updatedItems = [...contentItems];
        const question = updatedItems[itemIndex].data;
        
        if (question.multipleAnswers) {
            // For multiple answers, just toggle the current option
            question.options[optionIndex].isCorrect = !question.options[optionIndex].isCorrect;
        } else {
            // For single answer, set all options to false first
            question.options.forEach((option) => {
                option.isCorrect = false;
            });
            // Then set the clicked option to true
            question.options[optionIndex].isCorrect = true;
        }
        
        // Auto-collapse when at least one correct answer is selected
        if (hasCorrectAnswer(updatedItems[itemIndex]) && !collapsedQuestions[itemIndex]) {
            toggleCollapse(itemIndex);
        }
        
        setContentItems(updatedItems);
    };

    const toggleMultipleAnswers = (itemIndex) => {
        const updatedItems = [...contentItems];
        const currentValue = updatedItems[itemIndex].data.multipleAnswers;
        
        // Toggle the value
        updatedItems[itemIndex].data.multipleAnswers = !currentValue;
        
        // If switching from multiple to single and there are multiple correct answers,
        // keep only the first correct answer
        if (currentValue) { // was multiple, now single
            const correctOptions = updatedItems[itemIndex].data.options.filter(opt => opt.isCorrect);
            if (correctOptions.length > 1) {
                // Reset all to false
                updatedItems[itemIndex].data.options.forEach(opt => opt.isCorrect = false);
                // Set only the first one that was correct to true
                if (correctOptions.length > 0) {
                    const firstCorrectIndex = updatedItems[itemIndex].data.options.findIndex(
                        opt => opt.text === correctOptions[0].text
                    );
                    if (firstCorrectIndex !== -1) {
                        updatedItems[itemIndex].data.options[firstCorrectIndex].isCorrect = true;
                    }
                }
            }
        }
        
        setContentItems(updatedItems);
    };

    const addOption = (itemIndex) => {
        const updatedItems = [...contentItems];
        updatedItems[itemIndex].data.options.push({
            text: "",
            isCorrect: false,
            explanation: ""
        });
        setContentItems(updatedItems);
    };

    const removeQuestion = (index) => {
        const filteredItems = contentItems.filter((_, i) => i !== index);
        setContentItems(filteredItems);
        
        // Update collapsed state
        const updatedCollapsed = { ...collapsedQuestions };
        delete updatedCollapsed[index];
        
        // Adjust indexes for questions after the removed one
        const newCollapsed = {};
        Object.keys(updatedCollapsed).forEach(key => {
            const numKey = parseInt(key);
            if (numKey > index) {
                newCollapsed[numKey - 1] = updatedCollapsed[numKey];
            } else {
                newCollapsed[numKey] = updatedCollapsed[numKey];
            }
        });
        
        setCollapsedQuestions(newCollapsed);
    };
    
    const toggleCollapse = (index) => {
        setCollapsedQuestions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };
    
    const getCorrectOptionsText = (item) => {
        const correctOptions = item.data.options.filter(opt => opt.isCorrect);
        
        if (correctOptions.length === 0) return "No answer selected";
        
        if (correctOptions.length === 1) return correctOptions[0].text;
        
        // For multiple correct answers, format them nicely
        return correctOptions.map(opt => opt.text).join(", ");
    };
    
    const hasCorrectAnswer = (item) => {
        return item.data.options.some(opt => opt.isCorrect);
    };

    return (
        <div className="mc-editor">
            <div className="mc-questions-list">
                {contentItems.map((item, index) => (
                    <div key={item.contentId} className="mc-content-item">
                        {/* Collapsed view */}
                        {collapsedQuestions[index] && (
                            <div className="mc-collapsed-view" onClick={() => toggleCollapse(index)}>
                                <div className="mc-collapsed-content">
                                    <div className="mc-collapsed-question">
                                        <span className="mc-collapsed-number">{index + 1}</span>
                                        <span className="mc-collapsed-text">{item.data.question}</span>
                                        {item.data.multipleAnswers && (
                                            <span className="mc-multi-answer-badge">Multiple Answers</span>
                                        )}
                                    </div>
                                    {hasCorrectAnswer(item) && (
                                        <div className="mc-collapsed-answer">
                                            <span className="mc-collapsed-answer-label">Answer{item.data.multipleAnswers ? 's' : ''}:</span>
                                            <span className="mc-collapsed-answer-text">{getCorrectOptionsText(item)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mc-collapsed-actions">
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        toggleCollapse(index);
                                    }} className="mc-button mc-expand-button">
                                        <span className="mc-icon">↓</span> Edit
                                    </button>
                                    <button onClick={(e) => {
                                        e.stopPropagation();
                                        removeQuestion(index);
                                    }} className="mc-button mc-remove-button">
                                        <span className="mc-icon">×</span> Remove
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {/* Expanded view */}
                        {!collapsedQuestions[index] && (
                            <>
                                <div className="mc-item-header">
                                    <h4>{item.title}</h4>
                                    <div className="mc-item-actions">
                                        {hasCorrectAnswer(item) && (
                                            <button onClick={() => toggleCollapse(index)} className="mc-button mc-collapse-button">
                                                <span className="mc-icon">↑</span> Collapse
                                            </button>
                                        )}
                                        <button onClick={() => removeQuestion(index)} className="mc-button mc-remove-button">
                                            <span className="mc-icon">×</span> Remove
                                        </button>
                                    </div>
                                </div>
                                <div className="mc-form-group">
                                    <label>Question</label>
                                    <input
                                        type="text"
                                        value={item.data.question}
                                        onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                                        className="mc-input mc-question-input"
                                        placeholder="Enter your question here..."
                                    />
                                </div>

                                <div className="mc-answers-type-toggle">
                                    <label className="mc-toggle-switch">
                                        <input
                                            type="checkbox"
                                            checked={item.data.multipleAnswers}
                                            onChange={() => toggleMultipleAnswers(index)}
                                        />
                                        <span className="mc-toggle-slider"></span>
                                    </label>
                                    <span className="mc-toggle-label">
                                        {item.data.multipleAnswers ? "Multiple correct answers" : "Single correct answer"}
                                    </span>
                                </div>

                                <div className="mc-options-list">
                                    <div className="mc-options-header">
                                        <h5>Answer Options</h5>
                                        <p className="mc-options-instructions">
                                            {item.data.multipleAnswers 
                                                ? "Click on options to toggle them as correct or incorrect" 
                                                : "Click on an option to set it as the correct answer"}
                                        </p>
                                    </div>
                                    {item.data.options.map((option, optIndex) => (
                                        <div key={optIndex} className="mc-option-item">
                                            <div 
                                                className={`mc-option-block ${option.isCorrect ? 'mc-option-correct' : ''}`}
                                                onClick={() => toggleOptionCorrect(index, optIndex)}
                                            >
                                                <div className="mc-option-row">
                                                    <span className={`mc-option-marker ${item.data.multipleAnswers ? 'mc-checkbox' : 'mc-radio'} ${option.isCorrect ? 'mc-selected' : ''}`}>
                                                        {option.isCorrect && <span className="mc-check-icon">✓</span>}
                                                    </span>
                                                    <div className="mc-option-content">
                                                        <input
                                                            type="text"
                                                            value={option.text}
                                                            onChange={(e) => updateOption(index, optIndex, 'text', e.target.value)}
                                                            placeholder="Option text"
                                                            className="mc-input mc-option-text"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {option.isCorrect && (
                                                            <div className="mc-correct-badge">
                                                                <span className="mc-correct-icon">✓</span> Correct Answer
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => addOption(index)} className="mc-button mc-add-button">
                                        <span className="mc-icon">+</span> Add Option
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>

            <div className="mc-new-question-form">
                <div className="mc-section-header">
                    <h4>Add New Question</h4>
                </div>
                <div className="mc-form-group">
                    <label>Question Text</label>
                    <input
                        type="text"
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                        className="mc-input mc-question-input"
                        placeholder="Type your new question here..."
                    />
                </div>

                <div className="mc-answers-type-toggle">
                    <label className="mc-toggle-switch">
                        <input
                            type="checkbox"
                            checked={newQuestion.multipleAnswers}
                            onChange={() => setNewQuestion({ ...newQuestion, multipleAnswers: !newQuestion.multipleAnswers })}
                        />
                        <span className="mc-toggle-slider"></span>
                    </label>
                    <span className="mc-toggle-label">
                        {newQuestion.multipleAnswers ? "Multiple correct answers" : "Single correct answer"}
                    </span>
                </div>

                <button onClick={addQuestionToItems} className="mc-button mc-primary-button">
                    <span className="mc-icon">+</span> Add Question to Activity
                </button>
            </div>

            <style jsx>{`
                    /* MultipleChoice.css */
:root {
  --primary-color: #4a6cf7;
  --primary-hover: #3a5ce5;
  --danger-color: #ff5a5a;
  --danger-hover: #f53d3d;
  --success-color: #32d583;
  --success-hover: #2cbe76;
  --background-color: #f8f9fb;
  --card-bg: #ffffff;
  --border-color: #e1e5ee;
  --text-primary: #1a2b49;
  --text-secondary: #5e6577;
  --text-tertiary: #8a93a6;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.1);
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}

.mc-editor {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  color: var(--text-primary);
  background-color: var(--background-color);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  max-width: 900px;
  margin: 0 auto;
}

/* Section stylings */
.mc-questions-list,
.mc-new-question-form,
.mc-hints-section {
  margin-bottom: var(--spacing-xl);
}

.mc-content-item {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s ease-in-out;
}

.mc-content-item:hover {
  box-shadow: var(--shadow-md);
}

.mc-new-question-form,
.mc-hints-section {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

/* Headers */
.mc-item-header,
.mc-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-sm);
  border-bottom: 1px solid var(--border-color);
}

.mc-item-header h4,
.mc-section-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.mc-item-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.mc-options-header {
  margin: var(--spacing-md) 0 var(--spacing-sm);
  display: flex;
  flex-direction: column;
}

.mc-options-header h5 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.mc-options-instructions {
  margin: var(--spacing-xs) 0 0;
  font-size: 13px;
  color: var(--text-secondary);
  font-style: italic;
}

/* Form elements */
.mc-form-group {
  margin-bottom: var(--spacing-md);
}

.mc-form-group label {
  display: block;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
  font-size: 14px;
  color: var(--text-secondary);
}

.mc-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.mc-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(74, 108, 247, 0.15);
}

.mc-question-input {
  font-weight: 500;
}

/* Toggle Switch for Multiple Answers */
.mc-answers-type-toggle {
  display: flex;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.mc-toggle-switch {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
  margin-right: var(--spacing-sm);
}

.mc-toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.mc-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.mc-toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .mc-toggle-slider {
  background-color: var(--primary-color);
}

input:focus + .mc-toggle-slider {
  box-shadow: 0 0 1px var(--primary-color);
}

input:checked + .mc-toggle-slider:before {
  transform: translateX(24px);
}

.mc-toggle-label {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

/* Buttons */
.mc-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s, transform 0.1s;
}

.mc-button:active {
  transform: translateY(1px);
}

.mc-primary-button {
  background-color: var(--primary-color);
  color: white;
}

.mc-primary-button:hover {
  background-color: var(--primary-hover);
}

.mc-collapse-button {
  background-color: #f0f4ff;
  color: var(--primary-color);
}

.mc-collapse-button:hover {
  background-color: #e0e8ff;
}

.mc-expand-button {
  background-color: #e0e8ff;
  color: var(--primary-color);
}

.mc-expand-button:hover {
  background-color: #d0dcff;
}

.mc-add-button {
  background-color: var(--success-color);
  color: white;
  margin-top: var(--spacing-sm);
}

.mc-add-button:hover {
  background-color: var(--success-hover);
}

.mc-remove-button {
  background-color: transparent;
  color: var(--danger-color);
  border: 1px solid var(--danger-color);
  padding: 6px 12px;
}

.mc-remove-button:hover {
  background-color: var(--danger-color);
  color: white;
}

.mc-icon {
  font-size: 16px;
  margin-right: 4px;
}

/* Options styling */
.mc-options-list {
  background-color: #f8fafc;
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.mc-option-item {
  margin-bottom: var(--spacing-sm);
}

.mc-option-block {
  background-color: white;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.mc-option-block:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(74, 108, 247, 0.1);
}

.mc-option-correct {
  border-color: var(--success-color);
  background-color: rgba(50, 213, 131, 0.05);
}

.mc-option-correct:hover {
  border-color: var(--success-color);
  box-shadow: 0 0 0 2px rgba(50, 213, 131, 0.2);
}

.mc-option-row {
  display: flex;
  align-items: flex-start;
}

/* Option markers (radio/checkbox style) */
.mc-option-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: var(--spacing-md);
  flex-shrink: 0;
  margin-top: 8px;
  border: 2px solid var(--primary-color);
  position: relative;
}

.mc-radio {
  border-radius: 50%;
}

.mc-checkbox {
  border-radius: 4px;
}

.mc-selected {
  background-color: var(--primary-color);
  color: white;
}

.mc-check-icon {
  font-size: 14px;
  font-weight: bold;
}

.mc-option-content {
  flex: 1;
  position: relative;
}

.mc-correct-badge {
  display: inline-flex;
  align-items: center;
  background-color: var(--success-color);
  color: white;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 12px;
  margin-top: 8px;
}

.mc-correct-icon {
  margin-right: 4px;
  font-weight: bold;
}

/* Collapsed view styling */
.mc-collapsed-view {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.mc-collapsed-view:hover {
  background-color: #f8fafc;
}

.mc-collapsed-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.mc-collapsed-question {
  display: flex;
  align-items: center;
  font-weight: 500;
  margin-bottom: var(--spacing-xs);
}

.mc-collapsed-number {
  background-color: var(--primary-color);
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  margin-right: var(--spacing-md);
  flex-shrink: 0;
}

.mc-collapsed-text {
  font-size: 16px;
}

.mc-multi-answer-badge {
  font-size: 12px;
  background-color: var(--primary-color);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  margin-left: var(--spacing-sm);
}

.mc-collapsed-answer {
  margin-left: calc(24px + var(--spacing-md));
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.mc-collapsed-answer-label {
  margin-right: var(--spacing-xs);
  font-weight: 500;
}

.mc-collapsed-answer-text {
  color: var(--success-color);
  font-weight: 500;
}

.mc-collapsed-actions {
  display: flex;
  gap: var(--spacing-sm);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .mc-editor {
    padding: var(--spacing-md);
  }
  
  .mc-content-item,
  .mc-new-question-form,
  .mc-hints-section {
    padding: var(--spacing-md);
  }
  
  .mc-option-row {
    flex-direction: column;
  }
  
  .mc-option-marker {
    margin-bottom: var(--spacing-xs);
  }
  
  .mc-collapsed-view {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .mc-collapsed-actions {
    margin-top: var(--spacing-sm);
    align-self: flex-end;
  }
  
  .mc-collapsed-answer {
    margin-left: 0;
    margin-top: var(--spacing-xs);
  }
}
                `}</style>
        </div>
    );
};

export default MultipleChoiceForm;