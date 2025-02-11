import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import OpenAI from "openai";
import axios from "axios";
import FormData from "form-data";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt parameter" }, { status: 400 });
    }

    const textResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });
    const textContent = textResponse.choices[0].message?.content || "";

    const outputDir = path.join(process.cwd(), "public/output");
    fs.mkdirSync(outputDir, { recursive: true });

    const audioMp3Path = path.join(outputDir, `${prompt.slice(0, 10)}.mp3`);
    const audioWavPath = path.join(outputDir, `${prompt.slice(0, 10)}.wav`);

    const speechResponse = await openai.audio.speech.create({
      model: "tts-1",
      voice: "sage",
      input: textContent,
    });
    fs.writeFileSync(audioMp3Path, Buffer.from(await speechResponse.arrayBuffer()));

    await new Promise((resolve, reject) => {
      const ffmpeg = spawn("ffmpeg", [
        "-i", audioMp3Path,
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        audioWavPath,
      ]);
      ffmpeg.on("close", (code) => (code === 0 ? resolve(true) : reject(new Error("FFmpeg conversion failed"))));
    });

   
    const formData = new FormData();
    formData.append("file", fs.createReadStream(audioWavPath), "audio.wav");

    const response = await axios.post("http://localhost:8000/generate-video/", formData, {
      responseType: "arraybuffer",
      headers: formData.getHeaders(),
    });

    const videoPath = path.join(outputDir, "generated-video.mp4");
    fs.writeFileSync(videoPath, Buffer.from(response.data));

    return NextResponse.json({
      audio_mp3: `/output/${prompt.slice(0, 10)}.mp3`,
      video_url: `/output/generated-video.mp4`, 
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "An error occurred while processing the request" }, { status: 500 });
  }
}
