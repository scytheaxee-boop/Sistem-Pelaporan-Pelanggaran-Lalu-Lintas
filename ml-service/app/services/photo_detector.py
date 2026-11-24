"""
Photo Traffic Object Detector Service for LaporLintas
Lightweight ONNX Runtime inference using YOLOv8n (COCO 80 classes).
Detects traffic-relevant objects (vehicles, traffic lights, stop signs)
to assist admins in spotting irrelevant photos without requiring PyTorch.
"""

import io
import os
import re
from typing import Dict, List, Tuple

import numpy as np
import onnxruntime as ort
from PIL import Image, ImageOps

COCO_CLASSES: List[str] = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
    "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
    "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
    "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
    "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
    "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
    "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier",
    "toothbrush",
]

PRIMARY_TRAFFIC_LABELS: Dict[str, str] = {
    "bicycle": "sepeda",
    "car": "mobil",
    "motorcycle": "sepeda motor",
    "bus": "bus",
    "train": "kereta",
    "truck": "truk",
    "traffic light": "lampu lalu lintas",
    "stop sign": "rambu stop",
}

CONTEXT_LABELS: Dict[str, str] = {
    "person": "orang / pengendara",
}

KEYWORD_OBJECT_RULES: List[Tuple[str, str, str]] = [
    ("motorcycle", "sepeda motor", r"\b(motor|sepeda\s+motor|pemotor|ojol|ojek|vespa|skuter|matic|helm)\b"),
    ("car", "mobil", r"\b(mobil|sedan|suv|mpv|avanza|minibus|pickup|pikap|taksi|angkot|sabuk\s+pengaman)\b"),
    ("truck", "truk", r"\b(truk|truck|kontainer|fuso|tronton|odol|muatan)\b"),
    ("bus", "bus", r"\b(bus|bis|transjakarta|metromini)\b"),
    ("bicycle", "sepeda", r"\b(sepeda|pesepeda|gowes)\b"),
    ("traffic light", "lampu lalu lintas", r"\b(lampu\s+merah|lampu\s+lalu\s+lintas|apill|traffic\s+light|bangjo)\b"),
    ("stop sign", "rambu stop", r"\b(rambu\s+stop|tanda\s+stop)\b"),
]

VEHICLE_LABELS = {"bicycle", "car", "motorcycle", "bus", "train", "truck"}


def _nms_boxes(boxes: np.ndarray, scores: np.ndarray, iou_threshold: float = 0.45) -> List[int]:
    """Pure NumPy Non-Maximum Suppression on [x1, y1, x2, y2] boxes."""
    if len(boxes) == 0:
        return []
    x1, y1, x2, y2 = boxes[:, 0], boxes[:, 1], boxes[:, 2], boxes[:, 3]
    areas = np.maximum(0.0, x2 - x1) * np.maximum(0.0, y2 - y1)
    order = scores.argsort()[::-1]
    keep: List[int] = []
    while order.size > 0:
        i = int(order[0])
        keep.append(i)
        if order.size == 1:
            break
        xx1 = np.maximum(x1[i], x1[order[1:]])
        yy1 = np.maximum(y1[i], y1[order[1:]])
        xx2 = np.minimum(x2[i], x2[order[1:]])
        yy2 = np.minimum(y2[i], y2[order[1:]])
        inter = np.maximum(0.0, xx2 - xx1) * np.maximum(0.0, yy2 - yy1)
        union = areas[i] + areas[order[1:]] - inter + 1e-6
        iou = inter / union
        inds = np.where(iou <= iou_threshold)[0]
        order = order[inds + 1]
    return keep


class PhotoDetectorService:
    def __init__(self, model_path: str = None, conf_threshold: float = 0.25):
        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, "models", "yolov8n.onnx")

        if not os.path.exists(model_path):
            raise FileNotFoundError(f"ONNX model file not found at: {model_path}")

        self.model_path = model_path
        self.conf_threshold = conf_threshold
        self.input_size = 640
        self.version = "yolov8n-onnx-1.0.0"
        self.session = ort.InferenceSession(model_path, providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name

    def _preprocess(self, image_bytes: bytes) -> np.ndarray:
        img = Image.open(io.BytesIO(image_bytes))
        img = ImageOps.exif_transpose(img).convert("RGB")
        w, h = img.size
        scale = min(self.input_size / w, self.input_size / h)
        nw, nh = int(round(w * scale)), int(round(h * scale))
        resized = img.resize((nw, nh), Image.Resampling.BILINEAR)

        canvas = Image.new("RGB", (self.input_size, self.input_size), (114, 114, 114))
        pad_x = (self.input_size - nw) // 2
        pad_y = (self.input_size - nh) // 2
        canvas.paste(resized, (pad_x, pad_y))

        arr = np.asarray(canvas, dtype=np.float32) / 255.0
        arr = np.transpose(arr, (2, 0, 1))[np.newaxis, ...]  # [1, 3, 640, 640]
        return arr

    def _postprocess(self, raw_output: np.ndarray) -> List[Tuple[str, float]]:
        # raw_output shape: [1, 84, 8400] -> transpose to [8400, 84]
        preds = np.squeeze(raw_output, axis=0).T
        class_scores = preds[:, 4:]
        class_ids = np.argmax(class_scores, axis=1)
        confidences = class_scores[np.arange(len(preds)), class_ids]

        mask = confidences >= self.conf_threshold
        if not np.any(mask):
            return []

        filtered_preds = preds[mask]
        filtered_confs = confidences[mask]
        filtered_ids = class_ids[mask]

        cx, cy, bw, bh = (
            filtered_preds[:, 0],
            filtered_preds[:, 1],
            filtered_preds[:, 2],
            filtered_preds[:, 3],
        )
        boxes = np.stack([cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2], axis=1)

        # Class-aware NMS via coordinate offset per class
        max_coord = 4096.0
        offsets = filtered_ids.astype(np.float32) * max_coord
        keep = _nms_boxes(boxes + offsets[:, None], filtered_confs, iou_threshold=0.45)

        detections: List[Tuple[str, float]] = []
        for idx in keep:
            cid = int(filtered_ids[idx])
            if 0 <= cid < len(COCO_CLASSES):
                detections.append((COCO_CLASSES[cid], float(filtered_confs[idx])))
        return detections

    def _match_description(
        self,
        grouped: Dict[str, dict],
        description: str,
        category: str,
        is_relevant: bool,
    ) -> dict:
        combined_text = f"{category or ''} {description or ''}".lower()
        expected: List[Tuple[str, str]] = []
        for coco_label, id_label, pattern in KEYWORD_OBJECT_RULES:
            if re.search(pattern, combined_text):
                expected.append((coco_label, id_label))

        if expected:
            matched = [id_lbl for coco_lbl, id_lbl in expected if coco_lbl in grouped]
            missing = [id_lbl for coco_lbl, id_lbl in expected if coco_lbl not in grouped]
            score = round(len(matched) / len(expected), 4)

            if len(missing) == 0:
                status = "COCOK"
                summary = f"Deskripsi cocok dengan foto ({', '.join(matched)} terdeteksi)."
            elif len(matched) > 0:
                status = "SEBAGIAN_COCOK"
                summary = f"Sebagian cocok: {', '.join(matched)} terdeteksi, namun {', '.join(missing)} tidak terlihat di foto."
            else:
                status = "TIDAK_COCOK"
                summary = f"Tidak cocok: teks menyebut {', '.join(missing)}, tetapi tidak terdeteksi di foto."
        else:
            has_vehicle = any(lbl in grouped for lbl in VEHICLE_LABELS)
            if is_relevant or has_vehicle:
                status = "COCOK"
                score = 1.0
                matched = [o["label_id"] for o in grouped.values() if o["label"] in PRIMARY_TRAFFIC_LABELS]
                missing = []
                summary = "Foto menampilkan objek lalu lintas yang sesuai konteks laporan."
            else:
                status = "TIDAK_COCOK"
                score = 0.0
                matched = []
                missing = ["objek lalu lintas"]
                summary = "Tidak cocok: foto tidak menampilkan kendaraan maupun rambu lalu lintas."

        return {
            "match_status": status,
            "match_score": score,
            "matched_objects": matched,
            "missing_objects": missing,
            "match_summary": summary,
        }

    def analyze(self, image_bytes: bytes, description: str = "", category: str = "") -> dict:
        tensor = self._preprocess(image_bytes)
        outputs = self.session.run(None, {self.input_name: tensor})
        detections = self._postprocess(outputs[0])

        grouped: Dict[str, dict] = {}
        for label, conf in detections:
            if label not in grouped:
                grouped[label] = {
                    "label": label,
                    "label_id": PRIMARY_TRAFFIC_LABELS.get(label, CONTEXT_LABELS.get(label, label)),
                    "confidence": round(conf, 4),
                    "count": 1,
                }
            else:
                grouped[label]["count"] += 1
                if conf > grouped[label]["confidence"]:
                    grouped[label]["confidence"] = round(conf, 4)

        traffic_objs = [
            obj for obj in grouped.values() if obj["label"] in PRIMARY_TRAFFIC_LABELS
        ]
        traffic_objs.sort(key=lambda o: o["confidence"], reverse=True)

        all_objs = sorted(grouped.values(), key=lambda o: o["confidence"], reverse=True)
        is_relevant = len(traffic_objs) > 0

        if is_relevant:
            top_conf = traffic_objs[0]["confidence"]
            parts = [f"{o['label_id']} ({o['count']})" for o in traffic_objs[:4]]
            if "person" in grouped:
                parts.append(f"orang ({grouped['person']['count']})")
            summary = f"Foto relevan lalu lintas. Terdeteksi: {', '.join(parts)}."
            prediction = "RELEVAN"
            display_objects = (traffic_objs + ([grouped["person"]] if "person" in grouped else []))[:6]
        else:
            top_conf = all_objs[0]["confidence"] if all_objs else 0.0
            if "person" in grouped and len(all_objs) == 1:
                summary = "Terdeteksi orang tanpa kendaraan atau rambu lalu lintas."
            elif all_objs:
                other_parts = [f"{o['label_id']} ({o['count']})" for o in all_objs[:3]]
                summary = f"Tidak terdeteksi kendaraan/rambu lalu lintas (terdeteksi: {', '.join(other_parts)})."
            else:
                summary = "Tidak ada objek kendaraan, rambu, atau situasi jalan yang terdeteksi."
            prediction = "TIDAK_RELEVAN"
            display_objects = all_objs[:5]

        match_info = self._match_description(grouped, description, category, is_relevant)

        return {
            "prediction": prediction,
            "is_traffic_relevant": is_relevant,
            "confidence": round(float(top_conf), 4),
            "detected_objects": display_objects,
            "summary": summary,
            "model_version": self.version,
            **match_info,
        }
