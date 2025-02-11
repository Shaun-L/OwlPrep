// import { useState, useRef } from "react";
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
// import { Link } from "react-router-dom";
import File_Dropzone from "./components/File_Dropzone";  // Import your File_Dropzone component
import { register, login } from "./firebaseUtils";

import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Default from "./Layouts/Default";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Page404 from "./pages/404";
import "./App.css"; 

function App() {
  // const [users, setUsers] = useState([]);
  // const [name, setName] = useState(""); // State for user name
  const [email, setEmail] = useState(""); // State for user email
  const [password, setPassword] = useState(""); // State for user password
  // const checkboxRef = useRef(null);

  const [loggedIn, setLoggedIn] = useState(true);
  const [showAccountDropdown, setShowAccountDropDown] = useState(false);
  const [darkTheme, setDarkTheme] = useState(false);

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

  const handleRegister = async () => {
    try {
        const user = await register(email, password);
        console.log("User registered:", user);
    } catch(error) {
        console.error("Registration error:", error);
    }
  }

  const handleLogin = async () => {
    try {
        const user = await login(email, password);
        console.log("User logged in:", user);
    } catch(error) {
        console.log("Login error:", error);
    }
  }

  function changeTheme() {
    if (darkTheme) {
      document.body.removeAttribute("data-theme");
    } else {
      document.body.setAttribute("data-theme", "dark");
    }
    setDarkTheme(!darkTheme);
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
        <Route
          path="/"
          element={
            <Default
              logout={logout}
              loggedIn={loggedIn}
              closeDropdown={closeDropdown}
              showAccountDropdown={showAccountDropdown}
              theme={darkTheme}
              changeTheme={changeTheme}
              changeDropdownView={changeDropdownView}
            />
          }
        >
          <Route index element={<><Home /><File_Dropzone /></>} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login logginUser={logginUser} />} />
          <Route path="/settings" element={<Settings theme={darkTheme} selectThemeChange={selectThemeChange} />} />
          <Route path="*" element={<Page404 />} />
        </Route>
        <Route path="/profile/:username" element={<Profile />} />
      </Routes>
      <div>
        <input value ={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
        <button onClick={handleRegister}>Register</button>
        <button onClick={handleLogin}>Login</button>
      </div>
    </>
  );
}

export default App;
