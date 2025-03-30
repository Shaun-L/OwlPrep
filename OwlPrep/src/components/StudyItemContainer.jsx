import { FaUser } from "react-icons/fa"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom";


export default function StudyItemContainer({title, type, creator, id}){
    const navigate = useNavigate();
    return (<div className="studyItemContainer" onClick={()=>navigate(`/practice-test/${id}`)}>
        <div className="studyItemHeader">
        <h2>{title}</h2>
        <p>{type}</p>
        </div>
        <div className="studyItemFooter">
            {creator} <Link to={`/profiles/${creator}`} onClick={(e)=>e.stopPropagation()}><img src="http://127.0.0.1:5000/images/default-profile.jpg" /></Link>
        </div>
    </div>)
}