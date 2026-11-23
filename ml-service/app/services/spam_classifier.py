"""
Spam Classifier Service for LaporLintas
Uses trained Multinomial Naive Bayes Pipeline.
"""

import os
import re
import joblib

class SpamClassifierService:
    def __init__(self, model_path: str = None):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, "models", "spam_detection_model.joblib")
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at: {model_path}")
        
        self.model_path = model_path
        self.pipeline = joblib.load(model_path)
        self.classes = list(self.pipeline.classes_)
        self.normal_idx = self.classes.index('normal') if 'normal' in self.classes else 0
        self.spam_idx = self.classes.index('spam') if 'spam' in self.classes else 1
        self.version = "1.0.0"

    def clean_text(self, text: str) -> str:
        if not isinstance(text, str):
            return ""
        text = text.lower()
        text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
        text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def predict(self, description: str) -> dict:
        raw_text = (description or "").strip()
        
        # Validation for empty or very short inputs
        if len(raw_text) == 0:
            return {
                "prediction": "SPAM",
                "spam_probability": 1.0,
                "normal_probability": 0.0,
                "is_spam": True,
                "recommendation": "Deskripsi laporan tidak boleh kosong.",
                "model_version": self.version
            }
        
        cleaned = self.clean_text(raw_text)
        if len(cleaned) < 5:
            return {
                "prediction": "SPAM",
                "spam_probability": 0.95,
                "normal_probability": 0.05,
                "is_spam": True,
                "recommendation": "Teks terlalu pendek. Mohon berikan informasi pelanggaran lalu lintas yang jelas.",
                "model_version": self.version
            }

        # Model Inference
        proba = self.pipeline.predict_proba([cleaned])[0]
        normal_prob = round(float(proba[self.normal_idx]), 4)
        spam_prob = round(float(proba[self.spam_idx]), 4)

        pred_label = self.pipeline.predict([cleaned])[0]
        is_spam = (pred_label == 'spam')

        if is_spam:
            recommendation = (
                "Deskripsi terindikasi sebagai spam, promosi, atau teks yang tidak berkaitan dengan pelanggaran lalu lintas. "
                "Mohon periksa kembali dan jelaskan fakta kejadian secara jelas."
            )
            prediction_display = "SPAM"
        else:
            recommendation = "Laporan relevan dengan topik kondisi atau pelanggaran lalu lintas."
            prediction_display = "NORMAL"

        return {
            "prediction": prediction_display,
            "spam_probability": spam_prob,
            "normal_probability": normal_prob,
            "is_spam": is_spam,
            "recommendation": recommendation,
            "model_version": self.version
        }
