import React, { useState } from "react";
import Chart from 'chart.js/auto';
import { CategoryScale } from "chart.js/auto";
import BarChart from "../components/BarChart";

Chart.register(CategoryScale);

const data = [
    { year: 2016, userGain: 800 },
    { year: 2017, userGain: 456 },
    { year: 2018, userGain: 123 },
    { year: 2019, userGain: 967 },
    { year: 2020, userGain: 345 }
];

export default function ProgressTracker() {
    const [chartData] = useState({
        labels: data.map((d) => d.year),
        datasets: [
          {
            label: "Users Gained",
            data: data.map((d) => d.userGain),
            backgroundColor: [
              "rgba(75,192,192,1)",
              "#ecf0f1",
              "#50AF95",
              "#f3ba2f",
              "#2a71d0"
            ],
            borderColor: "black",
            borderWidth: 2
          }
        ]
    });
    
    return (
        
        <div id = "progress-tracker">
            
                <h1>Progress Tracker</h1>
                <p>Track your progress here</p>

                <div className="testScoreGraph">
                    <h3>Scores in tests</h3>
                    //<BarChart ChartData={{chartData}}/>
                </div>
                <div className="quizScoreGraph">
                    <h3>Scores in quizzes</h3>
                    <canvas id="quizScoreGraph" width="400" height="400"></canvas>
                </div>
                <div className="bestPerformance">
                    <h3>Best Performance in Topics</h3>
                    <p>Topic 1</p>
                    <p>Topic 2</p>
                    <p>Topic 3</p>
                    
                </div>
                <div className="worstPerformance">
                    <h3>Worst Performance in Topics</h3>
                    <p>Topic 1</p>
                    <p>Topic 2</p>
                    <p>Topic 3</p>
                    
                </div>  
                <div>
                    <h3>Test & Quiz History</h3>
                    <button type="button">Test 1</button>
                    <button type="button">Test 2</button>
                    <button type="button">Test 3</button>
                    <button type="button">Quiz 1</button>
                    <button type="button">Quiz 2</button>
                </div>
            
        </div>
        
        
    )
}