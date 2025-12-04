import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const EvaluationDashboard = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [usabilityData, setUsabilityData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvaluationData();
  }, []);

  const loadEvaluationData = async () => {
    try {
      // Load performance metrics
      const perfResponse = await fetch("/evaluation_results.json");
      if (perfResponse.ok) {
        const perfData = await perfResponse.json();
        setPerformanceData(perfData);
      }

      // Load usability analysis
      const usabilityResponse = await fetch("/usability_analysis.json");
      if (usabilityResponse.ok) {
        const usabilityData = await usabilityResponse.json();
        setUsabilityData(usabilityData);
      }
    } catch (error) {
      console.error("Error loading evaluation data:", error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          System Evaluation Dashboard
        </h1>
        <p className="text-slate-400">
          Performance metrics and usability analysis for NeighborWatch Connect
        </p>
      </div>

      {/* Performance Metrics Section */}
      {performanceData && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            Performance Metrics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Avg Response Time
              </h3>
              <p className="text-2xl font-bold text-blue-400">
                {(performanceData.summary?.avg_response_time * 1000).toFixed(0)}
                ms
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Error Rate
              </h3>
              <p className="text-2xl font-bold text-red-400">
                {(performanceData.summary?.error_rate * 100).toFixed(1)}%
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                95th Percentile
              </h3>
              <p className="text-2xl font-bold text-green-400">
                {(performanceData.summary?.response_time_p95 * 1000).toFixed(0)}
                ms
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Total Measurements
              </h3>
              <p className="text-2xl font-bold text-purple-400">
                {performanceData.summary?.total_measurements}
              </p>
            </div>
          </div>

          {/* Response Time Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">
              Response Time Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={
                  performanceData.raw_metrics?.api_response_times?.map(
                    (time, index) => ({
                      request: index + 1,
                      time: time * 1000,
                    })
                  ) || []
                }
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="request" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F2937",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="time" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Usability Analysis Section */}
      {usabilityData && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-6">
            Usability Analysis
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Overall Satisfaction
              </h3>
              <p className="text-2xl font-bold text-yellow-400">
                {usabilityData.overall_satisfaction?.toFixed(1)}/5
              </p>
            </div>

            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-2">
                Total Responses
              </h3>
              <p className="text-2xl font-bold text-green-400">
                {usabilityData.total_responses}
              </p>
            </div>
          </div>

          {/* Category Averages Chart */}
          {usabilityData.category_averages && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Average Scores by Category
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(usabilityData.category_averages).map(
                    ([category, score]) => ({
                      category:
                        category.charAt(0).toUpperCase() + category.slice(1),
                      score: score,
                    })
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="category" stroke="#9CA3AF" />
                  <YAxis domain={[0, 5]} stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="score" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Evaluation Actions */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold text-white mb-6">Evaluation Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() =>
              window.open("/evaluation/run_evaluation.py", "_blank")
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            Run Performance Test
          </button>

          <button
            onClick={() =>
              window.open("/usability_questionnaire.json", "_blank")
            }
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            View Usability Questionnaire
          </button>

          <button
            onClick={() => loadEvaluationData()}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors"
          >
            Refresh Data
          </button>
        </div>

        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">
            Command Line Usage
          </h3>
          <div className="space-y-2 text-sm text-slate-300 font-mono">
            <div># Run performance evaluation</div>
            <div className="text-blue-400">
              python evaluation/run_evaluation.py --mode performance
            </div>

            <div># Run load test</div>
            <div className="text-green-400">
              python evaluation/run_evaluation.py --mode load-test --requests
              100
            </div>

            <div># Generate usability questionnaire</div>
            <div className="text-purple-400">
              python evaluation/run_evaluation.py --mode usability
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationDashboard;
