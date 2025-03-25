import { useState } from "react";
import PropTypes from "prop-types";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

function Login({ onLoginSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async () => {
        setLoading(true);
        setError(""); // Reset error on new login attempt

        try {
            const auth = getAuth();
            await signInWithEmailAndPassword(auth, email, password);
            onLoginSuccess();
            alert("Login successful!");
            navigate("/");
        } catch (error) {
            if (error.code === "auth/invalid-email") {
                setError("Invalid email format.");
            } else if (error.code === "auth/wrong-password") {
                setError("Incorrect password. Try again.");
            } else if (error.code === "auth/user-not-found") {
                setError("No account found with this email.");
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-left">
                <div className="login-header">
                    <h1 className="app-name">OwlPrep</h1>
                </div>
                <div className="login-form">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        disabled={loading}
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        disabled={loading}
                    />
                    {error && <p className="error-message">{error}</p>}
                    <button onClick={handleLogin} disabled={loading}>
                        {loading ? "Logging in..." : "Login"}
                    </button>
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
    onLoginSuccess: PropTypes.func.isRequired,
};

export default Login;
