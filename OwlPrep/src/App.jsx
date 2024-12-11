import { useState } from "react";
import { insertData, deleteData, listUsers } from "./firebaseUtils";
import "./App.css";
import {Routes, Route } from "react-router-dom";
import {Link} from "react-router-dom"
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Default from "./Layouts/Default";
import Settings from "./pages/Settings";

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

    
    
    <Routes>

      <Route path="/" element={<Default loggedIn={loggedIn} showAccountDropdown={showAccountDropdown} changeDropdownView={changeDropdownView}/>}>
        <Route index element={<Home></Home>}></Route>
        <Route path="/signup" element={<SignUp></SignUp>}></Route>
        <Route path="/settings" element={<Settings/>}></Route>
      </Route>
      
    </Routes>
    
    </>
  );
}

export default App;
