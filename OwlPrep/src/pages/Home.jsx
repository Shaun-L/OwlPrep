import {Link} from "react-router-dom"

export default function Home(){
    return(<>
    <nav>
        <Link to={"/SignUp"}>SignUp</Link>
    </nav>
        </>)
}