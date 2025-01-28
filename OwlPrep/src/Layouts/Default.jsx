import { Link, Outlet } from "react-router-dom"
import { MdOutlineLightMode } from "react-icons/md";
import { MdOutlineNightlight } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { useRef } from "react";

export default function Default({loggedIn, logout,closeDropdown, showAccountDropdown, changeDropdownView, theme, changeTheme}){
  
  const dropdown = useRef(null)
  
  document.addEventListener("mousedown", (e)=>{

    if(showAccountDropdown && !dropdown.current.contains(e.target)){
      closeDropdown()
    }
  
   })

    return(<>

  
    
    <header>
      <div id="Logo"><Link to="/">OwlPrep</Link></div>

      <div>
        <input type="text" placeholder="Search for a test"></input>
      </div>

      <div id="header-btns">
        <div id="create-btn">+ Create</div>
        <div>
          {loggedIn ? <button className="accountBtn" onClick={changeDropdownView}><FaUser/></button> : <Link to={"/login"}>Log In</Link> }
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
              <li onClick={closeDropdown}><Link to="/settings">Settings</Link></li>
              <li><button type="button" onClick={changeTheme}>{theme ? <span><MdOutlineLightMode/> Light mode</span> : <span><MdOutlineNightlight/> Dark mode</span>}</button></li>
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
        
        <nav>
            <div>
                <Link to="/">Home</Link>
            </div>
            <div>
                <Link>Flashcards</Link>
                <Link>Cheetsheet</Link>
                <Link>Practice Test</Link>
            </div>
        </nav>
        <main id="default-content">
            <Outlet/>
        </main>
    </div>
    </>)
}