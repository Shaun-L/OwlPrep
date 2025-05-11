import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TokenContext } from "../hooks/TokenContext";
import { TailSpin } from "react-loader-spinner";

export default function DailyQuiz() {
    const [dailyQuiz, setDailyQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDailyQuiz = async () => {
            try {
                setLoading(true);
                setError("");
                
                const response = await fetch("http://127.0.0.1:5000/quiz/daily", {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || "Failed to fetch daily quiz");
                }
                
                console.log("Daily quiz data:", data);
                setDailyQuiz(data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching daily quiz:", error);
                setError(error.message);
                setLoading(false);
            }
        };
        
        fetchDailyQuiz();
    }, [token]);

    const startQuiz = () => {
        if (dailyQuiz && dailyQuiz.quiz_id) {
            console.log("Starting quiz with ID:", dailyQuiz.quiz_id);
            navigate(`/tests/${dailyQuiz.quiz_id}/1`);
        } else {
            setError("Quiz ID is missing. Please try refreshing the page.");
        }
    };

    if (loading) {
        return (
            <div className="daily-quiz-container">
                <div className="daily-quiz-loading">
                    <img 
                        src="/favicon.png" 
                        alt="OwlPrep Mascot" 
                        className="loading-mascot"
                        style={{ width: '120px', marginBottom: '20px' }}
                    />
                    <h2>Loading Your Daily Quiz</h2>
                    <p>We're preparing your personalized practice for today...</p>
                    <div className="spinner-container">
                        <TailSpin visible={true} height="60" width="60" color={getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()} ariaLabel="tail-spin-loading" radius="1" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="daily-quiz-container">
                <div className="daily-quiz-error">
                    <h2>Daily Quiz Not Available</h2>
                    <p>{error}</p>
                    <p>Please upload study materials to generate your daily quizzes.</p>
                    <button onClick={() => navigate("/")} className="formSubmitButton">
                        Back to Home
                    </button>
                </div>
            </div>
        );
    }

    // Debug output
    console.log("Daily quiz state:", dailyQuiz);

    // Safely access quiz data
    const quizData = dailyQuiz?.quiz || {};
    const quizQuestions = quizData?.questions || {};
    const questionCount = Object.keys(quizQuestions).length;
    const quizTopics = quizData?.topics || [];
    const quizTypes = quizData?.question_types || [];
    const quizId = dailyQuiz?.quiz_id;

    if (!quizId) {
        return (
            <div className="daily-quiz-container">
                <div className="daily-quiz-error">
                    <h2>Quiz ID Not Found</h2>
                    <p>There was an issue retrieving your daily quiz ID.</p>
                    <button onClick={() => window.location.reload()} className="formSubmitButton">
                        Refresh Page
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="daily-quiz-container">
            <div className="daily-quiz-header">
                <h1>{quizData.name || "Daily Quiz"}</h1>
                <p>{quizData.description || "Your personalized daily practice"}</p>
            </div>
            
            <div className="daily-quiz-info">
                <div className="daily-quiz-topics">
                    <h3>Topics</h3>
                    <div className="topics-list">
                        {quizTopics.length > 0 ? (
                            quizTopics.map((topic, index) => (
                                <div key={index} className="topic-item">
                                    {topic}
                                </div>
                            ))
                        ) : (
                            <p>No topics available</p>
                        )}
                    </div>
                </div>
                
                <div className="daily-quiz-details">
                    <div className="daily-quiz-detail-item">
                        <h4>Questions</h4>
                        <p>{questionCount} Questions</p>
                    </div>
                    
                    <div className="daily-quiz-detail-item">
                        <h4>Question Types</h4>
                        <p>{quizTypes.join(", ") || "Mixed Types"}</p>
                    </div>
                    
                    <div className="daily-quiz-detail-item">
                        <h4>Difficulty</h4>
                        <p>{quizData.difficulty || "Medium"}</p>
                    </div>
                </div>
            </div>
            
            <div className="daily-quiz-actions">
                <button 
                    onClick={startQuiz} 
                    className="formSubmitButton"
                    disabled={questionCount === 0}
                >
                    Start Quiz
                </button>
            </div>
        </div>
    );
} 