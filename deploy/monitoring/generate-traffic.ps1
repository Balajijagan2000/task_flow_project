# TaskFlow Traffic Generator
# Simulates live HTTP user activity to populate Prometheus metrics and Grafana graphs

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Starting TaskFlow Traffic Simulation Loop" -ForegroundColor Cyan
Write-Host "Press Ctrl + C to stop generating traffic." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

$iteration = 1

while ($true) {
    try {
        # 1. Health checks
        Invoke-RestMethod -Uri "http://localhost:8081/actuator/health" -Method Get -TimeoutSec 2 | Out-Null
        Invoke-RestMethod -Uri "http://localhost:8082/actuator/health" -Method Get -TimeoutSec 2 | Out-Null
        Invoke-RestMethod -Uri "http://localhost:8083/actuator/health" -Method Get -TimeoutSec 2 | Out-Null

        # 2. Scrape metric endpoints
        Invoke-RestMethod -Uri "http://localhost:8081/actuator/prometheus" -Method Get -TimeoutSec 2 | Out-Null
        Invoke-RestMethod -Uri "http://localhost:8082/actuator/prometheus" -Method Get -TimeoutSec 2 | Out-Null
        Invoke-RestMethod -Uri "http://localhost:8083/actuator/prometheus" -Method Get -TimeoutSec 2 | Out-Null

        # 3. Simulate API calls
        Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Iteration $iteration: Sent HTTP requests across microservices" -ForegroundColor Green
    }
    catch {
        Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] Waiting for services: $($_.Exception.Message)" -ForegroundColor DarkGray
    }

    $iteration++
    Start-Sleep -Milliseconds 500
}
