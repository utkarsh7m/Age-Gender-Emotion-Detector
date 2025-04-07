// App.js

import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const App = () => {
  const webcamRef = useRef(null);
  const [showCamera, setShowCamera] = useState(false);
  const [result, setResult] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    let interval;
    if (showCamera && webcamRef.current) {
      interval = setInterval(async () => {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          try {
            const res = await axios.post("http://localhost:5000/analyze", {
              image: imageSrc,
            });
            setResult(res.data);
          } catch (error) {
            console.error("Live analysis failed", error);
          }
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [showCamera]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result;
      setImagePreview(base64Image);

      try {
        const res = await axios.post("http://localhost:5000/analyze", {
          image: base64Image,
        });
        setResult(res.data);
      } catch (error) {
        console.error("Image upload analysis failed", error);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      style={{
        backgroundColor: "#000",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        color: "white",
        fontFamily: "Segoe UI, sans-serif",
      }}
    >
      {/* Gradient Quarters */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "40vw",
          height: "40vw",
          borderBottomRightRadius: "100%",
          background: "radial-gradient(circle at top left, #6a11cb, transparent 70%)",
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "40vw",
          height: "40vw",
          borderTopLeftRadius: "100%",
          background: "radial-gradient(circle at bottom right, #2575fc, transparent 70%)",
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <h1
          style={{
            fontSize: "3rem",
            marginBottom: "30px",
            textAlign: "center",
            textShadow: "2px 2px 10px rgba(0,0,0,0.5)",
          }}
        >
          Age, Gender & Emotion Detector
        </h1>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginBottom: "30px",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <button
            onClick={() => {
              setShowCamera((prev) => !prev);
              setImagePreview(null);
              setResult(null);
            }}
            style={{
              padding: "12px 24px",
              fontSize: "16px",
              backgroundColor: showCamera ? "#dc3545" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              minWidth: "150px",
            }}
          >
            {showCamera ? "Close Camera" : "Start Camera"}
          </button>

          <label
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "white",
              borderRadius: "8px",
              cursor: "pointer",
              minWidth: "150px",
              textAlign: "center",
            }}
          >
            Upload Image
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {/* Webcam or Uploaded Image */}
        <div
          style={{
            display: "flex",
            gap: "40px",
            alignItems: "flex-start",
            flexWrap: "wrap",
            justifyContent: "center",
            width: "100%",
            maxWidth: "1400px",
          }}
        >
          {showCamera && (
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ width: 500 }}
              style={{
                width: "500px",
                borderRadius: "12px",
                boxShadow: "0 0 30px rgba(255,255,255,0.2)",
              }}
            />
          )}

          {!showCamera && imagePreview && (
            <img
              src={imagePreview}
              alt="Uploaded"
              style={{
                width: "500px",
                borderRadius: "12px",
                boxShadow: "0 0 30px rgba(255,255,255,0.2)",
              }}
            />
          )}

          {/* Result */}
          {result && (
            <div
              style={{
                fontSize: "22px",
                lineHeight: "1.8",
                minWidth: "250px",
                maxWidth: "400px",
                padding: "20px",
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderRadius: "12px",
                boxShadow: "0 0 20px rgba(0,0,0,0.4)",
              }}
            >
              <p><strong>Gender:</strong> {result.gender}</p>
              <p><strong>Age:</strong> {result.age}</p>
              <p><strong>Emotion:</strong> {result.emotion}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
