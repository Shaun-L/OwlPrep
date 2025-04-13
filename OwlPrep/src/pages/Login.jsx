import { useState } from "react";
import PropTypes from 'prop-types';
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

function Login({logginUser}) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
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
        {/* Left Section */}
        <div className="login-left">
            <div className="login-header">
            {/* <a href="https://clipart-library.com/clipart/1910405.htm">
                <img
                src="https://clipart-library.com/img/1910405.png"
                alt="OwlPrep Mascot"
                className="mascot"
                />
            </a> */}
            <h1 className="app-name">OwlPrep</h1>
            </div>
            <div className="login-form">
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
            />
            <button onClick={handleLogin}>Login</button>
            <p>
                Need an account? <Link to="/signup">Sign Up</Link>
            </p>
            <p>
                Forgot your password? <Link to="/forgot-password">Reset Password</Link>
            </p>
            </div>
        </div>

        </div>
    );
}

Login.propTypes = {
    logginUser: PropTypes.func.isRequired,
};

export default Login;
