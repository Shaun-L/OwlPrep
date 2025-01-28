import { useState, useRef } from "react";
import "./App.css";
import {Routes, Route } from "react-router-dom";
import {Link} from "react-router-dom"
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Default from "./Layouts/Default";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState(""); // State for user name
  const [email, setEmail] = useState(""); // State for user email
  const checkboxRef = useRef(null);

  const [loggedIn, setLoggedIn] = useState(true);
  const [showAccountDropdown, setShowAccountDropDown] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);

  function changeDropdownView(){
    setShowAccountDropDown(!showAccountDropdown);
  }

  function logout(){
    setLoggedIn(false)
  }

  function logginUser(){
    setLoggedIn(true)
  }

  function closeDropdown(){
    setShowAccountDropDown(false);
  }

  function changeTheme(){

    if(darkTheme){
      document.body.removeAttribute("data-theme")
    }else{
      document.body.setAttribute("data-theme", "dark")
    }
    setDarkTheme(!darkTheme)
  }


  function selectThemeChange(themeName){
    console.log(themeName)
    if(themeName == "light"){
      document.body.removeAttribute("data-theme")
      setDarkTheme(false)
    }else{
      document.body.setAttribute("data-theme", "dark")
      setDarkTheme(true)
    }
  }


  return (
    <>
    
    <Routes>
      <Route path="/" element={<Default logout={logout} loggedIn={loggedIn} closeDropdown={closeDropdown} showAccountDropdown={showAccountDropdown} theme={darkTheme} changeTheme={changeTheme} changeDropdownView={changeDropdownView}/>}>
        <Route index element={<Home></Home>}></Route>
        <Route path="/signup" element={<SignUp></SignUp>}></Route>
        <Route path="/login" element={<Login logginUser={logginUser}></Login>}></Route>
        <Route path="/settings" element={<Settings theme={darkTheme} selectThemeChange={selectThemeChange}/>}></Route>
      </Route>
      
    </Routes>
    
    </>
  );
}

export default App;
