import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebaseUtils"; // For user authentication and pulling data
import PropTypes from "prop-types";

export default function Settings({theme, selectThemeChange}) {
    Settings.propTypes = {
        theme: PropTypes.bool.isRequired,
        selectThemeChange: PropTypes.func.isRequired,
    };
    const [username, setUsername] = useState("");
    const [editUsername, setEditUsername] = useState(false);

    const [email, setEmail] = useState("");
    const [editEmail, setEditEmail] = useState(false);
    
    const [password, setPassword] = useState("");
    const [editPassword, setEditPassword] = useState(false);

    const [selectedTheme, setSelectedTheme] = useState(theme ? "dark" : "light");

    const [showAuthenticationModal, setShowAuthenticationModal] = useState(false);

    // Pulls the user's data from the database
    useEffect(()=>{
        const fetchUserData = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUsername(userData.username);
                    setEmail(userData.email);
                    setPassword(userData.password);
                }
            }
        };

        fetchUserData();
    }, []);

    function changeSelectedTheme(e){
        // Updating the theme changing function
        const newTheme = e.target.value;
        console.log("Theme Changed to: " + newTheme);
        selectThemeChange(newTheme);
        setSelectedTheme(newTheme);
    }

    function editField(e){
        setEditUsername(false)
        setEditEmail(false)
        setEditPassword(false) // Resetting password edit field
        selectedTheme(false)

        const editFieldName = e.target.dataset.field;
        console.log(editFieldName)

        switch(editFieldName){
            // Changing light or dark mode
            case "theme":
                selectedTheme(true)
                break;
            case "email":
                console.log("hello")
                setEditEmail(()=>true)
                break;
            case "username":
                setEditUsername(true)
                break;
            case "password":
                setShowAuthenticationModal(true);
                setEditPassword(true)
                document.body.style.overflowY = "hidden";
                break;
        }
        
        console.log()
        if(e.target.parentNode.parentNode.firstChild.type !== "password"){
            e.target.parentNode.parentNode.firstChild.disabled = false;
            e.target.parentNode.parentNode.firstChild.focus()
        }

       
       

    }

    return(<>
    <div className={`modal ${showAuthenticationModal ? "showModal" : ""}`}>
        <div>
            <h2>Changing Password?</h2>
            <p>To confirm it&apos;s really you, please authenticate with you old password.</p>
            <input type="password" placeholder="password"></input>
            <button type="button" onClick={()=>setShowAuthenticationModal(false)}>Cancle</button>
            <button type="button" className="mainBtn">Confirm</button>
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

        <h2 className="settings-title">Appereance</h2>
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