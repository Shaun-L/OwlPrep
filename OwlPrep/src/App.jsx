import { useState, useRef } from "react";
import { Routes, Route, Link } from "react-router-dom";
import File_Dropzone from "./components/File_Dropzone";  // Import your File_Dropzone component

import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Default from "./Layouts/Default";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword"; // Adding the ForgotPassword component
import Profile from "./pages/Profile";
import Page404 from "./pages/404";

import CreateTest from "./pages/CreateTest";
import "./App.css"; 
import { IoReturnUpBack } from "react-icons/io5";


function App() {
    const [loggedIn, setLoggedIn] = useState(true);
    const [showAccountDropdown, setShowAccountDropDown] = useState(false);
    const [darkTheme, setDarkTheme] = useState(false);
    const [topics,setTopics] = useState([{name: "fddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", keep: true, files: []} ])
    const [uploadedFiles, setUploadedFiles] = useState([])

    function changeDropdownView() {
        setShowAccountDropDown(!showAccountDropdown);
    }

    function logout() {
        setLoggedIn(false);
    }

    function logginUser() {
        setLoggedIn(true);
    }

    function closeDropdown() {
        setShowAccountDropDown(false);
    }

    function changeTheme() {
        if (darkTheme) {
        document.body.removeAttribute("data-theme");
        } else {
        document.body.setAttribute("data-theme", "dark");
        }
        setDarkTheme(!darkTheme);
    }

  function changeUploadedFiles(fileName){
    let removeFile = false
    console.log(uploadedFiles)
    let fileTopics = []
    for(let i = 0; i < uploadedFiles.length; i++){
      if(uploadedFiles[i].name == fileName && uploadedFiles[i].keep){
        removeFile = true;
        fileTopics = uploadedFiles[i].topics
        break;
      }else if(uploadedFiles[i].name == fileName){
        break
      }
    }
    
    setUploadedFiles(old=>old.map((file)=>{
        if(file.name != fileName){
            return file
        }else{
            console.log(file.keep)
            removeFile = file.keep
            return {...file, keep:!file.keep}
        }
    }))
  console.log(uploadedFiles)

  if(removeFile){
    const topicCount = {};
    uploadedFiles.forEach(file => {
      file.topics.forEach(topic => {
        
        if(!topicCount[topic] && file.keep && file.name !== fileName){
          topicCount[topic] = 1;
        }else if(!topicCount[topic]){
          topicCount[topic] = 0
        }else if(file.keep){
          console.log("Else", file.keep)
          topicCount[topic]++;
        }
        
      });
    });

    const updatedTopics = topics.map(topic => {
      const keepStatus = topicCount[topic.name] > 0;
      return { ...topic, keep: keepStatus };
    });
    setTopics(updatedTopics)
  }else{
    const topicCount = {};
    uploadedFiles.forEach(file => {
      file.topics.forEach(topic => {
        
        if(!topicCount[topic] && file.keep || file.name == fileName){
          topicCount[topic] = 1;
        }else if(!topicCount[topic]){
          topicCount[topic] = 0
        }else if(file.keep || file.name == fileName){
          console.log("Else", file.keep)
          topicCount[topic]++;
        }
        
      });
    });

    console.log(topicCount)

    const updatedTopics = topics.map(topic => {
      const keepStatus = topicCount[topic.name] > 0;
      return { ...topic, keep: keepStatus };
    });

    setTopics(updatedTopics)
  }


  
  }

  function changeTopics(topicName){
            console.log("Hello")
            let removeTopic = false
            const unkeptTopics = []

            for(let i = 0; i < topics.length; i++){
              if(topicName == topics[i].name){
                removeTopic = topics[i].keep;
                unkeptTopics.push(topics[i].name);
              }

              if(!topics[i].keep){
                unkeptTopics.push(topics[i].name)
              }
            }


            setTopics(old=>old.map((topic)=>{
                console.log(topic.name, topicName)
                if(topic.name != topicName){
                    return topic
                }else{
                    return {...topic, keep:!topic.keep}
                }
            }))
            console.log("Unkept files", unkeptTopics)
            if(removeTopic){
              const filesToRemove = []
              uploadedFiles.forEach(file=>{
                let removeFile = true;
                for(let i = 0; i < file.topics.length; i++){
                  if(unkeptTopics.includes(file.topics[i])){
                    continue;
                  }else{
                    removeFile = false
                    break
                  }
                }

                console.log("Log", removeFile)
                if(removeFile){
                  filesToRemove.push(file.name)
                }
              })

              setUploadedFiles(old=>old.map(file=>{
                if(filesToRemove.includes(file.name)){
                  return {...file, keep: false}
                }else{
                  return file
                }
              }))
            }else{
              const fileToAdd = []
              uploadedFiles.forEach(file=>{
                if(!file.keep && file.topics.includes(topicName)){
                  fileToAdd.push(file.name)
                }
              })

              setUploadedFiles((oldVal)=>oldVal.map((file)=>{
                  if(fileToAdd.includes(file.name)){
                    return {...file, keep: true}
                  }else{
                    return file
                  }
                })
              )
            }
    
}

  function selectThemeChange(themeName) {
    console.log(themeName);
    if (themeName === "light") {
      document.body.removeAttribute("data-theme");
      setDarkTheme(false);
    } else {
      document.body.setAttribute("data-theme", "dark");
      setDarkTheme(true);
    }
  }

  return (
    <>
    <Routes>
      <Route path="/" element={<Default logout={logout} setTopics={setTopics} topics={topics} setUploadedFiles={setUploadedFiles} loggedIn={loggedIn} closeDropdown={closeDropdown} showAccountDropdown={showAccountDropdown} theme={darkTheme} changeTheme={changeTheme} changeDropdownView={changeDropdownView}/>}>
        <Route index element={<Home></Home>}></Route>
        <Route path="/signup" element={<SignUp></SignUp>}></Route>
        <Route path="/login" element={<Login logginUser={logginUser}></Login>}></Route>
        <Route path="/forgot-password" element={<ForgotPassword></ForgotPassword>}></Route>
        <Route path="/settings" element={<Settings theme={darkTheme} selectThemeChange={selectThemeChange}/>}></Route>
        <Route path="/profile/:username" element={<Profile/>}></Route>
        <Route path="/create-test" element={<CreateTest topics={topics} uploadedFiles={uploadedFiles} handleToggleFile={changeUploadedFiles} changeTopics={changeTopics}/>}></Route>
        <Route path="*" element={<Page404/>}></Route>
      </Route>
    </Routes>
    </>
  );
}

export default App;
