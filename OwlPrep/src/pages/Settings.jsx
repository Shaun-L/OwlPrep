import { useState, useEffect, useContext } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseUtils"; // For user authentication and pulling data
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import PropTypes from "prop-types";
import { TokenContext, } from "../hooks/TokenContext";

export default function Settings({theme, selectThemeChange}) {
    Settings.propTypes = {
        theme: PropTypes.bool.isRequired,
        selectThemeChange: PropTypes.func.isRequired,
    };
    const [username, setUsername] = useState("");
    const [editUsername, setEditUsername] = useState(false);

    const [email, setEmail] = useState("");
    const [editEmail, setEditEmail] = useState(false);
    
    const [password, setPassword] = useState("edsdfsdf");
    const [editPassword, setEditPassword] = useState(false);
    // Password changing states
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [authError, setAuthError] = useState();

    const [selectedTheme, setSelectedTheme] = useState(theme ? "dark" : "light");

    const [showAuthenticationModal, setShowAuthenticationModal] = useState(false);
    const {token, setToken} = useContext(TokenContext)

    // Pulls the user's data from the database
    useEffect(()=>{
        const getLoggedInUser = async()=>{
            const response = await fetch("http://127.0.0.1:5000/users", {
              method: "GET", // Use the appropriate HTTP method
              headers: {
                  "Authorization": `Bearer ${token}`, // Attach the Bearer token
              }
            })

            if (response.ok) {
                const data = await response.json();
                setUsername(data.username)
                setEmail(data.email)
                console.log("Response Data:", data);
            } else {
                console.error("Error Response:", response.status, response.statusText);
            }
        }

        getLoggedInUser()


       
    }, []);

    function changeSelectedTheme(e){
        // Updating the theme changing function
        const newTheme = e.target.value;
        console.log("Theme Changed to: " + newTheme);
        selectThemeChange(newTheme);
        setSelectedTheme(newTheme);
    }

    const handleCancelPasswordChange = () => {
        // If the password is not changed
        setShowAuthenticationModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setAuthError("");
        document.body.style.overflowY = "auto";
    };

    const handlePasswordChange = async () => {
        // If the password is changed
        try {
            const user = auth.currentUser;
            if (!user) {
                setAuthError("User not authenticated.");
                return;
            }

            // Store credintials for reauthentication
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            
            // Reauthenticating the user
            await reauthenticateWithCredential(user, credential);
            // Updating the password
            await updatePassword(user, newPassword);
            console.log("Password updated successfully.");
        } catch (error) {
            console.error("Error updating password:", error);
            setAuthError(error.message || "An error occurred while updating the password.");
        }

    };

    function editField(e){
        setEditUsername(false)
        setEditEmail(false)
        setEditPassword(false) // Resetting password edit field
        

        const editFieldName = e.target.dataset.field;
        console.log(editFieldName)

        switch(editFieldName){
            // Changing light or dark mode
            case "email":
                console.log("hello")
                setEditEmail(()=>true)
                break;
            case "username":
                setEditUsername(true)
                break;
            case "password":
                setShowAuthenticationModal(true);
                document.body.style.overflowY = "hidden";
                break;
        }
        
        console.log()
        if(e.target.parentNode.parentNode.firstChild.type !== "password"){
            e.target.parentNode.parentNode.firstChild.disabled = false;
            e.target.parentNode.parentNode.firstChild.focus()
        }

       
       

    };

    return(
    <>
    <div className={`modal ${showAuthenticationModal ? "showModal" : ""}`}>
        <div>
            <h2>Changing Password?</h2>
            <p>To confirm it&apos;s really you, please authenticate with you old password.</p>
            {authError && <p className="error-message">{authError}</p>}
            <input 
                type="password" 
                placeholder="Current Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
            ></input>
            <input
                type="password" 
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            ></input>
            <button type="button" onClick={()=>setShowAuthenticationModal(false)} onClick={handleCancelPasswordChange}>Cancel</button>
            <button type="button" className="mainBtn" onClick={handlePasswordChange}>Confirm</button>
        </div>
      
    </div>

    
        <h1>Settings</h1>

        <h2 className="settings-title">Personal Information</h2>
        <div className="settings-container">
            <div>
                <div className="settings-sub-section-container">
                    <h3>Username</h3>
                    <div className="form-field-container">
                        <input value={username} onBlur={()=>setEditUsername(false)} onChange={(e)=>{setUsername(e.target.value)}} readOnly={!editUsername} disabled={!editUsername}></input>
                        
                        <div>
                            <button type="button" className={editUsername ? "hide" : ""} onClick={editField} data-field="username">Edit</button>
                            <button type="button" onClick={()=>setEditUsername(false)} className={!editUsername ? "hide" : ""}>Cancle</button>
                            <button type="button" className={!editUsername ? "hide" : ""}>Save</button>
                        </div>
                        
                    </div>
                </div>
                
                <div className="settings-sub-section-container">
                    <h3>Email</h3>
                    <div className="form-field-container">
                        <input value={email} onBlur={()=>setEditEmail(false)} onChange={(e)=>{setEmail(e.target.value)}} readOnly={!editEmail} disabled={!editEmail}></input>
                        
                        <div>
                            <button type="button" className={editEmail ? "hide" : ""} onClick={editField} data-field="email">Edit</button>
                            <button type="button" onClick={()=>setEditEmail(false)} className={!editEmail ? "hide" : ""}>Cancle</button>
                            <button type="button" className={!editEmail ? "hide" : ""}>Save</button>
                        </div>
                        
                    </div>
                </div>
                
            </div>
        </div>

        <h2 className="settings-title">Appearance</h2>
        <div className="settings-container">
            <div>
                <div className="settings-sub-section-container">
                    <div className="form-field-container">
                        <h3>Theme</h3>
                        
                        <div>
                            <select name="theme" value={selectedTheme} onChange={changeSelectedTheme}> 
                                <option value={"light"}>Light</option>
                                <option value={"dark"}>Dark</option>
                            </select>
                        </div>
                        
                    </div>
                </div>
                
            </div>
        </div>

        <h2 className="settings-title">Account & Privacy</h2>
        <div className="settings-container">
            <div>
            <div className="settings-sub-section-container">
                    <h3>Password</h3>
                    <div className="form-field-container">
                        <input type="password" value={password} onChange={(e)=>{setEmail(e.target.value)}} readOnly={!editPassword} disabled={!editPassword}></input>
                        
                        <div>
                            <button type="button" className={editPassword ? "hide" : ""} onClick={editField} data-field="password">Edit</button>
                            <button type="button" onClick={()=>setEditUsername(false)} className={!editPassword ? "hide" : ""}>Cancel</button>
                            <button type="button" className={!editPassword ? "hide" : ""}>Save</button>
                        </div>
                        
                    </div>
                </div>
                
            </div>
        </div>
    </>)
}
