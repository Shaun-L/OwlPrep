import React, { useState, useEffect, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TokenContext } from "../hooks/TokenContext";
import { API_URL } from "../constants";
import axios from "axios";
import LoadingSpinner from "../components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import "../styles/Progress.css";

export default function Progress() {
    const [progressData, setProgressData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProgressData = async () => {
            try {
                setLoading(true);
                
                const response = await axios.get(
                    `${API_URL}/progress`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                
                setProgressData(response.data.progress_data);
            } catch (error) {
                console.error("Error fetching progress data:", error);
                setError("Failed to load progress data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };
        
        fetchProgressData();
    }, [token]);

    const handleTestClick = (testId) => {
        navigate(`/test-results/${testId}`);
    };

    if (loading) {
        return (
            <div className="loading-container">
                <LoadingSpinner />
                <p>Loading your progress data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>Error</h2>
                <p>{error}</p>
            </div>
        );
    }

    if (!progressData || (progressData.topic_performance && progressData.topic_performance.length === 0)) {
        return (
            <div className="no-data-container">
                <h2>No Progress Data Available</h2>
                <p>Complete some tests and quizzes to see your progress!</p>
                <div className="no-data-actions">
                    <button onClick={() => navigate('/create-test')} className="formSubmitButton">
                        Create a Practice Test
                    </button>
                    <button onClick={() => navigate('/daily-quiz')} className="formSubmitButton">
                        Take Daily Quiz
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div id="progress-tracker">
            <h1>Progress Tracker</h1>
            <p>Track your progress across all your tests and quizzes</p>
            
            <div className="pt-summary">
                <div className="pt-summary-card">
                    <h3>Total Tests Taken</h3>
                    <p className="pt-stat">{progressData.overall_stats.total_tests}</p>
                </div>
                <div className="pt-summary-card">
                    <h3>Average Score</h3>
                    <p className="pt-stat">{progressData.overall_stats.average_score}%</p>
                </div>
            </div>
            
            <div className="pt-container">
                <div className="pt-container-middle">
                    <div className="pt-testScoreGraph">
                        <h3>Performance by Topic</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={progressData.topic_performance} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                                    <XAxis dataKey="topic" angle={-45} textAnchor="end" height={70} />
                                    <YAxis domain={[0, 100]} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Legend />
                                    <Bar dataKey="performance" name="Average Score" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="pt-quizScoreGraph">
                        <h3>Progress Over Time</h3>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <XAxis dataKey="date" type="category" allowDuplicatedCategory={false} />
                                    <YAxis domain={[0, 100]} label={{ value: 'Score (%)', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip formatter={(value) => `${value}%`} />
                                    <Legend />
                                    <Line 
                                        data={progressData.practice_test_performance} 
                                        type="monotone" 
                                        dataKey="score" 
                                        name="Practice Tests" 
                                        stroke="#8884d8" 
                                        activeDot={{ r: 8 }}
                                    />
                                    <Line 
                                        data={progressData.daily_quiz_performance} 
                                        type="monotone" 
                                        dataKey="score" 
                                        name="Daily Quizzes" 
                                        stroke="#82ca9d" 
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    
                    <div className="pt-bestPerformance">
                        <h3>Best Performance in Topics</h3>
                        {progressData.best_topics.length > 0 ? (
                            progressData.best_topics.map((topic, index) => (
                                <div key={index} className="pt-button-btopic">
                                    <span>{topic.topic}</span>
                                    <span className="topic-score">{topic.performance}%</span>
                                </div>
                            ))
                        ) : (
                            <p>No topic data available yet</p>
                        )}
                    </div>
                    
                    <div className="pt-worstPerformance">
                        <h3>Needs Improvement</h3>
                        {progressData.worst_topics.length > 0 ? (
                            progressData.worst_topics.map((topic, index) => (
                                <div key={index} className="pt-button-wtopic">
                                    <span>{topic.topic}</span>
                                    <span className="topic-score">{topic.performance}%</span>
                                </div>
                            ))
                        ) : (
                            <p>No topic data available yet</p>
                        )}
                    </div>
                </div>
                
                <div className="pt-container-right">
                    <div className="pt-testHistory">
                        <h3>Test & Quiz History</h3>
                        {progressData.test_history.length > 0 ? (
                            progressData.test_history.map((test, index) => (
                                <button 
                                    key={index} 
                                    className={`pt-button ${test.type === 'Daily Quiz' ? 'quiz-button' : 'test-button'}`}
                                    onClick={() => handleTestClick(test.id)}
                                >
                                    <div className="test-button-content">
                                        <span className="test-name">{test.name}</span>
                                        <span className="test-date">{test.date}</span>
                                        <span className="test-score">{test.score}%</span>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <p>No test history available yet</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}