import faceapi, { loadModels } from "./faceapi";

let stableFrames = 0;

export const liveVerify = async (video) => {
  await loadModels();

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    stableFrames = 0;
    return {
      status: "NO_FACE",
      confidence: 0,
      spoof: true,
    };
  }

  const confidence = detection.detection.score;

  // 🚨 Anti-spoof rule
  if (confidence < 0.5) {
    stableFrames = 0;

    return {
      status: "LOW_QUALITY",
      confidence,
      spoof: true,
    };
  }

  stableFrames++;

  return {
    status: stableFrames > 10 ? "REAL_FACE" : "VERIFYING",
    confidence,
    spoof: false,
  };
};