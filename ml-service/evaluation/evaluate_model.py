"""
Standalone Model Evaluation & Inference Test Script
Tests the saved Multinomial Naive Bayes pipeline with unseen samples.
"""

import os
import joblib

TEST_CASES = [
    # NORMAL test cases
    ("Pengendara motor tidak menggunakan helm saat berkendara.", "normal"),
    ("Mobil parkir di trotoar sehingga menghalangi pejalan kaki.", "normal"),
    ("Pengendara melawan arah di jalan satu arah.", "normal"),
    ("Pengemudi menggunakan telepon saat mengendarai mobil.", "normal"),
    ("Banyak motor nerobos lampu merah di perempatan simpang tiga.", "normal"),
    ("Ada truk muatan pasir tumpah ke aspal bikin licin dan macet.", "normal"),
    ("Knalpot brong bising banget geber geber gas di jalan sudirman.", "normal"),

    # SPAM test cases
    ("asdfghjkl 123456.", "spam"),
    ("Promo diskon sepatu beli sekarang diskon 70% hubungi wa 08123.", "spam"),
    ("Halo semuanya selamat pagi semoga harimu ceria.", "spam"),
    ("Jual pulsa murah hubungi saya sekarang juga.", "spam"),
    ("qwertyuiop zxcvbnm testing satu dua tiga.", "spam"),
    ("Mau pinjaman kilat langsung cair tanpa jaminan hubungi admin.", "spam"),
    ("Makan bakso enak banget pas hujan sore sore begini.", "spam"),
]

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    model_path = os.path.join(base_dir, "models", "spam_detection_model.joblib")

    if not os.path.exists(model_path):
        print(f"Model file not found at {model_path}. Please run train_spam_model.py first.")
        return

    print(f"Loading model pipeline from: {model_path}")
    pipeline = joblib.load(model_path)

    classes = list(pipeline.classes_)  # e.g. ['normal', 'spam']
    normal_idx = classes.index('normal')
    spam_idx = classes.index('spam')

    print(f"\nModel classes: {classes}")
    print("=" * 80)
    print(f"{'Input Text':<45} | {'Expected':<7} | {'Pred':<7} | {'Normal %':<8} | {'Spam %':<8} | {'Result'}")
    print("=" * 80)

    correct = 0
    for text, expected in TEST_CASES:
        pred = pipeline.predict([text])[0]
        proba = pipeline.predict_proba([text])[0]
        norm_prob = proba[normal_idx] * 100
        spam_prob = proba[spam_idx] * 100

        match = "MATCH" if pred == expected else "MISMATCH"
        if pred == expected:
            correct += 1

        short_text = (text[:42] + '...') if len(text) > 42 else text
        print(f"{short_text:<45} | {expected:<7} | {pred:<7} | {norm_prob:>7.1f}% | {spam_prob:>7.1f}% | {match}")

    print("=" * 80)
    print(f"Test Accuracy on Unseen Samples: {correct}/{len(TEST_CASES)} ({correct/len(TEST_CASES)*100:.1f}%)")

if __name__ == "__main__":
    main()
