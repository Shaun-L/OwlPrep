export default function CustomRadio({text, onSelectionChange, checked=false}){
    return (
        <label className="radio">
            <input type="radio" name="questionRadio" checked={checked} value={text} className="radioInput" onChange={(e)=>{
                console.log(e.target.value)
                onSelectionChange(e.target.value)
                
                }}></input>
            <div className="customRadio"></div>
            {text}
        </label>
    )
}