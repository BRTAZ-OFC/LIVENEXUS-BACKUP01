import React, { useEffect, useRef, useState } from 'react';
import { Camera, AlertCircle, RefreshCw } from 'lucide-react';

export default function WebcamSourceRenderer({ config = {}, isEditing = false }) {
  const videoRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [devices, setDevices] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [streamActive, setStreamActive] = useState(false);

  const selectedDeviceId = config.deviceId || '';
  const mirror = config.mirror !== false; // default true for webcams
  const objectFit = config.objectFit || 'cover'; // cover, contain, fill
  const borderRadius = config.borderRadius ? (typeof config.borderRadius === 'number' ? `${config.borderRadius}px` : config.borderRadius) : '8px';
  const showBorder = config.showBorder || Boolean(config.borderColor);
  const borderColor = config.borderColor || 'rgba(168, 85, 247, 0.4)';
  const borderWidth = config.borderWidth ? `${config.borderWidth}px` : '2px';

  useEffect(() => {
    let currentStream = null;
    let isCancelled = false;

    async function initCamera() {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setErrorMsg('Navegador não suporta acesso à câmera.');
        setHasPermission(false);
        return;
      }

      try {
        setErrorMsg(null);
        const constraints = {
          video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true,
          audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (isCancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        currentStream = stream;
        setHasPermission(true);
        setStreamActive(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => {
            console.warn('Autoplay error on webcam video:', e);
          });
        }

        // List devices once permission granted
        try {
          const deviceList = await navigator.mediaDevices.enumerateDevices();
          const videoDevs = deviceList.filter(d => d.kind === 'videoinput');
          setDevices(videoDevs);
        } catch (e) {
          console.warn('Could not enumerate video devices:', e);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Error accessing webcam:', err);
        setHasPermission(false);
        setStreamActive(false);

        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setErrorMsg('Acesso à câmera bloqueado pelo navegador/sistema.');
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setErrorMsg('Nenhuma câmera encontrada no dispositivo.');
        } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
          setErrorMsg('A câmera já está em uso por outro aplicativo.');
        } else {
          setErrorMsg(err?.message || 'Não foi possível inicializar a câmera.');
        }
      }
    }

    initCamera();

    return () => {
      isCancelled = true;
      if (currentStream) {
        currentStream.getTracks().forEach(t => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [selectedDeviceId]);

  return (
    <div
      className="w-full h-full relative overflow-hidden flex items-center justify-center bg-black/80 select-none"
      style={{
        borderRadius,
        border: showBorder ? `${borderWidth} solid ${borderColor}` : 'none',
      }}
    >
      {/* Real Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full animate-fade-in"
        style={{
          objectFit,
          transform: mirror ? 'scaleX(-1)' : 'none',
        }}
      />

      {/* Fallback / Status Overlay when camera is loading or permission missing */}
      {!streamActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center bg-slate-950/90 text-slate-300">
          <Camera className="w-8 h-8 mb-2 text-purple-400 opacity-80" />
          <div className="text-xs font-bold font-mono tracking-wide text-white">
            WEBCAM / CÂMERA
          </div>
          {errorMsg ? (
            <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-amber-300 bg-amber-950/40 border border-amber-500/20 px-2 py-1 rounded max-w-[90%]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>{errorMsg}</span>
            </div>
          ) : (
            <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-1 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin text-purple-400" />
              <span>Conectando à câmera do dispositivo...</span>
            </div>
          )}
        </div>
      )}

      {/* Editing badge */}
      {isEditing && (
        <div className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono text-purple-300 pointer-events-none">
          CÂMERA {mirror ? '(Espelhada)' : ''}
        </div>
      )}
    </div>
  );
}
