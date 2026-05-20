const DEFAULT_PAD_COUNT = 12;
const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DB_NAME = "soundboard-live";
const STORE = "sounds";
const PRESS_MS = 180;
const PAD_NAME_REPAIR = "pad-title-repair-v1";
const BOARDS_STORAGE = "soundboard-live-boards";
const CURRENT_BOARD_STORAGE = "soundboard-live-current-board";
const DEFAULT_BOARD_ID = "default";

const state = {
  audioContext: null,
  masterGain: null,
  boards: [],
  currentBoardId: DEFAULT_BOARD_ID,
  pads: [],
  db: null,
  timerFrame: null,
  heldKeys: new Set(),
  recorder: null,
  recordingPad: null,
  recordingChunks: [],
  recordingStream: null,
};

const els = {
  pads: document.querySelector("#pads"),
  template: document.querySelector("#padTemplate"),
  status: document.querySelector("#audioStatus"),
  masterVolume: document.querySelector("#masterVolume"),
  fadeSeconds: document.querySelector("#fadeSeconds"),
  stopAll: document.querySelector("#stopAll"),
  helpButton: document.querySelector("#helpButton"),
  helpDialog: document.querySelector("#helpDialog"),
  closeHelp: document.querySelector("#closeHelp"),
  boardSelect: document.querySelector("#boardSelect"),
  boardName: document.querySelector("#boardName"),
  editBoard: document.querySelector("#editBoard"),
  addBoard: document.querySelector("#addBoard"),
  addPad: document.querySelector("#addPad"),
  exportBoard: document.querySelector("#exportBoard"),
  importBoard: document.querySelector("#importBoard"),
  importBoardFile: document.querySelector("#importBoardFile"),
};

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbGet(key) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbSet(key, value) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readwrite");
    const request = tx.objectStore(STORE).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function cleanName(name) {
  return name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim() || "Son";
}

function keyForIndex(index) {
  return KEYS[index] || String(index + 1);
}

function createId() {
  return crypto?.randomUUID?.() || `board-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function padAudioKey(pad) {
  if (state.currentBoardId === DEFAULT_BOARD_ID) return `pad-${pad.index}`;
  return `board-${state.currentBoardId}-pad-${pad.index}`;
}

function padMetaKey(pad) {
  if (state.currentBoardId === DEFAULT_BOARD_ID) return `pad-meta-${pad.index}`;
  return `board-${state.currentBoardId}-pad-meta-${pad.index}`;
}

function setPadTitle(pad, title) {
  pad.title = title.trim() || `Pad ${pad.index + 1}`;
  pad.titleEl.textContent = pad.title;
  pad.nameEl.value = pad.title;
}

function setPadEditing(pad, editing) {
  pad.node.classList.toggle("is-editing", editing);
  pad.editButton.classList.toggle("is-active", editing);
  if (editing) {
    pad.nameEl.focus();
    pad.nameEl.select();
  }
}

function setPadDuration(pad, seconds) {
  pad.duration = Number.isFinite(seconds) ? seconds : 0;
  pad.timeEl.textContent = pad.duration ? formatTime(pad.duration) : "--:--";
}

function bestRecordingType() {
  if (!window.MediaRecorder) return "";
  const types = [
    "audio/mp4",
    "audio/webm;codecs=opus",
    "audio/webm",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function prepareAudio() {
  if (!state.audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = Number(els.masterVolume.value);
    state.masterGain.connect(state.audioContext.destination);
  }
}

async function ensureAudio() {
  prepareAudio();
  if (state.audioContext.state !== "running") {
    await state.audioContext.resume();
  }
}

function makePad(index) {
  const node = els.template.content.firstElementChild.cloneNode(true);
  const pad = {
    index,
    node,
    key: keyForIndex(index),
    title: `Pad ${index + 1}`,
    buffer: null,
    source: null,
    gain: null,
    pan: null,
    startedAt: 0,
    stopAt: 0,
    duration: 0,
    playMode: "oneshot",
    resumeOffset: 0,
    holdPointerId: null,
    volume: 0.85,
    panValue: 0,
    loop: false,
  };

  pad.titleEl = node.querySelector("[data-title]");
  pad.nameEl = node.querySelector("[data-name]");
  pad.timeEl = node.querySelector("[data-time]");
  pad.fileInput = node.querySelector("[data-file]");
  pad.editButton = node.querySelector('[data-action="edit"]');
  pad.recordButton = node.querySelector('[data-action="record"]');
  pad.modeButtons = [...node.querySelectorAll("[data-mode]")];
  pad.volumeEl = node.querySelector("[data-volume]");
  pad.panEl = node.querySelector("[data-pan]");
  pad.loopEl = node.querySelector('[data-action="loop"]');

  setPadTitle(pad, pad.title);
  setPadMode(pad, pad.playMode);
  setPadLoop(pad, pad.loop);
  pad.volumeEl.value = pad.volume;
  pad.panEl.value = pad.panValue;
  node.classList.add("is-empty");

  node.querySelector('[data-action="load"]').addEventListener("click", () => {
    setStatus("Choisir Fichiers pour importer un audio");
    pad.fileInput.click();
  });
  pad.editButton.addEventListener("click", () => setPadEditing(pad, !pad.node.classList.contains("is-editing")));
  pad.recordButton.addEventListener("click", () => toggleRecording(pad));
  pad.fileInput.addEventListener("change", () => {
    const file = pad.fileInput.files?.[0];
    if (file) loadFileIntoPad(pad, file);
  });

  const trigger = node.querySelector('[data-action="play"]');
  trigger.addEventListener("click", (event) => {
    if (pad.playMode === "hold") return;
    event.preventDefault();
    togglePad(pad);
  });
  trigger.addEventListener("pointerdown", (event) => {
    if (pad.playMode !== "hold") return;
    event.preventDefault();
    pad.holdPointerId = event.pointerId;
    trigger.setPointerCapture?.(event.pointerId);
    playPad(pad, false, 0);
  });
  trigger.addEventListener("pointerup", (event) => {
    if (pad.playMode !== "hold" || pad.holdPointerId !== event.pointerId) return;
    event.preventDefault();
    pad.holdPointerId = null;
    stopPad(pad, false);
  });
  trigger.addEventListener("pointercancel", () => {
    if (pad.playMode === "hold") {
      pad.holdPointerId = null;
      stopPad(pad, false);
    }
  });
  node.querySelector('[data-action="fadeIn"]').addEventListener("click", () => playPad(pad, true));
  node.querySelector('[data-action="fadeOut"]').addEventListener("click", () => stopPad(pad, true));
  node.querySelector('[data-action="stop"]').addEventListener("click", () => stopPad(pad, false));

  pad.nameEl.addEventListener("input", () => {
    setPadTitle(pad, pad.nameEl.value);
    savePadMeta(pad);
  });
  pad.nameEl.addEventListener("blur", () => setPadEditing(pad, false));
  pad.nameEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      pad.nameEl.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setPadTitle(pad, pad.title);
      pad.nameEl.blur();
    }
  });

  pad.volumeEl.addEventListener("input", () => {
    pad.volume = Number(pad.volumeEl.value);
    if (pad.gain) pad.gain.gain.setTargetAtTime(pad.volume, state.audioContext.currentTime, 0.015);
    savePadMeta(pad);
  });

  pad.panEl.addEventListener("input", () => {
    pad.panValue = Number(pad.panEl.value);
    if (pad.pan) pad.pan.pan.setTargetAtTime(pad.panValue, state.audioContext.currentTime, 0.015);
    savePadMeta(pad);
  });

  pad.loopEl.addEventListener("click", () => {
    setPadLoop(pad, !pad.loop);
    if (pad.source) pad.source.loop = pad.loop;
    savePadMeta(pad);
  });

  pad.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPadMode(pad, button.dataset.mode);
      savePadMeta(pad);
    });
  });

  return pad;
}

function loadBoards() {
  const fallback = [{ id: DEFAULT_BOARD_ID, name: "Projet 1", padCount: DEFAULT_PAD_COUNT }];
  try {
    const boards = JSON.parse(localStorage.getItem(BOARDS_STORAGE));
    if (Array.isArray(boards) && boards.length) {
      return boards.map((board) => ({
        id: board.id || createId(),
        name: board.name || "Projet",
        padCount: Math.max(DEFAULT_PAD_COUNT, Number(board.padCount) || DEFAULT_PAD_COUNT),
      }));
    }
  } catch {
    return fallback;
  }
  return fallback;
}

function saveBoards() {
  localStorage.setItem(BOARDS_STORAGE, JSON.stringify(state.boards));
  localStorage.setItem(CURRENT_BOARD_STORAGE, state.currentBoardId);
}

function currentBoard() {
  return state.boards.find((board) => board.id === state.currentBoardId) || state.boards[0];
}

function renderBoardOptions() {
  if (!els.boardSelect) return;
  els.boardSelect.innerHTML = "";
  state.boards.forEach((board) => {
    const option = document.createElement("option");
    option.value = board.id;
    option.textContent = board.name;
    els.boardSelect.append(option);
  });
  els.boardSelect.value = state.currentBoardId;
  if (els.boardName) els.boardName.value = currentBoard().name;
}

function setBoardEditing(editing) {
  const strip = document.querySelector(".board-strip");
  strip?.classList.toggle("is-editing", editing);
  els.editBoard?.classList.toggle("is-active", editing);
  if (editing) {
    els.boardName?.focus();
    els.boardName?.select();
  }
}

async function renderPads() {
  stopAll();
  resetRecordingState();
  state.pads = [];
  els.pads.innerHTML = "";
  const board = currentBoard();
  for (let index = 0; index < board.padCount; index += 1) {
    const pad = makePad(index);
    state.pads.push(pad);
    els.pads.append(pad.node);
    bindButtonFeedback(pad.node);
    restorePad(pad).catch(() => {
      pad.node.classList.add("is-empty");
    });
  }
  setStatus(`${board.name} charge`);
}

async function switchBoard(boardId) {
  state.currentBoardId = boardId;
  saveBoards();
  renderBoardOptions();
  await renderPads();
}

async function addBoard() {
  const name = nextBoardName();
  const board = {
    id: createId(),
    name,
    padCount: DEFAULT_PAD_COUNT,
  };
  state.boards.push(board);
  state.currentBoardId = board.id;
  saveBoards();
  renderBoardOptions();
  await renderPads();
  setBoardEditing(true);
}

function nextBoardName() {
  let index = state.boards.length + 1;
  const names = new Set(state.boards.map((board) => board.name));
  while (names.has(`Projet ${index}`)) index += 1;
  return `Projet ${index}`;
}

function renameCurrentBoard(name) {
  const board = currentBoard();
  board.name = name || "Projet";
  saveBoards();
  const option = els.boardSelect ? [...els.boardSelect.options].find((item) => item.value === board.id) : null;
  if (option) option.textContent = board.name;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function safeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "soundboard";
}

async function exportCurrentBoard() {
  const board = currentBoard();
  const pads = [];

  for (let index = 0; index < board.padCount; index += 1) {
    const pad = state.pads[index] || makePad(index);
    const meta = await dbGet(padMetaKey(pad));
    const saved = await dbGet(padAudioKey(pad));
    pads.push({
      index,
      title: meta?.title || saved?.title || `Pad ${index + 1}`,
      volume: meta?.volume ?? saved?.volume ?? 0.85,
      panValue: meta?.panValue ?? saved?.panValue ?? 0,
      loop: Boolean(meta?.loop ?? saved?.loop),
      playMode: meta?.playMode || saved?.playMode || "oneshot",
      audio: saved?.audio ? {
        name: saved.name || `Pad ${index + 1}`,
        type: saved.type || "audio/mpeg",
        data: arrayBufferToBase64(saved.audio),
      } : null,
    });
  }

  const payload = {
    format: "soundboard-live-board",
    version: 1,
    exportedAt: new Date().toISOString(),
    board: {
      name: board.name,
      padCount: board.padCount,
      pads,
    },
  };

  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFileName(board.name)}.soundboard`;
  link.click();
  URL.revokeObjectURL(url);
  setStatus(`${board.name} exporte`);
}

async function importBoardFile(file) {
  const payload = JSON.parse(await file.text());
  if (payload?.format !== "soundboard-live-board" || !payload.board) {
    setStatus("Fichier board invalide");
    return;
  }

  const importedBoard = {
    id: createId(),
    name: payload.board.name || cleanName(file.name),
    padCount: Math.max(DEFAULT_PAD_COUNT, Number(payload.board.padCount) || DEFAULT_PAD_COUNT),
  };
  state.boards.push(importedBoard);
  state.currentBoardId = importedBoard.id;
  saveBoards();
  renderBoardOptions();

  const pads = Array.isArray(payload.board.pads) ? payload.board.pads : [];
  for (const item of pads) {
    const index = Number(item.index);
    if (!Number.isInteger(index) || index < 0) continue;
    const transientPad = { index };
    const meta = {
      title: item.title || `Pad ${index + 1}`,
      volume: item.volume ?? 0.85,
      panValue: item.panValue ?? 0,
      loop: Boolean(item.loop),
      playMode: item.playMode || "oneshot",
    };
    await dbSet(padMetaKey(transientPad), meta);
    if (item.audio?.data) {
      await dbSet(padAudioKey(transientPad), {
        name: item.audio.name || meta.title,
        title: meta.title,
        type: item.audio.type || "audio/mpeg",
        audio: base64ToArrayBuffer(item.audio.data),
        ...meta,
      });
    }
  }

  await renderPads();
  setStatus(`${importedBoard.name} importe`);
}

async function addPad() {
  const board = currentBoard();
  board.padCount += 1;
  saveBoards();
  const pad = makePad(board.padCount - 1);
  state.pads.push(pad);
  els.pads.append(pad.node);
  bindButtonFeedback(pad.node);
  setStatus(`Pad ${board.padCount} ajoute`);
}

async function repairAccidentalPadTitles() {
  if (state.currentBoardId !== DEFAULT_BOARD_ID) return;
  if (localStorage.getItem(PAD_NAME_REPAIR) === "done") return;

  for (const pad of state.pads) {
    const accidentalTitle = KEYS[pad.index];
    const title = `Pad ${pad.index + 1}`;
    const meta = await dbGet(padMetaKey(pad));
    const saved = await dbGet(padAudioKey(pad));
    const currentTitle = meta?.title || saved?.title;

    if (currentTitle && currentTitle !== accidentalTitle) continue;

    setPadTitle(pad, title);
    await dbSet(padMetaKey(pad), {
      ...(meta || {}),
      title,
    });
    if (saved) {
      await dbSet(padAudioKey(pad), {
        ...saved,
        title,
      });
    }
  }

  localStorage.setItem(PAD_NAME_REPAIR, "done");
}

async function loadFileIntoPad(pad, file) {
  await ensureAudio();
  const arrayBuffer = await file.arrayBuffer();
  await loadAudioIntoPad(pad, arrayBuffer, file.name, file.type);
}

async function loadAudioIntoPad(pad, arrayBuffer, name, type) {
  await ensureAudio();
  const buffer = await state.audioContext.decodeAudioData(arrayBuffer.slice(0));
  pad.buffer = buffer;
  setPadTitle(pad, cleanName(name));
  setPadDuration(pad, buffer.duration);
  pad.node.classList.remove("is-empty");
  await dbSet(padAudioKey(pad), {
    name,
    title: pad.title,
    type,
    audio: arrayBuffer,
    volume: pad.volume,
    panValue: pad.panValue,
    loop: pad.loop,
    playMode: pad.playMode,
  });
  await savePadMeta(pad);
  setStatus(`${pad.title} charge`);
}

async function toggleRecording(pad) {
  if (state.recordingPad === pad) {
    stopRecording();
    return;
  }

  if (state.recordingPad) {
    stopRecording();
  }

  if (!window.isSecureContext) {
    setStatus("Micro: HTTPS requis sur iPhone");
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Micro indisponible dans ce navigateur");
    return;
  }

  if (!window.MediaRecorder) {
    setStatus("Enregistrement non supporte ici");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = bestRecordingType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    state.recordingPad = pad;
    state.recordingChunks = [];
    state.recordingStream = stream;
    state.recorder = recorder;
    pad.recordButton.classList.add("is-recording");
    setStatus(`Enregistrement ${pad.title}`);

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) state.recordingChunks.push(event.data);
    });

    recorder.addEventListener("stop", async () => {
      const recordedPad = state.recordingPad;
      const chunks = state.recordingChunks;
      const type = recorder.mimeType || "audio/mp4";
      const extension = type.includes("webm") ? "webm" : "m4a";

      resetRecordingState();

      if (!recordedPad || !chunks.length) return;

      const blob = new Blob(chunks, { type });
      const buffer = await blob.arrayBuffer();
      await loadAudioIntoPad(recordedPad, buffer, `Enregistrement ${recordedPad.index + 1}.${extension}`, type);
      setStatus(`${recordedPad.title} enregistre`);
    });

    recorder.start();
  } catch (error) {
    resetRecordingState();
    if (error?.name === "NotAllowedError") {
      setStatus("Micro refuse: autorisez Safari");
    } else if (error?.name === "NotFoundError") {
      setStatus("Aucun micro detecte");
    } else {
      setStatus("Erreur micro");
    }
  }
}

function stopRecording() {
  if (state.recorder && state.recorder.state !== "inactive") {
    state.recorder.stop();
  }
}

function resetRecordingState() {
  state.recordingStream?.getTracks().forEach((track) => track.stop());
  state.recordingPad?.recordButton.classList.remove("is-recording");
  state.recorder = null;
  state.recordingPad = null;
  state.recordingChunks = [];
  state.recordingStream = null;
}

async function restorePad(pad) {
  const meta = await dbGet(padMetaKey(pad));
  if (meta) {
    setPadTitle(pad, meta.title || pad.title);
    pad.volume = meta.volume ?? pad.volume;
    pad.panValue = meta.panValue ?? pad.panValue;
    setPadLoop(pad, Boolean(meta.loop));
    setPadMode(pad, meta.playMode || pad.playMode);
    pad.volumeEl.value = pad.volume;
    pad.panEl.value = pad.panValue;
  }

  const saved = await dbGet(padAudioKey(pad));
  if (!saved) return;

  prepareAudio();
  pad.buffer = await state.audioContext.decodeAudioData(saved.audio.slice(0));
  setPadTitle(pad, meta?.title || saved.title || cleanName(saved.name || `Pad ${pad.index + 1}`));
  pad.volume = saved.volume ?? pad.volume;
  pad.panValue = saved.panValue ?? pad.panValue;
  setPadLoop(pad, Boolean(saved.loop));
  setPadMode(pad, saved.playMode || pad.playMode);
  setPadDuration(pad, pad.buffer.duration);
  pad.volumeEl.value = pad.volume;
  pad.panEl.value = pad.panValue;
  pad.node.classList.remove("is-empty");
}

async function savePadMeta(pad) {
  const meta = {
    title: pad.title,
    volume: pad.volume,
    panValue: pad.panValue,
    loop: pad.loop,
    playMode: pad.playMode,
  };
  await dbSet(padMetaKey(pad), meta);
  const saved = await dbGet(padAudioKey(pad));
  if (saved) {
    await dbSet(padAudioKey(pad), {
      ...saved,
      ...meta,
    });
  }
}

function setStatus(text) {
  els.status.textContent = text;
}

function setPadMode(pad, mode) {
  pad.playMode = ["oneshot", "hold", "toggle"].includes(mode) ? mode : "oneshot";
  pad.modeButtons?.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mode === pad.playMode);
  });
  if (pad.playMode !== "toggle") {
    pad.resumeOffset = 0;
  }
}

function setPadLoop(pad, loop) {
  pad.loop = Boolean(loop);
  pad.loopEl?.classList.toggle("is-active", pad.loop);
  pad.loopEl?.setAttribute("aria-pressed", String(pad.loop));
}

async function playPad(pad, fade = false, offset = 0) {
  if (!pad.buffer) {
    pad.fileInput.click();
    return;
  }

  await ensureAudio();
  stopPad(pad, false);
  const startOffset = pad.duration ? Math.min(Math.max(0, offset), Math.max(0, pad.duration - 0.01)) : 0;

  const ctx = state.audioContext;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();
  const now = ctx.currentTime;
  const fadeTime = Math.max(0, Number(els.fadeSeconds.value) || 0);

  source.buffer = pad.buffer;
  source.loop = pad.loop;
  gain.gain.setValueAtTime(fade ? 0 : pad.volume, now);
  pan.pan.setValueAtTime(pad.panValue, now);
  source.connect(gain).connect(pan).connect(state.masterGain);

  if (fade && fadeTime > 0) {
    gain.gain.linearRampToValueAtTime(pad.volume, now + fadeTime);
  }

  pad.source = source;
  pad.gain = gain;
  pad.pan = pan;
  pad.startedAt = now - startOffset;
  pad.stopAt = 0;
  pad.node.classList.add("is-playing");
  updatePadTime(pad);
  startTimer();
  setStatus(`${pad.title} joue`);

  source.onended = () => {
    if (pad.source === source) {
      pad.source = null;
      pad.gain = null;
      pad.pan = null;
      pad.stopAt = 0;
      pad.resumeOffset = 0;
      pad.node.classList.remove("is-playing");
      updatePadTime(pad);
    }
  };

  source.start(now, startOffset);
}

function stopPad(pad, fade = false, preservePosition = false) {
  if (!pad.source || !state.audioContext) return;

  const source = pad.source;
  const gain = pad.gain;
  const now = state.audioContext.currentTime;
  const fadeTime = Math.max(0, Number(els.fadeSeconds.value) || 0);
  if (preservePosition && pad.duration) {
    const elapsed = Math.max(0, now - pad.startedAt);
    pad.resumeOffset = pad.loop ? elapsed % pad.duration : Math.min(elapsed, pad.duration);
  } else {
    pad.resumeOffset = 0;
  }

  if (fade && fadeTime > 0 && gain) {
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0.0001, now + fadeTime);
    source.stop(now + fadeTime + 0.02);
    pad.stopAt = now + fadeTime + 0.02;
  } else {
    source.stop(now);
    pad.stopAt = now;
  }

  pad.source = null;
  pad.gain = null;
  pad.pan = null;
  pad.node.classList.remove("is-playing");
  updatePadTime(pad);
  setStatus(`${pad.title} stop`);
}

function remainingSeconds(pad) {
  if (!pad.source || !state.audioContext || !pad.duration) return pad.duration;
  const elapsed = Math.max(0, state.audioContext.currentTime - pad.startedAt);
  if (pad.loop) {
    const loopElapsed = elapsed % pad.duration;
    return Math.max(0, pad.duration - loopElapsed);
  }
  return Math.max(0, pad.duration - elapsed);
}

function updatePadTime(pad) {
  if (!pad.duration) {
    pad.timeEl.textContent = "--:--";
    return;
  }
  const seconds = remainingSeconds(pad);
  pad.timeEl.textContent = pad.source ? `-${formatTime(seconds)}` : formatTime(pad.duration);
}

function startTimer() {
  if (state.timerFrame) return;
  const tick = () => {
    state.pads.forEach(updatePadTime);
    state.timerFrame = state.pads.some((pad) => pad.source)
      ? requestAnimationFrame(tick)
      : null;
  };
  state.timerFrame = requestAnimationFrame(tick);
}

function flashButton(button) {
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), PRESS_MS);
}

function bindButtonFeedback(root = document) {
  root.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => flashButton(button));
  });
}

function bindPerformanceTouchGuards() {
  const isEditableTarget = (target) => Boolean(target.closest("input, select, textarea, dialog"));
  const isPerformanceTarget = (target) => Boolean(target.closest(".pad, .topbar"));

  document.addEventListener("contextmenu", (event) => {
    if (isEditableTarget(event.target)) return;
    if (isPerformanceTarget(event.target)) event.preventDefault();
  });

  document.addEventListener("selectstart", (event) => {
    if (isEditableTarget(event.target)) return;
    if (isPerformanceTarget(event.target)) event.preventDefault();
  });

  document.addEventListener("dragstart", (event) => {
    if (isEditableTarget(event.target)) return;
    if (isPerformanceTarget(event.target)) event.preventDefault();
  });
}

function togglePad(pad) {
  if (pad.source) {
    stopPad(pad, true, pad.playMode === "toggle");
  } else {
    const offset = pad.playMode === "toggle" ? pad.resumeOffset : 0;
    playPad(pad, false, offset);
  }
}

function stopAll() {
  state.pads.forEach((pad) => stopPad(pad, false));
  setStatus("Tout est stoppe");
}

function bindKeyboard() {
  window.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    const target = event.target;
    if (target instanceof HTMLInputElement) return;

    const key = event.key.toUpperCase();
    const index = KEYS.indexOf(key);
    if (index >= 0 && state.pads[index]) {
      event.preventDefault();
      flashButton(state.pads[index].node.querySelector('[data-action="play"]'));
      if (state.pads[index].playMode === "hold") {
        state.heldKeys.add(key);
        playPad(state.pads[index], false, 0);
        return;
      }
      togglePad(state.pads[index]);
    }

    if (key === "ESCAPE") {
      event.preventDefault();
      stopAll();
    }
  });

  window.addEventListener("keyup", (event) => {
    const key = event.key.toUpperCase();
    const index = KEYS.indexOf(key);
    if (index >= 0 && state.pads[index] && state.heldKeys.has(key)) {
      event.preventDefault();
      state.heldKeys.delete(key);
      stopPad(state.pads[index], false);
    }
  });
}

async function init() {
  state.db = await openDb();
  state.boards = loadBoards();
  state.currentBoardId = localStorage.getItem(CURRENT_BOARD_STORAGE) || DEFAULT_BOARD_ID;
  if (!state.boards.some((board) => board.id === state.currentBoardId)) {
    state.currentBoardId = state.boards[0].id;
  }
  renderBoardOptions();
  await renderPads();
  await repairAccidentalPadTitles();

  els.masterVolume.addEventListener("input", async () => {
    await ensureAudio();
    state.masterGain.gain.setTargetAtTime(Number(els.masterVolume.value), state.audioContext.currentTime, 0.02);
  });
  els.stopAll.addEventListener("click", stopAll);
  els.boardSelect?.addEventListener("change", () => switchBoard(els.boardSelect.value));
  els.boardName?.addEventListener("input", () => renameCurrentBoard(els.boardName.value));
  els.boardName?.addEventListener("blur", () => setBoardEditing(false));
  els.boardName?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      els.boardName.blur();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      els.boardName.value = currentBoard().name;
      els.boardName.blur();
    }
  });
  els.editBoard?.addEventListener("click", () => {
    const strip = document.querySelector(".board-strip");
    setBoardEditing(!strip?.classList.contains("is-editing"));
  });
  els.addBoard?.addEventListener("click", addBoard);
  els.addPad?.addEventListener("click", addPad);
  els.exportBoard?.addEventListener("click", () => {
    exportCurrentBoard().catch(() => setStatus("Export impossible"));
  });
  els.importBoard?.addEventListener("click", () => els.importBoardFile?.click());
  els.importBoardFile?.addEventListener("change", () => {
    const file = els.importBoardFile.files?.[0];
    if (file) {
      importBoardFile(file).catch(() => setStatus("Import impossible"));
      els.importBoardFile.value = "";
    }
  });
  els.helpButton?.addEventListener("click", () => {
    if (els.helpDialog?.showModal) {
      els.helpDialog.showModal();
    }
  });
  els.closeHelp?.addEventListener("click", () => els.helpDialog?.close());
  els.helpDialog?.addEventListener("click", (event) => {
    if (event.target === els.helpDialog) els.helpDialog.close();
  });
  bindButtonFeedback(document.querySelector(".topbar"));
  bindKeyboard();
  bindPerformanceTouchGuards();

  setStatus("Touchez un pad ou chargez vos sons");
}

init();

if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
