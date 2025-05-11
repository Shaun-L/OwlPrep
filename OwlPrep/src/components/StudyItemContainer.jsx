import { FaUser } from "react-icons/fa"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom";


export default function StudyItemContainer({title, type, creator, id, profileImg, difficulty, test_length}){
    const navigate = useNavigate();
    
    const handleClick = () => {
        // Navigate to different routes based on content type
        if (type === "Cheatsheet") {
            navigate(`/cheatsheet/${id}`);
        } else {
            navigate(`/tests/${id}`);
        }
    };
    
    // Format test length to display in a user-friendly way
    const formatTestLength = (length) => {
        if (!length) return '';
        
        // If it's a numeric value (0,1,2) convert to text
        if (typeof length === 'number') {
            return ['Short', 'Medium', 'Long'][length] || '';
        }
        
        return length;
    };
    
    return (<div className="studyItemContainer" onClick={handleClick}>
        <div className="studyItemHeader">
            <h2>{title}</h2>
            <p className={type}>{type}</p>
        </div>
        <div className="studyItemDetails">
            {difficulty && <span className={`difficulty ${difficulty.toLowerCase()}`}>
                {difficulty}
            </span>}
            {test_length && <span className="test-length">
                {formatTestLength(test_length)}
            </span>}
        </div>
        <div className="studyItemFooter">
            {creator} <Link to={`/profiles/${creator}`} onClick={(e)=>e.stopPropagation()}><img src={profileImg || "/favicon.png"} alt={creator} /></Link>
        </div>
    </div>)
}