import { useState, useRef, useEffect, useContext } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { Link, useParams, useLocation  } from "react-router-dom";

import File_Dropzone from "./components/File_Dropzone";  // Import your File_Dropzone component
import { MdOutlineLightMode } from "react-icons/md";
import { MdOutlineNightlight } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";
import { GiOwl } from "react-icons/gi";

import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Default from "./Layouts/Default";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword"; // Adding the ForgotPassword component
import Profile from "./pages/Profile";
import Page404 from "./pages/404";
import TestResults from "./pages/TestResults";

import CreateTest from "./pages/CreateTest";
import "./App.css"; 
import { IoReturnUpBack } from "react-icons/io5";
import Test from "./pages/Test";
import { query } from "firebase/firestore";
import Progress from "./pages/Progess";
import Saves from "./pages/Saves";
import { TokenContext } from "./hooks/TokenContext";
import { getAuth, onAuthStateChanged } from "firebase/auth"
import Question from "./pages/Question";
import LoadingImg from "./assets/loading.png"
import ClearSessionOnNavigate from "./components/ClearSession";
import Feedback from "./pages/Feedback";
import Secure from "./components/Secure";
import SubmittedTests from "./pages/SubmittedTests";
import SubmittedTestReview from "./pages/SubmittedTestReview";

function App() {
  const dropdown = useRef(null)
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [username, setUsername] = useState([]);
  const [profileImg, setProfileImg] = useState(LoadingImg); // State for user name
  const checkboxRef = useRef(null);
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [email, setEmail] = useState("")
  const [loggedIn, setLoggedIn] = useState(true);
  const [showAccountDropdown, setShowAccountDropDown] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);
  const [topics,setTopics] = useState([])
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [saves, setSaves] = useState([])
  const [alertText, setAlertText] = useState("Nice")
  const [showAlert, setShowAlert] = useState(false)

  const {token, setToken} = useContext(TokenContext)
  const { test_id } = useParams();

  const location = useLocation();

  useEffect(() => {
    console.log("Global", location.pathname)
    if (!location.pathname.startsWith('/tests/')) {
      console.log("OwlPrep")
      sessionStorage.clear()
    }
  }, [location.pathname]);

  useEffect(() => {
    if (showAlert) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [showAlert]);


  useEffect(()=>{
    const getLoggedInUser = async()=>{
      const response = await fetch("http://127.0.0.1:5000/users", {
        method: "GET", // Use the appropriate HTTP method
        headers: {
            "Authorization": `Bearer ${token}`, // Attach the Bearer token
        },
    });

    // Parse and handle the response
    if (response.ok) {
        const data = await response.json();
        setProfileImg(data.img_url);
        setUsername(data.username)
        setEmail(data.email)
        setSaves(data?.saves ?? [])
        setDarkTheme(data?.dark_theme)
        if(data?.dark_theme){
          document.body.setAttribute("data-theme", "dark");
        }
        console.log("Response Data:", data);
    } else {
        console.error("Error Response:", response.status, response.statusText);
    }
    }

    getLoggedInUser()
  }, [token])


  function changeDropdownView() {
    setShowAccountDropDown(!showAccountDropdown);
  }

  function logout() {
    const auth = getAuth();
    auth.signOut()
        .then(() => {

            setToken(null); // Clear the token if stored locally
            navigate("/")
        })
        .catch((error) => {
            console.error("Error logging out user:", error);
        });
  }

  function logginUser() {
    setLoggedIn(true);
  }

  function closeDropdown() {
    setShowAccountDropDown(false);
  }

  async function changeTheme() {
    if (darkTheme) {
      document.body.removeAttribute("data-theme");
    } else {
      document.body.setAttribute("data-theme", "dark");
    }
    setDarkTheme(!darkTheme);

    const res = await fetch(" http://127.0.0.1:5000/users", {
      method: "PUT",
      headers: {
          'content-type': 'application/json',
          "Authorization": `Bearer ${token}`, // Attach the Bearer token
      },
      body: JSON.stringify({dark_theme: !darkTheme})
  })

  const data = await res.json()
  console.log(data)

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
              console.log("Uploaded Files:", uploadedFiles)
              uploadedFiles.forEach(file=>{
                console.log(file.topics)
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

  async function selectThemeChange(themeName) {
    console.log(themeName);
    if (themeName === "light") {
      document.body.removeAttribute("data-theme");
      setDarkTheme(false);
    } else {
      document.body.setAttribute("data-theme", "dark");
      setDarkTheme(true);
    }

    const res = await fetch(" http://127.0.0.1:5000/users", {
            method: "PUT",
            headers: {
                'content-type': 'application/json',
                "Authorization": `Bearer ${token}`, // Attach the Bearer token
            },
            body: JSON.stringify({"dark_theme": themeName == "light" ? false : true})
        })

        const data = await res.json()
        console.log(data)
  }

  



  document.addEventListener("mousedown", (e)=>{

    if(showAccountDropdown && !dropdown.current.contains(e.target)){
      closeDropdown()
    }
  
   })

  return (
    <>

    <p className={showAlert ? "animate alert" : "alert"}>{alertText}</p>

    <header>
    
    <div id="Logo">
    
      <RxHamburgerMenu className="mobileNavMenu" onClick={()=>setShowMobileNav(true)}/>
      
      <GiOwl color="#90C7C1" strokeWidth={20} width={"20px"} height={"40px"}></GiOwl><Link to="/">OwlPrep</Link></div>

    <div>
      <form onSubmit={(e)=>{
        e.preventDefault()
        navigate(`/?q=${searchQuery}`)
        
      }}>
        <input type="text" placeholder="Search for a test" value={searchQuery} onChange={(e)=>setSearchQuery(e.currentTarget.value)}></input>
      </form>
    </div>

    <div id="header-btns">
      <div id="create-btn">+ Create</div>
      <div>
        {token ? <button className="accountBtn" onClick={changeDropdownView}><img src={profileImg} className="profileBtnOImg"/></button> : <Link id="toLoginBtn" to={"/login"}>Log In</Link> }
      </div>
      <div id="account-dropdown" ref={dropdown} className={`${showAccountDropdown ? "" : "hide"}`}>
        <div id="account-dropdown-header" className="account-dropdown-section">
          <div id="account-header-btn">
            <img src={profileImg} className="profileBtnOImg"/>
          </div>
          <div>
            <p id="user-account-email">{email}</p>
            <p id="user-account-name">{username}</p>
          </div>
        </div>

        <div className="account-dropdown-section">
          <ul>
            <li onClick={closeDropdown}><Link to={`/profiles/${username}`}>Account</Link></li>
            <li onClick={closeDropdown}><Link to="/settings">Settings</Link></li>
            <li onClick={closeDropdown}><Link to="/submitted-tests">Submitted Tests</Link></li>
            <li><button type="button" onClick={changeTheme}>{darkTheme ? <div><MdOutlineLightMode height={"100%"}/> Light mode</div> : <div><MdOutlineNightlight height={"100%"}/> Dark mode</div>}</button></li>
          </ul>
        </div>

        <div className="account-dropdown-section">
          <button onClick={()=>{logout()
          closeDropdown()}} id="logout-btn">Log out</button>
        </div>
      </div>
    </div>
    
  </header>
    <Routes>
      <Route path="/" element={<Default logout={logout} setTopics={setTopics} topics={topics} setUploadedFiles={setUploadedFiles} loggedIn={loggedIn} closeDropdown={closeDropdown} showAccountDropdown={showAccountDropdown} theme={darkTheme} changeTheme={changeTheme} changeDropdownView={changeDropdownView} setShowMobileNav={setShowMobileNav} showMobileNav={showMobileNav}/>}>
        <Route index element={<Home></Home>}></Route>

        
        <Route path="feedback" element={<Feedback></Feedback>}></Route>

        <Route path="/forgot-password" element={<ForgotPassword></ForgotPassword>}></Route>
        
        <Route path="/profiles/:username" element={<Profile changeProfileImg={(url)=>setProfileImg(url)} userLoggedInEmail={email}/>}></Route>
        
        <Route path="tests/:id" element={<Test saves={saves} editSaves={setSaves}/>}></Route>
        <Route element={<Secure/>}>
          <Route path="saves" element={<Saves></Saves>}></Route>
          <Route path="progress" element={<Progress></Progress>}></Route>
          <Route path="/create-test" element={<CreateTest topics={topics} uploadedFiles={uploadedFiles} handleToggleFile={changeUploadedFiles} changeTopics={changeTopics} changeAlertText={setAlertText} changeAlertShow={setShowAlert}/>}></Route>
          <Route path="/settings" element={<Settings theme={darkTheme} selectThemeChange={selectThemeChange} changeUsername={setUsername}/>}></Route>
          <Route path="/tests/:test_id/:question_id" element={<Question/>}></Route>
          <Route path="/test-results/:submission_id" element={<TestResults/>}></Route>
          <Route path="/submitted-tests" element={<SubmittedTests />} />
          <Route path="/submitted-tests/:submission_id/review/:question_id" element={<SubmittedTestReview />} />
        </Route>
        
        
        <Route path="*" element={<Page404/>}></Route>
      </Route>

      <Route path="/login" element={<Login logginUser={logginUser}></Login>}></Route>
      <Route path="/signup" element={<SignUp></SignUp>}></Route>

    </Routes>
    </>
  );
}

export default App;
