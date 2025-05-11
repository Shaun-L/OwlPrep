import React, { useState } from "react"
import CustomRadio from "./CustomRadio"

export default function TrueOrFalse({options, setAnswer, test_id, question_id}){
    const [selectionOption, setSelectedOption] = useState(sessionStorage.getItem(`${test_id}/${question_id}`) || "")

    const onSelectionChange = (text)=>{
        console.log(text);
        setSelectedOption(text)
        sessionStorage.setItem(`${test_id}/${question_id}`, text)
        setAnswer(text)
    }

    console.log(selectionOption)



    return(
        <form>
            {
                options && options.map(option=><CustomRadio key={option} text={option} onSelectionChange={onSelectionChange} checked={option === selectionOption}/>)
            }
        </form>
    )
}