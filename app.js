const DEFAULT_PAD_COUNT = 12;
const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const DB_NAME = "soundboard-live";
const STORE = "sounds";
const PRESS_MS = 180;
const PAD_NAME_REPAIR = "pad-title-repair-v1";
const BOARDS_STORAGE = "soundboard-live-boards";
const CURRENT_BOARD_STORAGE = "soundboard-live-current-board";
const DUCKING_STORAGE = "soundboard-live-ducking-percent";
const MASTER_DUCK_ENABLED_STORAGE = "soundboard-live-ducking-enabled";
const FADE_IN_STORAGE = "soundboard-live-fade-in-seconds";
const MASTER_FADE_IN_ENABLED_STORAGE = "soundboard-live-fade-in-enabled";
const MASTER_FADE_OUT_ENABLED_STORAGE = "soundboard-live-fade-out-enabled";
const FADE_OUT_STORAGE = "soundboard-live-fade-out-seconds";
const MASTER_REVERB_STORAGE = "soundboard-live-master-reverb";
const STOP_GROUP_STORAGE = "soundboard-live-stop-group";
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
  masterBypassGain: null,
  masterDry: null,
  masterWet: null,
  masterConvolver: null,
  masterAnalyser: null,
  masterMeterData: null,
  crossfadeDucks: new Map(),
  crossfadeDuckTimers: new Map(),
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
  shortcutDraft: null,
  shortcutsEnabled: true,
  audioPad: null,
  audioDraft: null,
  masterAudioDraft: null,
  audioTrimDrag: null,
  reverbBuffers: {},
  imagePad: null,
  imageDraft: null,
  bulkEditPads: [],
  sketchDrawing: false,
  stageMode: false,
  boardEditMode: false,
  boardEditSnapshot: null,
};

const els = {
  pads: document.querySelector("#pads"),
  template: document.querySelector("#padTemplate"),
  status: document.querySelector("#audioStatus"),
  skinSelect: document.querySelector("#skinSelect"),
  masterVolume: document.querySelector("#masterVolume"),
  masterVolumeValue: document.querySelector("#masterVolumeValue"),
  masterVu: document.querySelector("#masterVu"),
  masterAudio: document.querySelector("#masterAudio"),
  masterAudioDialog: document.querySelector("#masterAudioDialog"),
  closeMasterAudio: document.querySelector("#closeMasterAudio"),
  applyMasterAudio: document.querySelector("#applyMasterAudio"),
  cancelMasterAudio: document.querySelector("#cancelMasterAudio"),
  masterOptionBadges: document.querySelector("#masterOptionBadges"),
  masterReverbPreset: document.querySelector("#masterReverbPreset"),
  masterReverbWet: document.querySelector("#masterReverbWet"),
  masterReverbValue: document.querySelector("#masterReverbValue"),
  masterFadeInEnabled: document.querySelector("#masterFadeInEnabled"),
  masterFadeOutEnabled: document.querySelector("#masterFadeOutEnabled"),
  masterDuckEnabled: document.querySelector("#masterDuckEnabled"),
  masterAudioReset: document.querySelector("#masterAudioReset"),
  fadeInSeconds: document.querySelector("#fadeInSeconds"),
  fadeSeconds: document.querySelector("#fadeSeconds"),
  stopAll: document.querySelector("#stopAll"),
  stopGroup: document.querySelector("#stopGroup"),
  stopGroupSelect: document.querySelector("#stopGroupSelect"),
  stageMode: document.querySelector("#stageMode"),
  boardTagFilter: document.querySelector("#boardTagFilter"),
  boardTagFilterLabel: document.querySelector("#boardTagFilterLabel"),
  keyboardShortcuts: document.querySelector("#keyboardShortcuts"),
  showCables: document.querySelector("#showCables"),
  cableOverlay: document.querySelector("#cableOverlay"),
  cableLegend: document.querySelector("#cableLegend"),
  shortcutDialog: document.querySelector("#shortcutDialog"),
  closeShortcuts: document.querySelector("#closeShortcuts"),
  applyShortcuts: document.querySelector("#applyShortcuts"),
  cancelShortcuts: document.querySelector("#cancelShortcuts"),
  shortcutEnabled: document.querySelector("#shortcutEnabled"),
  shortcutRows: document.querySelector("#shortcutRows"),
  audioDialog: document.querySelector("#audioDialog"),
  closeAudio: document.querySelector("#closeAudio"),
  applyAudio: document.querySelector("#applyAudio"),
  cancelAudio: document.querySelector("#cancelAudio"),
  audioPadName: document.querySelector("#audioPadName"),
  audioFilePath: document.querySelector("#audioFilePath"),
  audioTestPlay: document.querySelector("#audioTestPlay"),
  audioTestStop: document.querySelector("#audioTestStop"),
  audioRecord: document.querySelector("#audioRecord"),
  audioImport: document.querySelector("#audioImport"),
  audioReset: document.querySelector("#audioReset"),
  audioOptionBadges: document.querySelector("#audioOptionBadges"),
  audioWaveform: document.querySelector("#audioWaveform"),
  audioWaveformCanvas: document.querySelector("#audioWaveformCanvas"),
  audioTrimSelection: document.querySelector("#audioTrimSelection"),
  audioPlayhead: document.querySelector("#audioPlayhead"),
  audioTrimStartHandle: document.querySelector("#audioTrimStartHandle"),
  audioTrimEndHandle: document.querySelector("#audioTrimEndHandle"),
  audioTrimStartValue: document.querySelector("#audioTrimStartValue"),
  audioTrimEndValue: document.querySelector("#audioTrimEndValue"),
  audioNormalize: document.querySelector("#audioNormalize"),
  audioNormalizeValue: document.querySelector("#audioNormalizeValue"),
  audioMono: document.querySelector("#audioMono"),
  audioLoop: document.querySelector("#audioLoop"),
  audioDuck: document.querySelector("#audioDuck"),
  audioFadeNone: document.querySelector("#audioFadeNone"),
  audioFadeGlobal: document.querySelector("#audioFadeGlobal"),
  audioFadePad: document.querySelector("#audioFadePad"),
  audioPadFadeFields: document.querySelector("#audioPadFadeFields"),
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
  audioReverbNone: document.querySelector("#audioReverbNone"),
  audioReverbGlobal: document.querySelector("#audioReverbGlobal"),
  audioReverbPad: document.querySelector("#audioReverbPad"),
  audioPadReverbFields: document.querySelector("#audioPadReverbFields"),
  audioStartStopMode: document.querySelector("#audioStartStopMode"),
  audioStartStopTarget: document.querySelector("#audioStartStopTarget"),
  audioEndStartMode: document.querySelector("#audioEndStartMode"),
  audioEndStartTarget: document.querySelector("#audioEndStartTarget"),
  imageDialog: document.querySelector("#imageDialog"),
  closeImage: document.querySelector("#closeImage"),
  applyImage: document.querySelector("#applyImage"),
  cancelImage: document.querySelector("#cancelImage"),
  imageColorToggle: document.querySelector("#imageColorToggle"),
  imageColorFrame: document.querySelector("#imageColorFrame"),
  imageColorButtons: [...document.querySelectorAll("[data-image-color]")],
  imageLibrary: document.querySelector("#imageLibrary"),
  imageCamera: document.querySelector("#imageCamera"),
  imageOnline: document.querySelector("#imageOnline"),
  imageSketch: document.querySelector("#imageSketch"),
  imageRemove: document.querySelector("#imageRemove"),
  imagePreview: document.querySelector("#imagePreview"),
  imageSketchCanvas: document.querySelector("#imageSketchCanvas"),
  imagePosX: document.querySelector("#imagePosX"),
  imagePosY: document.querySelector("#imagePosY"),
  imageZoom: document.querySelector("#imageZoom"),
  duckPercent: document.querySelector("#duckPercent"),
  helpButton: document.querySelector("#helpButton"),
  helpDialog: document.querySelector("#helpDialog"),
  closeHelp: document.querySelector("#closeHelp"),
  boardSelect: document.querySelector("#boardSelect"),
  boardName: document.querySelector("#boardName"),
  editPads: document.querySelector("#editPads"),
  cancelBoardEdit: document.querySelector("#cancelBoardEdit"),
  patchBay: document.querySelector("#patchBay"),
  patchBayDialog: document.querySelector("#patchBayDialog"),
  patchBayCanvas: document.querySelector("#patchBayCanvas"),
  patchBaySources: document.querySelector("#patchBaySources"),
  patchBayTargets: document.querySelector("#patchBayTargets"),
  patchBayOverlay: document.querySelector("#patchBayOverlay"),
  patchBayEmpty: document.querySelector("#patchBayEmpty"),
  closePatchBay: document.querySelector("#closePatchBay"),
  cancelEditDialog: document.querySelector("#cancelEditDialog"),
  keepBoardEdit: document.querySelector("#keepBoardEdit"),
  confirmCancelBoardEdit: document.querySelector("#confirmCancelBoardEdit"),
  bulkEditPads: document.querySelector("#bulkEditPads"),
  bulkEditDialog: document.querySelector("#bulkEditDialog"),
  closeBulkEdit: document.querySelector("#closeBulkEdit"),
  cancelBulkEdit: document.querySelector("#cancelBulkEdit"),
  applyBulkEdit: document.querySelector("#applyBulkEdit"),
  bulkEditCount: document.querySelector("#bulkEditCount"),
  bulkTemplatePad: document.querySelector("#bulkTemplatePad"),
  bulkApplyVolume: document.querySelector("#bulkApplyVolume"),
  bulkVolume: document.querySelector("#bulkVolume"),
  bulkApplyPan: document.querySelector("#bulkApplyPan"),
  bulkPan: document.querySelector("#bulkPan"),
  bulkApplyTags: document.querySelector("#bulkApplyTags"),
  bulkTags: document.querySelector("#bulkTags"),
  bulkApplyColor: document.querySelector("#bulkApplyColor"),
  bulkColor: document.querySelector("#bulkColor"),
  bulkColorButtons: [...document.querySelectorAll("[data-bulk-color]")],
  bulkApplyLiveFade: document.querySelector("#bulkApplyLiveFade"),
  bulkFadeInEnabled: document.querySelector("#bulkFadeInEnabled"),
  bulkFadeOutEnabled: document.querySelector("#bulkFadeOutEnabled"),
  bulkApplyAudioFlags: document.querySelector("#bulkApplyAudioFlags"),
  bulkLoop: document.querySelector("#bulkLoop"),
  bulkDuck: document.querySelector("#bulkDuck"),
  bulkApplyReverb: document.querySelector("#bulkApplyReverb"),
  bulkReverbNone: document.querySelector("#bulkReverbNone"),
  bulkReverbGlobal: document.querySelector("#bulkReverbGlobal"),
  bulkReverbPad: document.querySelector("#bulkReverbPad"),
  bulkReverbPreset: document.querySelector("#bulkReverbPreset"),
  bulkReverbWet: document.querySelector("#bulkReverbWet"),
  bulkApplyCrossfade: document.querySelector("#bulkApplyCrossfade"),
  bulkStartStopMode: document.querySelector("#bulkStartStopMode"),
  bulkStartStopTarget: document.querySelector("#bulkStartStopTarget"),
  bulkEndStartMode: document.querySelector("#bulkEndStartMode"),
  bulkEndStartTarget: document.querySelector("#bulkEndStartTarget"),
  saveVersion: document.querySelector("#saveVersion"),
  restoreVersion: document.querySelector("#restoreVersion"),
  versionSelect: document.querySelector("#versionSelect"),
  deleteBoard: document.querySelector("#deleteBoard"),
  addBoard: document.querySelector("#addBoard"),
  duplicateBoard: document.querySelector("#duplicateBoard"),
  boardNotice: document.querySelector("#boardNotice"),
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

function audioFileType(pad) {
  const extension = String(pad.audioName || pad.audioPath || "").split(".").pop()?.toLowerCase();
  if (extension && extension.length <= 5 && extension !== pad.audioName) return extension;
  const type = String(pad.audioType || "").toLowerCase();
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (type.includes("mp4") || type.includes("aac")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("flac")) return "flac";
  return "audio";
}

function formatSampleRate(sampleRate = 0) {
  if (!sampleRate) return "-- kHz";
  const khz = sampleRate / 1000;
  return `${Number.isInteger(khz) ? khz : khz.toFixed(1)} kHz`;
}

function audioCharacteristics(pad) {
  if (!pad?.buffer) return "Aucun fichier";
  const channels = pad.buffer.numberOfChannels === 1 ? "mono" : "stéréo";
  return `${audioFileType(pad)} · ${channels} · ${formatTime(pad.buffer.duration)} · ${formatSampleRate(pad.buffer.sampleRate)}`;
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
  const columns = normalizeLayoutNumber(board?.padColumns, 4);
  return {
    mode,
    columns,
    rows: Math.max(1, Math.ceil((Number(board?.padCount) || DEFAULT_PAD_COUNT) / columns)),
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

function setPadTitle(pad, title, options = {}) {
  const { syncInput = true, trimTitle = true } = options;
  const rawTitle = String(title ?? "");
  const displayTitle = trimTitle ? rawTitle.trim() : rawTitle;
  pad.title = rawTitle.trim() ? displayTitle : `Pad ${pad.index + 1}`;
  pad.titleEl.textContent = pad.title;
  if (syncInput) pad.nameEl.value = pad.title;
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

function shortcutDraftFromState() {
  return {
    shortcuts: state.shortcuts.map((item) => ({ ...item })),
    enabled: state.shortcutsEnabled,
  };
}

function restoreShortcutDraft() {
  if (!state.shortcutDraft) return;
  state.shortcuts = state.shortcutDraft.shortcuts.map((item) => ({ ...item }));
  state.shortcutsEnabled = state.shortcutDraft.enabled;
  if (els.shortcutEnabled) els.shortcutEnabled.checked = state.shortcutsEnabled;
  updateShortcutIndicators();
  renderShortcutRows();
}

function saveShortcutDraft() {
  saveShortcutsForCurrentBoard();
  saveShortcutsEnabledForCurrentBoard();
  state.shortcutDraft = null;
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
  if (!state.boardEditMode) state.boardEditSnapshot = null;
  document.body.classList.toggle("board-edit-mode", state.boardEditMode);
  els.editPads?.classList.toggle("is-active", state.boardEditMode);
  els.editPads?.setAttribute("aria-pressed", String(state.boardEditMode));
  els.editPads?.setAttribute("aria-label", state.boardEditMode ? "Revenir au mode live" : "Mode edit des pads");
  if (!state.boardEditMode) setCableOverlayVisible(false);
  setBoardEditing(state.boardEditMode, false);
  state.pads.forEach((pad) => setPadEditing(pad, state.boardEditMode));
  refreshBoardTagFilterOptions();
  setStatus(state.boardEditMode ? "Mode edit" : "Mode live");
}

async function beginBoardEdit() {
  if (state.stageMode) return;
  state.boardEditSnapshot = await createBoardSnapshot(currentBoard());
  setBoardPadEditing(true);
}

async function cancelBoardEdit() {
  const snapshot = state.boardEditSnapshot;
  if (!snapshot) {
    setBoardPadEditing(false);
    return;
  }
  await applyBoardSnapshot(snapshot);
  state.boardEditSnapshot = null;
  setStatus("Modifications annulées");
}

function openCancelBoardEditDialog() {
  if (els.cancelEditDialog?.showModal) {
    els.cancelEditDialog.showModal();
    return;
  }
  cancelBoardEdit().catch(() => setStatus("Annulation impossible"));
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
    state.masterBypassGain = state.audioContext.createGain();
    state.masterDry = state.audioContext.createGain();
    state.masterWet = state.audioContext.createGain();
    state.masterConvolver = state.audioContext.createConvolver();
    state.masterAnalyser = state.audioContext.createAnalyser();
    state.masterAnalyser.fftSize = 256;
    state.masterMeterData = new Uint8Array(state.masterAnalyser.fftSize);
    state.masterGain.gain.value = clamp01(els.masterVolume.value);
    state.masterBypassGain.gain.value = clamp01(els.masterVolume.value);
    state.masterGain.connect(state.masterDry).connect(state.masterAnalyser);
    state.masterGain.connect(state.masterConvolver).connect(state.masterWet).connect(state.masterAnalyser);
    state.masterBypassGain.connect(state.masterAnalyser);
    state.masterAnalyser.connect(state.audioContext.destination);
    applyMasterReverb();
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
  node.dataset.padIndex = String(index);
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
    audioName: "",
    audioPath: "",
    audioPathTrusted: false,
    startedAt: 0,
    stopAt: 0,
    duration: 0,
    playMode: "oneshot",
    resumeOffset: 0,
    keepResumeOffsetOnEnd: false,
    audioRefIndex: null,
    holdPointerId: null,
    volume: 0.85,
    panValue: 0,
    loop: false,
    duckTrigger: false,
    tags: "",
    color: "",
    fadeSeconds: "",
    fadeMode: "global",
    fadeInSeconds: "",
    fadeOutSeconds: "",
    fadeInEnabled: false,
    fadeOutEnabled: false,
    pitchSemitones: 0,
    pitchFine: 0,
    speedRate: 1,
    reverbPreset: "none",
    reverbWet: 0.5,
    reverbMode: "global",
    mono: false,
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
    visualKind: "",
    visualPositionX: 50,
    visualPositionY: 50,
    visualZoom: 1,
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
  pad.crossfadeFlashEl = node.querySelector("[data-crossfade-flash]");
  pad.progressEl = node.querySelector("[data-progress]");
  pad.progressFillEl = node.querySelector("[data-progress-fill]");
  pad.vuEl = node.querySelector("[data-pad-vu]");
  pad.fileInput = node.querySelector("[data-file]");
  pad.recordButton = node.querySelector('[data-action="record"]');
  pad.modeButtons = [...node.querySelectorAll("[data-mode]")];
  pad.fadeInToggleEl = node.querySelector("[data-fade-in-toggle]");
  pad.fadeOutToggleEl = node.querySelector("[data-fade-out-toggle]");
  pad.volumeEl = node.querySelector("[data-volume]");
  pad.volumeValueEl = node.querySelector("[data-volume-value]");
  pad.panEl = node.querySelector("[data-pan]");
  pad.panValueEl = node.querySelector("[data-pan-value]");
  pad.loopEl = node.querySelector('[data-action="loop"]');
  pad.duckEl = node.querySelector('[data-action="duck"]');
  pad.dragHandle = node.querySelector('[data-action="drag"]');
  pad.duplicateButton = node.querySelector('[data-action="duplicate-pad"]');
  pad.colorButtons = [...node.querySelectorAll("[data-color]")];
  pad.normalizeEl = node.querySelector("[data-normalize]");
  pad.normalizeValueEl = node.querySelector("[data-normalize-value]");
  pad.visualPreviewEl = node.querySelector("[data-visual-preview]");
  pad.visualToggleEl = node.querySelector('[data-action="visual-toggle"]');
  pad.imageInput = node.querySelector("[data-image-file]");
  pad.cameraInput = node.querySelector("[data-camera-file]");
  pad.startStopModeEl = node.querySelector("[data-start-stop-mode]");
  pad.startStopTagEl = node.querySelector("[data-start-stop-tag]");
  pad.endStartModeEl = node.querySelector("[data-end-start-mode]");
  pad.endStartTargetEl = node.querySelector("[data-end-start-target]");

  setPadTitle(pad, pad.title);
  setPadTags(pad, pad.tags);
  setPadFade(pad, pad.fadeSeconds);
  setPadLiveFade(pad, pad.fadeInEnabled, pad.fadeOutEnabled);
  setPadColor(pad, pad.color);
  setPadNormalization(pad, pad.normalizeEnabled, pad.normalizedGain);
  setPadAudioSettings(pad, {
    fadeMode: pad.fadeMode,
    fadeInSeconds: pad.fadeInSeconds,
    fadeOutSeconds: pad.fadeOutSeconds,
    pitchSemitones: pad.pitchSemitones,
    pitchFine: pad.pitchFine,
    speedRate: pad.speedRate,
    reverbPreset: pad.reverbPreset,
    reverbWet: pad.reverbWet,
    reverbMode: pad.reverbMode,
    mono: pad.mono,
  });
  setPadVisualImage(pad, pad.visualImage, pad.visualImageHidden, {
    visualPositionX: pad.visualPositionX,
    visualPositionY: pad.visualPositionY,
    visualZoom: pad.visualZoom,
    visualKind: pad.visualKind,
  });
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
  updatePadVolumeValue(pad);
  pad.panEl.value = pad.panValue;
  updatePadPanValue(pad);
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
    setPadVisualImage(pad, image, false, { visualKind: "image" });
    if (state.imagePad === pad) syncImageDialog(pad);
    savePadMeta(pad);
    pad.imageInput.value = "";
  });
  pad.cameraInput?.addEventListener("change", async () => {
    const file = pad.cameraInput.files?.[0];
    if (!file) return;
    const image = await fileToDataUrl(file);
    setPadVisualImage(pad, image, false, { visualKind: "image" });
    if (state.imagePad === pad) syncImageDialog(pad);
    savePadMeta(pad);
    pad.cameraInput.value = "";
  });

  const trigger = node.querySelector('[data-action="play"]');
  node.addEventListener("click", (event) => {
    if (document.body.dataset.skin !== "visual" || pad.node.classList.contains("is-editing")) return;
    if (!pad.visualImage && !pad.color) return;
    if (event.target.closest("button, input, select, textarea, dialog, .pad-progress, .visual-toggle-button")) return;
    event.preventDefault();
    togglePad(pad);
  });
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
  });
  trigger.addEventListener("pointerdown", (event) => {
    event.preventDefault();
  });
  trigger.addEventListener("pointerup", (event) => {
    event.preventDefault();
  });
  trigger.addEventListener("pointercancel", () => {
    pad.holdPointerId = null;
  });
  bindPadProgress(pad);
  node.querySelector('[data-action="stop"]').addEventListener("click", () => stopPad(pad, fadeDurationForPad(pad, "out") > 0));
  node.querySelector('[data-action="delete-pad"]').addEventListener("click", () => deletePad(pad));
  if (pad.duplicateButton) {
    pad.duplicateButton.dataset.padIndex = String(index);
    pad.duplicateButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      duplicatePadFromNode(node, pad);
    });
  }
  node.querySelector('[data-action="audio"]').addEventListener("click", () => openAudioDialog(pad));
  node.querySelector('[data-action="visual-image"]').addEventListener("click", () => openImageDialog(pad));
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
    setPadTitle(pad, pad.nameEl.value, { syncInput: false, trimTitle: false });
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
  pad.fadeInToggleEl?.addEventListener("change", () => {
    setPadLiveFade(pad, pad.fadeInToggleEl.checked, pad.fadeOutEnabled);
    savePadMeta(pad);
  });
  pad.fadeOutToggleEl?.addEventListener("change", () => {
    setPadLiveFade(pad, pad.fadeInEnabled, pad.fadeOutToggleEl.checked);
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
    setPadTitle(pad, pad.nameEl.value);
    savePadMeta(pad);
    if (!state.boardEditMode) setPadEditing(pad, false);
  });
  pad.nameEl.addEventListener("keydown", (event) => {
    event.stopPropagation();
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
    updatePadVolumeValue(pad);
    if (pad.gain) pad.gain.gain.setTargetAtTime(targetPadGain(pad), state.audioContext.currentTime, 0.015);
    savePadMeta(pad);
  });

  pad.panEl.addEventListener("input", () => {
    pad.panValue = Number(pad.panEl.value);
    updatePadPanValue(pad);
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
      if (!button.dataset.color) setPadVisualImage(pad, "", false);
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
      if (pad.startStopModeEl.value === "none") pad.startStopTagEl.value = "";
      if (pad.endStartModeEl.value === "none") pad.endStartTargetEl.value = "";
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
    const mode = button.dataset.mode;
    button.addEventListener("click", (event) => {
      if (mode === "hold") return;
      event.preventDefault();
      setPadMode(pad, mode);
      savePadMeta(pad);
      if (mode === "oneshot") {
        playPad(pad, fadeDurationForPad(pad, "in") > 0, 0).catch(() => setStatus("Lecture impossible"));
      } else if (mode === "toggle") {
        togglePad(pad);
      }
    });
    if (mode === "hold") {
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        setPadMode(pad, "hold");
        savePadMeta(pad);
        button.setPointerCapture?.(event.pointerId);
        pad.holdPointerId = event.pointerId;
        playPad(pad, fadeDurationForPad(pad, "in") > 0, 0).catch(() => setStatus("Lecture impossible"));
      });
      const endHold = (event) => {
        if (pad.holdPointerId !== event.pointerId) return;
        event.preventDefault();
        pad.holdPointerId = null;
        stopPad(pad, fadeDurationForPad(pad, "out") > 0);
      };
      button.addEventListener("pointerup", endHold);
      button.addEventListener("pointercancel", endHold);
    }
  });

  pad.modeButtons.forEach((button) => {
    button.addEventListener("pointerleave", () => {
      if (button.dataset.mode === "hold" && pad.holdPointerId != null) {
        pad.holdPointerId = null;
        stopPad(pad, fadeDurationForPad(pad, "out") > 0);
      }
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
  if (state.masterBypassGain && state.audioContext) {
    state.masterBypassGain.gain.setTargetAtTime(volume, state.audioContext.currentTime, 0.02);
  }
  if (persist) {
    const board = currentBoard();
    if (board) {
      board.masterVolume = volume;
      saveBoards();
    }
  }
}

function updatePadVolumeValue(pad) {
  if (pad?.volumeValueEl) pad.volumeValueEl.textContent = `${Math.round((Number(pad.volume) || 0) * 100)}%`;
}

function updatePadPanValue(pad) {
  if (!pad?.panValueEl) return;
  const value = Number(pad.panValue) || 0;
  pad.panValueEl.textContent = Math.abs(value) < 0.005 ? "0" : value.toFixed(2).replace(/0$/, "").replace(/\.0$/, "");
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
  const value = String(els.boardTagFilter?.value || "").trim();
  state.pads.forEach((pad) => {
    const matches = !value ? false : padsForBoardFilterValue(value).includes(pad);
    pad.node.classList.toggle("is-tag-match", Boolean(value && matches));
    pad.node.classList.toggle("is-tag-dimmed", Boolean(value && !matches));
  });
  if (value) setStatus(`Pads sélectionnés`);
}

function padsForBoardTagSelection() {
  const value = String(els.boardTagFilter?.value || "").trim();
  return padsForBoardFilterValue(value);
}

function padsForBoardFilterValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return [];
  if (normalized.startsWith("pad:")) {
    const index = Number(normalized.slice(4));
    return Number.isInteger(index) && state.pads[index] ? [state.pads[index]] : [];
  }
  if (normalized.startsWith("option:")) {
    const option = normalized.slice(7);
    return state.pads.filter((pad) => padMatchesAudioOption(pad, option));
  }
  return state.pads.filter((pad) => padTagList(pad).includes(normalized));
}

function syncBulkTemplateFields(pad) {
  if (!pad) return;
  if (els.bulkVolume) els.bulkVolume.value = String(pad.volume);
  if (els.bulkPan) els.bulkPan.value = String(pad.panValue);
  if (els.bulkTags) els.bulkTags.value = pad.tags;
  setBulkColorValue(pad.color || "");
  if (els.bulkFadeInEnabled) els.bulkFadeInEnabled.checked = pad.fadeInEnabled;
  if (els.bulkFadeOutEnabled) els.bulkFadeOutEnabled.checked = pad.fadeOutEnabled;
  if (els.bulkLoop) els.bulkLoop.checked = pad.loop;
  if (els.bulkDuck) els.bulkDuck.checked = pad.duckTrigger;
  if (els.bulkReverbNone) els.bulkReverbNone.checked = pad.reverbMode === "none";
  if (els.bulkReverbGlobal) els.bulkReverbGlobal.checked = pad.reverbMode !== "none" && pad.reverbMode !== "pad";
  if (els.bulkReverbPad) els.bulkReverbPad.checked = pad.reverbMode === "pad";
  if (els.bulkReverbPreset) els.bulkReverbPreset.value = pad.reverbPreset === "none" ? "hall" : pad.reverbPreset;
  if (els.bulkReverbWet) els.bulkReverbWet.value = String(pad.reverbWet ?? 0.5);
  fillBulkCrossfadeControls(pad);
}

function setBulkColorValue(color = "") {
  const value = PAD_COLORS[color] ? color : "";
  if (els.bulkColor) els.bulkColor.value = value;
  els.bulkColorButtons?.forEach((button) => {
    button.classList.toggle("is-active", (button.dataset.bulkColor || "") === value);
  });
}

function fillActionSelect(select, selectedValue = "none") {
  if (!select) return;
  select.innerHTML = '<option value="none">Pas d’effet</option><option value="play">Lance pad ou tag</option><option value="duck">Duck pad ou tag</option><option value="stop">Stoppe pad ou tag</option>';
  select.value = ["none", "play", "duck", "stop"].includes(selectedValue) ? selectedValue : "none";
}

function fillBulkCrossfadeControls(pad) {
  fillActionSelect(els.bulkStartStopMode, pad?.startStopMode || "none");
  fillActionSelect(els.bulkEndStartMode, pad?.endStartMode || "none");
  fillCrossfadeTargetSelect(els.bulkStartStopTarget, pad?.startStopTag || "");
  fillCrossfadeTargetSelect(els.bulkEndStartTarget, pad?.endStartTarget || "");
}

function openBulkEditDialog() {
  let pads = padsForBoardTagSelection();
  const selectedTag = String(els.boardTagFilter?.value || "").trim();
  if (!pads.length) {
    window.alert("Sélectionner des pads avec le menu Modification groupée du cadre board");
    return;
  }
  if (!selectedTag || pads.length === state.pads.length) {
    const shouldEditAll = window.confirm("Modifier tous les pads ?");
    if (!shouldEditAll) {
      window.alert("Sélectionner des pads avec le menu Modification groupée du cadre board");
      return;
    }
    pads = state.pads;
  }

  state.bulkEditPads = pads;
  if (els.bulkEditCount) {
    els.bulkEditCount.textContent = `${pads.length} pad${pads.length > 1 ? "s" : ""} sélectionné${pads.length > 1 ? "s" : ""}`;
  }
  if (els.bulkTemplatePad) {
    els.bulkTemplatePad.innerHTML = "";
    pads.forEach((pad) => {
      const option = document.createElement("option");
      option.value = String(pad.index);
      option.textContent = `${pad.index + 1}. ${pad.title}`;
      els.bulkTemplatePad.append(option);
    });
    els.bulkTemplatePad.value = String(pads[0].index);
  }
  [els.bulkApplyVolume, els.bulkApplyPan, els.bulkApplyTags, els.bulkApplyColor, els.bulkApplyLiveFade, els.bulkApplyAudioFlags, els.bulkApplyReverb, els.bulkApplyCrossfade]
    .forEach((checkbox) => { if (checkbox) checkbox.checked = false; });
  syncBulkTemplateFields(pads[0]);
  if (els.bulkEditDialog?.showModal) {
    els.bulkEditDialog.showModal();
  } else {
    setStatus("Modification groupée prête");
  }
}

async function applyBulkEdit() {
  const pads = state.bulkEditPads.filter(Boolean);
  if (!pads.length) return;
  for (const pad of pads) {
    if (els.bulkApplyVolume?.checked) {
      pad.volume = Number(els.bulkVolume?.value) || 0;
      if (pad.volumeEl) pad.volumeEl.value = String(pad.volume);
      updatePadVolumeValue(pad);
      if (pad.gain && state.audioContext) pad.gain.gain.setTargetAtTime(targetPadGain(pad), state.audioContext.currentTime, 0.015);
    }
    if (els.bulkApplyPan?.checked) {
      pad.panValue = Number(els.bulkPan?.value) || 0;
      if (pad.panEl) pad.panEl.value = String(pad.panValue);
      updatePadPanValue(pad);
      if (pad.pan && state.audioContext) pad.pan.pan.setTargetAtTime(pad.panValue, state.audioContext.currentTime, 0.015);
    }
    if (els.bulkApplyTags?.checked) {
      setPadTags(pad, els.bulkTags?.value || "");
    }
    if (els.bulkApplyColor?.checked) {
      setPadColor(pad, els.bulkColor?.value || "");
    }
    if (els.bulkApplyLiveFade?.checked) {
      setPadLiveFade(pad, Boolean(els.bulkFadeInEnabled?.checked), Boolean(els.bulkFadeOutEnabled?.checked));
    }
    if (els.bulkApplyAudioFlags?.checked) {
      setPadLoop(pad, Boolean(els.bulkLoop?.checked));
      if (pad.source) pad.source.loop = pad.loop;
      setPadDuckTrigger(pad, Boolean(els.bulkDuck?.checked));
    }
    if (els.bulkApplyReverb?.checked) {
      setPadAudioSettings(pad, {
        reverbMode: els.bulkReverbNone?.checked ? "none" : (els.bulkReverbPad?.checked ? "pad" : "global"),
        reverbPreset: els.bulkReverbPreset?.value || "hall",
        reverbWet: els.bulkReverbWet?.value ?? 0.5,
      });
      if (pad.source) refreshPlayingPadOutput(pad);
    }
    if (els.bulkApplyCrossfade?.checked) {
      setPadCrossfade(pad, {
        startStopMode: els.bulkStartStopMode?.value || "none",
        startStopTag: els.bulkStartStopTarget?.value || "",
        endStartMode: els.bulkEndStartMode?.value || "none",
        endStartTarget: els.bulkEndStartTarget?.value || "",
      });
    }
    await savePadMeta(pad);
  }
  refreshStopGroupOptions();
  refreshBoardTagFilterOptions();
  refreshCrossfadeTargetOptions();
  applyDucking();
  els.bulkEditDialog?.close();
  setStatus(`${pads.length} pad${pads.length > 1 ? "s" : ""} modifié${pads.length > 1 ? "s" : ""}`);
}

function renderBoardLayoutControls() {
  const board = currentBoard();
  if (!board) return;
  const layout = layoutForBoard(board);
  if (els.padColumns) {
    els.padColumns.value = layout.columns || 4;
  }
  if (els.padRows) {
    els.padRows.value = layout.rows || "";
    els.padRows.textContent = String(layout.rows || "");
  }
}

function updateBoardLayout() {
  const board = currentBoard();
  if (!board) return;
  board.layoutMode = "custom";
  board.padColumns = normalizeLayoutNumber(els.padColumns?.value, board.padColumns || 4);
  board.padRows = Math.max(1, Math.ceil(board.padCount / board.padColumns));
  saveBoards();
  renderBoardLayoutControls();
  applyPadLayout(board);
  setStatus("Disposition pads modifiee");
}

function renderBoardOptions() {
  if (!els.boardSelect) return;
  els.boardSelect.innerHTML = "";
  const sortedBoards = [...state.boards].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" }));
  sortedBoards.forEach((board) => {
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
      setBoardPadEditing(true);
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

function duplicateBoardName(name) {
  const base = `${String(name || "Projet").trim() || "Projet"} copie`;
  const names = new Set(state.boards.map((board) => board.name));
  if (!names.has(base)) return base;
  let index = 2;
  while (names.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}

function fileSafeName(value) {
  return String(value || "soundboard")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "soundboard";
}

async function duplicateCurrentBoard() {
  if (!state.boardEditMode) return;
  stopAll();
  resetRecordingState();
  const sourceBoard = currentBoard();
  const newBoard = {
    ...normalizeBoard(sourceBoard),
    id: createId(),
    name: duplicateBoardName(sourceBoard.name),
  };
  state.boards.push(newBoard);

  for (let index = 0; index < sourceBoard.padCount; index += 1) {
    const meta = await dbGet(padMetaKeyFor(sourceBoard.id, index));
    const audio = await dbGet(padAudioKeyFor(sourceBoard.id, index));
    if (meta) await dbSet(padMetaKeyFor(newBoard.id, index), meta);
    if (audio) await dbSet(padAudioKeyFor(newBoard.id, index), audio);
  }

  state.currentBoardId = newBoard.id;
  saveBoards();
  renderBoardOptions();
  await renderPads();
  setBoardPadEditing(true);
  setStatus(`${newBoard.name} dupliqué`);
}

function boardNoticeRows() {
  return state.pads.map((pad) => {
    return {
      title: pad.title || `Pad ${pad.index + 1}`,
      tags: pad.tags || "-",
      audio: pad.audioName || "-",
      duration: padDurationNotice(pad),
      mode: pad.playMode,
      volume: `${Math.round((Number(pad.volume) || 0) * 100)}%`,
      pan: pad.panValueEl?.textContent || "0",
      audioSettings: padAudioNotice(pad),
      shortcut: shortcutNoticeForPad(pad),
    };
  });
}

function secondsNotice(seconds) {
  return Number.isFinite(seconds) && seconds > 0 ? formatTime(seconds) : "-";
}

function padDurationNotice(pad) {
  if (!pad?.buffer) return "-";
  const real = secondsNotice(pad.buffer.duration);
  const trimmed = secondsNotice(playableDuration(pad));
  return real === trimmed ? real : `${real} (${trimmed})`;
}

function fadeNotice(pad) {
  if (pad.fadeMode === "none") return "fade aucun";
  const inSeconds = fadeDurationForPad(pad, "in");
  const outSeconds = fadeDurationForPad(pad, "out");
  const scope = pad.fadeMode === "pad" ? "pad" : "global";
  return `fade ${scope} in ${inSeconds}s / out ${outSeconds}s`;
}

function padAudioNotice(pad) {
  const items = [];
  items.push(`type ${audioFileType(pad)}`);
  if (pad.buffer) {
    items.push(pad.buffer.numberOfChannels === 1 ? "source mono" : "source stéréo");
    items.push(formatSampleRate(pad.buffer.sampleRate));
  }
  items.push(`normalisation ${pad.normalizeEnabled ? `${pad.normalizedGain.toFixed(2)}x` : "off"}`);
  if (pad.mono || pad.buffer?.numberOfChannels === 1) items.push("mono");
  if (pad.loop) items.push("loop");
  if (pad.duckTrigger) items.push("ducking");
  items.push(fadeNotice(pad));
  items.push(`pitch ${pad.pitchSemitones >= 0 ? "+" : ""}${pad.pitchSemitones} demi-tons ${pad.pitchFine >= 0 ? "+" : ""}${Math.round(pad.pitchFine)} cents`);
  if (pad.reverbMode === "none") items.push("reverb aucune");
  else if (pad.reverbMode === "global") items.push("reverb globale");
  else items.push(`reverb ${pad.reverbPreset} ${Math.round(pad.reverbWet * 100)}%`);
  if (pad.startStopMode !== "none" || pad.endStartMode !== "none") items.push("crossfade");
  return items.join(" ; ");
}

function shortcutNoticeForPad(pad) {
  if (!state.shortcutsEnabled) return "";
  const shortcut = state.shortcuts.find((item) => item.padIndex === pad.index && item.key);
  return shortcut?.key || "";
}

function boardAudioNotice() {
  const reverb = masterReverbSettings();
  return [
    `Volume master ${Math.round((currentBoard().masterVolume ?? DEFAULT_MASTER_VOLUME) * 100)}%`,
    `Fade in ${masterFadeEnabled("in") ? `${Number(els.fadeInSeconds?.value) || 0}s` : "off"}`,
    `Fade out ${masterFadeEnabled("out") ? `${Number(els.fadeSeconds?.value) || 0}s` : "off"}`,
    `Ducking ${masterDuckEnabled() ? `${duckAmount()}%` : "off"}`,
    `Reverb ${reverb.preset === "none" ? "aucune" : `${reverb.preset} ${Math.round(reverb.wet * 100)}%`}`,
  ].join(" ; ");
}

function boardNoticeCrossfadeRows() {
  return patchBayRows().map((row) => ({
    source: row.sourcePad.title,
    phase: cablePhaseLabel(row.phase),
    action: cableActionLabel(row.action),
    target: row.targetLabel,
  }));
}

function boardNoticeHtml() {
  const board = currentBoard();
  const rows = boardNoticeRows();
  const crossfadeRows = boardNoticeCrossfadeRows();
  const showShortcuts = state.shortcutsEnabled && rows.some((row) => row.shortcut);
  const date = new Date().toLocaleString("fr-FR");
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Notice ${escapeHtml(board.name)}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font-family: Arial, sans-serif; color: #111; line-height: 1.35; }
    h1 { font-size: 24px; margin-bottom: 4px; }
    h2 { font-size: 17px; margin-top: 22px; }
    table { border-collapse: collapse; width: 100%; font-size: 11px; }
    th, td { border: 1px solid #999; padding: 6px; vertical-align: top; }
    th { background: #eee; text-align: left; }
    .meta { color: #555; font-size: 12px; }
  </style>
</head>
<body>
  <h1>Notice du board : ${escapeHtml(board.name)}</h1>
  <p class="meta">Générée le ${escapeHtml(date)} avec Soundboard Live vl (c) 2026.</p>
  <h2>Résumé</h2>
  <p>Ce board contient ${board.padCount} pad${board.padCount > 1 ? "s" : ""}.</p>
  <h2>Audio du board</h2>
  <p>${escapeHtml(boardAudioNotice())}</p>
  <h2>Crossfade</h2>
  ${crossfadeRows.length ? `
  <table>
    <thead>
      <tr><th>Source</th><th>Moment</th><th>Action</th><th>Cible</th></tr>
    </thead>
    <tbody>
      ${crossfadeRows.map((row) => `<tr><td>${escapeHtml(row.source)}</td><td>${escapeHtml(row.phase)}</td><td>${escapeHtml(row.action)}</td><td>${escapeHtml(row.target)}</td></tr>`).join("")}
    </tbody>
  </table>` : "<p>Aucun crossfade configuré.</p>"}
  <h2>Pads</h2>
  <table>
    <thead>
      <tr><th>#</th>${showShortcuts ? "<th>Raccourci</th>" : ""}<th>Nom</th><th>Audio</th><th>Durée</th><th>Tags</th><th>Mode</th><th>Volume</th><th>Pan</th><th>Paramètres audio du pad</th></tr>
    </thead>
    <tbody>
      ${rows.map((row, index) => `<tr><td>${index + 1}</td>${showShortcuts ? `<td>${escapeHtml(row.shortcut || "-")}</td>` : ""}<td>${escapeHtml(row.title)}</td><td>${escapeHtml(row.audio)}</td><td>${escapeHtml(row.duration)}</td><td>${escapeHtml(row.tags)}</td><td>${escapeHtml(row.mode)}</td><td>${escapeHtml(row.volume)}</td><td>${escapeHtml(row.pan)}</td><td>${escapeHtml(row.audioSettings)}</td></tr>`).join("")}
    </tbody>
  </table>
</body>
</html>`;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportBoardNotice() {
  const board = currentBoard();
  const html = boardNoticeHtml();
  const baseName = `notice-${fileSafeName(board.name)}`;
  downloadBlob(html, `${baseName}.doc`, "application/msword;charset=utf-8");
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    window.setTimeout(() => printWindow.print(), 250);
    setStatus("Notice DOC téléchargée, PDF via impression");
  } else {
    setStatus("Notice DOC téléchargée, autoriser les pop-ups pour le PDF");
  }
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
  renderBoardOptions();
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const parts = [];
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    parts.push(String.fromCharCode(...bytes.subarray(index, index + chunkSize)));
  }
  return btoa(parts.join(""));
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

function timestampForFile(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
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
  const migratedSkin = skin === "scene" ? "candy" : skin === "minimal" ? "classic" : skin;
  const requestedSkin = ["candy", "classic", "contrast", "neon", "studio", "visual"].includes(migratedSkin) ? migratedSkin : "classic";
  const skinName = requestedSkin;
  updateSkinOptions();
  document.body.dataset.skin = skinName;
  if (els.skinSelect) els.skinSelect.value = skinName;
  localStorage.setItem(SKIN_STORAGE, skinName);
  if (skinName === "visual") revealGalleryPads();
}

function revealGalleryPads(save = true) {
  state.pads.forEach((pad) => {
    if (!pad.visualImageHidden) return;
    setPadVisualImage(pad, pad.visualImage, false);
    if (save) savePadMeta(pad).catch(() => {});
  });
}

async function shareOrDownloadBoard(blob, filename, boardName) {
  const file = new File([blob], filename, { type: "application/json" });
  const preferShareSheet = shouldPreferShareSheetForExport();

  if (preferShareSheet && await tryShareBoardFile(file, boardName)) return;

  if (window.showSaveFilePicker) {
    try {
      setStatus("Choisir un dossier de sauvegarde");
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: "Board Soundboard Live",
          accept: { "application/json": [".json"] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      setStatus(`${boardName} exporte`);
      return;
    } catch (error) {
      if (error?.name === "AbortError") {
        setStatus("Export annule");
        return;
      }
    }
  }

  if (!preferShareSheet && await tryShareBoardFile(file, boardName)) return;

  setStatus("Export par telechargement");

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

function shouldPreferShareSheetForExport() {
  return window.matchMedia("(max-width: 950px), (pointer: coarse)").matches;
}

async function tryShareBoardFile(file, boardName) {
  if (!navigator.share) return false;
  if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
  try {
    setStatus("Choisir Fichiers, iCloud Drive ou Dropbox");
    await navigator.share({
      files: [file],
      title: boardName,
      text: `Board Soundboard Live: ${boardName}`,
    });
    setStatus(`${boardName} exporte`);
    return true;
  } catch (error) {
    if (error?.name === "AbortError") {
      setStatus("Export annule");
      return true;
    }
    return false;
  }
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
      shortcutsEnabled: state.shortcutsEnabled,
      shortcuts: (state.shortcuts.length ? state.shortcuts : defaultShortcuts()).map((shortcut) => ({
        key: normalizeShortcutKey(shortcut.key),
        padIndex: Math.min(board.padCount - 1, Math.max(0, Number(shortcut.padIndex) || 0)),
      })),
    },
    pads,
  };
}

async function applyBoardSnapshot(snapshot) {
  const board = currentBoard();
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

  const snapshotShortcuts = Array.isArray(snapshot.board?.shortcuts) ? snapshot.board.shortcuts : [];
  state.shortcuts = snapshotShortcuts.length
    ? snapshotShortcuts.map((shortcut) => ({
      key: normalizeShortcutKey(shortcut.key),
      padIndex: Math.min(board.padCount - 1, Math.max(0, Number(shortcut.padIndex) || 0)),
    }))
    : Array.from({ length: board.padCount }, (_, index) => ({
      key: KEYS[index] || "",
      padIndex: index,
    }));
  state.shortcutsEnabled = snapshot.board?.shortcutsEnabled !== false;
  saveShortcutsForCurrentBoard();
  saveShortcutsEnabledForCurrentBoard();

  saveBoards();
  renderBoardOptions();
  await renderPads();
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

  await applyBoardSnapshot(snapshot);
  setBoardPadEditing(true);
  await refreshVersionOptions(snapshot.id);
  setStatus(`Version restauree: ${board.name}`);
}

async function exportCurrentBoard(includeAudio = true) {
  const board = currentBoard();
  const pads = [];
  syncPadIndexesFromDom();
  const shortcuts = state.shortcuts.length ? state.shortcuts : defaultShortcuts();

  for (let index = 0; index < board.padCount; index += 1) {
    const pad = state.pads[index] || makePad(index);
    const meta = await dbGet(padMetaKey(pad));
    const saved = await dbGet(padAudioKey(pad));
    const resolvedAudio = includeAudio ? await resolvePadAudioRecord(pad, meta, saved) : null;
    const audioRef = Number(meta?.audioRefIndex ?? saved?.audioRefIndex);
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
      fadeMode: meta?.fadeMode ?? saved?.fadeMode ?? "global",
      fadeInSeconds: meta?.fadeInSeconds ?? saved?.fadeInSeconds ?? "",
      fadeOutSeconds: meta?.fadeOutSeconds ?? saved?.fadeOutSeconds ?? "",
      fadeInEnabled: Boolean(meta?.fadeInEnabled ?? saved?.fadeInEnabled),
      fadeOutEnabled: Boolean(meta?.fadeOutEnabled ?? saved?.fadeOutEnabled),
      pitchSemitones: meta?.pitchSemitones ?? saved?.pitchSemitones ?? 0,
      pitchFine: meta?.pitchFine ?? saved?.pitchFine ?? 0,
      speedRate: meta?.speedRate ?? saved?.speedRate ?? 1,
      reverbPreset: meta?.reverbPreset ?? saved?.reverbPreset ?? "none",
      reverbWet: meta?.reverbWet ?? saved?.reverbWet ?? 0.5,
      reverbMode: meta?.reverbMode ?? saved?.reverbMode ?? "global",
      mono: Boolean(meta?.mono ?? saved?.mono),
      normalizeEnabled: meta?.normalizeEnabled ?? saved?.normalizeEnabled ?? true,
      normalizedGain: meta?.normalizedGain ?? saved?.normalizedGain ?? 1,
      visualImage: meta?.visualImage ?? saved?.visualImage ?? "",
      visualImageHidden: Boolean(meta?.visualImageHidden ?? saved?.visualImageHidden),
      visualKind: meta?.visualKind ?? saved?.visualKind ?? "",
      visualPositionX: meta?.visualPositionX ?? saved?.visualPositionX ?? 50,
      visualPositionY: meta?.visualPositionY ?? saved?.visualPositionY ?? 50,
      visualZoom: meta?.visualZoom ?? saved?.visualZoom ?? 1,
      startStopMode: meta?.startStopMode ?? saved?.startStopMode ?? "none",
      startStopTag: meta?.startStopTag ?? saved?.startStopTag ?? "",
      endStartMode: meta?.endStartMode ?? saved?.endStartMode ?? "none",
      endStartTarget: meta?.endStartTarget ?? saved?.endStartTarget ?? "",
      trimStart: meta?.trimStart ?? saved?.trimStart ?? 0,
      trimEnd: meta?.trimEnd ?? saved?.trimEnd ?? 0,
      playMode: meta?.playMode || saved?.playMode || "oneshot",
      audioRefIndex: Number.isInteger(audioRef) ? audioRef : null,
      audio: includeAudio && resolvedAudio?.audio ? {
        name: resolvedAudio.name || saved?.name || `Pad ${index + 1}`,
        path: resolvedAudio.path || saved?.path || meta?.audioPath || resolvedAudio.name || `Pad ${index + 1}`,
        pathTrusted: Boolean(resolvedAudio.pathTrusted || saved?.pathTrusted || meta?.audioPathTrusted),
        type: resolvedAudio.type || saved?.type || "audio/mpeg",
        data: arrayBufferToBase64(resolvedAudio.audio),
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
      shortcutsEnabled: state.shortcutsEnabled,
      shortcuts: shortcuts.map((shortcut) => ({
        key: normalizeShortcutKey(shortcut.key),
        padIndex: Math.min(board.padCount - 1, Math.max(0, Number(shortcut.padIndex) || 0)),
      })),
      pads,
    },
  };

  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const suffix = includeAudio ? "soundboard" : "soundboard-settings";
  await shareOrDownloadBoard(blob, `${safeFileName(board.name)}.${timestampForFile()}.${suffix}.json`, board.name);
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

  const pads = Array.isArray(payload.board.pads) ? payload.board.pads : [];
  const maxImportedIndex = pads.reduce((max, item) => {
    const index = Number(item?.index);
    return Number.isInteger(index) && index >= 0 ? Math.max(max, index) : max;
  }, -1);
  const importedBoard = normalizeBoard({
    id: createId(),
    name: payload.board.name || cleanName(file.name),
    padCount: Math.max(1, Number(payload.board.padCount) || DEFAULT_PAD_COUNT, maxImportedIndex + 1),
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

  let audioFailures = 0;
  for (let index = 0; index < importedBoard.padCount; index += 1) {
    const item = pads.find((padItem) => Number(padItem?.index) === index) || {};
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
      fadeMode: item.fadeMode || "global",
      fadeInSeconds: item.fadeInSeconds ?? "",
      fadeOutSeconds: item.fadeOutSeconds ?? "",
      fadeInEnabled: Boolean(item.fadeInEnabled),
      fadeOutEnabled: Boolean(item.fadeOutEnabled),
      pitchSemitones: item.pitchSemitones ?? 0,
      pitchFine: item.pitchFine ?? 0,
      speedRate: item.speedRate ?? 1,
      reverbPreset: item.reverbPreset || "none",
      reverbWet: item.reverbWet ?? 0.5,
      reverbMode: item.reverbMode || "global",
      mono: Boolean(item.mono),
      normalizeEnabled: item.normalizeEnabled ?? true,
      normalizedGain: item.normalizedGain ?? 1,
      visualImage: item.visualImage || "",
      visualImageHidden: Boolean(item.visualImageHidden),
      visualKind: item.visualKind || "",
      visualPositionX: item.visualPositionX ?? 50,
      visualPositionY: item.visualPositionY ?? 50,
      visualZoom: item.visualZoom ?? 1,
      startStopMode: item.startStopMode || "none",
      startStopTag: item.startStopTag || "",
      endStartMode: item.endStartMode || "none",
      endStartTarget: item.endStartTarget || "",
      trimStart: item.trimStart ?? 0,
      trimEnd: item.trimEnd ?? 0,
      playMode: item.playMode || "oneshot",
      audioRefIndex: item.audio?.data
        ? null
        : Number.isInteger(Number(item.audioRefIndex))
          ? Number(item.audioRefIndex)
          : null,
    };
    await dbSet(padMetaKey(transientPad), meta);
    if (item.audio?.data) {
      try {
        await dbSet(padAudioKey(transientPad), {
          name: item.audio.name || meta.title,
          path: item.audio.path || item.audio.name || meta.title,
          pathTrusted: Boolean(item.audio.pathTrusted),
          title: meta.title,
          type: item.audio.type || "audio/mpeg",
          audio: base64ToArrayBuffer(item.audio.data),
          ...meta,
        });
      } catch {
        audioFailures += 1;
      }
    }
  }

  const importedShortcuts = Array.isArray(payload.board.shortcuts)
    ? payload.board.shortcuts
      .map((shortcut) => ({
        key: normalizeShortcutKey(shortcut?.key),
        padIndex: Number(shortcut?.padIndex),
      }))
      .filter((shortcut) => Number.isInteger(shortcut.padIndex) && shortcut.padIndex >= 0 && shortcut.padIndex < importedBoard.padCount)
    : [];
  state.shortcuts = importedShortcuts.length
    ? importedShortcuts
    : Array.from({ length: importedBoard.padCount }, (_, index) => ({
      key: KEYS[index] || "",
      padIndex: index,
    }));
  state.shortcutsEnabled = payload.board.shortcutsEnabled !== false;
  saveShortcutsForCurrentBoard();
  saveShortcutsEnabledForCurrentBoard();

  await renderPads();
  setStatus(audioFailures
    ? `${importedBoard.name} importe (${audioFailures} audio ignore${audioFailures > 1 ? "s" : ""})`
    : `${importedBoard.name} importe`);
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

function shiftAudioRefIndex(record, insertIndex) {
  if (!record || record.audioRefIndex == null) return record;
  const refIndex = Number(record.audioRefIndex);
  if (!Number.isInteger(refIndex)) return record;
  return {
    ...record,
    audioRefIndex: refIndex >= insertIndex ? refIndex + 1 : refIndex,
  };
}

function adjustAudioRefAfterDelete(record, deletedIndex, deletedAudio = null) {
  if (!record || record.audioRefIndex == null) return record;
  const refIndex = Number(record.audioRefIndex);
  if (!Number.isInteger(refIndex)) return record;
  if (refIndex > deletedIndex) {
    return { ...record, audioRefIndex: refIndex - 1 };
  }
  if (refIndex === deletedIndex) {
    return deletedAudio?.audio
      ? { ...record, audio: record.audio || deletedAudio.audio, audioRefIndex: null }
      : { ...record, audioRefIndex: null };
  }
  return record;
}

function duplicateTitle(title) {
  const base = String(title || "Pad").trim() || "Pad";
  return `${base} copie`;
}

function padFromNode(node) {
  return state.pads.find((pad) => pad.node === node) || null;
}

function syncPadIndexesFromDom() {
  [...els.pads.querySelectorAll("[data-pad]")].forEach((node, index) => {
    const pad = padFromNode(node);
    if (!pad) return;
    pad.index = index;
    pad.node.dataset.padIndex = String(index);
    if (pad.duplicateButton) pad.duplicateButton.dataset.padIndex = String(index);
  });
}

async function duplicatePadFromNode(sourceNode, directPad = null) {
  if (!state.boardEditMode) return;
  const padNodes = [...els.pads.querySelectorAll("[data-pad]")];
  const sourceIndex = padNodes.indexOf(sourceNode);
  if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= state.pads.length) {
    setStatus("Pad à copier introuvable");
    return;
  }
  const sourcePad = directPad?.node === sourceNode ? directPad : padFromNode(sourceNode);
  if (!sourcePad) {
    setStatus("Pad à copier introuvable");
    return;
  }
  syncPadIndexesFromDom();
  const sourceAudioBeforeSave = await dbGet(padAudioKeyFor(state.currentBoardId, sourceIndex));
  if (sourceAudioBeforeSave?.audio) {
    sourcePad.audioRefIndex = null;
  }
  await savePadMeta(sourcePad);
  const board = currentBoard();
  const boardId = state.currentBoardId;
  const insertIndex = sourceIndex + 1;
  const snapshots = [];

  for (let index = insertIndex; index < board.padCount; index += 1) {
    snapshots.push({
      audio: await dbGet(padAudioKeyFor(boardId, index)),
      meta: await dbGet(padMetaKeyFor(boardId, index)),
    });
  }

  for (let offset = snapshots.length - 1; offset >= 0; offset -= 1) {
    const fromIndex = insertIndex + offset;
    const toIndex = fromIndex + 1;
    const snapshot = snapshots[offset];
    if (snapshot.meta) {
      await dbSet(padMetaKeyFor(boardId, toIndex), shiftAudioRefIndex(snapshot.meta, insertIndex));
    } else {
      await dbDelete(padMetaKeyFor(boardId, toIndex));
    }
    if (snapshot.audio) {
      await dbSet(padAudioKeyFor(boardId, toIndex), shiftAudioRefIndex(snapshot.audio, insertIndex));
    } else {
      await dbDelete(padAudioKeyFor(boardId, toIndex));
    }
  }

  const sourceMeta = await dbGet(padMetaKeyFor(boardId, sourceIndex));
  const sourceAudio = await dbGet(padAudioKeyFor(boardId, sourceIndex));
  const linkedRef = Number(sourceMeta?.audioRefIndex ?? sourceAudio?.audioRefIndex);
  const sourceRef = sourceAudio?.audio
    ? sourceIndex
    : Number.isInteger(linkedRef)
      ? linkedRef
      : null;
  const title = duplicateTitle(sourceMeta?.title || sourceAudio?.title || sourcePad.title);
  const duplicateMeta = {
    ...(sourceMeta || {}),
    title,
    audioRefIndex: sourceRef,
  };
  const duplicateAudio = sourceRef != null && sourceAudio
    ? {
      ...sourceAudio,
      title,
      audio: undefined,
      audioRefIndex: sourceRef,
    }
    : null;

  await dbSet(padMetaKeyFor(boardId, insertIndex), duplicateMeta);
  if (duplicateAudio) {
    await dbSet(padAudioKeyFor(boardId, insertIndex), duplicateAudio);
  } else {
    await dbDelete(padAudioKeyFor(boardId, insertIndex));
  }

  board.padCount += 1;
  saveBoards();
  await renderPads();
  setBoardPadEditing(true);
  const audioLabel = sourceRef == null ? "sans audio" : `audio pad ${sourceRef + 1}`;
  setStatus(`${title} duplique depuis pad ${sourceIndex + 1} · ${audioLabel}`);
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
  const deletedAudio = await dbGet(padAudioKeyFor(boardId, pad.index));
  const remainingPads = state.pads.filter((item) => item !== pad);
  const snapshots = [];
  for (const item of remainingPads) {
    snapshots.push({
      audio: adjustAudioRefAfterDelete(await dbGet(padAudioKeyFor(boardId, item.index)), pad.index, deletedAudio),
      meta: adjustAudioRefAfterDelete(await dbGet(padMetaKeyFor(boardId, item.index)), pad.index),
    });
  }

  for (let index = 0; index < snapshots.length; index += 1) {
    const snapshot = snapshots[index];
    renumberDefaultPadSnapshot(snapshot, index);
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

function isDefaultPadTitle(title) {
  return /^Pad\s+\d+$/i.test(String(title || "").trim());
}

function renumberDefaultPadSnapshot(snapshot, index) {
  const title = `Pad ${index + 1}`;
  if (snapshot.meta && isDefaultPadTitle(snapshot.meta.title)) {
    snapshot.meta.title = title;
  }
  if (snapshot.audio && isDefaultPadTitle(snapshot.audio.title)) {
    snapshot.audio.title = title;
  }
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
  const exposedPath = file.path || file.webkitRelativePath || "";
  await loadAudioIntoPad(pad, arrayBuffer, file.name, file.type, exposedPath, Boolean(exposedPath));
}

async function loadAudioIntoPad(pad, arrayBuffer, name, type, path = "", pathTrusted = false) {
  await ensureAudio();
  const buffer = await state.audioContext.decodeAudioData(arrayBuffer.slice(0));
  pad.buffer = buffer;
  pad.audioName = name;
  pad.audioPath = path || name;
  pad.audioPathTrusted = Boolean(pathTrusted && path);
  pad.audioRefIndex = null;
  pad.waveformPeaks = buildWaveformPeaks(buffer);
  setPadNormalization(pad, true, normalizedGainForBuffer(buffer));
  setPadTitle(pad, cleanName(name));
  setPadDuration(pad, buffer.duration);
  renderWaveform(pad);
  pad.node.classList.remove("is-empty");
  await dbSet(padAudioKey(pad), {
    name,
    path: pad.audioPath,
    pathTrusted: pad.audioPathTrusted,
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
    fadeMode: pad.fadeMode,
    fadeInSeconds: pad.fadeInSeconds,
    fadeOutSeconds: pad.fadeOutSeconds,
    fadeInEnabled: pad.fadeInEnabled,
    fadeOutEnabled: pad.fadeOutEnabled,
    pitchSemitones: pad.pitchSemitones,
    pitchFine: pad.pitchFine,
    speedRate: pad.speedRate,
    reverbPreset: pad.reverbPreset,
    reverbWet: pad.reverbWet,
    reverbMode: pad.reverbMode,
    mono: pad.mono,
    normalizeEnabled: pad.normalizeEnabled,
    normalizedGain: pad.normalizedGain,
    visualImage: pad.visualImage,
    visualImageHidden: pad.visualImageHidden,
    visualKind: pad.visualKind,
    visualPositionX: pad.visualPositionX,
    visualPositionY: pad.visualPositionY,
    visualZoom: pad.visualZoom,
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
    trimStart: pad.trimStart,
    trimEnd: pad.trimEnd,
    playMode: pad.playMode,
    audioRefIndex: null,
  });
  await savePadMeta(pad);
  if (state.audioPad === pad) syncAudioDialog(pad);
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
    setStatus("Micro: HTTPS requis sur smartphone");
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
    setPadLiveFade(pad, Boolean(meta.fadeInEnabled), Boolean(meta.fadeOutEnabled));
    setPadAudioSettings(pad, meta);
    setPadNormalization(pad, meta.normalizeEnabled ?? true, meta.normalizedGain ?? 1);
    setPadVisualImage(pad, meta.visualImage || "", Boolean(meta.visualImageHidden), meta);
    setPadCrossfade(pad, {
      startStopMode: meta.startStopMode,
      startStopTag: meta.startStopTag,
      endStartMode: meta.endStartMode,
      endStartTarget: meta.endStartTarget,
    });
    setPadTrim(pad, meta.trimStart ?? 0, meta.trimEnd ?? 0);
    setPadMode(pad, meta.playMode || pad.playMode);
    pad.audioRefIndex = Number.isInteger(Number(meta.audioRefIndex)) ? Number(meta.audioRefIndex) : null;
    pad.volumeEl.value = pad.volume;
    updatePadVolumeValue(pad);
    pad.panEl.value = pad.panValue;
    updatePadPanValue(pad);
  }

  const rawSaved = await dbGet(padAudioKey(pad));
  const saved = await resolvePadAudioRecord(pad, meta, rawSaved);
  if (!saved?.audio) {
    if (document.body.dataset.skin === "visual") revealGalleryPads(false);
    return;
  }

  prepareAudio();
  pad.buffer = await state.audioContext.decodeAudioData(saved.audio.slice(0));
  pad.audioName = saved.name || "";
  pad.audioPath = meta?.audioPath || saved.path || saved.name || "";
  pad.audioPathTrusted = Boolean(meta?.audioPathTrusted || saved.pathTrusted);
  pad.waveformPeaks = buildWaveformPeaks(pad.buffer);
  setPadTitle(pad, meta?.title || saved.title || cleanName(saved.name || `Pad ${pad.index + 1}`));
  pad.volume = saved.volume ?? pad.volume;
  pad.panValue = saved.panValue ?? pad.panValue;
  setPadLoop(pad, Boolean(saved.loop));
  setPadDuckTrigger(pad, Boolean(saved.duckTrigger));
  setPadTags(pad, meta?.tags ?? saved.tags ?? "");
  setPadColor(pad, meta?.color ?? saved.color ?? "");
  setPadFade(pad, meta?.fadeSeconds ?? saved.fadeSeconds ?? "");
  setPadLiveFade(pad, Boolean(meta?.fadeInEnabled ?? saved.fadeInEnabled), Boolean(meta?.fadeOutEnabled ?? saved.fadeOutEnabled));
  setPadAudioSettings(pad, {
    fadeSeconds: meta?.fadeSeconds ?? saved.fadeSeconds ?? "",
    fadeMode: meta?.fadeMode ?? saved.fadeMode ?? "global",
    fadeInSeconds: meta?.fadeInSeconds ?? saved.fadeInSeconds,
    fadeOutSeconds: meta?.fadeOutSeconds ?? saved.fadeOutSeconds,
    pitchSemitones: meta?.pitchSemitones ?? saved.pitchSemitones,
    pitchFine: meta?.pitchFine ?? saved.pitchFine,
    speedRate: meta?.speedRate ?? saved.speedRate,
    reverbPreset: meta?.reverbPreset ?? saved.reverbPreset,
    reverbWet: meta?.reverbWet ?? saved.reverbWet,
    reverbMode: meta?.reverbMode ?? saved.reverbMode ?? "global",
    mono: meta?.mono ?? saved.mono,
  });
  setPadNormalization(pad, meta?.normalizeEnabled ?? saved.normalizeEnabled ?? true, meta?.normalizedGain ?? saved.normalizedGain ?? 1);
  setPadVisualImage(pad, meta?.visualImage ?? saved.visualImage ?? "", Boolean(meta?.visualImageHidden ?? saved.visualImageHidden), {
    visualPositionX: meta?.visualPositionX ?? saved.visualPositionX,
    visualPositionY: meta?.visualPositionY ?? saved.visualPositionY,
    visualZoom: meta?.visualZoom ?? saved.visualZoom,
    visualKind: meta?.visualKind ?? saved.visualKind,
  });
  setPadCrossfade(pad, {
    startStopMode: meta?.startStopMode ?? saved.startStopMode,
    startStopTag: meta?.startStopTag ?? saved.startStopTag,
    endStartMode: meta?.endStartMode ?? saved.endStartMode,
    endStartTarget: meta?.endStartTarget ?? saved.endStartTarget,
  });
  setPadTrim(pad, meta?.trimStart ?? saved.trimStart ?? 0, meta?.trimEnd ?? saved.trimEnd ?? 0);
  setPadMode(pad, saved.playMode || pad.playMode);
  const restoredRef = Number(meta?.audioRefIndex ?? saved.audioRefIndex);
  pad.audioRefIndex = rawSaved?.audio
    ? null
    : Number.isInteger(restoredRef)
      ? restoredRef
      : null;
  setPadDuration(pad, pad.buffer.duration);
  renderWaveform(pad);
  pad.volumeEl.value = pad.volume;
  updatePadVolumeValue(pad);
  pad.panEl.value = pad.panValue;
  updatePadPanValue(pad);
  pad.node.classList.remove("is-empty");
  if (document.body.dataset.skin === "visual") revealGalleryPads(false);
}

async function resolvePadAudioRecord(pad, meta, saved) {
  if (saved?.audio) return saved;
  const refIndex = Number(saved?.audioRefIndex ?? meta?.audioRefIndex);
  if (!Number.isInteger(refIndex) || refIndex < 0 || refIndex === pad.index) return saved;
  const referenced = await dbGet(padAudioKeyFor(state.currentBoardId, refIndex));
  if (!referenced?.audio) return saved;
  return {
    ...referenced,
    ...(saved || {}),
    audio: referenced.audio,
    name: saved?.name || referenced.name,
    path: saved?.path || referenced.path,
    type: saved?.type || referenced.type,
    audioRefIndex: refIndex,
  };
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
    fadeMode: pad.fadeMode,
    fadeInSeconds: pad.fadeInSeconds,
    fadeOutSeconds: pad.fadeOutSeconds,
    fadeInEnabled: pad.fadeInEnabled,
    fadeOutEnabled: pad.fadeOutEnabled,
    pitchSemitones: pad.pitchSemitones,
    pitchFine: pad.pitchFine,
    speedRate: pad.speedRate,
    reverbPreset: pad.reverbPreset,
    reverbWet: pad.reverbWet,
    reverbMode: pad.reverbMode,
    mono: pad.mono,
    normalizeEnabled: pad.normalizeEnabled,
    normalizedGain: pad.normalizedGain,
    visualImage: pad.visualImage,
    visualImageHidden: pad.visualImageHidden,
    visualKind: pad.visualKind,
    audioPath: pad.audioPath,
    audioPathTrusted: pad.audioPathTrusted,
    visualPositionX: pad.visualPositionX,
    visualPositionY: pad.visualPositionY,
    visualZoom: pad.visualZoom,
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
    trimStart: pad.trimStart,
    trimEnd: pad.trimEnd,
    playMode: pad.playMode,
    audioRefIndex: Number.isInteger(Number(pad.audioRefIndex)) ? Number(pad.audioRefIndex) : null,
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
    setStatus(requestFullscreen && !canRequestFullscreen ? "Mode scene: plein ecran via icone smartphone" : "Mode scene");
  } else {
    if (requestFullscreen && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setStatus("Mode scene quitte");
  }
}

function duckingActive() {
  return duckAmount() > 0 && (
    state.pads.some((pad) => pad.source && pad.duckTrigger) ||
    [...state.crossfadeDucks.values()].some((targets) => targets.size > 0)
  );
}

function masterFadeEnabled(type = "out") {
  const control = type === "in" ? els.masterFadeInEnabled : els.masterFadeOutEnabled;
  return Boolean(control?.checked);
}

function setMasterFadeEnabled(type, enabled) {
  const control = type === "in" ? els.masterFadeInEnabled : els.masterFadeOutEnabled;
  const storage = type === "in" ? MASTER_FADE_IN_ENABLED_STORAGE : MASTER_FADE_OUT_ENABLED_STORAGE;
  if (control) control.checked = Boolean(enabled);
  localStorage.setItem(storage, enabled ? "on" : "off");
  updateMasterOptionBadges();
  updateAllPadAlerts();
}

function masterDuckEnabled() {
  return Boolean(els.masterDuckEnabled?.checked);
}

function badgeClassFor(label) {
  const text = String(label || "").toLowerCase();
  if (text.includes("fade") || text === "f in" || text === "f out") return "is-fade";
  if (text.includes("duck")) return "is-duck";
  if (text.includes("rev")) return "is-reverb";
  if (text.includes("xf") || text.includes("cross")) return "is-crossfade";
  if (text.includes("loop")) return "is-loop";
  if (text.includes("mono")) return "is-mono";
  return "";
}

function badgeMarkup(items) {
  return items
    .map((item) => `<span class="option-badge ${badgeClassFor(item)}">${item}</span>`)
    .join("");
}

function padOptionBadges(pad) {
  const items = [];
  if (pad.loop) items.push("Loop");
  if (pad.duckTrigger) items.push("Duck");
  if (pad.mono) items.push("Mono");
  if (fadeDurationForPad(pad, "in") > 0) items.push("Fade in");
  if (fadeDurationForPad(pad, "out") > 0) items.push("Fade out");
  if (pad.reverbMode === "pad" && pad.reverbPreset !== "none") items.push("Rev");
  if (pad.startStopMode !== "none" || pad.endStartMode !== "none") items.push("Xf");
  return items;
}

function updateMasterOptionBadges() {
  const items = [];
  const fadeInActive = masterFadeEnabled("in") && Number(els.fadeInSeconds?.value) > 0;
  const fadeOutActive = masterFadeEnabled("out") && Number(els.fadeSeconds?.value) > 0;
  if (fadeInActive) items.push("f in");
  if (fadeOutActive) items.push("f out");
  if (masterDuckEnabled() && duckAmount() > 0) items.push("Ducking");
  const reverb = masterReverbSettings();
  if (reverb.preset !== "none" && reverb.wet > 0) items.push("rev");
  if (els.masterOptionBadges) els.masterOptionBadges.innerHTML = badgeMarkup(items);
}

function updateAudioOptionBadges(pad = state.audioPad) {
  if (els.audioOptionBadges) els.audioOptionBadges.innerHTML = pad ? badgeMarkup(padOptionBadges(pad)) : "";
}

function updatePadAlerts(pad) {
  if (!pad?.node) return;
  const remaining = remainingSeconds(pad);
  const duration = playableDuration(pad);
  const endingThreshold = Math.min(ENDING_ALERT_SECONDS, Math.max(1, duration * 0.2));
  const isEnding = Boolean(pad.source && !pad.loop && remaining <= endingThreshold);
  const isDuckSource = Boolean(pad.source && pad.duckTrigger && duckAmount() > 0);
  const isDucked = Boolean(pad.source && duckingActive() && !pad.duckTrigger);
  const hasFadeIn = fadeDurationForPad(pad, "in") > 0;
  const hasFadeOut = fadeDurationForPad(pad, "out") > 0;

  pad.node.classList.toggle("is-ending", isEnding);
  pad.node.classList.toggle("is-looping", pad.loop);
  pad.node.classList.toggle("is-duck-trigger", pad.duckTrigger);
  pad.node.classList.toggle("is-duck-source", isDuckSource);
  pad.node.classList.toggle("is-ducked", isDucked);
  pad.node.classList.toggle("has-audio-fade-in", hasFadeIn);
  pad.node.classList.toggle("has-audio-fade-out", hasFadeOut);
  pad.node.classList.toggle("has-reverb", pad.reverbMode === "pad" && pad.reverbPreset !== "none");
  pad.node.classList.toggle("has-crossfade", pad.startStopMode !== "none" || pad.endStartMode !== "none");
}

function updateAllPadAlerts() {
  state.pads.forEach(updatePadAlerts);
}

function setPadMode(pad, mode) {
  pad.playMode = ["oneshot", "hold", "toggle"].includes(mode) ? mode : "oneshot";
  updatePadModeButtons(pad);
  if (pad.playMode !== "toggle") {
    pad.resumeOffset = 0;
  }
}

function updatePadModeButtons(pad) {
  pad.modeButtons?.forEach((button) => {
    button.classList.toggle("is-active", Boolean(pad.source && button.dataset.mode === pad.playMode));
  });
}

function setPadLiveFade(pad, fadeInEnabled, fadeOutEnabled) {
  pad.fadeInEnabled = Boolean(fadeInEnabled);
  pad.fadeOutEnabled = Boolean(fadeOutEnabled);
  if (pad.fadeMode !== "pad") {
    if (pad.fadeInEnabled) setMasterFadeEnabled("in", true);
    if (pad.fadeOutEnabled) setMasterFadeEnabled("out", true);
  }
  if (pad.fadeInToggleEl) pad.fadeInToggleEl.checked = pad.fadeInEnabled;
  if (pad.fadeOutToggleEl) pad.fadeOutToggleEl.checked = pad.fadeOutEnabled;
  pad.node?.classList.toggle("has-fade-in", pad.fadeInEnabled);
  pad.node?.classList.toggle("has-fade-out", pad.fadeOutEnabled);
  updatePadAlerts(pad);
  if (state.boardEditMode) refreshBoardTagFilterOptions();
  if (document.body.classList.contains("show-cables")) drawCableOverlay();
}

function setPadLoop(pad, loop) {
  pad.loop = Boolean(loop);
  pad.loopEl?.classList.toggle("is-active", pad.loop);
  pad.loopEl?.setAttribute("aria-pressed", String(pad.loop));
  updatePadAlerts(pad);
  if (state.boardEditMode) refreshBoardTagFilterOptions();
}

function setPadDuckTrigger(pad, duckTrigger) {
  pad.duckTrigger = Boolean(duckTrigger);
  pad.duckEl?.classList.toggle("is-active", pad.duckTrigger);
  pad.duckEl?.setAttribute("aria-pressed", String(pad.duckTrigger));
  updatePadAlerts(pad);
  if (state.boardEditMode) refreshBoardTagFilterOptions();
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
  const savedValue = localStorage.getItem(STOP_GROUP_STORAGE) || "";
  const currentValue = els.stopGroupSelect.value || savedValue;
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
  const maxChars = window.matchMedia("(max-width: 950px), (pointer: coarse)").matches ? 16 : 34;
  const width = `${Math.min(maxChars, longestLength + 8)}ch`;
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
  if (els.boardTagFilterLabel) {
    els.boardTagFilterLabel.textContent = state.boardEditMode ? "Modification groupée" : "Sélection groupée";
  }
  els.boardTagFilter.innerHTML = "";
  if (state.boardEditMode) {
    const audioOptions = audioOptionFilterOptions();
    if (audioOptions.length) {
      const audioGroup = document.createElement("optgroup");
      audioGroup.label = "Options audio";
      audioOptions.forEach(({ value, label }) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        audioGroup.append(option);
      });
      els.boardTagFilter.append(audioGroup);
    }
    const tags = boardTags();
    if (tags.length) {
      const tagGroup = document.createElement("optgroup");
      tagGroup.label = "Tags";
      tags.forEach((tag) => {
        const option = document.createElement("option");
        option.value = tag;
        option.textContent = tag;
        tagGroup.append(option);
      });
      els.boardTagFilter.append(tagGroup);
    }
  } else {
    els.boardTagFilter.innerHTML = '<option value="">-</option>';
    boardTags().forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag;
      option.textContent = tag;
      els.boardTagFilter.append(option);
    });
  }
  els.boardTagFilter.value = [...els.boardTagFilter.options].some((option) => option.value === currentValue && !option.disabled) ? currentValue : "";
  applyBoardTagFilter();
}

function audioOptionFilterOptions() {
  return [
    { value: "option:loop", label: "Loop" },
    { value: "option:duck", label: "Ducking" },
    { value: "option:fade", label: "Fade" },
    { value: "option:reverb", label: "Reverb" },
    { value: "option:crossfade", label: "Crossfade" },
    { value: "option:mono", label: "Mono" },
  ].filter(({ value }) => state.pads.some((pad) => padMatchesAudioOption(pad, value.slice(7))));
}

function padMatchesAudioOption(pad, option) {
  if (option === "loop") return pad.loop;
  if (option === "duck") return pad.duckTrigger;
  if (option === "fade") return fadeDurationForPad(pad, "in") > 0 || fadeDurationForPad(pad, "out") > 0;
  if (option === "reverb") return pad.reverbMode === "pad" && pad.reverbPreset !== "none";
  if (option === "crossfade") return pad.startStopMode !== "none" || pad.endStartMode !== "none";
  if (option === "mono") return pad.mono;
  return false;
}

function fillCrossfadeTargetSelect(select, selectedValue = "") {
  if (!select) return;
  const currentValue = String(selectedValue || select.value || "").trim();
  select.innerHTML = '<option value="">Choisir</option>';

  const allOption = document.createElement("option");
  allOption.value = "tag:*";
  allOption.textContent = "Tous";
  select.append(allOption);

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
  if (state.bulkEditPads.length) {
    const pad = state.bulkEditPads.find((item) => String(item.index) === els.bulkTemplatePad?.value) || state.bulkEditPads[0];
    fillBulkCrossfadeControls(pad);
  }
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
  pad.fadeMode = ["none", "global", "pad"].includes(settings.fadeMode) ? settings.fadeMode : (pad.fadeMode || "global");
  pad.fadeInSeconds = normalizeOptionalSeconds(settings.fadeInSeconds ?? settings.fadeSeconds ?? pad.fadeInSeconds);
  pad.fadeOutSeconds = normalizeOptionalSeconds(settings.fadeOutSeconds ?? settings.fadeSeconds ?? pad.fadeOutSeconds);
  pad.pitchSemitones = Math.min(12, Math.max(-12, Number(settings.pitchSemitones) || 0));
  pad.pitchFine = Math.min(100, Math.max(-100, Number(settings.pitchFine) || 0));
  pad.speedRate = 1;
  pad.reverbMode = ["none", "global", "pad"].includes(settings.reverbMode) ? settings.reverbMode : (pad.reverbMode || "global");
  const nextPreset = Object.prototype.hasOwnProperty.call(REVERB_PRESETS, settings.reverbPreset) ? settings.reverbPreset : (pad.reverbPreset || "hall");
  pad.reverbPreset = pad.reverbMode === "pad" && nextPreset === "none" ? "hall" : nextPreset;
  pad.reverbWet = Math.min(1, Math.max(0, Number(settings.reverbWet ?? pad.reverbWet ?? 0.5)));
  pad.mono = Boolean(settings.mono ?? pad.mono);
  updatePadAlerts(pad);
  if (state.boardEditMode) refreshBoardTagFilterOptions();
}

function setPadVisualImage(pad, image = "", hidden = false, settings = {}) {
  pad.visualImage = String(image || "");
  pad.visualImageHidden = Boolean(hidden);
  pad.visualKind = pad.visualImage ? (settings.visualKind || pad.visualKind || "image") : "";
  pad.visualPositionX = Math.min(100, Math.max(0, Number(settings.visualPositionX ?? pad.visualPositionX ?? 50)));
  pad.visualPositionY = Math.min(100, Math.max(0, Number(settings.visualPositionY ?? pad.visualPositionY ?? 50)));
  pad.visualZoom = Math.min(2.5, Math.max(1, Number(settings.visualZoom ?? pad.visualZoom ?? 1)));
  pad.node.classList.toggle("has-visual-image", Boolean(pad.visualImage));
  pad.node.classList.toggle("is-visual-hidden", pad.visualImageHidden);
  pad.visualToggleEl?.setAttribute("aria-pressed", String(pad.visualImageHidden));
  pad.node.style.setProperty("--pad-image-position", `${pad.visualPositionX}% ${pad.visualPositionY}%`);
  pad.node.style.setProperty("--pad-image-size", pad.visualZoom <= 1 ? "cover" : `${pad.visualZoom * 100}%`);
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
  if (state.imagePad === pad) syncImageColorButtons(pad);
}

function syncImageColorButtons(pad = state.imagePad) {
  if (!pad) return;
  els.imageColorButtons?.forEach((button) => {
    button.classList.toggle("is-active", (button.dataset.imageColor || "") === pad.color);
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
  if (["none", "play", "duck", "stop"].includes(mode)) return mode;
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
  pad.startStopTag = pad.startStopMode === "none" ? "" : normalizeCrossfadeTarget(rule.startStopTag, rule.startStopMode);
  pad.endStartMode = normalizeCrossfadeAction(rule.endStartMode, rule.endStartTarget);
  pad.endStartTarget = pad.endStartMode === "none" ? "" : normalizeCrossfadeTarget(rule.endStartTarget, rule.endStartMode);
  if (pad.startStopModeEl) pad.startStopModeEl.value = pad.startStopMode;
  if (pad.startStopTagEl) pad.startStopTagEl.value = pad.startStopTag;
  if (pad.endStartModeEl) pad.endStartModeEl.value = pad.endStartMode;
  if (pad.endStartTargetEl) pad.endStartTargetEl.value = pad.endStartTarget;
  updatePadAlerts(pad);
  if (state.boardEditMode) refreshBoardTagFilterOptions();
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
  updateAudioPlayhead(pad);
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
  if (els.audioPadName) els.audioPadName.textContent = pad.title;
  if (els.audioFilePath) els.audioFilePath.textContent = audioCharacteristics(pad);
  if (els.audioNormalize) els.audioNormalize.checked = pad.normalizeEnabled;
  if (els.audioNormalizeValue) els.audioNormalizeValue.textContent = `${pad.normalizedGain.toFixed(2)}x`;
  if (els.audioMono) {
    const sourceIsMono = pad.buffer?.numberOfChannels === 1;
    els.audioMono.checked = sourceIsMono || pad.mono;
    els.audioMono.disabled = sourceIsMono;
    els.audioMono.closest("label")?.classList.toggle("is-disabled", sourceIsMono);
  }
  if (els.audioLoop) {
    els.audioLoop.checked = pad.loop;
    els.audioLoop.classList.toggle("is-active", pad.loop);
    els.audioLoop.setAttribute("aria-pressed", String(pad.loop));
  }
  if (els.audioDuck) {
    els.audioDuck.checked = pad.duckTrigger;
    els.audioDuck.classList.toggle("is-active", pad.duckTrigger);
    els.audioDuck.setAttribute("aria-pressed", String(pad.duckTrigger));
  }
  if (els.audioFadeNone) els.audioFadeNone.checked = pad.fadeMode === "none";
  if (els.audioFadeGlobal) els.audioFadeGlobal.checked = pad.fadeMode !== "none" && pad.fadeMode !== "pad";
  if (els.audioFadePad) els.audioFadePad.checked = pad.fadeMode === "pad";
  if (els.audioPadFadeFields) els.audioPadFadeFields.hidden = pad.fadeMode !== "pad";
  if (els.audioFadeIn) els.audioFadeIn.value = pad.fadeInSeconds === "" ? "" : String(pad.fadeInSeconds);
  if (els.audioFadeOut) els.audioFadeOut.value = pad.fadeOutSeconds === "" ? "" : String(pad.fadeOutSeconds);
  if (els.audioPitchSemitones) els.audioPitchSemitones.value = String(pad.pitchSemitones);
  if (els.audioPitchFine) els.audioPitchFine.value = String(pad.pitchFine);
  if (els.audioPitchTotal) {
    const cents = Math.round(pad.pitchFine);
    const semitoneText = `${pad.pitchSemitones >= 0 ? "+" : ""}${pad.pitchSemitones} demi-ton${Math.abs(pad.pitchSemitones) > 1 ? "s" : ""}`;
    const centText = `${cents >= 0 ? "+" : ""}${cents} cents`;
    els.audioPitchTotal.textContent = `${semitoneText} ${centText}`;
  }
  if (els.audioSpeed) els.audioSpeed.value = String(pad.speedRate);
  if (els.audioSpeedValue) els.audioSpeedValue.textContent = `${pad.speedRate.toFixed(2)}x`;
  if (els.audioReverbNone) els.audioReverbNone.checked = pad.reverbMode === "none";
  if (els.audioReverbGlobal) els.audioReverbGlobal.checked = pad.reverbMode !== "none" && pad.reverbMode !== "pad";
  if (els.audioReverbPad) els.audioReverbPad.checked = pad.reverbMode === "pad";
  if (els.audioPadReverbFields) els.audioPadReverbFields.hidden = pad.reverbMode !== "pad";
  if (els.audioReverbPreset) els.audioReverbPreset.value = pad.reverbPreset === "none" ? "hall" : pad.reverbPreset;
  if (els.audioReverbWet) els.audioReverbWet.value = String(pad.reverbWet);
  if (els.audioReverbValue) els.audioReverbValue.textContent = `${Math.round(pad.reverbWet * 100)}%`;
  updateAudioOptionBadges(pad);
  fillAudioCrossfadeControls(pad);
  renderAudioDialogWaveform(pad);
}

function fillAudioCrossfadeControls(pad = state.audioPad) {
  if (!pad) return;
  const actionOptions = '<option value="none">Pas d’effet</option><option value="play">Lance pad ou tag</option><option value="duck">Duck pad ou tag</option><option value="stop">Stoppe pad ou tag</option>';
  if (els.audioStartStopMode) {
    els.audioStartStopMode.innerHTML = actionOptions;
    els.audioStartStopMode.value = pad.startStopMode;
  }
  if (els.audioEndStartMode) {
    els.audioEndStartMode.innerHTML = actionOptions;
    els.audioEndStartMode.value = pad.endStartMode;
  }
  fillCrossfadeTargetSelect(els.audioStartStopTarget, pad.startStopTag);
  fillCrossfadeTargetSelect(els.audioEndStartTarget, pad.endStartTarget);
}

function openAudioDialog(pad) {
  state.audioPad = pad;
  state.audioDraft = audioDraftFromPad(pad);
  syncAudioDialog(pad);
  if (els.audioDialog?.showModal) {
    els.audioDialog.showModal();
    requestAnimationFrame(() => renderAudioDialogWaveform(pad));
  } else {
    setStatus("Réglages audio");
  }
}

function audioDraftFromPad(pad) {
  return {
    normalizeEnabled: pad.normalizeEnabled,
    normalizedGain: pad.normalizedGain,
    mono: pad.mono,
    loop: pad.loop,
    duckTrigger: pad.duckTrigger,
    fadeMode: pad.fadeMode,
    fadeInSeconds: pad.fadeInSeconds,
    fadeOutSeconds: pad.fadeOutSeconds,
    pitchSemitones: pad.pitchSemitones,
    pitchFine: pad.pitchFine,
    reverbPreset: pad.reverbPreset,
    reverbWet: pad.reverbWet,
    reverbMode: pad.reverbMode,
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
    trimStart: pad.trimStart,
    trimEnd: pad.trimEnd,
  };
}

function restoreAudioDraft() {
  const pad = state.audioPad;
  const draft = state.audioDraft;
  if (!pad || !draft) return;
  setPadNormalization(pad, draft.normalizeEnabled, draft.normalizedGain);
  setPadLoop(pad, draft.loop);
  if (pad.source) pad.source.loop = pad.loop;
  setPadDuckTrigger(pad, draft.duckTrigger);
  setPadAudioSettings(pad, draft);
  setPadCrossfade(pad, draft);
  setPadTrim(pad, draft.trimStart, draft.trimEnd);
  if (pad.source) refreshPlayingPadOutput(pad);
  applyDucking();
  syncAudioDialog(pad);
  savePadMeta(pad);
}

function refreshPlayingPadOutput(pad) {
  if (!pad?.source || !state.audioContext) return;
  const offset = playbackOffset(pad);
  playPad(pad, false, offset, { skipStartCrossfade: true }).catch(() => setStatus("Réglage audio impossible"));
}

function resetAudioDialogSettings() {
  const pad = state.audioPad;
  if (!pad) return;
  setPadAudioSettings(pad, {
    fadeMode: "global",
    fadeInSeconds: "",
    fadeOutSeconds: "",
    pitchSemitones: 0,
    pitchFine: 0,
    speedRate: 1,
    reverbPreset: "none",
    reverbWet: 0.5,
    reverbMode: "global",
    mono: false,
  });
  setPadNormalization(pad, true, pad.normalizedGain);
  setPadLoop(pad, false);
  setPadDuckTrigger(pad, false);
  setPadCrossfade(pad, {
    startStopMode: "none",
    startStopTag: "",
    endStartMode: "none",
    endStartTarget: "",
  });
  syncAudioDialog(pad);
  savePadMeta(pad);
}

function resetMasterAudioSettings() {
  if (els.masterFadeInEnabled) els.masterFadeInEnabled.checked = false;
  if (els.masterFadeOutEnabled) els.masterFadeOutEnabled.checked = false;
  if (els.masterDuckEnabled) els.masterDuckEnabled.checked = false;
  if (els.fadeInSeconds) els.fadeInSeconds.value = "2";
  if (els.fadeSeconds) els.fadeSeconds.value = "2";
  if (els.duckPercent) els.duckPercent.value = "60";
  if (els.masterReverbPreset) els.masterReverbPreset.value = "none";
  if (els.masterReverbWet) els.masterReverbWet.value = "0.5";
  localStorage.setItem(MASTER_FADE_IN_ENABLED_STORAGE, "off");
  localStorage.setItem(MASTER_FADE_OUT_ENABLED_STORAGE, "off");
  localStorage.setItem(MASTER_DUCK_ENABLED_STORAGE, "off");
  localStorage.setItem(FADE_IN_STORAGE, "2");
  localStorage.setItem(FADE_OUT_STORAGE, "2");
  localStorage.setItem(DUCKING_STORAGE, "60");
  saveMasterReverbSettings();
  updateMasterReverbValue();
  applyMasterReverb();
  applyDucking();
  updateMasterOptionBadges();
  setStatus("Audio master réinitialisé");
}

function masterAudioDraftFromControls() {
  return {
    fadeInEnabled: Boolean(els.masterFadeInEnabled?.checked),
    fadeOutEnabled: Boolean(els.masterFadeOutEnabled?.checked),
    duckEnabled: Boolean(els.masterDuckEnabled?.checked),
    fadeInSeconds: els.fadeInSeconds?.value ?? "2",
    fadeOutSeconds: els.fadeSeconds?.value ?? "2",
    duckPercent: els.duckPercent?.value ?? "60",
    reverbPreset: els.masterReverbPreset?.value || "none",
    reverbWet: els.masterReverbWet?.value ?? "0.5",
  };
}

function persistMasterAudioControls() {
  localStorage.setItem(MASTER_FADE_IN_ENABLED_STORAGE, els.masterFadeInEnabled?.checked ? "on" : "off");
  localStorage.setItem(MASTER_FADE_OUT_ENABLED_STORAGE, els.masterFadeOutEnabled?.checked ? "on" : "off");
  localStorage.setItem(MASTER_DUCK_ENABLED_STORAGE, els.masterDuckEnabled?.checked ? "on" : "off");
  localStorage.setItem(FADE_IN_STORAGE, String(els.fadeInSeconds?.value ?? "2"));
  localStorage.setItem(FADE_OUT_STORAGE, String(els.fadeSeconds?.value ?? "2"));
  localStorage.setItem(DUCKING_STORAGE, String(els.duckPercent?.value ?? "60"));
  saveMasterReverbSettings();
  updateMasterReverbValue();
  applyMasterReverb();
  applyDucking();
  updateMasterOptionBadges();
  updateAllPadAlerts();
}

function restoreMasterAudioDraft() {
  const draft = state.masterAudioDraft;
  if (!draft) return;
  if (els.masterFadeInEnabled) els.masterFadeInEnabled.checked = draft.fadeInEnabled;
  if (els.masterFadeOutEnabled) els.masterFadeOutEnabled.checked = draft.fadeOutEnabled;
  if (els.masterDuckEnabled) els.masterDuckEnabled.checked = draft.duckEnabled;
  if (els.fadeInSeconds) els.fadeInSeconds.value = draft.fadeInSeconds;
  if (els.fadeSeconds) els.fadeSeconds.value = draft.fadeOutSeconds;
  if (els.duckPercent) els.duckPercent.value = draft.duckPercent;
  if (els.masterReverbPreset) els.masterReverbPreset.value = draft.reverbPreset;
  if (els.masterReverbWet) els.masterReverbWet.value = draft.reverbWet;
  persistMasterAudioControls();
}

function syncImageDialog(pad = state.imagePad) {
  if (!pad) return;
  const livePadRect = pad.node?.getBoundingClientRect();
  if (document.body.dataset.skin === "visual") {
    els.imageDialog?.style.setProperty("--image-pad-aspect", "1 / 1");
  } else if (livePadRect?.width && livePadRect?.height) {
    els.imageDialog?.style.setProperty("--image-pad-aspect", `${livePadRect.width} / ${livePadRect.height}`);
  }
  els.imageDialog?.classList.toggle("is-image-mode", Boolean(pad.visualImage && pad.visualKind !== "sketch"));
  els.imageDialog?.classList.toggle("is-sketch-mode", Boolean(pad.visualImage && pad.visualKind === "sketch"));
  if (els.imagePosX) els.imagePosX.value = String(pad.visualPositionX);
  if (els.imagePosY) els.imagePosY.value = String(pad.visualPositionY);
  if (els.imageZoom) els.imageZoom.value = String(pad.visualZoom);
  if (els.imagePreview) {
    els.imagePreview.classList.toggle("has-image", Boolean(pad.visualImage));
    els.imagePreview.style.backgroundImage = pad.visualImage ? `url("${pad.visualImage}")` : "";
    els.imagePreview.style.backgroundPosition = `${pad.visualPositionX}% ${pad.visualPositionY}%`;
    els.imagePreview.style.backgroundSize = pad.visualZoom <= 1 ? "cover" : `${pad.visualZoom * 100}%`;
  }
  syncImageColorButtons(pad);
}

function openImageDialog(pad) {
  state.imagePad = pad;
  state.imageDraft = imageDraftFromPad(pad);
  if (els.imageColorFrame) els.imageColorFrame.hidden = true;
  syncImageDialog(pad);
  if (els.imageDialog?.showModal) {
    els.imageDialog.showModal();
  } else {
    pad.imageInput?.click();
  }
}

function imageDraftFromPad(pad) {
  return {
    color: pad.color,
    visualImage: pad.visualImage,
    visualImageHidden: pad.visualImageHidden,
    visualKind: pad.visualKind,
    visualPositionX: pad.visualPositionX,
    visualPositionY: pad.visualPositionY,
    visualZoom: pad.visualZoom,
  };
}

function restoreImageDraft() {
  const pad = state.imagePad;
  const draft = state.imageDraft;
  if (!pad || !draft) return;
  setPadColor(pad, draft.color);
  setPadVisualImage(pad, draft.visualImage, draft.visualImageHidden, draft);
  syncImageDialog(pad);
  savePadMeta(pad);
}

function sketchPoint(event) {
  const canvas = els.imageSketchCanvas;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

function bindImageSketch() {
  const canvas = els.imageSketchCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#111319";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    state.sketchDrawing = true;
    canvas.setPointerCapture?.(event.pointerId);
    const point = sketchPoint(event);
    if (!point) return;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (!state.sketchDrawing) return;
    event.preventDefault();
    const point = sketchPoint(event);
    if (!point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  });
  const finish = (event) => {
    if (!state.sketchDrawing) return;
    state.sketchDrawing = false;
    canvas.releasePointerCapture?.(event.pointerId);
    const pad = state.imagePad;
    if (!pad) return;
    setPadVisualImage(pad, canvas.toDataURL("image/png"), false, { visualKind: "sketch" });
    syncImageDialog(pad);
    savePadMeta(pad);
  };
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("pointercancel", finish);
  els.imageSketch?.addEventListener("click", () => {
    ctx.fillStyle = "#111319";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const pad = state.imagePad;
    if (pad) {
      setPadVisualImage(pad, canvas.toDataURL("image/png"), false, { visualKind: "sketch" });
      syncImageDialog(pad);
      savePadMeta(pad);
    }
  });
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
  if (state.audioPad === pad) updateAudioPlayhead(pad);
}

function updateAudioPlayhead(pad = state.audioPad) {
  if (!pad || !els.audioPlayhead) return;
  const duration = playableDuration(pad);
  const ratio = duration ? Math.min(1, Math.max(0, playbackOffset(pad) / duration)) : 0;
  els.audioPlayhead.style.left = `${ratio * 100}%`;
  els.audioPlayhead.hidden = !pad.source;
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
  if (!masterDuckEnabled()) return 0;
  return Math.min(100, Math.max(0, Number(els.duckPercent?.value) || 0)) / 100;
}

function duckFactorForPad(pad) {
  const hasOtherDuckTrigger = state.pads.some((other) => other !== pad && other.source && other.duckTrigger);
  const hasCrossfadeDuck = [...state.crossfadeDucks.values()].some((targets) => targets.has(pad));
  return hasOtherDuckTrigger || hasCrossfadeDuck ? 1 - duckAmount() : 1;
}

function targetPadGain(pad) {
  return pad.volume * (pad.normalizeEnabled ? pad.normalizedGain : 1) * duckFactorForPad(pad);
}

function fadeDurationForPad(pad, type = "out") {
  if (pad.fadeMode === "none") return 0;
  const padValue = type === "in" ? pad.fadeInSeconds : pad.fadeOutSeconds;
  if (pad.fadeMode === "pad") {
    if (padValue !== "" && Number.isFinite(Number(padValue))) {
      return Math.max(0, Number(padValue));
    }
    if (pad.fadeSeconds !== "" && Number.isFinite(Number(pad.fadeSeconds))) {
      return Math.max(0, Number(pad.fadeSeconds));
    }
    return 0;
  }
  if (!masterFadeEnabled(type)) return 0;
  const globalInput = type === "in" ? els.fadeInSeconds : els.fadeSeconds;
  return Math.max(0, Number(globalInput?.value) || 0);
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

function setCrossfadeDuck(sourceKey, targets, durationSeconds = 0) {
  clearCrossfadeDuck(sourceKey, false);
  const activeTargets = targets.filter((pad) => pad?.source);
  if (!activeTargets.length) return;
  state.crossfadeDucks.set(sourceKey, new Set(activeTargets));
  if (durationSeconds > 0) {
    const timer = window.setTimeout(() => clearCrossfadeDuck(sourceKey), durationSeconds * 1000);
    state.crossfadeDuckTimers.set(sourceKey, timer);
  }
  applyDucking();
}

function clearCrossfadeDuck(sourceKey, update = true) {
  const timer = state.crossfadeDuckTimers.get(sourceKey);
  if (timer) window.clearTimeout(timer);
  state.crossfadeDuckTimers.delete(sourceKey);
  state.crossfadeDucks.delete(sourceKey);
  if (update) applyDucking();
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

function flashCrossfadeTarget(pad, stateName) {
  if (!pad?.crossfadeFlashEl) return;
  const el = pad.crossfadeFlashEl;
  el.classList.remove("is-crossfade-start", "is-crossfade-stop", "is-crossfade-flashing");
  void el.offsetWidth;
  el.classList.add(stateName === "start" ? "is-crossfade-start" : "is-crossfade-stop", "is-crossfade-flashing");
  window.setTimeout(() => {
    el.classList.remove("is-crossfade-start", "is-crossfade-stop", "is-crossfade-flashing");
  }, 3300);
}

function executeCrossfadeAction(action, target, sourcePad, options = {}) {
  if (action === "none") return;
  const targets = padsFromCrossfadeTarget(target, sourcePad);
  if (action === "duck") {
    const duration = options.pulse
      ? Math.max(0.5, fadeDurationForPad(sourcePad, "out") || fadeDurationForPad(sourcePad, "in") || 2)
      : 0;
    setCrossfadeDuck(options.pulse ? {} : sourcePad, targets, duration);
    return;
  }
  targets.forEach((targetPad) => {
    if (action === "play" && targetPad.buffer) {
      flashCrossfadeTarget(targetPad, "start");
      playPad(targetPad, true, 0, { skipStartCrossfade: true }).catch(() => setStatus("Crossfade impossible"));
    }
    if (action === "stop" && targetPad.source) {
      stopPad(targetPad, true, false, { triggerEnd: false });
      flashCrossfadeTarget(targetPad, "stop");
    }
  });
}

function executeStartCrossfade(pad) {
  executeCrossfadeAction(pad.startStopMode, pad.startStopTag, pad);
}

function executeEndCrossfade(pad) {
  executeCrossfadeAction(pad.endStartMode, pad.endStartTarget, pad, { pulse: true });
}

function cableColor(action) {
  if (action === "play") return "#49d3a0";
  if (action === "stop") return "#ff5f56";
  if (action === "duck") return "#f6c451";
  return "#8db5ff";
}

function cableLinksForBoard() {
  const links = [];
  state.pads.forEach((sourcePad) => {
    [
      { action: sourcePad.startStopMode, target: sourcePad.startStopTag, phase: "start" },
      { action: sourcePad.endStartMode, target: sourcePad.endStartTarget, phase: "end" },
    ].forEach((rule) => {
      if (rule.action === "none") return;
      padsFromCrossfadeTarget(rule.target, sourcePad).forEach((targetPad) => {
        links.push({ sourcePad, targetPad, action: rule.action, phase: rule.phase });
      });
    });
  });
  return links;
}

function crossfadeTargetLabel(value, exceptPad = null) {
  const target = String(value || "").trim();
  if (!target) return "Choisir";
  if (target === "tag:*") return "Tous";
  if (target.startsWith("tag:")) return `Tag: ${target.slice(4) || "-"}`;
  if (target.startsWith("pad:")) {
    const index = Number(target.slice(4));
    const pad = Number.isInteger(index) ? state.pads[index] : null;
    return pad && pad !== exceptPad ? pad.title : `Pad ${Number.isInteger(index) ? index + 1 : "-"}`;
  }
  const pad = padFromTarget(target, exceptPad);
  return pad ? pad.title : target;
}

function cableActionLabel(action) {
  if (action === "play") return "Lance";
  if (action === "stop") return "Stoppe";
  if (action === "duck") return "Duck";
  return "Action";
}

function cablePhaseLabel(phase) {
  return phase === "end" ? "Arrêt/fin" : "Lancement";
}

function patchBayRows() {
  const rows = [];
  state.pads.forEach((sourcePad) => {
    [
      { action: sourcePad.startStopMode, target: sourcePad.startStopTag, phase: "start" },
      { action: sourcePad.endStartMode, target: sourcePad.endStartTarget, phase: "end" },
    ].forEach((rule) => {
      if (rule.action === "none") return;
      if (!String(rule.target || "").trim()) return;
      rows.push({
        sourcePad,
        action: rule.action,
        phase: rule.phase,
        target: rule.target,
        targetLabel: crossfadeTargetLabel(rule.target, sourcePad),
      });
    });
  });
  return rows;
}

function patchBayNode(className, title, meta) {
  const node = document.createElement("div");
  node.className = className;
  const titleEl = document.createElement("strong");
  titleEl.textContent = title;
  const metaEl = document.createElement("span");
  metaEl.textContent = meta;
  node.append(titleEl, metaEl);
  return node;
}

function drawPatchBayOverlay() {
  if (!els.patchBayCanvas || !els.patchBayOverlay) return;
  const canvasRect = els.patchBayCanvas.getBoundingClientRect();
  els.patchBayOverlay.replaceChildren();
  els.patchBayOverlay.setAttribute("viewBox", `0 0 ${canvasRect.width} ${canvasRect.height}`);

  const rows = [...els.patchBayCanvas.querySelectorAll("[data-patch-row]")];
  rows.forEach((sourceNode) => {
    const rowId = sourceNode.dataset.patchRow;
    const targetNode = els.patchBayCanvas.querySelector(`[data-patch-target="${rowId}"]`);
    if (!targetNode) return;
    const sourceRect = sourceNode.getBoundingClientRect();
    const targetRect = targetNode.getBoundingClientRect();
    const x1 = sourceRect.right - canvasRect.left;
    const y1 = sourceRect.top - canvasRect.top + sourceRect.height / 2;
    const x2 = targetRect.left - canvasRect.left;
    const y2 = targetRect.top - canvasRect.top + targetRect.height / 2;
    const mid = (x1 + x2) / 2;
    const color = sourceNode.dataset.actionColor || "#8db5ff";
    const dashed = sourceNode.dataset.phase === "end" ? "10 8" : "";
    const path = svgEl("path", {
      d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${mid.toFixed(1)} ${y1.toFixed(1)}, ${mid.toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      fill: "none",
      stroke: color,
      "stroke-width": 5,
      "stroke-linecap": "round",
      "stroke-dasharray": dashed,
      opacity: "0.94",
    });
    const plug = svgEl("circle", {
      cx: x1,
      cy: y1,
      r: 5,
      fill: "#101114",
      stroke: color,
      "stroke-width": 3,
    });
    const tip = svgEl("polygon", {
      points: `${x2},${y2} ${x2 - 10},${y2 - 6} ${x2 - 10},${y2 + 6}`,
      fill: color,
    });
    els.patchBayOverlay.append(path, plug, tip);
  });
}

function renderPatchBay() {
  if (!els.patchBaySources || !els.patchBayTargets || !els.patchBayEmpty) return;
  const rows = patchBayRows();
  els.patchBaySources.replaceChildren();
  els.patchBayTargets.replaceChildren();
  els.patchBayEmpty.hidden = rows.length > 0;
  els.patchBayCanvas?.classList.toggle("is-empty", rows.length === 0);

  rows.forEach((row, index) => {
    const id = `patch-${index}`;
    const color = cableColor(row.action);
    const sourceNode = patchBayNode(
      "patch-bay-node patch-source-node",
      row.sourcePad.title,
      `${cablePhaseLabel(row.phase)} · ${cableActionLabel(row.action)}`,
    );
    sourceNode.dataset.patchRow = id;
    sourceNode.dataset.phase = row.phase;
    sourceNode.dataset.actionColor = color;
    sourceNode.style.setProperty("--patch-color", color);

    const targetNode = patchBayNode(
      "patch-bay-node patch-target-node",
      row.targetLabel,
      `${cableActionLabel(row.action)} depuis ${row.sourcePad.title}`,
    );
    targetNode.dataset.patchTarget = id;
    targetNode.style.setProperty("--patch-color", color);

    els.patchBaySources.append(sourceNode);
    els.patchBayTargets.append(targetNode);
  });
  requestAnimationFrame(drawPatchBayOverlay);
}

function openPatchBayDialog() {
  renderPatchBay();
  if (els.patchBayDialog?.showModal) {
    els.patchBayDialog.showModal();
    requestAnimationFrame(drawPatchBayOverlay);
  }
}

function svgEl(name, attributes = {}) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

function drawCableOverlay() {
  if (!els.cableOverlay || !els.pads) return;
  const deck = els.pads.closest(".deck");
  if (!deck) return;
  deck.style.setProperty("--cable-extra-bottom", "0px");
  const deckRect = deck.getBoundingClientRect();
  els.cableOverlay.replaceChildren();

  const links = cableLinksForBoard().slice(0, 80);
  let maxCableY = deckRect.height;
  links.forEach((link, index) => {
    const sourceRect = link.sourcePad.node.getBoundingClientRect();
    const targetRect = link.targetPad.node.getBoundingClientRect();
    if (!sourceRect.width || !targetRect.width) return;

    const x1 = sourceRect.left - deckRect.left + sourceRect.width / 2;
    const y1 = sourceRect.bottom - deckRect.top - 6;
    const x2 = targetRect.left - deckRect.left + targetRect.width / 2;
    const y2 = targetRect.bottom - deckRect.top - 6;
    const sag = Math.max(y1, y2) + 42 + (index % 4) * 12;
    maxCableY = Math.max(maxCableY, sag + 18, y1 + 18, y2 + 18);
    const color = cableColor(link.action);
    const path = svgEl("path", {
      d: `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${x1.toFixed(1)} ${sag.toFixed(1)}, ${x2.toFixed(1)} ${sag.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      fill: "none",
      stroke: color,
      "stroke-width": link.phase === "end" ? 2.5 : 3.5,
      "stroke-linecap": "round",
      "stroke-dasharray": link.phase === "end" ? "12 9" : "",
      opacity: "0.92",
    });
    const sourcePlug = svgEl("circle", {
      cx: x1,
      cy: y1,
      r: 4,
      fill: "#101114",
      stroke: color,
      "stroke-width": 2,
    });
    const targetTip = svgEl("polygon", {
      points: `${x2},${y2 - 2} ${x2 - 5},${y2 + 7} ${x2 + 5},${y2 + 7}`,
      fill: color,
      opacity: "0.96",
    });
    els.cableOverlay.append(path, sourcePlug, targetTip);
  });
  const extraBottom = Math.max(0, Math.ceil(maxCableY - deckRect.height));
  deck.style.setProperty("--cable-extra-bottom", `${extraBottom}px`);
  els.cableOverlay.setAttribute("viewBox", `0 0 ${deckRect.width} ${Math.ceil(deckRect.height + extraBottom)}`);
  positionCableLegend();
}

function positionCableLegend() {
  if (!els.cableLegend || !document.body.classList.contains("show-cables")) return;
  const firstPad = state.pads.find((pad) => pad.node?.isConnected)?.node;
  const master = document.querySelector(".master-strip");
  const anchorRect = (firstPad || els.pads || document.body).getBoundingClientRect();
  const masterRect = (master || document.querySelector(".topbar") || document.body).getBoundingClientRect();
  const legendRect = els.cableLegend.getBoundingClientRect();
  const left = Math.max(8, Math.min(anchorRect.left, window.innerWidth - legendRect.width - 8));
  const top = Math.max(8, masterRect.bottom - legendRect.height);
  els.cableLegend.style.left = `${left}px`;
  els.cableLegend.style.top = `${top}px`;
}

function setCableOverlayVisible(visible) {
  document.body.classList.toggle("show-cables", Boolean(visible));
  els.showCables?.classList.toggle("is-active", Boolean(visible));
  els.showCables?.setAttribute("aria-pressed", String(Boolean(visible)));
  if (visible) drawCableOverlay();
  if (!visible) {
    els.pads?.closest(".deck")?.style.removeProperty("--cable-extra-bottom");
    if (els.cableLegend) {
      els.cableLegend.style.left = "";
      els.cableLegend.style.top = "";
    }
  }
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

function masterReverbSettings() {
  return {
    preset: Object.prototype.hasOwnProperty.call(REVERB_PRESETS, els.masterReverbPreset?.value) ? els.masterReverbPreset.value : "none",
    wet: Math.min(1, Math.max(0, Number(els.masterReverbWet?.value ?? 0.5))),
  };
}

function saveMasterReverbSettings() {
  localStorage.setItem(MASTER_REVERB_STORAGE, JSON.stringify(masterReverbSettings()));
}

function loadMasterReverbSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(MASTER_REVERB_STORAGE)) || {};
  } catch {
    saved = {};
  }
  if (els.masterReverbPreset) els.masterReverbPreset.value = Object.prototype.hasOwnProperty.call(REVERB_PRESETS, saved.preset) ? saved.preset : "none";
  if (els.masterReverbWet) els.masterReverbWet.value = String(Math.min(1, Math.max(0, Number(saved.wet ?? 0.5))));
  const savedFadeInEnabled = localStorage.getItem(MASTER_FADE_IN_ENABLED_STORAGE);
  const savedFadeOutEnabled = localStorage.getItem(MASTER_FADE_OUT_ENABLED_STORAGE);
  const savedDuckEnabled = localStorage.getItem(MASTER_DUCK_ENABLED_STORAGE);
  if (els.masterFadeInEnabled) els.masterFadeInEnabled.checked = savedFadeInEnabled == null ? true : savedFadeInEnabled === "on";
  if (els.masterFadeOutEnabled) els.masterFadeOutEnabled.checked = savedFadeOutEnabled == null ? true : savedFadeOutEnabled === "on";
  if (els.masterDuckEnabled) els.masterDuckEnabled.checked = savedDuckEnabled == null ? true : savedDuckEnabled === "on";
  updateMasterReverbValue();
}

function updateMasterReverbValue() {
  if (els.masterReverbValue) els.masterReverbValue.textContent = `${Math.round((Number(els.masterReverbWet?.value) || 0) * 100)}%`;
  updateMasterOptionBadges();
}

function applyMasterReverb() {
  if (!state.audioContext || !state.masterDry || !state.masterWet || !state.masterConvolver) return;
  const { preset, wet } = masterReverbSettings();
  const activeWet = preset === "none" ? 0 : wet;
  state.masterConvolver.buffer = reverbImpulse(preset);
  state.masterDry.gain.value = 1 - activeWet;
  state.masterWet.gain.value = activeWet;
  updateMasterReverbValue();
}

function padHasPadReverb(pad) {
  return pad.reverbMode === "pad" && pad.reverbPreset !== "none" && pad.reverbWet > 0;
}

function connectPadOutput(pad, pan, analyser) {
  const hasPadReverb = padHasPadReverb(pad);
  const output = hasPadReverb || pad.reverbMode === "none" ? state.masterBypassGain : state.masterGain;
  if (!state.audioContext || !hasPadReverb) {
    pan.connect(analyser).connect(output);
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
  analyser.connect(output);
  pad.reverbNodes = { dry, wet, convolver };
}

function connectSourceToGain(pad, source, gain) {
  if (!pad.mono || !state.audioContext || (pad.buffer?.numberOfChannels || 1) < 2) {
    source.connect(gain);
    return;
  }
  const splitter = state.audioContext.createChannelSplitter(2);
  const merger = state.audioContext.createChannelMerger(2);
  const left = state.audioContext.createGain();
  const right = state.audioContext.createGain();
  left.gain.value = 0.5;
  right.gain.value = 0.5;
  source.connect(splitter);
  splitter.connect(left, 0);
  splitter.connect(right, 1);
  left.connect(merger, 0, 0);
  right.connect(merger, 0, 0);
  left.connect(merger, 0, 1);
  right.connect(merger, 0, 1);
  merger.connect(gain);
  pad.monoNodes = { splitter, merger, left, right };
}

function clearPlayingPad(pad, source, triggerEnd = false) {
  if (source && pad.source !== source) return;
  pad.source = null;
  pad.gain = null;
  pad.pan = null;
  pad.analyser = null;
  pad.meterData = null;
  pad.reverbNodes = null;
  pad.monoNodes = null;
  pad.stopAt = 0;
  clearCrossfadeDuck(pad, false);
  pad.node.classList.remove("is-playing");
  updatePadModeButtons(pad);
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
  const naturalDuration = Math.max(0.01, segmentEnd - startOffset);
  const naturalStopAt = now + naturalDuration;
  const naturalFadeOutTime = !pad.loop ? Math.min(fadeDurationForPad(pad, "out"), naturalDuration) : 0;
  const naturalFadeOutStart = naturalStopAt - naturalFadeOutTime;
  const effectiveFadeInTime = fade && fadeTime > 0
    ? Math.min(fadeTime, naturalFadeOutTime > 0 ? Math.max(0, naturalFadeOutStart - now) : naturalDuration)
    : 0;
  const targetGain = targetPadGain(pad);

  analyser.fftSize = 256;
  source.buffer = pad.buffer;
  source.loop = pad.loop;
  source.loopStart = segmentStart;
  source.loopEnd = segmentEnd;
  source.playbackRate.setValueAtTime(1, now);
  if (source.detune) source.detune.setValueAtTime((pad.pitchSemitones + pad.pitchFine / 100) * 100, now);
  gain.gain.setValueAtTime(effectiveFadeInTime > 0 ? 0 : targetGain, now);
  pan.pan.setValueAtTime(pad.panValue, now);
  connectSourceToGain(pad, source, gain);
  gain.connect(pan);
  connectPadOutput(pad, pan, analyser);

  if (effectiveFadeInTime > 0) {
    gain.gain.linearRampToValueAtTime(targetGain, now + effectiveFadeInTime);
  }

  if (naturalFadeOutTime > 0) {
    if (naturalFadeOutStart > now + effectiveFadeInTime) {
      gain.gain.setValueAtTime(targetGain, naturalFadeOutStart);
    }
    gain.gain.linearRampToValueAtTime(0.0001, naturalStopAt);
  }

  pad.source = source;
  pad.gain = gain;
  pad.pan = pan;
  pad.analyser = analyser;
  pad.meterData = new Uint8Array(analyser.fftSize);
  pad.startedAt = now - segmentOffset;
  pad.stopAt = 0;
  pad.keepResumeOffsetOnEnd = false;
  pad.node.classList.add("is-playing");
  updatePadModeButtons(pad);
  updatePadTime(pad);
  startTimer();
  setStatus(`${pad.title} joue`);

  source.onended = () => {
    if (pad.source === source) {
      if (!pad.keepResumeOffsetOnEnd) pad.resumeOffset = 0;
      pad.keepResumeOffsetOnEnd = false;
      clearPlayingPad(pad, source, !pad.loop);
    }
  };

  source.start(now, startOffset);
  if (!pad.loop) {
    source.stop(naturalStopAt);
  }
  applyDucking(pad);
  updateAllPadAlerts();
}

function stopPad(pad, fade = false, preservePosition = false, options = {}) {
  if (!pad.source || !state.audioContext) return;
  if (pad.stopAt) return;

  const source = pad.source;
  const gain = pad.gain;
  const now = state.audioContext.currentTime;
  const fadeTime = fadeDurationForPad(pad, "out");
  if (preservePosition && pad.duration) {
    const elapsed = Math.max(0, (now - pad.startedAt) * pad.speedRate);
    const duration = playableDuration(pad);
    pad.resumeOffset = pad.loop ? elapsed % duration : Math.min(elapsed, duration);
    pad.keepResumeOffsetOnEnd = true;
  } else {
    pad.resumeOffset = 0;
    pad.keepResumeOffsetOnEnd = false;
  }

  if (fade && fadeTime > 0 && gain) {
    if (typeof gain.gain.cancelAndHoldAtTime === "function") {
      gain.gain.cancelAndHoldAtTime(now);
    } else {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value || targetPadGain(pad)), now);
    }
    gain.gain.linearRampToValueAtTime(0.0001, now + fadeTime);
    try {
      source.stop(now + fadeTime + 0.02);
    } catch {
      clearPlayingPad(pad, source, options.triggerEnd ?? true);
      return;
    }
    pad.stopAt = now + fadeTime + 0.02;
    setStatus(`${pad.title} fade out`);
  } else {
    try {
      source.stop(now);
    } catch {
      clearPlayingPad(pad, source, options.triggerEnd ?? true);
      return;
    }
    pad.stopAt = now;
    clearPlayingPad(pad, source, options.triggerEnd ?? true);
    setStatus(`${pad.title} stop`);
  }
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
    if (button.classList.contains("pad-trigger")) return;
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
    stopPad(pad, fadeDurationForPad(pad, "out") > 0, pad.playMode === "toggle");
  } else {
    const offset = pad.playMode === "toggle" ? pad.resumeOffset : 0;
    playPad(pad, fadeDurationForPad(pad, "in") > 0, offset);
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
  setStatus(pads.length ? `Groupe ${tag} stoppé` : `Aucun pad joue: ${tag}`);
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
        playPad(state.pads[index], fadeDurationForPad(state.pads[index], "in") > 0, 0);
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
      stopPad(state.pads[index], fadeDurationForPad(state.pads[index], "out") > 0);
    }
  });
}

async function init() {
  state.db = await openDb();
  applySkin(localStorage.getItem(SKIN_STORAGE) || "classic");
  if (els.fadeSeconds) {
    els.fadeSeconds.value = localStorage.getItem(FADE_OUT_STORAGE) || els.fadeSeconds.value;
  }
  if (els.fadeInSeconds) {
    els.fadeInSeconds.value = localStorage.getItem(FADE_IN_STORAGE) || els.fadeInSeconds.value;
  }
  if (els.duckPercent) {
    els.duckPercent.value = localStorage.getItem(DUCKING_STORAGE) || els.duckPercent.value;
  }
  loadMasterReverbSettings();
  state.boards = loadBoards();
  state.currentBoardId = localStorage.getItem(CURRENT_BOARD_STORAGE) || DEFAULT_BOARD_ID;
  if (!state.boards.some((board) => board.id === state.currentBoardId)) {
    state.currentBoardId = state.boards[0].id;
  }
  renderBoardOptions();
  await renderPads();
  await repairAccidentalPadTitles();
  setStageMode(localStorage.getItem(STAGE_MODE_STORAGE) === "on", false);
  updateMasterOptionBadges();

  els.masterVolume.addEventListener("input", async () => {
    await ensureAudio();
    setMasterVolume(els.masterVolume.value);
  });
  els.skinSelect?.addEventListener("change", () => applySkin(els.skinSelect.value));
  els.boardTagFilter?.addEventListener("change", () => applyBoardTagFilter());
  els.padColumns?.addEventListener("input", updateBoardLayout);
  els.padColumns?.addEventListener("change", updateBoardLayout);
  els.showCables?.addEventListener("click", () => setCableOverlayVisible(!document.body.classList.contains("show-cables")));
  window.matchMedia("(max-width: 950px), (pointer: coarse)").addEventListener?.("change", () => {
    applySkin(localStorage.getItem(SKIN_STORAGE) || "classic");
  });
  window.addEventListener("resize", () => {
    state.pads.forEach(renderWaveform);
    if (document.body.classList.contains("show-cables")) drawCableOverlay();
  });
  els.duckPercent?.addEventListener("input", () => {
    const value = Math.round(duckAmount() * 100);
    localStorage.setItem(DUCKING_STORAGE, String(value));
    applyDucking();
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.duckPercent?.addEventListener("change", () => {
    const value = Math.round(duckAmount() * 100);
    els.duckPercent.value = value;
    localStorage.setItem(DUCKING_STORAGE, String(value));
    applyDucking();
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.fadeInSeconds?.addEventListener("input", () => {
    const value = Math.max(0, Math.round(Number(els.fadeInSeconds.value) || 0));
    els.fadeInSeconds.value = String(value);
    localStorage.setItem(FADE_IN_STORAGE, String(value));
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.fadeInSeconds?.addEventListener("change", () => {
    const value = Math.max(0, Math.round(Number(els.fadeInSeconds.value) || 0));
    els.fadeInSeconds.value = String(value);
    localStorage.setItem(FADE_IN_STORAGE, String(value));
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.fadeSeconds?.addEventListener("input", () => {
    const value = Math.max(0, Math.round(Number(els.fadeSeconds.value) || 0));
    els.fadeSeconds.value = String(value);
    localStorage.setItem(FADE_OUT_STORAGE, String(value));
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.fadeSeconds?.addEventListener("change", () => {
    const value = Math.max(0, Math.round(Number(els.fadeSeconds.value) || 0));
    els.fadeSeconds.value = String(value);
    localStorage.setItem(FADE_OUT_STORAGE, String(value));
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.stopGroupSelect?.addEventListener("change", () => {
    localStorage.setItem(STOP_GROUP_STORAGE, els.stopGroupSelect.value || "");
  });
  els.stopAll.addEventListener("click", stopAll);
  els.stopGroup?.addEventListener("click", stopGroup);
  els.stageMode?.addEventListener("click", () => {
    setStageMode(!state.stageMode, true);
  });
  els.editPads?.addEventListener("click", () => {
    if (state.boardEditMode) {
      setBoardPadEditing(false);
      return;
    }
    beginBoardEdit().catch(() => setStatus("Mode edit impossible"));
  });
  els.cancelBoardEdit?.addEventListener("click", openCancelBoardEditDialog);
  els.keepBoardEdit?.addEventListener("click", () => els.cancelEditDialog?.close());
  els.confirmCancelBoardEdit?.addEventListener("click", () => {
    els.cancelEditDialog?.close();
    cancelBoardEdit().catch(() => setStatus("Annulation impossible"));
  });
  els.cancelEditDialog?.addEventListener("click", (event) => {
    if (event.target === els.cancelEditDialog) els.cancelEditDialog.close();
  });
  els.patchBay?.addEventListener("click", openPatchBayDialog);
  els.closePatchBay?.addEventListener("click", () => els.patchBayDialog?.close());
  els.patchBayDialog?.addEventListener("click", (event) => {
    if (event.target === els.patchBayDialog) els.patchBayDialog.close();
  });
  window.addEventListener("resize", () => {
    if (els.patchBayDialog?.open) drawPatchBayOverlay();
    if (document.body.classList.contains("show-cables")) {
      drawCableOverlay();
      positionCableLegend();
    }
  });
  els.bulkEditPads?.addEventListener("click", openBulkEditDialog);
  els.closeBulkEdit?.addEventListener("click", () => els.bulkEditDialog?.close());
  els.cancelBulkEdit?.addEventListener("click", () => els.bulkEditDialog?.close());
  els.bulkEditDialog?.addEventListener("click", (event) => {
    if (event.target === els.bulkEditDialog) els.bulkEditDialog.close();
  });
  els.bulkTemplatePad?.addEventListener("change", () => {
    const pad = state.bulkEditPads.find((item) => String(item.index) === els.bulkTemplatePad.value);
    syncBulkTemplateFields(pad);
  });
  els.bulkColorButtons?.forEach((button) => {
    button.addEventListener("click", () => setBulkColorValue(button.dataset.bulkColor || ""));
  });
  els.applyBulkEdit?.addEventListener("click", () => {
    applyBulkEdit().catch(() => setStatus("Modification groupée impossible"));
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
  els.duplicateBoard?.addEventListener("click", duplicateCurrentBoard);
  els.boardNotice?.addEventListener("click", exportBoardNotice);
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
  els.applyAudio?.addEventListener("click", () => {
    if (state.audioPad) savePadMeta(state.audioPad);
    state.audioDraft = null;
    els.audioDialog?.close();
  });
  els.cancelAudio?.addEventListener("click", () => {
    restoreAudioDraft();
    state.audioDraft = null;
    els.audioDialog?.close();
  });
  els.masterAudio?.addEventListener("click", () => {
    state.masterAudioDraft = masterAudioDraftFromControls();
    if (els.masterAudioDialog?.showModal) {
      els.masterAudioDialog.showModal();
    } else {
      setStatus("Audio master");
    }
  });
  els.closeMasterAudio?.addEventListener("click", () => els.masterAudioDialog?.close());
  els.applyMasterAudio?.addEventListener("click", () => {
    state.masterAudioDraft = null;
    els.masterAudioDialog?.close();
  });
  els.cancelMasterAudio?.addEventListener("click", () => {
    restoreMasterAudioDraft();
    state.masterAudioDraft = null;
    els.masterAudioDialog?.close();
  });
  els.masterAudioReset?.addEventListener("click", resetMasterAudioSettings);
  els.masterAudioDialog?.addEventListener("click", (event) => {
    if (event.target === els.masterAudioDialog) {
      restoreMasterAudioDraft();
      state.masterAudioDraft = null;
      els.masterAudioDialog.close();
    }
  });
  els.masterFadeInEnabled?.addEventListener("change", () => {
    localStorage.setItem(MASTER_FADE_IN_ENABLED_STORAGE, els.masterFadeInEnabled.checked ? "on" : "off");
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.masterFadeOutEnabled?.addEventListener("change", () => {
    localStorage.setItem(MASTER_FADE_OUT_ENABLED_STORAGE, els.masterFadeOutEnabled.checked ? "on" : "off");
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.masterDuckEnabled?.addEventListener("change", () => {
    localStorage.setItem(MASTER_DUCK_ENABLED_STORAGE, els.masterDuckEnabled.checked ? "on" : "off");
    applyDucking();
    updateMasterOptionBadges();
  });
  [els.masterReverbPreset, els.masterReverbWet].forEach((element) => {
    element?.addEventListener("input", () => {
      saveMasterReverbSettings();
      applyMasterReverb();
    });
  });
  els.audioDialog?.addEventListener("click", (event) => {
    if (event.target === els.audioDialog) {
      restoreAudioDraft();
      state.audioDraft = null;
      els.audioDialog.close();
    }
  });
  bindAudioDialogTrim();
  els.audioTestPlay?.addEventListener("click", () => {
    if (state.audioPad) playPad(state.audioPad, false, playbackOffset(state.audioPad)).catch(() => setStatus("Test audio impossible"));
  });
  els.audioTestStop?.addEventListener("click", () => {
    if (state.audioPad) stopPad(state.audioPad, false);
  });
  els.audioRecord?.addEventListener("click", () => {
    if (state.audioPad) toggleRecording(state.audioPad);
  });
  els.audioImport?.addEventListener("click", () => {
    if (state.audioPad) state.audioPad.fileInput?.click();
  });
  els.audioReset?.addEventListener("click", resetAudioDialogSettings);
  els.audioNormalize?.addEventListener("change", () => {
    if (!state.audioPad) return;
    setPadNormalization(state.audioPad, els.audioNormalize.checked, state.audioPad.normalizedGain);
    if (state.audioPad.gain && state.audioContext) {
      state.audioPad.gain.gain.setTargetAtTime(targetPadGain(state.audioPad), state.audioContext.currentTime, 0.015);
    }
    syncAudioDialog(state.audioPad);
    savePadMeta(state.audioPad);
  });
  els.audioMono?.addEventListener("change", () => {
    if (!state.audioPad) return;
    if (state.audioPad.buffer?.numberOfChannels === 1) {
      syncAudioDialog(state.audioPad);
      return;
    }
    setPadAudioSettings(state.audioPad, { mono: els.audioMono.checked });
    refreshPlayingPadOutput(state.audioPad);
    syncAudioDialog(state.audioPad);
    savePadMeta(state.audioPad);
  });
  els.audioLoop?.addEventListener("click", () => {
    if (!state.audioPad) return;
    setPadLoop(state.audioPad, !state.audioPad.loop);
    if (state.audioPad.source) state.audioPad.source.loop = state.audioPad.loop;
    syncAudioDialog(state.audioPad);
    savePadMeta(state.audioPad);
  });
  els.audioDuck?.addEventListener("click", () => {
    if (!state.audioPad) return;
    setPadDuckTrigger(state.audioPad, !state.audioPad.duckTrigger);
    applyDucking();
    syncAudioDialog(state.audioPad);
    savePadMeta(state.audioPad);
  });
  [els.audioFadeNone, els.audioFadeGlobal, els.audioFadePad].forEach((element) => {
    element?.addEventListener("change", () => {
      if (!state.audioPad) return;
      const nextMode = els.audioFadeNone?.checked ? "none" : (els.audioFadePad?.checked ? "pad" : "global");
      if (nextMode === "pad") {
        if (state.audioPad.fadeInSeconds === "") state.audioPad.fadeInSeconds = 2;
        if (state.audioPad.fadeOutSeconds === "") state.audioPad.fadeOutSeconds = 2;
      }
      setPadAudioSettings(state.audioPad, {
        fadeMode: nextMode,
        fadeInSeconds: state.audioPad.fadeInSeconds,
        fadeOutSeconds: state.audioPad.fadeOutSeconds,
      });
      syncAudioDialog(state.audioPad);
      savePadMeta(state.audioPad);
    });
  });
  [els.audioReverbNone, els.audioReverbGlobal, els.audioReverbPad].forEach((element) => {
    element?.addEventListener("change", () => {
      if (!state.audioPad) return;
      setPadAudioSettings(state.audioPad, {
        reverbMode: els.audioReverbNone?.checked ? "none" : (els.audioReverbPad?.checked ? "pad" : "global"),
        reverbPreset: state.audioPad.reverbPreset === "none" ? "hall" : state.audioPad.reverbPreset,
        reverbWet: state.audioPad.reverbWet,
      });
      refreshPlayingPadOutput(state.audioPad);
      syncAudioDialog(state.audioPad);
      savePadMeta(state.audioPad);
    });
  });
  [els.audioFadeIn, els.audioFadeOut, els.audioPitchSemitones, els.audioPitchFine, els.audioReverbPreset, els.audioReverbWet].forEach((element) => {
    element?.addEventListener("input", () => {
      if (!state.audioPad) return;
      setPadAudioSettings(state.audioPad, {
        fadeMode: els.audioFadeNone?.checked ? "none" : (els.audioFadePad?.checked ? "pad" : "global"),
        fadeInSeconds: els.audioFadeIn?.value,
        fadeOutSeconds: els.audioFadeOut?.value,
        pitchSemitones: els.audioPitchSemitones?.value,
        pitchFine: els.audioPitchFine?.value,
        reverbMode: els.audioReverbNone?.checked ? "none" : (els.audioReverbPad?.checked ? "pad" : "global"),
        reverbPreset: els.audioReverbPreset?.value,
        reverbWet: els.audioReverbWet?.value,
      });
      if (state.audioPad.source && state.audioContext) {
        const now = state.audioContext.currentTime;
        state.audioPad.source.detune?.setTargetAtTime((state.audioPad.pitchSemitones + state.audioPad.pitchFine / 100) * 100, now, 0.015);
        if (element === els.audioReverbPreset || element === els.audioReverbWet) {
          refreshPlayingPadOutput(state.audioPad);
        }
      }
      syncAudioDialog(state.audioPad);
      savePadMeta(state.audioPad);
    });
  });
  [els.audioStartStopMode, els.audioStartStopTarget, els.audioEndStartMode, els.audioEndStartTarget].forEach((element) => {
    element?.addEventListener("input", () => {
      if (!state.audioPad) return;
      if (els.audioStartStopMode?.value === "none" && els.audioStartStopTarget) els.audioStartStopTarget.value = "";
      if (els.audioEndStartMode?.value === "none" && els.audioEndStartTarget) els.audioEndStartTarget.value = "";
      setPadCrossfade(state.audioPad, {
        startStopMode: els.audioStartStopMode?.value,
        startStopTag: els.audioStartStopTarget?.value,
        endStartMode: els.audioEndStartMode?.value,
        endStartTarget: els.audioEndStartTarget?.value,
      });
      savePadMeta(state.audioPad);
    });
  });
  els.closeImage?.addEventListener("click", () => els.imageDialog?.close());
  els.applyImage?.addEventListener("click", () => {
    if (state.imagePad) savePadMeta(state.imagePad);
    state.imageDraft = null;
    els.imageDialog?.close();
  });
  els.cancelImage?.addEventListener("click", () => {
    restoreImageDraft();
    state.imageDraft = null;
    els.imageDialog?.close();
  });
  els.imageDialog?.addEventListener("click", (event) => {
    if (event.target === els.imageDialog) {
      restoreImageDraft();
      state.imageDraft = null;
      els.imageDialog.close();
    }
  });
  els.imageColorToggle?.addEventListener("click", () => {
    if (!els.imageColorFrame) return;
    els.imageColorFrame.hidden = !els.imageColorFrame.hidden;
  });
  els.imageColorButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      const pad = state.imagePad;
      if (!pad) return;
      setPadColor(pad, button.dataset.imageColor || "");
      if (!button.dataset.imageColor) setPadVisualImage(pad, "", false);
      syncImageDialog(pad);
      savePadMeta(pad);
    });
  });
  els.imageLibrary?.addEventListener("click", () => state.imagePad?.imageInput?.click());
  els.imageCamera?.addEventListener("click", () => state.imagePad?.cameraInput?.click());
  els.imageRemove?.addEventListener("click", () => {
    const pad = state.imagePad;
    if (!pad) return;
    setPadVisualImage(pad, "", false);
    syncImageDialog(pad);
    savePadMeta(pad);
  });
  [els.imagePosX, els.imagePosY, els.imageZoom].forEach((element) => {
    element?.addEventListener("input", () => {
      const pad = state.imagePad;
      if (!pad) return;
      setPadVisualImage(pad, pad.visualImage, pad.visualImageHidden, {
        visualPositionX: els.imagePosX?.value,
        visualPositionY: els.imagePosY?.value,
        visualZoom: els.imageZoom?.value,
      });
      syncImageDialog(pad);
      savePadMeta(pad);
    });
  });
  bindImageSketch();
  els.shortcutEnabled?.addEventListener("change", () => {
    state.shortcutsEnabled = els.shortcutEnabled.checked;
    updateShortcutIndicators();
  });
  els.keyboardShortcuts?.addEventListener("click", () => {
    renderShortcutRows();
    state.shortcutDraft = shortcutDraftFromState();
    if (els.shortcutDialog?.showModal) {
      els.shortcutDialog.showModal();
    } else {
      setStatus("Raccourcis clavier");
    }
  });
  els.closeShortcuts?.addEventListener("click", () => els.shortcutDialog?.close());
  els.applyShortcuts?.addEventListener("click", () => {
    saveShortcutDraft();
    els.shortcutDialog?.close();
  });
  els.cancelShortcuts?.addEventListener("click", () => {
    restoreShortcutDraft();
    state.shortcutDraft = null;
    els.shortcutDialog?.close();
  });
  els.shortcutDialog?.addEventListener("click", (event) => {
    if (event.target === els.shortcutDialog) {
      restoreShortcutDraft();
      state.shortcutDraft = null;
      els.shortcutDialog.close();
    }
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
