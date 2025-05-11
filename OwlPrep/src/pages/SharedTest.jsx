import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaShare, FaCopy, FaPlay, FaArrowLeft } from "react-icons/fa";
import { TokenContext } from "../hooks/TokenContext";

function SharedTest() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cloning, setCloning] = useState(false);
  const navigate = useNavigate();
  const { token } = useContext(TokenContext);
  const API_URL = "http://127.0.0.1:5000";

  useEffect(() => {
    // Fetch the shared test data
    const fetchTest = async () => {
      try {
        // Use the regular tests endpoint instead of the share endpoint
        const response = await axios.get(`${API_URL}/tests?id=${testId}`);
        if (response.data && response.data.test) {
          setTest({
            id: testId,
            title: response.data.test.name || "Shared Test",
            description: response.data.test.description || "",
            type: response.data.test.type || "Quiz",
            questions: response.data.test.questions || [],
            creator: response.data.creator?.username || "Unknown",
            difficulty: response.data.test.difficulty || "Medium",
            created_at: response.data.test.created || new Date().toLocaleDateString()
          });
        } else {
          throw new Error("Invalid test data received");
        }
      } catch (err) {
        console.error("Error fetching shared test:", err);
        setError("Test not found or no longer available");
      } finally {
        setLoading(false);
      }
    };

    if (testId) {
      fetchTest();
    }
  }, [testId]);

  const handleClone = async () => {
    if (!token) {
      navigate("/login", { state: { returnPath: `/shared-test/${testId}` } });
      return;
    }

    setCloning(true);
    try {
      const response = await axios.post(
        `${API_URL}/tests/${testId}/clone`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.id) {
        // Show success message and redirect to the cloned test
        alert("Test cloned successfully!");
        navigate("/");
      }
    } catch (err) {
      console.error("Error cloning test:", err);
      setError("Failed to clone test. Please try again.");
    } finally {
      setCloning(false);
    }
  };

  const handleTakeTest = () => {
    // Navigate to the test page directly
    navigate(`/tests/${testId}`);
  };

  const handleGoBack = () => {
    navigate("/share-test");
  };

  if (loading) {
    return (
      <div className="shared-test-container">
        <div className="shared-test-loading">Loading test...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-test-container">
        <div className="shared-test-error-card">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleGoBack} className="shared-test-back-button">
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // Make sure test exists and has necessary properties
  if (!test) {
    return (
      <div className="shared-test-container">
        <div className="shared-test-error-card">
          <h2>Error</h2>
          <p>Test data could not be loaded properly</p>
          <button onClick={handleGoBack} className="shared-test-back-button">
            <FaArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="shared-test-container">
      <div className="shared-test-card">
        <div className="shared-test-header">
          <button onClick={handleGoBack} className="shared-test-back-button">
            <FaArrowLeft />
          </button>
          <h1>Shared Test</h1>
          <FaShare size={24} className="share-icon" />
        </div>

        <div className="shared-test-details">
          <h2>{test.title}</h2>
          <p className="shared-test-description">{test.description}</p>
          
          <div className="shared-test-info">
            <p><strong>Type:</strong> {test.type}</p>
            <p><strong>Questions:</strong> {Array.isArray(test.questions) ? test.questions.length : 
              (typeof test.questions === 'object' ? Object.keys(test.questions).length : 0)}</p>
            <p><strong>Difficulty:</strong> {test.difficulty}</p>
            <p><strong>Created by:</strong> {test.creator}</p>
          </div>
        </div>

        <div className="shared-test-actions">
          <button 
            onClick={handleTakeTest} 
            className="shared-test-take-button"
          >
            <FaPlay /> Take Test
          </button>
          
          <button 
            onClick={handleClone} 
            className="shared-test-clone-button"
            disabled={cloning}
          >
            <FaCopy /> {cloning ? "Cloning..." : "Clone to My Tests"}
          </button>
        </div>

        <div className="shared-test-preview">
          <h3>Preview:</h3>
          <div className="shared-test-questions-preview">
            {Array.isArray(test.questions) ? (
              test.questions.slice(0, 2).map((question, index) => (
                <div key={index} className="shared-test-question-preview">
                  <p><strong>Q{index + 1}:</strong> {question.question}</p>
                  <p className="shared-test-question-type">
                    Type: {question.type}
                  </p>
                </div>
              ))
            ) : typeof test.questions === 'object' ? (
              Object.keys(test.questions).slice(0, 2).map((key, index) => (
                <div key={key} className="shared-test-question-preview">
                  <p><strong>Q{index + 1}:</strong> {test.questions[key].question}</p>
                  <p className="shared-test-question-type">
                    Type: {test.questions[key].type}
                  </p>
                </div>
              ))
            ) : (
              <p>No questions available for preview</p>
            )}
            
            {Array.isArray(test.questions) ? (
              test.questions.length > 2 && (
                <p className="shared-test-more">
                  + {test.questions.length - 2} more questions
                </p>
              )
            ) : typeof test.questions === 'object' && Object.keys(test.questions).length > 2 && (
              <p className="shared-test-more">
                + {Object.keys(test.questions).length - 2} more questions
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SharedTest; 