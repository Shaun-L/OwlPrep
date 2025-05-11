import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { MdOutlineAccessTime } from "react-icons/md";
import { MdOutlineBookmarkAdd } from "react-icons/md";
import { MdOutlineBookmarkAdded } from "react-icons/md";
import LoadingImg from "../assets/loading.png"
import { useContext } from "react";
import { TokenContext } from "../hooks/TokenContext";
import { MdBookmarkAdded } from "react-icons/md";
import '../styles.css';
import ProgressBar from 'react-customizable-progressbar';
// Page
export default function Test({saves, editSaves}){
    const {id} = useParams()
    const [testName, setTestName] = useState("")
    const [testDescription, setDescription] = useState("This is the best test in the world")
    const [testDateCreated, setTestDateCreated] = useState("2/32/32")
    const [testCreator, setTestCreator] = useState("")
    const [testTopics, setTestTopics] = useState([])
    const [profileImage, setProfileImage] = useState(LoadingImg)
    const [questionCount, setQuestionCount] = useState(null)
    const [testDifficulty, setTestDifficulty] = useState("...")
    const [questionTypes, setQuestionTypes] = useState([])
    const {token, setToken} = useContext(TokenContext)
    const [loading, setLoading] = useState(true)
    const [taken, setTaken] = useState(true)
    
    const navigate = useNavigate()
    
    useEffect(()=>{
        fetch(`http://127.0.0.1:5000/tests?id=${id}`, {
            method: "GET",            
        }).then(res=>res.json()).then(data => {console.log(data)
            setTestName(data.test.name)
            setTestCreator(data.creator.username)
            setTestTopics(data.test.topics)
            setProfileImage(data.creator.img_url)
            setQuestionCount(Object.keys(data.test.questions).length)
            setTestDifficulty(data.test.difficulty)
            setTestDateCreated(data.test?.created ?? "2/32/32")
            setQuestionTypes(data.test.question_types)
        })
    }, [])

    const handleSaveOnClick = async()=>{
        if(token){
            let newSaves = saves;
            if(saves.includes(id)){
                newSaves = saves.filter(test=>test!=id)
            }else{
                newSaves = [...saves,id]
            }
            const res = await fetch(" http://127.0.0.1:5000/users", {
                method: "PUT",
                headers: {
                    'content-type': 'application/json',
                    "Authorization": `Bearer ${token}`, // Attach the Bearer token
                },
                body: JSON.stringify({saves: newSaves})
            })

            const data = await res.json()
            console.log(data)

            editSaves(data.user.saves)

        }else{
            navigate("/login")
        }
    }

    const saved = saves.includes(id)


    return <>
    
    <main className="testGrid">

        

    <div className="flex testTitleContainer">
    <h1>{testName}</h1>
    <button type="button" className={saved ? "added" : ""} onClick={handleSaveOnClick}>{saved ? <MdBookmarkAdded className="added"/> : <MdOutlineBookmarkAdd/>}</button>
    </div>

    
    
    <div className="flex testPageHeader">
        <div className="flex testCreatorContainer"><img src={profileImage}></img> <Link to={`/profiles/${testCreator}`}>{testCreator}</Link></div>
        <div className="testDateContainer flex">
            <MdOutlineAccessTime/>
            <p >Created {testDateCreated}</p>
        </div>
    </div>

    
    <div>
        <p className="testDescription">Test Results</p>

        <div id="gradedResult" style={{ position: "relative", width: "max-content", margin: "auto"}}>
        <ProgressBar progress={60} radius={100} />
        <div
        className="resultText"
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "40px",
          fontWeight: "bold",
        }}
      >
        64%
      </div>
    </div>
    </div>
    

    <div className="testInfoContainer">
        <p className="testDescription">{testDescription}</p>
        <div className="testInfoSubContainer">
            <p>Question Types</p>
            <p>{questionTypes.join(", ")}</p>
        </div>
        <div className="testInfoSubContainer">
            <p>Questions</p>
            <p>{questionCount}</p>
        </div>

        <div className="testInfoSubContainer">
            <p>Estimated time</p>
            <p>30 min</p>
        </div>

        <div className="testInfoSubContainer">
            <p>Difficulty</p>
            <p>{testDifficulty}</p>
        </div>

        

        
    </div>

    <div className="testInfoContainer" id="testTopicsContainer">
        <p className="testDescription">Topics</p>

        <div>
            {
                testTopics.map((topic)=><p key={topic} className="testTopicContainer">{topic}</p>)
            }

        </div>

        

        
    </div>

    <Link to={`/tests/${id}/1`} id="takeTestBtn" className="mainBtn">Take this test</Link>
    </main>
    </>
}