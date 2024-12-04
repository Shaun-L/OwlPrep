import { useState } from "react";
import { insertData, deleteData, listUsers } from "./firebaseUtils";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from "./pages/SignUp";
import Home from "./pages/Home";

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState(""); // State for user name
  const [email, setEmail] = useState(""); // State for user email

  const handleInsert = async () => {
    if (!name || !email) {
      alert("Please enter both name and email!");
      return;
    }

    const newUser = { name, email }; // Create user object
    const documentId = name.toLowerCase().replace(/\s+/g, "_"); // Create document ID

    try {
      await insertData("users", documentId, newUser);
      alert("User added successfully!");
      setName(""); // Reset the name field
      setEmail(""); // Reset the email field
    } catch (error) {
      alert("Error adding user: " + error.message);
    }
  };

  const handleDelete = async () => {
    if (!name) {
      alert("Please enter the name of the user to delete!");
      return;
    }

    const documentId = name.toLowerCase().replace(/\s+/g, "_"); // Use same ID format for deletion

    try {
      await deleteData("users", documentId);
      alert("User deleted successfully!");
      setName(""); // Reset the name field
    } catch (error) {
      alert("Error deleting user: " + error.message);
    }
  };

  const handleFetchUsers = async () => {
    try {
      const fetchedUsers = await listUsers("users");
      setUsers(fetchedUsers);
    } catch (error) {
      alert("Error fetching users: " + error.message);
    }
  };

  return (
    <>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home/>}/>
      <Route path="/SignUp" element={<SignUp/>}>
      


      </Route>
    </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
