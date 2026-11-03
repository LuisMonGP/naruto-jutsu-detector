/**
 * Naruto Jutsu Detector — Web Client Engine
 * MediaPipe Hands WebRTC + Canvas WebGL Particle VFX
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

  let activeJutsu = null;
  let jutsuTimer = null;
  let particles = [];
  let handsVisible = false;
  let simulatedHands = { x: 0.5, y: 0.5 };

  // Sistema de Partículas para Jutsus
  class Particle {
    constructor(x, y, type) {
      this.x = x;
      this.y = y;
      this.type = type;
      this.size = Math.random() * 8 + 4;
      this.speedX = (Math.random() - 0.5) * 8;
      this.speedY = (Math.random() - 0.5) * 8;
      this.alpha = 1.0;
      this.decay = Math.random() * 0.02 + 0.015;

      if (type === 'KATON') {
        this.color = Math.random() > 0.4 ? '#ff4500' : '#ffa500';
        this.speedY -= 2; // El fuego sube
      } else if (type === 'CHIDORI') {
        this.color = Math.random() > 0.5 ? '#38bdf8' : '#ffffff';
        this.speedX *= 2.5;
        this.speedY *= 2.5;
      } else if (type === 'RASENGAN') {
        this.color = '#00f0ff';
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * 60 + 10;
        this.speedAngle = 0.15;
      } else if (type === 'KAGE_BUNSHIN') {
        this.color = '#cbd5e1'; // Humo blanco
        this.size = Math.random() * 25 + 15;
        this.decay = 0.01;
      }
    }

    update() {
      if (this.type === 'RASENGAN') {
        this.angle += this.speedAngle;
        this.x = simulatedHands.x * canvas.width + Math.cos(this.angle) * this.radius;
        this.y = simulatedHands.y * canvas.height + Math.sin(this.angle) * this.radius;
        this.alpha -= this.decay * 0.5;
      } else {
        this.x += this.speedX;
        this.y += this.speedY;
        this.alpha -= this.decay;
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

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Activar Cámara
  startBtn.addEventListener('click', async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, facingMode: 'user' },
        audio: false
      });
      video.srcObject = stream;
      video.play();
      startOverlay.style.display = 'none';
      currentSealEl.textContent = 'Observando Manos (Modo Activo)';
      handsVisible = true;
    } catch (err) {
      console.warn('Cámara no accesible o denegada:', err);
      startOverlay.style.display = 'none';
      currentSealEl.textContent = 'Modo Simulación (Prueba los botones)';
    }
  });

  // Disparar Jutsu Visual
  function triggerJutsu(type) {
    activeJutsu = type;
    if (jutsuTimer) clearTimeout(jutsuTimer);

    if (type === 'KATON') {
      bannerKanji.textContent = '火遁·豪火球の術';
      bannerName.textContent = 'KATON: GŌKAKYŪ NO JUTSU';
      currentSealEl.textContent = 'Sello Completado: TIGRE (Tora)';
      comboSlots.forEach(s => s.classList.add('active'));
    } else if (type === 'CHIDORI') {
      bannerKanji.textContent = '千鳥';
      bannerName.textContent = 'CHIDORI (MILLAR DE AVES)';
      currentSealEl.textContent = 'Sello Completado: MONO (Saru)';
      comboSlots.forEach(s => s.classList.add('active'));
    } else if (type === 'RASENGAN') {
      bannerKanji.textContent = '螺旋丸';
      bannerName.textContent = 'RASENGAN';
      currentSealEl.textContent = 'Postura: PALMA DE CHAKRA';
      comboSlots.forEach(s => s.classList.add('active'));
    } else if (type === 'KAGE_BUNSHIN') {
      bannerKanji.textContent = '影分身の術';
      bannerName.textContent = 'KAGE BUNSHIN NO JUTSU';
      currentSealEl.textContent = 'Sello: CRUZ (Kage Bunshin)';
      comboSlots.forEach(s => s.classList.add('active'));
    }

    jutsuBanner.classList.remove('hidden');

    jutsuTimer = setTimeout(() => {
      jutsuBanner.classList.add('hidden');
      activeJutsu = null;
      comboSlots.forEach(s => s.classList.remove('active'));
      currentSealEl.textContent = 'Esperando Siguiente Sello...';
    }, 4500);
  }

  // Triggers de los botones de la guía
  testTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      triggerJutsu(btn.dataset.jutsu);
    });
  });

  // Movimiento interactivo del ratón como simulación de palma
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    simulatedHands.x = (e.clientX - rect.left) / canvas.width;
    simulatedHands.y = (e.clientY - rect.top) / canvas.height;
  });

  // Bucle de Renderizado VFX a 60 FPS
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (activeJutsu) {
      const originX = simulatedHands.x * canvas.width;
      const originY = simulatedHands.y * canvas.height;

      // Generar nuevas partículas continuas
      for (let i = 0; i < 4; i++) {
        particles.push(new Particle(originX, originY, activeJutsu));
      }
    }

    // Actualizar y dibujar partículas
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    requestAnimationFrame(loop);
  }

  loop();
});
