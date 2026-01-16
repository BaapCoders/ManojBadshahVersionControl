# 🚀 Quick Start Commands

## Start All Services (3 Terminals + Docker)

### Terminal 1: PNG Renderer (Docker)
```bash
cd png-renderer-service
docker-compose up -d
docker-compose logs -f
```
**Expected:** `INFO: Uvicorn running on http://0.0.0.0:9000`

### Terminal 2: Python Server (Original - for localization/assets)
```bash
cd python-server
python server.py
```
**Expected:** `Uvicorn running on http://127.0.0.1:8000`

### Terminal 3: Node.js Server
```bash
cd nodejs-server
npm run dev
```
**Expected:** `🚀 Server running on http://localhost:8080`

### Terminal 4: React Client
```bash
cd react-client
npm run start
```
**Expected:** Adobe Express addon loads

---

## Quick Test

### Test Save Version:
1. Open Adobe Express addon
2. Go to "Generate" tab
3. Click "Save New Version"
4. Check logs for ✅ success messages

### Test Restore:
1. Go to "Feed" tab
2. Click "Restore" on any version
3. Canvas should update

---

## Debug Commands

### Check Services Status:
```bash
# Test PNG Renderer
curl http://localhost:9000/health

# Test Python Server (original)
curl http://127.0.0.1:8000/

# Test Node.js
curl http://localhost:8080/health

# Test database connection
cd nodejs-server
npx prisma studio
```

### View Docker Logs:
```bash
cd png-renderer-service
docker-compose logs -f
```

### View S3 Files:
```bash
aws s3 ls s3://manoj-badshah-adobe-express-hack-bucket/designs/ --recursive
```

### Rebuild Backend:
```bash
cd nodejs-server
npm run build
```

---

## Common Issues

### Docker container won't start
```bash
cd png-renderer-service
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Python "Module not found"
```bash
cd python-server
pip install -r requirements.txt
```

### Node.js "Cannot find module"
```bash
cd nodejs-server
npm install
```

### S3 Upload Fails
- Check `.env` has correct AWS credentials
- Verify bucket name: `manoj-badshah-adobe-express-hack-bucket`

### PNG Rendering Fails
- Check Docker container is running: `docker ps`
- Check logs: `cd png-renderer-service && docker-compose logs`

---

## Stop All Services
```bash
# Stop Docker
cd png-renderer-service
docker-compose down

# Stop Python server
Press Ctrl+C in python-server terminal

# Stop Node.js server
Press Ctrl+C in nodejs-server terminal

# Stop React client
Press Ctrl+C in react-client terminal
```
