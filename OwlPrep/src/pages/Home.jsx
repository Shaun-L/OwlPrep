import {Link} from "react-router-dom"
import File_Dropzone from "../components/File_Dropzone"
import { FaFilter } from "react-icons/fa";
import StudyItemContainer from "../components/StudyItemContainer";
export default function Home(){
    const items = [{title: "Title", type: "Cheetsheet"},{title: "Title", type: "Cheetsheet"}, {title: "Title", type: "Cheetsheet"}]

    return(<>
        <div id="home-header">
            <div>
                <button>Math</button>
                <button>Science</button>
                <button>History</button>
                <button>Math</button>
            </div>
            <div className="filter-container">
                <button>Filters <FaFilter/></button>
                <div id="filter-dropdown">
                    <input value="all" type="checkbox" name="filter"></input><label>All</label>
                    <input value="all" type="checkbox" name="filter"></input><label>Test</label>
                    <input value="all" type="checkbox" name="filter"></input><label>Cheetsheet</label>
                </div>
            </div>
        </div>
    

        <div id="itemsContainer">
            {
                items.map((item)=><StudyItemContainer title={item.title} type={item.type}/>)
            }
        </div>
        </>)
}