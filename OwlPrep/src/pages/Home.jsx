import {Link} from "react-router-dom"
import File_Dropzone from "../components/File_Dropzone"
import { FaFilter } from "react-icons/fa";
import StudyItemContainer from "../components/StudyItemContainer";
import { useState, useEffect } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebaseUtils";

export default function Home(){
    const [items, setItems] = useState([])
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [filter, setFilter] = useState(0)

    useEffect(() => {
        const fetchData = async () => {
          try {
            const querySnapshot = await getDocs(collection(db, 'tests'));
            const dataList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(dataList)
            setItems(dataList);
          } catch (error) {
            console.error("Error fetching data: ", error);
          }
        };
    
        fetchData();
      }, []);

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
                items.map((item)=><StudyItemContainer title={item.name} type={item.type} creator={item.creator} key={item.id}/>)
            }
        </div>
        </>)
}