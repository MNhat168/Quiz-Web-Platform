import { useState, useEffect } from "react"
import { Plus, X, Trash2, Lightbulb } from "lucide-react"
import { v4 as uuidv4 } from 'uuid';

const FillInBlankForm = ({ 
    contentItems = [], 
    setContentItems,
    currentHint = "",
    setCurrentHint,
    addHint,
    removeHint
}) => {
    // Initialize with default content item if empty
    useEffect(() => {
        if (contentItems.length === 0) {
            addNewContentItem();
        }
    }, []);

    const addNewContentItem = () => {
        const newItem = {
            contentId: uuidv4(),
            type: "FILL_IN_BLANK",
            data: {
                questionText: "",
                blanks: [{
                    answer: "",
                    alternatives: [],
                }],
                explanation: "",
                hints: [],
                points: 10
            },
            duration: 60,
        };
        setContentItems([...contentItems, newItem]);
    };

    const updateContentItem = (index, updatedData) => {
        const updatedItems = [...contentItems];
        updatedItems[index].data = {
            ...updatedItems[index].data,
            ...updatedData
        };
        setContentItems(updatedItems);
    };

    const handleQuestionTextChange = (index, value) => {
        const blankCount = getBlankCount(value);
        const updatedData = { questionText: value };
        
        // Initialize blanks array
        updatedData.blanks = Array(blankCount).fill().map((_, i) => ({
            answer: contentItems[index]?.data?.blanks[i]?.answer || "",
            alternatives: contentItems[index]?.data?.blanks[i]?.alternatives || []
        }));
        
        updateContentItem(index, updatedData);
    };

    const handleAnswerChange = (contentIndex, blankIndex, value) => {
        const updatedData = { ...contentItems[contentIndex].data };
        updatedData.blanks[blankIndex].answer = value;
        updateContentItem(contentIndex, updatedData);
    };

    const handleAlternativeChange = (contentIndex, blankIndex, altIndex, value) => {
        const updatedData = { ...contentItems[contentIndex].data };
        updatedData.blanks[blankIndex].alternatives[altIndex] = value;
        updateContentItem(contentIndex, updatedData);
    };

    const addBlank = (contentIndex) => {
        const updatedData = { ...contentItems[contentIndex].data };
        updatedData.blanks.push({
            answer: "",
            alternatives: []
        });
        updateContentItem(contentIndex, updatedData);
    };

    const addAlternative = (contentIndex, blankIndex) => {
        const updatedData = { ...contentItems[contentIndex].data };
        updatedData.blanks[blankIndex].alternatives.push("");
        updateContentItem(contentIndex, updatedData);
    };

    const removeContentItem = (index) => {
        const updatedItems = contentItems.filter((_, i) => i !== index);
        setContentItems(updatedItems);
    };

    // Helper functions
    const getBlankCount = (text) => (text.match(/_+/g) || []).length;
    
    const getWordCount = (text, blankIndex) => {
        const blanks = text.match(/_+/g) || [];
        return blanks[blankIndex]?.length >= 2 ? "multiple" : 1;
    };

    return (
        <div className="!w-full !space-y-6">
            {contentItems.map((item, contentIndex) => (
                <div key={contentIndex} className="!p-4 !border !rounded-lg !bg-white !shadow-sm !mb-6">
                    <div className="!flex !justify-between !items-center !mb-4">
                        <h4 className="!text-lg !font-medium">Question {contentIndex + 1}</h4>
                        <button
                            onClick={() => removeContentItem(contentIndex)}
                            className="!p-2 !text-red-500 hover:!text-red-700">
                            <Trash2 className="!w-4 !h-4" />
                        </button>
                    </div>

                    <div className="!space-y-4">
                        <div>
                            <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                                Question Text (use _ for blanks 1 word , use __ for blanks multiple words)
                            </label>
                            <input
                                value={item.data.questionText}
                                onChange={(e) => handleQuestionTextChange(contentIndex, e.target.value)}
                                className="!w-full !px-3 !py-2 !border !rounded-md"
                            />
                        </div>

                        {item.data.blanks.map((blank, blankIndex) => (
                            <div key={blankIndex} className="!p-4 !border !rounded-md !bg-gray-50">
                                <div className="!flex !justify-between !items-center !mb-2">
                                    <h5 className="!text-sm !font-medium">
                                        Blank {blankIndex + 1} ({getWordCount(item.data.questionText, blankIndex)})
                                    </h5>
                                </div>

                                <div className="!space-y-2">
                                    <input
                                        value={blank.answer}
                                        onChange={(e) => handleAnswerChange(contentIndex, blankIndex, e.target.value)}
                                        className="!w-full !px-3 !py-2 !border !rounded-md"
                                    />
                                    
                                    <div className="!space-y-2">
                                        {blank.alternatives.map((alt, altIndex) => (
                                            <div key={altIndex} className="!flex !gap-2">
                                                <input
                                                    value={alt}
                                                    onChange={(e) => handleAlternativeChange(contentIndex, blankIndex, altIndex, e.target.value)}
                                                    className="!flex-1 !px-3 !py-2 !border !rounded-md"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const updatedData = { ...item.data };
                                                        updatedData.blanks[blankIndex].alternatives.splice(altIndex, 1);
                                                        updateContentItem(contentIndex, updatedData);
                                                    }}
                                                    className="!p-2 !text-red-500 hover:!text-red-700">
                                                    <X className="!w-4 !h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => addAlternative(contentIndex, blankIndex)}
                                            className="!text-blue-600 !flex !items-center !gap-1">
                                            <Plus className="!w-4 !h-4" /> Add Alternative
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div>
                            <label className="!block !text-sm !font-medium !text-gray-700 !mb-1">
                                Explanation
                            </label>
                            <textarea
                                value={item.data.explanation}
                                onChange={(e) => updateContentItem(contentIndex, {
                                    explanation: e.target.value
                                })}
                                className="!w-full !px-3 !py-2 !border !rounded-md"
                            />
                        </div>

                        <div className="!space-y-2">
                            <h6 className="!text-sm !font-medium">Hints</h6>
                            {item.data.hints.map((hint, hintIndex) => (
                                <div key={hintIndex} className="!flex !justify-between !items-center !bg-gray-50 !p-2 !rounded">
                                    <span>{hint}</span>
                                    <button
                                        onClick={() => {
                                            const updatedData = { ...item.data };
                                            updatedData.hints.splice(hintIndex, 1);
                                            updateContentItem(contentIndex, updatedData);
                                        }}
                                        className="!text-red-500 hover:!text-red-700">
                                        <X className="!w-4 !h-4" />
                                    </button>
                                </div>
                            ))}
                            <div className="!flex !gap-2">
                                <input
                                    type="text"
                                    value={currentHint}
                                    onChange={(e) => setCurrentHint(e.target.value)}
                                    className="!flex-1 !px-3 !py-2 !border !rounded-md"
                                />
                                <button
                                    onClick={() => {
                                        const updatedData = { ...item.data };
                                        updatedData.hints = [...updatedData.hints, currentHint];
                                        updateContentItem(contentIndex, updatedData);
                                        setCurrentHint("");
                                    }}
                                    className="!px-4 !py-2 !bg-blue-600 !text-white !rounded">
                                    Add Hint
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={addNewContentItem}
                className="!px-4 !py-2 !bg-blue-600 !text-white !rounded !flex !items-center !gap-1">
                <Plus className="!w-4 !h-4" /> Add New Question
            </button>
        </div>
    );
};

export default FillInBlankForm;