import React, { useEffect, useRef, useState } from 'react';

async function loadDetector() {
  const tf = await import('@tensorflow/tfjs');
  await import('@tensorflow/tfjs-backend-webgl');
  await tf.ready();
  const poseDetection = await import('@tensorflow-models/pose-detection');
  return poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
    modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
  });
}

function getAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs((radians * 180) / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

const CONNECTIONS = [
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10],
  [5, 11], [6, 12], [11, 12],
  [11, 13], [13, 15], [12, 14], [14, 16],
];

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const detectorRef = useRef(null);
  const animRef = useRef(null);
  const phaseRef = useRef('up');

  const [status, setStatus] = useState('idle');
  const [reps, setReps] = useState(0);
  const [phase, setPhase] = useState('up');
  const [angle, setAngle] = useState(null);
  const [error, setError] = useState('');

  async function start() {
    setStatus('loading');
    setReps(0);
    phaseRef.current = 'up';
    setPhase('up');
    setAngle(null);

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      await new Promise((res) => { videoRef.current.onloadedmetadata = res; });
      videoRef.current.play();
      detectorRef.current = await loadDetector();
      setStatus('ready');
      loop();
    } catch (e) {
      setStatus('error');
      setError(e.message || 'No se pudo acceder a la camara.');
      stream?.getTracks().forEach((t) => t.stop());
    }
  }

  function stop() {
    cancelAnimationFrame(animRef.current);
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
    detectorRef.current?.dispose?.();
    detectorRef.current = null;
    setStatus('idle');
    setAngle(null);
  }

  function loop() {
    animRef.current = requestAnimationFrame(async () => {
      if (videoRef.current && detectorRef.current && canvasRef.current) {
        try {
          const poses = await detectorRef.current.estimatePoses(videoRef.current);
          if (poses[0]) {
            processKeypoints(poses[0].keypoints);
            drawPose(poses[0].keypoints);
          }
        } catch { /* ignorar errores de frame */ }
      }
      loop();
    });
  }

  function processKeypoints(kp) {
    // Elegir lado con mas confianza: cadera(11/12) - rodilla(13/14) - tobillo(15/16)
    const lc = Math.min(kp[11]?.score || 0, kp[13]?.score || 0, kp[15]?.score || 0);
    const rc = Math.min(kp[12]?.score || 0, kp[14]?.score || 0, kp[16]?.score || 0);
    const [ai, bi, ci] = lc >= rc ? [11, 13, 15] : [12, 14, 16];

    const a = kp[ai], b = kp[bi], c = kp[ci];
    if (!a || !b || !c || Math.min(a.score, b.score, c.score) < 0.3) return;

    const ang = getAngle(a, b, c);
    setAngle(Math.round(ang));

    if (ang < 100 && phaseRef.current === 'up') {
      phaseRef.current = 'down';
      setPhase('down');
    } else if (ang > 160 && phaseRef.current === 'down') {
      phaseRef.current = 'up';
      setPhase('up');
      setReps((prev) => prev + 1);
    }
  }

  function drawPose(keypoints) {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    for (const [i, j] of CONNECTIONS) {
      const a = keypoints[i], b = keypoints[j];
      if (a?.score > 0.3 && b?.score > 0.3) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#00ff88';
    for (const kp of keypoints) {
      if (kp.score < 0.3) continue;
      ctx.beginPath();
      ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  useEffect(() => () => stop(), []);

  return (
    <div className="app">
      <header>
        <h1>Contador de Sentadillas</h1>
        <p>Deteccion de pose en tiempo real · MoveNet Lightning</p>
      </header>

      <video ref={videoRef} className="hidden" muted playsInline />

      <main>
        {status === 'idle' && (
          <div className="start-screen">
            <div className="icon">🏋️</div>
            <p>Colócate de <strong>perfil</strong> ante la cámara para mejor detección</p>
            <button className="btn-primary" onClick={start}>Iniciar cámara</button>
          </div>
        )}

        {status === 'loading' && (
          <div className="start-screen">
            <div className="spinner" />
            <p>Cargando modelo de detección…</p>
            <small>La primera carga puede tardar unos segundos</small>
          </div>
        )}

        {status === 'error' && (
          <div className="start-screen">
            <div className="icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button className="btn-primary" onClick={() => setStatus('idle')}>Volver</button>
          </div>
        )}

        {status === 'ready' && (
          <div className="counter-screen">
            <div className="camera-wrapper">
              <canvas ref={canvasRef} />
            </div>

            <div className={`counter-box ${phase}`}>
              <span className="rep-number">{reps}</span>
              <span className="rep-label">sentadillas</span>
              <span className={`phase-badge ${phase}`}>
                {phase === 'down' ? '↓ ABAJO' : '↑ ARRIBA'}
              </span>
              {angle !== null && <span className="angle">{angle}°</span>}
            </div>

            <div className="controls">
              <button
                className="btn-secondary"
                onClick={() => { setReps(0); phaseRef.current = 'up'; setPhase('up'); }}
              >
                Reiniciar
              </button>
              <button className="btn-danger" onClick={stop}>Parar</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
