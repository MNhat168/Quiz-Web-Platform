import { Plus, Trash2, X } from "lucide-react"

const MatchingForm = ({ 
  content, 
  setContent, 
  currentHint, 
  setCurrentHint, 
  addHint, 
  removeHint 
}) => {
  // Add pair for matching
  const addMatchPair = () => {
    setContent({
      ...content,
      pairs: [
        ...content.pairs,
        { item1: "", item2: "", item1ImageUrl: "", item2ImageUrl: "" }
      ]
    })
  }

  // Remove pair for matching
  const removeMatchPair = (index) => {
    const updatedPairs = [...content.pairs]
    updatedPairs.splice(index, 1)
    setContent({
      ...content,
      pairs: updatedPairs
    })
  }

  return (
    <div className="matching-content">
      <h3 className="content-section-title">Matching Pairs</h3>

      <div className="form-options">
        <div className="form-checkbox mb-4">
          <input
            type="checkbox"
            id="shuffleOptions"
            checked={content.shuffleOptions}
            onChange={(e) => setContent({
              ...content,
              shuffleOptions: e.target.checked
            })}
          />
          <label htmlFor="shuffleOptions">Shuffle Options</label>
        </div>

        {content.pairs.map((pair, index) => (
          <div key={index} className="match-pair-row">
            <div className="match-pair-content">
              <div className="match-pair-item">
                <label>Item 1</label>
                <input
                  type="text"
                  placeholder="First item"
                  className="form-input"
                  value={pair.item1}
                  onChange={(e) => {
                    const updatedPairs = [...content.pairs]
                    updatedPairs[index].item1 = e.target.value
                    setContent({
                      ...content,
                      pairs: updatedPairs
                    })
                  }}
                />

                <input
                  type="text"
                  placeholder="Image URL (optional)"
                  className="form-input"
                  value={pair.item1ImageUrl}
                  onChange={(e) => {
                    const updatedPairs = [...content.pairs]
                    updatedPairs[index].item1ImageUrl = e.target.value
                    setContent({
                      ...content,
                      pairs: updatedPairs
                    })
                  }}
                />
              </div>

              <div className="match-pair-item">
                <label>Item 2</label>
                <input
                  type="text"
                  placeholder="Matching item"
                  className="form-input"
                  value={pair.item2}
                  onChange={(e) => {
                    const updatedPairs = [...content.pairs]
                    updatedPairs[index].item2 = e.target.value
                    setContent({
                      ...content,
                      pairs: updatedPairs
                    })
                  }}
                />

                <input
                  type="text"
                  placeholder="Image URL (optional)"
                  className="form-input"
                  value={pair.item2ImageUrl}
                  onChange={(e) => {
                    const updatedPairs = [...content.pairs]
                    updatedPairs[index].item2ImageUrl = e.target.value
                    setContent({
                      ...content,
                      pairs: updatedPairs
                    })
                  }}
                />
              </div>
            </div>

            <button
              type="button"
              className="remove-pair-button"
              onClick={() => removeMatchPair(index)}
              disabled={content.pairs.length <= 1}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          className="add-pair-button"
          onClick={addMatchPair}
        >
          <Plus className="w-4 h-4" /> Add Pair
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

export default MatchingForm