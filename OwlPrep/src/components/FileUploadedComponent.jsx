import React from "react"
import { BsPaperclip } from "react-icons/bs";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoMdRemoveCircle } from "react-icons/io";
import { MdAddCircle } from "react-icons/md";

export default function FileUploadedComponent({filename, filesize, handleToggleFile, keep}){
    return (<>
    <div className={`file-upload-container ${!keep ? "fileNotSelected" : ""}`}>
        <div><BsPaperclip /> <span>{filename} {filesize}</span></div>
        <div>{keep ? <button onClick={(e)=>{e.stopPropagation()
            handleToggleFile(filename)}}><IoMdRemoveCircle/></button> : <button onClick={(e)=>{e.stopPropagation()
                handleToggleFile(filename)}}><MdAddCircle/></button>}</div>
    </div>
    </>)
}