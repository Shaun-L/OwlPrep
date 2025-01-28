import { useState } from "react";
import { insertData, deleteData, listUsers } from "./firebaseUtils";
import "./App.css";

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
            <div className="card">
            <h1>Firebase Firestore Demo</h1>
            
            <div>
                <label>
                <strong>Name:</strong>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name"
                />
                </label>
            </div>
            
            <div>
                <label>
                <strong>Email:</strong>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email"
                />
                </label>
            </div>
            
            <button onClick={handleInsert}>Insert User</button>
            <button onClick={handleDelete}>Delete User</button>
            <button onClick={handleFetchUsers}>List All Users</button>

            <div>
                <h2>Users:</h2>
                {users.length === 0 ? (
                <p>No users found.</p>
                ) : (
                <ul>
                    {users.map((user) => (
                    <li key={user.id}>
                        <strong>Name:</strong> {user.name} <br />
                        <strong>Email:</strong> {user.email}
                    </li>
                    ))}
                </ul>
                )}
            </div>
            </div>
        </>
    );
}

export default App;
