import { useState } from "react"

export default function ShortAnswer({question_id, test_id, setResponse}){
    const [answer, setAnswer] = useState(sessionStorage.getItem(`${test_id}/${question_id}`) || "")
    return <textarea value={answer} onChange={(e)=>{setAnswer(e.target.value)
        sessionStorage.setItem(`${test_id}/${question_id}`, e.target.value)
        setResponse(e.target.value)
    }}>

    </textarea>
}