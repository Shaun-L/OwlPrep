import { useState } from "react"

export default function CustomCheck({text, checked = false, changeStorage}){
    const [selected, setSelected] = useState(checked)
    return (
        <label className="overflow checkbox-label custom-checkbox"><input type="checkbox" onChange={()=>{
            setSelected(!selected)
            changeStorage(text)
        }}  name="question-type" value={text} checked={selected}></input><span className="custom-check"></span>{text}</label>)
    
}