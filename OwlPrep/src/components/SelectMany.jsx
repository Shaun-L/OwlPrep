import React, { useEffect, useState } from "react"
import CustomCheck from "./CustomCheck"

export default function SelectMany({options, selected, test_id, question_id, setAnswer}){
    console.log("Session Storage: ", sessionStorage.getItem(`${test_id}/${question_id}`) &&  sessionStorage.getItem(`${test_id}/${question_id}`).split("~~") || [])
    console.log("Prevous Many Select: ", selected)
    const [selectedOptions, setSelectedOptions] = useState(sessionStorage.getItem(`${test_id}/${question_id}`) && sessionStorage.getItem(`${test_id}/${question_id}`).split("~~") || [])
    console.log("Select Many Select: ", selected)
    console.log("Selected Options State: ", selectedOptions)
    
    useEffect(()=>{
        console.log("Selected Options Value Change: ", selectedOptions)
    }, [selectedOptions])

    console.log(options, question_id,selectedOptions)

    const onChange = (value)=>{
        if(selectedOptions.includes(value)){
            const newSelectedOptions = selectedOptions.filter(selectedOption=>selectedOption !== value)
            sessionStorage.setItem(`${test_id}/${question_id}`, newSelectedOptions.join("~~"))
            setAnswer(newSelectedOptions.join("~~"))
            console.log("Option Unselected: ", newSelectedOptions)
            setSelectedOptions(newSelectedOptions)
        }else{
            const newSelectedOptions = [...selectedOptions, value]
            console.log("Option Selected: ", newSelectedOptions)
            sessionStorage.setItem(`${test_id}/${question_id}`, newSelectedOptions.join("~~"))
            setAnswer(newSelectedOptions.join("~~"))
            setSelectedOptions(newSelectedOptions)
        }
    }
    return(
        <form>
            {
                options && options.map(option=>{
                    console.log(selectedOptions.includes(option))
                return <CustomCheck key={option} text={option} checked={selectedOptions.includes(option)} 
                changeStorage={onChange}/>})
            }
        </form>
    )
}