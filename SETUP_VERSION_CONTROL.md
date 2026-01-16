# Version Control Redesign - Setup Instructions

## Overview
The version control system has been redesigned to use **PNG Export → AWS S3 Storage → Thumbnail-based Version History**.

### Key Changes:
- ✅ Removed page cloning (no more hidden snapshot pages)
- ✅ Added server-side PNG rendering via Python + Playwright
- ✅ Added AWS S3 upload for version previews
- ✅ Version history now displays PNG thumbnails
- ✅ Added native export API testing (for future Adobe updates)

## Setup Steps

### 1. Install Python Dependencies
```bash
cd python-server
pip install -r requirements.txt
playwright install chromium
```

### 2. Configure AWS S3
1. Create an S3 bucket in AWS Console
2. Set bucket permissions (public read or presigned URLs)
3. Get AWS credentials (Access Key ID and Secret Access Key)
4. Update `.env` file in nodejs-server:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
```

### 3. Install Node.js Dependencies
```bash
cd nodejs-server
npm install
# New packages: @aws-sdk/client-s3, @aws-sdk/s3-request-presigner, multer, sharp
```

### 4. Start Services

**Terminal 1 - Python Server:**
```bash
cd python-server
python server.py
# Running on http://127.0.0.1:8000
```

**Terminal 2 - Node.js Server:**
```bash
cd nodejs-server
npm run dev
# Running on http://localhost:8080
```

**Terminal 3 - React Client:**
```bash
cd react-client
npm run start
# Adobe Express addon
```

## How It Works

### Save Version Flow:
1. User clicks "Save Version" in Generate tab
2. Frontend serializes canvas to JSON via `serializeCanvas()`
3. Frontend tests native export APIs (informational, for future use)
4. Frontend sends JSON to backend POST `/api/designs/:id/versions`
5. Backend sends JSON to Python server POST `/render`
6. Python uses Playwright to render HTML canvas → PNG
7. Backend uploads PNG to S3 via `uploadVersionPNG()`
8. Backend saves version with S3 `previewUrl` in database
9. Frontend receives version with preview URL

### Restore Version Flow:
1. User clicks "Restore" in Feed tab
2. Frontend fetches version from backend (includes `previewUrl` and `serializedState`)
3. Frontend displays PNG thumbnail for confirmation
4. Frontend calls `restoreFromJson()` to reconstruct canvas from JSON
5. Canvas is restored with all nodes (images shown as gray placeholders)

## New Files Created

### Backend:
- `nodejs-server/src/services/s3Upload.service.ts` - S3 upload service
- `nodejs-server/src/config.ts` - Updated with AWS config

### Frontend:
- `react-client/src/features/exportTest.ts` - Native export API testing

### Python:
- `python-server/server.py` - Added `/render` endpoint

## API Endpoints

### New Backend Route:
- `POST /api/designs/:id/versions` - Now generates PNG and uploads to S3

### New Python Route:
- `POST /render` - Renders canvas JSON to PNG
  ```json
  {
    "serializedState": "...",
    "width": 1080,
    "height": 1080
  }
  ```

## Database Schema
No changes needed - `previewUrl` field already exists in `DesignVersion` model.

## Testing

1. **Test Native Export APIs:**
   - Open browser console in Adobe Express addon
   - Check logs for export test results
   - Currently logs available methods for future use

2. **Test PNG Generation:**
   - Create a design with shapes and text
   - Click "Save Version"
   - Check terminal logs for:
     - ✅ Serialization
     - ✅ Python rendering
     - ✅ S3 upload
   - Verify S3 bucket has PNG file

3. **Test Version History:**
   - Go to Feed tab
   - Verify PNG thumbnails display
   - Click "Restore" to test restoration

## Troubleshooting

### Python Server Issues:
- **Error: Playwright not installed**
  ```bash
  playwright install chromium
  ```

- **Error: Rendering timeout**
  - Check if canvas JSON is valid
  - Increase timeout in `server.py` (currently 5000ms)

### S3 Upload Issues:
- **Error: Access Denied**
  - Check AWS credentials in `.env`
  - Verify IAM policy has `s3:PutObject` permission

- **Error: Bucket not found**
  - Verify bucket name matches `.env`
  - Check bucket region

### No Preview Image:
- Check backend logs for rendering/upload errors
- Verify Python server is running
- Check S3 bucket CORS settings if using presigned URLs

## Cost Considerations (Skipped per user request)
Using public S3 bucket or presigned URLs. No optimization for storage costs at this time.

## Future Enhancements

1. **Native Export API Support:**
   - When Adobe adds export APIs, replace Python rendering
   - `exportTest.ts` already tests for available methods

2. **Image Handling:**
   - Currently images render as gray placeholders
   - Future: Extract and store actual image data

3. **Optimization:**
   - PNG compression before upload
   - Thumbnail generation (smaller file size)
   - S3 lifecycle policies for archival

## Migration from Old System

Old versions without `previewUrl` will show "No Preview" placeholder. New versions will have PNG thumbnails.

No data migration needed - system is backward compatible.
