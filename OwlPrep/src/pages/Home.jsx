import {Link} from "react-router-dom"
import File_Dropzone from "../components/File_Dropzone"
import { FaFilter } from "react-icons/fa";
import StudyItemContainer from "../components/StudyItemContainer";
import { useState } from "react";
export default function Home(){
    const items = [{title: "Title", type: "Cheetsheet", creator: "Sean"},{title: "Title", type: "Cheetsheet", creator: "Kabir"}, {title: "Title", type: "Cheetsheet", creator: "Zain"}]
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [filter, setFilter] = useState(0)

    function filterCheckboxClick(e){
        console.log(e.currentTarget.value)
        if(e.currentTarget.value == "all"){
            setFilter(0)
        }else if(e.currentTarget.value == "test"){
            setFilter(1)
        }else{
            setFilter(2)
        }
    }

    return(<>
        <div id="home-header">
            <div>
                <button>Math</button>
                <button>Science</button>
                <button>History</button>
                <button>Math</button>
            </div>
            <div className="filter-container">
                <button onClick={()=>{setShowFilterDropdown(!showFilterDropdown)}}>Filters <FaFilter/></button>
                {showFilterDropdown && <div id="filter-dropdown">
                <label><input onChange={filterCheckboxClick} value="all" type="checkbox" name="filter" checked={filter == 0 ? true : false}></input>All</label>
                <label><input onChange={filterCheckboxClick} value="test" type="checkbox" name="filter" checked={filter == 1 ? true : false}></input>Test</label>
                <label><input onChange={filterCheckboxClick} value="cheetsheet" type="checkbox" name="filter" checked={filter == 2 ? true : false}></input>Cheetsheet</label>
                </div>}
            </div>
        </div>
    

        <div id="itemsContainer">
            {
                items.map((item)=><StudyItemContainer title={item.title} type={item.type} creator={item.creator}/>)
            }
        </div>
        </>)
}