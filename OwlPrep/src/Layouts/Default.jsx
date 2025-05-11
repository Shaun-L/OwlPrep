import { Link, NavLink, Outlet, useLocation } from "react-router-dom"

import { useContext, useEffect, useRef, useState } from "react";
import { FaHome } from "react-icons/fa";
import { CiBookmark } from "react-icons/ci";
import { RiProgress1Line } from "react-icons/ri";
import { LuFileSpreadsheet } from "react-icons/lu";
import { LuLetterText } from "react-icons/lu";
import { GiOwl } from "react-icons/gi";
import { RxHamburgerMenu } from "react-icons/rx";
import { MdOutlineCalendarToday } from "react-icons/md";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FaShare } from "react-icons/fa";
import File_Dropzone from "../components/File_Dropzone";
import { IoMdArrowDropdown } from "react-icons/io";
import { VscFeedback } from "react-icons/vsc";



export default function Default({loggedIn, topics, setTopics, logout,closeDropdown, setUploadedFiles, showAccountDropdown, changeDropdownView, theme, changeTheme, setShowMobileNav, showMobileNav}){
  
  
  const [showTopics, setShowTopics] = useState(false)
  
  const location = useLocation()
  

  useEffect(()=>{
    setShowMobileNav(false)
  },[location]) 
  

  

    return(<>

  
    
    

    

    <div id="default-main">
        
        

        <nav id="sideNav" className={showMobileNav? "showNav": ""}>
          
          <div id="mobileNavHeader" >
            <RxHamburgerMenu className="mobileNavMenu" onClick={()=>setShowMobileNav(false)}/>
            <GiOwl color="#90C7C1" strokeWidth={20}/>
          </div>

            <div className="sideNavSubContainer">
                <NavLink to="/" className={({isActive})=>(isActive ? 'activeLink' : '')}><FaHome/>Home</NavLink>
                <NavLink to="/feedback" className={({isActive})=>(isActive ? 'activeLink' : '')}><VscFeedback/>Feedback</NavLink>
                
                <NavLink to="/saves" className={({isActive})=>(isActive ? 'activeLink' : '')}><CiBookmark/> Saves</NavLink>
                <NavLink to="/progress" className={({isActive})=>(isActive ? 'activeLink' : '')}><RiProgress1Line/> Progress</NavLink>
            </div>
            <div className="sideNavSubContainer">
                <h3>Start Here</h3>
                <NavLink to="/create-cheatsheet" className={({isActive})=>(isActive ? 'activeLink' : '')}><LuFileSpreadsheet/> Cheatsheet</NavLink>
                <NavLink to="/create-test" className={({isActive})=>(isActive ? 'activeLink' : '')}><LuLetterText/> Practice Test</NavLink>
                <NavLink to="/daily-quiz" className={({isActive})=>(isActive ? 'activeLink' : '')}><MdOutlineCalendarToday/> Daily Quiz</NavLink>
                <NavLink to="/adaptive-pathway" className={({isActive})=>(isActive ? 'activeLink' : '')}><FaChalkboardTeacher/> Adaptive Learning</NavLink>
                <NavLink to="/share-test" className={({isActive})=>(isActive ? 'activeLink' : '')}><FaShare/> Share Test</NavLink>
            </div>

            <div className="fileUploadArea sideNavSubContainer">
                <h2>Upload Files:</h2>
                <File_Dropzone setTopics={setTopics} setUploadedFiles={setUploadedFiles} />
                <button id="topicsDropdownBtn" onClick={()=>{setShowTopics(!showTopics)}} disabled={topics.length == 0} >Topics({topics.length}): <IoMdArrowDropdown/></button>
                <div id="sideNavTopicsContainer" className={`${showTopics ? "show" : ""}`} >
                    {topics.map((topic)=><div className="sideNavTopicsContainer" key={topic.name}>{topic.name}</div>)}
                </div>
            </div>
        </nav>
        <main id="default-content">
            <Outlet/>
        </main>
    </div>
    </>)
}