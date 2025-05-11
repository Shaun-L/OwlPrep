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

export default function Feedback(){
    const [selectedOption, setSelectedOption] = useState('');

  const handleChange = (event) => {
    const value = event.target.value;
    setSelectedOption(value);
    onSelect(value);
  };

    return (
    <>
    <div>
            <h1>We Value Your Feedback</h1>
            <p>Your thoughts help us improve—share your experience with us!</p>

            <form id="feedbackForm">
                <label htmlFor="selection">Choose a Topic:</label>
                <select id="selection" value={selectedOption} onChange={handleChange}>
                    <option value="" disabled>Select an option</option>
                    
                    <option value={"Test Creation"}>Test creation</option>
                    <option value={"Cheat Sheet Creation"}>Cheat sheet creation</option>
                    <option value={"Account Issue"}>Account issue</option>
                    <option value={"Progress"}>Suggestion</option>
                    <option value={"Something else"}>Something else</option>
                    
                </select>

                <p>The more detail you provide, the better.</p>
                <textarea></textarea>
                <button type="button">Send</button>
            </form>
        </div>
    </>)
    
}