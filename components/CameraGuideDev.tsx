
import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CameraGuideDevProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

const CameraGuideDev: React.FC<CameraGuideDevProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null); // For capture
  const brightnessCanvasRef = useRef<HTMLCanvasElement>(null); // For brightness check

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brightnessStatus, setBrightnessStatus] = useState<'OK' | 'NG'>('OK');
  const [capturedImage, setCapturedImage] = useState<string | null>(null); // Preview URL
  const [capturedFile, setCapturedFile] = useState<File | null>(null); // Actual file

  // Camera Setup
  useEffect(() => {
    let currentStream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: 'user', // Front camera
            width: { ideal: 1920 }, // Try for high res
            height: { ideal: 1080 },
          },
          audio: false,
        };

        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(e => console.error("Play error:", e));
        }
      } catch (err: any) {
        console.error("Camera permissions/error:", err);
        setError("カメラへのアクセスを許可してください");
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Brightness Check Loop
  useEffect(() => {
    if (!stream || capturedImage) return;

    const interval = setInterval(() => {
      if (videoRef.current && brightnessCanvasRef.current) {
        const video = videoRef.current;
        const ctx = brightnessCanvasRef.current.getContext('2d');
        if (ctx && video.readyState === 4) {
          // Draw small frame
          ctx.drawImage(video, 0, 0, 32, 32);
          const imageData = ctx.getImageData(0, 0, 32, 32);
          const data = imageData.data;
          let r, g, b, avg;
          let brightnessSum = 0;

          for (let i = 0, len = data.length; i < len; i += 4) {
            r = data[i];
            g = data[i + 1];
            b = data[i + 2];
            avg = Math.floor((r + g + b) / 3);
            brightnessSum += avg;
          }

          const avgBrightness = brightnessSum / (32 * 32);
          // Threshold: < 80 is NG (Low light), >= 80 is OK
          setBrightnessStatus(avgBrightness > 60 ? 'OK' : 'NG');
        }
      }
    }, 300); // 0.3s

    return () => clearInterval(interval);
  }, [stream, capturedImage]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Use mirror transformation for context to match preview?
        // Requirement: "Mirror display is fine for symmetrical guide"
        // Usually, saved image should NOT be mirrored if text is involved, but for face it's debatale.
        // User didn't specify save format, just guide. "Mirror image display ok".
        // Let's save as-is (non-mirrored) or mirrored?
        // Standard behavior: Preview is mirrored, Save is NOT mirrored (Selfie).
        // BUT, if the user aligns to a guide in mirror mode, and we save non-mirrored, it's fine as long as head is straight.
        // Let's stick to standard: Capture raw feed (Non-mirrored).
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setCapturedFile(file);
            setCapturedImage(URL.createObjectURL(blob));
          }
        }, 'image/jpeg', 0.95);
      }
    }
  }, []);

  const handleRetake = () => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    setCapturedFile(null);
  };

  const handleConfirm = () => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col font-sans text-white">
      {/* Hidden processing canvases */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={brightnessCanvasRef} width={32} height={32} className="hidden" />

      {/* Header/Disclaimer */}
      <div className="absolute top-0 w-full p-4 bg-gradient-to-b from-black/60 to-transparent z-20 flex justify-between items-start">
        <div className="bg-black/40 px-3 py-1 rounded text-xs text-white/80 backdrop-blur-sm">
          医療診断ではありません
        </div>
        <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 backdrop-blur-sm">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {capturedImage ? (
        // Review Screen
        <div className="flex-1 relative bg-black flex flex-col items-center justify-center">
          <img src={capturedImage} alt="Review" className="max-h-[80vh] w-full object-contain" />
          <div className="absolute bottom-0 w-full p-6 bg-black/80 flex justify-around items-center gap-4">
            <button
              onClick={handleRetake}
              className="px-6 py-3 rounded-lg border border-white/30 text-white w-full max-w-[150px]"
            >
              再撮影
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-3 rounded-lg bg-blue-600 font-bold text-white w-full max-w-[150px]"
            >
              これを使う
            </button>
          </div>
        </div>
      ) : (
        // Camera Preview Screen
        <div className="flex-1 relative overflow-hidden bg-black">
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Video Feed (Mirrored) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
          />

          {/* Guides Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* 3) Mouth Width Guides: X=5%, X=95%. Y=38%~66% */}
            <div className="absolute top-[38%] bottom-[34%] left-[5%] w-[3px] bg-white bg-opacity-35 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
            <div className="absolute top-[38%] bottom-[34%] left-[95%] w-[3px] bg-white bg-opacity-35 shadow-[0_0_2px_rgba(0,0,0,0.5)]" />
            <div className="absolute top-[38%] left-[5%] right-[5%] text-xs text-white/90 font-bold text-center -mt-8 drop-shadow-md">
              口の左右端を左右の線に合わせてください
            </div>

            {/* 4) Mouth Height Guides: Y=46%, Y=58% (Auxiliary, fainter) */}
            <div className="absolute top-[46%] left-[5%] right-[5%] h-[1px] bg-white bg-opacity-35" />
            <div className="absolute top-[58%] left-[5%] right-[5%] h-[1px] bg-white bg-opacity-35" />

            {/* 5) Tongue Outline Guide */}
            {/* Center X=50%, Y=56%. W=60%, H=22%.
                Top=56 - (22/2) = 45%.
                Left=50 - (60/2) = 20%.
            */}
            <div
              className="absolute border-[3px] border-white border-opacity-45"
              style={{
                top: '45%',
                left: '20%',
                width: '60%',
                height: '22%',
                borderRadius: '50% 50% 45% 45% / 60% 60% 35% 35%', // Approx shape
                boxShadow: '0 0 10px rgba(0,0,0,0.3), inset 0 0 5px rgba(255,255,255,0.1)'
              }}
            />
          </div>

          {/* Brightness Indicator */}
          <div className={`absolute top-16 right-4 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md flex items-center gap-2 transition-colors duration-300 ${brightnessStatus === 'OK' ? 'bg-green-500/30 text-green-100 border border-green-400/50' : 'bg-red-500/30 text-red-100 border border-red-400/50'}`}>
            <div className={`w-2 h-2 rounded-full ${brightnessStatus === 'OK' ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} />
            明るさ: {brightnessStatus}
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 w-full pb-10 pt-20 bg-gradient-to-t from-black/80 to-transparent flex flex-col items-center">
            <p className="text-white text-lg font-bold mb-1 shadow-black drop-shadow-md">
              舌を軽く前に出してください（力まない）
            </p>
            <p className="text-white/70 text-sm mb-6">
              5秒以内に撮影
            </p>

            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white/50 bg-white/20 backdrop-blur-sm flex items-center justify-center active:scale-95 transition-all hover:bg-white/30"
              aria-label="撮影"
            >
              <div className="w-16 h-16 bg-white rounded-full shadow-lg" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraGuideDev;
