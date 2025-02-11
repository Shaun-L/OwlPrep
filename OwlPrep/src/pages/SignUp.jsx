import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "../firebaseUtils";
import { setDoc, doc } from "firebase/firestore";

function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState(""); // New state for first name
  const [lastName, setLastName] = useState("");   // New state for last name
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const auth = getAuth();
      // Register the user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      // Save first and last name to Firestore under the user's document
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
      });

      alert("Registration successful!");
      navigate("/login");
    } catch (error) {
      alert("Error registering: " + error.message);
    }
  };

  return (
    <div className="register-container">
      <div className="register-left">
        <div className="register-form">
          <h1>Create an Account</h1>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First Name"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last Name"
          />
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
          <button onClick={handleRegister}>Register</button>

          {/* Link to login page */}
          <p>
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
      <div className="register-right">
        {/* You can add any content here for the right side */}
      </div>
    </div>
  );
}

export default SignUp;