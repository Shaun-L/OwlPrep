import { FaRegTrashAlt } from "react-icons/fa";


export default function SampleQuestionItem({question, questionNumber, onDelete}){
    return(
        <div className="sampleQuestionItem"><p>{questionNumber}. {question}</p><div className="pointer"><FaRegTrashAlt onClick={()=>{onDelete(question)}}/></div></div>
    )
}