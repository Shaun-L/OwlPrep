import React from "react";
import { useState } from "react";
import File_Dropzone from "../components/File_Dropzone";
import { db } from "../firebaseUtils";
import { collection, addDoc } from "firebase/firestore";
import { redirect, useNavigate } from "react-router-dom";
import FileUploadComponent from "../components/FileUploadComponent";
import { byteConverter } from "../utils/byteconverter";
import sampleQuestionModal from "../components/SampleQuestionModal";
import SampleQuestionModal from "../components/SampleQuestionModal";
import SampleQuestionItem from "../components/SampleQuestionItem";
import FileUploadedComponent from "../components/FileUploadedComponent";

export default function CreateTest({topics, uploadedFiles, changeUploadedFiles, changeTopics, handleToggleFile}){
    const [testName, setTestName] = useState("");
    const [diff, setDiff] = useState(0)
    const [length, setLength] = useState(0)
    const [mcSelected, setMCSelected] = useState(true)
    const [tfSelected, setTFSelected] = useState(true)
    const [saSelected, setSASelected] = useState(true)
    const [sampleQuestions, setSampleQuestions] = useState([])
    const [showSampleQuestionModal, setShowSampleQuestionModal] = useState(false)
    const [formError, setFormError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [smSelected, setSMSelected] = useState(true)
    const navigate = useNavigate()

    function handleFileRemove(filename){
        let removed = false;
        changeUploadedFiles(old=>old.map((file)=>{
            if(file.name != filename){
                return file
            }else{
                removed = file.keep
                return {...file, keep:!file.keep}
            }
        }))

        if(removed){
            let allUnselected = true;
            for(let i = 0; i < uploadedFiles[filename].length; i++){

            }
            
        }
    }

    async function submitTestForm(){
        console.log(mcSelected,tfSelected,saSelected)
        if(!mcSelected && !tfSelected && !saSelected){
            setFormError(true)
            setErrorMsg("Must select at least one question type");
            return
        }else if(uploadedFiles.length == 0){
            setErrorMsg("Missing Files");
            setFormError(true)
        }else if(testName == ""){
            setErrorMsg("Test requires a name");
            setFormError(true)
        }

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

    function deleteSampleQuestion(question){
        console.log(question)
        setSampleQuestions(old=>old.filter(val=>val.question!==question))
    }


    function closeModal(){
        setShowSampleQuestionModal(false);
    }

    

    console.log(topics)

    const fileSelectors = uploadedFiles.map(file => {
        return <FileUploadedComponent key={file.name}  filename={file.name} filesize={byteConverter(file.size)} handleToggleFile={handleToggleFile} keep={file.keep}/>
      })

    return (
    <>
    {showSampleQuestionModal && <SampleQuestionModal closeModal={closeModal} setSampleQuestions={setSampleQuestions} sampleQuestions={sampleQuestions} onDelete={deleteSampleQuestion}/>}
    <div id="createTestPageContainer">
        <div>
            <h1>Generate a practice test</h1>
            <p>Choose or upload materials to generate practice questions designed for you</p>
        </div>
        

        
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
                    <label className="checkbox-label custom-checkbox"><input type="checkbox" onChange={()=>setSMSelected(!smSelected)}  name="question-type" value="select many" checked={smSelected}></input><span className="custom-check"></span>Select Many</label>
            </div>

            <div className="sampleQuestionFormField">
                <div className="flex"><p className="form-heading">Sample Question:</p> <button onClick={()=>{setShowSampleQuestionModal(true)}}className="button addQuestionBtn" type="button">+</button></div>
                <div className="sampleQuestionContainer">
                {
                    sampleQuestions.length == 0 ? <p>Custom questions will be shown here</p> : sampleQuestions.map((val, i)=><SampleQuestionItem questionNumber={i+1} question={val.question} onDelete={deleteSampleQuestion}/>)}
                </div>

            </div>

            <div className="topics-in-grid">
                <p className="form-heading">Topics:</p>
                {topics.length != 0 && <p>Click on topic to exclude from test creation</p>}
                <div className="topicsContainer">
                    {topics.length == 0 ? <div style={{padding: "1rem"}}>Upload a file to see topic(s)</div> : topics.map((val)=>{return <div key={val.name} className={`topic-item ${!val.keep && "topicCrossed"}`}  onClick={()=>changeTopics(val.name)}>{val.name}</div>})}
                </div>

            </div>
            
            <div>
            {formError && <p className="errorMsg">{errorMsg}</p>}
                <button className="formSubmitButton" type="button" onClick={submitTestForm}>Generate Test</button>
            </div>
            
        </form>
        
        <div className="fileUploadedArea">
            <div>
                <h2>Files Uploaded</h2>
                <p>Remove any files that you dont want to be part of test</p>
            </div>
           
            <div className="filesUploadedContainer">
                {uploadedFiles.length == 0 ? <div>Uploaded files will show up here</div> : fileSelectors}
            </div>
        </div>

       
        </div></>)
    
}