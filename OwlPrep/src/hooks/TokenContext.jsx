import React, { createContext, useState, useEffect } from "react";

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
        if (token) {
            localStorage.setItem("authToken", token);
        } else {
            localStorage.removeItem("authToken");
        }
    }, [token]);

    return (
        <TokenContext.Provider value={{ token, setToken }}>
            {children}
        </TokenContext.Provider>
    );
};
