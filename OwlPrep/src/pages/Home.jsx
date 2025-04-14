import {Link, NavLink, useSearchParams} from "react-router-dom"
import File_Dropzone from "../components/File_Dropzone"
import { FaFilter } from "react-icons/fa";
import StudyItemContainer from "../components/StudyItemContainer";
import { useState, useEffect, useContext } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db } from "../firebaseUtils";
import { FaCaretLeft } from "react-icons/fa";
import { FaCaretRight } from "react-icons/fa";
import { TokenContext } from "../hooks/TokenContext";
import { TailSpin } from 'react-loader-spinner'

export default function Home(){
    const [items, setItems] = useState([])
    let [searchParams, setSearchParams] = useSearchParams();
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [mcFilterSelected, setMCFilterSelected] = useState(true)
    const [saFilterSelected, setSAFilterSelected] = useState(true)
    const [tfFilterSelected, setTFFilterSelected] = useState(true)
    const [smFilterSelected, setSMFilterSelected] = useState(true)
    const [difficultyFilter, setDifficultyFilter] = useState(4)
    const [numberOfPages, setNumberOfPages] = useState(1)
    const [loading, setLoading] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const { token, setToken } = useContext(TokenContext)

    useEffect(()=>{

        const fetchData = async ()=> {
            setLoading(true)
            if(searchParams.get("q") && searchParams.get("q") !== ""){
                try {
                    const res = await fetch(`http://127.0.0.1:5000/tests?q=${searchParams.get("q")}`, {method: "GET"});
                    const data = await res.json()
                    console.log(data)
                    console.log(res)
                    setItems(data.tests);
                    setCurrentPage(1)
                    let newNumberOfPages = Math.floor(data.tests.length / 12)
                    console.log(data.tests.length % 12)
                    newNumberOfPages += (data.tests.length % 12 != 0)? 1 : 0
                    setNumberOfPages(newNumberOfPages)
                    setLoading(false)
                  } catch (error) {
                    console.error("Error fetching data: ", error);
                  }
            }else{
                try {
                    const res = await fetch(`http://127.0.0.1:5000/tests`, {method: "GET"});
                    const data = await res.json()
                    setItems(data.tests);
                    let newNumberOfPages = Math.floor(data.tests.length / 12)
                    newNumberOfPages += (data.tests.length % 12 != 0)? 1 : 0
                    setNumberOfPages(newNumberOfPages)
                    setLoading(false)
                  } catch (error) {
                    console.error("Error fetching data: ", error);
                  }
            }
        }

        fetchData()
        setMCFilterSelected(true)
        setSAFilterSelected(true)
        setTFFilterSelected(true)
        setSMFilterSelected(true)
        setShowFilterDropdown(false)
        setDifficultyFilter(4)
    }, [searchParams])

    // useEffect(() => {
    //     const fetchData = async () => {
    //         console.log(searchParams.get("q"))
    //         if(searchParams.get("q")){
    //             try {
    //                 const res = await fetch(`http://127.0.0.1:5000/tests?q=${searchParams.get("q")}`, {method: "GET"});
    //                 const data = await res.json()
    //                 console.log(data)
    //                 console.log(res)
    //                 setItems([]);
    //               } catch (error) {
    //                 console.error("Error fetching data: ", error);
    //               }
    //         }else{
    //             try {
    //                 const querySnapshot = await getDocs(collection(db, 'tests'));
    //                 const dataList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    //                 console.log(dataList)
    //                 setItems(dataList.slice(0,18));
    //               } catch (error) {
    //                 console.error("Error fetching data: ", error);
    //               }
    //         }
          
    //     };
    
    //     fetchData();
    //   }, []);

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

    const itemMapped = items.slice(currentPage*12-12, currentPage*12).filter(item=>{
        console.log()
        if((!mcFilterSelected && item.test.questionTypes.includes("Multiple Choice")) || (!tfFilterSelected && item.test.questionTypes.includes("True or False")) ||
           (!saFilterSelected && item.test.questionTypes.includes("Short Answer"))){
            return false
        }

        return true

    }).filter(item=> difficultyFilter == 4 || item.test.difficulty == difficultyFilter ).map((item)=><StudyItemContainer title={item.test.name} type={item.test.type} creator={item.creator.username} profileImg={item.creator.img_url} key={item.test.id} id={item.test.id}/>)

    return(<>
        <div id="home-header">
            <div>
                <NavLink to="/?q=math" className={({ isActive}) => searchParams.get("q") == "math" && isActive ? 'activeLink' : ''
  }><button>Math</button></NavLink>
                <NavLink to="/?q=science" className={({ isActive}) => searchParams.get("q") == "science" && isActive ? 'activeLink' : ''
  }><button>Science</button></NavLink>
                <NavLink to="/?q=history" className={({ isActive}) => searchParams.get("q") == "history" && isActive ? 'activeLink' : ''
  }><button>History</button></NavLink>
            </div>
            <div className="filter-container">
                <button onClick={()=>{setShowFilterDropdown(!showFilterDropdown)}}>Filters <FaFilter/></button>
                {showFilterDropdown && <div id="filter-dropdown">
                    <p>
                        Question Types:
                    </p>
                <label className="checkbox-label custom-checkbox"><input onChange={()=>setMCFilterSelected(!mcFilterSelected)} value="all" type="checkbox" name="filter" checked={mcFilterSelected}></input><span className="custom-check"></span>Multiple Choice</label>
                <label className="checkbox-label custom-checkbox"><input onChange={()=>setTFFilterSelected(!tfFilterSelected)} value="test" type="checkbox" name="filter" checked={tfFilterSelected}></input><span className="custom-check"></span>True or False</label>
                <label className="checkbox-label custom-checkbox"><input onChange={()=>setSAFilterSelected(!saFilterSelected)} value="cheetsheet" type="checkbox" name="filter" checked={saFilterSelected}></input><span className="custom-check"></span>Short Answer</label>
                <label className="checkbox-label custom-checkbox"><input onChange={()=>setSMFilterSelected(!smFilterSelected)} value="cheetsheet" type="checkbox" name="filter" checked={smFilterSelected}></input><span className="custom-check"></span>Select Many</label>

                <p>Difficulty</p>
                <select name="difficultyFilter" value={difficultyFilter} onChange={(e)=>setDifficultyFilter(e.currentTarget.value)}>
                    <option value={4}>Any</option>
                    <option value={0}>Easy</option>
                    <option value={1}>Medium</option>
                    <option value={2}>Hard</option>
                </select>
                
                </div>}
            </div>
        </div>
    

        <div id="itemsContainer">
            {
                loading ? (
                                  <div className="homeLoadingContainer">
                                      <TailSpin   visible={true} height="40" width="40" color={getComputedStyle(root).getPropertyValue('--secondary-text-color').trim()} ariaLabel="tail-spin-loading" radius="1" wrapperStyle={{}} wrapperClass="loader" />
                                      
                                  </div>
                            ) : itemMapped.length == 0 ? <p className="homeLoadingContainer">No items available</p> : itemMapped
            }
        </div>
        {
            !loading && (itemMapped.length !== 0 && 
        <div className="flex itemNavigationContainer">
                <button className="itemPreviousBtn button" type="button" onClick={()=>{
                    if(currentPage > 1){setCurrentPage(currentPage-1)}}}><FaCaretLeft/></button>
                {
                    [...Array(numberOfPages).keys()].map(i => <button onClick={()=>setCurrentPage(i+1)} className={"pageBtn " + (currentPage == i+1 && "activePageBtn")}>{i + 1}</button>)
                }
                <button className="itemPreviousBtn button" type="button" onClick={()=>{
                    if(currentPage < numberOfPages){setCurrentPage(currentPage+1)}}}><FaCaretRight/></button>
            </div>)
        }
        </>)
}