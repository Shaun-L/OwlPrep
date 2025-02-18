import React from "react"
import { BsPaperclip } from "react-icons/bs";
import { FaRegTrashAlt } from "react-icons/fa";

export default function FileUploadComponent({filename, filesize, removeFile}){
    return (<>
    <div className="file-upload-container">
        <div><BsPaperclip /> <span>{filename} {filesize}</span></div>
        <div><button onClick={(e)=>{e.stopPropagation()
            removeFile(filename)}}><FaRegTrashAlt/></button></div>
    </div>
    </>)
}