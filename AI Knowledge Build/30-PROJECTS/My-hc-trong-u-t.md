---
tags: [project, my-hc-trong-u-t]
status: dang-lam
started: 2026-05-18
stack: [Python, TensorFlow/Keras, Flask, HTML/CSS/JS, Kaggle Dogs vs Cats dataset]
updated: 2026-05-18
vault: "[[My-hc-trong-u-t]]"
---

# Máy học trong đầu tư

## Mo ta
Bài kiểm tra học tập: Train model AI phân loại chó/mèo từ ảnh (dataset Kaggle). Build web app local để upload ảnh và nhận kết quả phân loại.

## Stack
- Python
- TensorFlow/Keras
- Flask
- HTML/CSS/JS
- Kaggle Dogs vs Cats dataset

## Trang thai
- [ ] Setup project
- [ ] Core features
- [ ] Testing
- [ ] Deploy

## Lien ket
- [[My-hc-trong-u-t/architecture|Architecture]]
- [[My-hc-trong-u-t/progress|Progress Log]]
- [[My-hc-trong-u-t/resources|Resources]]
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]


## Source Code

app.py:
```python
import os
import uuid
from pathlib import Path
from flask import Flask, render_template, request, jsonify, Response
from werkzeug.utils import secure_filename

from app.config import UPLOAD_FOLDER, ALLOWED_EXTENSIONS, MAX_FILE_SIZE
from app.predictor import predict, get_model

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE
app.config["TEMPLATES_AUTO_RELOAD"] = True
app.jinja_env.auto_reload = True

UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/")
def index():
    template_path = Path(__file__).parent / "templates" / "index.html"
    html = template_path.read_text(encoding="utf-8")
    return Response(html, content_type="text/html; charset=utf-8")


@app.route("/predict", methods=["POST"])
def predict_route():
    if "file" not in request.files:
        return jsonify({"error": "Không tìm thấy file ảnh"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Chưa chọn file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Chỉ chấp nhận file .jpg, .jpeg, .png"}), 400

    filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
    filepath = UPLOAD_FOLDER / filename

    try:
        file.save(str(filepath))
        result = predict(str(filepath))
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Lỗi xử lý ảnh: {str(e)}"}), 500
    finally:
        if filepath.exists():
            filepath.unlink()


if __name__ == "__main__":
    print("Loading model...")
    get_model()
    print("Model loaded! Starting server...")
    app.run(debug=False, host="127.0.0.1", port=5000)
```
