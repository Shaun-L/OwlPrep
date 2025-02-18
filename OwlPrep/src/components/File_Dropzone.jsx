
import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import FileUploadComponent from './FileUploadComponent';
import { byteConverter } from '../utils/byteconverter';

const baseStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    borderWidth: 2,
    borderRadius: 2,
    borderColor: '#eeeeee',
    borderStyle: 'dashed',
    backgroundColor: '#fafafa',
    color: '#bdbdbd',
    transition: 'border .3s ease-in-out'
  };
  
  const activeStyle = {
    borderColor: '#2196f3'
  };
  
  const acceptStyle = {
    borderColor: '#00e676'
  };
  
  const rejectStyle = {
    borderColor: '#ff1744'
  };



function File_Dropzone({submitFunc, changeTopics}) {
    const [files, setFiles] = useState([]);

    const first = useRef(false)

    console.log(files)
    useEffect(()=>{
      // Once files have been uploaded 
      
        
    },[files])

    const [uploadStatus, setUploadStatus] = useState("");
    const [loading, setLoading] = useState(false);
  
    function removeFile(key){
      console.log("berreo")

      setFiles(files.filter(file=>file.name!=key))
    }


    const onDrop = useCallback(acceptedFiles => {
        setFiles(oldFiles=>([...oldFiles,...acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
          })).filter((file=>!oldFiles.some((oldFile) => oldFile.name === file.name && oldFile.size === file.size)))]));
        setUploadStatus("");
          // Send files to backend to extract topics

         changeTopics([{name: "Math", keep: true}, {name: "Physics", keep: true}])
      }, []);

      const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject
      } = useDropzone({
        onDrop,
        accept: 'image/jpeg, image/png, application/pdf',
        
      });
  
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



  const thumbs = files.map(file => {
    console.log(files)
    return <FileUploadComponent key={file.name}  filename={file.name} filesize={byteConverter(file.size)} removeFile={removeFile}/>
  });

    return (
    <section>
      <div className='file-dropzone' {...getRootProps({baseStyle})}>
        <input {...getInputProps()}  />
        {files.length != 0 ? thumbs : <div>Drag and drop your files here.</div>}
        {loading && (
                <div style={{ marginTop: "10px" }}>
                    <span className="spinner" style={{ marginRight: "10px" }}>⏳</span>
                    Processing file...
                </div>
          )}
          {uploadStatus && <p>{uploadStatus}</p>}
      </div>

      <button className="generate-btn" onClick={submitFunc}  type="button" disabled={files.length == 0}>Generate</button>
    </section>
  )
    
}

export default File_Dropzone;
