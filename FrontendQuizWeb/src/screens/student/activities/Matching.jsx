import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../../style/gameplay-matching.css';

const MatchingActivity = ({ activity, submitting, submitAnswer }) => {
    const currentContent = Array.isArray(activity.content?.questions)
    ? activity.content.questions[currentQuestionIndex] || {}
    : activity.content || {};

    const { pairs = [], shuffleOptions = true } = currentContent;
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);


    const [leftItems, rightItems] = useMemo(() => {
        const left = pairs.map((pair, index) => ({
            id: `left-${index}`,
            text: pair.item1 || '',
            imageUrl: pair.item1ImageUrl || '',
            pairId: index
        }));

        const right = pairs.map((pair, index) => ({
            id: `right-${index}`,
            text: pair.item2 || '',
            imageUrl: pair.item2ImageUrl || '',
            pairId: index
        }));

        return [left, shuffleOptions ? shuffleArray([...right]) : right];
    }, [activity]);

    // State
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const [connections, setConnections] = useState([]);
    const [colorMap, setColorMap] = useState({});
    const [usedColors, setUsedColors] = useState([]);

    // Handle selection
    const handleSelect = (side, index) => {
        const itemId = side === 'left' 
            ? leftItems[index].id 
            : rightItems[index].id;

        // Toggle selection
        side === 'left' 
            ? setSelectedLeft(selectedLeft === index ? null : index)
            : setSelectedRight(selectedRight === index ? null : index);

        // If item is connected, remove connection
        if (connections.some(c => c.leftId === itemId || c.rightId === itemId)) {
            setConnections(conns => conns.filter(c => c.leftId !== itemId && c.rightId !== itemId));
        }
    };

    // Update connections when both selected
    useEffect(() => {
        if (selectedLeft !== null && selectedRight !== null) {
            const leftId = leftItems[selectedLeft].id;
            const rightId = rightItems[selectedRight].id;
            
            // Remove any previous connections before making a new one
            const newConnections = connections.filter(
                conn => conn.leftId !== leftId && conn.rightId !== rightId
            );
    
            // Remove colors of any previously connected items
            const existingColorLeft = colorMap[leftId];
            const existingColorRight = colorMap[rightId];
            let updatedUsedColors = [...usedColors];
            if (existingColorLeft) {
                updatedUsedColors = updatedUsedColors.filter(c => c !== existingColorLeft);
            }
            if (existingColorRight) {
                updatedUsedColors = updatedUsedColors.filter(c => c !== existingColorRight);
            }
    
            // Get new color for this pair
            const newColor = getNextAvailableColor(updatedUsedColors);
    
            // Add new connection and color to state
            setConnections([...newConnections, { leftId, rightId }]);
            setColorMap({
                ...colorMap,
                [leftId]: newColor,
                [rightId]: newColor
            });
            setUsedColors([...updatedUsedColors, newColor]);
    
            // Reset selection
            setSelectedLeft(null);
            setSelectedRight(null);
        }
    }, [selectedLeft, selectedRight, connections, colorMap, usedColors, leftItems, rightItems]);    

    const leftCardRefs = useRef([]);
    const rightCardRefs = useRef([]);

    useEffect(() => {
        leftCardRefs.current = leftCardRefs.current.slice(0, leftItems.length);
        rightCardRefs.current = rightCardRefs.current.slice(0, rightItems.length);
    }, [leftItems, rightItems]);

    const extractQuestions = (content) => {
        return content?.questions || [];
    };

    const moveToNextQuestion = () => {
        const mcQuestions = extractQuestions(activity.content);
        if (currentQuestionIndex < mcQuestions.length - 1) {
            // Reset selections
            setSelectedLeft(null);
            setSelectedRight(null);
            
            // Reset connections, color map, and used colors for the next question
            setConnections([]);  // Xóa hết kết nối
            setColorMap({});      // Xóa hết bản đồ màu
            setUsedColors([]);    // Xóa hết các màu đã sử dụng
            
            // Tăng index câu hỏi hiện tại
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            setAnswered(false);   // Reset trạng thái đã trả lời
        }
    };

    // Check if item is connected
    const isConnected = (id) => {
        return connections.some(conn => conn.leftId === id || conn.rightId === id);
    };


    const handleSubmit = () => {
        const answerData = {
            questionIndex: currentQuestionIndex, 
            activityId: activity.id,
            answer: {
                leftItems: leftItems.map(item => ({
                    id: item.id,
                    pairId: item.pairId
                })),
                rightItems: rightItems.map(item => ({
                    id: item.id,
                    pairId: item.pairId
                })),
                connections: connections.map(conn => ({
                    leftId: conn.leftId,
                    rightId: conn.rightId
                }))
            },
        };
    
        submitAnswer(answerData);
    
        setTimeout(() => {
            moveToNextQuestion(); 
        }, 1500);
    };    

    const allPairsConnected = () => {
        return connections.length === leftItems.length && connections.length === rightItems.length;
    };


    return (
<div className="matching-activity">
    <h3>{activity.title}</h3>
    {activity.instructions && <p>{activity.instructions}</p>}

    <div className="matching-container">
        {/* Left Column */}
        <div className="column left-column">
            {leftItems.map((item, index) => {
                const connected = isConnected(item.id);
                return (
                    <div
                        key={item.id}
                        className={`card ${selectedLeft === index ? 'selected' : ''} ${connected ? 'connected' : ''}`}
                        onClick={() => handleSelect('left', index)}
                        style={{
                            borderColor: connected ? colorMap[item.id] : '',
                            backgroundColor: connected ? `${colorMap[item.id]}20` : ''
                        }}
                        ref={el => (leftCardRefs.current[index] = el)}
                    >
                        {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.text} className="matching-image"/>
                        ) : (
                            <span>{item.text}</span>
                        )}
                    </div>
                );
            })}
        </div>

        {/* Right Column */}
        <div className="column right-column">
                    {rightItems.map((item, index) => {
                        const connected = isConnected(item.id);
                        return (
                            <div
                                key={item.id}
                                className={`card ${selectedRight === index ? 'selected' : ''} ${connected ? 'connected' : ''}`}
                                onClick={() => handleSelect('right', index)}
                                style={{
                                    borderColor: connected ? colorMap[item.id] : '',
                                    backgroundColor: connected ? `${colorMap[item.id]}20` : ''
                                }}
                                ref={el => (rightCardRefs.current[index] = el)}
                            >
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.text} className="matching-image"/>
                                ) : (
                                    <span>{item.text}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Render connection lines */}
                {connections.map((conn, idx) => {
                    const leftIndex = leftItems.findIndex(item => item.id === conn.leftId);
                    const rightIndex = rightItems.findIndex(item => item.id === conn.rightId);
                    
                    if (leftCardRefs.current[leftIndex] && rightCardRefs.current[rightIndex]) {
                        const leftRect = leftCardRefs.current[leftIndex].getBoundingClientRect();
                        const rightRect = rightCardRefs.current[rightIndex].getBoundingClientRect();
                        const containerRect = document.querySelector('.matching-container').getBoundingClientRect();
                        
                        const startX = leftRect.right - containerRect.left;
                        const startY = leftRect.top + leftRect.height/2 - containerRect.top;
                        const endX = rightRect.left - containerRect.left;
                        const endY = rightRect.top + rightRect.height/2 - containerRect.top;
                        
                        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
                        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
                        
                        return (
                            <div
                                key={`line-${idx}`}
                                className="connection-line"
                                style={{
                                    left: `${startX}px`,
                                    top: `${startY}px`,
                                    width: `${length}px`,
                                    transform: `rotate(${angle}deg)`,
                                    backgroundColor: colorMap[conn.leftId] || '#4a90e2'
                                }}
                            />
                        );
                    }
                    return null;
                })}
            </div>

            {/* Submit Button */}
            {allPairsConnected() && (
                <button 
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="submit-btn"
                >
                    {submitting ? 'Submitting...' : 'Submit Answers'}
                </button>
            )}
        </div>
    );
};

// Helper functions
const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

const allColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', 
    '#98D8C8', '#D4A5A5', '#F06292', '#7986CB',
    '#64B5F6', '#BA68C8', '#4DB6AC', '#FF8A65'
];

const getNextAvailableColor = (used) => {
    const available = allColors.filter(c => !used.includes(c));
    if (available.length === 0) return allColors[Math.floor(Math.random() * allColors.length)];
    return available[Math.floor(Math.random() * available.length)];
};

export default MatchingActivity;