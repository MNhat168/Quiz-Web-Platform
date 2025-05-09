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
        duration: 60
    });

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
            duration: 60
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
    };

    return (
        <div className="activity-form-section">
            <div className="questions-list">
                {contentItems.map((item, index) => (
                    <div key={item.contentId} className="content-item">
                        <div className="item-header">
                            <h4>{item.title}</h4>
                            <button onClick={() => removeQuestion(index)} className="remove-button">
                                Remove
                            </button>
                        </div>
                        <div className="form-group">
                            <label>Question</label>
                            <input
                                type="text"
                                value={item.data.question}
                                onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                            />
                        </div>
                        
                        <div className="options-list">
                            {item.data.options.map((option, optIndex) => (
                                <div key={optIndex} className="option-item">
                                    <input
                                        type="text"
                                        value={option.text}
                                        onChange={(e) => updateOption(index, optIndex, 'text', e.target.value)}
                                        placeholder="Option text"
                                    />
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={option.isCorrect}
                                            onChange={(e) => updateOption(index, optIndex, 'isCorrect', e.target.checked)}
                                        />
                                        Correct Answer
                                    </label>
                                    <input
                                        type="text"
                                        value={option.explanation}
                                        onChange={(e) => updateOption(index, optIndex, 'explanation', e.target.value)}
                                        placeholder="Explanation"
                                    />
                                </div>
                            ))}
                            <button onClick={() => addOption(index)} className="add-option-button">
                                Add Option
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="new-question-form">
                <h4>Add New Question</h4>
                <div className="form-group">
                    <label>Question Text</label>
                    <input
                        type="text"
                        value={newQuestion.question}
                        onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                    />
                </div>
                
                <button onClick={addQuestionToItems} className="add-question-button">
                    Add Question to Activity
                </button>
            </div>

            <div className="hints-section">
                <h4>Hints</h4>
                <div className="hints-input">
                    <input
                        type="text"
                        value={currentHint}
                        onChange={(e) => setCurrentHint(e.target.value)}
                        placeholder="Enter a hint"
                    />
                    <button onClick={addHint}>Add Hint</button>
                </div>
                <div className="hints-list">
                    {contentItems[0]?.data.hints?.map((hint, index) => (
                        <div key={index} className="hint-item">
                            <span>{hint}</span>
                            <button onClick={() => removeHint(index)}>×</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MultipleChoiceForm;