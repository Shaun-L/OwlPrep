import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../constants";
import LoadingSpinner from "../components/LoadingSpinner";
import "../styles/CheatsheetView.css";
import { toast } from "react-toastify";
import ReactMarkdown from "react-markdown";
import { TokenContext } from "../hooks/TokenContext";

export default function CheatsheetView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cheatsheet, setCheatsheet] = useState(null);
    const [error, setError] = useState(null);
    const { token } = useContext(TokenContext);

    useEffect(() => {
        // Fetch cheatsheet data
        const fetchCheatsheet = async () => {
            try {
                setLoading(true);
                
                if (!token) {
                    navigate("/login");
                    return;
                }
                
                // Make API call to get cheatsheet
                const response = await axios.get(
                    `${API_URL}/cheatsheet/${id}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                setCheatsheet(response.data.cheatsheet);
            } catch (error) {
                console.error("Error fetching cheatsheet:", error);
                setError(error.response?.data?.error || "Failed to load cheatsheet. Please try again.");
                toast.error("Failed to load cheatsheet");
            } finally {
                setLoading(false);
            }
        };

        fetchCheatsheet();
    }, [id, navigate, token]);

    const handleDownload = () => {
        if (!cheatsheet) return;
        
        // Open the download URL in a new tab
        window.open(`${API_URL}/cheatsheet/download/${id}?token=${token}`, '_blank');
    };

    const handleBack = () => {
        navigate(-1);
    };

    if (loading) {
        return (
            <div className="cheatsheet-view-container loading-container">
                <LoadingSpinner />
                <p>Loading cheatsheet...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="cheatsheet-view-container error-container">
                <h2>Error</h2>
                <p>{error}</p>
                <button className="button" onClick={handleBack}>Go Back</button>
            </div>
        );
    }

    if (!cheatsheet) {
        return (
            <div className="cheatsheet-view-container error-container">
                <h2>Cheatsheet Not Found</h2>
                <p>The requested cheatsheet could not be found or you don't have permission to view it.</p>
                <button className="button" onClick={handleBack}>Go Back</button>
            </div>
        );
    }

    return (
        <div className="cheatsheet-view-container">
            <div className="cheatsheet-header">
                <h1>{cheatsheet.name}</h1>
                <div className="cheatsheet-meta">
                    <p><strong>Created:</strong> {cheatsheet.created}</p>
                    <p><strong>Size:</strong> {cheatsheet.size_desc}</p>
                    <p><strong>Detail Level:</strong> {cheatsheet.hint_level_desc}</p>
                    <p><strong>Topics:</strong> {cheatsheet.topics.join(", ")}</p>
                    <p><strong>Hint Types:</strong> {cheatsheet.hint_types.join(", ")}</p>
                </div>
                <div className="cheatsheet-actions">
                    <button className="button primary-button" onClick={handleDownload}>
                        Download Cheatsheet
                    </button>
                    <button className="button" onClick={handleBack}>
                        Back
                    </button>
                </div>
            </div>
            
            <div className="cheatsheet-content">
                <ReactMarkdown>{cheatsheet.content}</ReactMarkdown>
            </div>
        </div>
    );
} 