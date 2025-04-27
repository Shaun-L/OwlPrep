import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardContent } from '@mui/material';

const performance = [
    { topic: "Networking", performance: 90 },
    { topic: "Game theory", performance: 85 },
    { topic: "Cybersecurity", performance: 95 },
    { topic: "Machine Learning", performance: 80 },
];

export default function ProgressTracker() {
    
    
    return (
        
        <div id = "progress-tracker" >
            
            <h1>Progress Tracker</h1>
            <p>Track your progress here</p>
            <div className="pt-container">
                <div className="pt-container-middle">
                    <div className="pt-testScoreGraph">
                        <h3>Scores in tests</h3>
                        <Card>
                            <CardHeader title="Scores in tests" />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={performance} width={500} height={300}>
                                        <XAxis dataKey="topic" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="performance" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="pt-quizScoreGraph">
                        <h3>Scores in quizzes</h3>
                        <Card>
                            <CardHeader title="Scores in quizzes" />
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={performance} width={"25%"} height={300}>
                                        <XAxis dataKey="topic" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="performance" fill="#82ca9d" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="pt-bestPerformance">
                        <h3>Best Performance in Topics</h3>
                        <p className="pt-button-btopic">Topic 1</p>
                        <p className="pt-button-btopic">Topic 2</p>
                        <p className="pt-button-btopic">Topic 3</p>
                        
                    </div>
                    <div className="pt-worstPerformance">
                        <h3>Worst Performance in Topics</h3>
                        <p className="pt-button-wtopic">Topic 1</p>
                        <p className="pt-button-wtopic">Topic 2</p>
                        <p className="pt-button-wtopic">Topic 3</p>
                        
                    </div>  
                </div>
                <div className="pt-container-right">
                    <div className="pt-testHistory">
                        <h3>Test & Quiz History</h3>
                        <button className="pt-button">Test 1</button>
                        <button className="pt-button">Test 2</button>
                        <button className="pt-button">Test 3</button>
                        <button className="pt-button">Quiz 1</button>
                        <button className="pt-button">Quiz 2</button>
                    </div>
                </div>
            </div>
            
        </div>
        
        
    )
}