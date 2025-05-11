import React, { useEffect, useState } from "react"
import CustomCheck from "./CustomCheck"

export default function SelectMany({options, selected, test_id, question_id, setAnswer}){
    console.log("Session Storage: ", sessionStorage.getItem(`${test_id}/${question_id}`) &&  sessionStorage.getItem(`${test_id}/${question_id}`).split("~~") || [])
    console.log("Prevous Many Select: ", selected)
    const [selectedIndices, setSelectedIndices] = useState(
        sessionStorage.getItem(`${test_id}/${question_id}`) 
            ? sessionStorage.getItem(`${test_id}/${question_id}`).split("~~") 
            : []
    )
    console.log("Select Many Select: ", selected)
    console.log("Selected Options State: ", selectedIndices)
    
    useEffect(()=>{
        console.log("Selected Options Value Change: ", selectedIndices)
    }, [selectedIndices])

    console.log(options, question_id,selectedIndices)

    const onChange = (index) => {
        if(selectedIndices.includes(index)){
            const newSelectedIndices = selectedIndices.filter(i => i !== index)
            sessionStorage.setItem(`${test_id}/${question_id}`, newSelectedIndices.join("~~"))
            setAnswer(newSelectedIndices.join("~~"))
            setSelectedIndices(newSelectedIndices)
        } else {
            const newSelectedIndices = [...selectedIndices, index]
            sessionStorage.setItem(`${test_id}/${question_id}`, newSelectedIndices.join("~~"))
            setAnswer(newSelectedIndices.join("~~"))
            setSelectedIndices(newSelectedIndices)
        }
    }
    return(
        <form>
            {
                options && options.map((option, index) => 
                    <CustomCheck 
                        key={option} 
                        text={option} 
                        checked={selectedIndices.includes(index.toString())} 
                        changeStorage={() => onChange(index.toString())}
                    />
                )
            }
        </form>
    )
}