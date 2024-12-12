import { useEffect, useState } from "react";
import { db, auth } from "../firebaseUtils";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

function ProfilePage() {
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserInfo(userDoc.data());
        }
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="profile-page">
      <h1>Profile Page</h1>
      {userInfo ? (
        <div>
          <p>First Name: {userInfo.firstName}</p>
          <p>Last Name: {userInfo.lastName}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default ProfilePage;
