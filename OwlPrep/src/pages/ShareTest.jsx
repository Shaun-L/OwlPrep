import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShare } from "react-icons/fa";
import axios from "axios";

function ShareTest() {
  const [testCode, setTestCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const API_URL = "http://127.0.0.1:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!testCode.trim()) {
      setError("Please enter a test code");
      return;
    }
    
    setLoading(true);
    setError("");
    
    try {
      console.log("Attempting to access test with code:", testCode);
      
      // Use the regular tests endpoint instead of the share endpoint
      const response = await axios.get(`${API_URL}/tests?id=${testCode}`);
      
      if (response.status === 200 && response.data && response.data.test) {
        console.log("Test found successfully:", response.data);
        // Navigate to the shared test view
        navigate(`/shared-test/${testCode}`);
      } else {
        setError("Invalid test code or test not found");
      }
    } catch (err) {
      console.error("Error fetching shared test:", err);
      setError("Invalid test code or test not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="share-test-container">
      <div className="share-test-card">
        <h1>Access Shared Test</h1>
        <div className="share-icon">
          <FaShare size={40} />
        </div>
        
        <p className="share-test-description">
          Enter a test code to access a test shared by another user.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="share-test-input-group">
            <input
              type="text"
              value={testCode}
              onChange={(e) => setTestCode(e.target.value)}
              placeholder="Enter test code"
              className="share-test-input"
            />
            <button 
              type="submit" 
              className="share-test-button"
              disabled={loading}
            >
              {loading ? "Loading..." : "Access Test"}
            </button>
          </div>
          
          {error && <p className="share-test-error">{error}</p>}
        </form>
        
        <div className="share-test-info">
          <h3>How to share your tests:</h3>
          <ol>
            <li>Go to your tests in the home page</li>
            <li>Click on the "Share" button on any test</li>
            <li>Copy the test code and share it with others</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ShareTest; 