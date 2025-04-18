import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

const auth = getAuth();


/**

 * Sends a password reset email to the given email address. Links to the 'Change Password' page, where the user can enter a new password.
 * Sends a password reset email to the given email address. 
 * Links to the 'Change Password' page, where the user can enter a new password.

 * @param {string} email The email address to which to send a password reset email.
 */

function ForgotPassword() {
    // Getting the email to send the reset password email to
    const [email, setEmail] = useState("");
    // Making sure the email is legitimate
    const navigate = useNavigate();

    // Handling if the entered email is not associated with an account
    const handleForgotPassword = async () => {
        try {
            await sendPasswordResetEmail(auth, email);
            alert("Password reset email sent!");
            navigate("/change-password");
        } catch (error) {
            alert("Error sending password reset email: " + error.message);
        }
    };
    
    return (
        <div>
            <h2>Forgot Password?</h2>
            <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
            />
            <button onClick={handleForgotPassword}>Send Reset Email</button>
            <p>
                Remember your password? <Link to="/login">Login</Link>
            </p>
        </div>
    );
}


export default ForgotPassword;