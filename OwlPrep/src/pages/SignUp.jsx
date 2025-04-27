import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebaseUtils";
import { setDoc, doc } from "firebase/firestore";
import LoginImage from "../assets/svg.svg"
import { LuUserRound } from "react-icons/lu";
import { IoKeyOutline } from "react-icons/io5";
import { MdOutlineEmail } from "react-icons/md";


function SignUp() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("")
  const [formError, setFormError] = useState(false)
  // New state for last name

  const navigate = useNavigate();

  useEffect(()=>{
    setFormError(false)
  }, [email, password, username])

  const handleRegister = async () => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if(email.trim() == "" || username.trim() == "" || password.trim == ""){
      setFormError(true)
      setErrMsg("Missing Required Field")
      return
    }else if(!regex.test(email)){
      setFormError(true)
      setErrMsg("Invalid email address")
      return
    }

    try {
      const auth = getAuth();
      // Register the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Save first and last name to Firestore under the user's document
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        email: email,
        username: username, // Save username to Firestore
        dark_theme: false,
        img_url: "http://127.0.0.1:5000/images/default-profile.jpg",
      });

      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      alert("Error registering: " + error.message);
    }
  };

  return (

    <div className="login-container">
          <img src={LoginImage} alt="" />
    
    
    
           <form className="login-form">
              <h1>Create an Account</h1>
              <label>
              <MdOutlineEmail />
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
              />
              </label>

              <label>
              <LuUserRound />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
              </label>
    
              <label >
              <IoKeyOutline />
    
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />
              </label>
              
              {formError && <p className="errorMsg">{errMsg}</p>}
              <button onClick={handleRegister} id="loginBtn" type="button">Create Account</button>
              <Link to="/login" id="toCreate">Already have an Account?</Link>
              
            </form>
    
          
            
         
    
        </div>
  );
}

export default SignUp;