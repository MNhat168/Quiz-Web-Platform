import { Plus, Trash2, HelpCircle, Settings, Palette, Clock, Award, MessageSquare, CheckCircle } from "lucide-react"
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

const PlayfulTeamChallengeForm = ({
    contentItems,
    setContentItems,
    currentHint,
    setCurrentHint,
    addHint,
    removeHint
}) => {
    const [activeTab, setActiveTab] = useState('prompts');

    const contentItem = contentItems[0] || {
        contentId: uuidv4(),
        data: {
            prompts: [{
                text: "",
                hints: [],
                synonyms: []
            }],
            roundTime: 60,
            maxRounds: 5,
            allowGuessing: true,
            pointsPerCorrect: 10,
            allowedWords: [],
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
                ...content,
                ...updatedData
            },
            duration: updatedData.roundTime || content.roundTime
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
    const addPrompt = () => updateContent({
        prompts: [...content.prompts, { text: "", hints: [], synonyms: [] }]
    });

    const updatePrompt = (index, value) => {
        const updatedPrompts = [...content.prompts];
        updatedPrompts[index].text = value;
        updateContent({ prompts: updatedPrompts });
    };

    const addPromptHint = (promptIndex, hint) => {
        const updatedPrompts = [...content.prompts];
        updatedPrompts[promptIndex].hints.push(hint);
        updateContent({ prompts: updatedPrompts });
    };

    const removePromptHint = (promptIndex, hintIndex) => {
        const updatedPrompts = [...content.prompts];
        updatedPrompts[promptIndex].hints.splice(hintIndex, 1);
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

    // Colors for our playful design
    const colors = {
        primary: "#6366F1", // Indigo
        secondary: "#8B5CF6", // Purple
        accent: "#EC4899", // Pink
        success: "#10B981", // Green
        warning: "#F59E0B", // Amber
        light: "#F3F4F6", // Light gray
        dark: "#1F2937", // Dark gray
        white: "#FFFFFF"
    };

    const tabStyles = {
        container: {
            display: "flex",
            borderBottom: `2px solid ${colors.light}`,
            marginBottom: "20px"
        },
        tab: {
            padding: "12px 16px",
            borderRadius: "8px 8px 0 0",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s ease",
            fontWeight: 600
        },
        activeTab: {
            backgroundColor: colors.primary,
            color: colors.white
        },
        inactiveTab: {
            backgroundColor: colors.light,
            color: colors.dark,
            opacity: 0.8
        }
    };

    const formStyles = {
        container: {
            backgroundColor: colors.white,
            borderRadius: "12px",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            padding: "24px",
            margin: "10px 0",
            border: `1px solid ${colors.light}`
        },
        header: {
            fontSize: "24px",
            fontWeight: 700,
            color: colors.primary,
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        section: {
            marginBottom: "24px"
        },
        sectionTitle: {
            fontSize: "18px",
            fontWeight: 600,
            color: colors.secondary,
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        helpText: {
            fontSize: "14px",
            color: colors.dark,
            opacity: 0.7,
            marginBottom: "16px"
        },
        row: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px"
        },
        input: {
            width: "100%",
            padding: "10px 16px",
            borderRadius: "8px",
            border: `2px solid ${colors.light}`,
            fontSize: "16px",
            transition: "border 0.2s ease",
            outline: "none",
            "&:focus": {
                borderColor: colors.primary
            }
        },
        label: {
            fontWeight: 500,
            marginBottom: "6px",
            display: "block",
            color: colors.dark
        },
        button: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            border: "none"
        },
        addButton: {
            backgroundColor: colors.success,
            color: colors.white,
            "&:hover": {
                backgroundColor: "#0EA271"
            }
        },
        removeButton: {
            backgroundColor: colors.warning,
            color: colors.white,
            padding: "8px",
            borderRadius: "50%",
            minWidth: "32px",
            height: "32px"
        },
        noItems: {
            padding: "16px",
            borderRadius: "8px",
            backgroundColor: colors.light,
            color: colors.dark,
            opacity: 0.7,
            textAlign: "center",
            fontStyle: "italic"
        },
        checkbox: {
            cursor: "pointer",
            width: "20px",
            height: "20px"
        },
        checkboxLabel: {
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
        },
        select: {
            width: "100%",
            padding: "10px 16px",
            borderRadius: "8px",
            border: `2px solid ${colors.light}`,
            fontSize: "16px",
            backgroundColor: colors.white
        },
        hintItem: {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            backgroundColor: colors.light,
            borderRadius: "8px",
            marginBottom: "8px"
        },
        hintContent: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: colors.dark
        },
        formGroup: {
            marginBottom: "16px",
            width: "100%"
        }
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'prompts':
                return (
                    <div style={formStyles.section}>
                        <div style={formStyles.sectionTitle}>
                            <Palette size={20} />
                            Drawing Prompts
                        </div>
                        <p style={formStyles.helpText}>Add fun prompts with their own hints</p>

                        {content.prompts.map((prompt, index) => (
                            <div key={index} style={{ ...formStyles.container, marginBottom: "24px" }}>
                                <div style={formStyles.row}>
                                    <div style={formStyles.formGroup}>
                                        <label style={formStyles.label}>Prompt {index + 1}</label>
                                        <input
                                            type="text"
                                            value={prompt.text}
                                            onChange={(e) => updatePrompt(index, e.target.value)}
                                            style={formStyles.input}
                                            placeholder="Enter a fun word or phrase to draw"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        style={{ ...formStyles.button, ...formStyles.removeButton }}
                                        onClick={() => removePrompt(index)}
                                        disabled={content.prompts.length <= 1}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Hints for this prompt */}
                                <div style={{ marginLeft: "20px" }}>
                                    <div style={formStyles.sectionTitle}>
                                        <HelpCircle size={16} />
                                        Hints for this prompt
                                    </div>

                                    <div style={formStyles.row}>
                                        <div style={formStyles.formGroup}>
                                            <input
                                                type="text"
                                                value={currentHint}
                                                onChange={(e) => setCurrentHint(e.target.value)}
                                                style={formStyles.input}
                                                placeholder={`Hint for "${prompt.text}"`}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            style={{ ...formStyles.button, ...formStyles.addButton }}
                                            onClick={() => {
                                                addPromptHint(index, currentHint);
                                                setCurrentHint("");
                                            }}
                                            disabled={!currentHint.trim()}
                                        >
                                            <Plus size={16} /> Add Hint
                                        </button>
                                    </div>

                                    {prompt.hints.map((hint, hintIndex) => (
                                        <div key={hintIndex} style={formStyles.hintItem}>
                                            <div style={formStyles.hintContent}>
                                                <HelpCircle size={16} color={colors.secondary} />
                                                <span>{hint}</span>
                                            </div>
                                            <button
                                                type="button"
                                                style={{ ...formStyles.button, ...formStyles.removeButton }}
                                                onClick={() => removePromptHint(index, hintIndex)}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            style={{ ...formStyles.button, ...formStyles.addButton }}
                            onClick={addPrompt}
                        >
                            <Plus size={16} /> Add New Prompt
                        </button>
                    </div>
                );
            case 'words':
                return (
                    <div style={formStyles.section}>
                        <div style={formStyles.sectionTitle}>
                            <MessageSquare size={20} />
                            Allowed Words List
                        </div>
                        <p style={formStyles.helpText}>Words that are allowed to be spoken/written during the game</p>

                        {content.allowedWords.map((word, index) => (
                            <div key={index} style={formStyles.row}>
                                <div style={formStyles.formGroup}>
                                    <label style={formStyles.label} htmlFor={`allowed-word-${index}`}>Allowed Word {index + 1}</label>
                                    <input
                                        id={`allowed-word-${index}`}
                                        type="text"
                                        value={word}
                                        onChange={(e) => updateAllowedWord(index, e.target.value)}
                                        style={formStyles.input}
                                        placeholder="Enter an allowed word"
                                    />
                                </div>
                                <button
                                    type="button"
                                    style={{ ...formStyles.button, ...formStyles.removeButton }}
                                    onClick={() => removeAllowedWord(index)}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}

                        {content.allowedWords.length === 0 && (
                            <p style={formStyles.noItems}>No allowed words added. All words are prohibited by default.</p>
                        )}

                        <button
                            type="button"
                            style={{ ...formStyles.button, ...formStyles.addButton }}
                            onClick={addAllowedWord}
                        >
                            <Plus size={16} /> Add Allowed Word
                        </button>
                    </div>
                );
            case 'settings':
                return (
                    <>
                        <div style={formStyles.section}>
                            <div style={formStyles.sectionTitle}>
                                <Clock size={20} />
                                Game Settings
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                                <div style={formStyles.formGroup}>
                                    <label style={formStyles.label} htmlFor="roundTime">Round Time (seconds)</label>
                                    <input
                                        id="roundTime"
                                        type="number"
                                        min="10"
                                        value={content.roundTime}
                                        onChange={(e) => updateContent({ roundTime: parseInt(e.target.value) })}
                                        style={formStyles.input}
                                    />
                                </div>
                                <div style={formStyles.formGroup}>
                                    <label style={formStyles.label} htmlFor="maxRounds">Maximum Rounds</label>
                                    <input
                                        id="maxRounds"
                                        type="number"
                                        min="1"
                                        value={content.maxRounds}
                                        onChange={(e) => updateContent({ maxRounds: parseInt(e.target.value) })}
                                        style={formStyles.input}
                                    />
                                </div>
                                <div style={formStyles.formGroup}>
                                    <label style={formStyles.label} htmlFor="pointsPerCorrect">Points Per Correct</label>
                                    <input
                                        id="pointsPerCorrect"
                                        type="number"
                                        min="1"
                                        value={content.pointsPerCorrect}
                                        onChange={(e) => updateContent({ pointsPerCorrect: parseInt(e.target.value) })}
                                        style={formStyles.input}
                                    />
                                </div>
                            </div>

                            <div style={{ ...formStyles.formGroup, display: "flex", alignItems: "center", gap: "8px", marginTop: "16px" }}>
                                <input
                                    type="checkbox"
                                    id="allowGuessing"
                                    checked={content.allowGuessing}
                                    onChange={(e) => updateContent({ allowGuessing: e.target.checked })}
                                    style={formStyles.checkbox}
                                />
                                <label style={formStyles.checkboxLabel} htmlFor="allowGuessing">Allow Guessing During Drawing</label>
                            </div>
                        </div>

                        <div style={formStyles.section}>
                            <div style={formStyles.sectionTitle}>
                                <Settings size={20} />
                                Advanced Settings
                            </div>

                            <div style={formStyles.formGroup}>
                                <label style={formStyles.label} htmlFor="guessValidation">Guess Validation</label>
                                <select
                                    id="guessValidation"
                                    value={content.pictionarySettings.guessValidation}
                                    onChange={(e) => updateSettings({ guessValidation: e.target.value })}
                                    style={formStyles.select}
                                >
                                    <option value="EXACT_MATCH">Exact Match</option>
                                    <option value="CONTAINS_KEYWORD">Contains Keyword</option>
                                    <option value="SYNONYM_MATCH">Synonym Match</option>
                                    <option value="MANUAL_TEACHER">Manual (Teacher Validates)</option>
                                </select>
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                                <div style={{ ...formStyles.formGroup, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input
                                        type="checkbox"
                                        id="rotateDrawers"
                                        checked={content.pictionarySettings.rotateDrawers}
                                        onChange={(e) => updateSettings({ rotateDrawers: e.target.checked })}
                                        style={formStyles.checkbox}
                                    />
                                    <label style={formStyles.checkboxLabel} htmlFor="rotateDrawers">Rotate Drawers Within Team</label>
                                </div>

                                <div style={{ ...formStyles.formGroup, display: "flex", alignItems: "center", gap: "8px" }}>
                                    <input
                                        type="checkbox"
                                        id="allowPartialPoints"
                                        checked={content.pictionarySettings.allowPartialPoints}
                                        onChange={(e) => updateSettings({ allowPartialPoints: e.target.checked })}
                                        style={formStyles.checkbox}
                                    />
                                    <label style={formStyles.checkboxLabel} htmlFor="allowPartialPoints">Allow Partial Points</label>
                                </div>
                            </div>

                            <div style={{ ...formStyles.formGroup, display: "flex", alignItems: "center", gap: "8px" }}>
                                <input
                                    type="checkbox"
                                    id="revealAnswerOnFail"
                                    checked={content.pictionarySettings.revealAnswerOnFail}
                                    onChange={(e) => updateSettings({ revealAnswerOnFail: e.target.checked })}
                                    style={formStyles.checkbox}
                                />
                                <label style={formStyles.checkboxLabel} htmlFor="revealAnswerOnFail">Reveal Answer on Failed Guess</label>
                            </div>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            fontFamily: "'Inter', system-ui, sans-serif",
            backgroundColor: "#F9FAFB",
            padding: "24px",
            borderRadius: "16px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        }}>
            <div style={formStyles.header}>
                <Palette size={28} color={colors.primary} />
                Pictionary Challenge Designer
            </div>

            <div style={tabStyles.container}>
                <div
                    style={{
                        ...tabStyles.tab,
                        ...(activeTab === 'prompts' ? tabStyles.activeTab : tabStyles.inactiveTab)
                    }}
                    onClick={() => setActiveTab('prompts')}
                >
                    <Palette size={18} />
                    Prompts
                </div>
                <div
                    style={{
                        ...tabStyles.tab,
                        ...(activeTab === 'words' ? tabStyles.activeTab : tabStyles.inactiveTab)
                    }}
                    onClick={() => setActiveTab('words')}
                >
                    <MessageSquare size={18} />
                    Words
                </div>
                <div
                    style={{
                        ...tabStyles.tab,
                        ...(activeTab === 'settings' ? tabStyles.activeTab : tabStyles.inactiveTab)
                    }}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings size={18} />
                    Settings
                </div>
            </div>

            <div style={formStyles.container}>
                {renderTabContent()}
            </div>

            {/* <div style={{
                textAlign: "center",
                marginTop: "24px",
                display: "flex",
                justifyContent: "center"
            }}>
                <button style={{
                    ...formStyles.button,
                    backgroundColor: colors.primary,
                    color: colors.white,
                    padding: "12px 24px",
                    fontSize: "18px"
                }}>
                    <CheckCircle size={20} />
                    Save Challenge
                </button>
            </div> */}
        </div>
    );
};

export default PlayfulTeamChallengeForm;