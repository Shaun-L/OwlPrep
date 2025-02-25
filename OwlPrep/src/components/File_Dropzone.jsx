
import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import FileUploadComponent from './FileUploadComponent';
import { byteConverter } from '../utils/byteconverter';
import { TailSpin } from 'react-loader-spinner'

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

  



function File_Dropzone({submitFunc, setTopics, setUploadedFiles}) {
    const [files, setFiles] = useState([]);

    const first = useRef(false)

    const handleUpload = async () => {
      setUploadStatus("")
      const formData = new FormData();
      formData.append("file", files[0]); // Only one file is handled
  
      setLoading(true); // Start loading state
  
  
      try {
          const response = await fetch("http://127.0.0.1:5000/upload", {
              method: "POST",
              body: formData,
          });
  
  
          const data = await response.json();
  
  
          if (response.ok) {
              setUploadStatus(`File uploaded successfully!`);
              console.log(data.topics)
              const fileToTopics = {}
              const topics = Object.keys(data.topics)
              for(let i = 0; i < topics.length; i++){
                const correspondingFiles = data.topics[topics[i]].files
                console.log(correspondingFiles.length)
                for(let j = 0; j < correspondingFiles.length; j++){
                  const ogFileName = correspondingFiles[j].replaceAll("_", " ")
                  if(fileToTopics.hasOwnProperty(ogFileName)){
                    fileToTopics[ogFileName].push(topics[i])
                  }else{
                    fileToTopics[ogFileName] = [topics[i]]
                  }
                }
              }

              console.log(fileToTopics)
              setUploadedFiles(files.map(file=>{ return {name: file.name, size:file.size, topics: fileToTopics[file.name], keep: true}}))
              console.log(Object.keys(data.topics))
              setTopics(Object.keys(data.topics).map((topic)=>{ 
                return {name: topic, keep: true, files: data.topics[topic].files} }))
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

    console.log(files)
    useEffect(()=>{
      // Once files have been uploaded 
      
        
    },[files])

    const [uploadStatus, setUploadStatus] = useState("");
    const [loading, setLoading] = useState(false);
  
    function removeFile(key){
      console.log("berreo")
      setUploadStatus(false)
      setFiles(files.filter(file=>file.name!=key))
    }


    const onDrop = useCallback(acceptedFiles => {
        setFiles(oldFiles=>([...oldFiles,...acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
          })).filter((file=>!oldFiles.some((oldFile) => oldFile.name === file.name && oldFile.size === file.size)))]));
        setUploadStatus("");
          // Send files to backend to extract topics
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
  
    

    const thumbs = files.map(file => {
      console.log(files)
      return <FileUploadComponent key={file.name}  filename={file.name} filesize={byteConverter(file.size)} removeFile={removeFile}/>
    });
  
      return (
      <section>
        <div className='file-dropzone' {...getRootProps({baseStyle})}>
          <input {...getInputProps()}  />
          {files.length != 0 && !loading ? thumbs : files.length == 0  ? <div>Drag and drop your files here.</div> : ""}
          {loading && (
                  <div style={{ marginTop: "80px", marginLeft: "5px" }}>
                      <TailSpin   visible={true} height="40" width="40" color={getComputedStyle(root).getPropertyValue('--secondary-text-color').trim()} ariaLabel="tail-spin-loading" radius="1" wrapperStyle={{}} wrapperClass="loader" />
                      
                  </div>
            )}
            
        </div>
        {uploadStatus && <p>{uploadStatus}</p>}
        <button type='button' onClick={handleUpload} disabled={files.length == 0} className='generate-btn'>Extract Topics</button>
  
      </section>
    )


  }

  
    


export default File_Dropzone;
