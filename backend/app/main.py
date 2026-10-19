import os
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from .models import GridResponse
from .vision import analyze, make_demo

app = FastAPI(title='Minefield Detection Simulation API', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173','http://127.0.0.1:5173'], allow_methods=['*'], allow_headers=['*'])

@app.get('/api/health')
def health(): return {'status':'ok','vision_configured':bool(os.getenv('GROQ_API_KEY'))}

@app.get('/api/demo', response_model=GridResponse)
def demo(rows: int = 20, cols: int = 20):
    if not 5 <= rows <= 40 or not 5 <= cols <= 40: raise HTTPException(422, 'Grid dimensions must be between 5 and 40.')
    return make_demo(rows, cols)

@app.post('/api/analyze', response_model=GridResponse)
async def image_analysis(file: UploadFile = File(...), rows: int = Form(20), cols: int = Form(20)):
    if not 5 <= rows <= 40 or not 5 <= cols <= 40: raise HTTPException(422, 'Grid dimensions must be between 5 and 40.')
    data = await file.read(int(os.getenv('MAX_UPLOAD_MB','12')) * 1024 * 1024 + 1)
    try: return await analyze(data, file.content_type or '', rows, cols, int(os.getenv('MAX_UPLOAD_MB','12')) * 1024 * 1024)
    except ValueError as exc: raise HTTPException(422, str(exc))
    except Exception as exc: raise HTTPException(502, f'Image analysis failed: {str(exc)[:220]}')
