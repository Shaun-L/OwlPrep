import React, { useState } from "react"
import CustomRadio from "./CustomRadio"

export default function MultipleChoice({options, setAnswer, test_id, question_id}){
    const [selectedIndex, setSelectedIndex] = useState(sessionStorage.getItem(`${test_id}/${question_id}`) || "")

    const onSelectionChange = (index) => {
        setSelectedIndex(index)
        sessionStorage.setItem(`${test_id}/${question_id}`, index)
        setAnswer(index)
    }

    return(
        <form>
            {
                options && options.map((option, index) => 
                    <CustomRadio 
                        key={option} 
                        text={option} 
                        onSelectionChange={() => onSelectionChange(index.toString())} 
                        checked={index.toString() === selectedIndex}
                    />
                )
            }
        </form>
    )
}