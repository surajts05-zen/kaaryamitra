Write-Host "Starting Docker services (Redis and Postgres)..." -ForegroundColor Blue
docker compose up -d redis postgres
Write-Host ""
Write-Host "Starting KaaryaMitra Frontend and Backend..." -ForegroundColor Green
npm run dev
