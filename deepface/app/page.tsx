"use client";

import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateVideo = async () => {
    if (!prompt) return;
    setLoading(true);
    setError("");
    setVideoUrl(null);
  
    try {
      const response = await axios.post("/api/generate", { prompt });
  
      if (response.data.video_url) {
        setVideoUrl(response.data.video_url);
      } else {
        setError("Video generation failed.");
      }
  
      console.log("Generated video file:", response.data.video_url);
    } catch (err) {
      setError("Failed to generate video. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">🎭 AI Lip-Sync Avatar Generator</h1>
      <p className="mb-6 text-gray-400">Enter a prompt and generate a talking avatar video.</p>

      <div className="flex gap-4">
        <input
          type="text"
          className="p-3 rounded-lg bg-gray-800 border border-gray-600 w-96 text-white"
          placeholder="Enter your prompt..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold disabled:opacity-50"
          onClick={handleGenerateVideo}
          disabled={loading}
        >
          {loading ? "Generating..." : "Generate Video"}
        </button>
      </div>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {videoUrl && (
        <div className="mt-6 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">🎥 Generated Video:</h2>
          <video controls className="rounded-lg shadow-lg w-full max-w-md">
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <a
            href={videoUrl}
            download="generated_avatar.mp4"
            className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold"
          >
            📥 Download Video
          </a>
        </div>
      )}
    </div>
  );
}
