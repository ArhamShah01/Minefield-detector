import pytest
from pydantic import ValidationError
from app.models import GridResponse
from app.vision import make_demo, parse_grid

def test_demo_grid_has_requested_dimensions_and_explicit_label():
    result=make_demo(20,20)
    assert result.source=='demo' and len(result.grid)==20 and all(len(row)==20 for row in result.grid)
    assert 'No image analysis' in result.message
    assert {cell['terrain'] for row in result.grid for cell in row} <= {'clear','obstacle'}

def test_model_grid_parser_validates_cells():
    content='prefix {"grid": [[{"terrain":"clear","confidence":0.8}]]} suffix'
    assert parse_grid(content,1,1)[0][0]['confidence']==0.8
    with pytest.raises(ValueError): parse_grid('{"grid":[[{"terrain":"mine","confidence":0.9}]]}',1,1)
    with pytest.raises(ValueError): parse_grid('{"grid":[[{"terrain":"uncertain","confidence":0.4}]]}',1,1)
    with pytest.raises(ValueError): parse_grid('{"grid":[]}',1,1)

def test_grid_response_rejects_bad_shape_and_confidence():
    with pytest.raises(ValidationError): GridResponse(rows=2,cols=2,grid=[[{'terrain':'clear','confidence':1}]],source='demo',message='x')
    with pytest.raises(ValidationError): GridResponse(rows=1,cols=1,grid=[[{'terrain':'clear','confidence':2}]],source='demo',message='x')
