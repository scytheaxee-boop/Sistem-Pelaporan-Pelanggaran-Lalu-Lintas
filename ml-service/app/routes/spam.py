from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional
from app.services.spam_classifier import SpamClassifierService

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

class SpamDetectionRequest(BaseModel):
    description: str = Field(..., description="Teks deskripsi laporan pelanggaran lalu lintas", min_length=1)

class SpamDetectionResponse(BaseModel):
    prediction: str = Field(..., description="'NORMAL' atau 'SPAM'")
    spam_probability: float = Field(..., description="Probabilitas teks tergolong spam (0.0 - 1.0)")
    normal_probability: float = Field(..., description="Probabilitas teks tergolong normal (0.0 - 1.0)")
    is_spam: bool = Field(..., description="True jika terindikasi spam")
    recommendation: str = Field(..., description="Rekomendasi atau saran moderasi")
    model_version: Optional[str] = "1.0.0"

_classifier_instance = None

def get_classifier():
    global _classifier_instance
    if _classifier_instance is None:
        _classifier_instance = SpamClassifierService()
    return _classifier_instance

@router.post("/detect-spam", response_model=SpamDetectionResponse)
async def detect_spam(req: SpamDetectionRequest, classifier: SpamClassifierService = Depends(get_classifier)):
    try:
        result = classifier.predict(req.description)
        return SpamDetectionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memproses prediksi spam: {str(e)}")
