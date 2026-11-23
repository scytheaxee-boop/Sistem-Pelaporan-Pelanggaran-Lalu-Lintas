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

app = FastAPI(
    title="LaporLintas ML Service - AI Spam Detection",
    description="Layanan Machine Learning untuk mendeteksi spam pada deskripsi laporan lalu lintas menggunakan Multinomial Naive Bayes.",
    version="1.0.0"
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

@app.get("/")
async def root():
    return {
        "service": "LaporLintas AI Spam Detection Service",
        "algorithm": "Multinomial Naive Bayes",
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
