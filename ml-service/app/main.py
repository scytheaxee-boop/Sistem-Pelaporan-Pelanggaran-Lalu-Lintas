import os
import sys
from pathlib import Path

# Tambahkan direktori root ml-service ke sys.path agar impor 'app' selalu berhasil
BASE_DIR = Path(__file__).resolve().parent.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.spam import router as spam_router
from app.routes.photo import router as photo_router

app = FastAPI(
    title="LaporLintas ML Service - AI Moderation & Vision",
    description="Layanan Machine Learning untuk deteksi spam teks (Multinomial Naive Bayes) dan relevansi foto lalu lintas (YOLOv8n ONNX).",
    version="1.1.0"
)

# CORS Middleware for React + Vite Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(spam_router)
app.include_router(photo_router)

@app.get("/")
async def root():
    return {
        "service": "LaporLintas AI Moderation & Vision Service",
        "algorithms": ["Multinomial Naive Bayes (NLP)", "YOLOv8n ONNX (Object Detection)"],
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
