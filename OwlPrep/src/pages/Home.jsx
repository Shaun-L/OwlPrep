import {Link} from "react-router-dom"
import File_Dropzone from "../components/File_Dropzone"

export default function Home(){
    

    return(<>
        <h2>Generate a practice test</h2>
        <p>Choose or upload materials to generate practice questions designed for you</p>
        <ul className="upload-type-list">
            <li><button className="type-selected">Upload files</button></li>
            <li><button>Paste text</button></li>
        </ul>
        <File_Dropzone/>
        </>)
}