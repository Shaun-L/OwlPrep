import { Link, Outlet, useLocation } from "react-router-dom"
import { MdOutlineLightMode } from "react-icons/md";
import { MdOutlineNightlight } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import { FaHome } from "react-icons/fa";
import { CiBookmark } from "react-icons/ci";
import { RiProgress1Line } from "react-icons/ri";
import { LuFileSpreadsheet } from "react-icons/lu";
import { LuLetterText } from "react-icons/lu";
import { GiOwl } from "react-icons/gi";
import { RxHamburgerMenu } from "react-icons/rx";


export default function Default({loggedIn, logout,closeDropdown, showAccountDropdown, changeDropdownView, theme, changeTheme}){
  const [searchQuery, setSearchQuery] = useState("")
  const [showMobileNav, setShowMobileNav] = useState(false)
  const dropdown = useRef(null)
  const location = useLocation()

  useEffect(()=>{
    setShowMobileNav(false)
  },[location])
  document.addEventListener("mousedown", (e)=>{

    if(showAccountDropdown && !dropdown.current.contains(e.target)){
      closeDropdown()
    }
  
   })

    return(<>

  
    
    <header>
    
      <div id="Logo">
      
        <RxHamburgerMenu className="mobileNavMenu" onClick={()=>setShowMobileNav(true)}/>
        
        <GiOwl color="#90C7C1" strokeWidth={20} width={"20px"} height={"40px"}></GiOwl><Link to="/">OwlPrep</Link></div>

      <div>
        <input type="text" placeholder="Search for a test" value={searchQuery} onChange={(e)=>setSearchQuery(e.currentTarget.value)}></input>
      </div>

      <div id="header-btns">
        <div id="create-btn">+ Create</div>
        <div>
          {loggedIn ? <button className="accountBtn" onClick={changeDropdownView}><FaUser/></button> : <Link id="loginBtn" to={"/login"}>Log In</Link> }
        </div>
        <div id="account-dropdown" ref={dropdown} className={`${showAccountDropdown ? "" : "hide"}`}>
          <div id="account-dropdown-header" className="account-dropdown-section">
            <div id="account-header-btn">
              <FaUser/>
            </div>
            <div>
              <p id="user-account-email">nikerun@gmail.com</p>
              <p id="user-account-name">Nikeisthebest</p>
            </div>
          </div>

          <div className="account-dropdown-section">
            <ul>
              <li onClick={closeDropdown}><Link to="/profile/">Account</Link></li>
              <li onClick={closeDropdown}><Link to="/settings">Settings</Link></li>
              <li><button type="button" onClick={changeTheme}>{theme ? <div><MdOutlineLightMode height={"100%"}/> Light mode</div> : <div><MdOutlineNightlight height={"100%"}/> Dark mode</div>}</button></li>
            </ul>
          </div>

          <div className="account-dropdown-section">
            <button onClick={()=>{logout()
            closeDropdown()}} id="logout-btn">Log out</button>
          </div>
        </div>
      </div>
      
    </header>

    

    <div id="default-main">
        
        

        <nav id="sideNav" className={showMobileNav? "showNav": ""}>
          
          <div id="mobileNavHeader" >
            <RxHamburgerMenu className="mobileNavMenu" onClick={()=>setShowMobileNav(false)}/>
            <GiOwl color="#90C7C1" strokeWidth={20}/>
          </div>

            <div className="sideNavSubContainer">
                <Link to="/"><FaHome/>Home</Link>
                
                <Link to="/"><CiBookmark/> Saves</Link>
                <Link to="/"><RiProgress1Line/> Progress</Link>
            </div>
            <div className="sideNavSubContainer">
                <h3>Start Here</h3>
                <Link ><LuFileSpreadsheet/> Cheetsheet</Link>
                <Link to="/create-test"><LuLetterText/> Practice Test</Link>
            </div>
        </nav>
        <main id="default-content">
            <Outlet/>
        </main>
    </div>
    </>)
}