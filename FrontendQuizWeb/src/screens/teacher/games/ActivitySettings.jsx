import { Plus, X } from "lucide-react"

const HintsSection = ({ 
  hints, 
  currentHint, 
  setCurrentHint, 
  addHint, 
  removeHint 
}) => {
  return (
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
          {hints.map((hint, index) => (
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

export default HintsSection