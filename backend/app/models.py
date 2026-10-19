from typing import Literal
from pydantic import BaseModel, Field, field_validator

Terrain = Literal['clear', 'obstacle', 'uncertain']

class Cell(BaseModel):
    terrain: Terrain
    confidence: float = Field(ge=0, le=1)

class GridResponse(BaseModel):
    rows: int = Field(ge=5, le=40)
    cols: int = Field(ge=5, le=40)
    grid: list[list[Cell]]
    source: Literal['groq', 'demo']
    message: str

    @field_validator('grid')
    @classmethod
    def dimensions_match(cls, value, info):
        data = info.data
        rows, cols = data.get('rows'), data.get('cols')
        if rows and len(value) != rows: raise ValueError('Grid row count does not match rows')
        if cols and any(len(row) != cols for row in value): raise ValueError('Grid column count does not match cols')
        return value
