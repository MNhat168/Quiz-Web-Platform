import { Plus, Trash2, X } from "lucide-react"

const SortingForm = ({ 
  content, 
  setContent, 
  currentHint, 
  setCurrentHint, 
  addHint, 
  removeHint 
}) => {
  // Add item for sorting
  const addSortItem = () => {
    setContent({
      ...content,
      items: [
        ...content.items,
        { text: "", imageUrl: "", correctPosition: content.items.length + 1 }
      ]
    })
  }

  // Remove item for sorting
  const removeSortItem = (index) => {
    const updatedItems = [...content.items]
    updatedItems.splice(index, 1)

    // Update positions
    updatedItems.forEach((item, i) => {
      item.correctPosition = i + 1
    })

    setContent({
      ...content,
      items: updatedItems
    })
  }

  return (
    <div className="sorting-content">
      <h3 className="content-section-title">Sorting Items</h3>

      <div className="form-options">
        {content.items.map((item, index) => (
          <div key={index} className="sort-item-row">
            <div className="sort-item-position">
              <span>{index + 1}</span>
            </div>
            <div className="sort-item-content">
              <input
                type="text"
                placeholder="Item text"
                className="form-input"
                value={item.text}
                onChange={(e) => {
                  const updatedItems = [...content.items]
                  updatedItems[index].text = e.target.value
                  setContent({
                    ...content,
                    items: updatedItems
                  })
                }}
              />

              <input
                type="text"
                placeholder="Image URL (optional)"
                className="form-input"
                value={item.imageUrl}
                onChange={(e) => {
                  const updatedItems = [...content.items]
                  updatedItems[index].imageUrl = e.target.value
                  setContent({
                    ...content,
                    items: updatedItems
                  })
                }}
              />
            </div>

            <button
              type="button"
              className="remove-item-button"
              onClick={() => removeSortItem(index)}
              disabled={content.items.length <= 2}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          className="add-item-button"
          onClick={addSortItem}
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Hints Section */}
      <div className="hints-section">
        <h3 className="content-section-title">Hints</h3>
        <div className="hints-container">
          <div className="add-hint-form">
            <input
              type="text"
              placeholder="Add a hint..."
              className="form-input"
              value={currentHint}
              onChange={(e) => setCurrentHint(e.target.value)}
              onKeyPress={(e) => {
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
    </div>
  )
}

export default SortingForm