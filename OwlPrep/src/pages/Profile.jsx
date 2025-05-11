
import React, { useEffect, useRef, useState, useContext } from "react";
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
import { TokenContext } from "../hooks/TokenContext";
import { getAuth } from "firebase/auth";
import LoadingImg from "../assets/loading.png"

export default function Profile({changeProfileImg, userLoggedInEmail}){
    const [loggedInUsername, setLoggedInUsername] = useState("")
    const {username} = useParams()
    const [tests, setTests] = useState([])
    const [currentPage, setCurrentPage] = useState(1)
    const [numberOfPages, setNumberOfPages] = useState(1)
    const [showModal, setShowModal] = useState(false)
    const [profileImage, setProfileImage] = useState(LoadingImg)
    const [previewImage, setPreviewImage] = useState("")
    const [files, setFiles] = useState([])
    const avatarEditor = useRef(null)
    const {token, setToken} = useContext(TokenContext)
    const [errorMsg, setErrorMsg] = useState("")
    const [editableProfileImage, setEditableProfileImage] = useState(false)
    const [creator, setCreator] = useState({})
 
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
    const uploadImage = async(formData)=>{
        const resp = await axios.post('http://127.0.0.1:5000/images', formData, {
            headers: { 'Content-Type': 'multipart/form-data', "Authorization": `Bearer ${token}`}, method: "POST",
        })
        console.log(resp)
        console.log(resp.data.user.img_url)
        console.log(resp.data)

        console.log(editableProfileImage, "Who")
        

        if(editableProfileImage){
            setCreator({...creator, img_url: resp.data.user.img_url})
        }

        setProfileImage(resp.data.user.img_url)
        changeProfileImg(resp.data.user.img_url)
        setPreviewImage("")



        

        setShowModal(false)
    }

    const handleImageUpload = async ()=>{
        console.log(files)
        if (!previewImage) {
            setErrorMsg('Please select a file first');
            return;
          }

          
            


          avatarEditor.current.getImageScaledToCanvas().toBlob(blob=>{
            const croppedImage = new File([blob], files[0].name, { type: blob.type });

      // Prepare FormData
            const formData = new FormData();
            formData.append('file', croppedImage); // Key name 'file' matches Flask's route handler

      // Upload the image using Axios
            uploadImage(formData)
          })



      
          
    }

    

    useEffect(()=>{
        const getData = async ()=>{
            const res = await fetch(`http://127.0.0.1:5000/tests?creator=${username}`)
            const data = await res.json()
            const userRes = await fetch(`http://127.0.0.1:5000/users?username=${username}`, {
                method: "GET", // Use the appropriate HTTP method
            })
            const loggedInUserRes =  await fetch('http://127.0.0.1:5000/users', {
                headers: { 'Content-Type': 'multipart/form-data', "Authorization": `Bearer ${token}`}, method: "GET",
            })
            const loggedInUser = await loggedInUserRes.json()
            console.log(loggedInUser)
            setLoggedInUsername(loggedInUser.username)
            const userData = await userRes.json()
            
            console.log(userData)
            console.log(data)
            console.log(Math.floor(data.tests.length / 9), data.tests.length % 9)
            let newNumberOfPages = Math.floor(data.tests.length / 9)
            newNumberOfPages += (data.tests.length % 9 != 0)? 1 : 0
            console.log(newNumberOfPages)
            
            setNumberOfPages(newNumberOfPages)
            setTests(data.tests)
            setCreator(data.creator)
            setProfileImage(userData.img_url)
            setEditableProfileImage(loggedInUser.username == username)
        }
    
        getData()
    }, [])

    const itemsMapped = tests.slice(currentPage*9-9, currentPage*9).map((item)=><StudyItemContainer title={item.name} type={item.type} creator={creator.username} key={item.id} id={item.id} profileImg={creator.img_url}/>)

    return (<>
    <div className={"modal " + (showModal && "showModal")}>
        <div className="profileImgUploadContainer">
            <h2>Upload File</h2>
            <p>Select a file to upload from your computer or device</p>
            {previewImage == "" ? <DropzoneComponent onFileChange={onFileChange} files={files} setFiles={setFiles} /> : <AvatarEditor ref={avatarEditor} image={previewImage} width={150} height={150} border={10} scale={1} borderRadius={5}/>}
            {errorMsg!== "" ? <p className="errorMsg" style={{marginTop: "10px", marginBottom: "0px"}}>{errorMsg}</p> : ""}
            
            <div>
            <button type="button" onClick={()=>{
                setShowModal(false)
                setPreviewImage("")
                setErrorMsg("")}}>Cancle</button>
            <button type="button" onClick={handleImageUpload}>Save Image</button>
            </div>
            
        </div>
        
        
    </div>
    <div className="profileHeaderContainer">
        <div className="changeImageContainer" onClick={()=>setShowModal(true)}>
            <img src={profileImage}></img>
            </div>
        <div className="profileImgSideContainer">
            <h1>{username}</h1>
            {editableProfileImage && <button className="editAvatarBtn" type="button" onClick={()=>setShowModal(true)}>Edit Avatar</button>}
        </div>
        

    </div>

    <button className="profileItemBtn">Practice tests</button>

    <div id="itemsContainer">
                {
                    itemsMapped.length == 0 ? <p className="homeLoadingContainer">No items available</p> : itemsMapped
                }
    </div>

    {
        itemsMapped.length !== 0 && 
    <div className="flex itemNavigationContainer">
        <button className="itemPreviousBtn button" type="button" onClick={loggedInUsername == username && (()=>{
            if(currentPage > 1){setCurrentPage(currentPage-1)}} )}><FaCaretLeft/></button>
        {
            [...Array(numberOfPages).keys()].map(i => <button onClick={()=>setCurrentPage(i+1)} className={"pageBtn " + (currentPage == i+1 && "activePageBtn")}>{i + 1}</button>)
        }
        <button className="itemPreviousBtn button" type="button" onClick={()=>{
            if(currentPage < numberOfPages){setCurrentPage(currentPage+1)}}}><FaCaretRight/></button>
    </div>}
    
    </>)
}


