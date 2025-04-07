# gg_api.py
import cv2
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import os

app = Flask(__name__)
CORS(app)
# Load Models
faceProto = "opencv_face_detector.pbtxt"
faceModel = "opencv_face_detector_uint8.pb"
ageProto = "age_deploy.prototxt"
ageModel = "age_net.caffemodel"
genderProto = "gender_deploy.prototxt"
genderModel = "gender_net.caffemodel"

faceNet = cv2.dnn.readNet(faceModel, faceProto)
ageNet = cv2.dnn.readNet(ageModel, ageProto)
genderNet = cv2.dnn.readNet(genderModel, genderProto)

MODEL_MEAN_VALUES = (78.4263377603, 87.7689143744, 114.895847746)
ageList = ['(0-2)', '(4-6)', '(8-12)', '(15-20)', '(20-25)', '(25-32)', '(38-43)', '(48-53)', '(60-100)']
genderList = ['Male', 'Female']

def highlightFace(net, frame, conf_threshold=0.7):
    blob = cv2.dnn.blobFromImage(frame, 1.0, (300, 300),
                                 [104, 117, 123], swapRB=True, crop=False)
    net.setInput(blob)
    detections = net.forward()
    h, w = frame.shape[:2]
    faceBoxes = []

    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > conf_threshold:
            x1 = int(detections[0, 0, i, 3] * w)
            y1 = int(detections[0, 0, i, 4] * h)
            x2 = int(detections[0, 0, i, 5] * w)
            y2 = int(detections[0, 0, i, 6] * h)
            faceBoxes.append([x1, y1, x2, y2])
    return faceBoxes

@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        data = request.get_json()
        img_data = data.get("image", "")
        if not img_data:
            return jsonify({"error": "No image data provided"}), 400

        header, encoded = img_data.split(",", 1)
        img_bytes = base64.b64decode(encoded)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

        faceBoxes = highlightFace(faceNet, frame)
        if not faceBoxes:
            return jsonify({"error": "No face detected"}), 200

        # Use the first face only
        padding = 20
        box = faceBoxes[0]
        face = frame[max(0, box[1] - padding): min(box[3] + padding, frame.shape[0] - 1),
                     max(0, box[0] - padding): min(box[2] + padding, frame.shape[1] - 1)]

        blob = cv2.dnn.blobFromImage(face, 1.0, (227, 227), MODEL_MEAN_VALUES, swapRB=False)
        genderNet.setInput(blob)
        gender = genderList[genderNet.forward()[0].argmax()]

        ageNet.setInput(blob)
        age = ageList[ageNet.forward()[0].argmax()]

        try:
            analysis = DeepFace.analyze(face, actions=['emotion'], enforce_detection=False)
            emotion = analysis[0]['dominant_emotion']
        except Exception as e:
            emotion = "Unknown"

        return jsonify({
            "gender": gender,
            "age": age[1:-1],  # remove brackets
            "emotion": emotion
        })

    except Exception as e:
        print("Error:", str(e))
        return jsonify({"error": "Internal server error"}), 500

if __name__ == "__main__":
    app.run(debug=True)
