import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const baseStyle = {
 
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

function DropzoneComponent(props) {

  const onDrop = useCallback(acceptedFiles => {
    props.setFiles(acceptedFiles.map(file => {console.log(file)
        return Object.assign(file, {
      preview: URL.createObjectURL(file)
    })}));
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    onDrop,
    accept: 'image/jpeg, image/png',
    multiple: false
  });

  const style = useMemo(() => ({
    ...baseStyle,
    ...(isDragActive ? activeStyle : {}),
    ...(isDragAccept ? acceptStyle : {}),
    ...(isDragReject ? rejectStyle : {})
  }), [
    isDragActive,
    isDragReject,
    isDragAccept
  ]);


  // clean up
 

  return (
    <section>
      <div className='file-dropzone profile-upload' {...getRootProps({style})}>
        <input {...getInputProps()} onChange={props.onFileChange}/>
        <div>Drag and drop your images here.</div>
      </div>
      <aside>
      
      </aside>
    </section>
  )
}

export default DropzoneComponent;