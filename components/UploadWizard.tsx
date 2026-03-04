
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { ImageSlot, UploadedImage, AnalysisMode } from '../types';
import { compressImage } from '../utils/imageUtils';
import CameraCapture from './CameraCapture';
import CameraGuideDev from './CameraGuideDev';
import StreakBadge from './StreakBadge';
import TutorialScreen from './TutorialScreen';

interface UploadWizardProps {
  onStartAnalysis: (images: UploadedImage[]) => void;
  devMode?: boolean;
  disabled?: boolean;
  plan?: AnalysisMode;
}

const GUIDE_MESSAGES = {
  [ImageSlot.Front]: {
    title: "正面の撮影法",
    text: "① 舌を自然に前に出してください。\n② 画面の70〜80%を舌が占めるように近づいてください。\n③ ピントを合わせて撮影します。",
    iconPath: "M12,2C9,2,8,3,8,3V13.2c0,3.4,2.8,4.8,4,4.8s4-1.4,4-4.8V3S15,2,12,2z"
  },
  [ImageSlot.Underside]: {
    title: "舌裏の撮影法",
    text: "① 舌の先を上顎（上の歯の裏）につけてください。\n② 舌裏の２本の静脈が見えるようにしてください。\n③ 大きく写るように近づいて撮影します。",
    iconPath: "M12,22C9,22,8,21,8,21V10.8c0,-3.4,2.8,-4.8,4,-4.8s4,1.4,4,4.8V21S15,22,12,22z"
  },
  [ImageSlot.Left]: {
    title: "左側面の撮影法",
    text: "① 舌を右側の口角に向かって出してください。\n② 舌の左側面がよく見えるようにして撮影します。",
    iconPath: "M12,2C9,2,8,3,8,3V13.2c0,3.4,2.8,4.8,4,4.8s4-1.4,4-4.8V3S15,2,12,2z",
    rotation: 30
  },
  [ImageSlot.Right]: {
    title: "右側面の撮影法",
    text: "① 舌を左側の口角に向かって出してください。\n② 舌の右側面がよく見えるようにして撮影します。",
    iconPath: "M12,2C9,2,8,3,8,3V13.2c0,3.4,2.8,4.8,4,4.8s4-1.4,4-4.8V3S15,2,12,2z",
    rotation: -30
  },
};

const TongueOutlineIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3C8 3 6.5 6 6.5 12C6.5 17 9 21 12 21C15 21 17.5 17 17.5 12C17.5 6 16 3 12 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3V12" opacity="0.5" />
  </svg>
);

// Utility to detect if likely mobile (for preferring native camera)
const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const ImageUploadSlot: React.FC<{
  slot: ImageSlot;
  image: UploadedImage | null;
  onImageSelect: (slot: ImageSlot, file: File) => void;
  onClickSlot: (slot: ImageSlot) => void;
  imageInputRef: React.RefObject<HTMLInputElement>;
  cameraInputRef: React.RefObject<HTMLInputElement>;
}> = ({ slot, image, onImageSelect, onClickSlot, imageInputRef, cameraInputRef }) => {

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(slot, e.target.files[0]);
    }
  };

  return (
    <div
      onClick={() => onClickSlot(slot)}
      className="relative border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-center hover:border-blue-500 hover:bg-blue-50 transition-all bg-slate-50 min-h-[200px] cursor-pointer group"
    >
      {/* Hidden Inputs managed by parent */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()} // Prevent bubbling up to the div click
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileChange}
        onClick={(e) => e.stopPropagation()}
      />

      {image ? (
        <img src={image.previewUrl} alt={slot} className="w-full h-40 object-contain rounded-md" />
      ) : (
        <div className="flex flex-col items-center justify-center h-full w-full">
          <div className="relative w-24 h-24 mb-3">
            <TongueOutlineIcon className="w-full h-full text-slate-300 group-hover:text-blue-300 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <span className="font-bold text-lg text-slate-700 block">{slot}</span>
          <span className="text-xs text-slate-500 mt-1 bg-white px-2 py-1 rounded-full shadow-sm">タップして撮影・選択</span>
        </div>
      )}
    </div>
  );
};

const UploadWizard: React.FC<UploadWizardProps> = ({ onStartAnalysis, devMode, disabled, plan }) => {
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('TUTORIAL_SEEN') !== '1';
    }
    return false;
  });
  const [images, setImages] = useState<Record<ImageSlot, UploadedImage | null>>({
    [ImageSlot.Front]: null,
    [ImageSlot.Left]: null,
    [ImageSlot.Right]: null,
    [ImageSlot.Underside]: null,
  });
  const [isCompressing, setIsCompressing] = useState(false);

  // State for Selection Modal
  const [activeSlot, setActiveSlot] = useState<ImageSlot | null>(null);
  const [showWebCam, setShowWebCam] = useState(false);

  const imageInputRefs = {
    [ImageSlot.Front]: useRef<HTMLInputElement>(null),
    [ImageSlot.Underside]: useRef<HTMLInputElement>(null),
    [ImageSlot.Left]: useRef<HTMLInputElement>(null),
    [ImageSlot.Right]: useRef<HTMLInputElement>(null),
  };
  const cameraInputRefs = {
    [ImageSlot.Front]: useRef<HTMLInputElement>(null),
    [ImageSlot.Underside]: useRef<HTMLInputElement>(null),
    [ImageSlot.Left]: useRef<HTMLInputElement>(null),
    [ImageSlot.Right]: useRef<HTMLInputElement>(null),
  };

  const handleImageSelect = useCallback(async (slot: ImageSlot, file: File) => {
    setIsCompressing(true);
    try {
      const compressedFile = await compressImage(file, 1024, 0.8);
      const previewUrl = URL.createObjectURL(compressedFile);

      setImages(prev => ({
        ...prev,
        [slot]: { slot, file: compressedFile, previewUrl }
      }));
    } catch (e) {
      console.error("Image compression failed, using original:", e);
      const previewUrl = URL.createObjectURL(file);
      setImages(prev => ({
        ...prev,
        [slot]: { slot, file, previewUrl }
      }));
    } finally {
      setIsCompressing(false);
      setActiveSlot(null);
      setShowWebCam(false);
    }
  }, []);

  const handleSlotClick = (slot: ImageSlot) => {
    setActiveSlot(slot);
  };

  const handleCameraSelect = () => {
    if (activeSlot) {
      // If DevMode is on, we FORCE the WebCam UI to show the guides.
      // Otherwise, if it's mobile, we use native camera for better UX/Quality.
      if (devMode || !isMobileDevice()) {
        setShowWebCam(true);
      } else {
        // Trigger native camera input
        cameraInputRefs[activeSlot].current?.click();
        setActiveSlot(null); // Close modal, input handles rest
      }
    }
  };

  const handleFileSelect = () => {
    if (activeSlot) {
      imageInputRefs[activeSlot].current?.click();
      setActiveSlot(null);
    }
  };

  const handleWebCamCapture = (file: File) => {
    if (activeSlot) {
      handleImageSelect(activeSlot, file);
    }
  };

  const allImagesUploaded = useMemo(() => {
    if (isSimpleMode) {
      return images[ImageSlot.Front] !== null;
    }
    return Object.values(images).every(img => img !== null);
  }, [images, isSimpleMode]);

  const handleSubmit = () => {
    if (allImagesUploaded) {
      const validImages = Object.values(images).filter((img): img is UploadedImage => img !== null);
      onStartAnalysis(validImages);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-fade-in relative">
      {showTutorial && <TutorialScreen onClose={() => { setShowTutorial(false); localStorage.setItem('TUTORIAL_SEEN', '1'); }} />}
      {isCompressing && (
        <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-2xl">
          <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">画像を最適化中...</div>
        </div>
      )}

      {/* WebCam Modal */}
      {showWebCam && activeSlot && (
        devMode ? (
          <CameraGuideDev
            onCapture={handleWebCamCapture}
            onClose={() => setShowWebCam(false)}
          />
        ) : (
          <CameraCapture
            onCapture={handleWebCamCapture}
            onClose={() => setShowWebCam(false)}
            plan={plan}
          />
        )
      )}

      {/* Selection / Guide Modal */}
      {activeSlot && !showWebCam && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveSlot(null)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 text-center shadow-2xl transform transition-all scale-100" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{GUIDE_MESSAGES[activeSlot].title}</h3>
            <div className="bg-slate-100 rounded-lg p-4 mb-4 flex justify-center">
              <svg viewBox="0 0 24 24" className="w-24 h-24 text-pink-400" style={{ transform: `rotate(${GUIDE_MESSAGES[activeSlot].rotation || 0}deg)` }}>
                <path fill="currentColor" d={GUIDE_MESSAGES[activeSlot].iconPath} />
              </svg>
            </div>

            {/* Guide Text (Only in DevMode or always? Let's show always for better UX as they are already here) */}
            {/* User asked for "Dev Mode Tutorial" previously, but now wants PC selection. Let's incorporate guide for everyone as it's helpful. */}
            {devMode && (
              <div className="text-left bg-blue-50 p-3 rounded-lg mb-4 text-xs text-blue-900 font-medium leading-relaxed whitespace-pre-wrap border border-blue-100">
                <p className="font-bold mb-1 text-blue-700">【開発モード撮影ガイド】</p>
                {GUIDE_MESSAGES[activeSlot].text}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleCameraSelect}
                className="w-full bg-brand-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 shadow-sm flex items-center justify-center space-x-2 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 2H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                <span>カメラを起動</span>
              </button>
              <button
                onClick={handleFileSelect}
                className="w-full bg-white text-slate-700 font-bold py-3 px-4 rounded-lg border border-slate-300 hover:bg-slate-50 shadow-sm flex items-center justify-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                <span>画像を選択</span>
              </button>
            </div>
            <button onClick={() => setActiveSlot(null)} className="mt-4 text-slate-400 text-sm hover:text-slate-600">キャンセル</button>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="mb-6 text-center">
        <div className="flex justify-center mb-3">
          <StreakBadge />
        </div>
        <h2 className="text-2xl font-bold text-brand-primary">舌の画像を撮影</h2>
        <p className="text-slate-600 mt-1 mb-4">モードを選択して画像をアップロードしてください</p>

        <div className="inline-flex bg-slate-100 p-1 rounded-lg text-sm font-bold shadow-inner">
          <button
            onClick={() => setIsSimpleMode(true)}
            className={`px-6 py-2 rounded-md transition-all duration-300 ${isSimpleMode ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            シンプル
          </button>
          <button
            onClick={() => setIsSimpleMode(false)}
            className={`px-6 py-2 rounded-md transition-all duration-300 ${!isSimpleMode ? 'bg-white shadow-sm text-brand-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            プロモード
          </button>
        </div>
      </div>

      <div className="mb-6 animate-fade-in text-center">
        {devMode && <p className="text-orange-500 font-bold text-sm bg-orange-50 inline-block px-3 py-1 rounded-full border border-orange-200">【開発モード】撮影ガイド有効</p>}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm text-blue-800">
        <h3 className="font-bold mb-2">撮影のポイント</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>自然光で：</strong>明るい窓際で撮影すると正確な色が出ます。</li>
          <li><strong>リラックスして：</strong>舌に力を入れすぎないようにしましょう。</li>
          <li><strong>大きく鮮明に：</strong>画面の70〜80%に舌が写るように近づいて撮影してください。</li>
          {!isSimpleMode && <li><strong>4方向すべて：</strong>プロモードでは舌の裏や側面も重要です。</li>}
        </ul>
      </div>

      <div className="mb-6 animate-fade-in">
        <h3 className="font-bold text-center text-slate-700 mb-3 text-base">撮影例</h3>
        <div className={`grid gap-3 text-center text-xs text-slate-600 ${isSimpleMode ? 'grid-cols-1 w-32 mx-auto' : 'grid-cols-4'}`}>
          {/* ... SVGs (Omitted for brevity, kept same) ... */}
          {/* Re-inserted for completeness as write_to_file overwrites */}
          <div>
            <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center h-20 border border-slate-200">
              <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-pink-400">
                <path fill="currentColor" d="M12,2C9,2,8,3,8,3V13.2c0,3.4,2.8,4.8,4,4.8s4-1.4,4-4.8V3S15,2,12,2z" />
              </svg>
            </div>
            <p className="mt-1 font-semibold">正面</p>
          </div>

          {!isSimpleMode && (
            <>
              <div>
                <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center h-20 border border-slate-200">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-pink-400">
                    <path fill="currentColor" d="M12,22C9,22,8,21,8,21V10.8c0,-3.4,2.8,-4.8,4,-4.8s4,1.4,4,4.8V21S15,22,12,22z" />
                  </svg>
                </div>
                <p className="mt-1 font-semibold">舌裏</p>
              </div>
              <div>
                <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center h-20 border border-slate-200">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-pink-400">
                    <path fill="currentColor" d="M12,2C9,2,8,3,8,3V13.2c0,3.4,2.8,4.8,4,4.8s4-1.4,4-4.8V3S15,2,12,2z" transform="rotate(30 12 12)" />
                  </svg>
                </div>
                <p className="mt-1 font-semibold">左側縁</p>
              </div>
              <div>
                <div className="bg-slate-100 rounded-lg p-2 flex items-center justify-center h-20 border border-slate-200">
                  <svg viewBox="0 0 24 24" className="w-10 h-10 mx-auto text-pink-400">
                    <path fill="currentColor" d="M12,2C9,2,8,3,8,3V13.2c0,3.4,2.8,4.8,4,4.8s4-1.4,4-4.8V3S15,2,12,2z" transform="rotate(-30 12 12)" />
                  </svg>
                </div>
                <p className="mt-1 font-semibold">右側縁</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className={isSimpleMode ? "col-span-2" : ""}>
          <ImageUploadSlot
            slot={ImageSlot.Front}
            image={images[ImageSlot.Front]}
            onImageSelect={handleImageSelect}
            onClickSlot={handleSlotClick}
            imageInputRef={imageInputRefs[ImageSlot.Front]}
            cameraInputRef={cameraInputRefs[ImageSlot.Front]}
          />
        </div>
        {!isSimpleMode && (
          <>
            <ImageUploadSlot
              slot={ImageSlot.Underside}
              image={images[ImageSlot.Underside]}
              onImageSelect={handleImageSelect}
              onClickSlot={handleSlotClick}
              imageInputRef={imageInputRefs[ImageSlot.Underside]}
              cameraInputRef={cameraInputRefs[ImageSlot.Underside]}
            />
            <ImageUploadSlot
              slot={ImageSlot.Left}
              image={images[ImageSlot.Left]}
              onImageSelect={handleImageSelect}
              onClickSlot={handleSlotClick}
              imageInputRef={imageInputRefs[ImageSlot.Left]}
              cameraInputRef={cameraInputRefs[ImageSlot.Left]}
            />
            <ImageUploadSlot
              slot={ImageSlot.Right}
              image={images[ImageSlot.Right]}
              onImageSelect={handleImageSelect}
              onClickSlot={handleSlotClick}
              imageInputRef={imageInputRefs[ImageSlot.Right]}
              cameraInputRef={cameraInputRefs[ImageSlot.Right]}
            />
          </>
        )}
      </div>

      {import.meta.env.DEV && typeof window !== 'undefined' && localStorage.getItem('IS_RESEARCH_MODE') === 'true' && (
        <div className="mb-6 p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-left">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 w-4 h-4 text-brand-primary border-slate-300 rounded focus:ring-brand-primary"
              checked={localStorage.getItem('RESEARCH_AGREED') === 'true'}
              onChange={(e) => {
                const isChecked = e.target.checked;
                if (isChecked) {
                  localStorage.setItem('RESEARCH_AGREED', 'true');
                } else {
                  localStorage.removeItem('RESEARCH_AGREED');
                }
                // force re-render simple toggle
                setIsCompressing(!isCompressing);
                setTimeout(() => setIsCompressing(false), 10);
              }}
            />
            <span className="text-xs text-slate-700 leading-snug">
              <span className="font-bold block mb-0.5 text-brand-primary">研究モード (任意)</span>
              本機能は研究目的で、傾向データを<span className="font-bold underline">匿名で記録</span>します。医療診断ではありません。同意がない場合は保存されません。
            </span>
          </label>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allImagesUploaded || isCompressing || disabled}
        className={`w-full text-white font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-sm ${disabled ? 'bg-red-300 cursor-not-allowed' : 'bg-brand-primary hover:opacity-90 disabled:bg-slate-300 disabled:cursor-not-allowed'
          }`}
      >
        {disabled ? '現在利用できません' : (isCompressing ? '処理中...' : (allImagesUploaded ? '解析を開始する' : (isSimpleMode ? '正面画像を撮影してください' : 'すべての画像を撮影してください')))}
      </button>
    </div>
  );
};

export default UploadWizard;