import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

function File_Dropzone() {
    const [files, setFiles] = useState([]);
    const [uploadStatus, setUploadStatus] = useState('');

    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles);
    }, []);

    const handleUpload = async () => {
        try {
            const formData = new FormData();
            files.forEach(file => {
                formData.append('files', file);
            });

            const response = await fetch('http://localhost:3001/upload', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                setUploadStatus('Files uploaded successfully!');
                setFiles([]); // Clear files after successful upload
            }
        } catch (error) {
            setUploadStatus('Upload failed. Please try again.');
            console.error(error);
        }
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: 'application/pdf'
    });

    return (
        <div style={{
            border: '2px dashed #ccc',
            padding: '20px',
            textAlign: 'center',
            margin: '20px'
        }}>
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drop PDF files here, or click to select files</p>
            </div>
            
            {files.length > 0 && (
                <div>
                    <h4>Selected Files:</h4>
                    {files.map(file => (
                        <p key={file.name}>{file.name}</p>
                    ))}
                    <button 
                        onClick={handleUpload}
                        style={{
                            padding: '10px 20px',
                            margin: '10px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Upload Files
                    </button>
                </div>
            )}
            
            {uploadStatus && <p>{uploadStatus}</p>}
        </div>
    );
}

export default File_Dropzone;