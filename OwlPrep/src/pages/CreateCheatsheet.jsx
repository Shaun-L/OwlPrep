import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseUtils";
import { collection, addDoc } from "firebase/firestore";
import FileUploadedComponent from "../components/FileUploadedComponent";
import { byteConverter } from "../utils/byteconverter";
import { toast } from "react-toastify";
import axios from "axios";
import { API_URL } from "../constants";
import LoadingSpinner from "../components/LoadingSpinner";
import { TokenContext } from "../hooks/TokenContext";

export default function CreateCheatsheet({ topics, uploadedFiles, changeUploadedFiles, changeTopics, handleToggleFile }) {
    const [cheatsheetName, setCheatsheetName] = useState("");
    const [hintLevel, setHintLevel] = useState(1); // 0=Easy, 1=Medium, 2=Hard
    const [size, setSize] = useState(1); // 0=Small, 1=Medium, 2=Large
    const [definitionsSelected, setDefinitionsSelected] = useState(true);
    const [examplesSelected, setExamplesSelected] = useState(true);
    const [bulletsSelected, setBulletsSelected] = useState(true);
    const [formError, setFormError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCheatsheet, setGeneratedCheatsheet] = useState(null);
    
    const { token } = useContext(TokenContext);
    const navigate = useNavigate();

    useEffect(() => {
        setFormError(false);
    }, [uploadedFiles, topics, definitionsSelected, examplesSelected, bulletsSelected, size, hintLevel]);

    async function generateCheatsheet() {
        // Validation checks
        if (!definitionsSelected && !examplesSelected && !bulletsSelected) {
            setFormError(true);
            setErrorMsg("Must select at least one hint type");
            return;
        } else if (uploadedFiles.length === 0) {
            setErrorMsg("Need to upload Files");
            setFormError(true);
            return;
        } else if (cheatsheetName === "") {
            setErrorMsg("Cheatsheet requires a name");
            setFormError(true);
            return;
        }

        let selectedTopics = [];
        for (let i = 0; i < topics.length; i++) {
            if (topics[i].keep) {
                selectedTopics.push(topics[i].name);
            }
        }

        if (selectedTopics.length === 0) {
            setErrorMsg("Select at least one topic from the topic bank");
            setFormError(true);
            return;
        }

        // Collect hint types
        const hintTypes = [];
        if (definitionsSelected) hintTypes.push("Definitions");
        if (examplesSelected) hintTypes.push("Examples");
        if (bulletsSelected) hintTypes.push("Bullet points from slides");

        // Prepare data for API call
        const cheatsheetData = {
            name: cheatsheetName,
            topics: selectedTopics,
            hint_level: hintLevel,
            size: size,
            hint_types: hintTypes
        };

        try {
            setIsGenerating(true);
            
            // Make API call to generate cheatsheet
            const response = await axios.post(
                `${API_URL}/cheatsheet/generate`,
                cheatsheetData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Handle successful response
            setGeneratedCheatsheet(response.data.cheatsheet);
            toast.success("Cheatsheet generated successfully!");
            
            // Navigate to the cheatsheet view page
            navigate(`/cheatsheet/${response.data.cheatsheet_id}`);
            
        } catch (error) {
            console.error("Error generating cheatsheet:", error);
            setFormError(true);
            setErrorMsg(error.response?.data?.error || "Failed to generate cheatsheet. Please try again.");
            toast.error("Failed to generate cheatsheet");
        } finally {
            setIsGenerating(false);
        }
    }

    function downloadCheatsheet() {
        if (!generatedCheatsheet) return;
        
        // Open the download URL in a new tab
        window.open(`${API_URL}/cheatsheet/download/${generatedCheatsheet.id}?token=${token}`, '_blank');
    }

    // Render file selectors for uploaded files
    const fileSelectors = uploadedFiles.map(file => {
        return (
            <FileUploadedComponent 
                key={file.name} 
                filename={file.name} 
                filesize={byteConverter(file.size)} 
                handleToggleFile={handleToggleFile} 
                keep={file.keep} 
            />
        );
    });

    return (
        <>
            <div id="createTestPageContainer">
                <div>
                    <h1>Generate a Cheatsheet</h1>
                    <p>Choose or upload materials to generate a cheatsheet designed for you</p>
                </div>
                
                {isGenerating ? (
                    <div className="loading-container">
                        <LoadingSpinner />
                        <p>Generating your cheatsheet... This may take a minute or two.</p>
                    </div>
                ) : (
                    <>
                        <form id="TestForm">
                            <label className="form-heading testNameInput">
                                <input 
                                    type="text" 
                                    value={cheatsheetName} 
                                    onChange={(e) => setCheatsheetName(e.target.value)} 
                                    placeholder="Cheatsheet Name"
                                />
                            </label>

                            <div>
                                <label className="form-heading">
                                    Cheatsheet hint level:
                                </label>
                                <div className="testFormDifficultyContainer">
                                    <button type="button" onClick={() => setHintLevel(0)} className={hintLevel === 0 ? "diffSelected" : ""}>Easy</button>
                                    <button type="button" onClick={() => setHintLevel(1)} className={hintLevel === 1 ? "diffSelected" : ""}>Medium</button>
                                    <button type="button" onClick={() => setHintLevel(2)} className={hintLevel === 2 ? "diffSelected" : ""}>Hard</button>
                                </div>
                            </div>

                            <div>
                                <label className="form-heading">
                                    Cheatsheet Size:
                                </label>
                                <div className="testFormDifficultyContainer">
                                    <button type="button" onClick={() => setSize(0)} className={size === 0 ? "diffSelected" : ""}>3x5 Index Card</button>
                                    <button type="button" onClick={() => setSize(1)} className={size === 1 ? "diffSelected" : ""}>8.5x11 page 1 side</button>
                                    <button type="button" onClick={() => setSize(2)} className={size === 2 ? "diffSelected" : ""}>8.5x11 page 2 sides</button>
                                </div>
                            </div>

                            <div>
                                <p className="form-heading">Cheatsheet hint types:</p>
                                <label className="checkbox-label custom-checkbox">
                                    <input 
                                        type="checkbox" 
                                        onChange={() => setDefinitionsSelected(!definitionsSelected)} 
                                        name="hint-type" 
                                        value="Definitions" 
                                        checked={definitionsSelected}
                                    />
                                    <span className="custom-check"></span>
                                    Definitions
                                </label>
                                <label className="checkbox-label custom-checkbox">
                                    <input 
                                        type="checkbox" 
                                        onChange={() => setExamplesSelected(!examplesSelected)} 
                                        name="hint-type" 
                                        value="Examples" 
                                        checked={examplesSelected}
                                    />
                                    <span className="custom-check"></span>
                                    Examples
                                </label>
                                <label className="checkbox-label custom-checkbox">
                                    <input 
                                        type="checkbox" 
                                        onChange={() => setBulletsSelected(!bulletsSelected)} 
                                        name="hint-type" 
                                        value="Bullet points from slides" 
                                        checked={bulletsSelected}
                                    />
                                    <span className="custom-check"></span>
                                    Bullet points from slides
                                </label>
                            </div>

                            <div className="topics-in-grid">
                                <p className="form-heading">Topics:</p>
                                {topics.length !== 0 && <p>Click on topic to exclude from cheatsheet creation</p>}
                                <div className="topicsContainer">
                                    {topics.length === 0 ? (
                                        <div style={{ padding: "1rem" }}>Upload a file to see topic(s)</div>
                                    ) : (
                                        topics.map((val) => (
                                            <div 
                                                key={val.name} 
                                                className={`topic-item ${!val.keep ? "topicCrossed" : ""}`}
                                                onClick={() => changeTopics(val.name)}
                                            >
                                                {val.name}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                            
                            <div>
                                {formError && <p className="errorMsg">{errorMsg}</p>}
                                <button 
                                    className="formSubmitButton" 
                                    type="button" 
                                    onClick={generateCheatsheet}
                                >
                                    Generate Cheatsheet
                                </button>
                            </div>
                        </form>
                        
                        <div className="fileUploadedArea">
                            <div>
                                <h2>Files Uploaded</h2>
                                <p>Remove any files that you don't want to be part of the cheatsheet</p>
                            </div>
                            
                            <div className="filesUploadedContainer">
                                {uploadedFiles.length === 0 ? (
                                    <div>Uploaded files will show up here</div>
                                ) : (
                                    fileSelectors
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </>
    );
} 