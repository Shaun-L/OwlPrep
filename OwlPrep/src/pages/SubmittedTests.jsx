import { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { TokenContext } from "../hooks/TokenContext";
import { TailSpin } from "react-loader-spinner";
import ProgressBar from 'react-customizable-progressbar';
import "../styles/SubmittedTests.css";

export default function SubmittedTests() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submittedTests, setSubmittedTests] = useState([]);
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchSubmittedTests = async () => {
            try {
                const response = await fetch('http://127.0.0.1:5000/submitted-tests', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch submitted tests');
                }

                const data = await response.json();
                console.log("Received submitted tests:", data);
                setSubmittedTests(data.submitted_tests || []);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching submitted tests:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        if (token) {
            fetchSubmittedTests();
        } else {
            navigate('/login');
        }
    }, [token, navigate]);

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

    if (submittedTests.length === 0) {
        return (
            <div className="submitted-tests-container">
                <h1>Submitted Tests</h1>
                <div className="no-tests-message">
                    <p>You haven't submitted any tests yet.</p>
                    <button onClick={() => navigate('/')} className="mainBtn">Take a Test</button>
                </div>
            </div>
        );
    }

    return (
        <div className="submitted-tests-container">
            <h1>Submitted Tests</h1>
            <div className="submitted-tests-grid">
                {submittedTests.map((test) => (
                    <div key={test.id} className="submitted-test-card" onClick={() => navigate(`/test-results/${test.id}`)}>
                        <div className="test-header">
                            <h2>{test.test_name}</h2>
                            <span className={`difficulty-badge ${test.difficulty.toLowerCase()}`}>
                                {test.difficulty}
                            </span>
                        </div>
                        
                        <div className="score-display">
                            <ProgressBar 
                                progress={test.score_percentage} 
                                radius={40}
                                strokeWidth={8}
                                strokeColor={test.score_percentage >= 70 ? "#4CAF50" : test.score_percentage >= 50 ? "#FFA726" : "#EF5350"}
                                trackStrokeWidth={8}
                                trackStrokeColor="#e6e6e6"
                            />
                            <div className="score-text">
                                <h3>{test.score_percentage}%</h3>
                            </div>
                        </div>

                        <div className="test-details">
                            <div className="detail-item">
                                <span className="label">Points:</span>
                                <span className="value">{test.points_earned} / {test.points_possible}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Topics:</span>
                                <span className="value">{Array.isArray(test.topics) ? test.topics.join(", ") : ""}</span>
                            </div>
                            <div className="detail-item">
                                <span className="label">Submitted:</span>
                                <span className="value">{test.created}</span>
                            </div>
                        </div>

                        <div className="test-actions">
                            <Link to={`/submitted-tests/${test.id}/review/1`} className="review-button">
                                Review Test
                            </Link>
                        </div>

                        <button className="view-results-btn">View Results</button>
                    </div>
                ))}
            </div>
        </div>
    );
} 