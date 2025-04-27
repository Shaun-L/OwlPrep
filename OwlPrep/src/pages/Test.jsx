import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { MdOutlineAccessTime } from "react-icons/md";
import { MdOutlineBookmarkAdd } from "react-icons/md";
import { MdOutlineBookmarkAdded } from "react-icons/md";


// Page
export default function Test({}){
    const {id} = useParams()
    const [testName, setTestName] = useState("")
    const [testDescription, setDescription] = useState("This is the best test in the world")
    const [testDateCreated, setTestDateCreated] = useState("2/32/32")
    const [testCreator, setTestCreator] = useState("")
    const [testTopics, setTestTopics] = useState([])
    const [profileImage, setProfileImage] = useState("")
    
    useEffect(()=>{
        fetch(`http://127.0.0.1:5000/tests?id=${id}`, {
            method: "GET",            
        }).then(res=>res.json()).then(data => {console.log(data)
            setTestName(data.test.name)
            setTestCreator(data.creator.username)
            setTestTopics(data.test.topics)
            setProfileImage(data.creator.img_url)
        })
    }, [])

    return <main className="testGrid">
    <div className="flex testTitleContainer">
    <h1>{testName}</h1>
    <button type="button"><MdOutlineBookmarkAdd/></button>
    </div>
    
    <div className="flex testPageHeader">
        <div className="flex testCreatorContainer"><img src={profileImage}></img> <Link to={`/profiles/${testCreator}`}>{testCreator}</Link></div>
        <div className="testDateContainer flex">
            <MdOutlineAccessTime/>
            <p >Created {testDateCreated}</p>
        </div>
    </div>

    <div className="testInfoContainer">
        <p className="testDescription">{testDescription}</p>

        <div className="testInfoSubContainer">
            <p>Questions</p>
            <p>20</p>
        </div>

        <div className="testInfoSubContainer">
            <p>Estimated time</p>
            <p>30 min</p>
        </div>

        <div className="testInfoSubContainer">
            <p>Difficulty</p>
            <p>Easy</p>
        </div>

        

        
    </div>

    <div className="testInfoContainer">
        <p className="testDescription">Topics</p>

        <div>
            {
                testTopics.map((topic)=><p className="testTopicContainer">{topic}</p>)
            }

        </div>

        

        
    </div>

    <Link to="#" id="takeTestBtn" className="mainBtn">Take this test</Link>
    </main>
}