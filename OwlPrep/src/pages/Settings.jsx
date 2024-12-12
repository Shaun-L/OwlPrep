import { useState } from "react";

export default function Settings({theme, selectThemeChange}){
    const [username, setUsername] = useState("nikeisthebest");
    const [editUsername, setEditUsername] = useState(false);

    const [email, setEmail] = useState("someemail@email.com");
    const [editEmail, setEditEmail] = useState(false);
    
    const [password, setPassword] = useState("password");
    const [editPassword, setEditPassword] = useState(false);

    const [selectedTheme, setSelectedTheme] = useState(theme ? "dark" : "light");

    const [showAuthenticationModal, setShowAuthenticationModal] = useState(false)

    function changeSelectedTheme(e){
        console.log(e.target.value)
        selectThemeChange(e.target.value)
        setSelectedTheme(e.target.value)
    }

    function editField(e){
        setEditUsername(false)
        setEditEmail(false)
        
        const editFieldName = e.target.dataset.field;
        console.log(editFieldName)

        switch(editFieldName){
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
        
        console.log(e.target.parentNode.parentNode.firstChild)
        e.target.parentNode.parentNode.firstChild.focus()

    }

    return(<>
    <div className={`modal ${showAuthenticationModal ? "showModal" : ""}`}>
        <div>
            <h2>Changing Password?</h2>
            <p>To confirm it's really you, please authenticate with you old password.</p>
            <input type="password" placeholder="password"></input>
            <button type="button">Cancle</button>
            <button type="button">Confirm</button>
        </div>
      
    </div>

    
        <h1>Settings</h1>

        <h2 className="settings-title">Personal Information</h2>
        <div className="settings-container">
            <div>
                <div className="settings-sub-section-container">
                    Username
                    <div className="form-field-container">
                        <input value={username} onChange={(e)=>{setUsername(e.target.value)}} readOnly={!editUsername}></input>
                        
                        <div>
                            <button type="button" className={editUsername ? "hide" : ""} onClick={editField} data-field="username">Edit</button>
                            <button type="button" onClick={()=>setEditUsername(false)} className={!editUsername ? "hide" : ""}>Cancle</button>
                            <button type="button" className={!editUsername ? "hide" : ""}>Save</button>
                        </div>
                        
                    </div>
                </div>
                
                <div className="settings-sub-section-container">
                    Email
                    <div className="form-field-container">
                        <input value={email} onChange={(e)=>{setEmail(e.target.value)}} readOnly={!editEmail}></input>
                        
                        <div>
                            <button type="button" className={editEmail ? "hide" : ""} onClick={editField} data-field="email">Edit</button>
                            <button type="button" onClick={()=>setEditUsername(false)} className={!editEmail ? "hide" : ""}>Cancle</button>
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
                        <p>Theme</p>
                        
                        <div>
                            <select name="theme" value={theme ? "dark" : "light"} onChange={changeSelectedTheme}> 
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
                    Password
                    <div className="form-field-container">
                        <input type="password" value={password} onChange={(e)=>{setEmail(e.target.value)}} readOnly={!editEmail}></input>
                        
                        <div>
                            <button type="button" className={editPassword ? "hide" : ""} onClick={editField} data-field="password">Edit</button>
                            <button type="button" onClick={()=>setEditUsername(false)} className={!editPassword ? "hide" : ""}>Cancle</button>
                            <button type="button" className={!editPassword ? "hide" : ""}>Save</button>
                        </div>
                        
                    </div>
                </div>
                
            </div>
        </div>
    </>)
}