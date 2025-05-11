import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TokenContext } from '../hooks/TokenContext';
import { API_URL } from '../constants';
import { TailSpin } from 'react-loader-spinner';
import axios from 'axios';

const PathwaySession = () => {
    const { session_id } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [sessionData, setSessionData] = useState(null);
    const [questions, setQuestions] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [answers, setAnswers] = useState({});
    const [roundResults, setRoundResults] = useState(null);
    const [error, setError] = useState(null);
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    // Fetch session data
    useEffect(() => {
        const fetchSessionData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/adaptive-pathway/${session_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                setSessionData(response.data);
                setQuestions(response.data.questions || {});
                
                // Check if we have stored answers in localStorage (from a previous session)
                const storedAnswers = localStorage.getItem(`pathway_answers_${session_id}`);
                if (storedAnswers) {
                    try {
                        const parsedAnswers = JSON.parse(storedAnswers);
                        // Only set stored answers if they're for the current questions
                        const questionIds = Object.keys(response.data.questions || {});
                        const storedQuestionIds = Object.keys(parsedAnswers);
                        
                        // Check if the stored answers match the current questions
                        if (storedQuestionIds.some(id => questionIds.includes(id))) {
                            setAnswers(parsedAnswers);
                            console.log('Restored saved answers from previous session');
                            
                            // Clear stored answers now that we've loaded them
                            localStorage.removeItem(`pathway_answers_${session_id}`);
                        }
                    } catch (e) {
                        console.error('Error parsing stored answers:', e);
                    }
                } else {
                    // Clear answers when starting a new round
                    setAnswers({});
                }
                
                setRoundResults(null);
            } catch (err) {
                console.error('Error fetching session data:', err);
                
                // Check for authentication errors
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                    setError('Your session has expired. Redirecting to login...');
                    
                    // Redirect to login after a delay
                    setTimeout(() => {
                        navigate('/login', { 
                            state: { 
                                returnPath: `/adaptive-pathway/${session_id}`,
                                message: 'Please login again to continue your learning session.' 
                            } 
                        });
                    }, 2000);
                } else {
                    setError('Error loading session data. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };
        
        fetchSessionData();
    }, [session_id, token]);

    // Handle answer selection
    const handleAnswerChange = (questionId, answer) => {
        setAnswers({
            ...answers,
            [questionId]: answer
        });
    };

    // Handle multiple choice selection
    const handleMultipleChoiceSelect = (questionId, optionIndex) => {
        handleAnswerChange(questionId, optionIndex);
    };

    // Handle true/false selection
    const handleTrueFalseSelect = (questionId, isTrue) => {
        handleAnswerChange(questionId, isTrue ? 0 : 1); // 0 for True, 1 for False
    };

    // Handle short answer input
    const handleShortAnswerInput = (questionId, text) => {
        handleAnswerChange(questionId, text);
    };

    // Handle multi-select checkboxes
    const handleMultiSelectChange = (questionId, optionIndex) => {
        const currentSelections = answers[questionId] || [];
        
        // Add or remove the option index from selections
        const newSelections = currentSelections.includes(optionIndex)
            ? currentSelections.filter(idx => idx !== optionIndex)
            : [...currentSelections, optionIndex];
        
        handleAnswerChange(questionId, newSelections);
    };

    // Navigate to next question
    const nextQuestion = () => {
        const questionKeys = Object.keys(questions);
        if (currentQuestion < questionKeys.length) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };

    // Navigate to previous question
    const prevQuestion = () => {
        if (currentQuestion > 1) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    // Submit answers for this round
    const submitAnswers = async () => {
        // Check if all questions have been answered
        const questionIds = Object.keys(questions);
        const unansweredQuestions = questionIds.filter(id => !answers[id] && answers[id] !== 0);
        
        if (unansweredQuestions.length > 0) {
            if (!confirm("You haven't answered all questions. Submit anyway?")) {
                return;
            }
        }
        
        setSubmitting(true);
        setError(null);
        
        try {
            const response = await axios.post(
                `${API_URL}/adaptive-pathway/${session_id}/submit`,
                { answers },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            setRoundResults(response.data.round_results);
            
            // If there are new questions, update the session data
            if (response.data.questions && Object.keys(response.data.questions).length > 0) {
                setSessionData({
                    ...sessionData,
                    questions: response.data.questions,
                    current_round: response.data.current_round,
                    topic_mastery: response.data.topic_mastery,
                    status: response.data.status
                });
                setQuestions(response.data.questions);
            } else {
                // Session is completed
                setSessionData({
                    ...sessionData,
                    status: 'completed',
                    topic_mastery: response.data.topic_mastery
                });
                setQuestions({});
            }
            
            // Reset to first question for the next round
            setCurrentQuestion(1);
            setAnswers({});
        } catch (err) {
            console.error('Error submitting answers:', err);
            
            // Check for authentication errors
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                // Authentication error - token might be expired
                setError('Your session has expired. Please save your answers and login again.');
                
                // Store answers in localStorage to prevent losing progress
                localStorage.setItem(`pathway_answers_${session_id}`, JSON.stringify(answers));
                
                // Redirect to login after a delay
                setTimeout(() => {
                    navigate('/login', { 
                        state: { 
                            returnPath: `/adaptive-pathway/${session_id}`,
                            message: 'Please login again to continue your learning session.' 
                        } 
                    });
                }, 3000);
            } else {
                setError('Error submitting answers. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Start a new round with the next set of questions
    const startNextRound = () => {
        setRoundResults(null);
        setCurrentQuestion(1);
    };

    // Render the content based on the current state
    const renderContent = () => {
        // If session is completed with no more questions
        if (sessionData?.status === 'completed' && Object.keys(questions).length === 0) {
            return renderCompletedSession();
        }
        
        // If we have round results to display
        if (roundResults) {
            return renderRoundResults();
        }
        
        // Otherwise, show the current question
        return renderCurrentQuestion();
    };

    // Render the current question
    const renderCurrentQuestion = () => {
        const questionIds = Object.keys(questions);
        if (questionIds.length === 0) {
            return (
                <div className="no-questions-message">
                    <p>No questions available for this session.</p>
                    <button onClick={() => navigate('/adaptive-pathway')}>
                        Return to Pathways
                    </button>
                </div>
            );
        }
        
        const currentQuestionId = questionIds[currentQuestion - 1];
        const question = questions[currentQuestionId];
        
        if (!question) {
            return <p>Question not found.</p>;
        }
        
        return (
            <div className="pathway-question-container">
                <div className="question-navigation">
                    <div className="question-progress">
                        <span>Question {currentQuestion} of {questionIds.length}</span>
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ width: `${(currentQuestion / questionIds.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                    
                    <div className="topic-indicator">
                        <span>Topic: {question.topic}</span>
                    </div>
                </div>
                
                <div className="question-content">
                    <h3 className="question-text">{question.question}</h3>
                    
                    <div className="answer-section">
                        {renderAnswerInput(currentQuestionId, question)}
                    </div>
                </div>
                
                <div className="question-actions">
                    <button 
                        className="prev-button"
                        onClick={prevQuestion}
                        disabled={currentQuestion === 1}
                    >
                        Previous
                    </button>
                    
                    {currentQuestion < questionIds.length ? (
                        <button
                            className="next-button"
                            onClick={nextQuestion}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            className="submit-button"
                            onClick={submitAnswers}
                            disabled={submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Answers'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // Render different answer inputs based on question type
    const renderAnswerInput = (questionId, question) => {
        const questionType = question.type;
        
        switch (questionType) {
            case 'MCQ':
                return (
                    <div className="multiple-choice">
                        {question.options.map((option, index) => (
                            <div 
                                key={index}
                                className={`option ${answers[questionId] === index ? 'selected' : ''}`}
                                onClick={() => handleMultipleChoiceSelect(questionId, index)}
                            >
                                <input
                                    type="radio"
                                    id={`option-${questionId}-${index}`}
                                    name={`question-${questionId}`}
                                    checked={answers[questionId] === index}
                                    onChange={() => {}} // Handled by onClick
                                />
                                <label htmlFor={`option-${questionId}-${index}`}>
                                    {option}
                                </label>
                            </div>
                        ))}
                    </div>
                );
            
            case 'T/F':
                return (
                    <div className="true-false">
                        <div 
                            className={`option ${answers[questionId] === 0 ? 'selected' : ''}`}
                            onClick={() => handleTrueFalseSelect(questionId, true)}
                        >
                            <input
                                type="radio"
                                id={`true-${questionId}`}
                                name={`question-${questionId}`}
                                checked={answers[questionId] === 0}
                                onChange={() => {}} // Handled by onClick
                            />
                            <label htmlFor={`true-${questionId}`}>True</label>
                        </div>
                        
                        <div 
                            className={`option ${answers[questionId] === 1 ? 'selected' : ''}`}
                            onClick={() => handleTrueFalseSelect(questionId, false)}
                        >
                            <input
                                type="radio"
                                id={`false-${questionId}`}
                                name={`question-${questionId}`}
                                checked={answers[questionId] === 1}
                                onChange={() => {}} // Handled by onClick
                            />
                            <label htmlFor={`false-${questionId}`}>False</label>
                        </div>
                    </div>
                );
            
            case 'SAQ':
                return (
                    <div className="short-answer">
                        <textarea
                            placeholder="Type your answer here..."
                            value={answers[questionId] || ''}
                            onChange={(e) => handleShortAnswerInput(questionId, e.target.value)}
                            rows={4}
                        ></textarea>
                    </div>
                );
            
            case 'SMQ':
                return (
                    <div className="multi-select">
                        <p className="instructions">Select all that apply:</p>
                        {question.options.map((option, index) => {
                            const isSelected = (answers[questionId] || []).includes(index);
                            return (
                                <div 
                                    key={index}
                                    className={`option ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleMultiSelectChange(questionId, index)}
                                >
                                    <input
                                        type="checkbox"
                                        id={`option-${questionId}-${index}`}
                                        checked={isSelected}
                                        onChange={() => {}} // Handled by onClick
                                    />
                                    <label htmlFor={`option-${questionId}-${index}`}>
                                        {option}
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                );
            
            default:
                return <p>Unknown question type: {questionType}</p>;
        }
    };

    // Render the results of the current round
    const renderRoundResults = () => {
        if (!roundResults) return null;
        
        const { score, correct, total, question_results } = roundResults;
        const hasNextRound = sessionData?.status === 'active' && Object.keys(questions).length > 0;
        
        return (
            <div className="round-results-container">
                <h2>Round {sessionData?.current_round - 1} Results</h2>
                
                <div className="results-summary">
                    <div className="score-circle">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle 
                                className="score-bg" 
                                cx="60" cy="60" r="50" 
                                fill="none" 
                                stroke="#eee" 
                                strokeWidth="10"
                            />
                            <circle 
                                className="score-progress" 
                                cx="60" cy="60" r="50" 
                                fill="none" 
                                stroke={score >= 70 ? "#28a745" : score >= 40 ? "#ffc107" : "#dc3545"} 
                                strokeWidth="10"
                                strokeDasharray={2 * Math.PI * 50}
                                strokeDashoffset={2 * Math.PI * 50 * (1 - score / 100)}
                                strokeLinecap="round"
                            />
                            <text 
                                x="60" y="65" 
                                textAnchor="middle" 
                                fontSize="24" 
                                fill="var(--primary-text-color)" 
                                fontWeight="bold"
                            >
                                {Math.round(score)}%
                            </text>
                        </svg>
                    </div>
                    
                    <div className="results-details">
                        <div className="results-item">
                            <span className="label">Correct:</span>
                            <span className="value">{correct} of {total}</span>
                        </div>
                        
                        <h3>Topic Mastery Progress</h3>
                        <div className="mastery-progress">
                            {Object.entries(sessionData?.topic_mastery || {}).map(([topic, mastery]) => (
                                <div key={topic} className="topic-mastery-item">
                                    <div className="topic-name">
                                        <span>{topic}</span>
                                        <span className="mastery-percent">{mastery}%</span>
                                    </div>
                                    <div className="mastery-bar">
                                        <div 
                                            className="mastery-fill"
                                            style={{ width: `${mastery}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="question-results">
                    <h3>Question Details</h3>
                    {Object.entries(question_results).map(([id, result]) => (
                        <div 
                            key={id}
                            className={`question-result ${result.correct ? 'correct' : 'incorrect'}`}
                        >
                            <h4>{result.question}</h4>
                            <div className="answer-details">
                                <div className="user-answer">
                                    <span className="label">Your answer:</span>
                                    <span className="value">{
                                        Array.isArray(result.user_answer) 
                                            ? `Selected options: ${result.user_answer.join(', ')}`
                                            : result.user_answer
                                    }</span>
                                </div>
                                
                                {!result.correct && (
                                    <div className="correct-answer">
                                        <span className="label">Correct answer:</span>
                                        <span className="value">{
                                            Array.isArray(result.correct_answer) 
                                                ? `Options: ${result.correct_answer.join(', ')}`
                                                : result.correct_answer
                                        }</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="results-actions">
                    {hasNextRound ? (
                        <button 
                            className="next-round-button"
                            onClick={startNextRound}
                        >
                            Continue to Next Round
                        </button>
                    ) : (
                        <div className="completed-message">
                            <h3>Learning Pathway Completed!</h3>
                            <p>You've mastered all the topics in this pathway.</p>
                            <button 
                                className="return-button"
                                onClick={() => navigate('/adaptive-pathway')}
                            >
                                Return to Pathways
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Render completed session information
    const renderCompletedSession = () => {
        return (
            <div className="completed-session-container">
                <h2>Learning Pathway Completed!</h2>
                
                <div className="completion-summary">
                    <div className="completed-icon">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="#28a745" />
                            <path 
                                d="M30 50 L45 65 L70 35" 
                                stroke="white" 
                                strokeWidth="8" 
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    
                    <div className="completion-details">
                        <p>You've successfully mastered all topics in this pathway!</p>
                        
                        <div className="mastery-summary">
                            <h3>Final Topic Mastery Levels</h3>
                            {Object.entries(sessionData?.topic_mastery || {}).map(([topic, mastery]) => (
                                <div key={topic} className="topic-mastery-item">
                                    <div className="topic-name">
                                        <span>{topic}</span>
                                        <span className="mastery-percent">{mastery}%</span>
                                    </div>
                                    <div className="mastery-bar">
                                        <div 
                                            className="mastery-fill"
                                            style={{ width: `${mastery}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="session-stats">
                            <div className="stat-item">
                                <span className="label">Total Rounds:</span>
                                <span className="value">{sessionData?.total_rounds || 0}</span>
                            </div>
                            <div className="stat-item">
                                <span className="label">Topics Mastered:</span>
                                <span className="value">{Object.keys(sessionData?.topic_mastery || {}).length}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="completion-actions">
                    <button 
                        className="new-pathway-button"
                        onClick={() => navigate('/adaptive-pathway')}
                    >
                        Return to Pathways
                    </button>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="pathway-session-container">
                <div className="loading-spinner">
                    <TailSpin
                        visible={true}
                        height="50"
                        width="50"
                        color="var(--primary-color)"
                        ariaLabel="tail-spin-loading"
                    />
                    <p>Loading your learning session...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pathway-session-container">
                <div className="error-message">
                    <p>{error}</p>
                    <button onClick={() => navigate('/adaptive-pathway')}>
                        Return to Pathways
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="pathway-session-container">
            <div className="session-header">
                <div className="session-title">
                    <h1>Learning Pathway - Round {sessionData?.current_round}</h1>
                    <div className="topic-list">
                        {sessionData?.topics?.map(topic => (
                            <span key={topic} className="topic-badge">
                                {topic}
                            </span>
                        ))}
                    </div>
                </div>
                
                <div className="session-status">
                    <div className="mastery-overview">
                        <span>Overall Mastery:</span>
                        <div className="mastery-indicator">
                            {Object.values(sessionData?.topic_mastery || {}).reduce((sum, val) => sum + val, 0) / 
                                Math.max(1, Object.keys(sessionData?.topic_mastery || {}).length)}%
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="session-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default PathwaySession; 