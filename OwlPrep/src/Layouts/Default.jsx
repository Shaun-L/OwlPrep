import { Link, Outlet } from "react-router-dom"

export default function Default({loggedIn, showAccountDropdown, changeDropdownView}){
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
        <div id="account-dropdown" className={`${showAccountDropdown ? "" : "hide"}`}>
          <div id="account-dropdown-header">
            <div >
              F
            </div>
            <div>
              <p>nikerun@gmail.com</p>
              <p>Nikeisthebest</p>
            </div>
          </div>

          <div>
            <ul>
              <li><Link to="/settings">Settings</Link></li>
              <li><button type="button">Dark Mode</button></li>
            </ul>
          </div>
        </div>
      </div>
      
    </header>

    

    <main id="default-main">
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
        <div id="default-content">
            <Outlet/>
        </div>
    </main>
    </>)
}