import { useState } from "react";
import { insertData, deleteData, listUsers } from "./firebaseUtils";
import "./App.css";
import {Routes, Route } from "react-router-dom";
import {Link} from "react-router-dom"
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState(""); // State for user name
  const [email, setEmail] = useState(""); // State for user email

  const [loggedIn, setLoggedIn] = useState(true);
  const [showAccountDropdown, setShowAccountDropDown] = useState(false);

  function changeDropdownView(){
    setShowAccountDropDown(!showAccountDropdown);
  }

  return (
    <>

    <header>
      <div><Link to="/">OwlPrep</Link></div>

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
              <li><Link>Settings</Link></li>
              <li><button type="button">Dark Mode</button></li>
            </ul>
          </div>
        </div>
      </div>
      
    </header>
    
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/SignUp" element={<SignUp/>}>
      


      </Route>
    </Routes>
    
    </>
  );
}

export default App;
