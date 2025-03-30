import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import LoginImage from "../assets/svg.svg"
import { LuUserRound } from "react-icons/lu";
import { IoKeyOutline } from "react-icons/io5";


function Login({logginUser}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("")
  const [formError, setFormError] = useState(false)
  const navigate = useNavigate();

  const handleLogin = async () => {
    if(email.trim() == "" || password.trim() == ""){
      setErrMsg("Missing Required Field")
      setFormError(true)
      return
    }
    try {
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful!");
      logginUser()
      navigate("/");
      
    } catch (error) {
      alert("Error logging in: " + error.message);
    }
  };

  return (
    <div className="login-container">
      <img src={LoginImage} alt="" />



       <form className="login-form">
          <h1>Login</h1>
          <label>
          <LuUserRound />
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Username or E-mail"
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
          <Link>Forgot password?</Link>
          {formError && <p className="errorMsg">{errMsg}</p>}
          <button type="button" onClick={handleLogin} id="loginBtn">Login</button>
          <Link to="/signup" id="toCreate">Create an account</Link>
          
        </form>

      
        
     

    </div>
  );
}

export default Login;
