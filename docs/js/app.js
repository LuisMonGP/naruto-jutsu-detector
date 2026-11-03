/**
 * Naruto Jutsu Detector — Real-Time Computer Vision & WebGL Canvas Engine
 * Powered by Google MediaPipe Hands (WebAssembly / GPU accelerated)
 */

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('webcam');
  const canvas = document.getElementById('output-canvas');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('start-btn');
  const startOverlay = document.getElementById('start-overlay');
  const currentSealEl = document.getElementById('current-seal');
  const jutsuBanner = document.getElementById('jutsu-banner');
  const bannerKanji = document.getElementById('banner-kanji');
  const bannerName = document.getElementById('banner-name');
  const comboSlots = document.querySelectorAll('.slot');
  const testTriggers = document.querySelectorAll('.test-trigger');

  // Estado del sistema
  let isCameraActive = false;
  let activeJutsu = null;
  let jutsuTimer = null;
  let particles = [];
  let lightningArcs = [];
  let detectedHands = []; // Landmarks detectados por MediaPipe
  let fallbackHandPos = { x: 0.5, y: 0.5 };

  // FSM y debouncing de sellos
  let currentDetectedSeal = "NONE";
  let lastFrameSeal = "NONE";
  let sealFrameCounter = 0;
  const DEBOUNCE_FRAMES = 4;
  let comboHistory = []; // [{ seal: 'TORA', time: timestamp }]
  const COMBO_WINDOW_MS = 4000;

  // Conexiones óseas de la mano (21 landmarks)
  const HAND_CONNECTIONS = [
    // Pulgar
    [0, 1], [1, 2], [2, 3], [3, 4],
    // Índice
    [0, 5], [5, 6], [6, 7], [7, 8],
    // Medio
    [0, 9], [9, 10], [10, 11], [11, 12],
    // Anular
    [0, 13], [13, 14], [14, 15], [15, 16],
    // Meñique
    [0, 17], [17, 18], [18, 19], [19, 20],
    // Base de la palma
    [5, 9], [9, 13], [13, 17]
  ];

  // Ajuste de resolución de Canvas
  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth || 960;
    canvas.height = canvas.parentElement.clientHeight || 540;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ==========================================
  // CLASIFICADOR GEOMÉTRICO DE SELLOS
  // ==========================================
  function calculateAngle(p1, p2, p3) {
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y, z: (p1.z || 0) - (p2.z || 0) };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y, z: (p3.z || 0) - (p2.z || 0) };
    const norm1 = Math.hypot(v1.x, v1.y, v1.z);
    const norm2 = Math.hypot(v2.x, v2.y, v2.z);
    if (norm1 * norm2 < 1e-6) return 0;
    const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const cosTheta = Math.max(-1, Math.min(1, dot / (norm1 * norm2)));
    return Math.acos(cosTheta) * (180 / Math.PI);
  }

  function getFingerAngles(landmarks) {
    return {
      thumb: calculateAngle(landmarks[1], landmarks[2], landmarks[4]),
      index: calculateAngle(landmarks[5], landmarks[6], landmarks[8]),
      middle: calculateAngle(landmarks[9], landmarks[10], landmarks[12]),
      ring: calculateAngle(landmarks[13], landmarks[14], landmarks[16]),
      pinky: calculateAngle(landmarks[17], landmarks[18], landmarks[20])
    };
  }

  function classifyHandSeals(handsList) {
    if (!handsList || handsList.length === 0) return "NONE";

    const hand1 = handsList[0];
    const angles1 = getFingerAngles(hand1);
    const hand2 = handsList[1] || null;
    const angles2 = hand2 ? getFingerAngles(hand2) : null;

    let distBetweenWrists = 1.0;
    if (hand2) {
      distBetweenWrists = Math.hypot(hand1[0].x - hand2[0].x, hand1[0].y - hand2[0].y);
    }

    // -------------------------------------------------------------
    // 1. CONFIGURACIONES BIMANUALES (ZODÍACO NINJA Y SELLOS COMPUESTOS)
    // Se evalúan primero para evitar falsos positivos con posturas abiertas
    // -------------------------------------------------------------
    if (angles2 && distBetweenWrists < 0.42) {
      // Sello de Cruz Kage Bunshin
      if (
        angles1.index > 135 &&
        angles2.index > 135 &&
        angles1.ring < 110 &&
        angles2.ring < 110
      ) {
        return "KAGE_BUNSHIN_CROSS";
      }

      // Perro (Inu): Una mano abierta plana sobre un puño cerrado
      const m1Open = angles1.index > 130 && angles1.middle > 130 && angles1.ring > 130 && angles1.pinky > 130;
      const m2Closed = angles2.index < 110 && angles2.middle < 110 && angles2.ring < 110 && angles2.pinky < 110;
      const m2Open = angles2.index > 130 && angles2.middle > 130 && angles2.ring > 130 && angles2.pinky > 130;
      const m1Closed = angles1.index < 110 && angles1.middle < 110 && angles1.ring < 110 && angles1.pinky < 110;
      if ((m1Open && m2Closed) || (m2Open && m1Closed)) {
        return "INU";
      }

      // Jabalí (I): Ambas manos en puño cerrado
      if (
        angles1.index < 115 && angles1.middle < 115 && angles1.ring < 115 && angles1.pinky < 115 &&
        angles2.index < 115 && angles2.middle < 115 && angles2.ring < 115 && angles2.pinky < 115
      ) {
        return "I";
      }

      // Pájaro (Tori): Pulgares y meñiques extendidos, dedos centrales plegados
      if (
        angles1.pinky > 125 && angles2.pinky > 125 &&
        angles1.middle < 120 && angles2.middle < 120
      ) {
        return "TORI";
      }

      // Caballo (Uma): Índices en tienda triangular, dedos restantes plegados
      if (
        angles1.index > 140 && angles2.index > 140 &&
        angles1.middle < 110 && angles2.middle < 110 &&
        angles1.pinky < 100
      ) {
        return "UMA";
      }

      // Rata (Ne): Índice y medio erguidos envueltos por la otra mano
      if (
        angles1.index > 140 && angles1.middle > 140 && angles1.ring < 105 &&
        angles2.middle < 120 && angles2.ring < 120 && angles2.pinky < 120
      ) {
        return "NE";
      }

      // Buey (Ushi): Mano 1 extendida, mano 2 cruzada
      if (
        angles1.index > 135 && angles1.middle > 135 &&
        angles2.index > 135 && angles2.ring < 105
      ) {
        return "USHI";
      }

      // Carnero (Hitsuji): Índices y medios rectos juntos en paralelo
      if (
        angles1.index > 145 && angles1.middle > 145 &&
        angles2.index > 140 && angles2.middle > 140 &&
        angles1.pinky < 105
      ) {
        return "HITSUJI";
      }

      // Tigre (Tora): Índices erguidos hacia arriba juntos
      if (
        angles1.index > 145 && angles2.index > 140 &&
        angles1.ring < 105 && angles2.ring < 105
      ) {
        return "TORA";
      }

      // Mono (Saru): Dedos extendidos horizontalmente entre ambas manos
      if (
        angles1.index > 130 && angles1.middle > 130 && angles1.ring > 130 &&
        angles2.index > 130 && angles2.middle > 130 && angles2.ring > 130
      ) {
        return "SARU";
      }

      // Dragón (Tatsu) / Serpiente (Mi): Manos entrelazadas
      if (angles1.thumb > 130 && angles2.thumb > 130) {
        return "TATSU";
      }
      return "MI";
    }

    // -------------------------------------------------------------
    // 2. GESTOS UNIMANUALES O STANDALONE
    // -------------------------------------------------------------
    // Palma Abierta (Rasengan): los 5 dedos extendidos
    if (
      angles1.thumb > 138 &&
      angles1.index > 138 &&
      angles1.middle > 138 &&
      angles1.ring > 138 &&
      angles1.pinky > 138
    ) {
      return "OPEN_PALM";
    }

    // Carnero unimanual: Índices y medios rectos
    if (
      angles1.index > 145 &&
      angles1.middle > 145 &&
      angles1.pinky < 100
    ) {
      return "HITSUJI";
    }

    // Liebre (U): Forma de pistola (pulgar e índice extendidos)
    if (
      angles1.thumb > 135 &&
      angles1.index > 140 &&
      angles1.middle < 105 &&
      angles1.ring < 105 &&
      angles1.pinky < 105
    ) {
      return "U";
    }

    // Tigre unimanual: Solo índice erguido, los demás replegados
    if (
      angles1.index > 145 &&
      angles1.middle < 100 &&
      angles1.ring < 100 &&
      angles1.pinky < 100 &&
      angles1.thumb <= 135
    ) {
      return "TORA";
    }

    return "NONE";
  }

  // ==========================================
  // FSM DE JUTSUS Y GESTIÓN DE COMBOS
  // ==========================================
  function updateComboState(seal) {
    const now = performance.now();

    // Limpiar expirados
    comboHistory = comboHistory.filter(item => now - item.time < COMBO_WINDOW_MS);

    // Debounce
    if (seal === lastFrameSeal && seal !== "NONE") {
      sealFrameCounter++;
      if (sealFrameCounter === DEBOUNCE_FRAMES) {
        // Añadir a historial si no es idéntico al último
        const lastInHistory = comboHistory[comboHistory.length - 1];
        if (!lastInHistory || lastInHistory.seal !== seal) {
          comboHistory.push({ seal, time: now });
          updateComboSlotsUI();
          checkJutsuActivation();
        }
      }
    } else {
      lastFrameSeal = seal;
      sealFrameCounter = 1;
    }
  }

  function updateComboSlotsUI() {
    comboSlots.forEach((slot, idx) => {
      if (comboHistory[idx]) {
        slot.classList.add('active');
      } else {
        slot.classList.remove('active');
      }
    });
  }

  function checkJutsuActivation() {
    const seq = comboHistory.map(item => item.seal);

    // Recetas
    // Katon: MI -> HITSUJI -> TORA
    if (seq.length >= 3 && seq.slice(-3).join(',') === 'MI,HITSUJI,TORA') {
      triggerJutsu('KATON');
      comboHistory = [];
      updateComboSlotsUI();
      return;
    }

    // Chidori: TORA -> HITSUJI
    if (seq.length >= 2 && seq.slice(-2).join(',') === 'TORA,HITSUJI') {
      triggerJutsu('CHIDORI');
      comboHistory = [];
      updateComboSlotsUI();
      return;
    }

    // Rasengan: OPEN_PALM
    if (seq.length >= 1 && seq[seq.length - 1] === 'OPEN_PALM') {
      triggerJutsu('RASENGAN');
      comboHistory = [];
      updateComboSlotsUI();
      return;
    }

    // Kage Bunshin: KAGE_BUNSHIN_CROSS
    if (seq.length >= 1 && seq[seq.length - 1] === 'KAGE_BUNSHIN_CROSS') {
      triggerJutsu('KAGE_BUNSHIN');
      comboHistory = [];
      updateComboSlotsUI();
      return;
    }
  }

  // ==========================================
  // DISPARO DE TÉCNICAS (VFX Y TEXTOS)
  // ==========================================
  function triggerJutsu(type) {
    activeJutsu = type;
    if (jutsuTimer) clearTimeout(jutsuTimer);

    if (type === 'KATON') {
      bannerKanji.textContent = '火遁·豪火球の術';
      bannerName.textContent = 'KATON: GŌKAKYŪ NO JUTSU';
      currentSealEl.textContent = 'Jutsu: Bola de Fuego';
      comboSlots.forEach(s => s.classList.add('active'));
    } else if (type === 'CHIDORI') {
      bannerKanji.textContent = '千鳥';
      bannerName.textContent = 'CHIDORI (MILLAR DE AVES)';
      currentSealEl.textContent = 'Jutsu: Chidori Eléctrico';
      comboSlots.forEach(s => s.classList.add('active'));
    } else if (type === 'RASENGAN') {
      bannerKanji.textContent = '螺旋丸';
      bannerName.textContent = 'RASENGAN';
      currentSealEl.textContent = 'Jutsu: Rasengan en Palma';
      comboSlots.forEach(s => s.classList.add('active'));
    } else if (type === 'KAGE_BUNSHIN') {
      bannerKanji.textContent = '影分身の術';
      bannerName.textContent = 'KAGE BUNSHIN NO JUTSU';
      currentSealEl.textContent = 'Jutsu: Clones de Sombra';
      comboSlots.forEach(s => s.classList.add('active'));
    }

    jutsuBanner.classList.remove('hidden');

    // Duración de la técnica
    jutsuTimer = setTimeout(() => {
      jutsuBanner.classList.add('hidden');
      activeJutsu = null;
      comboSlots.forEach(s => s.classList.remove('active'));
      currentSealEl.textContent = 'Esperando siguiente sello...';
    }, 4500);
  }

  // Botones de prueba manual de Jutsus
  testTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerJutsu(btn.dataset.jutsu);
    });
  });

  // Mapeo completo de los 12 sellos canónicos + técnicas especiales
  const sealNamesMap = {
    'TORI': 'Pájaro (酉 · Tori)',
    'I': 'Jabalí (亥 · I)',
    'INU': 'Perro (戌 · Inu)',
    'TATSU': 'Dragón (辰 · Tatsu)',
    'U': 'Liebre (卯 · U)',
    'UMA': 'Caballo (午 · Uma)',
    'SARU': 'Mono (申 · Saru)',
    'USHI': 'Buey (丑 · Ushi)',
    'HITSUJI': 'Carnero (未 · Hitsuji)',
    'NE': 'Rata (子 · Ne)',
    'MI': 'Serpiente (巳 · Mi)',
    'TORA': 'Tigre (寅 · Tora)',
    'KAGE_BUNSHIN_CROSS': 'Cruz de Clones',
    'OPEN_PALM': 'Palma Abierta (Rasengan)',
    'NONE': 'Mano activa (sin sello)'
  };

  function updateSealTilesHighlight(activeSeal) {
    document.querySelectorAll('.seal-tile, .dock-item').forEach(el => {
      if (activeSeal && el.dataset.seal === activeSeal) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  // Control de Pestañas (Los 12 Sellos vs Fórmulas de Jutsus)
  const tabSealsBtn = document.getElementById('tab-seals-btn');
  const tabJutsusBtn = document.getElementById('tab-jutsus-btn');
  const viewSeals = document.getElementById('view-seals');
  const viewJutsus = document.getElementById('view-jutsus');

  if (tabSealsBtn && tabJutsusBtn && viewSeals && viewJutsus) {
    tabSealsBtn.addEventListener('click', () => {
      tabSealsBtn.classList.add('active');
      tabJutsusBtn.classList.remove('active');
      viewSeals.classList.remove('hidden');
      viewJutsus.classList.add('hidden');
    });

    tabJutsusBtn.addEventListener('click', () => {
      tabJutsusBtn.classList.add('active');
      tabSealsBtn.classList.remove('active');
      viewJutsus.classList.remove('hidden');
      viewSeals.classList.add('hidden');
    });
  }

  // Clic interactivo en los 12 sellos (barra lateral y dock inferior) para simulación / prueba directa
  const interactiveSealElements = document.querySelectorAll('.seal-tile, .dock-item');
  interactiveSealElements.forEach(el => {
    el.addEventListener('click', () => {
      const seal = el.dataset.seal;
      if (!seal) return;

      updateSealTilesHighlight(seal);
      const name = sealNamesMap[seal] || seal;

      // Anclar posición de VFX al centro de la pantalla
      fallbackHandPos = { x: 0.5, y: 0.5 };

      // Registrar sello en el historial de combo FSM
      const now = performance.now();
      comboHistory.push({ seal, time: now });
      if (comboHistory.length > 3) comboHistory.shift();
      updateComboSlotsUI();
      checkJutsuActivation();

      if (!activeJutsu) {
        currentSealEl.textContent = `Sello: ${name}`;
      }
    });
  });

  // Movimiento interactivo del ratón como soporte de respaldo
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    fallbackHandPos.x = (e.clientX - rect.left) / canvas.width;
    fallbackHandPos.y = (e.clientY - rect.top) / canvas.height;
  });

  // ==========================================
  // SISTEMA DE PARTÍCULAS Y ARCOS VOLUMÉTRICOS
  // ==========================================
  class Particle {
    constructor(originX, originY, type) {
      this.type = type;
      this.x = originX;
      this.y = originY;
      this.alpha = 1.0;

      if (type === 'RASENGAN') {
        // Vórtice orbital rotatorio en la palma
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * 55 + 10;
        this.speedAngle = 0.18 + Math.random() * 0.08;
        this.size = Math.random() * 5 + 2;
        this.decay = 0.015;
        this.color = Math.random() > 0.3 ? '#38bdf8' : '#e0f2fe';
      } else if (type === 'CHIDORI') {
        // Chispas de alta energía saliendo de la mano
        this.size = Math.random() * 4 + 2;
        this.speedX = (Math.random() - 0.5) * 16;
        this.speedY = (Math.random() - 0.5) * 16;
        this.decay = 0.04;
        this.color = Math.random() > 0.4 ? '#ffffff' : '#38bdf8';
      } else if (type === 'KATON') {
        // Bola de fuego expansiva desde el centro
        const spread = (Math.random() - 0.5) * Math.PI * 0.9;
        const speed = Math.random() * 9 + 4;
        this.speedX = Math.sin(spread) * speed;
        this.speedY = -Math.cos(spread) * speed - 1; // Ascendente
        this.size = Math.random() * 22 + 10;
        this.decay = 0.018;
        const colors = ['#ea580c', '#f97316', '#fbbf24', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      } else if (type === 'KAGE_BUNSHIN') {
        // Nube de humo volumétrica radial desde el centro
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 2;
        this.speedX = Math.cos(angle) * speed;
        this.speedY = Math.sin(angle) * speed;
        this.size = Math.random() * 32 + 18;
        this.decay = 0.012;
        this.color = Math.random() > 0.5 ? '#94a3b8' : '#e2e8f0';
      }
    }

    update(centerAnchor) {
      if (this.type === 'RASENGAN') {
        this.angle += this.speedAngle;
        this.x = centerAnchor.x + Math.cos(this.angle) * this.radius;
        this.y = centerAnchor.y + Math.sin(this.angle) * this.radius;
        this.alpha -= this.decay;
      } else {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
        if (this.type === 'KATON' || this.type === 'KAGE_BUNSHIN') {
          this.size += 0.4; // Expansión volumétrica
        }
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Generador de Rayos Procedimentales para Chidori
  function drawChidoriLightning(ctx, startX, startY) {
    const numBolts = 4;
    ctx.save();
    for (let b = 0; b < numBolts; b++) {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      let currX = startX;
      let currY = startY;
      const targetAngle = Math.random() * Math.PI * 2;
      const totalDist = Math.random() * 90 + 50;
      const steps = 7;

      for (let s = 1; s <= steps; s++) {
        const segDist = (totalDist / steps);
        currX += Math.cos(targetAngle) * segDist + (Math.random() - 0.5) * 24;
        currY += Math.sin(targetAngle) * segDist + (Math.random() - 0.5) * 24;
        ctx.lineTo(currX, currY);
      }

      ctx.strokeStyle = Math.random() > 0.4 ? '#ffffff' : '#38bdf8';
      ctx.lineWidth = Math.random() * 3 + 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  // ==========================================
  // DIBUJADO DE ESQUELETO Y PUNTOS ARTICULARES
  // ==========================================
  function drawHandSkeleton(ctx, landmarks) {
    const w = canvas.width;
    const h = canvas.height;

    ctx.save();

    // 1. Dibujar líneas de conexión ósea
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const [i, j] of HAND_CONNECTIONS) {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    }

    // 2. Dibujar articulaciones y nudillos (21 puntos)
    for (let i = 0; i < landmarks.length; i++) {
      const pt = landmarks[i];
      const px = pt.x * w;
      const py = pt.y * h;

      // Nudillos principales y yemas con radio mayor
      const isTip = [4, 8, 12, 16, 20].includes(i);
      const radius = isTip ? 4.5 : 3.0;

      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = isTip ? '#ffffff' : '#0284c7';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.restore();
  }

  // ==========================================
  // INICIALIZACIÓN DE MEDIAPIPE HANDS
  // ==========================================
  let handsModel = null;
  let cameraHelper = null;

  async function initMediaPipe() {
    if (typeof Hands === 'undefined') {
      console.warn('MediaPipe Hands no disponible aún, reintentando...');
      setTimeout(initMediaPipe, 200);
      return;
    }

    handsModel = new Hands({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    handsModel.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    });

    handsModel.onResults((results) => {
      detectedHands = results.multiHandLandmarks || [];

      if (detectedHands.length > 0) {
        currentDetectedSeal = classifyHandSeals(detectedHands);
        updateComboState(currentDetectedSeal);
        updateSealTilesHighlight(currentDetectedSeal);

        if (!activeJutsu) {
          currentSealEl.textContent = sealNamesMap[currentDetectedSeal] || 'Mano activa';
        }
      } else {
        currentDetectedSeal = 'NONE';
        updateSealTilesHighlight(null);
        if (!activeJutsu) {
          currentSealEl.textContent = 'Buscando manos...';
        }
      }
    });

    // Iniciar bucle de envío de frames
    async function sendVideoFrame() {
      if (isCameraActive && video.readyState >= 2) {
        await handsModel.send({ image: video });
      }
      requestAnimationFrame(sendVideoFrame);
    }
    requestAnimationFrame(sendVideoFrame);
  }

  // Botón Activar Cámara
  startBtn.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      isCameraActive = true;
      startOverlay.style.display = 'none';
      currentSealEl.textContent = 'Calibrando MediaPipe...';

      initMediaPipe();
    } catch (err) {
      console.warn('Cámara no accesible o denegada:', err);
      startOverlay.style.display = 'none';
      currentSealEl.textContent = 'Modo simulación (usa los botones laterales)';
    }
  });

  // ==========================================
  // BUCLE DE RENDERIZADO VFX A 60 FPS
  // ==========================================
  function renderLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dibujar los puntos y esqueleto de todas las manos detectadas
    const currentHands = (window.mockHandTest && window.mockHandTest.length > 0) ? [window.mockHandTest] : detectedHands;
    if (currentHands && currentHands.length > 0) {
      for (const hand of currentHands) {
        drawHandSkeleton(ctx, hand);
      }
    }

    // 2. Determinar posición del anclaje según el Jutsu activo
    let handAnchor = {
      x: fallbackHandPos.x * canvas.width,
      y: fallbackHandPos.y * canvas.height
    };

    // Si hay mano detectada, anclar Rasengan/Chidori exactamente a la palma (promedio de muñeca 0 y base de dedo 9)
    if (currentHands && currentHands.length > 0) {
      const primaryHand = currentHands[0];
      handAnchor.x = ((primaryHand[0].x + primaryHand[9].x) * 0.5) * canvas.width;
      handAnchor.y = ((primaryHand[0].y + primaryHand[9].y) * 0.5) * canvas.height;
    }

    // Centro focal de pantalla para Katon y Kage Bunshin
    const centerAnchor = {
      x: canvas.width * 0.5,
      y: canvas.height * 0.55
    };

    // 3. Generación continua de partículas según la técnica
    if (activeJutsu) {
      if (activeJutsu === 'RASENGAN') {
        // Rasengan sale directamente de la palma de la mano
        for (let i = 0; i < 6; i++) {
          particles.push(new Particle(handAnchor.x, handAnchor.y, 'RASENGAN'));
        }
      } else if (activeJutsu === 'CHIDORI') {
        // Chidori: chispas y relámpagos emanando de la mano
        for (let i = 0; i < 5; i++) {
          particles.push(new Particle(handAnchor.x, handAnchor.y, 'CHIDORI'));
        }
        drawChidoriLightning(ctx, handAnchor.x, handAnchor.y);
      } else if (activeJutsu === 'KATON') {
        // Katon: Bola de fuego emanando del CENTRO de la pantalla
        for (let i = 0; i < 7; i++) {
          particles.push(new Particle(centerAnchor.x, centerAnchor.y, 'KATON'));
        }
      } else if (activeJutsu === 'KAGE_BUNSHIN') {
        // Kage Bunshin: Nube de humo volumétrica emanando del CENTRO
        for (let i = 0; i < 8; i++) {
          particles.push(new Particle(centerAnchor.x, centerAnchor.y, 'KAGE_BUNSHIN'));
        }
      }
    }

    // 4. Actualizar y dibujar partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const targetAnchor = (p.type === 'RASENGAN' || p.type === 'CHIDORI') ? handAnchor : centerAnchor;
      p.update(targetAnchor);
      p.draw(ctx);
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(renderLoop);
  }

  requestAnimationFrame(renderLoop);
});
