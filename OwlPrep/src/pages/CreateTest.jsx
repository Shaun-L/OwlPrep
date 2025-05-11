import React, { useEffect } from "react";
import { useState, useContext } from "react";
import File_Dropzone from "../components/File_Dropzone";
import { db } from "../firebaseUtils";
import { collection, addDoc } from "firebase/firestore";
import { redirect, useNavigate } from "react-router-dom";
import FileUploadComponent from "../components/FileUploadComponent";
import { byteConverter } from "../utils/byteconverter";
import FileUploadedComponent from "../components/FileUploadedComponent";
import { TokenContext } from "../hooks/TokenContext";
import { TailSpin } from "react-loader-spinner";

export default function CreateTest({topics, uploadedFiles, changeUploadedFiles, changeTopics, handleToggleFile, changeAlertText, changeAlertShow}){
    const [testName, setTestName] = useState("");
    const [diff, setDiff] = useState(0)
    const [length, setLength] = useState(0)
    const [mcSelected, setMCSelected] = useState(true)
    const [tfSelected, setTFSelected] = useState(true)
    const [saSelected, setSASelected] = useState(true)
    const [formError, setFormError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [description, setDescription] = useState("")
    const [smSelected, setSMSelected] = useState(true)
    const [generating, setGenerating] = useState(false)
    const {token, setToken} = useContext(TokenContext)
    const navigate = useNavigate()

    useEffect(()=>{
        setFormError(false)
    }, [uploadedFiles, topics, mcSelected, tfSelected, smSelected, saSelected, diff, length])

    async function submitTestForm(){
        console.log(mcSelected,tfSelected,saSelected)
        if(!mcSelected && !tfSelected && !saSelected){
            setFormError(true)
            setErrorMsg("Must select at least one question type");
            return
        }else if(uploadedFiles.length == 0){
            setErrorMsg("Need to upload Files");
            setFormError(true)
            return
        }else if(testName == ""){
            setErrorMsg("Test requires a name");
            setFormError(true)
            return
        }else{
            let noSelectedTopics = true;
            console.log("Nice")
            for(let i = 0; i < topics.length; i++){
                if(!topics[i].keep){
                    continue;
                }else{
                    noSelectedTopics = false;
                    break;
                    
                }
            }

            if(noSelectedTopics){
                setErrorMsg("Select a topic from the topic bank")
                setFormError(true);
                return
            }
        }

        const questionTypeList = []
        console.log("Ya")
        mcSelected && questionTypeList.push("MCQ")
        tfSelected && questionTypeList.push("T/F")
        saSelected && questionTypeList.push("SAQ")
        smSelected && questionTypeList.push("SMQ")

        const filteredTopics = topics.filter((topic)=>topic.keep).map((keepTopic)=>keepTopic.name)
        console.log(filteredTopics)

        const dataBody = {
            name: testName,
            type: "Practice Test",
            difficulty: diff,
            questionTypes: questionTypeList,
            questions: [],
            topics: filteredTopics,
            length: length,
            description: description
        }

        // Show loading indicator
        setGenerating(true);

        try {
            const res = await fetch(" http://127.0.0.1:5000/tests", {
                method: "POST",
                headers: {
                    'content-type': 'application/json',
                    "Authorization": `Bearer ${token}`, // Attach the Bearer token
                },
                body: JSON.stringify(dataBody)
            });

            const data = await res.json();
            console.log(res);
            console.log(data);

            if(res.status == 201){
                setTimeout(()=>{changeAlertShow(false)}, 1500);
                setTestName("");
                setDiff(0);
                setLength(0);
                setMCSelected(true);
                setTFSelected(true);
                setSASelected(true);
                setFormError(false);
                setErrorMsg("");
                setDescription("");
                setSMSelected(true);
                changeAlertText(data.message);
                changeAlertShow(true);
                
                // Navigate to the test
                navigate(`/tests/${data.test_id}/1`);
            } else {
                setGenerating(false);
                setErrorMsg(data.error || "Error generating test");
                setFormError(true);
            }
        } catch (error) {
            setGenerating(false);
            console.error("Error generating test:", error);
            setErrorMsg("Failed to generate test. Please try again.");
            setFormError(true);
        }
    }

    console.log(topics)

    const fileSelectors = uploadedFiles.map(file => {
        return <FileUploadedComponent key={file.name}  filename={file.name} filesize={byteConverter(file.size)} handleToggleFile={handleToggleFile} keep={file.keep}/>
      })

    if (generating) {
        return (
            <div className="generation-loading-container">
                <div className="generation-loading-content">
                    <img 
                        src="/favicon.png" 
                        alt="OwlPrep Mascot" 
                        className="loading-mascot"
                        style={{ width: '120px', marginBottom: '20px' }}
                    />
                    <h2>Generating Your Test</h2>
                    <p>This may take a minute as our AI analyzes your materials and creates questions...</p>
                    <div className="spinner-container">
                        <TailSpin visible={true} height="60" width="60" color={getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()} ariaLabel="tail-spin-loading" radius="1" />
                    </div>
                </div>
            </div>
        );
    }

    return (
    <>
    <div id="createTestPageContainer">
        <div>
            <h1>Generate a practice test</h1>
            <p>Choose or upload materials to generate practice questions designed for you</p>
        </div>
        

        
        <form id="TestForm">
            <label className="form-heading testNameInput">
                        <input type="text"  value={testName} onChange={(e)=>setTestName(e.target.value)} placeholder="Test Name"></input>
            </label>

            <label className="form-heading testDescription">
                    Description:
                        <textarea className="descriptionTextArea" value={description} onChange={(e)=>setDescription(e.target.value)}/>
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