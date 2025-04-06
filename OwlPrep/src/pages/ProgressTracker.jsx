import React, { useEffect } from "react";

export default function ProgressTracker() {
    return (
        <div id = "progress-tracker">
            <h1>Progress Tracker</h1>
            <p>Track your progress here</p>

            <div>
                <h3>Scores in tests</h3>
            </div>
            <div>
                <h3>Scores in quizzes</h3>
            </div>
            <div>
                <h3>Best Performance in Topics</h3>
                <p>Topic 1</p>
                <p>Topic 2</p>
                <p>Topic 3</p>
                
            </div>
            <div>
                <h3>Worst Performance in Topics</h3>
                <p>Topic 1</p>
                <p>Topic 2</p>
                <p>Topic 3</p>
                
            </div>  
            <div>
                <h3>Test & Quiz History</h3>
                <button>Test 1</button>
                <button>Test 2</button>
                <button>Test 3</button>
                <button>Quiz 1</button>
                <button>Quiz 2</button>
            </div>
        </div>
        
    )
}