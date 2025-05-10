import { useState, useEffect, useRef } from "react";
import { Lightbulb } from "lucide-react";

const FillInBlankGame = ({ activity, contentItem, submitting, submitAnswer, currentContentIndex }) => {
  const [userAnswers, setUserAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [activeBlankIndex, setActiveBlankIndex] = useState(0);
  const [feedback, setFeedback] = useState({});
  const inputRef = useRef(null);

  // Unified content handling like MultipleChoice
  const getContent = () => {
    if (contentItem && contentItem.data) return contentItem.data;
    return activity?.content || { questionText: "", blanks: [], hints: [] };
  };

  const content = getContent();

  useEffect(() => {
    if (content.blanks) {
      setUserAnswers(new Array(content.blanks.length).fill(""));
    }
  }, [content]);

  const getWordCount = (blankIndex) => {
    return content.blanks[blankIndex]?.answer?.split(' ')?.length || 1;
  };

  const handleAnswer = async () => {
    if (!currentAnswer.trim() || submitting || activeBlankIndex === null) return;

    try {
      const blankData = content.blanks[activeBlankIndex];
      const correctAnswer = blankData?.answer || "";
      const alternatives = blankData?.alternatives || [];

      const answerData = {
        questionIndex: currentContentIndex,  // Now passed as prop
        blankIndex: activeBlankIndex,
        answer: currentAnswer.trim(),
        acceptableAnswers: {
          [currentContentIndex]: {  // Use currentContentIndex as questionIndex
            [activeBlankIndex]: [correctAnswer, ...alternatives].filter(Boolean)
          }
        }
      };

      const result = await submitAnswer(answerData);
      
      const newAnswers = [...userAnswers];
      newAnswers[activeBlankIndex] = currentAnswer.trim();
      setUserAnswers(newAnswers);

      setFeedback(prev => ({
        ...prev,
        [activeBlankIndex]: {
          correct: result.correct,
          correctAnswer: correctAnswer,
          isAlternative: result.correct && currentAnswer.trim().toLowerCase() !== correctAnswer.toLowerCase()
        }
      }));

      setCurrentAnswer("");
      if (activeBlankIndex < content.blanks.length - 1) {
        setActiveBlankIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  if (!content.blanks) return null;

  const questionText = content.questionText || "";
  const parts = questionText.split(/_+/g);

  return (
    <div className="!p-6 !space-y-6 !bg-white !rounded-lg !shadow-md">
      <div className="!flex !justify-between !items-center">
        <div className="!text-lg !font-medium">
          {activity?.title || "Fill in the Blanks"}
        </div>
      </div>

      <div className="!space-y-6">
        <div className="!flex !flex-wrap !gap-2 !items-center">
          {parts.map((part, index) => {
            if (index < parts.length - 1) {
              const isActive = activeBlankIndex === index;
              const isAnswered = userAnswers[index];
              const wordCount = getWordCount(index);

              return (
                <div key={index} className="!flex !items-center !gap-2">
                  <span className="!text-gray-700">{part}</span>
                  <button
                    className={`!px-4 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500 ${
                      isActive ? '!bg-blue-50 !border-blue-500' :
                      isAnswered ? '!bg-green-50 !border-green-500' :
                      '!bg-gray-50 !border-gray-300'
                    }`}
                    onClick={() => !isAnswered && setActiveBlankIndex(index)}
                    disabled={submitting || isAnswered}
                  >
                    {isAnswered ? userAnswers[index] : '_'.repeat(wordCount)}
                  </button>
                </div>
              );
            }
            return <span key={index} className="!text-gray-700">{part}</span>;
          })}
        </div>

        <div className="!flex !gap-2 !items-start">
          <div className="!flex-1 !space-y-2">
            <input
              ref={inputRef}
              type="text"
              className="!w-full !px-4 !py-2 !border !rounded-md focus:!outline-none focus:!ring-2 focus:!ring-blue-500"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder={activeBlankIndex !== null ?
                `Answer for blank ${activeBlankIndex + 1} (${getWordCount(activeBlankIndex)} word${getWordCount(activeBlankIndex) > 1 ? 's' : ''})` :
                "All blanks completed"}
              onKeyDown={(e) => e.key === 'Enter' && handleAnswer()}
              disabled={submitting || activeBlankIndex === null}
            />
          </div>

          <button
            className="!px-4 !py-2 !text-white !bg-blue-600 !rounded-md hover:!bg-blue-700 focus:!outline-none focus:!ring-2 focus:!ring-blue-500 disabled:!bg-gray-400 !whitespace-nowrap"
            onClick={handleAnswer}
            disabled={submitting || !currentAnswer.trim() || activeBlankIndex === null}
          >
            {submitting ? 'Submitting...' : 'Submit Answer'}
          </button>
        </div>

        <div className="!space-y-2">
          {Object.entries(feedback).map(([blankIndex, fb]) => (
            <div key={blankIndex} className={`!text-sm ${fb.correct ? '!text-green-500' : '!text-red-500'}`}>
              {fb.correct ? (
                fb.isAlternative ? (
                  <div>Alternative accepted: "{fb.correctAnswer}"</div>
                ) : (
                  <div>Correct!</div>
                )
              ) : (
                <div>Correct answer: "{fb.correctAnswer}"</div>
              )}
            </div>
          ))}
        </div>

        {(content.hints || []).length > 0 && (
          <div className="!space-y-2">
            <button
              className="!flex !items-center !gap-2 !px-4 !py-2 !text-blue-600 hover:!text-blue-800"
              onClick={() => setShowFeedback(!showFeedback)}
            >
              <Lightbulb className="!w-4 !h-4" /> Hint
            </button>

            {showFeedback && (
              <div className="!p-4 !bg-gray-50 !rounded-md">
                {(content.hints || []).map((hint, index) => (
                  <p key={index} className="!text-gray-600">{hint}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FillInBlankGame;