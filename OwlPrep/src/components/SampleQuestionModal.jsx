import { useState } from "react"
import { IoClose } from "react-icons/io5";
import SampleQuestionItem from "./SampleQuestionItem";

export default function SampleQuestionModal({closeModal, setSampleQuestions, sampleQuestions, onDelete}){
    const [question,setQuestion] = useState("")
    const [answer,setAnswer] = useState("")
    const [showError, setShowError] = useState(false)
    const [errMsg, setErrMsg] = useState("")

    const handleSubmit = ()=>{
        if(question == "" || answer==""){
            setErrMsg("Missing Field Required")
            setShowError(true)
        }else if(sampleQuestions.find((val)=>val.question==question)){
            setErrMsg("There already exist a similiar question")
            setShowError(true)
        }
        else{
            setAnswer("")
            setQuestion("")
            setSampleQuestions((oldVal=>[...oldVal,{question: question, answer: answer}]))
        }
    }
    return(
        <div className="sampleQuestionModal">
            <div className="sampleQuestionForm">
                <IoClose className="sampleQuestionModalClose pointer" onClick={closeModal}/>

                <h1>Sample Entry</h1>
                <h2>Provide a sample question and answer for reference</h2>
                <label htmlFor="testSampleQuestion" className="form-label">
                    Sample Question
                </label>
                <textarea id="testSampleQuestion" onFocus={()=>{setShowError(false)}} value={question} onChange={(e)=>{setQuestion(e.target.value)}}></textarea>
                <label className="form-label">Sample Answer</label>
                <textarea value={answer} onFocus={()=>{setShowError(false)}} onChange={(e)=>{
                    setAnswer(e.target.value)}}></textarea>
                
                {showError && <p className="errorMsg">{errMsg}</p>}
                <button className="formSubmitButton" onClick={handleSubmit}>Add</button>

                <div className="sampleQuestionContainer">
                    {
                        sampleQuestions.length == 0 ? <p>Custom questions will be shown here</p> : sampleQuestions.map((val, i)=><SampleQuestionItem questionNumber={i+1} question={val.question} onDelete={onDelete}></SampleQuestionItem>)}
                </div>
                </div>
                

                
        
        </div>
    )
}