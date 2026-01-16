# 🧪 Version Control Testing Checklist

## Pre-Flight Checks

### ✅ Dependencies Installed
- [x] Node.js packages: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `multer`, `sharp`
- [x] Python packages: `playwright`, `deep-translator`
- [x] Chromium browser: `python -m playwright install chromium`

### ✅ Configuration
- [x] `.env` file exists in `nodejs-server/`
- [x] AWS credentials configured:
  - AWS_ACCESS_KEY_ID: `AKIAXK4S2ACCNTFCQAM2`
  - AWS_REGION: `ap-south-1`
  - AWS_S3_BUCKET_NAME: `manoj-badshah-adobe-express-hack-bucket`

### ✅ Build Status
- [x] Backend builds successfully: `npm run build` ✅

---

## Testing Steps

### 1️⃣ Start All Services

**Terminal 1 - Python Server:**
```bash
cd python-server
python server.py
```
✅ Expected output: `Uvicorn running on http://127.0.0.1:8000`

**Terminal 2 - Node.js Server:**
```bash
cd nodejs-server
npm run dev
```
✅ Expected output: `🚀 Server running on http://localhost:8080`

**Terminal 3 - React Client:**
```bash
cd react-client
npm run start
```
✅ Expected output: Adobe Express addon loads

---

### 2️⃣ Test Version Save

1. **Create a design in Adobe Express:**
   - Open the addon
   - Go to Generate tab
   - Add some shapes (rectangles, circles)
   - Add text
   - Choose colors

2. **Save the version:**
   - Click "Save New Version" button
   - Enter commit message (optional)
   - Click "Save"

3. **Monitor logs:**
   
   **Browser Console:**
   ```
   💾 Saving new version for design X...
   📝 Serializing canvas state...
   🧪 Testing native export APIs...
   💾 Saving to backend (will generate PNG and upload to S3)...
   ✅ Version X saved with preview URL: https://...s3.amazonaws.com/...png
   ```

   **Node.js Terminal:**
   ```
   📸 Generating PNG preview for V1...
   🎨 Rendering canvas via Python server...
   ✅ Rendered PNG: XXXXX bytes
   ☁️ Uploading to S3...
   📤 Uploading to S3: designs/X/versions/v1-...png
   ✅ Uploaded successfully: https://...s3.amazonaws.com/...png
   ✅ Version 1 created with preview URL
   ```

   **Python Terminal:**
   ```
   INFO: Rendering canvas: 1080x1080
   INFO: Canvas rendered successfully
   ```

4. **Verify S3:**
   - Go to AWS S3 Console
   - Navigate to bucket: `manoj-badshah-adobe-express-hack-bucket`
   - Check folder: `designs/X/versions/`
   - Verify PNG file exists: `v1-...png`

---

### 3️⃣ Test Version History Display

1. **Navigate to Feed tab**
2. **Verify PNG thumbnail:**
   - PNG image displayed (24x24px)
   - "📸 S3" badge visible
   - Version info shown (V1, commit message, date)

3. **Test fallback:**
   - If image fails to load, "No Preview" placeholder shows

---

### 4️⃣ Test Version Restore

1. **Create Version 2:**
   - Make changes to the design
   - Save another version

2. **Restore Version 1:**
   - Click "Restore" button on V1
   - Monitor logs:
     ```
     [versionService] 🔄 Step A: Fetching versions...
     [versionService] ✅ Step B: Got response, status: 200
     [versionService] ✅ Step C: Parsed 2 versions
     [versionService] 🔍 Step D: Target version found: YES
     [versionService] ✅ Step F: Has serializedState
     [versionService] 🔄 Step I: Calling sandbox.restoreFromJson...
     🔄 Restoring canvas from JSON...
     ✅ Canvas restored successfully
     ```

3. **Verify restoration:**
   - Canvas shows V1 design
   - Shapes, text, colors restored
   - Images show as gray placeholders (expected)

---

### 5️⃣ Test Native Export APIs (Informational)

1. **Check browser console during save:**
   ```
   🔬 Testing Adobe Express Native Export APIs...
   ✅ addOnUISdk available
   ✅ addOnUISdk.app available
   ❌ addOnUISdk.app.document not available  (or similar)
   ```

2. **Review test results:**
   - Check which export methods are available
   - Currently expects: Most methods NOT available
   - Future: Adobe may add `createRendition()`, `exportPage()`, etc.

---

## Expected Results

### ✅ Success Criteria:
- [x] Version saves without errors
- [x] PNG appears in S3 bucket
- [x] Thumbnail displays in Feed tab
- [x] Restore reconstructs canvas
- [x] All services running without crashes

### ⚠️ Known Issues (Expected):
- Images render as gray placeholders (bitmap data not serialized)
- HTML Canvas rendering may differ slightly from Adobe's
- 2-5 second delay for PNG generation

### ❌ Failure Scenarios:

**Python Server Error:**
- Symptom: "Connection refused to http://127.0.0.1:8000"
- Fix: Ensure Python server is running

**S3 Upload Error:**
- Symptom: "Access Denied" or "Bucket not found"
- Fix: Check AWS credentials and bucket name in `.env`

**Rendering Timeout:**
- Symptom: "Timeout after 30s"
- Fix: Check if serializedState JSON is valid

**No Thumbnail:**
- Symptom: "No Preview" placeholder always shows
- Fix: Check S3 bucket CORS settings and public access

---

## Debug Commands

**Check S3 file exists:**
```bash
aws s3 ls s3://manoj-badshah-adobe-express-hack-bucket/designs/ --recursive
```

**Test Python render endpoint:**
```bash
curl -X POST http://127.0.0.1:8000/render \
  -H "Content-Type: application/json" \
  -d '{"serializedState": "{\"pages\":[]}", "width": 1080, "height": 1080}' \
  --output test.png
```

**Check Node.js health:**
```bash
curl http://localhost:8080/health
# Expected: "OK"
```

---

## Performance Benchmarks

**Expected Timings:**
- Serialization: < 500ms
- Python rendering: 1-3 seconds
- S3 upload: 500ms - 2 seconds
- Total save time: 2-6 seconds

**File Sizes:**
- Serialized JSON: 5-50 KB
- Rendered PNG: 50-200 KB
- Database record: < 1 KB

---

## Next Steps After Testing

1. **If all tests pass:**
   - System is ready for production use
   - Document any edge cases found
   - Consider optimizations (PNG compression, caching)

2. **If tests fail:**
   - Check logs for specific errors
   - Verify all dependencies installed
   - Confirm AWS credentials valid
   - Review `SETUP_VERSION_CONTROL.md` for troubleshooting

3. **Future enhancements:**
   - Monitor for Adobe Express native export API updates
   - Replace `exportTest.ts` results with actual implementation
   - Add image data serialization for full fidelity
   - Implement PNG compression before S3 upload

---

## 📝 Test Log

**Date:** ___________  
**Tester:** ___________

| Test | Status | Notes |
|------|--------|-------|
| Python server starts | ☐ Pass ☐ Fail | |
| Node.js server starts | ☐ Pass ☐ Fail | |
| Version save | ☐ Pass ☐ Fail | |
| PNG in S3 | ☐ Pass ☐ Fail | |
| Thumbnail display | ☐ Pass ☐ Fail | |
| Version restore | ☐ Pass ☐ Fail | |
| Export API test | ☐ Pass ☐ Fail | |

**Overall Status:** ☐ ✅ Ready for Use ☐ ⚠️ Needs Fixes ☐ ❌ Blocked

**Issues Found:**
_________________________________
_________________________________
_________________________________
