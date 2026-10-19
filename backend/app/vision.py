import base64, json, os, re
from io import BytesIO
from PIL import Image
import httpx
from .models import GridResponse

ALLOWED = {'image/jpeg', 'image/png'}
MODEL = os.getenv('GROQ_MODEL', 'qwen/qwen3.8-27b')


def make_demo(rows: int, cols: int) -> GridResponse:
    """A deterministic image-independent grid for offline demonstration."""
    grid = []
    for r in range(rows):
        line = []
        for c in range(cols):
            terrain, confidence = 'clear', .93
            # Fixed illustrative terrain features, explicitly not inferred from an image.
            if (r in (5, 6, 13) and 3 <= c <= min(cols - 4, 15)) or (c == 11 and 9 <= r <= 12):
                terrain, confidence = 'obstacle', .86
            line.append({'terrain': terrain, 'confidence': confidence})
        grid.append(line)
    return GridResponse(rows=rows, cols=cols, grid=grid, source='demo', message='Illustrative demo grid. No image analysis was performed.')


def validate_image(data: bytes, mime: str, max_bytes: int) -> Image.Image:
    if mime not in ALLOWED: raise ValueError('Upload a JPG or PNG image.')
    if not data or len(data) > max_bytes: raise ValueError(f'Image must be between 1 byte and {max_bytes // 1024 // 1024} MB.')
    try:
        image = Image.open(BytesIO(data)); image.verify()
        image = Image.open(BytesIO(data)).convert('RGB')
    except Exception as exc:
        raise ValueError('The uploaded file is not a valid image.') from exc
    if image.width * image.height > 25_000_000: raise ValueError('Image dimensions are too large.')
    return image


def parse_grid(content: str, rows: int, cols: int) -> list[list[dict]]:
    match = re.search(r'\{[\s\S]*\}', content)
    if not match: raise ValueError('Model did not return JSON.')
    payload = json.loads(match.group(0))
    grid = payload.get('grid')
    if not isinstance(grid, list) or len(grid) != rows: raise ValueError('Model returned invalid grid dimensions.')
    clean = []
    for line in grid:
        if not isinstance(line, list) or len(line) != cols: raise ValueError('Model returned invalid grid dimensions.')
        row = []
        for cell in line:
            if not isinstance(cell, dict) or cell.get('terrain') not in {'clear','obstacle'}: raise ValueError('Model returned an invalid terrain class.')
            score = cell.get('confidence')
            if not isinstance(score, (int,float)) or isinstance(score,bool) or not 0 <= score <= 1: raise ValueError('Model returned an invalid confidence score.')
            row.append({'terrain':cell['terrain'],'confidence':float(score)})
        clean.append(row)
    return clean


async def analyze(data: bytes, mime: str, rows: int, cols: int, max_bytes: int) -> GridResponse:
    image = validate_image(data, mime, max_bytes)
    key = os.getenv('GROQ_API_KEY', '').strip()
    if not key: return make_demo(rows, cols)
    buffer = BytesIO(); image.save(buffer, format='JPEG', quality=88)
    encoded = base64.b64encode(buffer.getvalue()).decode()
    prompt = f'''Analyze this drone photo for visible surface terrain only. Never infer, claim, or label buried mines; aerial imagery cannot detect buried mines. Return JSON only with grid: exactly {rows} rows x {cols} columns. Each cell is {{"terrain":"clear|obstacle","confidence":0.0}}. Obstacles are visible surface obstructions; classify terrain as clear when unsure. Grid spans the image top-left to bottom-right.'''
    async with httpx.AsyncClient(timeout=75) as client:
        response = await client.post('https://api.groq.com/openai/v1/chat/completions', headers={'Authorization':f'Bearer {key}','Content-Type':'application/json'}, json={'model':MODEL,'temperature':0,'messages':[{'role':'user','content':[{'type':'text','text':prompt},{'type':'image_url','image_url':{'url':f'data:image/jpeg;base64,{encoded}'}}]}]})
    response.raise_for_status()
    body = response.json(); content = body['choices'][0]['message']['content']
    grid = parse_grid(content, rows, cols)
    return GridResponse(rows=rows, cols=cols, grid=grid, source='groq', message='Visible surface terrain analysis only. Buried mines cannot be detected from aerial imagery.')
