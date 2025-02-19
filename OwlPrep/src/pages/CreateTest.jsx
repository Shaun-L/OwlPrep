import React from "react";
import { useState } from "react";
import File_Dropzone from "../components/File_Dropzone";
import { db } from "../firebaseUtils";
import { collection, addDoc } from "firebase/firestore";
import { redirect, useNavigate } from "react-router-dom";

export default function CreateTest(){
    const [testName, setTestName] = useState("");
    const [diff, setDiff] = useState(0)
    const [length, setLength] = useState(0)
    const [mcSelected, setMCSelected] = useState(true)
    const [tfSelected, setTFSelected] = useState(true)
    const [saSelected, setSASelected] = useState(true)
    const [topics, setTopics] = useState([])
    const navigate = useNavigate()

    async function submitTestForm(){
        const questionTypeList = []
        console.log("Ya")
        mcSelected && questionTypeList.push("Multiple Choice")
        tfSelected && questionTypeList.push("True or False")
        saSelected && questionTypeList.push("Short Answer")

        const newDoc = await addDoc(collection(db, 'tests'),{
            creator: "Freddy",
            name: testName,
            type: "Practice Test",
            difficulty: diff,
            questionTypes: questionTypeList,
            questions: [],
        }).then(()=>{
        
        }).catch((err)=>alert(err))
    }

    function changeTopics(topics){
        setTopics(topics)
    }

    function topicOnClickHandler(topicName){
        console.log("Hello")
        changeTopics(old=>old.map((topic)=>{
            console.log(topic.name, topicName)
            if(topic.name != topicName){
                return topic
            }else{
                return {...topic, keep:!topic.keep}
            }
        }))
    }

    console.log(topics)

    return (<>
        <h1>Generate a practice test</h1>
        <p>Choose or upload materials to generate practice questions designed for you</p>

        
        <form id="TestForm">
            <label className="form-heading testNameInput">
                        <input type="text"  value={testName} onChange={(e)=>setTestName(e.target.value)} placeholder="Test Name"></input>
            </label>

            <div>
                

                <label className="form-heading">
                    Test Difficulty:
                </label>
                <div className="testFormDifficultyContainer">
                    <button type="button" onClick={()=>setDiff(0)} className={diff == 0 && "diffSelected"}>Easy</button>
                    <button type="button" onClick={()=>setDiff(1)} className={diff == 1 && "diffSelected"}>Medium</button>
                    <button type="button" onClick={()=>setDiff(2)} className={diff == 2 && "diffSelected"}>Hard</button>
                </div>
            </div>

            

            <div>
                <label className="form-heading">
                    Test Length:
                </label>
                <div className="testFormDifficultyContainer">
                    <button type="button" onClick={()=>setLength(0)} className={length == 0 && "diffSelected"}>Short</button>
                    <button type="button" onClick={()=>setLength(1)} className={length == 1 && "diffSelected"}>Medium</button>
                    <button type="button" onClick={()=>setLength(2)} className={length == 2 && "diffSelected"}>Long</button>
                </div>
            </div>

            <div>
                    <p className="form-heading">Question types:</p>
                    <label className="checkbox-label custom-checkbox"><input type="checkbox" onChange={()=>setMCSelected(!mcSelected)}  name="question-type" value="multiple choice" checked={mcSelected}></input><span className="custom-check"></span>Multiple Choice</label>
                    <label className="checkbox-label custom-checkbox"><input type="checkbox" onChange={()=>setTFSelected(!tfSelected)}  name="question-type" value="true or false" checked={tfSelected}></input><span className="custom-check"></span>True or False</label>
                    <label className="checkbox-label custom-checkbox"><input type="checkbox" onChange={()=>setSASelected(!saSelected)}  name="question-type" value="short answer" checked={saSelected}></input><span className="custom-check"></span>Short Answer</label>
            </div>

            <div>
                <p className="form-heading">Topics:</p>
                {topics.length != 0 && <p>Click on topic to exclude from test creation</p>}
                <div className="topicsContainer">
                    {topics.length == 0 ? <div>Upload a file to see topic(s)</div> : topics.map((val)=>{return <div key={val.name} className={`topic-item ${!val.keep && "topicCrossed"}`}  onClick={()=>topicOnClickHandler(val.name)}>{val.name}</div>})}
                </div>

            </div>

            
        </form>
        
        

       
        
    </>)
    
}