import { useState, useRef } from "react";
import { Routes, Route, Link } from "react-router-dom";
import File_Dropzone from "./components/File_Dropzone";  // Import your File_Dropzone component

import SignUp from "./pages/SignUp";
import Home from "./pages/Home";
import Default from "./Layouts/Default";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword"; // Adding the ForgotPassword component
import Profile from "./pages/Profile";
import Page404 from "./pages/404";
import "./App.css"; 

function App() {
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
          <Route path="/forgot-password" element={<ForgotPassword />} />   {/* Adding the ForgotPassword route */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings theme={darkTheme} selectThemeChange={selectThemeChange} />} />
          <Route path="*" element={<Page404 />} />
        </Route>
        <Route path="/profile/:username" element={<Profile />} />
      </Routes>
    </>
  );
}

export default App;
