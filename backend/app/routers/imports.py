import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ..models import ImportSummaryResponse
from ..services.import_service import ImportService

router = APIRouter(prefix="/api/import", tags=["Data Import Workflow"])

@router.post("/csv", response_model=ImportSummaryResponse)
async def import_csv_file(
    file: UploadFile = File(...),
    dataset_type: str = Form("rainfall")
):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .csv files are supported.")
    
    content = await file.read()
    return ImportService.validate_and_import_csv(
        filename=os.path.basename(file.filename),
        content=content,
        dataset_type=dataset_type
    )

@router.post("/geojson", response_model=ImportSummaryResponse)
async def import_geojson_file(
    file: UploadFile = File(...)
):
    if not (file.filename.lower().endswith(".geojson") or file.filename.lower().endswith(".json")):
        raise HTTPException(status_code=400, detail="Invalid file type. Only .geojson or .json files are supported.")

    content = await file.read()
    return ImportService.validate_and_import_geojson(
        filename=os.path.basename(file.filename),
        content=content
    )
