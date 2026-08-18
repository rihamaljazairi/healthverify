from flask import Flask, request, jsonify
from flask_cors import CORS
from ai_service import verify_faces

app = Flask(__name__)
CORS(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "AI Backend Running",
        "message": "HealthVerify Face Verification & OCR API is active",
        "aiEngine": "DeepFace + Tesseract OCR",
        "storage": "No Firebase Storage - files are processed in memory/temp only"
    })


@app.route("/verify-face", methods=["POST"])
def verify_face():
    try:
        user_id = request.form.get("userId")
        document = request.files.get("document")
        selfie = request.files.get("selfie")

        print("\n===== NEW VERIFY REQUEST =====")
        print(f"User ID: {user_id}")
        print(f"Document received: {document.filename if document else 'Missing'}")
        print(f"Selfie received: {selfie.filename if selfie else 'Missing'}")

        if not user_id:
            return jsonify({"error": "Missing userId"}), 400

        if document is None:
            return jsonify({"error": "Missing document image"}), 400

        if selfie is None:
            return jsonify({"error": "Missing selfie image"}), 400

        ai_result = verify_faces(document, selfie)

        print("\n===== AI RESULT =====")
        print(ai_result)
        print("=====================\n")

        return jsonify({
            "success": True,
            "userId": user_id,
            **ai_result,
        })

    except Exception as e:
        print("\n===== AI ERROR =====")
        print(str(e))
        print("====================\n")

        return jsonify({
            "success": False,
            "error": str(e),
            "faceMatch": False,
            "confidence": 0,
            "aiScore": 0,
            "documentConfidence": 0,
            "aiProcessingStatus": "failed",
            "faceMatchStatus": "failed",
            "ocrStatus": "failed",
            "documentText": "",
            "documentOcrConfidence": 0,
            "documentOcrWordCount": 0,
            "documentCandidateIds": [],
            "verificationStatus": "ai_failed",
            "recommendation": "reject",
            "riskLevel": "high",
            "documentCheckStatus": "failed",
        }), 500


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True,
    )