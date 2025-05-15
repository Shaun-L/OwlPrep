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
import axios from "axios";
import { API_URL } from "../constants";

export default function Home(){
    const [items, setItems] = useState([])
    const [cheatsheets, setCheatsheets] = useState([])
    let [searchParams, setSearchParams] = useSearchParams();
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [mcFilterSelected, setMCFilterSelected] = useState(true)
    const [saFilterSelected, setSAFilterSelected] = useState(true)
    const [tfFilterSelected, setTFFilterSelected] = useState(true)
    const [smFilterSelected, setSMSelected] = useState(true)
    const [difficultyFilter, setDifficultyFilter] = useState("All")
    const [contentFilter, setContentFilter] = useState("All")
    const [numberOfPages, setNumberOfPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [activeTab, setActiveTab] = useState("all") // all, tests, cheatsheets
    const { token, setToken } = useContext(TokenContext)
    const [fetchedTest, setFetchedTest] = useState(false)
    const [fetchedCheetsheet, setFetchedCheatsheet] = useState(false)

    useEffect(()=>{
        const fetchTestData = async ()=> {
            
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
                } catch (error) {
                    console.error("Error fetching test data: ", error);
                }
            } else {
                try {
                    const res = await fetch(`http://127.0.0.1:5000/tests`, {method: "GET"});
                    const data = await res.json()
                    console.log(data)
                    setItems(data.tests);
                    let newNumberOfPages = Math.floor(data.tests.length / 12)
                    newNumberOfPages += (data.tests.length % 12 != 0)? 1 : 0
                    setNumberOfPages(newNumberOfPages)
                } catch (error) {
                    console.error("Error fetching test data: ", error);
                }
            }

            setFetchedTest(true)
        }

        const fetchCheatsheetsData = async () => {
            setLoading(true)
            if (token) {
                try {
                    console.log("Fetching cheatsheets with token:", token);
                    const apiUrl = API_URL || "http://127.0.0.1:5000"; // Fallback URL
                    
                    // Fetch user's cheatsheets
                    const userCheatsheets = await axios.get(
                        `${apiUrl}/cheatsheets`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }
                    );
                    
                    console.log("Cheatsheets response:", userCheatsheets.data);
                    
                    if (userCheatsheets.data && userCheatsheets.data.cheatsheets) {
                        // Transform the data to match the format needed for display
                        const formattedCheatsheets = userCheatsheets.data.cheatsheets.map(cheatsheet => ({
                            test: {
                                id: cheatsheet.id,
                                name: cheatsheet.name,
                                type: "Cheatsheet",
                                topics: cheatsheet.topics || [],
                                difficulty: cheatsheet.hint_level_desc || "Medium",
                                created: cheatsheet.created || ""
                            },
                            creator: {
                                username: "You", // Since these are the user's own cheatsheets
                                img_url: "" // We don't have this info directly
                            }
                        }));
                        
                        console.log("Formatted cheatsheets:", formattedCheatsheets);
                        setCheatsheets(formattedCheatsheets);
                    } else {
                        console.warn("No cheatsheets found in the response");
                        setCheatsheets([]);
                    }

                    
                } catch (error) {
                    console.error("Error fetching cheatsheets:", error);
                    if (error.response) {
                        console.error("Response data:", error.response.data);
                        console.error("Response status:", error.response.status);
                    }
                    setCheatsheets([]);
                    
                }
            } else {
                console.warn("No token available for fetching cheatsheets");
                setCheatsheets([]);
                
            }

            setFetchedCheatsheet(true)

            
        };

        setLoading(true)

        fetchTestData();
        fetchCheatsheetsData();
        

        
        
        setMCFilterSelected(true)
        setSAFilterSelected(true)
        setTFFilterSelected(true)
        setSMSelected(true)
        setShowFilterDropdown(false)
        setDifficultyFilter("All")
        setContentFilter("All")
        console.log(items)
    }, [searchParams, token])

    useEffect(()=>{
        if(fetchedCheetsheet && fetchedTest){
            setLoading(false)
        }
    }, [fetchedCheetsheet, fetchedTest])

    // Get all items based on the active tab
    const getAllItems = () => {
        console.log("Items:", items);
        console.log("Cheatsheets:", cheatsheets);
        
        if (activeTab === "tests") {
            return items.filter(item => item.test.type !== "Cheatsheet");
        } else if (activeTab === "cheatsheets") {
            return cheatsheets;
        } else {
            // Return both tests and cheatsheets
            return [...items.filter(item => item.test.type !== "Daily Quiz" && item.test.is_daily !== true), ...cheatsheets];
        }
    };

    const filteredItems = getAllItems().filter(item => {
        // Skip filtering for cheatsheets
        if (contentFilter == "Cheatsheet" && item.test.type === "Cheatsheet") {
            return true;
        }else if(contentFilter == "Cheatsheet"){
            return false
        }
        
        // Filter out daily quizzes
        if (item.test.type === "Daily Quiz" || item.test.is_daily === true) {
            return false;
        }
        
        // Apply question type filters
        if ((!mcFilterSelected && item.test.question_types?.includes("MCQ")) || 
            (!tfFilterSelected && item.test.question_types?.includes("T/F")) ||
            (!saFilterSelected && item.test.question_types?.includes("SAQ")) || 
            (!smFilterSelected && item.test.question_types?.includes("SMQ"))) {
            return false;
        }

        // Apply difficulty filter
        return difficultyFilter === "All" || item.test.difficulty === difficultyFilter;
    });

    // Get paginated items
    const paginatedItems = filteredItems.slice(currentPage * 12 - 12, currentPage * 12);

    // Map items to components
    const itemMapped = paginatedItems.map((item) => (
        <StudyItemContainer 
            title={item.test.name} 
            type={item.test.type} 
            creator={item.creator.username} 
            profileImg={item.creator.img_url} 
            key={item.test.id} 
            id={item.test.id}
            difficulty={item.test.difficulty} 
            test_length={item.test.test_length}
        />
    ));

    console.log("Loading", loading)
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
            {/* <div className="home-tabs">
                <button 
                    className={activeTab === "all" ? "tab-active" : ""} 
                    onClick={() => setActiveTab("all")}
                >
                    All
                </button>
                <button 
                    className={activeTab === "tests" ? "tab-active" : ""} 
                    onClick={() => setActiveTab("tests")}
                >
                    Practice Tests
                </button>
                <button 
                    className={activeTab === "cheatsheets" ? "tab-active" : ""} 
                    onClick={() => setActiveTab("cheatsheets")}
                >
                    Cheatsheets
                </button>
            </div> */}
            <div className="filter-container">
                <button onClick={()=>{setShowFilterDropdown(!showFilterDropdown)}}>Filters <FaFilter/></button>
                {showFilterDropdown && <div id="filter-dropdown">
                    <p>
                        Question Types:
                    </p>
                <label className="checkbox-label custom-checkbox"><input onChange={()=>setMCFilterSelected(!mcFilterSelected)} value="all" type="checkbox" name="filter" checked={mcFilterSelected}></input><span className="custom-check"></span>Multiple Choice</label>
                <label className="checkbox-label custom-checkbox"><input onChange={()=>setTFFilterSelected(!tfFilterSelected)} value="test" type="checkbox" name="filter" checked={tfFilterSelected}></input><span className="custom-check"></span>True or False</label>
                <label className="checkbox-label custom-checkbox"><input onChange={()=>setSAFilterSelected(!saFilterSelected)} value="cheetsheet" type="checkbox" name="filter" checked={saFilterSelected}></input><span className="custom-check"></span>Short Answer</label>
                <label className="checkbox-label custom-checkbox"><input onChange={()=>setSMSelected(!smFilterSelected)} value="cheetsheet" type="checkbox" name="filter" checked={smFilterSelected}></input><span className="custom-check"></span>Select Many</label>

                <p>Difficulty</p>
                <select name="difficultyFilter" value={difficultyFilter} onChange={(e)=>setDifficultyFilter(e.currentTarget.value)}>
                    <option value={"All"}>Any</option>
                    <option value={"Easy"}>Easy</option>
                    <option value={"Medium"}>Medium</option>
                    <option value={"Hard"}>Hard</option>
                </select>

                <p>Study Content</p>
                <select name="difficultyFilter" value={contentFilter} onChange={(e)=>setContentFilter(e.currentTarget.value)}>
                    <option value={"All"}>Any</option>
                    <option value={"Practice Test"}>Tests</option>
                    <option value={"Cheatsheet"}>Cheatsheets</option>
                    
                </select>
                
                </div>}
            </div>
        </div>
    

        <div id="itemsContainer">
            {
                
                loading ? (
                    <div className="homeLoadingContainer">
                        <TailSpin visible={true} height="40" width="40" color={getComputedStyle(document.documentElement).getPropertyValue('--secondary-text-color').trim()} ariaLabel="tail-spin-loading" radius="1" />
                    </div>
                ) : itemMapped.length === 0 ? (
                    <p className="homeLoadingContainer">No items available</p>
                ) : itemMapped
            }
        </div>
        {
            !loading && (filteredItems.length > 0 && 
        <div className="flex itemNavigationContainer">
                <button className="itemPreviousBtn button" type="button" onClick={()=>{
                    if(currentPage > 1){setCurrentPage(currentPage-1)}}}><FaCaretLeft/></button>
                {
                    [...Array(Math.ceil(filteredItems.length / 12)).keys()].map(i => <button key={i+1} onClick={()=>setCurrentPage(i+1)} className={"pageBtn " + (currentPage == i+1 && "activePageBtn")}>{i + 1}</button>)
                }
                <button className="itemPreviousBtn button" type="button" onClick={()=>{
                    if(currentPage < Math.ceil(filteredItems.length / 12)){setCurrentPage(currentPage+1)}}}><FaCaretRight/></button>
            </div>)
        }
        </>)
}