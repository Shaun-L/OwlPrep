import {Link} from "react-router-dom"

export default function SignUp(){
    return (<>
    <main className="signUpPageContainer">

        <div>
            <form>
                <h2>Sign Up</h2>
                <input id="creationEmail" type="email" placeholder="Email@email.com"></input>
                <input type="password" placeholder="password"></input>
                <input type="submit" value="SignUp"></input>
                <div className="signUpOrContainer">
                    <p className="already">Already have an account? <Link to="/">Log In</Link></p>
                    <p className="or">OR</p>
                </div>
                
                <div className="withGoogleContainer">Continue with Google</div>
                
            </form>
            
        </div>
        
    </main>
    </>)
}