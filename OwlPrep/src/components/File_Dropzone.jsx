import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

function File_Dropzone() {
    const [files, setFiles] = useState([]);
    const [uploadStatus, setUploadStatus] = useState("");
    const [loading, setLoading] = useState(false);

    const onDrop = useCallback((acceptedFiles) => {
        setFiles(acceptedFiles);
        setUploadStatus(""); // Clear previous messages
    }, []);

    const handleUpload = async () => {
        if (files.length === 0) {
            setUploadStatus("No file selected.");
            return;
        }

        const formData = new FormData();
        formData.append("file", files[0]); // Only one file is handled

        setLoading(true); // Start loading state
        setUploadStatus("Processing file...");

        try {
            const response = await fetch("http://127.0.0.1:5000/upload", {
                method: "POST",
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                setUploadStatus(`File uploaded successfully! Processed topics: ${Object.keys(data.topics).join(", ")}`);
                setFiles([]); // Clear files after successful upload
            } else {
                setUploadStatus(data.error || "Upload failed. Please try again.");
            }
        } catch (error) {
            setUploadStatus("Upload failed. Please try again.");
            console.error(error);
        } finally {
            setLoading(false); // Stop loading state
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: "application/pdf",
        multiple: false, // Only accept a single file
    });

    return (
        <div
            style={{
                border: "2px dashed #ccc",
                padding: "20px",
                textAlign: "center",
                margin: "20px",
            }}
        >
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drop a PDF file here, or click to select one</p>
            </div>

            {files.length > 0 && (
                <div>
                    <h4>Selected File:</h4>
                    <p>{files[0].name}</p>
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        style={{
                            padding: "10px 20px",
                            margin: "10px",
                            backgroundColor: loading ? "#aaa" : "#4CAF50",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: loading ? "not-allowed" : "pointer",
                        }}
                    >
                        {loading ? "Processing..." : "Upload File"}
                    </button>
                </div>
            )}

            {loading && (
                <div style={{ marginTop: "10px" }}>
                    <span className="spinner" style={{ marginRight: "10px" }}>⏳</span>
                    Processing file...
                </div>
            )}

            {uploadStatus && <p>{uploadStatus}</p>}
        </div>
    );
}

export default File_Dropzone;
