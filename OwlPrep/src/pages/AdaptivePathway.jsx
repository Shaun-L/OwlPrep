import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { TokenContext } from '../hooks/TokenContext';
import { API_URL } from '../constants';
import { TailSpin } from 'react-loader-spinner';
import axios from 'axios';

const AdaptivePathway = () => {
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]);
    const [userTopics, setUserTopics] = useState([]);
    const [selectedTopics, setSelectedTopics] = useState([]);
    const [creatingSession, setCreatingSession] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    // Fetch existing sessions and user topics
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch user topics
                const userDataResponse = await axios.get(`${API_URL}/users`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (userDataResponse.data.topics) {
                    setUserTopics(userDataResponse.data.topics.map(topic => topic.topic));
                }
                
                // Fetch existing pathway sessions
                const sessionsResponse = await axios.get(`${API_URL}/adaptive-pathway/list`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                setSessions(sessionsResponse.data.sessions || []);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('An error occurred while fetching your data. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchData();
    }, [token]);

    // Handle topic selection
    const handleTopicChange = (topic) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter(t => t !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };

    // Start a new pathway session
    const startNewSession = async () => {
        if (selectedTopics.length === 0) {
            setError('Please select at least one topic.');
            return;
        }
        
        setCreatingSession(true);
        setError(null);
        
        try {
            const response = await axios.post(`${API_URL}/adaptive-pathway/start`, 
                { topics: selectedTopics },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            // Navigate to the session page
            navigate(`/adaptive-pathway/${response.data.session_id}`);
        } catch (err) {
            console.error('Error creating session:', err);
            setError(err.response?.data?.error || 'An error occurred while creating your session.');
            setCreatingSession(false);
        }
    };

    // Format date string
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            // If it's not a standard date format, use as is (might be already formatted)
            return dateStr;
        }
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    // Calculate average mastery for a session
    const calculateAverageMastery = (masteryObj) => {
        if (!masteryObj || Object.keys(masteryObj).length === 0) return 0;
        
        const total = Object.values(masteryObj).reduce((sum, val) => sum + val, 0);
        return Math.round(total / Object.keys(masteryObj).length);
    };

    // Render sessions list
    const renderSessions = () => {
        if (sessions.length === 0) {
            return (
                <div className="no-sessions-message">
                    <p>You don't have any active learning pathways. Start a new one now!</p>
                </div>
            );
        }
        
        return (
            <div className="pathway-sessions-grid">
                {sessions.map(session => (
                    <div 
                        key={session.id} 
                        className="pathway-session-card"
                        onClick={() => navigate(`/adaptive-pathway/${session.id}`)}
                    >
                        <div className="session-header">
                            <h3>Learning Pathway {session.id.substring(0, 6)}...</h3>
                            <span className={`status-badge ${session.status}`}>
                                {session.status === 'active' ? 'In Progress' : 'Completed'}
                            </span>
                        </div>
                        
                        <div className="session-progress">
                            <div className="mastery-display">
                                <div className="mastery-ring">
                                    <svg width="80" height="80" viewBox="0 0 80 80">
                                        <circle 
                                            className="mastery-ring-bg" 
                                            cx="40" cy="40" r="35" 
                                            fill="none" 
                                            stroke="#eee" 
                                            strokeWidth="8"
                                        />
                                        <circle 
                                            className="mastery-ring-progress" 
                                            cx="40" cy="40" r="35" 
                                            fill="none" 
                                            stroke="#90C7C1" 
                                            strokeWidth="8"
                                            strokeDasharray={2 * Math.PI * 35}
                                            strokeDashoffset={2 * Math.PI * 35 * (1 - calculateAverageMastery(session.topic_mastery) / 100)}
                                            strokeLinecap="round"
                                        />
                                        <text 
                                            x="40" y="45" 
                                            textAnchor="middle" 
                                            fontSize="18" 
                                            fill="var(--primary-text-color)" 
                                            fontWeight="bold"
                                        >
                                            {calculateAverageMastery(session.topic_mastery)}%
                                        </text>
                                    </svg>
                                </div>
                                <p>Average Mastery</p>
                            </div>
                            
                            <div className="session-details">
                                <div className="detail-item">
                                    <span className="label">Topics:</span>
                                    <span className="value">{session.topics.length}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Rounds:</span>
                                    <span className="value">{session.total_rounds}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="label">Last Updated:</span>
                                    <span className="value">{formatDate(session.last_updated)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="topics-preview">
                            {session.topics.slice(0, 3).map(topic => (
                                <span key={topic} className="topic-chip">{topic}</span>
                            ))}
                            {session.topics.length > 3 && 
                                <span className="topic-chip more">+{session.topics.length - 3} more</span>
                            }
                        </div>
                        
                        <button className="continue-button">
                            {session.status === 'active' ? 'Continue Learning' : 'View Results'}
                        </button>
                    </div>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="adaptive-pathway-container" style={{marginTop: "2rem", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center", maxWidth: "1000px"}}>
                <div className="loading-spinner" >
                    
                    
                </div>
                <p>Loading your learning pathways...</p>
            </div>
        );
    }

    return (
        <div className="adaptive-pathway-container">
            <h1>Adaptive Learning Pathway</h1>
            <p className="pathway-description">
                Master topics through personalized learning that adapts to your performance.
                Complete rounds of questions to increase your mastery level in each topic.
            </p>
            
            <div className="pathway-content">
                <div className="existing-pathways">
                    <h2>Your Learning Pathways</h2>
                    {renderSessions()}
                </div>
                
                <div className="new-pathway-form">
                    <h2>Start New Learning Pathway</h2>
                    
                    {error && <p className="error-message">{error}</p>}
                    
                    <div className="topic-selection">
                        <h3>Select Topics to Master</h3>
                        {userTopics.length === 0 ? (
                            <p className="no-topics-message">
                                You need to upload study materials first to create topics.
                            </p>
                        ) : (
                            <div className="topics-grid">
                                {userTopics.map(topic => (
                                    <div 
                                        key={topic}
                                        className={`topic-checkbox ${selectedTopics.includes(topic) ? 'selected' : ''}`}
                                        onClick={() => handleTopicChange(topic)}
                                    >
                                        <input
                                            type="checkbox"
                                            id={`topic-${topic}`}
                                            checked={selectedTopics.includes(topic)}
                                            onChange={() => {}} // Handled by the div onClick
                                        />
                                        <label htmlFor={`topic-${topic}`}>{topic}</label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    <button 
                        className="start-pathway-button"
                        onClick={startNewSession}
                        disabled={creatingSession || selectedTopics.length === 0}
                    >
                        {creatingSession ? (
                            <>
                                <TailSpin
                                    visible={true}
                                    height="20"
                                    width="20"
                                    color="#fff"
                                    ariaLabel="tail-spin-loading"
                                />
                                Creating...
                            </>
                        ) : 'Start Learning Pathway'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdaptivePathway; 