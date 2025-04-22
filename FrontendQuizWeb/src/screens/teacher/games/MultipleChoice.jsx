import { Plus, Trash2, X } from "lucide-react"
import "../../../style/games-multiplechoice.css"

const MultipleChoiceForm = ({ 
    content, 
    setContent, 
    currentHint, 
    setCurrentHint, 
    addHint, 
    removeHint 
  }) => {
    // Add new question
    const addQuestion = () => {
      setContent({
        ...content,
        questions: [
          ...content.questions,
          {
            question: "",
            options: [
              { text: "", isCorrect: false, explanation: "" },
              { text: "", isCorrect: false, explanation: "" }
            ],
            explanation: ""
          }
        ]
      });
    };
  
    // Remove a question
    const removeQuestion = (questionIndex) => {
      const updatedQuestions = content.questions.filter((_, idx) => idx !== questionIndex);
      setContent({
        ...content,
        questions: updatedQuestions
      });
    };
  
    // Add option to specific question
    const addOption = (questionIndex) => {
      const updatedQuestions = [...content.questions];
      updatedQuestions[questionIndex].options.push({
        text: "",
        isCorrect: false,
        explanation: ""
      });
      setContent({ ...content, questions: updatedQuestions });
    };
  
    // Remove option from specific question
    const removeOption = (questionIndex, optionIndex) => {
      const updatedQuestions = [...content.questions];
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);
      setContent({ ...content, questions: updatedQuestions });
    };
  
    // Handle question field changes
    const handleQuestionChange = (questionIndex, field, value) => {
      const updatedQuestions = [...content.questions];
      updatedQuestions[questionIndex][field] = value;
      setContent({ ...content, questions: updatedQuestions });
    };
  
    // Handle option changes
    const handleOptionChange = (questionIndex, optionIndex, field, value) => {
      const updatedQuestions = [...content.questions];
      updatedQuestions[questionIndex].options[optionIndex][field] = value;
      setContent({ ...content, questions: updatedQuestions });
    };
  
    return (
      <div className="multiple-choice-content">
        <div className="questions-list">
          {content.questions.map((question, questionIndex) => (
            <div key={questionIndex} className="question-container">
              <div className="question-header">
                <h4>Question {questionIndex + 1}</h4>
                <button
                  type="button"
                  className="remove-question-button"
                  onClick={() => removeQuestion(questionIndex)}
                  disabled={content.questions.length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
  
              <div className="form-group">
                <label className="form-label">Question Text</label>
                <input
                  className="form-question-input"
                  value={question.question}
                  onChange={(e) => handleQuestionChange(questionIndex, 'question', e.target.value)}
                />
              </div>
  
              <div className="form-options">
                <div className="form-options-header">
                  <h5>Answer Options</h5>
                </div>
  
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="option-row">
                    <div className="option-content">
                      <div className="option-checkbox">
                        <input
                          type="checkbox"
                          checked={option.isCorrect}
                          onChange={(e) => handleOptionChange(
                            questionIndex,
                            optionIndex,
                            'isCorrect',
                            e.target.checked
                          )}
                        />
                        <label>Correct</label>
                      </div>
  
                      <div className="option-input-group">
                        <input
                          type="text"
                          placeholder="Option text"
                          className="form-input"
                          value={option.text}
                          onChange={(e) => handleOptionChange(
                            questionIndex,
                            optionIndex,
                            'text',
                            e.target.value
                          )}
                        />
                        <input
                          type="text"
                          placeholder="Explanation (optional)"
                          className="form-input"
                          value={option.explanation}
                          onChange={(e) => handleOptionChange(
                            questionIndex,
                            optionIndex,
                            'explanation',
                            e.target.value
                          )}
                        />
                      </div>
                    </div>
  
                    <button
                      type="button"
                      className="remove-option-button"
                      onClick={() => removeOption(questionIndex, optionIndex)}
                      disabled={question.options.length <= 2}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
  
                <button
                  type="button"
                  className="add-option-button"
                  onClick={() => addOption(questionIndex)}
                >
                  <Plus className="w-4 h-4" /> Add Option
                </button>
              </div>
  
              <div className="form-group">
                <label>Explanation</label>
                <textarea
                  className="form-textarea"
                  value={question.explanation}
                  onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                />
              </div>
            </div>
          ))}
  
          <button
            type="button"
            className="add-question-button"
            onClick={addQuestion}
          >
            <Plus className="w-4 h-4" /> Add Question
          </button>
        </div>
  
        <div className="activity-settings">
          <div className="form-checkbox">
            <input
              type="checkbox"
              id="allowMultiple"
              checked={content.allowMultipleAnswers}
              onChange={(e) => setContent({
                ...content,
                allowMultipleAnswers: e.target.checked
              })}
            />
            <label htmlFor="allowMultiple">Allow multiple correct answers</label>
          </div>
        </div>

      {/* Hints Section */}
      <div className="hints-section">
        <h3 className="content-section-title">Hints</h3>
          <div className="add-hint-form">
            <input
              type="text"
              placeholder="Add a hint..."
              className="form-input"
              value={currentHint}
              onChange={(e) => setCurrentHint(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addHint()
                }
              }}
            />
            <button
              type="button"
              className="add-hint-button"
              onClick={addHint}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="hints-list">
            {content.hints.map((hint, index) => (
              <div key={index} className="hint-item">
                <span>{hint}</span>
                <button
                  type="button"
                  className="remove-hint-button"
                  onClick={() => removeHint(index)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
      </div>
    </div>
  )
}

export default MultipleChoiceForm