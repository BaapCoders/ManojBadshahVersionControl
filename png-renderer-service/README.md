# PNG Renderer Service

A standalone Docker-based microservice for rendering Adobe Express canvas serializations to PNG images using Playwright.

## Features

- 🎨 Renders Adobe Express canvas JSON to PNG
- 🐳 Fully containerized with Docker
- 🚀 FastAPI-based REST API
- 🌐 Playwright Chromium for server-side rendering
- ✅ Health checks included

## Supported Elements

- ✅ Rectangles (with fill & stroke)
- ✅ Ellipses (with fill & stroke)
- ✅ Text (with fonts & colors)
- ⚠️ Images (rendered as gray placeholders)

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Build and start the service
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

The service will be available at: `http://localhost:9000`

### Using Docker CLI

```bash
# Build the image
docker build -t png-renderer-service .

# Run the container
docker run -d -p 9000:9000 --name png-renderer png-renderer-service

# View logs
docker logs -f png-renderer

# Stop and remove
docker stop png-renderer
docker rm png-renderer
```

### Local Development (Without Docker)

```bash
# Install dependencies
pip install -r requirements.txt

# Install Playwright browser
playwright install chromium

# Run the service
python app.py
```

## API Endpoints

### `GET /`
Health check endpoint.

**Response:**
```json
{
  "status": "running",
  "service": "PNG Renderer Service",
  "version": "1.0.0"
}
```

### `POST /render`
Render canvas JSON to PNG.

**Request Body:**
```json
{
  "serializedState": "{\"pages\":[{\"children\":[...]}]}",
  "width": 1080,
  "height": 1080
}
```

**Response:**
- Content-Type: `image/png`
- Body: PNG image binary

**Example with cURL:**
```bash
curl -X POST http://localhost:9000/render \
  -H "Content-Type: application/json" \
  -d '{
    "serializedState": "{\"pages\":[{\"children\":[{\"type\":\"Rectangle\",\"width\":100,\"height\":100,\"fill\":{\"red\":1,\"green\":0,\"blue\":0,\"alpha\":1}}]}]}",
    "width": 1080,
    "height": 1080
  }' \
  --output rendered.png
```

## Integration with Node.js Backend

Update your `nodejs-server/src/config.ts`:

```typescript
python: {
  serverUrl: process.env.PYTHON_SERVER_URL || 'http://localhost:9000',
}
```

Update your `nodejs-server/.env`:

```env
PYTHON_SERVER_URL=http://localhost:9000
```

## Architecture

```
┌─────────────────────┐
│   Node.js Backend   │
└──────────┬──────────┘
           │ POST /render
           │ { serializedState: "..." }
           ↓
┌─────────────────────┐
│  PNG Renderer       │
│  (Docker Container) │
│  Port: 9000         │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │  Playwright  │
    │  Chromium    │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │   PNG Image  │
    └─────────────┘
```

## Performance

- **Typical rendering time:** 1-3 seconds
- **Output size:** 50-200 KB (1080x1080 PNG)
- **Timeout:** 10 seconds

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `INFO` | Logging level |

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs

# Rebuild without cache
docker-compose build --no-cache
```

### Rendering timeout
- Increase timeout in `app.py` (line with `timeout=10000`)
- Check if JSON is valid

### Out of memory
- Increase Docker memory limit:
  ```yaml
  services:
    png-renderer:
      mem_limit: 2g
  ```

## Development

### Running Tests
```bash
# Test the render endpoint
curl -X POST http://localhost:9000/render \
  -H "Content-Type: application/json" \
  -d @test-canvas.json \
  --output test-output.png
```

### Rebuilding
```bash
docker-compose up -d --build
```

## Production Deployment

### Docker Swarm
```bash
docker stack deploy -c docker-compose.yml png-renderer
```

### Kubernetes
See `k8s/` folder for deployment manifests (create if needed).

### Cloud Run (GCP)
```bash
gcloud run deploy png-renderer-service \
  --source . \
  --port 9000 \
  --allow-unauthenticated
```

## Monitoring

Health check endpoint: `GET /health`

Returns `200 OK` with `{"status": "healthy"}` when service is operational.

## License

MIT

## Support

For issues or questions, open an issue in the main repository.
