import { useAuth } from "../../../context/AuthContext";
import "../../../style/game-matching.css";
import { Plus, Trash2, X, ImageIcon } from "lucide-react";
import axios from "axios";
import { v4 as uuidv4 } from 'uuid';

const MatchingForm = ({
  contentItems,
  setContentItems,
  shuffleOptions,
  setShuffleOptions,
  hints,
  setHints,
  currentHint,
  setCurrentHint,
  addHint,
  removeHint,
}) => {
  const { token } = useAuth();

  const addMatchPair = () => {
    setContentItems([
      ...contentItems,
      {
        contentId: uuidv4(),
        data: {
          item1: "",
          item2: "",
          item1ImageUrl: "",
          item2ImageUrl: "",
        },
        duration: 60, 
      },
    ]);
  };

  const removeMatchPair = (index) => {
    const updatedItems = contentItems.filter((_, i) => i !== index);
    setContentItems(updatedItems);
  };

  const handleImageUpload = async (file, pairIndex, field) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post("http://localhost:8080/api/upload/image", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      const updatedItems = [...contentItems];
      updatedItems[pairIndex].data[field] = res.data.imageUrl;
      setContentItems(updatedItems);
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
            checked={shuffleOptions}
            onChange={(e) => setShuffleOptions(e.target.checked)}
          />
          <label htmlFor="shuffleOptions">Shuffle Options</label>
        </div>

        {contentItems.map((contentItem, index) => (
          <div key={index} className="match-pair-row">
            <div className="match-pair-content">
              <div className="match-pair-item">
                <label>Item 1</label>
                <div className="input-with-icon">
                  <input
                    type="text"
                    placeholder="First item"
                    className="form-input pr-10"
                    value={contentItem.data.item1}
                    onChange={(e) => {
                      const updatedItems = [...contentItems];
                      updatedItems[index].data.item1 = e.target.value;
                      setContentItems(updatedItems);
                    }}
                  />
                  <label className="upload-icon-container">
                    <input
                      type="file"
                      className="hidden-file-input"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(e.target.files[0], index, "item1ImageUrl")
                      }
                    />
                    <ImageIcon className="upload-icon" />
                  </label>
                </div>
                {contentItem.data.item1ImageUrl && (
                  <div className="thumbnail-container">
                    <img
                      src={contentItem.data.item1ImageUrl}
                      alt="item1"
                      className="thumbnail-image"
                    />
                    <Trash2
                      className="trash-icon"
                      onClick={() => {
                        const updatedItems = [...contentItems];
                        updatedItems[index].data.item1ImageUrl = "";
                        setContentItems(updatedItems);
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
                    value={contentItem.data.item2}
                    onChange={(e) => {
                      const updatedItems = [...contentItems];
                      updatedItems[index].data.item2 = e.target.value;
                      setContentItems(updatedItems);
                    }}
                  />
                  <label className="upload-icon-container">
                    <input
                      type="file"
                      className="hidden-file-input"
                      accept="image/*"
                      onChange={(e) =>
                        handleImageUpload(e.target.files[0], index, "item2ImageUrl")
                      }
                    />
                    <ImageIcon className="upload-icon" />
                  </label>
                </div>
                {contentItem.data.item2ImageUrl && (
                  <div className="thumbnail-container">
                    <img
                      src={contentItem.data.item2ImageUrl}
                      alt="item2"
                      className="thumbnail-image"
                    />
                    <Trash2
                      className="trash-icon"
                      onClick={() => {
                        const updatedItems = [...contentItems];
                        updatedItems[index].data.item2ImageUrl = "";
                        setContentItems(updatedItems);
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
                disabled={contentItems.length <= 1}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <button type="button" className="add-pair-button" onClick={addMatchPair}>
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
              onKeyPress={(e) => e.key === "Enter" && addHint()}
            />
            <button type="button" className="add-hint-button" onClick={addHint}>
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
    </div>
  );
};

export default MatchingForm;