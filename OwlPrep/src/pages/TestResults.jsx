import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TokenContext } from "../hooks/TokenContext";
import { TailSpin } from "react-loader-spinner";
import ProgressBar from 'react-customizable-progressbar';

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
                console.log("Received test results:", data); // Debug log
                setTestResults(data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching results:", err); // Debug log
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

    // Debug log to see the structure of testResults
    console.log("Rendering with testResults:", testResults);

    // Ensure questions is an array before mapping
    const questions = Array.isArray(testResults.questions) ? testResults.questions : [];

    return (
        <div className="test-results-container">
            <h1>Test Results</h1>
            
            <div className="results-summary">
                <div className="score-display">
                    <ProgressBar 
                        progress={testResults.score_percentage} 
                        radius={100}
                        strokeWidth={10}
                        strokeColor="#4CAF50"
                        trackStrokeWidth={10}
                        trackStrokeColor="#e6e6e6"
                    />
                    <div className="score-text">
                        <h2>{testResults.score_percentage}%</h2>
                        <p>Score</p>
                    </div>
                </div>

                <div className="results-details">
                    <h2>{testResults.test_name}</h2>
                    <p>{testResults.test_description}</p>
                    
                    <div className="stats-grid">
                        <div className="stat-item">
                            <h3>Points Earned</h3>
                            <p>{testResults.points_earned} / {testResults.points_possible}</p>
                        </div>
                        <div className="stat-item">
                            <h3>Topics</h3>
                            <p>{Array.isArray(testResults.topics) ? testResults.topics.join(", ") : ""}</p>
                        </div>
                        <div className="stat-item">
                            <h3>Question Types</h3>
                            <p>{Array.isArray(testResults.question_types) ? testResults.question_types.join(", ") : ""}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="questions-review">
                <h2>Question Review</h2>
                {questions.map((question, index) => (
                    <div key={index} className={`question-review ${question.score < 1 ? 'incorrect' : 'correct'}`}>
                        <h3>Question {index + 1}</h3>
                        <p className="question-text">{question.question}</p>
                        <div className="answer-details">
                            <p><strong>Your Answer:</strong> {question.user_answer}</p>
                            <p><strong>Correct Answer:</strong> {question.correct_answer}</p>
                            <p><strong>Score:</strong> {question.score} points</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="actions">
                <button onClick={() => navigate('/')} className="mainBtn">Back to Home</button>
                <button onClick={() => navigate(`/tests/${testResults.original_test_id}`)} className="mainBtn">Review Test</button>
            </div>
        </div>
    );
} 