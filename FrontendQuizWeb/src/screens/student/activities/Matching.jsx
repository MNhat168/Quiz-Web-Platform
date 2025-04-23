import React, { useState } from 'react';

const MatchingActivity = ({ activity, submitting, submitAnswer }) => {
    const matchContent = activity.content || {};
    const matchPairs = matchContent.pairs || [];
    
    // Create two separate arrays for left and right items
    const leftItems = matchPairs.map(pair => pair.left || pair.item1);
    
    // Shuffle the right items for the game
    const [rightItems, setRightItems] = useState(() => {
        const items = matchPairs.map(pair => pair.right || pair.item2);
        return shuffleArray([...items]);
    });
    
    // Track selected items and matches
    const [selectedLeft, setSelectedLeft] = useState(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const [matches, setMatches] = useState([]);
    
    // Helper function to shuffle array
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    const handleLeftSelect = (index) => {
        setSelectedLeft(index);
        checkForMatch(index, selectedRight);
    };
    
    const handleRightSelect = (index) => {
        setSelectedRight(index);
        checkForMatch(selectedLeft, index);
    };
    
    const checkForMatch = (leftIndex, rightIndex) => {
        if (leftIndex !== null && rightIndex !== null) {
            // Check if it's a match
            const leftItem = leftItems[leftIndex];
            const rightItem = rightItems[rightIndex];
            
            // Find the original pair index
            const matchPairIndex = matchPairs.findIndex(
                pair => (pair.left === leftItem && pair.right === rightItem) ||
                       (pair.item1 === leftItem && pair.item2 === rightItem)
            );
            
            if (matchPairIndex !== -1) {
                // It's a match!
                setMatches([...matches, { leftIndex, rightIndex }]);
            }
            
            // Reset selections
            setSelectedLeft(null);
            setSelectedRight(null);
        }
    };
    
    const isMatched = (index, side) => {
        if (side === 'left') {
            return matches.some(match => match.leftIndex === index);
        } else {
            return matches.some(match => match.rightIndex === index);
        }
    };
    
    const handleSubmit = () => {
        // Format the matches for submission
        const matchedPairs = matches.map(match => ({
            left: leftItems[match.leftIndex],
            right: rightItems[match.rightIndex]
        }));
        
        submitAnswer(matchedPairs);
    };
    
    const allMatched = matches.length === matchPairs.length;

    return (
        <div className="matching-activity">
            <h3>{activity.title}</h3>
            <p>{activity.instructions}</p>
            
            <div className="matching-container">
                <div className="matching-left-column">
                    {leftItems.map((item, index) => (
                        <div 
                            key={`left-${index}`}
                            className={`matching-item left ${selectedLeft === index ? 'selected' : ''} ${isMatched(index, 'left') ? 'matched' : ''}`}
                            onClick={() => !isMatched(index, 'left') && handleLeftSelect(index)}
                        >
                            {typeof item === 'object' ? item.text : item}
                            {item.imageUrl && <img src={item.imageUrl} alt={item.text || ''} />}
                        </div>
                    ))}
                </div>
                
                <div className="matching-right-column">
                    {rightItems.map((item, index) => (
                        <div 
                            key={`right-${index}`}
                            className={`matching-item right ${selectedRight === index ? 'selected' : ''} ${isMatched(index, 'right') ? 'matched' : ''}`}
                            onClick={() => !isMatched(index, 'right') && handleRightSelect(index)}
                        >
                            {typeof item === 'object' ? item.text : item}
                            {item.imageUrl && <img src={item.imageUrl} alt={item.text || ''} />}
                        </div>
                    ))}
                </div>
            </div>
            
            <button
                onClick={handleSubmit}
                disabled={submitting || !allMatched}
                className="submit-btn"
            >
                Submit Matches
            </button>
        </div>
    );
};

export default MatchingActivity;