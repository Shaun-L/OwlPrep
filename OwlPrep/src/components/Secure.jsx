import { Outlet, Navigate } from "react-router-dom";
import { TokenContext } from "../hooks/TokenContext";
import { TokenProvider } from "../hooks/TokenContext";
import { useContext } from "react";
export default function Secure(){
    const {token, setToken} = useContext(TokenContext)


    return token ? <Outlet /> : <Navigate to="/login" replace/>;
}