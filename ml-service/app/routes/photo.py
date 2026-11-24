import io
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from typing import List, Optional
from app.services.photo_detector import PhotoDetectorService

router = APIRouter(prefix="/api/ml", tags=["Machine Learning - Photo"])

ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "WEBP"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB


class DetectedObjectItem(BaseModel):
    label: str
    label_id: str
    confidence: float
    count: int


class PhotoAnalysisResponse(BaseModel):
    prediction: str
    is_traffic_relevant: bool
    confidence: float
    detected_objects: List[DetectedObjectItem]
    summary: str
    model_version: Optional[str] = "yolov8n-onnx-1.0.0"
    match_status: str = "COCOK"
    match_score: float = 1.0
    matched_objects: List[str] = []
    missing_objects: List[str] = []
    match_summary: str = ""


_detector_instance = None


def get_detector() -> PhotoDetectorService:
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = PhotoDetectorService()
    return _detector_instance


@router.post("/analyze-photo", response_model=PhotoAnalysisResponse)
async def analyze_photo(
    file: UploadFile = File(...),
    description: Optional[str] = Form(""),
    category: Optional[str] = Form(""),
    detector: PhotoDetectorService = Depends(get_detector),
):
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="File foto kosong.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Ukuran foto melebihi batas 5 MB.")

    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            if (img.format or "").upper() not in ALLOWED_IMAGE_FORMATS:
                raise HTTPException(
                    status_code=400,
                    detail="Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.",
                )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="File bukan gambar yang valid (JPG, PNG, atau WebP).",
        )

    try:
        result = detector.analyze(
            image_bytes,
            description=description or "",
            category=category or "",
        )
        return PhotoAnalysisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menganalisis foto: {str(e)}")
