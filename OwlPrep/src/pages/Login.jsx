import { useState } from "react";
import PropTypes from 'prop-types';
import { useNavigate, Link, useLocation } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import LoginImage from "../assets/svg.svg"
import { LuUserRound } from "react-icons/lu";
import { IoKeyOutline } from "react-icons/io5";
import { TokenContext } from "../hooks/TokenContext";
import { useContext } from "react";

function Login({logginUser}) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("")
  const [formError, setFormError] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();
  const { token, setToken } = useContext(TokenContext);
  
  // Check if we have a redirect path from where the user came
  const returnPath = location.state?.returnPath || "/";
  const redirectMessage = location.state?.message || "";

  const handleLogin = async () => {
    if(email.trim() == "" || password.trim() == ""){
      setErrMsg("Missing Required Field")
      setFormError(true)
      return
    }
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      // Store the token securely
      setToken(idToken)
      
      // Fetch user data immediately after login
      try {
        const response = await fetch("http://127.0.0.1:5000/users", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${idToken}`,
          },
        });
        
        if (response.ok) {
          console.log("Fetched user data after login");
        }
      } catch (error) {
        console.error("Error fetching user data after login:", error);
      }
      
      logginUser()
      
      // Redirect to the return path or homepage
      navigate(returnPath);
      
    } catch (error) {
      setErrMsg("Error logging in: " + error.message);
      setFormError(true);
    }
  };

  return (
    <div className="login-container">
      <img src={LoginImage} alt="" />

       <form className="login-form">
          <h1>Login</h1>
          
          {/* Show redirect message if available */}
          {redirectMessage && (
            <p className="redirect-message">{redirectMessage}</p>
          )}
          
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
          <Link to="/forgot-password">Forgot password?</Link>
          {formError && <p className="errorMsg">{errMsg}</p>}
          <button type="button" onClick={handleLogin} id="loginBtn">Login</button>
          <Link to="/signup" id="toCreate">Create an account</Link>
          
        </form>

        </div>
    );
}

Login.propTypes = {
    logginUser: PropTypes.func.isRequired,
};

export default Login;
