import { useState, useEffect } from "react"
import { Plus, X, Trash2, Lightbulb } from "lucide-react"

const FillInBlankForm = ({ 
    content = { questions: [], hints: [] }, 
    setContent, 
    currentHint = "", 
    setCurrentHint, 
    addHint, 
    removeHint
}) => {
    // Ensure content.questions is always an array
    const questions = content?.questions || [];

    // Add default question if there are no questions
    useEffect(() => {
        if (questions.length === 0) {
            const defaultQuestion = {
                question: "",
                answer: [], // Changed to array to support multiple blanks
                alternatives: [], // Changed to array of arrays
                explanation: ""
            };
            setContent({
                ...content,
                questions: [defaultQuestion]
            });
        }
    }, []);

    // Add new question
    const addQuestion = () => {
        const newQuestion = {
            question: "",
            answer: [],
            alternatives: [],
            explanation: ""
        };

        setContent({
            ...content,
            questions: [...questions, newQuestion]
        });
    };

    // Remove a question
    const removeQuestion = (questionIndex) => {
        const updatedQuestions = questions.filter((_, idx) => idx !== questionIndex);
        setContent({
            ...content,
            questions: updatedQuestions
        });
    };

    // Add alternative answer for a specific blank
    const addAlternative = (questionIndex, blankIndex) => {
        const updatedQuestions = [...questions];
        if (!updatedQuestions[questionIndex].alternatives[blankIndex]) {
            updatedQuestions[questionIndex].alternatives[blankIndex] = [];
        }
        updatedQuestions[questionIndex].alternatives[blankIndex].push("");
        setContent({ ...content, questions: updatedQuestions });
    };

    // Remove alternative answer for a specific blank
    const removeAlternative = (questionIndex, blankIndex, alternativeIndex) => {
        const updatedQuestions = [...questions];
        if (updatedQuestions[questionIndex].alternatives[blankIndex]) {
            updatedQuestions[questionIndex].alternatives[blankIndex].splice(alternativeIndex, 1);
            setContent({ ...content, questions: updatedQuestions });
        }
    };

    // Handle question field changes
    const handleQuestionChange = (questionIndex, field, value) => {
        const updatedQuestions = [...questions];
        updatedQuestions[questionIndex] = {
            ...updatedQuestions[questionIndex],
            [field]: value
        };
        setContent({ ...content, questions: updatedQuestions });
    };

    // Handle answer changes for a specific blank
    const handleAnswerChange = (questionIndex, blankIndex, value) => {
        const updatedQuestions = [...questions];
        if (!updatedQuestions[questionIndex].answer) {
            updatedQuestions[questionIndex].answer = [];
        }
        
        // Validate input based on word count
        const wordCount = getWordCount(updatedQuestions[questionIndex].question, blankIndex);
        if (wordCount === 1) {
            // If it's a single word blank, remove all spaces
            value = value.replace(/\s+/g, '');
        }
        
        updatedQuestions[questionIndex].answer[blankIndex] = value;
        setContent({ ...content, questions: updatedQuestions });
    };

    // Handle alternative changes for a specific blank
    const handleAlternativeChange = (questionIndex, blankIndex, alternativeIndex, value) => {
        const updatedQuestions = [...questions];
        if (!updatedQuestions[questionIndex].alternatives[blankIndex]) {
            updatedQuestions[questionIndex].alternatives[blankIndex] = [];
        }
        
        // Validate input based on word count
        const wordCount = getWordCount(updatedQuestions[questionIndex].question, blankIndex);
        if (wordCount === 1) {
            // If it's a single word blank, remove all spaces
            value = value.replace(/\s+/g, '');
        }
        
        updatedQuestions[questionIndex].alternatives[blankIndex][alternativeIndex] = value;
        setContent({ ...content, questions: updatedQuestions });
    };

    // Validate answer on blur
    const handleAnswerBlur = (questionIndex, blankIndex) => {
        const question = questions[questionIndex];
        const wordCount = getWordCount(question.question, blankIndex);
        const answer = question.answer[blankIndex] || '';
        
        // Count actual words (excluding spaces)
        const wordCountInAnswer = answer.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        if (wordCount === "multiple" && wordCountInAnswer < 2) {
            const updatedQuestions = [...questions];
            updatedQuestions[questionIndex].answer[blankIndex] = '';
            setContent({ ...content, questions: updatedQuestions });
            alert("This blank requires at least 2 words. Please enter multiple words.");
        }
    };

    // Validate alternative on blur
    const handleAlternativeBlur = (questionIndex, blankIndex, alternativeIndex) => {
        const question = questions[questionIndex];
        const wordCount = getWordCount(question.question, blankIndex);
        const alternative = question.alternatives[blankIndex]?.[alternativeIndex] || '';
        
        // Count actual words (excluding spaces)
        const wordCountInAlternative = alternative.trim().split(/\s+/).filter(word => word.length > 0).length;
        
        if (wordCount === "multiple" && wordCountInAlternative < 2) {
            const updatedQuestions = [...questions];
            updatedQuestions[questionIndex].alternatives[blankIndex][alternativeIndex] = '';
            setContent({ ...content, questions: updatedQuestions });
            alert("This blank requires at least 2 words. Please enter multiple words.");
        }
    };

    // Get word count for a specific blank
    const getWordCount = (questionText, blankIndex) => {
        // Split the text by underscores and keep the underscores
        const segments = questionText.split(/(_+)/);
        
        // Find the blank segment (the one with underscores)
        let underscoreSegment = null;
        let currentIndex = 0;
        
        for (let i = 0; i < segments.length; i++) {
            if (segments[i].startsWith('_')) {
                if (currentIndex === blankIndex) {
                    underscoreSegment = segments[i];
                    break;
                }
                currentIndex++;
            }
        }
        
        // If we found the underscore segment, check its length
        if (underscoreSegment) {
            // If there are 2 or more underscores, it's a multiple word blank
            return underscoreSegment.length >= 2 ? "multiple" : 1;
        }
        
        return 1; // Default to single word if something goes wrong
    };

    // Get blank count from question text
    const getBlankCount = (questionText) => {
        // Split by underscores and count consecutive underscores as one blank
        const parts = questionText.split(/_+/g);
        return parts.length - 1;
    };

    // Update answers array when question text changes
    const handleQuestionTextChange = (questionIndex, value) => {
        const blankCount = getBlankCount(value);
        const updatedQuestions = [...questions];
        
        // Ensure answer and alternatives arrays have correct length
        if (!updatedQuestions[questionIndex].answer) {
            updatedQuestions[questionIndex].answer = [];
        }
        if (!updatedQuestions[questionIndex].alternatives) {
            updatedQuestions[questionIndex].alternatives = [];
        }
        
        // Resize arrays if needed
        while (updatedQuestions[questionIndex].answer.length < blankCount) {
            updatedQuestions[questionIndex].answer.push("");
        }
        while (updatedQuestions[questionIndex].answer.length > blankCount) {
            updatedQuestions[questionIndex].answer.pop();
        }
        
        while (updatedQuestions[questionIndex].alternatives.length < blankCount) {
            updatedQuestions[questionIndex].alternatives.push([]);
        }
        while (updatedQuestions[questionIndex].alternatives.length > blankCount) {
            updatedQuestions[questionIndex].alternatives.pop();
        }
        
        updatedQuestions[questionIndex].question = value;
        setContent({ ...content, questions: updatedQuestions });
    };

    // Validate form and return validation status
    const validateForm = () => {
        for (let questionIndex = 0; questionIndex < questions.length; questionIndex++) {
            const question = questions[questionIndex];
            const blankCount = getBlankCount(question.question);
            
            // Check if question text is empty
            if (!question.question.trim()) {
                return {
                    isValid: false,
                    error: `Question ${questionIndex + 1} text cannot be empty.`
                };
            }
            
            for (let blankIndex = 0; blankIndex < blankCount; blankIndex++) {
                const wordCount = getWordCount(question.question, blankIndex);
                const answer = question.answer[blankIndex] || '';
                
                // Count actual words (excluding spaces)
                const wordCountInAnswer = answer.trim().split(/\s+/).filter(word => word.length > 0).length;
                
                if (wordCount === "multiple" && wordCountInAnswer < 2) {
                    return {
                        isValid: false,
                        error: `Question ${questionIndex + 1}, Blank ${blankIndex + 1} requires at least 2 words.`
                    };
                }
                
                // Check alternatives
                const alternatives = question.alternatives[blankIndex] || [];
                for (let altIndex = 0; altIndex < alternatives.length; altIndex++) {
                    const alternative = alternatives[altIndex] || '';
                    const wordCountInAlternative = alternative.trim().split(/\s+/).filter(word => word.length > 0).length;
                    
                    if (wordCount === "multiple" && wordCountInAlternative < 2) {
                        return {
                            isValid: false,
                            error: `Question ${questionIndex + 1}, Blank ${blankIndex + 1}, Alternative ${altIndex + 1} requires at least 2 words.`
                        };
                    }
                }
            }
        }
        
        return { isValid: true };
    };

    return (
        <div className="!w-full !space-y-6">
            <div className="!space-y-4">
                {questions.map((question, questionIndex) => (
                    <div key={questionIndex} className="!p-4 !border !rounded-lg !bg-white !shadow-sm">
                        <div className="!flex !justify-between !items-center !mb-4">
                            <h4 className="!text-lg !font-medium">Question {questionIndex + 1}</h4>
                            <button
                                type="button"
                                className="!p-2 !text-red-500 hover:!text-red-700 disabled:!opacity-50 disabled:!cursor-not-allowed"
                                onClick={() => removeQuestion(questionIndex)}
                                disabled={questions.length <= 1}
                            >
                                <Trash2 className="!w-4 !h-4" />
                            </button>
                        </div>

                        <div className="!space-y-4">
                            <div>
                                <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                                    Question Text (use _ for single word, __ for multiple words)
                                </label>
                                <input
                                    className="!w-full !px-3 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500"
                                    value={question.question || ""}
                                    onChange={(e) => handleQuestionTextChange(questionIndex, e.target.value)}
                                    placeholder="E.g., The capital of France is _ and the capital of United Kingdom is __"
                                />
                            </div>

                            {getBlankCount(question.question) > 0 && (
                                <div className="!space-y-4">
                                    {Array.from({ length: getBlankCount(question.question) }).map((_, blankIndex) => (
                                        <div key={blankIndex} className="!p-4 !border !rounded-md !bg-gray-50">
                                            <h5 className="!text-sm !font-medium !text-gray-700 !mb-2">
                                                Blank {blankIndex + 1} ({getWordCount(question.question, blankIndex)} word{getWordCount(question.question, blankIndex) === "multiple" ? 's' : ''})
                                            </h5>
                                            
                                            <div className="!space-y-2">
                                                <div>
                                                    <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                                                        Correct Answer
                                                    </label>
                                                    <input
                                                        className="!w-full !px-3 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500"
                                                        value={question.answer[blankIndex] || ""}
                                                        onChange={(e) => handleAnswerChange(questionIndex, blankIndex, e.target.value)}
                                                        onBlur={() => handleAnswerBlur(questionIndex, blankIndex)}
                                                        placeholder={`Enter ${getWordCount(question.question, blankIndex)} word${getWordCount(question.question, blankIndex) === "multiple" ? 's' : ''}`}
                                                    />
                                                </div>

                                                <div className="!space-y-2">
                                                    <h6 className="!text-sm !font-medium !text-gray-700">Alternative Answers (Optional)</h6>
                                                    {(question.alternatives[blankIndex] || []).map((alternative, alternativeIndex) => (
                                                        <div key={alternativeIndex} className="!flex !gap-2">
                                                            <input
                                                                type="text"
                                                                className="!flex-1 !px-3 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500"
                                                                value={alternative || ""}
                                                                onChange={(e) => handleAlternativeChange(questionIndex, blankIndex, alternativeIndex, e.target.value)}
                                                                onBlur={() => handleAlternativeBlur(questionIndex, blankIndex, alternativeIndex)}
                                                                placeholder="Alternative answer"
                                                            />
                                                            <button
                                                                type="button"
                                                                className="!p-2 !text-red-500 hover:!text-red-700"
                                                                onClick={() => removeAlternative(questionIndex, blankIndex, alternativeIndex)}
                                                            >
                                                                <X className="!w-4 !h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        type="button"
                                                        className="!flex !items-center !gap-1 !text-sm !text-blue-600 hover:!text-blue-800"
                                                        onClick={() => addAlternative(questionIndex, blankIndex)}
                                                    >
                                                        <Plus className="!w-4 !h-4" /> Add Alternative
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                                    Explanation (Optional)
                                </label>
                                <textarea
                                    className="!w-full !px-3 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500"
                                    value={question.explanation || ""}
                                    onChange={(e) => handleQuestionChange(questionIndex, 'explanation', e.target.value)}
                                    placeholder="Add explanation for the correct answer"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>
                ))}

                <button
                    type="button"
                    className="!flex !items-center !gap-1 !px-4 !py-2 !text-sm !font-medium !text-white !bg-blue-600 !rounded-md hover:!bg-blue-700 focus:!outline-none focus:!ring-2 focus:!ring-blue-500"
                    onClick={addQuestion}
                >
                    <Plus className="!w-4 !h-4" /> Add Question
                </button>
            </div>

            {/* Hints Section */}
            <div className="!space-y-4">
                <h3 className="!text-lg !font-medium">Hints</h3>
                <div className="!flex !gap-2">
                    <input
                        type="text"
                        placeholder="Add a hint..."
                        className="!flex-1 !px-3 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500"
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
                        className="!p-2 !text-blue-600 hover:!text-blue-800"
                        onClick={addHint}
                    >
                        <Plus className="!w-4 !h-4" />
                    </button>
                </div>

                <div className="!space-y-2">
                    {(content.hints || []).map((hint, index) => (
                        <div key={index} className="!flex !items-center !justify-between !p-2 !bg-gray-50 !rounded-md">
                            <span className="!text-sm">{hint}</span>
                            <button
                                type="button"
                                className="!p-1 !text-red-500 hover:!text-red-700"
                                onClick={() => removeHint(index)}
                            >
                                <X className="!w-4 !h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FillInBlankForm; 

