import { FaUser } from "react-icons/fa"
import { Link } from "react-router-dom"

export default function StudyItemContainer({title, type, creator}){
    return (<div className="studyItemContainer">
        <div className="studyItemHeader">
        <h2>{title}</h2>
        <p>{type}</p>
        </div>
        <div className="studyItemFooter">
            {creator} <Link><FaUser/></Link>
        </div>
    </div>)
}