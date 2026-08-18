import os
import re
import shutil
import tempfile

import cv2
import numpy as np
import pytesseract
from pytesseract import Output
from PIL import Image

from deepface import DeepFace


# ==============================
# TESSERACT OCR CONFIG
# ==============================
# Auto-detect Tesseract on PATH first (works on Linux/macOS/Docker/most
# deployed servers). Falls back to the Windows default install path if
# Tesseract isn't found on PATH, so this still works unmodified on a
# local Windows dev machine.
_tess_path = shutil.which("tesseract") or r"C:\Program Files\Tesseract-OCR\tesseract.exe"
pytesseract.pytesseract.tesseract_cmd = _tess_path

try:
    print(f"[OCR] Using Tesseract binary at: {_tess_path}")
    print(f"[OCR] Tesseract version: {pytesseract.get_tesseract_version()}")
except Exception as _tess_check_error:
    print(f"[OCR] WARNING: Tesseract not reachable at startup: {_tess_check_error}")


def _safe_remove(path):
    if path and os.path.exists(path):
        try:
            os.remove(path)
        except Exception:
            pass


def _save_upload_to_temp(upload_file, suffix=".jpg"):
    # Use the real extension from the uploaded filename when we can, so the
    # temp file on disk actually matches its content (PNG stays .png, etc).
    # Falls back to the provided suffix if the filename has no extension.
    ext = os.path.splitext(upload_file.filename or "")[1].lower()
    if not ext:
        ext = suffix

    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
    temp_file.close()

    # Make sure the underlying stream is at the start before saving --
    # if anything upstream already read from it, .save() would write 0
    # bytes without raising an error.
    try:
        upload_file.stream.seek(0)
    except Exception:
        pass

    upload_file.save(temp_file.name)

    try:
        saved_size = os.path.getsize(temp_file.name)
    except Exception:
        saved_size = -1

    print(f"[OCR DEBUG] Saved upload '{upload_file.filename}' -> {temp_file.name} "
          f"({saved_size} bytes)")

    if saved_size == 0:
        print("[OCR DEBUG] WARNING: saved file is 0 bytes -- upload stream was "
              "empty or already consumed before it reached this function.")

    return temp_file.name


def _load_image_for_ocr(image_path):
    """
    Loads an image for OCR, trying OpenCV first and falling back to PIL if
    OpenCV can't decode it. Some uploads (odd PNG color profiles, certain
    mobile-exported formats, corrupted multipart writes) will fail silently
    in cv2.imread (returns None) but still open fine in PIL. Returns a
    BGR numpy array (OpenCV's expected format), or None if both fail.
    """
    image = cv2.imread(image_path)

    if image is not None:
        return image

    print(f"[OCR DEBUG] cv2.imread returned None for: {image_path}")
    print(f"[OCR DEBUG] File exists: {os.path.exists(image_path)}")
    if os.path.exists(image_path):
        print(f"[OCR DEBUG] File size on disk: {os.path.getsize(image_path)} bytes")

    print("[OCR DEBUG] Trying PIL fallback decoder...")
    try:
        pil_img = Image.open(image_path)
        pil_img.load()  # force full read, surfaces truncated-file errors now
        pil_img = pil_img.convert("RGB")
        image = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        print(f"[OCR DEBUG] PIL fallback succeeded. Image size: {pil_img.size}")
        return image
    except Exception as e:
        print(f"[OCR DEBUG] PIL fallback also failed: {e}")
        return None


def _calculate_confidence(distance):
    # DeepFace distance: lower means better match.
    # This converts distance into a percentage suitable for your UI.
    confidence = round(max(0, min(100, (1 - distance) * 100)))
    return confidence


def _words_and_confidences_from_data(data):
    """
    Shared helper: pulls (words, confidences) out of a pytesseract
    image_to_data() DICT result. Tesseract reports conf=-1 for boxes it
    doesn't consider text (lines, blank regions), which we skip.
    """
    words = []
    confidences = []

    for i, raw_word in enumerate(data.get("text", [])):
        word = raw_word.strip()
        try:
            conf = float(data["conf"][i])
        except (TypeError, ValueError, IndexError):
            conf = -1

        if word and conf >= 0:
            words.append(word)
            confidences.append(conf)

    return words, confidences


def _extract_document_text(image_path):
    """
    Real OCR using Tesseract (via pytesseract). This replaces the old
    SIMULATED documentConfidence placeholder with an actual text-extraction
    pass over the uploaded identification document image.

    Returns the recognized text, the average per-word OCR confidence
    (0-100, as reported by Tesseract), the number of words recognized, and
    a short list of alphanumeric tokens that look like an ID/license number
    (5-15 characters, mixing letters and digits) — a simple heuristic, not
    a guarantee the document is genuine.
    """
    try:
        image = _load_image_for_ocr(image_path)
        if image is None:
            print(f"[OCR DEBUG] Could not decode image at all: {image_path}")
            return {"text": "", "avgConfidence": 0, "wordCount": 0, "candidateIds": [], "ok": False}

        print(f"[OCR DEBUG] Image loaded successfully. Shape: {image.shape}")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Light denoise + adaptive threshold. Adaptive thresholding copes
        # much better than a single global Otsu threshold with photographed
        # (not flatbed-scanned) ID cards that have uneven lighting, glare,
        # or a colored/patterned background — a global threshold can wipe
        # the text out entirely on those images.
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        processed = cv2.adaptiveThreshold(
            denoised,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            31,
            11,
        )

        data = pytesseract.image_to_data(processed, lang="eng", output_type=Output.DICT)
        words, confidences = _words_and_confidences_from_data(data)
        print(f"[OCR DEBUG] Adaptive-threshold pass found {len(words)} words")

        # Fallback: if the adaptive-thresholded pass found nothing (e.g. the
        # binarization was too aggressive for this particular image), retry
        # OCR directly on the plain grayscale image before giving up. This
        # avoids the previous "0 words / 0% / no text extracted" outcome
        # whenever preprocessing (rather than the document itself) was the
        # actual problem.
        if not words:
            data = pytesseract.image_to_data(gray, lang="eng", output_type=Output.DICT)
            words, confidences = _words_and_confidences_from_data(data)
            print(f"[OCR DEBUG] Grayscale fallback pass found {len(words)} words")

        # Second fallback: try the raw, untouched image straight from disk.
        # Covers cases where even grayscale conversion hurt more than it
        # helped (e.g. very low-contrast or oddly-colored source images).
        if not words:
            data = pytesseract.image_to_data(image, lang="eng", output_type=Output.DICT)
            words, confidences = _words_and_confidences_from_data(data)
            print(f"[OCR DEBUG] Raw-image fallback pass found {len(words)} words")

        text = " ".join(words)
        avg_confidence = round(sum(confidences) / len(confidences)) if confidences else 0

        candidate_ids = re.findall(
            r"\b(?=[A-Z0-9]{5,15}\b)(?=[A-Z0-9]*\d)[A-Z0-9]{5,15}\b", text.upper()
        )

        return {
            "text": text,
            "avgConfidence": avg_confidence,
            "wordCount": len(words),
            "candidateIds": candidate_ids[:5],
            "ok": True,
        }

    except pytesseract.TesseractNotFoundError:
        # Tesseract binary isn't installed on this machine — surface that
        # clearly instead of silently falling back to a fake score.
        return {
            "text": "", "avgConfidence": 0, "wordCount": 0, "candidateIds": [], "ok": False,
            "error": "Tesseract OCR engine is not installed on this server.",
        }
    except Exception as e:
        print(f"[OCR DEBUG] Exception during OCR: {e}")
        return {"text": "", "avgConfidence": 0, "wordCount": 0, "candidateIds": [], "ok": False, "error": str(e)}


def _calculate_document_confidence(ocr_result):
    """
    Real document confidence, computed from the OCR pass above instead of
    the previous simulated placeholder (which only used face_match to pick
    90 or 65, regardless of what was actually in the document image).

    Combines three signals:
      - avgConfidence: how legible the recognized text is, per Tesseract
      - coverage: how much recognizable text was found at all (a blank,
        blurry, or non-document image should score low even if the few
        characters it does pick up happen to be read with high confidence)
      - a small bonus if at least one ID/license-like alphanumeric token
        was found, since that's a reasonable signal this is actually an
        ID/credential document and not an arbitrary photo
    """
    if not ocr_result.get("ok"):
        return 0

    avg_conf = ocr_result["avgConfidence"]
    word_count = ocr_result["wordCount"]
    has_id_like_token = len(ocr_result["candidateIds"]) > 0

    if word_count == 0:
        return 0

    coverage_score = min(100, word_count * 8)

    document_confidence = round(
        0.6 * avg_conf + 0.3 * coverage_score + (10 if has_id_like_token else 0)
    )

    return max(0, min(100, document_confidence))


def _build_decision(face_match, confidence, document_confidence):
    """
    SINGLE SOURCE OF TRUTH for risk level and recommendation.

    Thresholds (must match Section 4.6 / Table 7.1 of the report,
    and must NOT be recomputed anywhere else, including Flutter):
        confidence >= 75 AND document_confidence >= 75  -> approve / low risk
        55 <= confidence < 75                            -> manual_review / medium risk
        confidence < 55                                  -> reject / high risk

    document_confidence is now computed from real Tesseract OCR output
    (see _calculate_document_confidence), not the old simulated placeholder.
    """
    if face_match and confidence >= 75 and document_confidence >= 75:
        return {
            "faceMatchStatus": "passed",
            "verificationStatus": "ai_checked",
            "recommendation": "approve",
            "riskLevel": "low",
        }

    if confidence >= 55:
        return {
            "faceMatchStatus": "review_required",
            "verificationStatus": "manual_review",
            "recommendation": "manual_review",
            "riskLevel": "medium",
        }

    return {
        "faceMatchStatus": "failed",
        "verificationStatus": "ai_failed",
        "recommendation": "reject",
        "riskLevel": "high",
    }


def verify_faces(document_file, selfie_file):
    """
    Real AI face verification using DeepFace, plus real OCR-based document
    text extraction using Tesseract (pytesseract). This does NOT use
    Firebase Storage. The uploaded files are saved temporarily, processed,
    then deleted.

    documentConfidence is now derived from actually reading the document
    image (see _extract_document_text / _calculate_document_confidence),
    not the old face_match-based 90/65 placeholder.
    """

    document_path = None
    selfie_path = None

    try:
        document_path = _save_upload_to_temp(document_file, ".jpg")
        selfie_path = _save_upload_to_temp(selfie_file, ".jpg")

        result = DeepFace.verify(
            img1_path=document_path,
            img2_path=selfie_path,
            model_name="Facenet",
            detector_backend="opencv",
            enforce_detection=False,
        )

        face_match = bool(result.get("verified", False))
        distance = float(result.get("distance", 1))

        confidence = _calculate_confidence(distance)
        ai_score = confidence

        ocr_result = _extract_document_text(document_path)
        document_confidence = _calculate_document_confidence(ocr_result)
        ocr_status = "completed" if ocr_result.get("ok") else "failed"

        decision = _build_decision(
            face_match=face_match,
            confidence=confidence,
            document_confidence=document_confidence,
        )

        response = {
            "faceMatch": face_match,
            "confidence": confidence,
            "aiScore": ai_score,
            "documentConfidence": document_confidence,
            "aiProcessingStatus": "completed",
            "faceMatchStatus": decision["faceMatchStatus"],
            "ocrStatus": ocr_status,
            "documentText": ocr_result.get("text", "")[:500],
            "documentOcrConfidence": ocr_result.get("avgConfidence", 0),
            "documentOcrWordCount": ocr_result.get("wordCount", 0),
            "documentCandidateIds": ocr_result.get("candidateIds", []),
            "verificationStatus": decision["verificationStatus"],
            "recommendation": decision["recommendation"],
            "riskLevel": decision["riskLevel"],
            "documentCheckStatus": (
                "passed" if document_confidence >= 75 else "review_required"
            ),
            "deepFaceDistance": distance,
            "deepFaceModel": "Facenet",
            "deepFaceDetector": "opencv",
        }

        if ocr_result.get("error"):
            response["ocrError"] = ocr_result["error"]

        return response

    except Exception as e:
        return {
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
            "error": str(e),
        }

    finally:
        _safe_remove(document_path)
        _safe_remove(selfie_path)