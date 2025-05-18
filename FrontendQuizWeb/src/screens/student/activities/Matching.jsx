import React, { useState, useEffect, useMemo, useRef } from 'react';
import '../../../style/gameplay-matching.css';

const MatchingActivity = ({ activity, submitting, submitAnswer, contentItem }) => {
    const pairs = useMemo(() => {
        if (!contentItem?.data?.pairs) return [];
        return contentItem.data.pairs;
    }, [contentItem]);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    const [leftItems, rightItems] = useMemo(() => {
        const left = pairs.map((pair, index) => ({
            id: `left-${index}`,
            text: pair.item1,
            imageUrl: pair.item1ImageUrl,
            pairId: pair.pairId,
        }));

        const right = pairs.map((pair, index) => ({
            id: `right-${index}`,
            text: pair.item2,
            imageUrl: pair.item2ImageUrl,
            pairId: pair.pairId,
        }));

        return [left, shuffleArray([...right])];
    }, [pairs]);

    const [selectedLeft, setSelectedLeft] = useState(null);
    const [selectedRight, setSelectedRight] = useState(null);
    const [connections, setConnections] = useState([]);
    const [colorMap, setColorMap] = useState({});
    const [usedColors, setUsedColors] = useState([]);
    const [matches, setMatches] = useState([]);
    const [resultMap, setResultMap] = useState({});
    const [correctCount, setCorrectCount] = useState(0);
    const containerRef = useRef(null);
    const leftCardRefs = useRef([]);
    const rightCardRefs = useRef([]);

    useEffect(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
        setConnections([]);
        setColorMap({});
        setUsedColors([]);
        setMatches([]);
    }, [contentItem]);

    // Reset refs when items change
    useEffect(() => {
        leftCardRefs.current = leftCardRefs.current.slice(0, leftItems.length);
        rightCardRefs.current = rightCardRefs.current.slice(0, rightItems.length);
    }, [leftItems, rightItems]);

    const handleSelect = (side, index) => {
        const item = side === 'left' ? leftItems[index] : rightItems[index];
        
        if (connections.some(c => c[`${side}Id`] === item.id)) {
            const otherSide = side === 'left' ? 'right' : 'left';
            const connectionToRemove = connections.find(c => c[`${side}Id`] === item.id);
            const otherItemId = connectionToRemove?.[`${otherSide}Id`];
            const colorToRemove = colorMap[item.id];

            setConnections(conns => conns.filter(c => c[`${side}Id`] !== item.id));
            setMatches(matches => matches.filter(m => m[`${side}Id`] !== item.id));

            setColorMap(prev => {
                const newMap = {...prev};
                delete newMap[item.id];
                if (otherItemId) delete newMap[otherItemId];
                return newMap;
            });

    setUsedColors(prev => prev.filter(c => c !== colorToRemove));
    return;
}

        side === 'left' 
            ? setSelectedLeft(selectedLeft === index ? null : index)
            : setSelectedRight(selectedRight === index ? null : index);
    };

    useEffect(() => {
        if (selectedLeft !== null && selectedRight !== null) {
            const leftItem = leftItems[selectedLeft];
            const rightItem = rightItems[selectedRight];

            // Tạo kết nối mới
            const newConnection = {
                leftId: leftItem.id,
                rightId: rightItem.id,
                pairId: leftItem.pairId
            };

            // Lấy màu chưa dùng
            const color = getNextAvailableColor(usedColors);

            // Cập nhật connections (loại bỏ cũ nếu trùng)
            setConnections(prev => [
                ...prev.filter(
                    c => c.leftId !== leftItem.id && c.rightId !== rightItem.id
                ),
                newConnection
            ]);

            // Cập nhật map màu
            setColorMap(prev => ({
                ...prev,
                [leftItem.id]: color,
                [rightItem.id]: color
            }));

            // Cập nhật danh sách màu đã dùng
            setUsedColors(prev => [...prev, color]);

            setMatches(prev => [...prev, newConnection]);

            // Reset lựa chọn
            setSelectedLeft(null);
            setSelectedRight(null);
        }
    }, [selectedLeft, selectedRight]);

    // Component để vẽ đường kết nối
    const ConnectionLine = ({ connection }) => {
        const leftIndex = leftItems.findIndex(item => item.id === connection.leftId);
        const rightIndex = rightItems.findIndex(item => item.id === connection.rightId);
        
        if (leftIndex === -1 || rightIndex === -1) return null;

        const leftEl = leftCardRefs.current[leftIndex];
        const rightEl = rightCardRefs.current[rightIndex];
        const containerEl = containerRef.current;

        if (!leftEl || !rightEl || !containerEl) return null;

        const leftRect = leftEl.getBoundingClientRect();
        const rightRect = rightEl.getBoundingClientRect();
        const containerRect = containerEl.getBoundingClientRect();

        const startX = leftRect.right - containerRect.left;
        const startY = leftRect.top + leftRect.height/2 - containerRect.top;
        const endX = rightRect.left - containerRect.left;
        const endY = rightRect.top + rightRect.height/2 - containerRect.top;
        
        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
        
        return (
            <div
                className="connection-line"
                style={{
                    left: `${startX}px`,
                    top: `${startY}px`,
                    width: `${length}px`,
                    transform: `rotate(${angle}deg)`,
                    backgroundColor: colorMap[connection.leftId] || '#4a90e2',
                    transition: 'all 0.3s ease'
                }}
            />
        );
    };

    const allPairsConnected = matches.length === leftItems.length;
    
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

    const handleSubmit = () => {
        const matchedPairs = matches.map(match => ({
            left: leftItems.find(item => item.id === match.leftId),
            right: rightItems.find(item => item.id === match.rightId)
        }));

        const newResultMap = {};
        let correct = 0;
        
        matchedPairs.forEach(pair => {
            const isCorrect = pair.left.pairId === pair.right.pairId;
            newResultMap[pair.left.id] = isCorrect ? 'correct' : 'incorrect';
            newResultMap[pair.right.id] = isCorrect ? 'correct' : 'incorrect';
            if (isCorrect) correct++;
        });

        setResultMap(newResultMap);
        setCorrectCount(correct);

        const isCorrectPair = matchedPairs.every(pair => pair.left.pairId === pair.right.pairId);
        submitAnswer({
            isCorrect: isCorrectPair,
            matchedPairs,
            answer: {
                connections: matches.map(match => ({
                    leftId: match.leftId,
                    rightId: match.rightId
                })),
                leftItems: leftItems.map(({ id, pairId }) => ({ id, pairId })),
                rightItems: rightItems.map(({ id, pairId }) => ({ id, pairId }))
            }
        });

        setTimeout(() => {
            setResultMap({}); // clear trạng thái sau khi chuyển
            setCorrectCount(0);
            setSelectedLeft(null);
            setSelectedRight(null);
            setConnections([]);
            setColorMap({});
            setUsedColors([]);
            setMatches([]);
            moveToNextQuestion();
        }, 2500);
    };

    return (
        <div className="matching-activity">
            <h3>{activity.title}</h3>
            {activity.instructions && <p className="instructions">{activity.instructions}</p>}

            <div className="matching-container" ref={containerRef}>
                {/* Left Column */}
                <div className="column left-column">
                    {leftItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`card ${selectedLeft === index ? 'selected' : ''} ${
                                connections.some(c => c.leftId === item.id) ? 'connected' : ''
                            }`}
                            onClick={() => handleSelect('left', index)}
                            style={{
                                borderColor: resultMap[item.id] === 'correct' 
                                    ? '#28a745' 
                                    : resultMap[item.id] === 'incorrect' 
                                        ? '#dc3545' 
                                        : colorMap[item.id] || '',
                                backgroundColor: resultMap[item.id] === 'correct' 
                                    ? '#d4edda' 
                                    : resultMap[item.id] === 'incorrect' 
                                        ? '#f8d7da' 
                                        : colorMap[item.id] 
                                            ? `${colorMap[item.id]}20` 
                                            : ''
                            }}
                            ref={el => (leftCardRefs.current[index] = el)}
                        >
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt="Left item" className="matching-image" />
                            ) : (
                                <span className="matching-text">{item.text}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Right Column */}
                <div className="column right-column">
                    {rightItems.map((item, index) => (
                        <div
                            key={item.id}
                            className={`card ${selectedRight === index ? 'selected' : ''} ${
                                connections.some(c => c.rightId === item.id) ? 'connected' : ''
                            }`}
                            onClick={() => handleSelect('right', index)}
                            style={{
                                borderColor: resultMap[item.id] === 'correct' 
                                    ? '#28a745' 
                                    : resultMap[item.id] === 'incorrect' 
                                        ? '#dc3545' 
                                        : colorMap[item.id] || '',
                                backgroundColor: resultMap[item.id] === 'correct' 
                                    ? '#d4edda' 
                                    : resultMap[item.id] === 'incorrect' 
                                        ? '#f8d7da' 
                                        : colorMap[item.id] 
                                            ? `${colorMap[item.id]}20` 
                                            : ''
                            }}
                            ref={el => (rightCardRefs.current[index] = el)}
                        >
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt="Right item" className="matching-image" />
                            ) : (
                                <span className="matching-text">{item.text}</span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Connection Lines */}
                {connections.map((conn, idx) => (
                    <ConnectionLine key={`line-${idx}`} connection={conn} />
                ))}
            </div>

            <button 
                onClick={handleSubmit}
                disabled={!allPairsConnected || submitting}
                className="submit-btn"
            >
                {submitting ? 'Submitting...' : 'Submit Answers'}
            </button>

            {resultMap && Object.keys(resultMap).length > 0 && (
                <div className="result-summary">
                    <strong>Bạn đã nối đúng {correctCount}/{matches.length} cặp.</strong>
                </div>
            )}

        </div>
    );
};

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