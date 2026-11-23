"""
Model Training Script for LaporLintas AI Spam Detection
Algorithm: Multinomial Naive Bayes with Scikit-learn Pipeline
Feature Extraction: TF-IDF Vectorizer (Word + Subword Character n-grams)
"""

import os
import re
import json
import joblib
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
    classification_report
)

def clean_text(text: str) -> str:
    """Basic preprocessing for Indonesian report text."""
    if not isinstance(text, str):
        return ""
    text = text.lower()
    # Replace URLs
    text = re.sub(r'https?://\S+|www\.\S+', ' ', text)
    # Replace non-alphanumeric (keep spaces)
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    # Collapse multiple whitespaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, "datasets", "traffic_spam_dataset.csv")
    models_dir = os.path.join(base_dir, "models")
    eval_dir = os.path.join(base_dir, "evaluation")

    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(eval_dir, exist_ok=True)

    print("=== 1. Loading Dataset ===")
    df = pd.read_csv(dataset_path)
    print(f"Total rows read: {len(df)}")
    print(f"Class distribution:\n{df['label'].value_counts()}\n")

    # Check missing & duplicates
    df = df.dropna(subset=['text', 'label'])
    df = df.drop_duplicates(subset=['text'])
    print(f"Rows after dropping duplicates and nulls: {len(df)}")

    # Preprocessing
    print("=== 2. Preprocessing Text ===")
    df['cleaned_text'] = df['text'].apply(clean_text)
    df = df[df['cleaned_text'].str.len() > 0]

    X = df['cleaned_text']
    y = df['label']

    # Stratified Train-Test Split (80:20)
    print("=== 3. Stratified Train-Test Split (80:20) ===")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train size: {len(X_train)} (Normal: {(y_train=='normal').sum()}, Spam: {(y_train=='spam').sum()})")
    print(f"Test size:  {len(X_test)} (Normal: {(y_test=='normal').sum()}, Spam: {(y_test=='spam').sum()})")

    # Scikit-learn Pipeline with Word & Subword Char TF-IDF FeatureUnion + MultinomialNB
    print("\n=== 4. Training Pipeline (TF-IDF FeatureUnion + MultinomialNB) ===")
    union_tfidf = FeatureUnion([
        ('word_tfidf', TfidfVectorizer(
            ngram_range=(1, 2),
            min_df=2,
            sublinear_tf=True
        )),
        ('char_tfidf', TfidfVectorizer(
            ngram_range=(3, 5),
            analyzer='char_wb',
            min_df=2,
            sublinear_tf=True
        ))
    ])

    pipeline = Pipeline([
        ('features', union_tfidf),
        ('nb', MultinomialNB(alpha=0.5))
    ])

    pipeline.fit(X_train, y_train)
    print("Model training completed successfully.")

    # Evaluation
    print("\n=== 5. Model Evaluation on Test Set ===")
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)

    acc = float(accuracy_score(y_test, y_pred))
    prec_macro = float(precision_score(y_test, y_pred, average='macro'))
    rec_macro = float(recall_score(y_test, y_pred, average='macro'))
    f1_macro = float(f1_score(y_test, y_pred, average='macro'))

    prec_normal = float(precision_score(y_test, y_pred, pos_label='normal'))
    rec_normal = float(recall_score(y_test, y_pred, pos_label='normal'))
    f1_normal = float(f1_score(y_test, y_pred, pos_label='normal'))

    prec_spam = float(precision_score(y_test, y_pred, pos_label='spam'))
    rec_spam = float(recall_score(y_test, y_pred, pos_label='spam'))
    f1_spam = float(f1_score(y_test, y_pred, pos_label='spam'))

    cm = confusion_matrix(y_test, y_pred, labels=['normal', 'spam'])
    tn, fp, fn, tp = cm.ravel()

    report_text = classification_report(y_test, y_pred)

    print(f"Accuracy:  {acc:.4f}")
    print(f"Macro F1:  {f1_macro:.4f}")
    print(f"Confusion Matrix (labels: ['normal', 'spam']):\n{cm}")
    print(f"  True Normal: {tn}, False Positive (Normal predicted as Spam): {fp}")
    print(f"  False Negative (Spam predicted as Normal): {fn}, True Spam: {tp}")
    print("\nClassification Report:\n", report_text)

    # Save metrics JSON
    metrics = {
        "model_type": "Multinomial Naive Bayes",
        "vectorizer": "TF-IDF FeatureUnion (Word 1-2 ngrams + Char_wb 3-5 ngrams)",
        "dataset_size": len(df),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "accuracy": round(acc, 4),
        "macro_precision": round(prec_macro, 4),
        "macro_recall": round(rec_macro, 4),
        "macro_f1": round(f1_macro, 4),
        "per_class": {
            "normal": {
                "precision": round(prec_normal, 4),
                "recall": round(rec_normal, 4),
                "f1_score": round(f1_normal, 4)
            },
            "spam": {
                "precision": round(prec_spam, 4),
                "recall": round(rec_spam, 4),
                "f1_score": round(f1_spam, 4)
            }
        },
        "confusion_matrix": {
            "true_normal": int(tn),
            "false_positive_spam": int(fp),
            "false_negative_normal": int(fn),
            "true_spam": int(tp)
        },
        "model_version": "1.0.0",
        "is_synthetic_dataset": True
    }

    metrics_file = os.path.join(eval_dir, "metrics.json")
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to: {metrics_file}")

    # Plot & Save Confusion Matrix
    fig, ax = plt.subplots(figsize=(6, 5))
    im = ax.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    ax.figure.colorbar(im, ax=ax)
    classes = ['Normal', 'Spam']
    ax.set(
        xticks=np.arange(cm.shape[1]),
        yticks=np.arange(cm.shape[0]),
        xticklabels=classes, yticklabels=classes,
        title='Confusion Matrix - AI Spam Detection\n(Multinomial Naive Bayes)',
        ylabel='True Label',
        xlabel='Predicted Label'
    )

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, format(cm[i, j], 'd'),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black",
                    fontsize=14, weight='bold')
    plt.tight_layout()
    cm_plot_file = os.path.join(eval_dir, "confusion_matrix.png")
    plt.savefig(cm_plot_file, dpi=180)
    plt.close()
    print(f"Confusion matrix plot saved to: {cm_plot_file}")

    # Save trained Pipeline model with Joblib
    model_file = os.path.join(models_dir, "spam_detection_model.joblib")
    joblib.dump(pipeline, model_file)
    print(f"Trained model pipeline saved to: {model_file}")

    print("\n=== Training & Evaluation Finished Successfully ===")

if __name__ == "__main__":
    main()
