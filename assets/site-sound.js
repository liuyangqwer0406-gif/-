(() => {
  if (window.__siteSoundMounted) return;
  window.__siteSoundMounted = true;

  const STORAGE_KEY = "wyf-sound-v1";
  const OUTPUT_SCALE = 0.58;
  const tracks = [
    {
      title: "COALESCE",
      artist: "FAODAIL / LOCAL 01",
      src: "assets/audio/coalesce.mp3",
      root: 110,
      scale: [0, 3, 7, 10, 12],
      tempo: 2.2,
      duration: 332.4
    },
    {
      title: "CREDITS",
      artist: "JUSTIN HURWITZ / LOCAL 02",
      src: "assets/audio/credits.mp3",
      root: 146.83,
      scale: [0, 2, 5, 9, 12],
      tempo: 1.65,
      duration: 219.3
    },
    {
      title: "ECDYSIS",
      artist: "FLUME / LOCAL 03",
      src: "assets/audio/ecdysis.mp3",
      root: 98,
      scale: [0, 4, 7, 11, 14],
      tempo: 2.8,
      duration: 104.9
    },
    {
      title: "IN THE RAIN",
      artist: "KINOYO / LOCAL 04",
      src: "assets/audio/in-the-rain.mp3",
      root: 130.81,
      scale: [0, 3, 5, 7, 10],
      tempo: 1.25,
      duration: 160
    }
  ];

  const readStore = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
    } catch (_) {
      return {};
    }
  };
  const writeStore = (patch) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readStore(), ...patch }));
    } catch (_) {}
  };

  const stored = readStore();
  // defer scripts clear document.currentScript; locate by src instead
  const scriptEl = document.currentScript
    || document.querySelector('script[src*="site-sound.js"]')
    || document.querySelector('script[data-three]');
  const rootPath = scriptEl?.dataset?.root || "";
  const threeAttr = scriptEl?.dataset?.three || "";
  const threePath = threeAttr
    || `${rootPath}assets/vendor/three/three.module.js`;
  // Resolve relative module URL against the page so dynamic import works from / and /projects/
  const threeUrl = new URL(threePath, window.location.href).href;
  const defaultSurface = scriptEl?.dataset?.surface || "dark";

  const dock = document.createElement("aside");
  dock.className = "sound-dock";
  dock.id = "soundDock";
  dock.dataset.surface = defaultSurface;
  dock.dataset.state = "default";
  dock.setAttribute("aria-label", "全站音乐播放器");
  dock.innerHTML = `
    <div class="dock-shell" id="dockShell" aria-hidden="true" inert>
      <div class="dock-panel">
        <header class="dock-head">
          <span class="dock-status" id="dockStatus" aria-live="polite">Sound off</span>
          <span class="panel-count">SND / 0${tracks.length}</span>
        </header>

        <div class="record-stage" id="recordStage">
          <div class="record-wrap" id="recordWrap">
            <div class="record-viewport" id="recordViewport" aria-hidden="true">
              <div class="record-fallback"></div>
              <div class="record-canvas-host" id="recordCanvasHost"></div>
            </div>
          </div>
          <div class="sound-scan" aria-hidden="true">
            <span class="sound-scan-scale"></span>
            <span class="sound-scan-track"></span>
            <span class="sound-scan-head"></span>
            <div class="sound-scan-readout">
              <span>Phase <b>00</b></span>
              <span>Rate <b>33.3</b></span>
              <span>Side <b>A</b></span>
            </div>
          </div>
          <button class="record-play" type="button" data-action="toggle" aria-label="播放" aria-pressed="false"></button>
        </div>
        <div class="render-note" aria-hidden="true"><span>33⅓ RPM</span><span id="renderMode">CSS standby</span></div>

        <section aria-labelledby="trackTitle">
          <p class="track-kicker">Now selected</p>
          <h2 class="track-title" id="trackTitle"></h2>
          <p class="track-artist" id="trackArtist"></p>
        </section>

        <div class="progress-wrap">
          <input class="progress-input" id="progressInput" type="range" min="0" max="100" value="0" step=".1" aria-label="播放进度">
          <div class="progress-track" aria-hidden="true"><span class="progress-fill" id="progressFill"></span></div>
          <div class="time-row"><time id="timeCurrent">00:00</time><time id="timeTotal">00:00</time></div>
        </div>

        <div class="controls">
          <button class="control" type="button" data-action="prev"><span>PREV</span></button>
          <button class="control control--accent" type="button" data-action="toggle"><span>PLAY</span></button>
          <button class="control" type="button" data-action="next"><span>NEXT</span></button>
          <button class="control" type="button" data-action="list" aria-expanded="false"><span>LIST</span></button>
        </div>

        <label class="volume-row">
          <span>Volume</span>
          <input class="volume-input" id="volumeInput" type="range" min="0" max="100" value="${Number.isFinite(stored.volume) ? stored.volume : 42}" aria-label="音量">
          <output class="volume-output" id="volumeOutput">${Number.isFinite(stored.volume) ? stored.volume : 42}</output>
        </label>
      </div>

      <section class="playlist" id="playlist" aria-hidden="true">
        <header class="playlist-head">
          <h2>Sound selection</h2>
          <button class="playlist-close" type="button" aria-label="关闭歌单">×</button>
        </header>
        <ol class="playlist-list" id="playlistList"></ol>
        <p class="playlist-note">本地音轨已接入；若文件加载失败，播放器会自动切换到程序音色。</p>
      </section>
    </div>

    <button class="dock-handle" type="button" id="dockHandle" aria-expanded="false" aria-label="展开音乐播放器">
      <span class="handle-led" aria-hidden="true"></span>
      <span class="handle-label">Sound</span>
      <span class="handle-arrow" aria-hidden="true">→</span>
    </button>
    <span class="sd-sr" id="liveMessage" aria-live="polite"></span>
  `;
  document.body.appendChild(dock);

  const shell = dock.querySelector("#dockShell");
  const handle = dock.querySelector("#dockHandle");
  const status = dock.querySelector("#dockStatus");
  const recordWrap = dock.querySelector("#recordWrap");
  const recordViewport = dock.querySelector("#recordViewport");
  const canvasHost = dock.querySelector("#recordCanvasHost");
  const renderMode = dock.querySelector("#renderMode");
  const trackTitle = dock.querySelector("#trackTitle");
  const trackArtist = dock.querySelector("#trackArtist");
  const progressInput = dock.querySelector("#progressInput");
  const progressFill = dock.querySelector("#progressFill");
  const timeCurrent = dock.querySelector("#timeCurrent");
  const timeTotal = dock.querySelector("#timeTotal");
  const volumeInput = dock.querySelector("#volumeInput");
  const volumeOutput = dock.querySelector("#volumeOutput");
  const playlist = dock.querySelector("#playlist");
  const playlistList = dock.querySelector("#playlistList");
  const listButton = dock.querySelector('[data-action="list"]');
  const liveMessage = dock.querySelector("#liveMessage");
  const playButtons = [...dock.querySelectorAll('[data-action="toggle"]')];
  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = matchMedia("(hover: hover) and (pointer: fine)");

  let currentTrack = Number.isFinite(stored.track) ? Math.min(tracks.length - 1, Math.max(0, stored.track)) : 0;
  let isPlaying = false;
  let isOpen = false;
  let elapsed = 0;
  let startedAt = 0;
  let progressFrame = 0;
  let audioContext = null;
  let master = null;
  let toneNodes = [];
  let pluckTimer = 0;
  const audio = new Audio();
  audio.preload = "none";
  audio.playsInline = true;
  let usingFallback = false;
  let audioLoadFailed = false;
  let loadedTrack = -1;

  const getOutputGain = () => Math.max(0, Math.min(1, Number(volumeInput.value) / 100)) * OUTPUT_SCALE;
  const getTrackDuration = () => (
    !usingFallback && Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : tracks[currentTrack].duration
  );

  const formatTime = (seconds) => {
    const value = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  };
  const announce = (message) => { liveMessage.textContent = message; };

  const renderTrack = () => {
    const track = tracks[currentTrack];
    trackTitle.textContent = track.title;
    trackArtist.textContent = track.artist;
    timeTotal.textContent = formatTime(getTrackDuration());
    elapsed = 0;
    progressInput.value = "0";
    progressFill.style.width = "0%";
    timeCurrent.textContent = "00:00";
    [...playlistList.querySelectorAll(".track-row")].forEach((row, index) => {
      row.setAttribute("aria-current", String(index === currentTrack));
    });
    writeStore({ track: currentTrack });
  };

  const loadCurrentTrack = () => {
    if (loadedTrack === currentTrack) return;
    audio.pause();
    usingFallback = false;
    audioLoadFailed = false;
    audio.src = new URL(`${rootPath}${tracks[currentTrack].src}`, window.location.href).href;
    loadedTrack = currentTrack;
    audio.load();
  };

  const unloadCurrentTrack = () => {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    loadedTrack = -1;
    usingFallback = false;
    audioLoadFailed = false;
  };

  const renderPlaylist = () => {
    playlistList.innerHTML = tracks.map((track, index) => `
      <li>
        <button class="track-row" type="button" data-track="${index}" aria-current="${index === currentTrack}">
          <span class="track-row-index">${String(index + 1).padStart(2, "0")}</span>
          <span><span class="track-row-title">${track.title}</span><span class="track-row-artist">${track.artist}</span></span>
          <span class="track-row-mark" aria-hidden="true"></span>
        </button>
      </li>`).join("");
  };

  const ensureAudio = async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      master = audioContext.createGain();
      master.gain.value = getOutputGain();
      master.connect(audioContext.destination);
    }
    if (audioContext.state !== "running") await audioContext.resume();
    if (audioContext.state !== "running") throw new Error("Audio context did not start");
  };

  const stopTone = () => {
    clearInterval(pluckTimer);
    pluckTimer = 0;
    toneNodes.forEach((node) => {
      try { node.stop?.(); node.disconnect?.(); } catch (_) {}
    });
    toneNodes = [];
  };

  const startTone = () => {
    stopTone();
    const track = tracks[currentTrack];
    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 860;
    filter.Q.value = 0.72;
    filter.connect(master);
    toneNodes.push(filter);

    [0, 1].forEach((index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = track.root * (index ? 1.006 : 1);
      gain.gain.value = 0.045;
      oscillator.connect(gain).connect(filter);
      oscillator.start();
      toneNodes.push(oscillator, gain);
    });

    const pluck = () => {
      if (!isPlaying || document.hidden) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const now = audioContext.currentTime;
      const semitone = track.scale[Math.floor(Math.random() * track.scale.length)];
      oscillator.type = "triangle";
      oscillator.frequency.value = track.root * 2 * Math.pow(2, semitone / 12);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.07, now + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
      oscillator.connect(gain).connect(filter);
      oscillator.start(now);
      oscillator.stop(now + 1.3);
    };
    pluck();
    pluckTimer = setInterval(pluck, track.tempo * 1000);
  };

  const updatePlayUi = () => {
    dock.classList.toggle("is-playing", isPlaying);
    status.textContent = isPlaying ? (usingFallback ? "Playing / fallback" : "Playing") : "Sound off";
    playButtons.forEach((button, index) => {
      button.setAttribute("aria-pressed", String(isPlaying));
      button.setAttribute("aria-label", isPlaying ? "暂停" : "播放");
      if (index === 1) button.querySelector("span").textContent = isPlaying ? "PAUSE" : "PLAY";
    });
  };

  let lastProgressPaint = -1;
  let lastProgressSecond = -1;
  const paintProgress = (current, duration) => {
    if (!Number.isFinite(duration) || duration <= 0) return;
    const percentage = Math.max(0, Math.min(100, (current / duration) * 100));
    const second = Math.floor(current);
    if (Math.abs(percentage - lastProgressPaint) >= 0.25 || second !== lastProgressSecond) {
      lastProgressPaint = percentage;
      lastProgressSecond = second;
      progressInput.value = String(percentage);
      progressFill.style.width = `${percentage}%`;
      timeCurrent.textContent = formatTime(current);
      timeTotal.textContent = formatTime(duration);
    }
  };

  const tickProgress = (now) => {
    if (!isPlaying || !usingFallback) return;
    if (document.hidden) {
      progressFrame = 0;
      return;
    }
    elapsed += (now - startedAt) / 1000;
    const duration = tracks[currentTrack].duration;
    if (elapsed >= duration) {
      selectTrack(currentTrack + 1, true);
      return;
    }
    paintProgress(elapsed, duration);
    startedAt = now;
    progressFrame = requestAnimationFrame(tickProgress);
  };

  const startPlayback = async () => {
    dock.dataset.state = "loading";
    status.textContent = "Starting";
    playButtons.forEach((button) => { button.disabled = true; });
    try {
      loadCurrentTrack();
      if (audioLoadFailed) throw new Error("Local audio failed to load");
      usingFallback = false;
      audio.volume = getOutputGain();
      await audio.play();
      isPlaying = true;
      dock.dataset.state = "success";
      updatePlayUi();
      vinylController.setPlaying(true);
      announce(`正在播放 ${tracks[currentTrack].title}`);
    } catch (_) {
      try {
        audio.pause();
        await ensureAudio();
        usingFallback = true;
        isPlaying = true;
        elapsed = 0;
        startedAt = performance.now();
        startTone();
        dock.dataset.state = "success";
        updatePlayUi();
        vinylController.setPlaying(true);
        progressFrame = requestAnimationFrame(tickProgress);
        announce("本地音轨加载失败，已切换到程序音色");
      } catch (_) {
        isPlaying = false;
        dock.dataset.state = "error";
        status.textContent = "Audio unavailable";
        announce("当前浏览器无法启动音频");
      }
    } finally {
      playButtons.forEach((button) => { button.disabled = false; });
      setTimeout(() => {
        if (dock.dataset.state === "success") dock.dataset.state = "default";
      }, 600);
    }
  };

  const selectTrack = async (index, continuePlaying = false) => {
    const shouldContinue = isPlaying || continuePlaying;
    isPlaying = false;
    audio.pause();
    stopTone();
    cancelAnimationFrame(progressFrame);
    progressFrame = 0;
    currentTrack = (index + tracks.length) % tracks.length;
    unloadCurrentTrack();
    renderTrack();
    announce(`已选择 ${tracks[currentTrack].title}`);
    if (shouldContinue) await startPlayback();
    else {
      updatePlayUi();
      vinylController.setPlaying(false);
    }
  };

  const togglePlay = async () => {
    if (isPlaying) {
      isPlaying = false;
      cancelAnimationFrame(progressFrame);
      progressFrame = 0;
      audio.pause();
      stopTone();
      if (usingFallback) {
        try { await audioContext?.suspend(); } catch (_) {}
      }
      updatePlayUi();
      vinylController.setPlaying(false);
      announce("音乐已暂停");
      return;
    }
    await startPlayback();
  };

  audio.addEventListener("loadedmetadata", () => {
    audioLoadFailed = false;
    timeTotal.textContent = formatTime(getTrackDuration());
  });
  audio.addEventListener("durationchange", () => {
    timeTotal.textContent = formatTime(getTrackDuration());
  });
  audio.addEventListener("timeupdate", () => {
    if (!usingFallback) paintProgress(audio.currentTime, getTrackDuration());
  });
  audio.addEventListener("ended", () => selectTrack(currentTrack + 1, true));
  audio.addEventListener("error", () => {
    audioLoadFailed = true;
    if (!isPlaying) status.textContent = "Local audio unavailable";
  });

  const setListOpen = (open) => {
    dock.classList.toggle("is-list-open", open);
    playlist.setAttribute("aria-hidden", String(!open));
    listButton.setAttribute("aria-expanded", String(open));
    if (open) playlist.querySelector(".track-row")?.focus();
    else listButton.focus({ preventScroll: true });
  };

  const setOpen = (open) => {
    isOpen = open;
    dock.classList.toggle("is-open", isOpen);
    shell.toggleAttribute("inert", !isOpen);
    shell.setAttribute("aria-hidden", String(!isOpen));
    handle.setAttribute("aria-expanded", String(isOpen));
    handle.setAttribute("aria-label", isOpen ? "收起音乐播放器" : "展开音乐播放器");
    writeStore({ open: isOpen });
    if (isOpen) {
      vinylController.init();
      vinylController.wake();
    } else {
      setListOpen(false);
      vinylController.sleep();
    }
  };

  const vinylController = (() => {
    const state = {
      attempted: false,
      ready: false,
      renderer: null,
      scene: null,
      camera: null,
      vinyl: null,
      texture: null,
      frame: 0,
      lastRender: 0,
      lastMotion: 0,
      rotation: 0
    };
    const frameInterval = 1000 / 30;
    const angularVelocity = (33.333 / 60) * Math.PI * 2;

    const makeTexture = (THREE) => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const context = canvas.getContext("2d");
      context.fillStyle = "#191917";
      context.fillRect(0, 0, size, size);
      for (let radius = 48; radius < 124; radius += 2.6) {
        context.beginPath();
        context.arc(128, 128, radius, 0, Math.PI * 2);
        context.strokeStyle = Math.round(radius) % 16 < 3 ? "rgba(244,243,239,.19)" : "rgba(244,243,239,.075)";
        context.lineWidth = 0.8;
        context.stroke();
      }
      context.fillStyle = "#ff5125";
      context.beginPath();
      context.arc(128, 128, 35, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "#111111";
      context.font = "600 15px Cascadia Mono, Consolas, monospace";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("WYF", 128, 121);
      context.beginPath();
      context.arc(128, 138, 3, 0, Math.PI * 2);
      context.fill();
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 2;
      return texture;
    };

    const render = () => {
      if (!state.ready) return;
      state.renderer.render(state.scene, state.camera);
    };

    const animate = (now) => {
      state.frame = 0;
      if (!state.ready || !isOpen || !isPlaying || document.hidden || reducedQuery.matches) return;
      if (now - state.lastRender >= frameInterval) {
        const delta = Math.min((now - (state.lastMotion || now)) / 1000, 0.05);
        state.lastMotion = now;
        state.lastRender = now;
        state.rotation -= angularVelocity * delta;
        state.vinyl.rotation.y = state.rotation;
        render();
      }
      state.frame = requestAnimationFrame(animate);
    };

    const wake = () => {
      if (!state.ready) return;
      render();
      if (isOpen && isPlaying && !document.hidden && !reducedQuery.matches && !state.frame) {
        state.lastMotion = performance.now();
        state.frame = requestAnimationFrame(animate);
      }
    };

    const sleep = () => {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
      state.lastMotion = 0;
    };

    const init = async () => {
      if (state.attempted) return;
      state.attempted = true;
      dock.dataset.state = "loading";
      status.textContent = isPlaying ? "Playing" : "Loading 3D";
      renderMode.textContent = "3D loading";
      try {
        const THREE = await import(threeUrl);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
        const mobile = matchMedia("(max-width: 560px)").matches;
        renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1 : 1.5));
        renderer.setSize(168, 168, false);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        canvasHost.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 20);
        camera.position.set(0, 2.75, 3.55);
        camera.lookAt(0, 0, 0);

        const texture = makeTexture(THREE);
        const side = new THREE.MeshStandardMaterial({ color: 0x242421, roughness: 0.56, metalness: 0.22 });
        const face = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.46, metalness: 0.25 });
        const back = new THREE.MeshStandardMaterial({ color: 0x171715, roughness: 0.6, metalness: 0.16 });
        const plate = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.065, 48), [side, face, back]);
        const vinyl = new THREE.Group();
        vinyl.add(plate);
        const spindle = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.032, 0.09, 12),
          new THREE.MeshStandardMaterial({ color: 0xecebe6, roughness: 0.52, metalness: 0.12 })
        );
        vinyl.add(spindle);
        vinyl.rotation.z = -0.04;
        scene.add(vinyl);

        scene.add(new THREE.HemisphereLight(0xf4f3ef, 0x111111, 1.25));
        const key = new THREE.DirectionalLight(0xf4f3ef, 2.5);
        key.position.set(2.3, 3.4, 2.2);
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xff5125, 0.8);
        rim.position.set(-2.4, 0.8, -1.8);
        scene.add(rim);

        state.renderer = renderer;
        state.scene = scene;
        state.camera = camera;
        state.vinyl = vinyl;
        state.texture = texture;
        state.ready = true;
        dock.classList.add("is-three-ready");
        dock.dataset.state = "success";
        renderMode.textContent = "3D / 30 fps max";
        status.textContent = isPlaying ? "Playing" : "Sound off";
        render();
        wake();
        setTimeout(() => {
          if (dock.dataset.state === "success") dock.dataset.state = "default";
        }, 600);
      } catch (_) {
        dock.dataset.state = "error";
        renderMode.textContent = "CSS fallback";
        status.textContent = isPlaying ? "Playing / CSS" : "Sound off / CSS";
      }
    };

    const setTilt = (x, y) => {
      if (reducedQuery.matches || !finePointerQuery.matches) return;
      const tiltX = Math.max(-4, Math.min(4, -y * 4));
      const tiltY = Math.max(-4, Math.min(4, x * 4));
      recordViewport.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
      render();
    };

    const resetTilt = () => {
      recordViewport.style.transform = "rotateX(0deg) rotateY(0deg)";
      render();
    };

    const dispose = () => {
      sleep();
      state.texture?.dispose();
      state.renderer?.dispose();
    };

    return {
      init,
      wake,
      sleep,
      render,
      setTilt,
      resetTilt,
      dispose,
      setPlaying: (playing) => (playing ? wake() : sleep())
    };
  })();

  handle.addEventListener("click", () => setOpen(!isOpen));
  playButtons.forEach((button) => button.addEventListener("click", togglePlay));
  dock.querySelector('[data-action="prev"]').addEventListener("click", () => selectTrack(currentTrack - 1));
  dock.querySelector('[data-action="next"]').addEventListener("click", () => selectTrack(currentTrack + 1));
  listButton.addEventListener("click", () => setListOpen(!dock.classList.contains("is-list-open")));
  dock.querySelector(".playlist-close").addEventListener("click", () => setListOpen(false));
  playlistList.addEventListener("click", (event) => {
    const row = event.target.closest("[data-track]");
    if (!row) return;
    selectTrack(Number(row.dataset.track));
    setListOpen(false);
  });

  progressInput.addEventListener("input", () => {
    const duration = getTrackDuration();
    const target = (duration * Number(progressInput.value)) / 100;
    if (usingFallback) elapsed = target;
    else if (Number.isFinite(audio.duration)) audio.currentTime = target;
    paintProgress(target, duration);
    startedAt = performance.now();
  });
  volumeInput.addEventListener("input", () => {
    volumeOutput.value = volumeInput.value;
    writeStore({ volume: Number(volumeInput.value) });
    audio.volume = getOutputGain();
    if (master) master.gain.setTargetAtTime(getOutputGain(), audioContext.currentTime, 0.03);
  });

  recordWrap.addEventListener("pointermove", (event) => {
    const rect = recordWrap.getBoundingClientRect();
    vinylController.setTilt(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1
    );
  });
  recordWrap.addEventListener("pointerleave", vinylController.resetTilt);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (dock.classList.contains("is-list-open")) setListOpen(false);
      else if (isOpen) setOpen(false);
      return;
    }
    if (event.target && /INPUT|TEXTAREA|SELECT/.test(event.target.tagName)) return;
    if ((event.key === "s" || event.key === "S") && (event.altKey || event.metaKey)) {
      event.preventDefault();
      setOpen(!isOpen);
    }
  });

  document.addEventListener("visibilitychange", async () => {
    if (document.hidden) {
      vinylController.sleep();
      if (progressFrame) {
        cancelAnimationFrame(progressFrame);
        progressFrame = 0;
      }
      if (isPlaying) {
        if (usingFallback) {
          try { await audioContext?.suspend(); } catch (_) {}
        } else {
          audio.pause();
        }
      }
    } else if (isPlaying) {
      try {
        if (usingFallback) {
          await ensureAudio();
          startedAt = performance.now();
          if (!progressFrame) progressFrame = requestAnimationFrame(tickProgress);
        } else {
          await audio.play();
        }
        vinylController.wake();
      } catch (_) {
        isPlaying = false;
        audio.pause();
        stopTone();
        dock.dataset.state = "error";
        updatePlayUi();
        status.textContent = "Tap play to resume";
        announce("音频恢复失败，请再次点击播放");
      }
    }
  });
  reducedQuery.addEventListener?.("change", (event) => (event.matches ? vinylController.sleep() : vinylController.wake()));
  window.addEventListener("pagehide", vinylController.dispose, { once: true });

  // Surface: dark hero vs paper case pages / paper sections
  const applySurface = (surface) => {
    dock.dataset.surface = surface === "paper" || surface === "light" ? "paper" : "dark";
  };
  applySurface(defaultSurface);

  if ("IntersectionObserver" in window) {
    const surfaceObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const theme = entry.target.getAttribute("data-nav-theme")
          || entry.target.getAttribute("data-player-surface")
          || defaultSurface;
        applySurface(theme);
      });
    }, { rootMargin: "-18% 0px -62%", threshold: 0 });
    document.querySelectorAll("[data-nav-theme], [data-player-surface]").forEach((node) => surfaceObserver.observe(node));
  }

  // Case pages are paper by default when body background is light
  const bodyBg = getComputedStyle(document.body).backgroundColor;
  if (/f3f1eb|ecebe6|243,\s*241,\s*235|236,\s*235,\s*230/i.test(bodyBg) || document.body.classList.contains("case-page")) {
    applySurface("paper");
  }

  audio.volume = getOutputGain();
  renderPlaylist();
  renderTrack();
  updatePlayUi();
})();
