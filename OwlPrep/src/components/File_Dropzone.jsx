import React, { useCallback, useMemo, useEffect, useState } from 'react';
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

function File_Dropzone() {
    const [files, setFiles] = useState([]);
    console.log(files)
    useEffect(()=>{
        console.log(files.forEach(file=>console.log(file.name, file.size)))
    },[files])

    

    const onDrop = useCallback(acceptedFiles => {
        setFiles(acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file)
          })));
      }, []);

      const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragAccept,
        isDragReject
      } = useDropzone({
        onDrop,
        accept: 'image/jpeg, image/png, application/pdf'
      });

  const style = useMemo(() => ({
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isDragActive,
    isDragReject,
    isDragAccept
  ]);

  function removeFile(key){
    console.log("berreo")
    setFiles(files.filter(file=>file.name!=key))

  }

  const thumbs = files.map(file => (
    <FileUploadComponent key={file.name}  filename={file.name} filesize={byteConverter(file.size)} removeFile={removeFile}/>
  ));

  

  return (
    <section>
      <div className='file-dropzone' {...getRootProps({style})}>
        <input {...getInputProps()} disabled={files.length != 0} />
        {files.length != 0 ? thumbs : <div>Drag and drop your files here.</div>}
        
      </div>

      <button className="generate-btn" type="button" disabled={files.length == 0}>Generate</button>
    </section>
  )
}

export default File_Dropzone;