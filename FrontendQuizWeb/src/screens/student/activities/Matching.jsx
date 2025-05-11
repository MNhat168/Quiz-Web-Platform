import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../../style/gameplay-matching.css';

const MatchingActivity = ({ activity, submitting, submitAnswer, contentItem }) => { // Add contentItem prop
    // Use current content item's data
    const pairs = useMemo(() => {
        if (!contentItem?.data) return [];
        // Convert single pair format to array format
        return [{
            item1: contentItem.data.item1,
            item2: contentItem.data.item2,
            item1ImageUrl: contentItem.data.item1ImageUrl,
            item2ImageUrl: contentItem.data.item2ImageUrl
        }];
    }, [contentItem]);
    
    const [leftItems, rightItems] = useMemo(() => {
        const left = pairs.flatMap((pair, index) => [
            {
                id: `left-${index}-1`,
                imageUrl: pair.item1ImageUrl,
                pairId: index
            },
            {
                id: `left-${index}-2`,
                imageUrl: pair.item1ImageUrl,
                pairId: index
            },
            {
                id: `left-${index}-3`,
                imageUrl: pair.item1ImageUrl,
                pairId: index
            },
            {
                id: `left-${index}-4`,
                imageUrl: pair.item1ImageUrl,
                pairId: index
            }
        ]);

        const right = pairs.flatMap((pair, index) => [
            {
                id: `right-${index}-1`,
                imageUrl: pair.item2ImageUrl,
                pairId: index
            },
            {
                id: `right-${index}-2`,
                imageUrl: pair.item2ImageUrl,
                pairId: index
            },
            {
                id: `right-${index}-3`,
                imageUrl: pair.item2ImageUrl,
                pairId: index
            },
            {
                id: `right-${index}-4`,
                imageUrl: pair.item2ImageUrl,
                pairId: index
            }
        ]);

        return [left, shuffleArray([...right])];
    }, [contentItem]);

    // State management
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const [connections, setConnections] = useState([]);
    const [colorMap, setColorMap] = useState({});
    const [usedColors, setUsedColors] = useState([]);
    const leftCardRefs = useRef([]);
    const rightCardRefs = useRef([]);

    // Handle item selection
    const handleSelect = (side, index) => {
        const itemId = side === 'left' 
            ? leftItems[index].id 
            : rightItems[index].id;

        side === 'left' 
            ? setSelectedLeft(selectedLeft === index ? null : index)
            : setSelectedRight(selectedRight === index ? null : index);

        // Remove existing connections for this item
        if (connections.some(c => c.leftId === itemId || c.rightId === itemId)) {
            setConnections(conns => conns.filter(c => c.leftId !== itemId && c.rightId !== itemId));
        }
    };

    // Create connections when both selected
    useEffect(() => {
        if (selectedLeft !== null && selectedRight !== null) {
            const leftItem = leftItems[selectedLeft];
            const rightItem = rightItems[selectedRight];
            
            const newConnection = {
                leftId: leftItem.id,
                rightId: rightItem.id,
                isValid: leftItem.pairId === rightItem.pairId
            };

            // Update connections and colors
            setConnections([...connections.filter(
                c => c.leftId !== leftItem.id && c.rightId !== rightItem.id
            ), newConnection]);

            const newColor = newConnection.isValid ? '#4CAF50' : '#FF5252';
            setColorMap(prev => ({
                ...prev,
                [leftItem.id]: newColor,
                [rightItem.id]: newColor
            }));

            // Reset selections
            setSelectedLeft(null);
            setSelectedRight(null);
        }
    }, [selectedLeft, selectedRight]);

    const allPairsConnected = () => {
        return connections.length === 4; // Require 4 connections
    };

    // Handle answer submission
    const handleSubmit = () => {
        const answer = {
            connections: connections.map(conn => ({
                leftId: conn.leftId,
                rightId: conn.rightId,
                isValid: conn.isValid
            }))
        };

        submitAnswer(answer);
    };

    return (
        <div className="matching-activity">
            <h3>{activity.title}</h3>
            {activity.instructions && <p className="instructions">{activity.instructions}</p>}

            <div className="multi-pair-container">
                {/* Left Column */}
                <div className="column left-column">
                    {leftItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`card ${selectedLeft === index ? 'selected' : ''}`}
                            onClick={() => handleSelect('left', index)}
                            style={{
                                borderColor: colorMap[item.id] || '',
                                backgroundColor: colorMap[item.id] ? `${colorMap[item.id]}20` : ''
                            }}
                            ref={el => (leftCardRefs.current[index] = el)}
                        >
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt="Left item" className="matching-image" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="column right-column">
                    {rightItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`card ${selectedRight === index ? 'selected' : ''}`}
                            onClick={() => handleSelect('right', index)}
                            style={{
                                borderColor: colorMap[item.id] || '',
                                backgroundColor: colorMap[item.id] ? `${colorMap[item.id]}20` : ''
                            }}
                            ref={el => (rightCardRefs.current[index] = el)}
                        >
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt="Right item" className="matching-image" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Connection Lines */}
                {connections.map((conn, idx) => {
                    const leftIndex = leftItems.findIndex(item => item.id === conn.leftId);
                    const rightIndex = rightItems.findIndex(item => item.id === conn.rightId);
                    
                    const leftRect = leftCardRefs.current[leftIndex]?.getBoundingClientRect();
                    const rightRect = rightCardRefs.current[rightIndex]?.getBoundingClientRect();
                    const containerRect = document.querySelector('.multi-pair-container')?.getBoundingClientRect();

                    if (!leftRect || !rightRect || !containerRect) return null;

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

export default MatchingActivity;