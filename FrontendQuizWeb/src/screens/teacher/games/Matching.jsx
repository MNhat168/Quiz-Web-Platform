import { useAuth } from "../../../context/AuthContext"
import "../../../style/game-matching.css"
import { Plus, Trash2, X, ImageIcon } from "lucide-react"
import axios from "axios";

const MatchingForm = ({ 
  content, 
  setContent, 
  currentHint, 
  setCurrentHint, 
  addHint, 
  removeHint 
}) => {
  const { token } = useAuth();
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

  const handleImageUpload = async (file, pairIndex, field) => {
    if (!file) return;
  
    const formData = new FormData();
    formData.append("file", file);
  
    try {
      const res = await axios.post("http://localhost:8080/api/upload/image", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });
  
      const imageUrl = res.data.imageUrl;
      const updatedPairs = [...content.pairs];
      updatedPairs[pairIndex][field] = imageUrl;
      setContent({ ...content, pairs: updatedPairs });
  
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload image failed!");
    }
  };

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
                <div className="input-with-icon">
                  <input
                    type="text"
                    placeholder="First item"
                    className="form-input pr-10"
                    value={pair.item1}
                    onChange={(e) => {
                      const updatedPairs = [...content.pairs];
                      updatedPairs[index].item1 = e.target.value;
                      setContent({ ...content, pairs: updatedPairs });
                    }}
                  />
                  
                  <label className="upload-icon-container">
                    <input
                      type="file"
                      className="hidden-file-input"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], index, "item1ImageUrl")}
                    />
                    <ImageIcon className="upload-icon" />
                  </label>
                </div>
                
                {pair.item1ImageUrl && (
                  <div className="thumbnail-container">
                    <img 
                      src={pair.item1ImageUrl} 
                      alt="item1" 
                      className="thumbnail-image"
                    />
                    <Trash2 
                      className="trash-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedPairs = [...content.pairs];
                        updatedPairs[index].item1ImageUrl = "";
                        setContent({ ...content, pairs: updatedPairs });
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="match-pair-item">
                <label>Item 2</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    placeholder="Matching item"
                    className="form-input pr-10"
                    value={pair.item2}
                    onChange={(e) => {
                      const updatedPairs = [...content.pairs];
                      updatedPairs[index].item2 = e.target.value;
                      setContent({ ...content, pairs: updatedPairs });
                    }}
                  />
                  
                  <label className="upload-icon-container">
                    <input
                      type="file"
                      className="hidden-file-input"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files[0], index, "item2ImageUrl")}
                    />
                    <ImageIcon className="upload-icon" />
                  </label>
                </div>
                
                {pair.item2ImageUrl && (
                  <div className="thumbnail-container">
                    <img 
                      src={pair.item2ImageUrl} 
                      alt="item2" 
                      className="thumbnail-image"
                    />
                    <Trash2 
                      className="trash-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        const updatedPairs = [...content.pairs];
                        updatedPairs[index].item2ImageUrl = "";
                        setContent({ ...content, pairs: updatedPairs });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="center-trash-wrapper">
              <button
                type="button"
                className="remove-pair-button"
                onClick={() => removeMatchPair(index)}
                disabled={content.pairs.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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