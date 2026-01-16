import io
import json
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
from PIL import Image
from playwright.async_api import async_playwright

# ---------------- Logging ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- App ----------------
app = FastAPI(title="PNG Renderer Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- Models ----------------
class RenderRequest(BaseModel):
    serializedState: str
    width: int = 1080
    height: int = 1080

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

# ---------------- Routes ----------------
@app.get("/", response_model=HealthResponse)
def root():
    return {
        "status": "running",
        "service": "PNG Renderer Service",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/render")
async def render_canvas(request: RenderRequest):
    """
    Render serialized Adobe Express canvas state to PNG using Playwright.
    
    Takes JSON serialized canvas state and returns PNG image.
    Supports: Rectangle, Ellipse, Text, Images (as placeholders)
    """
    logger.info(f"📸 Rendering canvas: {request.width}x{request.height}")
    
    try:
        # Parse the serialized state
        canvas_data = json.loads(request.serializedState)
        logger.info(f"📄 Parsed canvas data: {len(canvas_data.get('pages', []))} pages")
        
        # Create HTML with canvas rendering
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ margin: 0; padding: 0; }}
                canvas {{ display: block; }}
            </style>
        </head>
        <body>
            <canvas id="canvas" width="{request.width}" height="{request.height}"></canvas>
            <script>
                const canvas = document.getElementById('canvas');
                const ctx = canvas.getContext('2d');
                const data = {json.dumps(canvas_data)};
                
                // Fill background white
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Render function
                function renderNode(node) {{
                    if (!node) return;
                    
                    ctx.save();
                    
                    // Apply transformations
                    if (node.translation) {{
                        ctx.translate(node.translation.x || 0, node.translation.y || 0);
                    }}
                    if (node.rotation) {{
                        ctx.rotate((node.rotation || 0) * Math.PI / 180);
                    }}
                    if (node.opacity !== undefined) {{
                        ctx.globalAlpha = node.opacity;
                    }}
                    
                    // Render based on type
                    switch(node.type) {{
                        case 'Rectangle':
                            if (node.fill) {{
                                const f = node.fill;
                                ctx.fillStyle = `rgba(${{f.red * 255}},${{f.green * 255}},${{f.blue * 255}},${{f.alpha || 1}})`;
                                ctx.fillRect(0, 0, node.width || 0, node.height || 0);
                            }}
                            if (node.stroke) {{
                                const s = node.stroke;
                                ctx.strokeStyle = `rgba(${{s.color.red * 255}},${{s.color.green * 255}},${{s.color.blue * 255}},${{s.color.alpha || 1}})`;
                                ctx.lineWidth = s.width || 1;
                                ctx.strokeRect(0, 0, node.width || 0, node.height || 0);
                            }}
                            break;
                            
                        case 'Ellipse':
                            const rx = (node.width || 0) / 2;
                            const ry = (node.height || 0) / 2;
                            ctx.beginPath();
                            ctx.ellipse(rx, ry, rx, ry, 0, 0, Math.PI * 2);
                            if (node.fill) {{
                                const f = node.fill;
                                ctx.fillStyle = `rgba(${{f.red * 255}},${{f.green * 255}},${{f.blue * 255}},${{f.alpha || 1}})`;
                                ctx.fill();
                            }}
                            if (node.stroke) {{
                                const s = node.stroke;
                                ctx.strokeStyle = `rgba(${{s.color.red * 255}},${{s.color.green * 255}},${{s.color.blue * 255}},${{s.color.alpha || 1}})`;
                                ctx.lineWidth = s.width || 1;
                                ctx.stroke();
                            }}
                            break;
                            
                        case 'Text':
                            if (node.text) {{
                                const fontSize = node.fontSize || 16;
                                ctx.font = `${{fontSize}}px ${{node.fontFamily || 'Arial'}}`;
                                if (node.fill) {{
                                    const f = node.fill;
                                    ctx.fillStyle = `rgba(${{f.red * 255}},${{f.green * 255}},${{f.blue * 255}},${{f.alpha || 1}})`;
                                    ctx.fillText(node.text, 0, fontSize);
                                }}
                            }}
                            break;
                            
                        case 'MediaContainerNode':
                        case 'Image':
                            // Placeholder for images (gray rectangle)
                            ctx.fillStyle = '#CCCCCC';
                            ctx.fillRect(0, 0, node.width || 100, node.height || 100);
                            break;
                    }}
                    
                    // Render children
                    if (node.children && Array.isArray(node.children)) {{
                        node.children.forEach(child => renderNode(child));
                    }}
                    
                    ctx.restore();
                }}
                
                // Render all pages
                if (data.pages && Array.isArray(data.pages)) {{
                    data.pages.forEach(page => {{
                        if (page.children && Array.isArray(page.children)) {{
                            page.children.forEach(child => renderNode(child));
                        }}
                    }});
                }}
                
                // Mark rendering complete
                window.renderComplete = true;
            </script>
        </body>
        </html>
        """
        
        # Launch Playwright browser
        logger.info("🌐 Launching browser...")
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-setuid-sandbox']
            )
            page = await browser.new_page(
                viewport={'width': request.width, 'height': request.height}
            )
            
            # Load HTML
            await page.set_content(html_content)
            
            # Wait for rendering to complete
            await page.wait_for_function(
                'window.renderComplete === true',
                timeout=10000
            )
            
            # Take screenshot
            screenshot_bytes = await page.screenshot(
                type='png',
                full_page=False
            )
            
            await browser.close()
        
        logger.info(f"✅ Canvas rendered successfully: {len(screenshot_bytes)} bytes")
        return Response(content=screenshot_bytes, media_type="image/png")
        
    except json.JSONDecodeError as e:
        logger.error(f"❌ Invalid JSON: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {str(e)}")
        
    except Exception as e:
        logger.error(f"❌ Rendering error: {e}")
        
        # Return a fallback placeholder image
        img = Image.new('RGB', (request.width, request.height), color='white')
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="PNG")
        img_byte_arr.seek(0)
        
        return Response(content=img_byte_arr.getvalue(), media_type="image/png")

# ---------------- Run ----------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)
