import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import StudyItemContainer from "../components/StudyItemContainer";
import { FaCaretLeft } from "react-icons/fa";
import { FaCaretRight } from "react-icons/fa";
import { RiImageEditLine } from "react-icons/ri";
import AvatarEditor from 'react-avatar-editor'
import Dropzone from 'react-dropzone'
import DropzoneComponent from "../components/Dropzone";
import axios from 'axios';

export default function Profile(){
    const {username} = useParams()
    const [tests, setTests] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [image, setImage] = useState("http://127.0.0.1:5000/images/default-profile.jpg")
    const [previewImage, setPreviewImage] = useState("")
    const [files, setFiles] = useState([])
    const avatarEditor = useRef(null)
 
    const onFileChange = (e)=>{
        const file = e.target.files[0]
        const reader = new FileReader()

        if(file){
            reader.readAsDataURL(file)
            reader.addEventListener('load', ()=>{
                setPreviewImage(reader.result)
            })
            setFiles(Array.from(e.target.files))
        }
    }

    const handleImageUpload = async ()=>{
        console.log(files)
        if (!previewImage) {
            alert('Please select a file first!');
            return;
          }


          avatarEditor.current.getImageScaledToCanvas().toBlob(blob=>{
            const croppedImage = new File([blob], files[0].name, { type: blob.type });

      // Prepare FormData
            const formData = new FormData();
            formData.append('file', croppedImage); // Key name 'file' matches Flask's route handler

      // Upload the image using Axios
            axios.post('http://127.0.0.1:5000/images', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }, method: "POST",
            })
            .then(response => {
                alert(response.data.message); // Show success message from Flask
            })
            .catch(error => {
                console.error('Error uploading the image:', error);
                alert('Failed to upload the image!');
          })
      
          
    })}

    

    useEffect(()=>{
        const getData = async ()=>{
            const res = await fetch("http://127.0.0.1:5000/tests?creator=Freddy")
            const data = await res.json()
            console.log(data)
            console.log(Math.floor(data.tests.length / 9), data.tests.length % 9)
            let newNumberOfPages = Math.floor(data.tests.length / 9)
            newNumberOfPages += (data.tests.length % 9 != 0)? 1 : 0
            console.log(newNumberOfPages)
            setNumberOfPages(newNumberOfPages)
            setTests(data.tests)
        }
        getData()
    }, [username])

    return (<>
    <div className={"modal " + (showModal && "showModal")}>
        <div>
            <p>Upload File</p>
            {previewImage == "" ? <DropzoneComponent onFileChange={onFileChange} files={files} setFiles={setFiles} /> : <AvatarEditor ref={avatarEditor} image={previewImage} width={150} height={150} border={10} scale={1} borderRadius={5}/>}
            <button type="button" onClick={handleImageUpload}>Save Image</button>
        </div>
        
        
    </div>
    <div className="profileHeaderContainer">
        <div className="changeImageContainer" onClick={()=>setShowModal(true)}>
            <RiImageEditLine/>
            <img src="http://127.0.0.1:5000/images/default-profile.jpg"></img>
            </div>
        <h1>{username}</h1>
    </div>

    <button className="profileItemBtn">Practice tests</button>

    <div id="itemsContainer">
                {
                    tests.slice(currentPage*9-9, currentPage*9).map((item)=><StudyItemContainer title={item.name} type={item.type} creator={item.creator} key={item.id} id={item.id}/>)
                }
    </div>

    <div className="flex itemNavigationContainer">
        <button className="itemPreviousBtn button" type="button" onClick={()=>{
            if(currentPage > 1){setCurrentPage(currentPage-1)}}}><FaCaretLeft/></button>
        {
            [...Array(numberOfPages).keys()].map(i => <button onClick={()=>setCurrentPage(i+1)} className={"pageBtn " + (currentPage == i+1 && "activePageBtn")}>{i + 1}</button>)
        }
        <button className="itemPreviousBtn button" type="button" onClick={()=>{
            if(currentPage < numberOfPages){setCurrentPage(currentPage+1)}}}><FaCaretRight/></button>
    </div>
    
    </>)
}