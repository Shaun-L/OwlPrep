import React, { useEffect } from "react";
import { useState, useContext } from "react";
import File_Dropzone from "../components/File_Dropzone";
import { db } from "../firebaseUtils";
import { collection, addDoc } from "firebase/firestore";
import { redirect, useNavigate } from "react-router-dom";
import FileUploadComponent from "../components/FileUploadComponent";
import { byteConverter } from "../utils/byteconverter";
import sampleQuestionModal from "../components/SampleQuestionModal";
import SampleQuestionModal from "../components/SampleQuestionModal";
import SampleQuestionItem from "../components/SampleQuestionItem";
import FileUploadedComponent from "../components/FileUploadedComponent";
import { TokenContext } from "../hooks/TokenContext";
import axios from "axios";
import { API_URL } from "../constants";
import "../styles/Feedback.css";

export default function Feedback(){
    const [selectedOption, setSelectedOption] = useState('');
    const [feedbackContent, setFeedbackContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    const handleChange = (event) => {
        const value = event.target.value;
        setSelectedOption(value);
    };

    const handleContentChange = (event) => {
        setFeedbackContent(event.target.value);
    };

    const submitFeedback = async () => {
        // Validate input
        if (!selectedOption) {
            setErrorMessage('Please select a topic');
            return;
        }
        
        if (!feedbackContent.trim()) {
            setErrorMessage('Please provide feedback content');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');
        
        try {
            const response = await axios.post(
                `${API_URL}/feedback`,
                {
                    topic: selectedOption,
                    content: feedbackContent
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            setSubmitStatus('success');
            // Clear form after successful submission
            setSelectedOption('');
            setFeedbackContent('');
            
            // Show success message for 3 seconds then redirect
            setTimeout(() => {
                navigate('/');
            }, 3000);
            
        } catch (error) {
            console.error("Error submitting feedback:", error);
            setSubmitStatus('error');
            setErrorMessage(error.response?.data?.error || 'Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
    <>
    <div className="feedback-container">
            <h1>We Value Your Feedback</h1>
            <p>Your thoughts help us improve—share your experience with us!</p>

            {submitStatus === 'success' && (
                <div className="success-message">
                    Thank you for your feedback! We'll review it soon.
                </div>
            )}
            
            {submitStatus === 'error' && (
                <div className="error-message">
                    {errorMessage}
                </div>
            )}

            <form id="feedbackForm">
                <label htmlFor="selection">Choose a Topic:</label>
                <select 
                    id="selection" 
                    value={selectedOption} 
                    onChange={handleChange}
                    disabled={isSubmitting}
                >
                    <option value="" disabled>Select an option</option>
                    <option value="Test Creation">Test creation</option>
                    <option value="Cheat Sheet Creation">Cheat sheet creation</option>
                    <option value="Account Issue">Account issue</option>
                    <option value="Suggestion">Suggestion</option>
                    <option value="Something else">Something else</option>
                </select>

                <p>The more detail you provide, the better.</p>
                <textarea 
                    value={feedbackContent}
                    onChange={handleContentChange}
                    placeholder="Please describe your feedback in detail..."
                    disabled={isSubmitting}
                    rows={6}
                ></textarea>
                
                {errorMessage && !submitStatus && (
                    <div className="error-message">{errorMessage}</div>
                )}
                
                <button 
                    type="button" 
                    onClick={submitFeedback}
                    disabled={isSubmitting}
                    className="formSubmitButton"
                >
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                </button>
            </form>
        </div>
    </>)
    
}