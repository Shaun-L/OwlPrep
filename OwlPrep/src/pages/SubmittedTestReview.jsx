import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { TokenContext } from "../hooks/TokenContext";
import { TailSpin } from "react-loader-spinner";
import MultipleChoice from "../components/MultipleChoice";
import ShortAnswer from "../components/ShortAnswer";
import SelectMany from "../components/SelectMany";
import TrueOrFalse from "../components/TrueOrFalse";
import "../styles/SubmittedTestReview.css";

export default function SubmittedTestReview() {
    const { submission_id, question_id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [testData, setTestData] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTestData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/submitted-tests/${submission_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch test data');
                }

                const data = await response.json();
                console.log("Received test data:", data);
                setTestData(data);
                
                // Get the current question data
                const questionNum = parseInt(question_id);
                const questionData = data.questions[questionNum];
                if (questionData) {
                    setCurrentQuestion({
                        ...questionData,
                        questionNumber: questionNum,
                        originalQuestion: questionData.original_question
                    });
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Error fetching test data:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (token) {
            fetchTestData();
        } else {
            navigate('/login');
        }
    }, [submission_id, question_id, token, navigate]);

    if (loading) {
        return (
            <div className="loading-container">
                <TailSpin visible={true} height="40" width="40" color={getComputedStyle(document.documentElement).getPropertyValue('--secondary-text-color').trim()} ariaLabel="tail-spin-loading" radius="1" wrapperStyle={{}} wrapperClass="loader" />
            </div>
        );
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    if (!testData || !currentQuestion) {
        return <div className="error-container">Test data not found</div>;
    }

    const renderQuestionReview = () => {
        const { originalQuestion, user_answer, points_awarded, points_possible, explanation, resource_recommendation } = currentQuestion;
        const questionType = originalQuestion.type;
        const isCorrect = points_awarded === points_possible;

        return (
            <div className="question-review-container">
                <div className="question-header">
                    <h2>Question {question_id}</h2>
                    <div className="points-display">
                        <span className={`points-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                            {points_awarded} / {points_possible} points
                        </span>
                    </div>
                </div>

                <div className="question-content">
                    <p className="question-text">{originalQuestion.question}</p>
                    
                    {/* Question Options */}
                    <div className="options-container">
                        {questionType === "MCQ" && (
                            <div className="options-list">
                                {originalQuestion.options.map((option, index) => (
                                    <div 
                                        key={index} 
                                        className={`option ${option === originalQuestion.answer ? 'correct-answer' : ''} 
                                                 ${option === user_answer ? (isCorrect ? 'correct-user-answer' : 'incorrect-user-answer') : ''}`}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {questionType === "T/F" && (
                            <div className="options-list">
                                {originalQuestion.options.map((option, index) => (
                                    <div 
                                        key={index} 
                                        className={`option ${option === originalQuestion.answer ? 'correct-answer' : ''} 
                                                 ${option === user_answer ? (isCorrect ? 'correct-user-answer' : 'incorrect-user-answer') : ''}`}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {questionType === "SMQ" && (
                            <div className="options-list">
                                {originalQuestion.options.map((option, index) => (
                                    <div 
                                        key={index} 
                                        className={`option ${originalQuestion.answer.includes(option) ? 'correct-answer' : ''} 
                                                 ${user_answer.includes(option) ? 
                                                    (originalQuestion.answer.includes(option) ? 'correct-user-answer' : 'incorrect-user-answer') : ''}`}
                                    >
                                        {option}
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {questionType === "SAQ" && (
                            <div className="answer-comparison">
                                <div className="user-answer">
                                    <h3>Your Answer:</h3>
                                    <p>{user_answer}</p>
                                </div>
                                <div className="correct-answer">
                                    <h3>Correct Answer:</h3>
                                    <p>{originalQuestion.answer}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* AI Explanation */}
                    <div className="explanation-section">
                        <h3>Explanation</h3>
                        <p>{explanation}</p>
                    </div>

                    {/* Resource Recommendation */}
                    {resource_recommendation && (
                        <div className="resource-section">
                            <h3>Recommended Resource</h3>
                            <a href={resource_recommendation.resource_url} target="_blank" rel="noopener noreferrer">
                                {resource_recommendation.resource_name}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const totalQuestions = Object.keys(testData.questions).length;
    const currentQuestionNum = parseInt(question_id);
    const nextQuestion = currentQuestionNum + 1;
    const previousQuestion = currentQuestionNum - 1;

    // Generate question navigation links
    const questionLinks = Array.from({ length: totalQuestions }, (_, i) => {
        const questionNum = i + 1;
        const questionData = testData.questions[questionNum];
        const isCorrect = questionData.points_awarded === questionData.points_possible;
        
        return (
            <Link 
                key={questionNum} 
                to={`/submitted-tests/${submission_id}/review/${questionNum}`}
                className={`question-link ${questionNum === currentQuestionNum ? 'current' : ''} ${isCorrect ? 'correct' : 'incorrect'}`}
            >
                Question {questionNum}
            </Link>
        );
    });

    return (
        <div className="submitted-test-review-container">
            <div className="navigation-bar">
                <Link to="/" className="nav-link home-link">Home</Link>
                <Link to="/submitted-tests" className="nav-link">All Tests</Link>
                <Link to={`/test-results/${submission_id}`} className="nav-link">Test Overview</Link>
            </div>
            
            <div className="main-content">
                <div className="test-header">
                    <h1>{testData.test_name}</h1>
                    <div className="test-stats">
                        <span>Score: {testData.score_percentage}%</span>
                        <span>Points: {testData.points_earned} / {testData.points_possible}</span>
                    </div>
                </div>

                {renderQuestionReview()}

                <div className="navigation-buttons">
                    {previousQuestion > 0 && (
                        <Link to={`/submitted-tests/${submission_id}/review/${previousQuestion}`} className="nav-button prev-button">
                            Previous Question
                        </Link>
                    )}
                    {nextQuestion <= totalQuestions && (
                        <Link to={`/submitted-tests/${submission_id}/review/${nextQuestion}`} className="nav-button next-button">
                            Next Question
                        </Link>
                    )}
                </div>
            </div>

            <div className="questions-sidebar">
                <h3>Questions</h3>
                <div className="question-links">
                    {questionLinks}
                </div>
                <div className="sidebar-actions">
                    <Link to={`/test-results/${submission_id}`} className="overview-link">
                        View Test Overview
                    </Link>
                    <Link to={`/submitted-tests`} className="back-to-results">
                        Back to All Tests
                    </Link>
                </div>
            </div>
        </div>
    );
} 