import React, { createContext, useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Create a Context
export const TokenContext = createContext();

// Create a Provider component
export const TokenProvider = ({ children }) => {
    const [token, setToken] = useState(() => {
        // Load token from localStorage when the app initializes
        return localStorage.getItem("authToken") || null;
    });

    // Save token to localStorage whenever it changes
    useEffect(() => {
        console.log(token)
        if (token) {
            localStorage.setItem("authToken", token);
        } else {
            localStorage.removeItem("authToken");
        }
    }, [token]);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Fetch and set a fresh ID token for authenticated users
                const idToken = await user.getIdToken(true);
                setToken(idToken);

                const { exp } = JSON.parse(atob(idToken.split('.')[1]));

                // Calculate the token's expiration time in milliseconds
                const expirationTime = exp * 1000;

                // Clear the token when it expires
                const timeout = setTimeout(() => {
                    setToken(null);
                }, expirationTime - Date.now() - TOKEN_EXPIRATION_BUFFER);
            
            return () => clearTimeout(timeout);
            } else {
                // Clear token when user signs out
                setToken(null);
            }
        });
            
    
        
        
        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    return (
        <TokenContext.Provider value={{ token, setToken }}>
            {children}
        </TokenContext.Provider>
    );
};
