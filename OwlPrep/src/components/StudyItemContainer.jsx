import { FaUser } from "react-icons/fa"
import { Link } from "react-router-dom"

export default function StudyItemContainer({title, type}){
    return (<div className="studyItemContainer">
        <div>
        <h2>Title</h2>
        <p>type</p>
        </div>
        <div className="studyItemFooter">
            Username <Link><FaUser/></Link>
        </div>
    </div>)
}