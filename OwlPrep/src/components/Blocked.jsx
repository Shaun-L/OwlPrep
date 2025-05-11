import { Link } from "react-router-dom";

export default function Blocked(){
    return(
        <div>
            <h2>Need to be logged in</h2>

            <Link to="/login">Log In</Link>
        </div>
    )
}