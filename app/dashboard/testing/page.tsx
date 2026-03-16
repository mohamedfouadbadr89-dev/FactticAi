'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Stub components replacing complex interactive runners
function DatasetEvaluationChart() {
    return (
        <div className="p-4 bg-gray-900 rounded-xl mb-4 text-white">
            <h3 className="text-xl mb-2 font-bold font-inter text-blue-400">Dataset Evaluation Risk Metrics</h3>
            <div className="h-32 bg-gray-800 rounded animate-pulse w-full"></div>
            <p className="mt-2 text-sm text-gray-400">Loading correlation statistics (Accuracy, Hallucinations, Violations)...</p>
        </div>
    )
}

function DatasetRunner({ onRunComplete }: { onRunComplete: () => void }) {
    const [running, setRunning] = useState(false);
    
    const handleRun = async () => {
        setRunning(true);
        try {
            await fetch('/api/testing/run-dataset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset: 'customer_support_eval',
                    model: 'gpt-4'
                })
            });
            onRunComplete();
        } catch (e) {
            console.error(e);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="p-4 bg-gray-900 rounded-xl text-white">
            <h3 className="text-xl mb-2 font-bold font-inter text-green-400">Golden Dataset Regression Engine</h3>
            <p className="text-sm text-gray-400 mb-4">Run comprehensive JSON datasets through the Facttic pipeline. (Current: customer_support_eval.json)</p>
            <button 
                onClick={handleRun} 
                className={`px-4 py-2 rounded font-bold ${running ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'}`}
                disabled={running}
            >
                {running ? 'Executing Suite...' : 'Run Dataset (gpt-4)'}
            </button>
        </div>
    )
}

function ScenarioBatchRunner() {
    const [running, setRunning] = useState(false);

    return (
        <div className="p-4 bg-gray-900 rounded-xl text-white">
            <h3 className="text-xl mb-2 font-bold font-inter text-purple-400">Scenario Simulation Batch Runner</h3>
            <p className="text-sm text-gray-400 mb-4">Execute high-throughput simulated scenarios against the detection core.</p>
            <button 
                onClick={() => { setRunning(true); setTimeout(() => setRunning(false), 2000); }} 
                className={`px-4 py-2 rounded font-bold ${running ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'}`}
                disabled={running}
            >
                {running ? 'Fuzzing Scenarios...' : 'Run 50x Scenario Bundle'}
            </button>
        </div>
    )
}

function EvaluationRunsTable({ logs }: { logs: any[] }) {
    return (
        <div className="p-4 bg-gray-900 rounded-xl mt-4 text-white overflow-x-auto">
            <h3 className="text-xl mb-2 font-bold font-inter text-blue-400">Latest Evaluation Execution Logs</h3>
            <table className="w-full text-left border-collapse mt-4">
                <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                        <th className="p-2">Dataset / Scenario</th>
                        <th className="p-2">Model</th>
                        <th className="p-2 text-right">Risk Score Avg</th>
                        <th className="p-2 text-center">Hallucinations</th>
                        <th className="p-2 text-center">Policy Status</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {logs.map((log) => (
                        <tr key={log.id} className="border-b border-gray-800">
                            <td className="p-2">{log.dataset_name || log.scenario}</td>
                            <td className="p-2">{log.model}</td>
                            <td className="p-2 text-right font-mono text-green-400">{Number(log.risk_score).toFixed(2)}</td>
                            <td className="p-2 text-center">{log.hallucination_flag ? 'Yes' : 'No'}</td>
                            <td className="p-2 text-center">
                                {log.policy_violation ? (
                                    <span className="bg-red-900 text-red-300 px-2 py-1 rounded">Failed</span>
                                ) : (
                                    <span className="bg-green-900 text-green-300 px-2 py-1 rounded">Passed</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    {logs.length === 0 && (
                        <tr>
                            <td colSpan={5} className="p-4 text-center text-gray-500">No evaluation logs available. Run a dataset to populate.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

export default function TestingDashboardPage() {
    const [logs, setLogs] = useState<any[]>([]);

    const fetchLogs = async () => {
        const { data, error } = await supabase
            .from("evaluation_runs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20);
            
        if (data && !error) {
            setLogs(data);
        } else if (error) {
            console.error("Failed to fetch logs:", error);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    return (
        <div className="p-8 max-w-7xl mx-auto h-screen bg-black overflow-y-auto">
            <h1 className="text-3xl text-white font-bold mb-6 font-inter border-b border-gray-800 pb-4">Evaluation & Prompt Security Diagnostics</h1>
            <DatasetEvaluationChart />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatasetRunner onRunComplete={fetchLogs} />
                <ScenarioBatchRunner />
            </div>
            <EvaluationRunsTable logs={logs} />
        </div>
    );
}
