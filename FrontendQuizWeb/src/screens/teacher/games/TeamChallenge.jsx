import { Plus, Trash2, HelpCircle } from "lucide-react"
import { v4 as uuidv4 } from 'uuid';

const TeamChallengeForm = ({
    contentItems,
    setContentItems,
    currentHint,
    setCurrentHint,
    addHint,
    removeHint
}) => {
    const contentItem = contentItems[0] || {
        contentId: uuidv4(), // ✅ Now at contentItem level
        data: { // All game data goes here
            prompts: [""],
            roundTime: 60,
            maxRounds: 5,
            allowGuessing: true,
            pointsPerCorrect: 10,
            allowedWords: [],
            hints: [],
            pictionarySettings: {
                rotateDrawers: false,
                allowPartialPoints: false,
                revealAnswerOnFail: false,
                guessValidation: "EXACT_MATCH"
            }
        }
    };

    // Get the actual content data
    const content = contentItem.data;

    const updateContent = (updatedData) => {
        const newContentItems = [{
            ...contentItem,
            data: {
                ...content, // Existing data
                ...updatedData // New updates
            },
            duration: updatedData.roundTime || content.roundTime // Keep duration in sync
        }];
        setContentItems(newContentItems);
    };

    const updateSettings = (settings) => {
        updateContent({
            pictionarySettings: {
                ...content.pictionarySettings,
                ...settings
            }
        });
    };

    // Prompts handlers
    const addPrompt = () => updateContent({ prompts: [...content.prompts, ""] });
    const updatePrompt = (index, value) => {
        const updatedPrompts = [...content.prompts];
        updatedPrompts[index] = value;
        updateContent({ prompts: updatedPrompts });
    };
    const removePrompt = (index) => {
        const updatedPrompts = [...content.prompts];
        updatedPrompts.splice(index, 1);
        updateContent({ prompts: updatedPrompts });
    };

    // Allowed words handlers
    const addAllowedWord = () => updateContent({ allowedWords: [...content.allowedWords, ""] });
    const updateAllowedWord = (index, value) => {
        const updatedWords = [...content.allowedWords];
        updatedWords[index] = value;
        updateContent({ allowedWords: updatedWords });
    };
    const removeAllowedWord = (index) => {
        const updatedWords = [...content.allowedWords];
        updatedWords.splice(index, 1);
        updateContent({ allowedWords: updatedWords });
    };

    return (
        <div className="activity-content-form team-challenge-form">
            <h3>Drawing/Pictionary Challenge Setup</h3>

            <div className="form-section">
                <h4>Game Settings</h4>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="roundTime">Round Time (seconds)</label>
                        <input
                            id="roundTime"
                            type="number"
                            min="10"
                            value={content.roundTime}
                            onChange={(e) => updateContent({ roundTime: parseInt(e.target.value) })}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="maxRounds">Maximum Rounds</label>
                        <input
                            id="maxRounds"
                            type="number"
                            min="1"
                            value={content.maxRounds}
                            onChange={(e) => updateContent({ maxRounds: parseInt(e.target.value) })}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="pointsPerCorrect">Points Per Correct Answer</label>
                        <input
                            id="pointsPerCorrect"
                            type="number"
                            min="1"
                            value={content.pointsPerCorrect}
                            onChange={(e) => updateContent({ pointsPerCorrect: parseInt(e.target.value) })}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="allowGuessing"
                        checked={content.allowGuessing}
                        onChange={(e) => updateContent({ allowGuessing: e.target.checked })}
                    />
                    <label htmlFor="allowGuessing">Allow Guessing During Drawing</label>
                </div>
            </div>

            <div className="form-section">
                <h4>Drawing Prompts</h4>
                <p className="form-help-text">Add prompts that students will draw for their teammates to guess</p>

                {content.prompts.map((prompt, index) => (
                    <div key={index} className="form-row prompt-row">
                        <div className="form-group flex-grow">
                            <label htmlFor={`prompt-${index}`}>Prompt {index + 1}</label>
                            <input
                                id={`prompt-${index}`}
                                type="text"
                                value={prompt}
                                onChange={(e) => updatePrompt(index, e.target.value)}
                                className="form-input"
                                placeholder="Enter a word or phrase to draw"
                            />
                        </div>
                        <button
                            type="button"
                            className="remove-item-button"
                            onClick={() => removePrompt(index)}
                            disabled={content.prompts.length <= 1}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                <button type="button" className="add-item-button" onClick={addPrompt}>
                    <Plus size={16} /> Add Prompt
                </button>
            </div>

            <div className="form-section">
                <h4>Allowed Words List (Optional)</h4>
                <p className="form-help-text">Words that are allowed to be spoken/written during the game</p>

                {content.allowedWords.map((word, index) => (
                    <div key={index} className="form-row allowed-word-row">
                        <div className="form-group flex-grow">
                            <label htmlFor={`allowed-word-${index}`}>Allowed Word {index + 1}</label>
                            <input
                                id={`allowed-word-${index}`}
                                type="text"
                                value={word}
                                onChange={(e) => updateAllowedWord(index, e.target.value)}
                                className="form-input"
                                placeholder="Enter an allowed word"
                            />
                        </div>
                        <button
                            type="button"
                            className="remove-item-button"
                            onClick={() => removeAllowedWord(index)}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}

                {content.allowedWords.length === 0 && (
                    <p className="no-items-message">No allowed words added. All words are prohibited by default.</p>
                )}

                <button type="button" className="add-item-button" onClick={addAllowedWord}>
                    <Plus size={16} /> Add Allowed Word
                </button>
            </div>

            <div className="form-section">
                <h4>Hints</h4>
                <p className="form-help-text">Add optional hints that can be revealed during the activity</p>

                <div className="form-row">
                    <div className="form-group flex-grow">
                        <input
                            type="text"
                            value={currentHint}
                            onChange={(e) => setCurrentHint(e.target.value)}
                            className="form-input"
                            placeholder="Enter a hint"
                        />
                    </div>
                    <button
                        type="button"
                        className="add-hint-button"
                        onClick={addHint}
                        disabled={!currentHint.trim()}
                    >
                        <Plus size={16} /> Add
                    </button>
                </div>

                {content.hints.length > 0 ? (
                    <div className="hints-list">
                        {content.hints.map((hint, index) => (
                            <div key={index} className="hint-item">
                                <div className="hint-content">
                                    <HelpCircle size={16} />
                                    <span>{hint}</span>
                                </div>
                                <button
                                    type="button"
                                    className="remove-hint-button"
                                    onClick={() => removeHint(index)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="no-items-message">No hints added yet.</p>
                )}
            </div>

            <div className="advanced-settings-section">
                <h4>Advanced Settings</h4>

                <div className="form-group">
                    <label htmlFor="guessValidation">Guess Validation</label>
                    <select
                        id="guessValidation"
                        value={content.pictionarySettings.guessValidation}
                        onChange={(e) => updateSettings({ guessValidation: e.target.value })}
                        className="form-select"
                    >
                        <option value="EXACT_MATCH">Exact Match</option>
                        <option value="CONTAINS_KEYWORD">Contains Keyword</option>
                        <option value="SYNONYM_MATCH">Synonym Match</option>
                        <option value="MANUAL_TEACHER">Manual (Teacher Validates)</option>
                    </select>
                </div>

                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="rotateDrawers"
                        checked={content.pictionarySettings.rotateDrawers}
                        onChange={(e) => updateSettings({ rotateDrawers: e.target.checked })}
                    />
                    <label htmlFor="rotateDrawers">Rotate Drawers Within Team</label>
                </div>

                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="allowPartialPoints"
                        checked={content.pictionarySettings.allowPartialPoints}
                        onChange={(e) => updateSettings({ allowPartialPoints: e.target.checked })}
                    />
                    <label htmlFor="allowPartialPoints">Allow Partial Points</label>
                </div>

                <div className="form-group checkbox-group">
                    <input
                        type="checkbox"
                        id="revealAnswerOnFail"
                        checked={content.pictionarySettings.revealAnswerOnFail}
                        onChange={(e) => updateSettings({ revealAnswerOnFail: e.target.checked })}
                    />
                    <label htmlFor="revealAnswerOnFail">Reveal Answer on Failed Guess</label>
                </div>
            </div>
        </div>
    );
};

export default TeamChallengeForm;