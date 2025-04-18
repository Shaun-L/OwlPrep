import { FaUser } from "react-icons/fa"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom";


export default function StudyItemContainer({title, type, creator, id, profileImg}){
    const navigate = useNavigate();
    return (<div className="studyItemContainer" onClick={()=>navigate(`/tests/${id}`)}>
        <div className="studyItemHeader">
        <h2>{title}</h2>
        <p>{type}</p>
        </div>
        <div className="studyItemFooter">
            {creator} <Link to={`/profiles/${creator}`} onClick={(e)=>e.stopPropagation()}><img src={profileImg} /></Link>
        </div>
    </div>)
}