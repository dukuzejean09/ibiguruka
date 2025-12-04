# NeighborWatch Connect - Evaluation Framework

This evaluation framework provides comprehensive tools for assessing the performance and usability of the NeighborWatch Connect system.

## Overview

The evaluation framework includes:

- **Performance Testing**: Automated API response time measurement and load testing
- **Usability Assessment**: Structured questionnaire generation and response analysis
- **Metrics Dashboard**: Visual representation of evaluation results
- **Health Monitoring**: System health checks and status monitoring

## Quick Start

### 1. Run Performance Evaluation

```bash
cd evaluation
python run_evaluation.py --mode performance --url http://localhost:8000
```

### 2. Generate Usability Questionnaire

```bash
python run_evaluation.py --mode usability
```

### 3. Run Load Testing

```bash
python run_evaluation.py --mode load-test --requests 100 --endpoint /api/v1/reports/public
```

### 4. View Results Dashboard

Access the evaluation dashboard at `/admin/evaluation` in the admin panel.

## Performance Metrics

The framework measures:

- **Response Times**: Average, median, and 95th percentile response times
- **Error Rates**: Percentage of failed requests
- **Throughput**: Requests per second under load
- **System Health**: Database connectivity and API availability

### Sample Performance Report

```json
{
  "summary": {
    "total_measurements": 50,
    "avg_response_time": 0.234,
    "median_response_time": 0.198,
    "error_rate": 0.02,
    "response_time_p95": 0.456
  }
}
```

## Usability Testing

### Questionnaire Categories

1. **Ease of Use**: Navigation, instructions, overall experience
2. **Functionality**: Feature completeness, task completion, reliability
3. **Performance**: Responsiveness, loading times, user experience
4. **Accessibility**: Interface usability, text sizes, mobile experience

### Response Analysis

The framework analyzes responses to provide:

- Category-wise average scores
- Overall satisfaction rating
- Response distribution statistics

## Evaluation Dashboard

The admin panel includes an evaluation dashboard that displays:

- **Performance Charts**: Response time distributions and error rates
- **Usability Scores**: Category averages and overall satisfaction
- **Interactive Visualizations**: Bar charts, line graphs, and pie charts
- **Real-time Updates**: Refresh data from evaluation runs

## Command Line Options

```
usage: run_evaluation.py [-h] [--mode {performance,usability,load-test}]
                        [--url URL] [--endpoint ENDPOINT]
                        [--requests REQUESTS] [--output OUTPUT]

NeighborWatch Connect Evaluation Framework

options:
  -h, --help           show this help message and exit
  --mode {performance,usability,load-test}
                       Evaluation mode
  --url URL            Base URL for API testing (default: http://localhost:8000)
  --endpoint ENDPOINT  API endpoint to test (default: /docs)
  --requests REQUESTS  Number of requests for load testing (default: 50)
  --output OUTPUT      Output file for results (default: evaluation_results.json)
```

## File Structure

```
evaluation/
├── run_evaluation.py          # Main evaluation script
├── README.md                  # This documentation
├── usability_questionnaire.json  # Generated questionnaire (after running)
├── evaluation_results.json       # Performance results (after running)
└── usability_analysis.json      # Usability analysis (after collecting responses)
```

## Integration with CI/CD

Add to your CI/CD pipeline:

```yaml
- name: Run Performance Tests
  run: |
    cd evaluation
    python run_evaluation.py --mode performance --output performance.json

- name: Run Load Tests
  run: |
    python run_evaluation.py --mode load-test --requests 200 --output load_test.json
```

## Interpreting Results

### Performance Benchmarks

- **Response Time**: < 500ms for good performance
- **Error Rate**: < 5% acceptable for production
- **Throughput**: > 10 requests/second for basic load

### Usability Scores

- **4.0+**: Excellent user experience
- **3.0-4.0**: Good, minor improvements needed
- **2.0-3.0**: Average, significant improvements needed
- **< 2.0**: Poor, major redesign required

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the API server is running on the specified URL
2. **Import Errors**: Install required Python packages: `pip install requests`
3. **Chart Not Loading**: Ensure recharts is installed in the frontend

### Debug Mode

Run with verbose output:

```bash
python run_evaluation.py --mode performance --url http://localhost:8000
```

## Contributing

When adding new evaluation metrics:

1. Update the `PerformanceMetrics` or `UsabilityTesting` classes
2. Add corresponding visualization to the dashboard
3. Update this README with new features
4. Test with both local and production environments

## Future Enhancements

- Automated comparative analysis between versions
- Integration with external monitoring services
- Advanced load testing with concurrent users
- A/B testing framework for UI improvements
- Automated report generation and email notifications
