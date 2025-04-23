import React, { useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const SortableItem = ({ id, text, index, moveItem, imageUrl }) => {
    const [, ref] = useDrag({
        type: 'SORT_ITEM',
        item: { id, index },
    });

    const [, drop] = useDrop({
        accept: 'SORT_ITEM',
        hover: (draggedItem) => {
            if (draggedItem.index !== index) {
                moveItem(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
    });

    return (
        <div ref={(node) => ref(drop(node))} className="sort-item">
            {text}
            {imageUrl && <img src={imageUrl} alt={text} />}
        </div>
    );
};

const SortingActivity = ({ activity, submitting, submitAnswer }) => {
    const sortContent = activity.content || {};
    const [items, setItems] = useState(sortContent.items || []);

    const moveItem = (fromIndex, toIndex) => {
        const updatedItems = [...items];
        const [movedItem] = updatedItems.splice(fromIndex, 1);
        updatedItems.splice(toIndex, 0, movedItem);
        setItems(updatedItems);
    };

    const handleSubmit = () => {
        // Format the answer as expected by the backend
        // This could be just the ordered IDs or the full items
        const orderedAnswers = items.map(item => item.id || item.text);
        submitAnswer(orderedAnswers);
    };

    return (
        <div className="sorting-activity">
            <h3>{activity.title}</h3>
            <p>{activity.instructions || sortContent.instructions}</p>
            
            <DndProvider backend={HTML5Backend}>
                <div className="sorting-items">
                    {items.map((item, index) => (
                        <SortableItem
                            key={item.id || index}
                            id={item.id || index}
                            text={item.text}
                            index={index}
                            moveItem={moveItem}
                            imageUrl={item.imageUrl}
                        />
                    ))}
                </div>
            </DndProvider>
            
            <button
                onClick={handleSubmit}
                disabled={submitting}
                className="submit-btn"
            >
                Submit Order
            </button>
        </div>
    );
};

export default SortingActivity;