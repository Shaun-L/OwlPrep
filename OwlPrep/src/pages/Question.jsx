import { useEffect, useState, useContext } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import MultipleChoice from "../components/MultipleChoice";
import ShortAnswer from "../components/ShortAnswer";
import SelectMany from "../components/SelectMany";
import { db, auth } from "../firebaseUtils";
import { addDoc, collection } from "firebase/firestore";
import { TailSpin } from "react-loader-spinner";
import TrueOrFalse from "../components/TrueOrFalse";
import { TokenContext } from "../hooks/TokenContext";

export default function Question(){
    const location = useLocation()
    const {test_id, question_id} = useParams()
    const [question, setQuestion] = useState({})
    const [testLength, setTestLength] = useState(0)
    const [questionType, setQuestionType] = useState("")
    const [testName, setTestName] = useState("")
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState("")
    const [answer, setAnswer] = useState(null)
    const { token } = useContext(TokenContext)
    const navigate = useNavigate()

    useEffect(() => {
        return () => {
            console.log(location)
          // Check if leaving the "test/:test_id/:question_id" route
          console.log("Starts with test", location.pathname.startsWith("/tests/"))
          if (!location.pathname.startsWith("/tests/")) {
            console.log("This is the best")
            for(let i = 0; i < testLength; i++){
                const questionResponse = sessionStorage.getItem(`${test_id}/${i+1}`)
                if(questionResponse){
                    sessionStorage.removeItem(`${test_id}/${i+1}`)
                }
               
            }
            //sessionStorage.clear();
          }
        };
      }, [location]);

      useEffect(()=>{

      }, [answer])

    useEffect(()=>{
        console.log(test_id, question_id)
        setErrorMsg("")
        
        const getQuestion = async()=>{
            setLoading(true)
            const res = await fetch(`http://127.0.0.1:5000/tests?id=${test_id}&question=${question_id}`)
            const data = await res.json()
            console.log(data.question)
            setQuestion(data.question)
            setTestLength(data.test_length)
            setQuestionType(data.question.type)
            setTestName(data.test_name)
            setLoading(false)
            console.log(test_id, question_id, sessionStorage.getItem(`${test_id}/${question_id}`))
            
            console.log(data)
        }

        getQuestion()

    },[test_id, question_id])

    const submitTest = async () => {
        try {
            // Get current user
            const user = auth.currentUser;
            if (!user) {
                setErrorMsg("Please log in to submit your test");
                return;
            }

            // Check if all questions are answered
            const allQuestionsAnswered = Array.from({ length: testLength }, (_, i) => {
                return sessionStorage.getItem(`${test_id}/${i + 1}`) !== null;
            }).every(answered => answered);

            if (!allQuestionsAnswered) {
                setErrorMsg("Please answer all questions before submitting");
                return;
            }

            // Collect all answers
            const answers = Array.from({ length: testLength }, (_, i) => {
                const answer = sessionStorage.getItem(`${test_id}/${i + 1}`);
                return {
                    question_id: i + 1,
                    answer: answer
                };
            });

            // Submit the test
            const response = await fetch("http://127.0.0.1:5000/submit-test", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    user: user.uid,  // Add the user's ID
                    test_id: test_id,
                    answers: answers
                })
            });

            if (!response.ok) {
                throw new Error("Failed to submit test");
            }

            const data = await response.json();
            
            // Clear session storage
            for (let i = 1; i <= testLength; i++) {
                sessionStorage.removeItem(`${test_id}/${i}`);
            }

            // Redirect to test results page
            navigate(`/test-results/${data.submission_id}`);
        } catch (error) {
            setErrorMsg("Error submitting test: " + error.message);
        }
    }

    const questionOptionsFormat = (type, options, selected)=>{
        switch(type){
            case "MCQ":
                return <MultipleChoice options={options} test_id={test_id} question_id={question_id} setAnswer={setAnswer}/>
            case "SAQ":
                return <ShortAnswer test_id={test_id} question_id={question_id} setResponse={setAnswer}/>
            case "SMQ":
                console.log(selected)
                return <SelectMany options={options} test_id={test_id} question_id={question_id} selected={selected} setAnswer={setAnswer}/>
            case "T/F":
                return <TrueOrFalse options={options} test_id={test_id} question_id={question_id} setAnswer={setAnswer}/>
            default:
                return null
        }
    }
    

    const nextQuestion = Number(question_id) + 1
    const previousQuestion = Number(question_id) - 1
    console.log(nextQuestion, question_id, 1)
    const links = Array.from({ length:  testLength}, (_, i) => {
    let classString = sessionStorage.getItem(`${test_id}/${i+1}`) ? "answered" : ""
    classString += classString === "" ? (i+1).toString() == question_id ? "current" : "" : (i+1).toString() == question_id ? " current" : ""

    return <Link key={i+1} to={`/tests/${test_id}/${i+1}`} className={`${
  sessionStorage.getItem(`${test_id}/${i + 1}`) ? "answered" : ""
}${(i + 1).toString() === question_id ? " current" : ""}`}>{`Question ${i+1}`}</Link>
})
    return(
        <>
        <div className="questionPageContainer">
            <div>
                <h2 className="testTitle">{testName}</h2>

                <div className="quizInstructionContainer">
                    <h2>Quiz Instructions</h2>
                    <p>Complete all questions before you submit</p>
                    <p className="errorMsg">{errorMsg}</p>
                </div>

                {
                loading ? <div style={{ marginTop: "80px", marginLeft: "5px" }}>
                <TailSpin   visible={true} height="40" width="40" color={getComputedStyle(root).getPropertyValue('--secondary-text-color').trim()} ariaLabel="tail-spin-loading" radius="1" wrapperStyle={{}} wrapperClass="loader" />
                
            </div> : <><div className="questionContainer">
                    <div className="questionContainerTitle">Question {question_id}</div>
                    <div className="questionContainerBody">
                        <p>{question && question.question}</p>
                        
                        {!loading &&  questionOptionsFormat(questionType, question.options, sessionStorage.getItem(`${test_id}/${question_id}`) ? sessionStorage.getItem(`${test_id}/${question_id}`).split("~~") : [] )}
                    </div>
                </div>
                <div className="questionContainerFooter">
                        
                        {question_id !== "1" ? <Link to={`/tests/${test_id}/${previousQuestion.toString()}`}>Previous</Link> : <div></div>}
                        {question_id !== testLength.toString() ? <Link to={`/tests/${test_id}/${nextQuestion.toString()}`}>Next</Link> : <Link to="#" onClick={()=>submitTest()}>Submit</Link>}
                </div></>
            }

                
            </div>
            <div className="questionsLinkContainer">
                <h3>Questions</h3>
                <div className="questionLinks">
                    {links}
                </div>
            </div>
        </div>
        </>
    )
}