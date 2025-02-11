import { useNavigate } from "react-router-dom";
import { logout } from "../firebaseUtils";
import { Link } from "react-router-dom";

function LandingPage() {
  const navigate = useNavigate();


  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <Link to="/" className="navbar-link">Home</Link>
        <Link to="/profile" className="navbar-link">Profile</Link>
        <button onClick={handleLogout} className="navbar-link">Logout</button>
      </nav>

      {/* Main content */}
      <div className="landing-content">
        <img
          src="https://clipart-library.com/img/1910405.png"
          alt="OwlPrep Mascot"
          className="mascot"
        />
        <h1>OwlPrep</h1>
      </div>
    </div>
  );
}

export default LandingPage;
