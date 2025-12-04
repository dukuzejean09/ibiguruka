#!/usr/bin/env python3
"""
NeighborWatch Connect - Evaluation Framework
==========================================

This evaluation framework provides tools for:
1. Performance metrics collection and analysis
2. Usability testing infrastructure
3. Load testing capabilities
4. System health monitoring

Usage:
    python evaluation/run_evaluation.py --help
"""

import time
import json
import requests
import statistics
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import argparse
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class PerformanceMetrics:
    """Collect and analyze performance metrics for the NeighborWatch system."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.metrics = {
            'api_response_times': [],
            'error_rates': [],
            'throughput': [],
            'memory_usage': [],
            'timestamps': []
        }

    def measure_api_response_time(self, endpoint: str, method: str = 'GET',
                                data: Optional[Dict] = None) -> float:
        """Measure response time for an API endpoint."""
        try:
            start_time = time.time()
            if method.upper() == 'GET':
                response = requests.get(f"{self.base_url}{endpoint}", timeout=10)
            elif method.upper() == 'POST':
                response = requests.post(f"{self.base_url}{endpoint}",
                                       json=data, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")

            response_time = time.time() - start_time

            # Record metrics
            self.metrics['api_response_times'].append(response_time)
            self.metrics['error_rates'].append(1 if response.status_code >= 400 else 0)
            self.metrics['timestamps'].append(datetime.now())

            return response_time

        except Exception as e:
            print(f"Error measuring {endpoint}: {e}")
            self.metrics['api_response_times'].append(10.0)  # Max timeout
            self.metrics['error_rates'].append(1)
            self.metrics['timestamps'].append(datetime.now())
            return 10.0

    def run_load_test(self, endpoint: str, num_requests: int = 100,
                     concurrent_users: int = 10) -> Dict:
        """Run a basic load test on an endpoint."""
        print(f"Running load test: {num_requests} requests, {concurrent_users} concurrent users")

        response_times = []

        # Simple sequential load test (for basic evaluation)
        for i in range(num_requests):
            if i % 10 == 0:
                print(f"Progress: {i}/{num_requests}")

            rt = self.measure_api_response_time(endpoint)
            response_times.append(rt)
            time.sleep(0.1)  # Small delay between requests

        results = {
            'total_requests': num_requests,
            'avg_response_time': statistics.mean(response_times),
            'median_response_time': statistics.median(response_times),
            'min_response_time': min(response_times),
            'max_response_time': max(response_times),
            'error_rate': sum(1 for rt in response_times if rt >= 10.0) / num_requests,
            'requests_per_second': num_requests / sum(response_times)
        }

        return results

    def generate_report(self) -> Dict:
        """Generate a comprehensive performance report."""
        if not self.metrics['api_response_times']:
            return {"error": "No metrics collected"}

        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_measurements': len(self.metrics['api_response_times']),
                'avg_response_time': statistics.mean(self.metrics['api_response_times']),
                'median_response_time': statistics.median(self.metrics['api_response_times']),
                'error_rate': sum(self.metrics['error_rates']) / len(self.metrics['error_rates']),
                'response_time_p95': statistics.quantiles(self.metrics['api_response_times'], n=20)[18] if len(self.metrics['api_response_times']) >= 20 else max(self.metrics['api_response_times'])
            },
            'raw_metrics': self.metrics
        }

        return report

class UsabilityTesting:
    """Framework for conducting usability testing."""

    def __init__(self):
        self.questions = {
            'ease_of_use': [
                "How easy was it to report an incident?",
                "How intuitive was the navigation?",
                "How clear were the instructions?",
                "How satisfied are you with the overall experience?"
            ],
            'functionality': [
                "Did all features work as expected?",
                "Were you able to complete your tasks successfully?",
                "How reliable did the system feel?"
            ],
            'performance': [
                "How responsive was the application?",
                "How long did actions take to complete?",
                "Did you experience any delays or lag?"
            ],
            'accessibility': [
                "How accessible was the interface for different abilities?",
                "Were text sizes and colors appropriate?",
                "How usable was the mobile experience?"
            ]
        }

    def generate_questionnaire(self) -> Dict:
        """Generate a usability testing questionnaire."""
        questionnaire = {
            'title': 'NeighborWatch Connect Usability Evaluation',
            'description': 'Please rate the following aspects on a scale of 1-5 (1=Very Poor, 5=Excellent)',
            'sections': {},
            'demographics': [
                'Age group: ___18-24 ___25-34 ___35-44 ___45-54 ___55+',
                'Gender: ___Male ___Female ___Other ___Prefer not to say',
                'Technical experience: ___Beginner ___Intermediate ___Advanced',
                'Device used: ___Desktop ___Tablet ___Mobile',
                'Internet connection: ___Excellent ___Good ___Fair ___Poor'
            ]
        }

        for category, questions in self.questions.items():
            questionnaire['sections'][category] = {
                'questions': questions,
                'rating_scale': '1-5 (1=Strongly Disagree/Very Poor, 5=Strongly Agree/Excellent)'
            }

        return questionnaire

    def analyze_responses(self, responses_file: str) -> Dict:
        """Analyze usability testing responses."""
        try:
            with open(responses_file, 'r') as f:
                responses = json.load(f)
        except FileNotFoundError:
            return {"error": f"Responses file not found: {responses_file}"}

        analysis = {
            'total_responses': len(responses),
            'category_averages': {},
            'overall_satisfaction': 0
        }

        # Calculate averages per category
        for category in self.questions.keys():
            category_scores = []
            for response in responses:
                if category in response:
                    category_scores.extend(response[category].values())

            if category_scores:
                analysis['category_averages'][category] = statistics.mean(category_scores)

        # Overall satisfaction
        all_scores = []
        for response in responses:
            for category_scores in response.values():
                if isinstance(category_scores, dict):
                    all_scores.extend(category_scores.values())

        if all_scores:
            analysis['overall_satisfaction'] = statistics.mean(all_scores)

        return analysis

def main():
    parser = argparse.ArgumentParser(description='NeighborWatch Connect Evaluation Framework')
    parser.add_argument('--mode', choices=['performance', 'usability', 'load-test'],
                       default='performance', help='Evaluation mode')
    parser.add_argument('--url', default='http://localhost:8000',
                       help='Base URL for API testing')
    parser.add_argument('--endpoint', default='/docs',
                       help='API endpoint to test')
    parser.add_argument('--requests', type=int, default=50,
                       help='Number of requests for load testing')
    parser.add_argument('--output', default='evaluation_results.json',
                       help='Output file for results')

    args = parser.parse_args()

    if args.mode == 'performance':
        print("🔍 Running Performance Evaluation...")
        perf = PerformanceMetrics(args.url)

        # Test key endpoints
        endpoints = ['/docs', '/api/v1/health', '/api/v1/reports/public']
        for endpoint in endpoints:
            print(f"Testing {endpoint}...")
            perf.measure_api_response_time(endpoint)

        report = perf.generate_report()
        print(f"📊 Performance Report Generated")
        print(".2f")
        print(".2f")
        print(".1%")

    elif args.mode == 'load-test':
        print(f"⚡ Running Load Test on {args.endpoint}...")
        perf = PerformanceMetrics(args.url)
        results = perf.run_load_test(args.endpoint, args.requests)

        print("📈 Load Test Results:")
        print(f"  Total Requests: {results['total_requests']}")
        print(".2f")
        print(".2f")
        print(".1%")
        print(".1f")

        with open(args.output, 'w') as f:
            json.dump(results, f, indent=2, default=str)

    elif args.mode == 'usability':
        print("📝 Generating Usability Questionnaire...")
        usability = UsabilityTesting()
        questionnaire = usability.generate_questionnaire()

        with open('usability_questionnaire.json', 'w') as f:
            json.dump(questionnaire, f, indent=2)

        print("✅ Questionnaire saved to usability_questionnaire.json")
        print("\n📋 Next steps:")
        print("1. Distribute the questionnaire to test users")
        print("2. Collect responses in JSON format")
        print("3. Run analysis: python evaluation/run_evaluation.py --mode usability-analysis --responses responses.json")

    # Save results
    if args.mode in ['performance', 'load-test']:
        with open(args.output, 'w') as f:
            json.dump(report if args.mode == 'performance' else results,
                     f, indent=2, default=str)

        print(f"💾 Results saved to {args.output}")

if __name__ == '__main__':
    main()