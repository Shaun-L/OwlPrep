import { Link, Outlet } from "react-router-dom"
import { MdOutlineLightMode } from "react-icons/md";
import { MdOutlineNightlight } from "react-icons/md";

export default function Default({loggedIn, showAccountDropdown, changeDropdownView, theme, changeTheme}){
    
    return(<>

    

    <header>
      <div id="Logo"><Link to="/">OwlPrep</Link></div>

      <div>
        <input type="text" placeholder="Search for a test"></input>
      </div>

      <div id="header-btns">
        <div>+ Create</div>
        <div>
          {loggedIn ? <button className="accountBtn" onClick={changeDropdownView}>F</button> : <Link to={"/SignUp"}>SignUp</Link> }
        </div>
        <div id="account-dropdown" onBlur={changeDropdownView} onBlurCapture={changeDropdownView} className={`${showAccountDropdown ? "" : "hide"}`}>
          <div id="account-dropdown-header" className="account-dropdown-section">
            <div >
              F
            </div>
            <div>
              <p id="user-account-email">nikerun@gmail.com</p>
              <p id="user-account-name">Nikeisthebest</p>
            </div>
          </div>

          <div className="account-dropdown-section">
            <ul>
              <li><Link to="/settings">Settings</Link></li>
              <li><button type="button" onClick={changeTheme}>{theme ? <span><MdOutlineLightMode/> Light mode</span> : <span><MdOutlineNightlight/> Dark mode</span>}</button></li>
            </ul>
          </div>

          <div className="account-dropdown-section">
            <button id="logout-btn">Log out</button>
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