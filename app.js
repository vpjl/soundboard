const DEFAULT_PAD_COUNT = 12;
const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DB_NAME = "soundboard-live";
const STORE = "sounds";
const PRESS_MS = 180;
const PAD_NAME_REPAIR = "pad-title-repair-v1";
const BOARDS_STORAGE = "soundboard-live-boards";
const CURRENT_BOARD_STORAGE = "soundboard-live-current-board";
const DUCKING_STORAGE = "soundboard-live-ducking-percent";
const SKIN_STORAGE = "soundboard-live-skin";
const STAGE_MODE_STORAGE = "soundboard-live-stage-mode";
const SHORTCUTS_STORAGE_PREFIX = "soundboard-live-shortcuts";
const SHORTCUTS_ENABLED_STORAGE_PREFIX = "soundboard-live-shortcuts-enabled";
const DEFAULT_BOARD_ID = "default";
const DEFAULT_MASTER_VOLUME = 0.9;
const ENDING_ALERT_SECONDS = 5;
const HISTORY_LIMIT = 4;
const PAD_COLORS = {
  green: "#49d3a0",
  yellow: "#ffce5c",
  red: "#ff5f56",
  blue: "#61a8ff",
  pink: "#ff6bd6",
  purple: "#a875ff",
};
const PAD_LAYOUTS = {
  auto: { columns: 0, rows: 0 },
  "2x3": { columns: 3, rows: 2 },
  "3x4": { columns: 4, rows: 3 },
  "4x4": { columns: 4, rows: 4 },
  custom: { columns: 0, rows: 0 },
};
const NORMALIZE_TARGET_RMS = 0.16;
const NORMALIZE_PEAK_LIMIT = 0.95;
const NORMALIZE_MIN_GAIN = 0.25;
const NORMALIZE_MAX_GAIN = 3.5;
const REVERB_PRESETS = {
  none: { duration: 0, decay: 0 },
  room: { duration: 0.7, decay: 1.7 },
  hall: { duration: 1.8, decay: 2.4 },
  plate: { duration: 1.2, decay: 1.1 },
  cathedral: { duration: 3.6, decay: 3.2 },
};

const state = {
  audioContext: null,
  masterGain: null,
  masterAnalyser: null,
  masterMeterData: null,
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
  drag: null,
  trimDrag: null,
  progressDrag: null,
  shortcuts: [],
  shortcutsEnabled: true,
  audioPad: null,
  audioTrimDrag: null,
  reverbBuffers: {},
  stageMode: false,
  boardEditMode: false,
};

const els = {
  pads: document.querySelector("#pads"),
  template: document.querySelector("#padTemplate"),
  status: document.querySelector("#audioStatus"),
  skinSelect: document.querySelector("#skinSelect"),
  masterVolume: document.querySelector("#masterVolume"),
  masterVolumeValue: document.querySelector("#masterVolumeValue"),
  masterVu: document.querySelector("#masterVu"),
  fadeSeconds: document.querySelector("#fadeSeconds"),
  stopAll: document.querySelector("#stopAll"),
  stopGroup: document.querySelector("#stopGroup"),
  stopGroupSelect: document.querySelector("#stopGroupSelect"),
  stageMode: document.querySelector("#stageMode"),
  boardTagFilter: document.querySelector("#boardTagFilter"),
  keyboardShortcuts: document.querySelector("#keyboardShortcuts"),
  shortcutDialog: document.querySelector("#shortcutDialog"),
  closeShortcuts: document.querySelector("#closeShortcuts"),
  shortcutEnabled: document.querySelector("#shortcutEnabled"),
  shortcutRows: document.querySelector("#shortcutRows"),
  audioDialog: document.querySelector("#audioDialog"),
  closeAudio: document.querySelector("#closeAudio"),
  audioWaveform: document.querySelector("#audioWaveform"),
  audioWaveformCanvas: document.querySelector("#audioWaveformCanvas"),
  audioTrimSelection: document.querySelector("#audioTrimSelection"),
  audioTrimStartHandle: document.querySelector("#audioTrimStartHandle"),
  audioTrimEndHandle: document.querySelector("#audioTrimEndHandle"),
  audioTrimStartValue: document.querySelector("#audioTrimStartValue"),
  audioTrimEndValue: document.querySelector("#audioTrimEndValue"),
  audioNormalize: document.querySelector("#audioNormalize"),
  audioNormalizeValue: document.querySelector("#audioNormalizeValue"),
  audioFadeIn: document.querySelector("#audioFadeIn"),
  audioFadeOut: document.querySelector("#audioFadeOut"),
  audioPitchSemitones: document.querySelector("#audioPitchSemitones"),
  audioPitchFine: document.querySelector("#audioPitchFine"),
  audioPitchTotal: document.querySelector("#audioPitchTotal"),
  audioSpeed: document.querySelector("#audioSpeed"),
  audioSpeedValue: document.querySelector("#audioSpeedValue"),
  audioReverbPreset: document.querySelector("#audioReverbPreset"),
  audioReverbWet: document.querySelector("#audioReverbWet"),
  audioReverbValue: document.querySelector("#audioReverbValue"),
  duckPercent: document.querySelector("#duckPercent"),
  helpButton: document.querySelector("#helpButton"),
  helpDialog: document.querySelector("#helpDialog"),
  closeHelp: document.querySelector("#closeHelp"),
  boardSelect: document.querySelector("#boardSelect"),
  boardName: document.querySelector("#boardName"),
  editPads: document.querySelector("#editPads"),
  saveVersion: document.querySelector("#saveVersion"),
  restoreVersion: document.querySelector("#restoreVersion"),
  versionSelect: document.querySelector("#versionSelect"),
  deleteBoard: document.querySelector("#deleteBoard"),
  addBoard: document.querySelector("#addBoard"),
  addPad: document.querySelector("#addPad"),
  exportBoard: document.querySelector("#exportBoard"),
  exportBoardLite: document.querySelector("#exportBoardLite"),
  importBoard: document.querySelector("#importBoard"),
  importBoardFile: document.querySelector("#importBoardFile"),
  padLayoutMode: document.querySelector("#padLayoutMode"),
  padColumns: document.querySelector("#padColumns"),
  padRows: document.querySelector("#padRows"),
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

function dbDelete(key) {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readwrite");
    const request = tx.objectStore(STORE).delete(key);
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

function clamp01(value, fallback = DEFAULT_MASTER_VOLUME) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(1, Math.max(0, number));
}

function keyForIndex(index) {
  return KEYS[index] || String(index + 1);
}

function createId() {
  return crypto?.randomUUID?.() || `board-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function padAudioKeyFor(boardId, index) {
  if (boardId === DEFAULT_BOARD_ID) return `pad-${index}`;
  return `board-${boardId}-pad-${index}`;
}

function padMetaKeyFor(boardId, index) {
  if (boardId === DEFAULT_BOARD_ID) return `pad-meta-${index}`;
  return `board-${boardId}-pad-meta-${index}`;
}

function padAudioKey(pad) {
  return padAudioKeyFor(state.currentBoardId, pad.index);
}

function padMetaKey(pad) {
  return padMetaKeyFor(state.currentBoardId, pad.index);
}

function boardHistoryKey(boardId) {
  return `board-history-${boardId}`;
}

function boardShortcutsKey(boardId) {
  return `${SHORTCUTS_STORAGE_PREFIX}-${boardId}`;
}

function boardShortcutsEnabledKey(boardId) {
  return `${SHORTCUTS_ENABLED_STORAGE_PREFIX}-${boardId}`;
}

function normalizeLayoutMode(mode) {
  return Object.prototype.hasOwnProperty.call(PAD_LAYOUTS, mode) ? mode : "auto";
}

function normalizeLayoutNumber(value, fallback = 0) {
  if (value === "" || value == null) return fallback;
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(8, Math.max(1, Math.round(number)));
}

function layoutForBoard(board) {
  const mode = normalizeLayoutMode(board?.layoutMode);
  if (mode !== "custom") return { mode, ...PAD_LAYOUTS[mode] };
  return {
    mode,
    columns: normalizeLayoutNumber(board?.padColumns, 4),
    rows: normalizeLayoutNumber(board?.padRows, 3),
  };
}

function formatVersionLabel(savedAt) {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return "Version sauvegardee";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function setPadTitle(pad, title) {
  pad.title = title.trim() || `Pad ${pad.index + 1}`;
  pad.titleEl.textContent = pad.title;
  pad.nameEl.value = pad.title;
}

function padTargetValue(pad) {
  return `pad:${pad.index}`;
}

function defaultShortcuts() {
  return state.pads.map((pad) => ({
    key: KEYS[pad.index] || "",
    padIndex: pad.index,
  }));
}

function normalizeShortcutKey(value) {
  const key = String(value || "").trim();
  if (!key) return "";
  if (key.length === 1) return key.toUpperCase();
  return key.replace(/^Key/i, "").slice(0, 1).toUpperCase();
}

function loadShortcutsForCurrentBoard() {
  const key = boardShortcutsKey(state.currentBoardId);
  state.shortcutsEnabled = localStorage.getItem(boardShortcutsEnabledKey(state.currentBoardId)) !== "off";
  if (els.shortcutEnabled) els.shortcutEnabled.checked = state.shortcutsEnabled;
  const defaults = defaultShortcuts();
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(saved)) {
      state.shortcuts = defaults.map((fallback, index) => {
        const savedItem = saved.find((item) => Number(item.padIndex) === fallback.padIndex) || saved[index];
        return {
          key: normalizeShortcutKey(savedItem?.key ?? fallback.key),
          padIndex: fallback.padIndex,
        };
      });
      return;
    }
  } catch {
    state.shortcuts = [];
  }
  state.shortcuts = defaults;
}

function saveShortcutsForCurrentBoard() {
  localStorage.setItem(boardShortcutsKey(state.currentBoardId), JSON.stringify(state.shortcuts));
}

function saveShortcutsEnabledForCurrentBoard() {
  localStorage.setItem(boardShortcutsEnabledKey(state.currentBoardId), state.shortcutsEnabled ? "on" : "off");
}

function padIndexForShortcutKey(key) {
  const shortcut = state.shortcuts.find((item) => item.key === key);
  return shortcut ? shortcut.padIndex : -1;
}

function setShortcut(rowIndex, key, padIndex) {
  const normalizedKey = normalizeShortcutKey(key);
  state.shortcuts[rowIndex] = {
    key: normalizedKey,
    padIndex: Math.min(state.pads.length - 1, Math.max(0, Number(padIndex) || 0)),
  };
  if (normalizedKey) {
    state.shortcuts.forEach((item, index) => {
      if (index !== rowIndex && item.key === normalizedKey) item.key = "";
    });
  }
  saveShortcutsForCurrentBoard();
  updateShortcutIndicators();
  renderShortcutRows();
}

function renderShortcutRows() {
  if (!els.shortcutRows) return;
  if (els.shortcutEnabled) els.shortcutEnabled.checked = state.shortcutsEnabled;
  if (!state.shortcuts.length) loadShortcutsForCurrentBoard();
  const shortcuts = state.shortcuts.filter((item) => state.pads[item.padIndex]);
  if (shortcuts.length < state.pads.length) {
    state.pads.forEach((pad) => {
      if (!shortcuts.some((item) => item.padIndex === pad.index)) {
        shortcuts.push({ key: KEYS[pad.index] || "", padIndex: pad.index });
      }
    });
  }
  state.shortcuts = shortcuts;
  els.shortcutRows.innerHTML = "";
  state.shortcuts.forEach((shortcut, rowIndex) => {
    const row = document.createElement("label");
    row.className = "shortcut-row";

    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.maxLength = 1;
    keyInput.inputMode = "text";
    keyInput.value = shortcut.key;
    keyInput.setAttribute("aria-label", "Touche du clavier");
    keyInput.addEventListener("keydown", (event) => {
      event.preventDefault();
      if (event.key === "Backspace" || event.key === "Delete") {
        keyInput.value = "";
        setShortcut(rowIndex, "", padSelect.value);
        return;
      }
      const nextKey = normalizeShortcutKey(event.key);
      keyInput.value = nextKey;
      setShortcut(rowIndex, nextKey, padSelect.value);
    });
    keyInput.addEventListener("input", () => {
      keyInput.value = normalizeShortcutKey(keyInput.value);
      setShortcut(rowIndex, keyInput.value, padSelect.value);
    });

    const padSelect = document.createElement("select");
    padSelect.setAttribute("aria-label", "Pad associe");
    state.pads.forEach((pad) => {
      const option = document.createElement("option");
      option.value = String(pad.index);
      option.textContent = pad.title;
      padSelect.append(option);
    });
    padSelect.value = String(shortcut.padIndex);
    padSelect.addEventListener("change", () => setShortcut(rowIndex, keyInput.value, padSelect.value));

    row.append(keyInput, padSelect);
    els.shortcutRows.append(row);
  });
}

function updateShortcutIndicators() {
  state.pads.forEach((pad) => {
    const shortcut = state.shortcuts.find((item) => item.padIndex === pad.index && item.key);
    if (!pad.shortcutEl) return;
    pad.shortcutEl.classList.toggle("is-number", !state.shortcutsEnabled);
    pad.shortcutEl.textContent = state.shortcutsEnabled ? (shortcut?.key || "") : String(pad.index + 1);
    pad.shortcutEl.hidden = state.shortcutsEnabled && !shortcut?.key;
  });
}

function setPadEditing(pad, editing) {
  if (state.stageMode && editing) return;
  pad.node.classList.toggle("is-editing", editing);
  if (editing) requestAnimationFrame(() => renderWaveform(pad));
}

function setBoardPadEditing(editing) {
  state.boardEditMode = Boolean(editing) && !state.stageMode;
  document.body.classList.toggle("board-edit-mode", state.boardEditMode);
  els.editPads?.classList.toggle("is-active", state.boardEditMode);
  els.editPads?.setAttribute("aria-pressed", String(state.boardEditMode));
  setBoardEditing(state.boardEditMode, false);
  state.pads.forEach((pad) => setPadEditing(pad, state.boardEditMode));
  setStatus(state.boardEditMode ? "Mode edit pads" : "Mode live");
}

function setPadDuration(pad, seconds) {
  pad.duration = Number.isFinite(seconds) ? seconds : 0;
  setPadTrim(pad, pad.trimStart, pad.trimEnd);
  pad.timeEl.textContent = pad.duration ? formatTime(playableDuration(pad)) : "--:--";
  updatePadProgress(pad);
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
    state.masterAnalyser = state.audioContext.createAnalyser();
    state.masterAnalyser.fftSize = 256;
    state.masterMeterData = new Uint8Array(state.masterAnalyser.fftSize);
    state.masterGain.gain.value = clamp01(els.masterVolume.value);
    state.masterGain.connect(state.masterAnalyser).connect(state.audioContext.destination);
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
    analyser: null,
    meterData: null,
    startedAt: 0,
    stopAt: 0,
    duration: 0,
    playMode: "oneshot",
    resumeOffset: 0,
    holdPointerId: null,
    volume: 0.85,
    panValue: 0,
    loop: false,
    duckTrigger: false,
    tags: "",
    color: "",
    fadeSeconds: "",
    fadeInSeconds: "",
    fadeOutSeconds: "",
    pitchSemitones: 0,
    pitchFine: 0,
    speedRate: 1,
    reverbPreset: "none",
    reverbWet: 0,
    normalizeEnabled: true,
    normalizedGain: 1,
    startStopMode: "none",
    startStopTag: "",
    endStartMode: "none",
    endStartTarget: "",
    trimStart: 0,
    trimEnd: 0,
    waveformPeaks: [],
    visualImage: "",
    visualImageHidden: false,
  };

  pad.titleEl = node.querySelector("[data-title]");
  pad.shortcutEl = node.querySelector("[data-shortcut]");
  pad.nameEl = node.querySelector("[data-name]");
  pad.tagsEl = node.querySelector("[data-tags]");
  pad.tagsDisplayEl = node.querySelector("[data-tags-display]");
  pad.fadeEl = node.querySelector("[data-pad-fade]");
  pad.trimStartEl = node.querySelector("[data-trim-start]");
  pad.trimEndEl = node.querySelector("[data-trim-end]");
  pad.trimStartValueEl = node.querySelector("[data-trim-start-value]");
  pad.trimEndValueEl = node.querySelector("[data-trim-end-value]");
  pad.waveformEl = node.querySelector("[data-waveform]");
  pad.waveformCanvas = node.querySelector("[data-waveform-canvas]");
  pad.trimSelectionEl = node.querySelector("[data-trim-selection]");
  pad.trimHandleStart = node.querySelector('[data-trim-handle="start"]');
  pad.trimHandleEnd = node.querySelector('[data-trim-handle="end"]');
  pad.timeEl = node.querySelector("[data-time]");
  pad.progressEl = node.querySelector("[data-progress]");
  pad.progressFillEl = node.querySelector("[data-progress-fill]");
  pad.vuEl = node.querySelector("[data-pad-vu]");
  pad.fileInput = node.querySelector("[data-file]");
  pad.recordButton = node.querySelector('[data-action="record"]');
  pad.modeButtons = [...node.querySelectorAll("[data-mode]")];
  pad.volumeEl = node.querySelector("[data-volume]");
  pad.panEl = node.querySelector("[data-pan]");
  pad.loopEl = node.querySelector('[data-action="loop"]');
  pad.duckEl = node.querySelector('[data-action="duck"]');
  pad.dragHandle = node.querySelector('[data-action="drag"]');
  pad.colorButtons = [...node.querySelectorAll("[data-color]")];
  pad.normalizeEl = node.querySelector("[data-normalize]");
  pad.normalizeValueEl = node.querySelector("[data-normalize-value]");
  pad.visualPreviewEl = node.querySelector("[data-visual-preview]");
  pad.visualToggleEl = node.querySelector('[data-action="visual-toggle"]');
  pad.imageInput = node.querySelector("[data-image-file]");
  pad.startStopModeEl = node.querySelector("[data-start-stop-mode]");
  pad.startStopTagEl = node.querySelector("[data-start-stop-tag]");
  pad.endStartModeEl = node.querySelector("[data-end-start-mode]");
  pad.endStartTargetEl = node.querySelector("[data-end-start-target]");

  setPadTitle(pad, pad.title);
  setPadTags(pad, pad.tags);
  setPadFade(pad, pad.fadeSeconds);
  setPadColor(pad, pad.color);
  setPadNormalization(pad, pad.normalizeEnabled, pad.normalizedGain);
  setPadAudioSettings(pad, {
    fadeInSeconds: pad.fadeInSeconds,
    fadeOutSeconds: pad.fadeOutSeconds,
    pitchSemitones: pad.pitchSemitones,
    pitchFine: pad.pitchFine,
    speedRate: pad.speedRate,
    reverbPreset: pad.reverbPreset,
    reverbWet: pad.reverbWet,
  });
  setPadVisualImage(pad, pad.visualImage, pad.visualImageHidden);
  setPadCrossfade(pad, {
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
  });
  setPadTrim(pad, pad.trimStart, pad.trimEnd);
  setPadMode(pad, pad.playMode);
  setPadLoop(pad, pad.loop);
  setPadDuckTrigger(pad, pad.duckTrigger);
  pad.volumeEl.value = pad.volume;
  pad.panEl.value = pad.panValue;
  node.classList.add("is-empty");

  node.querySelector('[data-action="load"]').addEventListener("click", () => {
    setStatus("Choisir Fichiers pour importer un audio");
    pad.fileInput.click();
  });
  pad.dragHandle.addEventListener("pointerdown", (event) => startPadDrag(pad, event));
  pad.recordButton.addEventListener("click", () => toggleRecording(pad));
  pad.fileInput.addEventListener("change", () => {
    const file = pad.fileInput.files?.[0];
    if (file) loadFileIntoPad(pad, file);
  });
  pad.imageInput?.addEventListener("change", async () => {
    const file = pad.imageInput.files?.[0];
    if (!file) return;
    const image = await fileToDataUrl(file);
    setPadVisualImage(pad, image, false);
    savePadMeta(pad);
    pad.imageInput.value = "";
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
  bindPadProgress(pad);
  node.querySelector('[data-action="fadeIn"]').addEventListener("click", () => playPad(pad, true));
  node.querySelector('[data-action="fadeOut"]').addEventListener("click", () => stopPad(pad, true));
  node.querySelector('[data-action="stop"]').addEventListener("click", () => stopPad(pad, false));
  node.querySelector('[data-action="delete-pad"]').addEventListener("click", () => deletePad(pad));
  node.querySelector('[data-action="audio"]').addEventListener("click", () => openAudioDialog(pad));
  node.querySelector('[data-action="visual-image"]').addEventListener("click", () => pad.imageInput?.click());
  pad.visualToggleEl?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    setPadVisualImage(pad, pad.visualImage, !pad.visualImageHidden);
    savePadMeta(pad);
  });
  pad.visualToggleEl?.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    setPadVisualImage(pad, pad.visualImage, !pad.visualImageHidden);
    savePadMeta(pad);
  });

  pad.nameEl.addEventListener("input", () => {
    setPadTitle(pad, pad.nameEl.value);
    refreshCrossfadeTargetOptions();
    renderShortcutRows();
    savePadMeta(pad);
  });
  pad.tagsEl.addEventListener("input", () => {
    setPadTags(pad, pad.tagsEl.value);
    refreshStopGroupOptions();
    refreshBoardTagFilterOptions();
    refreshCrossfadeTargetOptions();
    savePadMeta(pad);
  });
  pad.fadeEl.addEventListener("input", () => {
    setPadFade(pad, pad.fadeEl.value, false);
    savePadMeta(pad);
  });
  pad.trimStartEl.addEventListener("input", () => {
    setPadTrim(pad, pad.trimStartEl.value, pad.trimEnd);
    savePadMeta(pad);
    updatePadTime(pad);
  });
  pad.trimEndEl.addEventListener("input", () => {
    setPadTrim(pad, pad.trimStart, pad.trimEndEl.value);
    savePadMeta(pad);
    updatePadTime(pad);
  });
  bindWaveformTrim(pad);
  pad.nameEl.addEventListener("blur", () => {
    if (!state.boardEditMode) setPadEditing(pad, false);
  });
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
    if (pad.gain) pad.gain.gain.setTargetAtTime(targetPadGain(pad), state.audioContext.currentTime, 0.015);
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

  pad.duckEl.addEventListener("click", () => {
    setPadDuckTrigger(pad, !pad.duckTrigger);
    applyDucking();
    savePadMeta(pad);
  });

  pad.colorButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPadColor(pad, button.dataset.color || "");
      savePadMeta(pad);
    });
  });

  pad.normalizeEl.addEventListener("change", () => {
    setPadNormalization(pad, pad.normalizeEl.checked, pad.normalizedGain);
    if (pad.gain) pad.gain.gain.setTargetAtTime(targetPadGain(pad), state.audioContext.currentTime, 0.015);
    savePadMeta(pad);
  });

  [pad.startStopModeEl, pad.startStopTagEl, pad.endStartModeEl, pad.endStartTargetEl].forEach((element) => {
    element.addEventListener("input", () => {
      setPadCrossfade(pad, {
        startStopMode: pad.startStopModeEl.value,
        startStopTag: pad.startStopTagEl.value,
        endStartMode: pad.endStartModeEl.value,
        endStartTarget: pad.endStartTargetEl.value,
      });
      savePadMeta(pad);
    });
  });

  pad.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setPadMode(pad, button.dataset.mode);
      savePadMeta(pad);
    });
  });

  return pad;
}

function normalizeBoard(board, fallbackName = "Projet") {
  const mode = normalizeLayoutMode(board?.layoutMode);
  return {
    id: board?.id || createId(),
    name: board?.name || fallbackName,
    padCount: Math.max(1, Number(board?.padCount) || DEFAULT_PAD_COUNT),
    masterVolume: clamp01(board?.masterVolume),
    layoutMode: mode,
    padColumns: mode === "custom" ? normalizeLayoutNumber(board?.padColumns, 4) : 0,
    padRows: mode === "custom" ? normalizeLayoutNumber(board?.padRows, 3) : 0,
  };
}

function loadBoards() {
  const fallback = [normalizeBoard({ id: DEFAULT_BOARD_ID, name: "Projet 1", padCount: DEFAULT_PAD_COUNT, masterVolume: DEFAULT_MASTER_VOLUME })];
  try {
    const boards = JSON.parse(localStorage.getItem(BOARDS_STORAGE));
    if (Array.isArray(boards) && boards.length) {
      return boards.map((board) => normalizeBoard(board));
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

function setMasterVolume(value, persist = true) {
  const volume = clamp01(value);
  if (els.masterVolume) els.masterVolume.value = String(volume);
  if (els.masterVolumeValue) els.masterVolumeValue.textContent = `${Math.round(volume * 100)}%`;
  if (state.masterGain && state.audioContext) {
    state.masterGain.gain.setTargetAtTime(volume, state.audioContext.currentTime, 0.02);
  }
  if (persist) {
    const board = currentBoard();
    if (board) {
      board.masterVolume = volume;
      saveBoards();
    }
  }
}

function applyPadLayout(board = currentBoard()) {
  if (!els.pads) return;
  const layout = layoutForBoard(board);
  const enabled = layout.columns > 0 && layout.rows > 0;
  els.pads.classList.toggle("has-pad-layout", enabled);
  if (enabled) {
    els.pads.style.setProperty("--pad-columns", String(layout.columns));
    els.pads.style.setProperty("--pad-rows", String(layout.rows));
  } else {
    els.pads.style.removeProperty("--pad-columns");
    els.pads.style.removeProperty("--pad-rows");
  }
}

function applyBoardTagFilter() {
  const tag = String(els.boardTagFilter?.value || "").trim().toLowerCase();
  state.pads.forEach((pad) => {
    const matches = !tag || padTagList(pad).includes(tag);
    pad.node.classList.toggle("is-tag-match", Boolean(tag && matches));
    pad.node.classList.toggle("is-tag-dimmed", Boolean(tag && !matches));
  });
  if (tag) setStatus(`Pads tag ${tag}`);
}

function renderBoardLayoutControls() {
  const board = currentBoard();
  if (!board || !els.padLayoutMode) return;
  const layout = layoutForBoard(board);
  els.padLayoutMode.value = layout.mode;
  if (els.padColumns) {
    els.padColumns.value = layout.columns || "";
    els.padColumns.disabled = layout.mode !== "custom";
  }
  if (els.padRows) {
    els.padRows.value = layout.rows || "";
    els.padRows.disabled = layout.mode !== "custom";
  }
}

function updateBoardLayout() {
  const board = currentBoard();
  if (!board) return;
  const mode = normalizeLayoutMode(els.padLayoutMode?.value);
  board.layoutMode = mode;
  if (mode === "custom") {
    board.padColumns = normalizeLayoutNumber(els.padColumns?.value, board.padColumns || 4);
    board.padRows = normalizeLayoutNumber(els.padRows?.value, board.padRows || 3);
  } else {
    board.padColumns = 0;
    board.padRows = 0;
  }
  saveBoards();
  renderBoardLayoutControls();
  applyPadLayout(board);
  setStatus(mode === "auto" ? "Disposition auto" : "Disposition pads modifiee");
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
  setMasterVolume(currentBoard().masterVolume ?? DEFAULT_MASTER_VOLUME, false);
  renderBoardLayoutControls();
  applyPadLayout();
  refreshVersionOptions();
}

function setBoardEditing(editing, focusName = true) {
  const strip = document.querySelector(".board-strip");
  strip?.classList.toggle("is-editing", editing);
  if (editing && focusName) {
    els.boardName?.focus();
    els.boardName?.select();
  }
}

function movePadInMemory(pad, toIndex) {
  const fromIndex = state.pads.indexOf(pad);
  if (fromIndex < 0 || toIndex < 0 || toIndex >= state.pads.length || fromIndex === toIndex) return;
  state.pads.splice(fromIndex, 1);
  state.pads.splice(toIndex, 0, pad);
  state.pads.forEach((item) => els.pads.append(item.node));
}

function padIndexFromPoint(clientX, clientY, draggedPad) {
  const targetNode = document.elementFromPoint(clientX, clientY)?.closest("[data-pad]");
  const targetPad = state.pads.find((pad) => pad.node === targetNode);
  if (!targetPad || targetPad === draggedPad) return -1;

  const targetIndex = state.pads.indexOf(targetPad);
  const draggedIndex = state.pads.indexOf(draggedPad);
  const rect = targetPad.node.getBoundingClientRect();
  const horizontal = rect.width > rect.height * 1.2;
  const after = horizontal
    ? clientX > rect.left + rect.width / 2
    : clientY > rect.top + rect.height / 2;
  let toIndex = targetIndex + (after ? 1 : 0);
  if (toIndex > draggedIndex) toIndex -= 1;
  return Math.max(0, Math.min(state.pads.length - 1, toIndex));
}

async function persistPadOrder(originalPads, finalPads) {
  const snapshots = new Map();

  for (const pad of originalPads) {
    snapshots.set(pad, {
      audio: await dbGet(padAudioKey(pad)),
      meta: await dbGet(padMetaKey(pad)),
    });
  }

  for (let index = 0; index < finalPads.length; index += 1) {
    const targetPad = { index };
    const snapshot = snapshots.get(finalPads[index]) || {};
    if (snapshot.meta) {
      await dbSet(padMetaKey(targetPad), snapshot.meta);
    } else {
      await dbDelete(padMetaKey(targetPad));
    }
    if (snapshot.audio) {
      await dbSet(padAudioKey(targetPad), snapshot.audio);
    } else {
      await dbDelete(padAudioKey(targetPad));
    }
  }
}

function startPadDrag(pad, event) {
  if (!pad.node.classList.contains("is-editing") || state.drag) return;
  event.preventDefault();
  event.stopPropagation();

  const originalPads = state.pads.slice();
  state.drag = {
    pad,
    originalPads,
    moved: false,
    pointerId: event.pointerId,
  };
  pad.node.classList.add("is-dragging");
  pad.dragHandle.setPointerCapture?.(event.pointerId);
  setStatus("Glissez pour déplacer le pad");

  const onPointerMove = (moveEvent) => {
    if (!state.drag || moveEvent.pointerId !== state.drag.pointerId) return;
    moveEvent.preventDefault();
    const toIndex = padIndexFromPoint(moveEvent.clientX, moveEvent.clientY, pad);
    if (toIndex < 0) return;
    state.drag.moved = true;
    movePadInMemory(pad, toIndex);
  };

  const finishDrag = async (endEvent) => {
    if (!state.drag || endEvent.pointerId !== state.drag.pointerId) return;
    endEvent.preventDefault();
    pad.dragHandle.releasePointerCapture?.(event.pointerId);
    pad.node.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finishDrag);
    window.removeEventListener("pointercancel", cancelDrag);

    const drag = state.drag;
    state.drag = null;
    if (!drag.moved) {
      setStatus("Déplacement annulé");
      return;
    }

    try {
      await persistPadOrder(drag.originalPads, state.pads.slice());
      await renderPads();
      setStatus("Pads réordonnés");
    } catch {
      state.pads = drag.originalPads;
      state.pads.forEach((item) => els.pads.append(item.node));
      setStatus("Réorganisation impossible");
    }
  };

  const cancelDrag = (cancelEvent) => {
    if (!state.drag || cancelEvent.pointerId !== state.drag.pointerId) return;
    pad.dragHandle.releasePointerCapture?.(event.pointerId);
    pad.node.classList.remove("is-dragging");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", finishDrag);
    window.removeEventListener("pointercancel", cancelDrag);
    state.pads = state.drag.originalPads;
    state.pads.forEach((item) => els.pads.append(item.node));
    state.drag = null;
    setStatus("Déplacement annulé");
  };

  window.addEventListener("pointermove", onPointerMove, { passive: false });
  window.addEventListener("pointerup", finishDrag, { passive: false });
  window.addEventListener("pointercancel", cancelDrag);
}

async function renderPads() {
  stopAll();
  resetRecordingState();
  state.boardEditMode = false;
  document.body.classList.remove("board-edit-mode");
  setBoardEditing(false, false);
  els.editPads?.classList.remove("is-active");
  els.editPads?.setAttribute("aria-pressed", "false");
  state.pads = [];
  els.pads.innerHTML = "";
  const board = currentBoard();
  for (let index = 0; index < board.padCount; index += 1) {
    const pad = makePad(index);
    state.pads.push(pad);
    els.pads.append(pad.node);
    bindButtonFeedback(pad.node);
    restorePad(pad)
      .then(() => {
        refreshStopGroupOptions();
        refreshBoardTagFilterOptions();
        refreshCrossfadeTargetOptions();
        renderShortcutRows();
      })
      .catch(() => {
        pad.node.classList.add("is-empty");
      });
  }
  refreshStopGroupOptions();
  refreshBoardTagFilterOptions();
  refreshCrossfadeTargetOptions();
  loadShortcutsForCurrentBoard();
  renderShortcutRows();
  updateShortcutIndicators();
  setStatus(`${board.name} charge`);
}

async function switchBoard(boardId) {
  setBoardPadEditing(false);
  state.currentBoardId = boardId;
  saveBoards();
  renderBoardOptions();
  await renderPads();
}

async function addBoard() {
  setBoardPadEditing(false);
  const name = nextBoardName();
  const board = {
    id: createId(),
    name,
    padCount: DEFAULT_PAD_COUNT,
    masterVolume: DEFAULT_MASTER_VOLUME,
    layoutMode: "auto",
    padColumns: 0,
    padRows: 0,
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

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function safeFileName(name) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "soundboard";
}

function canUseMinimalSkin() {
  return window.matchMedia("(max-width: 950px), (pointer: coarse)").matches;
}

function updateSkinOptions() {
  const minimalOption = els.skinSelect?.querySelector('option[value="minimal"]');
  if (!minimalOption) return;
  minimalOption.disabled = !canUseMinimalSkin();
  minimalOption.hidden = !canUseMinimalSkin();
}

function applySkin(skin) {
  const migratedSkin = skin === "scene" ? "candy" : skin;
  const requestedSkin = ["candy", "classic", "contrast", "minimal", "neon", "studio", "visual"].includes(migratedSkin) ? migratedSkin : "classic";
  const skinName = requestedSkin === "minimal" && !canUseMinimalSkin() ? "classic" : requestedSkin;
  updateSkinOptions();
  document.body.dataset.skin = skinName;
  if (els.skinSelect) els.skinSelect.value = skinName;
  localStorage.setItem(SKIN_STORAGE, skinName);
}

async function shareOrDownloadBoard(blob, filename, boardName) {
  const file = new File([blob], filename, { type: "application/json" });

  if (navigator.canShare?.({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        files: [file],
        title: boardName,
        text: `Board Soundboard Live: ${boardName}`,
      });
      setStatus(`${boardName} exporte`);
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("Export annule");
        return;
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus(`${boardName} exporte`);
}

async function createBoardSnapshot(board) {
  const pads = [];
  for (let index = 0; index < board.padCount; index += 1) {
    pads.push({
      index,
      meta: await dbGet(padMetaKeyFor(board.id, index)),
      audio: await dbGet(padAudioKeyFor(board.id, index)),
    });
  }
  return {
    id: createId(),
    savedAt: new Date().toISOString(),
    board: {
      name: board.name,
      padCount: board.padCount,
      masterVolume: board.masterVolume ?? DEFAULT_MASTER_VOLUME,
      layoutMode: board.layoutMode || "auto",
      padColumns: board.padColumns || 0,
      padRows: board.padRows || 0,
    },
    pads,
  };
}

async function saveBoardVersion() {
  const board = currentBoard();
  const snapshot = await createBoardSnapshot(board);
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  history.unshift(snapshot);
  await dbSet(boardHistoryKey(board.id), history.slice(0, HISTORY_LIMIT));
  await refreshVersionOptions(snapshot.id);
  setStatus(`Version sauvegardee: ${board.name}`);
}

async function refreshVersionOptions(selectedId = "") {
  if (!els.versionSelect || !state.db) return;
  const board = currentBoard();
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  els.versionSelect.innerHTML = '<option value="">Versions</option>';
  history.slice(0, HISTORY_LIMIT).forEach((snapshot, index) => {
    const option = document.createElement("option");
    option.value = snapshot.id;
    option.textContent = `${index + 1}. ${formatVersionLabel(snapshot.savedAt)}`;
    els.versionSelect.append(option);
  });
  els.versionSelect.value = history.some((snapshot) => snapshot.id === selectedId) ? selectedId : "";
}

async function restoreSelectedBoardVersion() {
  const board = currentBoard();
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  const selectedId = els.versionSelect?.value;
  const snapshot = history.find((item) => item.id === selectedId);
  if (!snapshot) {
    setStatus("Choisir une version");
    return;
  }

  const label = formatVersionLabel(snapshot.savedAt);
  if (!window.confirm(`Restaurer "${board.name}" depuis ${label} ?`)) return;

  stopAll();
  resetRecordingState();
  const previousPadCount = board.padCount;
  board.name = snapshot.board?.name || board.name;
  board.padCount = Math.max(1, Number(snapshot.board?.padCount) || DEFAULT_PAD_COUNT);
  board.masterVolume = clamp01(snapshot.board?.masterVolume);
  board.layoutMode = normalizeLayoutMode(snapshot.board?.layoutMode);
  board.padColumns = board.layoutMode === "custom" ? normalizeLayoutNumber(snapshot.board?.padColumns, 4) : 0;
  board.padRows = board.layoutMode === "custom" ? normalizeLayoutNumber(snapshot.board?.padRows, 3) : 0;

  const maxPadCount = Math.max(previousPadCount, board.padCount);
  for (let index = 0; index < maxPadCount; index += 1) {
    await dbDelete(padMetaKeyFor(board.id, index));
    await dbDelete(padAudioKeyFor(board.id, index));
  }

  for (const item of snapshot.pads || []) {
    const index = Number(item.index);
    if (!Number.isInteger(index) || index < 0 || index >= board.padCount) continue;
    if (item.meta) await dbSet(padMetaKeyFor(board.id, index), item.meta);
    if (item.audio) await dbSet(padAudioKeyFor(board.id, index), item.audio);
  }

  saveBoards();
  renderBoardOptions();
  await renderPads();
  setBoardPadEditing(true);
  await refreshVersionOptions(snapshot.id);
  setStatus(`Version restauree: ${board.name}`);
}

async function exportCurrentBoard(includeAudio = true) {
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
      duckTrigger: Boolean(meta?.duckTrigger ?? saved?.duckTrigger),
      tags: meta?.tags ?? saved?.tags ?? "",
      color: meta?.color ?? saved?.color ?? "",
      fadeSeconds: meta?.fadeSeconds ?? saved?.fadeSeconds ?? "",
      normalizeEnabled: meta?.normalizeEnabled ?? saved?.normalizeEnabled ?? true,
      normalizedGain: meta?.normalizedGain ?? saved?.normalizedGain ?? 1,
      startStopMode: meta?.startStopMode ?? saved?.startStopMode ?? "none",
      startStopTag: meta?.startStopTag ?? saved?.startStopTag ?? "",
      endStartMode: meta?.endStartMode ?? saved?.endStartMode ?? "none",
      endStartTarget: meta?.endStartTarget ?? saved?.endStartTarget ?? "",
      trimStart: meta?.trimStart ?? saved?.trimStart ?? 0,
      trimEnd: meta?.trimEnd ?? saved?.trimEnd ?? 0,
      playMode: meta?.playMode || saved?.playMode || "oneshot",
      audio: includeAudio && saved?.audio ? {
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
    includesAudio: includeAudio,
    board: {
      name: board.name,
      padCount: board.padCount,
      masterVolume: board.masterVolume ?? DEFAULT_MASTER_VOLUME,
      layoutMode: board.layoutMode || "auto",
      padColumns: board.padColumns || 0,
      padRows: board.padRows || 0,
      pads,
    },
  };

  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const suffix = includeAudio ? "soundboard" : "soundboard-settings";
  await shareOrDownloadBoard(blob, `${safeFileName(board.name)}.${suffix}.json`, board.name);
}

async function importBoardFile(file) {
  let payload;
  try {
    payload = JSON.parse(await file.text());
  } catch {
    setStatus("Fichier board illisible");
    return;
  }

  if (payload?.format !== "soundboard-live-board" || !payload.board) {
    setStatus("Fichier board invalide");
    return;
  }

  const importedBoard = normalizeBoard({
    id: createId(),
    name: payload.board.name || cleanName(file.name),
    padCount: Math.max(1, Number(payload.board.padCount) || DEFAULT_PAD_COUNT),
    masterVolume: clamp01(payload.board.masterVolume),
    layoutMode: payload.board.layoutMode,
    padColumns: payload.board.padColumns,
    padRows: payload.board.padRows,
  });
  setBoardPadEditing(false);
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
      duckTrigger: Boolean(item.duckTrigger),
      tags: item.tags || "",
      color: item.color || "",
      fadeSeconds: item.fadeSeconds ?? "",
      normalizeEnabled: item.normalizeEnabled ?? true,
      normalizedGain: item.normalizedGain ?? 1,
      startStopMode: item.startStopMode || "none",
      startStopTag: item.startStopTag || "",
      endStartMode: item.endStartMode || "none",
      endStartTarget: item.endStartTarget || "",
      trimStart: item.trimStart ?? 0,
      trimEnd: item.trimEnd ?? 0,
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
  if (state.boardEditMode) setPadEditing(pad, true);
  refreshStopGroupOptions();
  setStatus(`Pad ${board.padCount} ajoute`);
}

async function deletePad(pad) {
  if (!state.boardEditMode) return;
  const board = currentBoard();
  if (board.padCount <= 1) {
    setStatus("Dernier pad non supprimable");
    return;
  }
  if (!window.confirm(`Supprimer le pad "${pad.title}" ?`)) return;

  stopAll();
  if (state.recordingPad === pad) resetRecordingState();

  const boardId = state.currentBoardId;
  const remainingPads = state.pads.filter((item) => item !== pad);
  const snapshots = [];
  for (const item of remainingPads) {
    snapshots.push({
      audio: await dbGet(padAudioKeyFor(boardId, item.index)),
      meta: await dbGet(padMetaKeyFor(boardId, item.index)),
    });
  }

  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];
    if (snapshot.meta) {
      await dbSet(padMetaKeyFor(boardId, index), snapshot.meta);
    } else {
      await dbDelete(padMetaKeyFor(boardId, index));
    }
    if (snapshot.audio) {
      await dbSet(padAudioKeyFor(boardId, index), snapshot.audio);
    } else {
      await dbDelete(padAudioKeyFor(boardId, index));
    }
  }

  await dbDelete(padMetaKeyFor(boardId, board.padCount - 1));
  await dbDelete(padAudioKeyFor(boardId, board.padCount - 1));
  board.padCount = remainingPads.length;
  saveBoards();
  await renderPads();
  setBoardPadEditing(true);
  setStatus(`${pad.title} supprime`);
}

async function deleteCurrentBoard() {
  if (!state.boardEditMode) return;
  if (state.boards.length <= 1) {
    setStatus("Dernier board non supprimable");
    return;
  }

  const board = currentBoard();
  if (!window.confirm(`Supprimer le board "${board.name}" et tous ses pads ?`)) return;

  stopAll();
  resetRecordingState();
  for (let index = 0; index < board.padCount; index += 1) {
    await dbDelete(padMetaKeyFor(board.id, index));
    await dbDelete(padAudioKeyFor(board.id, index));
  }
  await dbDelete(boardHistoryKey(board.id));

  const deletedIndex = state.boards.findIndex((item) => item.id === board.id);
  state.boards = state.boards.filter((item) => item.id !== board.id);
  const nextIndex = Math.min(Math.max(0, deletedIndex), state.boards.length - 1);
  state.currentBoardId = state.boards[nextIndex].id;
  saveBoards();
  renderBoardOptions();
  await renderPads();
  setBoardPadEditing(true);
  setStatus(`${board.name} supprime`);
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
  pad.waveformPeaks = buildWaveformPeaks(buffer);
  setPadNormalization(pad, true, normalizedGainForBuffer(buffer));
  setPadTitle(pad, cleanName(name));
  setPadDuration(pad, buffer.duration);
  renderWaveform(pad);
  pad.node.classList.remove("is-empty");
  await dbSet(padAudioKey(pad), {
    name,
    title: pad.title,
    type,
    audio: arrayBuffer,
    volume: pad.volume,
    panValue: pad.panValue,
    loop: pad.loop,
    duckTrigger: pad.duckTrigger,
    tags: pad.tags,
    color: pad.color,
    fadeSeconds: pad.fadeSeconds,
    fadeInSeconds: pad.fadeInSeconds,
    fadeOutSeconds: pad.fadeOutSeconds,
    pitchSemitones: pad.pitchSemitones,
    pitchFine: pad.pitchFine,
    speedRate: pad.speedRate,
    reverbPreset: pad.reverbPreset,
    reverbWet: pad.reverbWet,
    normalizeEnabled: pad.normalizeEnabled,
    normalizedGain: pad.normalizedGain,
    visualImage: pad.visualImage,
    visualImageHidden: pad.visualImageHidden,
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
    trimStart: pad.trimStart,
    trimEnd: pad.trimEnd,
    playMode: pad.playMode,
  });
  await savePadMeta(pad);
  setStatus(`${pad.title} charge - norm ${pad.normalizedGain.toFixed(2)}x`);
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
    setPadDuckTrigger(pad, Boolean(meta.duckTrigger));
    setPadTags(pad, meta.tags || "");
    setPadColor(pad, meta.color || "");
    setPadFade(pad, meta.fadeSeconds ?? "");
    setPadAudioSettings(pad, meta);
    setPadNormalization(pad, meta.normalizeEnabled ?? true, meta.normalizedGain ?? 1);
    setPadVisualImage(pad, meta.visualImage || "", Boolean(meta.visualImageHidden));
    setPadCrossfade(pad, {
      startStopMode: meta.startStopMode,
      startStopTag: meta.startStopTag,
      endStartMode: meta.endStartMode,
      endStartTarget: meta.endStartTarget,
    });
    setPadTrim(pad, meta.trimStart ?? 0, meta.trimEnd ?? 0);
    setPadMode(pad, meta.playMode || pad.playMode);
    pad.volumeEl.value = pad.volume;
    pad.panEl.value = pad.panValue;
  }

  const saved = await dbGet(padAudioKey(pad));
  if (!saved) return;

  prepareAudio();
  pad.buffer = await state.audioContext.decodeAudioData(saved.audio.slice(0));
  pad.waveformPeaks = buildWaveformPeaks(pad.buffer);
  setPadTitle(pad, meta?.title || saved.title || cleanName(saved.name || `Pad ${pad.index + 1}`));
  pad.volume = saved.volume ?? pad.volume;
  pad.panValue = saved.panValue ?? pad.panValue;
  setPadLoop(pad, Boolean(saved.loop));
  setPadDuckTrigger(pad, Boolean(saved.duckTrigger));
  setPadTags(pad, meta?.tags ?? saved.tags ?? "");
  setPadColor(pad, meta?.color ?? saved.color ?? "");
  setPadFade(pad, meta?.fadeSeconds ?? saved.fadeSeconds ?? "");
  setPadAudioSettings(pad, {
    fadeSeconds: meta?.fadeSeconds ?? saved.fadeSeconds ?? "",
    fadeInSeconds: meta?.fadeInSeconds ?? saved.fadeInSeconds,
    fadeOutSeconds: meta?.fadeOutSeconds ?? saved.fadeOutSeconds,
    pitchSemitones: meta?.pitchSemitones ?? saved.pitchSemitones,
    pitchFine: meta?.pitchFine ?? saved.pitchFine,
    speedRate: meta?.speedRate ?? saved.speedRate,
    reverbPreset: meta?.reverbPreset ?? saved.reverbPreset,
    reverbWet: meta?.reverbWet ?? saved.reverbWet,
  });
  setPadNormalization(pad, meta?.normalizeEnabled ?? saved.normalizeEnabled ?? true, meta?.normalizedGain ?? saved.normalizedGain ?? 1);
  setPadVisualImage(pad, meta?.visualImage ?? saved.visualImage ?? "", Boolean(meta?.visualImageHidden ?? saved.visualImageHidden));
  setPadCrossfade(pad, {
    startStopMode: meta?.startStopMode ?? saved.startStopMode,
    startStopTag: meta?.startStopTag ?? saved.startStopTag,
    endStartMode: meta?.endStartMode ?? saved.endStartMode,
    endStartTarget: meta?.endStartTarget ?? saved.endStartTarget,
  });
  setPadTrim(pad, meta?.trimStart ?? saved.trimStart ?? 0, meta?.trimEnd ?? saved.trimEnd ?? 0);
  setPadMode(pad, saved.playMode || pad.playMode);
  setPadDuration(pad, pad.buffer.duration);
  renderWaveform(pad);
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
    duckTrigger: pad.duckTrigger,
    tags: pad.tags,
    color: pad.color,
    fadeSeconds: pad.fadeSeconds,
    fadeInSeconds: pad.fadeInSeconds,
    fadeOutSeconds: pad.fadeOutSeconds,
    pitchSemitones: pad.pitchSemitones,
    pitchFine: pad.pitchFine,
    speedRate: pad.speedRate,
    reverbPreset: pad.reverbPreset,
    reverbWet: pad.reverbWet,
    normalizeEnabled: pad.normalizeEnabled,
    normalizedGain: pad.normalizedGain,
    visualImage: pad.visualImage,
    visualImageHidden: pad.visualImageHidden,
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
    trimStart: pad.trimStart,
    trimEnd: pad.trimEnd,
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

function setStageMode(enabled, requestFullscreen = false) {
  state.stageMode = Boolean(enabled);
  document.body.classList.toggle("stage-mode", state.stageMode);
  els.stageMode?.classList.toggle("is-active", state.stageMode);
  els.stageMode?.setAttribute("aria-pressed", String(state.stageMode));
  localStorage.setItem(STAGE_MODE_STORAGE, state.stageMode ? "on" : "off");

  if (state.stageMode) {
    setBoardPadEditing(false);
    const canRequestFullscreen = Boolean(document.documentElement.requestFullscreen);
    if (requestFullscreen && !document.fullscreenElement && canRequestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    setStatus(requestFullscreen && !canRequestFullscreen ? "Mode scene: plein ecran via icone iPhone" : "Mode scene");
  } else {
    if (requestFullscreen && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setStatus("Mode scene quitte");
  }
}

function duckingActive() {
  return duckAmount() > 0 && state.pads.some((pad) => pad.source && pad.duckTrigger);
}

function updatePadAlerts(pad) {
  if (!pad?.node) return;
  const remaining = remainingSeconds(pad);
  const duration = playableDuration(pad);
  const endingThreshold = Math.min(ENDING_ALERT_SECONDS, Math.max(1, duration * 0.2));
  const isEnding = Boolean(pad.source && !pad.loop && remaining <= endingThreshold);
  const isDuckSource = Boolean(pad.source && pad.duckTrigger && duckAmount() > 0);
  const isDucked = Boolean(pad.source && duckingActive() && !pad.duckTrigger);

  pad.node.classList.toggle("is-ending", isEnding);
  pad.node.classList.toggle("is-looping", pad.loop);
  pad.node.classList.toggle("is-duck-trigger", pad.duckTrigger);
  pad.node.classList.toggle("is-duck-source", isDuckSource);
  pad.node.classList.toggle("is-ducked", isDucked);
}

function updateAllPadAlerts() {
  state.pads.forEach(updatePadAlerts);
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
  updatePadAlerts(pad);
}

function setPadDuckTrigger(pad, duckTrigger) {
  pad.duckTrigger = Boolean(duckTrigger);
  pad.duckEl?.classList.toggle("is-active", pad.duckTrigger);
  pad.duckEl?.setAttribute("aria-pressed", String(pad.duckTrigger));
  updatePadAlerts(pad);
}

function setPadTags(pad, tags) {
  pad.tags = tags.trim();
  pad.tagsEl.value = pad.tags;
  pad.tagsDisplayEl.textContent = pad.tags;
  pad.tagsDisplayEl.hidden = !pad.tags;
}

function padTagList(pad) {
  return pad.tags
    .split(/[#,;]+|\s+/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function refreshStopGroupOptions() {
  if (!els.stopGroupSelect) return;
  const currentValue = els.stopGroupSelect.value;
  const tags = [...new Set(state.pads.flatMap(padTagList))].sort((a, b) => a.localeCompare(b));
  els.stopGroupSelect.innerHTML = '<option value="">Tags</option>';
  tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    els.stopGroupSelect.append(option);
  });
  els.stopGroupSelect.value = tags.includes(currentValue) ? currentValue : "";
  const longestLength = Math.max(4, ...tags.map((tag) => tag.length));
  const width = `${Math.min(34, longestLength + 8)}ch`;
  els.stopGroupSelect.style.setProperty("--stop-group-width", width);
  els.stopGroupSelect.style.width = width;
  els.stopGroupSelect.style.minWidth = width;
  els.stopGroupSelect.closest(".group-stop-row")?.style.setProperty("--stop-group-width", width);
  els.stopGroupSelect.closest(".group-stop-control")?.style.setProperty("--stop-group-width", width);
  els.stopGroupSelect.closest(".master-strip")?.style.setProperty("--stop-group-width", width);
}

function boardTags() {
  return [...new Set(state.pads.flatMap(padTagList))].sort((a, b) => a.localeCompare(b));
}

function refreshBoardTagFilterOptions() {
  if (!els.boardTagFilter) return;
  const currentValue = els.boardTagFilter.value;
  const tags = boardTags();
  els.boardTagFilter.innerHTML = '<option value="">Tous</option>';
  tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    els.boardTagFilter.append(option);
  });
  els.boardTagFilter.value = tags.includes(currentValue) ? currentValue : "";
  applyBoardTagFilter();
}

function fillCrossfadeTargetSelect(select, selectedValue = "") {
  if (!select) return;
  const currentValue = String(selectedValue || select.value || "").trim();
  select.innerHTML = '<option value="">Choisir</option>';

  const padGroup = document.createElement("optgroup");
  padGroup.label = "Pads";
  state.pads.forEach((pad) => {
    const option = document.createElement("option");
    option.value = padTargetValue(pad);
    option.textContent = `${pad.index + 1}. ${pad.title}`;
    padGroup.append(option);
  });
  select.append(padGroup);

  const tags = boardTags();
  if (tags.length) {
    const tagGroup = document.createElement("optgroup");
    tagGroup.label = "Tags";
    const allOption = document.createElement("option");
    allOption.value = "tag:*";
    allOption.textContent = "Tous";
    tagGroup.append(allOption);
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = `tag:${tag}`;
      option.textContent = tag;
      tagGroup.append(option);
    });
    select.append(tagGroup);
  }

  if (currentValue && [...select.options].some((option) => option.value === currentValue)) {
    select.value = currentValue;
  } else {
    select.value = "";
  }
}

function refreshCrossfadeTargetOptions() {
  state.pads.forEach((pad) => {
    fillCrossfadeTargetSelect(pad.startStopTagEl, pad.startStopTag);
    fillCrossfadeTargetSelect(pad.endStartTargetEl, pad.endStartTarget);
  });
}

function setPadFade(pad, fadeSeconds, updateInput = true) {
  const value = String(fadeSeconds ?? "").trim();
  const number = value === "" ? "" : Math.min(30, Math.max(0, Number(value)));
  pad.fadeSeconds = Number.isFinite(number) ? number : "";
  if (updateInput && pad.fadeEl) pad.fadeEl.value = pad.fadeSeconds === "" ? "" : String(pad.fadeSeconds);
}

function normalizeOptionalSeconds(value) {
  const raw = String(value ?? "").trim();
  if (raw === "") return "";
  const number = Number(raw);
  return Number.isFinite(number) ? Math.min(30, Math.max(0, number)) : "";
}

function setPadAudioSettings(pad, settings = {}) {
  pad.fadeInSeconds = normalizeOptionalSeconds(settings.fadeInSeconds ?? settings.fadeSeconds ?? pad.fadeInSeconds);
  pad.fadeOutSeconds = normalizeOptionalSeconds(settings.fadeOutSeconds ?? settings.fadeSeconds ?? pad.fadeOutSeconds);
  pad.pitchSemitones = Math.min(12, Math.max(-12, Number(settings.pitchSemitones) || 0));
  pad.pitchFine = Math.min(100, Math.max(-100, Number(settings.pitchFine) || 0));
  pad.speedRate = Math.min(2, Math.max(0.5, Number(settings.speedRate) || 1));
  pad.reverbPreset = Object.prototype.hasOwnProperty.call(REVERB_PRESETS, settings.reverbPreset) ? settings.reverbPreset : "none";
  pad.reverbWet = Math.min(1, Math.max(0, Number(settings.reverbWet) || 0));
}

function setPadVisualImage(pad, image = "", hidden = false) {
  pad.visualImage = String(image || "");
  pad.visualImageHidden = Boolean(hidden);
  pad.node.classList.toggle("has-visual-image", Boolean(pad.visualImage));
  pad.node.classList.toggle("is-visual-hidden", pad.visualImageHidden);
  pad.visualToggleEl?.setAttribute("aria-pressed", String(pad.visualImageHidden));
  if (pad.visualImage) {
    pad.node.style.setProperty("--pad-image", `url("${pad.visualImage}")`);
    pad.visualPreviewEl?.style.setProperty("background-image", `url("${pad.visualImage}")`);
  } else {
    pad.node.style.removeProperty("--pad-image");
    pad.visualPreviewEl?.style.removeProperty("background-image");
  }
}

function setPadColor(pad, color) {
  pad.color = PAD_COLORS[color] ? color : "";
  pad.node.classList.toggle("has-color", Boolean(pad.color));
  if (pad.color) {
    pad.node.style.setProperty("--pad-color", PAD_COLORS[pad.color]);
  } else {
    pad.node.style.removeProperty("--pad-color");
  }
  pad.colorButtons?.forEach((button) => {
    button.classList.toggle("is-active", (button.dataset.color || "") === pad.color);
  });
}

function setPadNormalization(pad, enabled, gain = 1) {
  const number = Number(gain);
  pad.normalizedGain = Number.isFinite(number)
    ? Math.min(NORMALIZE_MAX_GAIN, Math.max(NORMALIZE_MIN_GAIN, number))
    : 1;
  pad.normalizeEnabled = Boolean(enabled);
  if (pad.normalizeEl) pad.normalizeEl.checked = pad.normalizeEnabled;
  if (pad.normalizeValueEl) pad.normalizeValueEl.textContent = `${pad.normalizedGain.toFixed(2)}x`;
}

function normalizeCrossfadeAction(mode, legacyTarget = "") {
  if (["none", "play", "stop"].includes(mode)) return mode;
  if (["all", "tag"].includes(mode)) return "stop";
  if (mode === "pad") return "play";
  return legacyTarget ? "play" : "none";
}

function normalizeCrossfadeTarget(value, legacyMode = "") {
  const target = String(value || "").trim();
  if (!target || target.includes(":")) return target;
  if (legacyMode === "tag") return `tag:${target.toLowerCase()}`;
  if (legacyMode === "pad") {
    const targetPad = padFromTarget(target);
    return targetPad ? padTargetValue(targetPad) : "";
  }
  return target;
}

function setPadCrossfade(pad, rule = {}) {
  pad.startStopMode = normalizeCrossfadeAction(rule.startStopMode, rule.startStopTag);
  pad.startStopTag = normalizeCrossfadeTarget(rule.startStopTag, rule.startStopMode);
  pad.endStartMode = normalizeCrossfadeAction(rule.endStartMode, rule.endStartTarget);
  pad.endStartTarget = normalizeCrossfadeTarget(rule.endStartTarget, rule.endStartMode);
  if (pad.startStopModeEl) pad.startStopModeEl.value = pad.startStopMode;
  if (pad.startStopTagEl) pad.startStopTagEl.value = pad.startStopTag;
  if (pad.endStartModeEl) pad.endStartModeEl.value = pad.endStartMode;
  if (pad.endStartTargetEl) pad.endStartTargetEl.value = pad.endStartTarget;
}

function numericInputValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function formatSecondsTenths(seconds) {
  return `${(Math.round(Math.max(0, seconds) * 10) / 10).toFixed(1)}s`;
}

function trimDisplayEnd(pad) {
  if (!pad.duration) return 0;
  return pad.trimEnd ? trimEnd(pad) : pad.duration;
}

function setPadTrim(pad, start, end) {
  pad.trimStart = numericInputValue(start);
  pad.trimEnd = numericInputValue(end);
  if (pad.duration) {
    pad.trimStart = Math.min(pad.trimStart, Math.max(0, pad.duration - 0.01));
    pad.trimEnd = pad.trimEnd ? Math.min(Math.max(pad.trimEnd, pad.trimStart + 0.01), pad.duration) : 0;
  }
  pad.trimStartEl.value = pad.trimStart ? String(Math.round(pad.trimStart * 10) / 10) : "0";
  pad.trimEndEl.value = pad.trimEnd ? String(Math.round(pad.trimEnd * 10) / 10) : "0";
  if (pad.trimStartValueEl) {
    pad.trimStartValueEl.value = formatSecondsTenths(trimStart(pad));
    pad.trimStartValueEl.textContent = pad.trimStartValueEl.value;
  }
  if (pad.trimEndValueEl) {
    pad.trimEndValueEl.value = formatSecondsTenths(trimDisplayEnd(pad));
    pad.trimEndValueEl.textContent = pad.trimEndValueEl.value;
  }
  updateTrimHandles(pad);
  renderWaveform(pad);
  if (state.audioPad === pad) renderAudioDialogWaveform(pad);
}

function trimStart(pad) {
  if (!pad.duration) return 0;
  return Math.min(Math.max(0, pad.trimStart || 0), Math.max(0, pad.duration - 0.01));
}

function trimEnd(pad) {
  if (!pad.duration) return 0;
  const start = trimStart(pad);
  const end = pad.trimEnd ? pad.trimEnd : pad.duration;
  return Math.min(Math.max(end, start + 0.01), pad.duration);
}

function playableDuration(pad) {
  if (!pad.duration) return 0;
  return Math.max(0.01, trimEnd(pad) - trimStart(pad));
}

function buildWaveformPeaks(buffer, sampleCount = 180) {
  if (!buffer?.length) return [];
  const peaks = new Array(sampleCount).fill(0);
  const channels = Math.min(buffer.numberOfChannels, 2);
  const blockSize = Math.max(1, Math.floor(buffer.length / sampleCount));
  const stride = Math.max(1, Math.floor(blockSize / 80));

  for (let index = 0; index < sampleCount; index += 1) {
    const start = index * blockSize;
    const end = Math.min(buffer.length, start + blockSize);
    let peak = 0;
    for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
      const channel = buffer.getChannelData(channelIndex);
      for (let frame = start; frame < end; frame += stride) {
        peak = Math.max(peak, Math.abs(channel[frame]));
      }
    }
    peaks[index] = peak;
  }

  const maxPeak = Math.max(...peaks, 0.001);
  return peaks.map((peak) => peak / maxPeak);
}

function normalizedGainForBuffer(buffer) {
  let sumSquares = 0;
  let sampleCount = 0;
  let peak = 0;
  const step = Math.max(1, Math.floor(buffer.length / 16000));

  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < data.length; index += step) {
      const value = Math.abs(data[index]);
      peak = Math.max(peak, value);
      sumSquares += value * value;
      sampleCount += 1;
    }
  }

  if (!sampleCount || peak < 0.0001) return 1;
  const rms = Math.sqrt(sumSquares / sampleCount);
  if (rms < 0.0001) return 1;
  const gain = Math.min(NORMALIZE_TARGET_RMS / rms, NORMALIZE_PEAK_LIMIT / peak, NORMALIZE_MAX_GAIN);
  return Math.round(Math.max(NORMALIZE_MIN_GAIN, gain) * 100) / 100;
}

function updateTrimHandles(pad) {
  if (!pad.waveformEl || !pad.duration) return;
  const startRatio = trimStart(pad) / pad.duration;
  const endRatio = trimDisplayEnd(pad) / pad.duration;
  const startPercent = `${startRatio * 100}%`;
  const endPercent = `${endRatio * 100}%`;
  if (pad.trimHandleStart) pad.trimHandleStart.style.left = startPercent;
  if (pad.trimHandleEnd) pad.trimHandleEnd.style.left = endPercent;
  if (pad.trimSelectionEl) {
    pad.trimSelectionEl.style.left = startPercent;
    pad.trimSelectionEl.style.width = `${Math.max(0, endRatio - startRatio) * 100}%`;
  }
}

function renderWaveform(pad) {
  const canvas = pad.waveformCanvas;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const cssWidth = Math.max(1, Math.floor(rect.width || 1));
  const cssHeight = Math.max(1, Math.floor(rect.height || 1));
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.floor(cssWidth * dpr);
  const height = Math.floor(cssHeight * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();

  const peaks = pad.waveformPeaks || [];
  if (!peaks.length) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
    ctx.fillRect(0, height / 2 - 1, width, 2);
    updateTrimHandles(pad);
    return;
  }

  const startX = pad.duration ? (trimStart(pad) / pad.duration) * width : 0;
  const endX = pad.duration ? (trimDisplayEnd(pad) / pad.duration) * width : width;
  const barWidth = Math.max(1, width / peaks.length);

  peaks.forEach((peak, index) => {
    const x = index * barWidth;
    const barHeight = Math.max(2, peak * height * 0.84);
    ctx.fillStyle = x >= startX && x <= endX ? "rgba(73, 211, 160, 0.9)" : "rgba(168, 166, 159, 0.45)";
    ctx.fillRect(x, (height - barHeight) / 2, Math.max(1, barWidth * 0.72), barHeight);
  });

  updateTrimHandles(pad);
}

function trimPositionFromPointer(pad, event) {
  const rect = pad.waveformEl.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  return ratio * pad.duration;
}

function nearestTrimHandle(pad, event) {
  const pointerSeconds = trimPositionFromPointer(pad, event);
  const startDistance = Math.abs(pointerSeconds - trimStart(pad));
  const endDistance = Math.abs(pointerSeconds - trimDisplayEnd(pad));
  return startDistance <= endDistance ? "start" : "end";
}

function setTrimFromPointer(pad, handle, event) {
  if (!pad.duration) return;
  const seconds = trimPositionFromPointer(pad, event);
  if (handle === "start") {
    setPadTrim(pad, seconds, pad.trimEnd);
  } else {
    setPadTrim(pad, pad.trimStart, seconds);
  }
  updatePadTime(pad);
}

function nudgeTrimHandle(pad, handle, direction, largeStep = false) {
  if (!pad.duration) return;
  const step = largeStep ? 1 : 0.1;
  if (handle === "start") {
    setPadTrim(pad, pad.trimStart + (step * direction), pad.trimEnd);
  } else {
    setPadTrim(pad, pad.trimStart, trimDisplayEnd(pad) + (step * direction));
  }
  savePadMeta(pad);
  updatePadTime(pad);
}

function bindWaveformTrim(pad) {
  if (!pad.waveformEl) return;
  pad.waveformEl.addEventListener("pointerdown", (event) => {
    if (!pad.duration) return;
    event.preventDefault();
    const handle = event.target.closest("[data-trim-handle]")?.dataset.trimHandle || nearestTrimHandle(pad, event);
    state.trimDrag = { pad, handle, pointerId: event.pointerId };
    pad.waveformEl.setPointerCapture?.(event.pointerId);
    setTrimFromPointer(pad, handle, event);
  });
  pad.waveformEl.addEventListener("pointermove", (event) => {
    if (state.trimDrag?.pad !== pad || state.trimDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    setTrimFromPointer(pad, state.trimDrag.handle, event);
  });
  const stopDrag = (event) => {
    if (state.trimDrag?.pad !== pad || state.trimDrag.pointerId !== event.pointerId) return;
    state.trimDrag = null;
    pad.waveformEl.releasePointerCapture?.(event.pointerId);
    savePadMeta(pad);
  };
  pad.waveformEl.addEventListener("pointerup", stopDrag);
  pad.waveformEl.addEventListener("pointercancel", stopDrag);

  [pad.trimHandleStart, pad.trimHandleEnd].forEach((handleButton) => {
    handleButton?.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      nudgeTrimHandle(pad, handleButton.dataset.trimHandle, direction, event.shiftKey);
    });
  });
}

function renderAudioDialogWaveform(pad = state.audioPad) {
  if (!pad || !els.audioWaveformCanvas || !els.audioWaveform) return;
  const rect = els.audioWaveform.getBoundingClientRect();
  const cssWidth = Math.max(1, rect.width);
  const cssHeight = Math.max(1, rect.height);
  const dpr = window.devicePixelRatio || 1;
  const width = Math.floor(cssWidth * dpr);
  const height = Math.floor(cssHeight * dpr);
  if (els.audioWaveformCanvas.width !== width || els.audioWaveformCanvas.height !== height) {
    els.audioWaveformCanvas.width = width;
    els.audioWaveformCanvas.height = height;
  }
  const ctx = els.audioWaveformCanvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(0, 0, width, height);
  const peaks = pad.waveformPeaks || [];
  const startX = pad.duration ? (trimStart(pad) / pad.duration) * width : 0;
  const endX = pad.duration ? (trimDisplayEnd(pad) / pad.duration) * width : width;
  const barWidth = peaks.length ? Math.max(1, width / peaks.length) : width;
  if (!peaks.length) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
    ctx.fillRect(0, height / 2 - 1, width, 2);
  } else {
    peaks.forEach((peak, index) => {
      const x = index * barWidth;
      const barHeight = Math.max(2, peak * height * 0.84);
      ctx.fillStyle = x >= startX && x <= endX ? "rgba(73, 211, 160, 0.9)" : "rgba(168, 166, 159, 0.45)";
      ctx.fillRect(x, (height - barHeight) / 2, Math.max(1, barWidth * 0.72), barHeight);
    });
  }
  if (els.audioTrimSelection) {
    const startPct = pad.duration ? (trimStart(pad) / pad.duration) * 100 : 0;
    const endPct = pad.duration ? (trimDisplayEnd(pad) / pad.duration) * 100 : 100;
    els.audioTrimSelection.style.left = `${startPct}%`;
    els.audioTrimSelection.style.width = `${Math.max(0, endPct - startPct)}%`;
  }
  if (els.audioTrimStartHandle) els.audioTrimStartHandle.style.left = `${pad.duration ? (trimStart(pad) / pad.duration) * 100 : 0}%`;
  if (els.audioTrimEndHandle) els.audioTrimEndHandle.style.left = `${pad.duration ? (trimDisplayEnd(pad) / pad.duration) * 100 : 100}%`;
  if (els.audioTrimStartValue) els.audioTrimStartValue.textContent = formatSecondsTenths(trimStart(pad));
  if (els.audioTrimEndValue) els.audioTrimEndValue.textContent = formatSecondsTenths(trimDisplayEnd(pad));
}

function audioTrimPositionFromPointer(event) {
  const pad = state.audioPad;
  if (!pad?.duration || !els.audioWaveform) return 0;
  const rect = els.audioWaveform.getBoundingClientRect();
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
  return ratio * pad.duration;
}

function setAudioTrimFromPointer(handle, event) {
  const pad = state.audioPad;
  if (!pad) return;
  const seconds = audioTrimPositionFromPointer(event);
  if (handle === "start") {
    setPadTrim(pad, seconds, pad.trimEnd);
  } else {
    setPadTrim(pad, pad.trimStart, seconds);
  }
  updatePadTime(pad);
  renderAudioDialogWaveform(pad);
}

function bindAudioDialogTrim() {
  if (!els.audioWaveform) return;
  els.audioWaveform.addEventListener("pointerdown", (event) => {
    const pad = state.audioPad;
    if (!pad?.duration) return;
    event.preventDefault();
    const pointerSeconds = audioTrimPositionFromPointer(event);
    const startDistance = Math.abs(pointerSeconds - trimStart(pad));
    const endDistance = Math.abs(pointerSeconds - trimDisplayEnd(pad));
    const handle = event.target.id === "audioTrimStartHandle" ? "start"
      : event.target.id === "audioTrimEndHandle" ? "end"
        : startDistance <= endDistance ? "start" : "end";
    state.audioTrimDrag = { pointerId: event.pointerId, handle };
    els.audioWaveform.setPointerCapture?.(event.pointerId);
    setAudioTrimFromPointer(handle, event);
  });
  els.audioWaveform.addEventListener("pointermove", (event) => {
    if (!state.audioTrimDrag || state.audioTrimDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    setAudioTrimFromPointer(state.audioTrimDrag.handle, event);
  });
  const stopDrag = (event) => {
    if (!state.audioTrimDrag || state.audioTrimDrag.pointerId !== event.pointerId) return;
    state.audioTrimDrag = null;
    els.audioWaveform.releasePointerCapture?.(event.pointerId);
    if (state.audioPad) savePadMeta(state.audioPad);
  };
  els.audioWaveform.addEventListener("pointerup", stopDrag);
  els.audioWaveform.addEventListener("pointercancel", stopDrag);
}

function syncAudioDialog(pad = state.audioPad) {
  if (!pad) return;
  if (els.audioNormalize) els.audioNormalize.checked = pad.normalizeEnabled;
  if (els.audioNormalizeValue) els.audioNormalizeValue.textContent = `${pad.normalizedGain.toFixed(2)}x`;
  if (els.audioFadeIn) els.audioFadeIn.value = pad.fadeInSeconds === "" ? "" : String(pad.fadeInSeconds);
  if (els.audioFadeOut) els.audioFadeOut.value = pad.fadeOutSeconds === "" ? "" : String(pad.fadeOutSeconds);
  if (els.audioPitchSemitones) els.audioPitchSemitones.value = String(pad.pitchSemitones);
  if (els.audioPitchFine) els.audioPitchFine.value = String(pad.pitchFine);
  if (els.audioPitchTotal) els.audioPitchTotal.textContent = `${(pad.pitchSemitones + pad.pitchFine / 100).toFixed(2)} st`;
  if (els.audioSpeed) els.audioSpeed.value = String(pad.speedRate);
  if (els.audioSpeedValue) els.audioSpeedValue.textContent = `${pad.speedRate.toFixed(2)}x`;
  if (els.audioReverbPreset) els.audioReverbPreset.value = pad.reverbPreset;
  if (els.audioReverbWet) els.audioReverbWet.value = String(pad.reverbWet);
  if (els.audioReverbValue) els.audioReverbValue.textContent = `${Math.round(pad.reverbWet * 100)}%`;
  renderAudioDialogWaveform(pad);
}

function openAudioDialog(pad) {
  state.audioPad = pad;
  syncAudioDialog(pad);
  if (els.audioDialog?.showModal) {
    els.audioDialog.showModal();
    requestAnimationFrame(() => renderAudioDialogWaveform(pad));
  } else {
    setStatus("Réglages audio");
  }
}

function playbackOffset(pad) {
  const duration = playableDuration(pad);
  if (!duration) return 0;
  if (!pad.source || !state.audioContext) {
    return Math.min(duration, Math.max(0, pad.resumeOffset || 0));
  }
  const elapsed = Math.max(0, (state.audioContext.currentTime - pad.startedAt) * pad.speedRate);
  return pad.loop ? elapsed % duration : Math.min(duration, elapsed);
}

function updatePadProgress(pad) {
  if (!pad.progressFillEl) return;
  const duration = playableDuration(pad);
  const ratio = duration ? playbackOffset(pad) / duration : 0;
  pad.progressFillEl.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
}

function seekPadToRatio(pad, ratio) {
  const duration = playableDuration(pad);
  if (!duration) return;
  const offset = Math.min(duration, Math.max(0, ratio * duration));
  pad.resumeOffset = offset;
  updatePadProgress(pad);
  if (pad.source) {
    playPad(pad, false, offset, { skipStartCrossfade: true }).catch(() => setStatus("Navigation audio impossible"));
  } else {
    updatePadTime(pad);
  }
}

function seekRatioFromPointer(pad, event) {
  const rect = pad.progressEl.getBoundingClientRect();
  return rect.width ? (event.clientX - rect.left) / rect.width : 0;
}

function bindPadProgress(pad) {
  if (!pad.progressEl) return;
  const seek = (event) => {
    event.preventDefault();
    event.stopPropagation();
    seekPadToRatio(pad, seekRatioFromPointer(pad, event));
  };
  pad.progressEl.addEventListener("pointerdown", (event) => {
    if (!pad.duration) return;
    pad.progressEl.setPointerCapture?.(event.pointerId);
    state.progressDrag = { pad, pointerId: event.pointerId };
    seek(event);
  });
  pad.progressEl.addEventListener("pointermove", (event) => {
    if (state.progressDrag?.pad !== pad || state.progressDrag.pointerId !== event.pointerId) return;
    seek(event);
  });
  const stopSeek = (event) => {
    if (state.progressDrag?.pad !== pad || state.progressDrag.pointerId !== event.pointerId) return;
    event.preventDefault();
    event.stopPropagation();
    pad.progressEl.releasePointerCapture?.(event.pointerId);
    state.progressDrag = null;
  };
  pad.progressEl.addEventListener("pointerup", stopSeek);
  pad.progressEl.addEventListener("pointercancel", stopSeek);
}

function duckAmount() {
  return Math.min(100, Math.max(0, Number(els.duckPercent?.value) || 0)) / 100;
}

function duckFactorForPad(pad) {
  const hasOtherDuckTrigger = state.pads.some((other) => other !== pad && other.source && other.duckTrigger);
  return hasOtherDuckTrigger ? 1 - duckAmount() : 1;
}

function targetPadGain(pad) {
  return pad.volume * (pad.normalizeEnabled ? pad.normalizedGain : 1) * duckFactorForPad(pad);
}

function fadeDurationForPad(pad, type = "out") {
  const padValue = type === "in" ? pad.fadeInSeconds : pad.fadeOutSeconds;
  if (padValue !== "" && Number.isFinite(Number(padValue))) {
    return Math.max(0, Number(padValue));
  }
  if (pad.fadeSeconds !== "" && Number.isFinite(Number(pad.fadeSeconds))) {
    return Math.max(0, Number(pad.fadeSeconds));
  }
  return Math.max(0, Number(els.fadeSeconds.value) || 0);
}

function applyDucking(exceptPad = null) {
  if (!state.audioContext) return;
  const now = state.audioContext.currentTime;
  state.pads.forEach((pad) => {
    if (pad === exceptPad) return;
    if (!pad.source || !pad.gain) return;
    pad.gain.gain.cancelScheduledValues(now);
    pad.gain.gain.setTargetAtTime(targetPadGain(pad), now, 0.035);
  });
  updateAllPadAlerts();
}

function padsWithTag(tag, exceptPad = null) {
  const normalizedTag = String(tag || "").trim().toLowerCase();
  if (!normalizedTag) return [];
  return state.pads.filter((pad) => pad !== exceptPad && padTagList(pad).includes(normalizedTag));
}

function padFromTarget(target, exceptPad = null) {
  const value = String(target || "").trim();
  if (!value) return null;
  const number = Number(value.replace(/^pad\s*/i, ""));
  if (Number.isInteger(number) && number >= 1 && number <= state.pads.length) {
    const pad = state.pads[number - 1];
    return pad === exceptPad ? null : pad;
  }
  return state.pads.find((pad) => pad !== exceptPad && pad.title.toLowerCase() === value.toLowerCase()) || null;
}

function padsFromCrossfadeTarget(target, exceptPad = null) {
  const value = String(target || "").trim();
  if (!value) return [];
  if (value.startsWith("pad:")) {
    const index = Number(value.slice(4));
    const targetPad = Number.isInteger(index) ? state.pads[index] : null;
    return targetPad && targetPad !== exceptPad ? [targetPad] : [];
  }
  if (value.startsWith("tag:")) {
    if (value === "tag:*") return state.pads.filter((pad) => pad !== exceptPad);
    return padsWithTag(value.slice(4), exceptPad);
  }
  const targetPad = padFromTarget(value, exceptPad);
  if (targetPad) return [targetPad];
  return padsWithTag(value, exceptPad);
}

function executeCrossfadeAction(action, target, sourcePad) {
  if (action === "none") return;
  const targets = padsFromCrossfadeTarget(target, sourcePad);
  targets.forEach((targetPad) => {
    if (action === "play" && targetPad.buffer) {
      playPad(targetPad, true, 0, { skipStartCrossfade: true }).catch(() => setStatus("Crossfade impossible"));
    }
    if (action === "stop" && targetPad.source) {
      stopPad(targetPad, true, false, { triggerEnd: false });
    }
  });
}

function executeStartCrossfade(pad) {
  executeCrossfadeAction(pad.startStopMode, pad.startStopTag, pad);
}

function executeEndCrossfade(pad) {
  executeCrossfadeAction(pad.endStartMode, pad.endStartTarget, pad);
}

function reverbImpulse(preset) {
  if (!state.audioContext || preset === "none") return null;
  if (state.reverbBuffers[preset]) return state.reverbBuffers[preset];
  const config = REVERB_PRESETS[preset] || REVERB_PRESETS.room;
  const length = Math.max(1, Math.floor(state.audioContext.sampleRate * config.duration));
  const buffer = state.audioContext.createBuffer(2, length, state.audioContext.sampleRate);
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const decay = (1 - index / length) ** config.decay;
      data[index] = (Math.random() * 2 - 1) * decay;
    }
  }
  state.reverbBuffers[preset] = buffer;
  return buffer;
}

function connectPadOutput(pad, pan, analyser) {
  if (!state.audioContext || pad.reverbPreset === "none" || pad.reverbWet <= 0) {
    pan.connect(analyser).connect(state.masterGain);
    return;
  }
  const dry = state.audioContext.createGain();
  const wet = state.audioContext.createGain();
  const convolver = state.audioContext.createConvolver();
  convolver.buffer = reverbImpulse(pad.reverbPreset);
  dry.gain.value = 1 - pad.reverbWet;
  wet.gain.value = pad.reverbWet;
  pan.connect(dry).connect(analyser);
  pan.connect(convolver).connect(wet).connect(analyser);
  analyser.connect(state.masterGain);
  pad.reverbNodes = { dry, wet, convolver };
}

function clearPlayingPad(pad, source, triggerEnd = false) {
  if (source && pad.source !== source) return;
  pad.source = null;
  pad.gain = null;
  pad.pan = null;
  pad.analyser = null;
  pad.meterData = null;
  pad.reverbNodes = null;
  pad.stopAt = 0;
  pad.node.classList.remove("is-playing");
  setMeterLevel(pad.vuEl, 0);
  updatePadTime(pad);
  applyDucking();
  updateAllPadAlerts();
  if (triggerEnd) executeEndCrossfade(pad);
}

async function playPad(pad, fade = false, offset = 0, options = {}) {
  if (!pad.buffer) {
    pad.fileInput.click();
    return;
  }

  await ensureAudio();
  if (!options.skipStartCrossfade) executeStartCrossfade(pad);
  stopPad(pad, false, false, { triggerEnd: false });
  const segmentStart = trimStart(pad);
  const segmentEnd = trimEnd(pad);
  const segmentDuration = playableDuration(pad);
  const segmentOffset = segmentDuration ? Math.min(Math.max(0, offset), Math.max(0, segmentDuration - 0.01)) : 0;
  const startOffset = segmentStart + segmentOffset;

  const ctx = state.audioContext;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();
  const analyser = ctx.createAnalyser();
  const now = ctx.currentTime;
  const fadeTime = fadeDurationForPad(pad, "in");

  analyser.fftSize = 256;
  source.buffer = pad.buffer;
  source.loop = pad.loop;
  source.loopStart = segmentStart;
  source.loopEnd = segmentEnd;
  source.playbackRate.setValueAtTime(pad.speedRate, now);
  if (source.detune) source.detune.setValueAtTime((pad.pitchSemitones + pad.pitchFine / 100) * 100, now);
  gain.gain.setValueAtTime(fade ? 0 : targetPadGain(pad), now);
  pan.pan.setValueAtTime(pad.panValue, now);
  source.connect(gain).connect(pan);
  connectPadOutput(pad, pan, analyser);

  if (fade && fadeTime > 0) {
    gain.gain.linearRampToValueAtTime(targetPadGain(pad), now + fadeTime);
  }

  pad.source = source;
  pad.gain = gain;
  pad.pan = pan;
  pad.analyser = analyser;
  pad.meterData = new Uint8Array(analyser.fftSize);
  pad.startedAt = now - (segmentOffset / pad.speedRate);
  pad.stopAt = 0;
  pad.node.classList.add("is-playing");
  updatePadTime(pad);
  startTimer();
  setStatus(`${pad.title} joue`);

  source.onended = () => {
    if (pad.source === source) {
      pad.resumeOffset = 0;
      clearPlayingPad(pad, source, !pad.loop);
    }
  };

  source.start(now, startOffset);
  if (!pad.loop) {
    source.stop(now + Math.max(0.01, (segmentEnd - startOffset) / pad.speedRate));
  }
  applyDucking(pad);
  updateAllPadAlerts();
}

function stopPad(pad, fade = false, preservePosition = false, options = {}) {
  if (!pad.source || !state.audioContext) return;

  const source = pad.source;
  const gain = pad.gain;
  const now = state.audioContext.currentTime;
  const fadeTime = fadeDurationForPad(pad, "out");
  if (preservePosition && pad.duration) {
  const elapsed = Math.max(0, (now - pad.startedAt) * pad.speedRate);
    const duration = playableDuration(pad);
    pad.resumeOffset = pad.loop ? elapsed % duration : Math.min(elapsed, duration);
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

  clearPlayingPad(pad, source, options.triggerEnd ?? true);
  setStatus(`${pad.title} stop`);
}

function remainingSeconds(pad) {
  if (!pad.source || !state.audioContext || !pad.duration) return playableDuration(pad);
  const elapsed = Math.max(0, (state.audioContext.currentTime - pad.startedAt) * pad.speedRate);
  if (pad.loop) {
    const loopElapsed = elapsed % playableDuration(pad);
    return Math.max(0, playableDuration(pad) - loopElapsed);
  }
  return Math.max(0, playableDuration(pad) - elapsed);
}

function updatePadTime(pad) {
  if (!pad.duration) {
    pad.timeEl.textContent = "--:--";
    updatePadProgress(pad);
    updatePadAlerts(pad);
    return;
  }
  const seconds = remainingSeconds(pad);
  pad.timeEl.textContent = pad.source ? `-${formatTime(seconds)}` : formatTime(playableDuration(pad));
  updatePadProgress(pad);
  updatePadAlerts(pad);
}

function meterLevel(analyser, data) {
  if (!analyser || !data) return 0;
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let index = 0; index < data.length; index += 1) {
    const centered = (data[index] - 128) / 128;
    sum += centered * centered;
  }
  return Math.min(1, Math.sqrt(sum / data.length) * 3.2);
}

function setMeterLevel(element, level) {
  if (!element) return;
  const scale = Math.max(0, Math.min(1, level));
  element.style.transform = element.parentElement?.classList.contains("master-vu") ? `scaleY(${scale})` : `scaleX(${scale})`;
}

function updateMeters() {
  const hasPlayingPad = state.pads.some((pad) => pad.source);
  setMeterLevel(els.masterVu, hasPlayingPad ? meterLevel(state.masterAnalyser, state.masterMeterData) : 0);
  state.pads.forEach((pad) => {
    setMeterLevel(pad.vuEl, meterLevel(pad.analyser, pad.meterData));
  });
}

function startTimer() {
  if (state.timerFrame) return;
  const tick = () => {
    state.pads.forEach(updatePadTime);
    updateMeters();
    state.timerFrame = state.pads.some((pad) => pad.source)
      ? requestAnimationFrame(tick)
      : null;
    if (!state.timerFrame) updateMeters();
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
  state.pads.forEach((pad) => stopPad(pad, true, false, { triggerEnd: false }));
  setStatus("Tout est stoppé");
}

function stopGroup() {
  const tag = els.stopGroupSelect?.value;
  if (!tag) {
    setStatus("Choisir un groupe");
    return;
  }
  const pads = state.pads.filter((pad) => pad.source && padTagList(pad).includes(tag));
  pads.forEach((pad) => stopPad(pad, true, false, { triggerEnd: false }));
  setStatus(pads.length ? `Groupe ${tag} stoppe` : `Aucun pad joue: ${tag}`);
}

function bindKeyboard() {
  window.addEventListener("keydown", (event) => {
    if (!state.shortcutsEnabled) return;
    if (event.repeat) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement) return;

    const key = event.key.toUpperCase();
    const index = padIndexForShortcutKey(key);
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
    if (!state.shortcutsEnabled) return;
    const key = event.key.toUpperCase();
    const index = padIndexForShortcutKey(key);
    if (index >= 0 && state.pads[index] && state.heldKeys.has(key)) {
      event.preventDefault();
      state.heldKeys.delete(key);
      stopPad(state.pads[index], false);
    }
  });
}

async function init() {
  state.db = await openDb();
  applySkin(localStorage.getItem(SKIN_STORAGE) || "classic");
  if (els.duckPercent) {
    els.duckPercent.value = localStorage.getItem(DUCKING_STORAGE) || els.duckPercent.value;
  }
  state.boards = loadBoards();
  state.currentBoardId = localStorage.getItem(CURRENT_BOARD_STORAGE) || DEFAULT_BOARD_ID;
  if (!state.boards.some((board) => board.id === state.currentBoardId)) {
    state.currentBoardId = state.boards[0].id;
  }
  renderBoardOptions();
  await renderPads();
  await repairAccidentalPadTitles();
  setStageMode(localStorage.getItem(STAGE_MODE_STORAGE) === "on", false);

  els.masterVolume.addEventListener("input", async () => {
    await ensureAudio();
    setMasterVolume(els.masterVolume.value);
  });
  els.skinSelect?.addEventListener("change", () => applySkin(els.skinSelect.value));
  els.boardTagFilter?.addEventListener("change", () => applyBoardTagFilter());
  els.padLayoutMode?.addEventListener("change", updateBoardLayout);
  els.padColumns?.addEventListener("input", updateBoardLayout);
  els.padColumns?.addEventListener("change", updateBoardLayout);
  els.padRows?.addEventListener("input", updateBoardLayout);
  els.padRows?.addEventListener("change", updateBoardLayout);
  window.matchMedia("(max-width: 950px), (pointer: coarse)").addEventListener?.("change", () => {
    applySkin(localStorage.getItem(SKIN_STORAGE) || "classic");
  });
  window.addEventListener("resize", () => {
    state.pads.forEach(renderWaveform);
  });
  els.duckPercent?.addEventListener("input", () => {
    const value = Math.round(duckAmount() * 100);
    localStorage.setItem(DUCKING_STORAGE, String(value));
    applyDucking();
  });
  els.duckPercent?.addEventListener("change", () => {
    const value = Math.round(duckAmount() * 100);
    els.duckPercent.value = value;
    localStorage.setItem(DUCKING_STORAGE, String(value));
    applyDucking();
  });
  els.stopAll.addEventListener("click", stopAll);
  els.stopGroup?.addEventListener("click", stopGroup);
  els.stageMode?.addEventListener("click", () => {
    setStageMode(!state.stageMode, true);
  });
  els.editPads?.addEventListener("click", () => {
    setBoardPadEditing(!state.boardEditMode);
  });
  els.saveVersion?.addEventListener("click", () => {
    saveBoardVersion().catch(() => setStatus("Sauvegarde impossible"));
  });
  els.restoreVersion?.addEventListener("click", () => {
    restoreSelectedBoardVersion().catch(() => setStatus("Restauration impossible"));
  });
  els.deleteBoard?.addEventListener("click", deleteCurrentBoard);
  els.boardSelect?.addEventListener("change", () => switchBoard(els.boardSelect.value));
  els.boardName?.addEventListener("input", () => renameCurrentBoard(els.boardName.value));
  els.boardName?.addEventListener("blur", () => {
    if (!state.boardEditMode) setBoardEditing(false);
  });
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
  els.addBoard?.addEventListener("click", addBoard);
  els.addPad?.addEventListener("click", addPad);
  els.exportBoard?.addEventListener("click", () => {
    exportCurrentBoard(true).catch(() => setStatus("Export impossible"));
  });
  els.exportBoardLite?.addEventListener("click", () => {
    exportCurrentBoard(false).catch(() => setStatus("Export sans audio impossible"));
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
  els.closeAudio?.addEventListener("click", () => els.audioDialog?.close());
  els.audioDialog?.addEventListener("click", (event) => {
    if (event.target === els.audioDialog) els.audioDialog.close();
  });
  bindAudioDialogTrim();
  els.audioNormalize?.addEventListener("change", () => {
    if (!state.audioPad) return;
    setPadNormalization(state.audioPad, els.audioNormalize.checked, state.audioPad.normalizedGain);
    syncAudioDialog(state.audioPad);
    savePadMeta(state.audioPad);
  });
  [els.audioFadeIn, els.audioFadeOut, els.audioPitchSemitones, els.audioPitchFine, els.audioSpeed, els.audioReverbPreset, els.audioReverbWet].forEach((element) => {
    element?.addEventListener("input", () => {
      if (!state.audioPad) return;
      setPadAudioSettings(state.audioPad, {
        fadeInSeconds: els.audioFadeIn?.value,
        fadeOutSeconds: els.audioFadeOut?.value,
        pitchSemitones: els.audioPitchSemitones?.value,
        pitchFine: els.audioPitchFine?.value,
        speedRate: els.audioSpeed?.value,
        reverbPreset: els.audioReverbPreset?.value,
        reverbWet: els.audioReverbWet?.value,
      });
      syncAudioDialog(state.audioPad);
      savePadMeta(state.audioPad);
    });
  });
  els.shortcutEnabled?.addEventListener("change", () => {
    state.shortcutsEnabled = els.shortcutEnabled.checked;
    saveShortcutsEnabledForCurrentBoard();
    updateShortcutIndicators();
  });
  els.keyboardShortcuts?.addEventListener("click", () => {
    renderShortcutRows();
    if (els.shortcutDialog?.showModal) {
      els.shortcutDialog.showModal();
    } else {
      setStatus("Raccourcis clavier");
    }
  });
  els.closeShortcuts?.addEventListener("click", () => els.shortcutDialog?.close());
  els.shortcutDialog?.addEventListener("click", (event) => {
    if (event.target === els.shortcutDialog) els.shortcutDialog.close();
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
