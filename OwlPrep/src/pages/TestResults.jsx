import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { TokenContext } from "../hooks/TokenContext";
import { TailSpin } from "react-loader-spinner";
import ProgressBar from 'react-customizable-progressbar';
import "../styles/TestResults.css";

export default function TestResults() {
    const { submission_id } = useParams();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [testResults, setTestResults] = useState(null);
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchResults = async () => {
            try {
                // Get the submitted test from Firebase
                const response = await fetch(`http://127.0.0.1:5000/submitted-tests/${submission_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch test results');
                }

                const data = await response.json();
                setTestResults(data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching results:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (token) {
            fetchResults();
        } else {
            navigate('/login');
        }
    }, [submission_id, token, navigate]);

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

    if (!testResults) {
        return <div className="error-container">No results found</div>;
    }

    // Calculate correct and incorrect counts
    const questionsObj = testResults.questions || {};
    const questions = Object.entries(questionsObj).map(([id, data]) => ({
        id: parseInt(id),
        ...data
    })).sort((a, b) => a.id - b.id);
    
    const correctCount = questions.filter(q => 
        q.points_awarded === q.points_possible).length;
    const incorrectCount = questions.length - correctCount;

    return (
        <div className="test-results-container">
            <div className="navigation-bar">
                <Link to="/" className="nav-link home-link">Home</Link>
                <Link to="/submitted-tests" className="nav-link">All Tests</Link>
            </div>
            
            <h1>{testResults.test_name} - Results</h1>
            
            <div className="results-summary">
                <div className="score-card">
                    <div className="score-display">
                        <ProgressBar 
                            progress={testResults.score_percentage} 
                            radius={50}
                            strokeWidth={8}
                            trackStrokeWidth={8}
                            trackStrokeColor="#e6e6e6"
                            trackStrokeLinecap="round"
                            strokeLinecap="round"
                            pointerRadius={0}
                            initialAnimation={true}
                        />
                        <div className="score-text">
                            <h2>{testResults.score_percentage}%</h2>
                        </div>
                    </div>
                    
                    <div className="score-details">
                        <div className="stat-item">
                            <span className="label">Points:</span>
                            <span className="value">{testResults.points_earned} / {testResults.points_possible}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Correct:</span>
                            <span className="value correct-count">{correctCount}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Incorrect:</span>
                            <span className="value incorrect-count">{incorrectCount}</span>
                        </div>
                    </div>
                </div>

                <div className="results-details">
                    {testResults.test_description && (
                        <div className="description-container">
                            <h3>Description</h3>
                            <p>{testResults.test_description}</p>
                        </div>
                    )}
                    
                    <div className="topics-container">
                        <h3>Topics</h3>
                        <div className="topics-list">
                            {Array.isArray(testResults.topics) && testResults.topics.map((topic, index) => (
                                <span key={index} className="topic-badge">{topic}</span>
                            ))}
                        </div>
                    </div>
                    
                    <div className="question-types-container">
                        <h3>Question Types</h3>
                        <div className="question-types-list">
                            {Array.isArray(testResults.question_types) && testResults.question_types.map((type, index) => (
                                <span key={index} className="question-type-badge">{type}</span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="results-actions">
                <Link to={`/submitted-tests/${submission_id}/review/1`} className="review-button">
                    Review Questions
                </Link>
                {testResults.original_test_id && (
                    <Link to={`/tests/${testResults.original_test_id}`} className="retake-button">
                        Retake Test
                    </Link>
                )}
                <Link to="/submitted-tests" className="back-button">
                    Back to All Tests
                </Link>
            </div>

            <div className="questions-summary">
                <h2>Questions Overview</h2>
                <div className="questions-grid">
                    {questions.map((question) => {
                        const isCorrect = question.points_awarded === question.points_possible;
                        return (
                            <Link 
                                key={question.id} 
                                to={`/submitted-tests/${submission_id}/review/${question.id}`}
                                className={`question-card ${isCorrect ? 'correct' : 'incorrect'}`}
                            >
                                <div className="question-number">Question {question.id}</div>
                                <div className="question-score">
                                    <span>{question.points_awarded} / {question.points_possible}</span>
                                    <div className={`status-indicator ${isCorrect ? 'correct' : 'incorrect'}`}></div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
} 