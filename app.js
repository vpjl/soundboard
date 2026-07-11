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
const ARMED_CROSSFADE_ENABLED_STORAGE = "soundboard-live-armed-crossfade-enabled";
const ARMED_CROSSFADE_SECONDS_STORAGE = "soundboard-live-armed-crossfade-seconds";
const MASTER_REVERB_STORAGE = "soundboard-live-master-reverb";
const MASTER_EQ_STORAGE = "soundboard-live-master-eq";
const STOP_GROUP_STORAGE = "soundboard-live-stop-group";
const SKIN_STORAGE = "soundboard-live-skin";
const CUSTOM_SKINS_STORAGE = "soundboard-live-custom-skins";
const CUSTOM_SKIN_PREFIX = "custom:";

const CUSTOM_SKIN_VARIABLES = [
  "--color_ui_background",
  "--color_ui_background_glow",
  "--color_ui_background_secondary",
  "--color_ui_panel",
  "--color_ui_panel_secondary",
  "--color_ui_frame_background",
  "--color_ui_text",
  "--color_ui_text_muted",
  "--color_ui_button_icon",
  "--color_ui_border",
  "--color_ui_shadow",
  "--color_status_success",
  "--color_status_progress",
  "--color_status_warning",
  "--color_status_danger",
  "--color_status_stop",
  "--color_status_neutral",
  "--color_ui_help",
  "--color_ui_help_border",
  "--color_ui_help_background",
  "--color_pad_background",
  "--color_pad_border",
  "--color_pad_button_background",
  "--color_pad_button_border",
  "--color_pad_button_text",
  "--color_pad_title_text",
  "--color_pad_trigger_background",
  "--color_pad_trigger_playing_background",
  "--color_pad_progress_background",
  "--color_pad_progress_fill",
  "--color_pad_alert_background",
  "--color_pad_note_background",
  "--color_pad_note_overlay_background",
  "--color_pad_note_overlay_border",
  "--color_pad_note_overlay_text",
  "--color_pad_tag_background",
  "--color_pad_missing_background",
];

// Alias historiques (--muted, --text, --line…) définis à :root par `var(--color_*)`.
// Un custom property avec var() est résolu là où il est DÉCLARÉ (:root) puis hérité :
// re-poser --color_* plus bas (skin perso / preview de l'éditeur) ne met donc PAS l'alias
// à jour → réglages « sans action ». On re-déclare les alias sur le même root : `var(--color_*)`
// s'y re-résout alors à chaque changement de la couleur correspondante.
const SKIN_VAR_ALIASES = {
  "--color_ui_background": "--bg",
  "--color_ui_background_glow": "--bg-glow",
  "--color_ui_background_secondary": "--bg-end",
  "--color_ui_panel": "--panel",
  "--color_ui_panel_secondary": "--panel-2",
  "--color_ui_text": "--text",
  "--color_ui_text_muted": "--muted",
  "--color_ui_border": "--line",
  "--color_status_success": "--accent",
  "--color_status_progress": "--accent-2",
  "--color_status_stop": "--stop",
  "--color_status_danger": "--danger",
  "--color_ui_shadow": "--shadow",
};
function reapplySkinAliases(root) {
  if (!root) return;
  Object.entries(SKIN_VAR_ALIASES).forEach(([colorVar, alias]) => {
    root.style.setProperty(alias, `var(${colorVar})`);
  });
}
function clearSkinAliases(root) {
  if (!root) return;
  Object.values(SKIN_VAR_ALIASES).forEach((alias) => root.style.removeProperty(alias));
}
const SKIN_HARMONY_STORAGE = "soundboard-skin-harmony";
const SKIN_FONTS_STORAGE = "soundboard-skin-fonts";
const STAGE_MODE_STORAGE = "soundboard-live-stage-mode";
const BOARD_EDIT_MODE_STORAGE = "soundboard-live-board-edit-mode";
const STAGE_LOCK_STORAGE = "soundboard-live-stage-lock";
const SHORTCUTS_STORAGE_PREFIX = "soundboard-live-shortcuts";
const SHORTCUTS_ENABLED_STORAGE_PREFIX = "soundboard-live-shortcuts-enabled";
const CUE_OUTPUT_STORAGE = "soundboard-live-cue-output";
const MASTER_OUTPUT_STORAGE = "soundboard-live-master-output";
const CUE_VOLUME_STORAGE = "soundboard-live-cue-volume";
const MICROPHONE_STORAGE = "soundboard-live-microphone";
const ORPHAN_AUDIO_PREFIX = "orphan-audio-";
const DEFAULT_BOARD_ID = "default";
const DEFAULT_MASTER_VOLUME = 0.6;
const DEFAULT_CUE_VOLUME = 0.6;
const DEFAULT_TEXT_RATE = 0.85;
const MIN_TEXT_RATE = 0.35;
const MAX_TEXT_RATE = 1.6;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const DEFAULT_ENDING_ALERT_SECONDS = 10;
const ENDING_ALERT_STORAGE = "soundboard-live-ending-alert-seconds";
const HISTORY_LIMIT = 8;
const PAD_COLORS = {
  white: "#f7f7f2",
  lightGrey: "#c7ccd4",
  darkGrey: "#343842",
  black: "#07080b",
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
const CUE_ACTIONS = ["playPad", "stopPad", "playTag", "stopTag", "wait"];
const CUE_CONDITIONS = ["manual", "padEnd", "tagEnd"];
const AUDIO_FILE_RE = /\.(mp3|wav|m4a|aac|aif|aiff|caf|ogg|flac)$/i;

const state = {
  audioContext: null,
  masterGain: null,
  masterBypassGain: null,
  masterDry: null,
  masterWet: null,
  masterConvolver: null,
  masterAnalyser: null,
  masterEqLow: null,
  masterEqMid: null,
  masterEqHigh: null,
  masterOutputDestination: null,
  masterOutputAudio: null,
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
  recordingStartedAt: 0,
  recordingSource: null,
  recordingAnalyser: null,
  recordingMeterData: null,
  recordingWaveformFrame: null,
  selectedMicrophoneId: "",
  selectedMicrophoneLabel: "",
  pendingRecordingPad: null,
  drag: null,
  trimDrag: null,
  progressDrag: null,
  shortcuts: [],
  shortcutDraft: null,
  shortcutsEnabled: true,
  lastStartedPad: null,
  audioPad: null,
  audioDraft: null,
  audioMediaDraft: null,
  audioCrossfadeDraft: null,
  masterAudioDraft: null,
  audioTrimDrag: null,
  reverbBuffers: {},
  imagePad: null,
  imageDraft: null,
  imageDialogMode: "color",
  bulkEditPads: [],
  bulkAutoTrimResults: null,
  bulkVisualMode: "color",
  bulkVisualImage: "",
  bulkSketchDrawing: false,
  bulkSketchColor: "#ffffff",
  bulkSketchSize: 8,
  bulkSketchEraser: false,
  activeStructuralFilters: [],
  activeTagFilters: [],
  tagFilterLogic: "or",
  invertSelection: false,
  filterCompact: false,
  filterSectionOpen: false,
  versionsSectionOpen: false,
  boardManageSectionOpen: false,
  sketchDrawing: false,
  sketchColor: "#ffffff",
  sketchSize: 8,
  sketchEraser: false,
  stageMode: false,
  boardEditMode: false,
  boardEditSnapshot: null,
  cueDraft: null,
  cueDragIndex: -1,
  cueWaitTimer: null,
  cueRunning: false,
  cuePreviewAudio: null,
  cuePreviewUtterance: null,
  cuePreviewAnalyser: null,
  cuePreviewMeterData: null,
  cuePreviewMeterSource: null,
  cuePreviewPad: null,
  cuePreviewUrl: "",
  cuePreviewTrimHandler: null,
  cuePreviewEndedHandler: null,
  cuePreviewTrimTimer: null,
  crossfadeArm: {
    active: false,
    phase: "target",
    sourcePadUid: null,
  },
  folderImportFiles: [],
  cueOutputDeviceId: "",
  cueOutputLabel: "par défaut",
  cueVolume: DEFAULT_CUE_VOLUME,
  masterOutputDeviceId: "",
  masterOutputLabel: "par défaut",
  audioDialogStartedPad: null,
  audioDialogStartedCue: null,
  transferPad: null,
  textPad: null,
  notePad: null,
  noteOverlayPad: null,
  versionNotesDraft: null,
  audioCleanupCandidates: [],
  cueFloatAnchorTop: null,
  skinEditorVariables: {},
};

const els = {
  pads: document.querySelector("#pads"),
  template: document.querySelector("#padTemplate"),
  status: document.querySelector("#audioStatus"),
  skinSelect: document.querySelector("#skinSelect"),
  openSkinEditorButton: document.querySelector("#openSkinEditorButton"),

  skinEditorDialog: document.querySelector("#skinEditorDialog"),
  skinEditorFields: document.querySelector("#skinEditorFields"),
  skinEditorName: document.querySelector("#skinEditorName"),
  saveSkinEditor: document.querySelector("#saveSkinEditor"),
  saveSkinEditorAs: document.querySelector("#saveSkinEditorAs"),
  deleteSkinEditor: document.querySelector("#deleteSkinEditor"),
  cancelSkinEditor: document.querySelector("#cancelSkinEditor"),
  closeSkinEditor: document.querySelector("#closeSkinEditor"),

  masterVolume: document.querySelector("#masterVolume"),
  masterVolumeValue: document.querySelector("#masterVolumeValue"),
  masterVu: document.querySelector("#masterVu"),
  cueVolume: document.querySelector("#cueVolume"),
  cueVolumeValue: document.querySelector("#cueVolumeValue"),
  cueVu: document.querySelector("#cueVu"),
  masterAudio: document.querySelector("#masterAudio"),
  masterOutputName: document.querySelector("#masterOutputName"),
  cueOutputName: document.querySelector("#cueOutputName"),
  masterInputName: document.querySelector("#masterInputName"),
  masterAudioDialog: document.querySelector("#masterAudioDialog"),
  closeMasterAudio: document.querySelector("#closeMasterAudio"),
  applyMasterAudio: document.querySelector("#applyMasterAudio"),
  cancelMasterAudio: document.querySelector("#cancelMasterAudio"),
  masterOptionBadges: document.querySelector("#masterOptionBadges"),
  masterOutputSelect: document.querySelector("#masterOutputSelect"),
  masterCueOutputSelect: document.querySelector("#masterCueOutputSelect"),
  masterMicrophoneSelect: document.querySelector("#masterMicrophoneSelect"),
  masterReverbPreset: document.querySelector("#masterReverbPreset"),
  masterReverbWet: document.querySelector("#masterReverbWet"),
  masterReverbValue: document.querySelector("#masterReverbValue"),
  masterEqLow: document.querySelector("#masterEqLow"),
  masterEqMid: document.querySelector("#masterEqMid"),
  masterEqHigh: document.querySelector("#masterEqHigh"),
  masterEqLowValue: document.querySelector("#masterEqLowValue"),
  masterEqMidValue: document.querySelector("#masterEqMidValue"),
  masterEqHighValue: document.querySelector("#masterEqHighValue"),
  masterFadeInEnabled: document.querySelector("#masterFadeInEnabled"),
  masterFadeOutEnabled: document.querySelector("#masterFadeOutEnabled"),
  masterDuckEnabled: document.querySelector("#masterDuckEnabled"),
  armedCrossfadeEnabled: document.querySelector("#armedCrossfadeEnabled"),
  armedCrossfadeSeconds: document.querySelector("#armedCrossfadeSeconds"),
  masterAudioReset: document.querySelector("#masterAudioReset"),
  fadeInSeconds: document.querySelector("#fadeInSeconds"),
  fadeSeconds: document.querySelector("#fadeSeconds"),
  endingAlertSeconds: document.querySelector("#endingAlertSeconds"),
  endingAlertHint: document.querySelector("#endingAlertHint"),
  stopAll: document.querySelector("#stopAll"),
  cueStopAll: document.querySelector("#cueStopAll"),
  stopGroup: document.querySelector("#stopGroup"),
  stopGroupSelect: document.querySelector("#stopGroupSelect"),
  stageMode: document.querySelector("#stageMode"),
  stageLock: document.querySelector("#stageLock"),
  boardTagFilter: document.querySelector("#boardTagFilter"),
  boardTagFilterLabel: document.querySelector("#boardTagFilterLabel"),
  tagFilterChipsRow: document.querySelector("#tagFilterChipsRow"),
  tagFilterChips: document.querySelector("#tagFilterChips"),
  tagFilterLogicGroup: document.querySelector("#tagFilterLogicGroup"),
  filterTousBtn: document.querySelector("#filterTousBtn"),
  filterCompactToggle: document.querySelector("#filterCompactToggle"),
  filterCompactCount: document.querySelector("#filterCompactCount"),
  filterSectionToggle: document.querySelector("#filterSectionToggle"),
  versionsSectionToggle: document.querySelector("#versionsSectionToggle"),
  boardVersionRow: document.querySelector(".board-version-row"),
  boardManageSectionToggle: document.querySelector("#boardManageSectionToggle"),
  boardManageSectionBody: document.querySelector("#boardManageSectionBody"),
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
  audioEditorDialog: document.querySelector("#audioEditorDialog"),
  audioRegionsEdit: document.querySelector("#audioRegionsEdit"),
  closeAudio: document.querySelector("#closeAudio"),
  applyAudio: document.querySelector("#applyAudio"),
  cancelAudio: document.querySelector("#cancelAudio"),
  audioPadName: document.querySelector("#audioPadName"),
  audioFilePath: document.querySelector("#audioFilePath"),
  audioCueOutputName: document.querySelector("#audioCueOutputName"),
  audioTestPlay: document.querySelector("#audioTestPlay"),
  audioTestStop: document.querySelector("#audioTestStop"),
  audioRecord: document.querySelector("#audioRecord"),
  audioErase: document.querySelector("#audioErase"),
  audioImport: document.querySelector("#audioImport"),
  audioVideoImport: document.querySelector("#audioVideoImport"),
  audioVideoFile: document.querySelector("#audioVideoFile"),
  audioTextImport: document.querySelector("#audioTextImport"),
  audioTextFile: document.querySelector("#audioTextFile"),
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
  audioAutoTrim: document.querySelector("#audioAutoTrim"),
  audioNormalize: document.querySelector("#audioNormalize"),
  audioNormalizeValue: document.querySelector("#audioNormalizeValue"),
  audioMono: document.querySelector("#audioMono"),
  audioLoop: document.querySelector("#audioLoop"),
  audioReverse: document.querySelector("#audioReverse"),
  audioDuckNone: document.querySelector("#audioDuckNone"),
  audioDuckGlobal: document.querySelector("#audioDuckGlobal"),
  audioDuckPad: document.querySelector("#audioDuckPad"),
  audioDuckPercent: document.querySelector("#audioDuckPercent"),
  audioDuckGlobalHint: document.querySelector("#audioDuckGlobalHint"),
  audioPadDuckField: document.querySelector("#audioPadDuckField"),
  audioFadeNone: document.querySelector("#audioFadeNone"),
  audioFadeGlobal: document.querySelector("#audioFadeGlobal"),
  audioFadePad: document.querySelector("#audioFadePad"),
  audioPadFadeFields: document.querySelector("#audioPadFadeFields"),
  audioFadeInLabel: document.querySelector("#audioFadeInLabel"),
  audioFadeOutLabel: document.querySelector("#audioFadeOutLabel"),
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
  audioEqNone: document.querySelector("#audioEqNone"),
  audioEqGlobal: document.querySelector("#audioEqGlobal"),
  audioEqPad: document.querySelector("#audioEqPad"),
  audioPadEqFields: document.querySelector("#audioPadEqFields"),
  audioEqLow: document.querySelector("#audioEqLow"),
  audioEqMid: document.querySelector("#audioEqMid"),
  audioEqHigh: document.querySelector("#audioEqHigh"),
  audioEqLowValue: document.querySelector("#audioEqLowValue"),
  audioEqMidValue: document.querySelector("#audioEqMidValue"),
  audioEqHighValue: document.querySelector("#audioEqHighValue"),
  audioTextLang: document.querySelector("#audioTextLang"),
  audioTextGenderFemale: document.querySelector("#audioTextGenderFemale"),
  audioTextGenderMale: document.querySelector("#audioTextGenderMale"),
  audioTextVoice: document.querySelector("#audioTextVoice"),
  audioTextRate: document.querySelector("#audioTextRate"),
  audioTextRateValue: document.querySelector("#audioTextRateValue"),
  audioTextEditorFrame: document.querySelector("#audioTextEditorFrame"),
  audioTextInlineEditor: document.querySelector("#audioTextInlineEditor"),
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
  sketchColorBtns: [...document.querySelectorAll("[data-sketch-color]")],
  sketchSizeBtns: [...document.querySelectorAll("[data-sketch-size]")],
  sketchEraserBtn: document.querySelector("#sketchEraser"),
  imagePosX: document.querySelector("#imagePosX"),
  imagePosY: document.querySelector("#imagePosY"),
  imageZoom: document.querySelector("#imageZoom"),
  duckPercent: document.querySelector("#duckPercent"),
  helpButton: document.querySelector("#helpButton"),
  helpDialog: document.querySelector("#helpDialog"),
  helpTitle: document.querySelector("#helpTitle"),
  helpSections: [...document.querySelectorAll("[data-help-section]")],
  helpColumns: [...document.querySelectorAll(".help-sections .help-column")],
  masterHelp: document.querySelector("#masterHelp"),
  masterAudioHelp: document.querySelector("#masterAudioHelp"),
  cuesHelp: document.querySelector("#cuesHelp"),
  closeHelp: document.querySelector("#closeHelp"),
  boardSelect: document.querySelector("#boardSelect"),
  boardName: document.querySelector("#boardName"),
  editPads: document.querySelector("#editPads"),
  cancelBoardEdit: document.querySelector("#cancelBoardEdit"),
  saveBoardEdit: document.querySelector("#saveBoardEdit"),
  discardBoardEdit: document.querySelector("#discardBoardEdit"),
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
  stageMissingFilesDialog: document.querySelector("#stageMissingFilesDialog"),
  stageMissingSection: document.querySelector("#stageMissingSection"),
  stageMissingFilesIntro: document.querySelector("#stageMissingFilesIntro"),
  stageMissingFilesList: document.querySelector("#stageMissingFilesList"),
  stageEmptySection: document.querySelector("#stageEmptySection"),
  stageEmptyPadsIntro: document.querySelector("#stageEmptyPadsIntro"),
  stageEmptyPadsList: document.querySelector("#stageEmptyPadsList"),
  cancelStageMissing: document.querySelector("#cancelStageMissing"),
  confirmStageMissing: document.querySelector("#confirmStageMissing"),
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
  bulkVolumeValue: document.querySelector("#bulkVolumeValue"),
  bulkPanValue: document.querySelector("#bulkPanValue"),
  bulkTagsChips: document.querySelector("#bulkTagsChips"),
  bulkTagsAdd: document.querySelector("#bulkTagsAdd"),
  bulkApplyVisual: document.querySelector("#bulkApplyVisual"),
  bulkVisualModeBtns: [...document.querySelectorAll("[data-bulk-visual-mode]")],
  bulkVisualPanels: [...document.querySelectorAll("[data-bulk-visual-panel]")],
  bulkImageInput: document.querySelector("#bulkImageInput"),
  bulkImageCanvas: document.querySelector("#bulkImageCanvas"),
  bulkSketchCanvas: document.querySelector("#bulkSketchCanvas"),
  bulkSketchColorBtns: [...document.querySelectorAll("[data-bulk-sketch-color]")],
  bulkSketchSizeBtns: [...document.querySelectorAll("[data-bulk-sketch-size]")],
  bulkSketchEraserBtn: document.querySelector("#bulkSketchEraser"),
  bulkSketchClear: document.querySelector("#bulkSketchClear"),
  bulkColor: document.querySelector("#bulkColor"),
  bulkColorButtons: [...document.querySelectorAll("[data-bulk-color]")],
  bulkApplyLiveFade: document.querySelector("#bulkApplyLiveFade"),
  bulkFadeInEnabled: document.querySelector("#bulkFadeInEnabled"),
  bulkFadeOutEnabled: document.querySelector("#bulkFadeOutEnabled"),
  bulkApplyAudioFlags: document.querySelector("#bulkApplyAudioFlags"),
  bulkLoop: document.querySelector("#bulkLoop"),
  bulkDuck: document.querySelector("#bulkDuck"),
  bulkApplyAutoTrim: document.querySelector("#bulkApplyAutoTrim"),
  bulkAutoTrim: document.querySelector("#bulkAutoTrim"),
  bulkAutoTrimStatus: document.querySelector("#bulkAutoTrimStatus"),
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
  padTransferDialog: document.querySelector("#padTransferDialog"),
  padTransferName: document.querySelector("#padTransferName"),
  padTransferBoard: document.querySelector("#padTransferBoard"),
  copyPadToBoard: document.querySelector("#copyPadToBoard"),
  movePadToBoard: document.querySelector("#movePadToBoard"),
  cancelPadTransfer: document.querySelector("#cancelPadTransfer"),
  saveVersion: document.querySelector("#saveVersion"),
  restoreVersion: document.querySelector("#restoreVersion"),
  renameVersion: document.querySelector("#renameVersion"),
  archiveVersion: document.querySelector("#archiveVersion"),
  deleteVersion: document.querySelector("#deleteVersion"),
  versionNotes: document.querySelector("#versionNotes"),
  versionSelect: document.querySelector("#versionSelect"),
  deleteBoard: document.querySelector("#deleteBoard"),
  addBoard: document.querySelector("#addBoard"),
  duplicateBoard: document.querySelector("#duplicateBoard"),
  boardNotice: document.querySelector("#boardNotice"),
  addPad: document.querySelector("#addPad"),
  exportBoardAudioOnly: document.querySelector("#exportBoardAudioOnly"),
  exportBoardLite: document.querySelector("#exportBoardLite"),
  importBoard: document.querySelector("#importBoard"),
  importBoardFile: document.querySelector("#importBoardFile"),
  relinkAudioFolder: document.querySelector("#relinkAudioFolder"),
  relinkAudioFolderInput: document.querySelector("#relinkAudioFolderInput"),
  relinkVideoFolder: document.querySelector("#relinkVideoFolder"),
  relinkVideoFolderInput: document.querySelector("#relinkVideoFolderInput"),
  folderImportDialog: document.querySelector("#folderImportDialog"),
  folderImportList: document.querySelector("#folderImportList"),
  folderImportSummary: document.querySelector("#folderImportSummary"),
  applyFolderImport: document.querySelector("#applyFolderImport"),
  cancelFolderImport: document.querySelector("#cancelFolderImport"),
  audioCleanupDialog: document.querySelector("#audioCleanupDialog"),
  audioCleanupList: document.querySelector("#audioCleanupList"),
  audioCleanupSummary: document.querySelector("#audioCleanupSummary"),
  exportCleanupAudio: document.querySelector("#exportCleanupAudio"),
  confirmAudioCleanup: document.querySelector("#confirmAudioCleanup"),
  cancelAudioCleanup: document.querySelector("#cancelAudioCleanup"),
  microphoneDialog: document.querySelector("#microphoneDialog"),
  microphoneSummary: document.querySelector("#microphoneSummary"),
  microphoneSelect: document.querySelector("#microphoneSelect"),
  refreshMicrophones: document.querySelector("#refreshMicrophones"),
  applyMicrophone: document.querySelector("#applyMicrophone"),
  cancelMicrophone: document.querySelector("#cancelMicrophone"),
  padLayoutMode: document.querySelector("#padLayoutMode"),
  padColumns: document.querySelector("#padColumns"),
  padColumnsComputed: document.querySelector("#padColumnsComputed"),
  padRows: document.querySelector("#padRows"),
  cueEditor: document.querySelector("#cueEditor"),
  openCueDialog: document.querySelector("#openCueDialog"),
  cueRun: document.querySelector("#cueRun"),
  cueNext: document.querySelector("#cueNext"),
  cueStatus: document.querySelector("#cueStatus"),
  cueDialog: document.querySelector("#cueDialog"),
  cueRows: document.querySelector("#cueRows"),
  cueTimeline: document.querySelector("#cueTimeline"),
  addCueStep: document.querySelector("#addCueStep"),
  addAllCuePads: document.querySelector("#addAllCuePads"),
  resetCuePosition: document.querySelector("#resetCuePosition"),
  applyCues: document.querySelector("#applyCues"),
  cancelCues: document.querySelector("#cancelCues"),
  closeCueDialog: document.querySelector("#closeCueDialog"),
  liveTools: document.querySelector(".live-tools"),
  textDialog: document.querySelector("#textDialog"),
  textEditor: document.querySelector("#textEditor"),
  applyText: document.querySelector("#applyText"),
  cancelText: document.querySelector("#cancelText"),
  noteDialog: document.querySelector("#noteDialog"),
  noteEditor: document.querySelector("#noteEditor"),
  noteShowRow: document.querySelector("#noteShowRow"),
  noteShowOnStart: document.querySelector("#noteShowOnStart"),
  noteShowEndRow: document.querySelector("#noteShowEndRow"),
  noteShowOnEnd: document.querySelector("#noteShowOnEnd"),
  applyNote: document.querySelector("#applyNote"),
  cancelNote: document.querySelector("#cancelNote"),
  versionNotesDialog: document.querySelector("#versionNotesDialog"),
  versionNotesLabel: document.querySelector("#versionNotesLabel"),
  versionNotesBoard: document.querySelector("#versionNotesBoard"),
  versionNotesBoardCreated: document.querySelector("#versionNotesBoardCreated"),
  versionNotesEditor: document.querySelector("#versionNotesEditor"),
  closeVersionNotes: document.querySelector("#closeVersionNotes"),
  padNoteOverlay: document.querySelector("#padNoteOverlay"),
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

function dbKeys() {
  return new Promise((resolve, reject) => {
    const tx = state.db.transaction(STORE, "readonly");
    const request = tx.objectStore(STORE).getAllKeys();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function fileBaseName(value) {
  return String(value || "").split(/[\\/]/).pop().trim();
}

function normalizedFileName(value) {
  return fileBaseName(value).toLocaleLowerCase("fr");
}

function fileStem(value) {
  return fileBaseName(value).replace(/\.[^/.]+$/, "").trim();
}

function normalizedFileStem(value) {
  return fileStem(value).toLocaleLowerCase("fr");
}

function outputLabel(value) {
  return String(value || "").trim() || "par défaut";
}

function escapeText(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

function updateOutputLabels() {
  const cueAvailable = outputSelectionSupported();
  const cueLabel = cueAvailable ? outputLabel(state.cueOutputLabel) : "indisponible";
  const audioCueText = `Sortie cue : ${cueLabel}`;
  const masterCueText = `Sortie cue : ${cueLabel}`;
  const masterLiveText = `Sortie sono : ${outputLabel(state.masterOutputLabel)}`;
  if (els.audioCueOutputName) els.audioCueOutputName.textContent = audioCueText;
  if (els.masterOutputName) els.masterOutputName.textContent = masterLiveText;
  if (els.cueOutputName) els.cueOutputName.textContent = masterCueText;
  updateMasterInputLabel();
  syncOutputSelectValues();
}

function outputSelectionSupported() {
  const audio = document.createElement("audio");
  return typeof audio.setSinkId === "function" && Boolean(navigator.mediaDevices?.selectAudioOutput);
}

function enumerateOutputSupported() {
  return Boolean(navigator.mediaDevices?.enumerateDevices);
}

function outputSelectOption(label, value = "") {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function disabledOutputSelectOption(label) {
  const option = outputSelectOption(label, "__unavailable__");
  option.disabled = true;
  return option;
}

function syncOneOutputSelect(select, deviceId, label) {
  if (!select) return;
  const value = String(deviceId || "");
  if (value && ![...select.options].some((option) => option.value === value)) {
    select.append(outputSelectOption(outputLabel(label), value));
  }
  select.value = value;
}

function syncOutputSelectValues() {
  syncOneOutputSelect(els.masterOutputSelect, state.masterOutputDeviceId, state.masterOutputLabel);
  syncOneOutputSelect(els.masterCueOutputSelect, state.cueOutputDeviceId, state.cueOutputLabel);
}

async function refreshOutputSelectOptions() {
  const selects = [els.masterOutputSelect, els.masterCueOutputSelect].filter(Boolean);
  selects.forEach((select) => {
    select.innerHTML = "";
    select.dataset.outputPicker = outputSelectionSupported() ? "available" : "";
    select.append(outputSelectOption("Par défaut", ""));
  });

  let outputCount = 0;
  if (enumerateOutputSupported()) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      devices
        .filter((device) => device.kind === "audiooutput" && device.deviceId)
        .forEach((device) => {
          const label = device.label || `Sortie ${device.deviceId.slice(0, 6)}`;
          selects.forEach((select) => select.append(outputSelectOption(label, device.deviceId)));
          outputCount += 1;
        });
    } catch {
      // Les navigateurs qui refusent l'énumération gardent au moins la sortie par défaut.
    }
  }

  if (!outputCount) {
    if (outputSelectionSupported()) {
      selects.forEach((select) => {
        select.dataset.outputPicker = "available";
        select.append(disabledOutputSelectOption("Cliquer pour sélectionner"));
      });
    } else {
      selects.forEach((select) => select.append(disabledOutputSelectOption("Liste indisponible")));
    }
  }
  document.body.classList.toggle("no-output-choice", !outputCount && !outputSelectionSupported());
  syncOutputSelectValues();
}

function outputSelectUsesNativePicker(select) {
  return select?.dataset.outputPicker === "available";
}

function syncOutputCapabilityUi() {
  const supported = outputSelectionSupported();
  document.body.classList.toggle("no-cue-output", !supported);
  state.pads.forEach((pad) => {
    if (!pad.cueButton) return;
    pad.cueButton.disabled = !supported;
    pad.cueButton.setAttribute("aria-disabled", String(!supported));
  });
}

function loadOutputSettings() {
  state.cueOutputDeviceId = "";
  state.cueOutputLabel = "par défaut";
  state.masterOutputDeviceId = "";
  state.masterOutputLabel = "par défaut";
  localStorage.removeItem(CUE_OUTPUT_STORAGE);
  localStorage.removeItem(MASTER_OUTPUT_STORAGE);
  syncOutputCapabilityUi();
  updateOutputLabels();
  refreshOutputSelectOptions().catch(() => {});
}

function saveCueOutput(deviceId, label) {
  state.cueOutputDeviceId = String(deviceId || "");
  state.cueOutputLabel = outputLabel(label);
  updateOutputLabels();
}

function saveMasterOutput(deviceId, label) {
  state.masterOutputDeviceId = String(deviceId || "");
  state.masterOutputLabel = outputLabel(label);
  updateOutputLabels();
}

function cueVolumeValue() {
  return clamp01(state.cueVolume ?? DEFAULT_CUE_VOLUME);
}

function setCueVolume(value, persist = true) {
  const volume = clamp01(value, DEFAULT_CUE_VOLUME);
  state.cueVolume = volume;
  if (els.cueVolume) els.cueVolume.value = String(volume);
  if (els.cueVolumeValue) els.cueVolumeValue.textContent = `${Math.round(volume * 100)}%`;
  if (state.cuePreviewAudio) state.cuePreviewAudio.volume = volume;
  setMeterLevel(els.cueVu, state.cuePreviewAudio && !state.cuePreviewAudio.paused ? volume : 0);
  if (persist) localStorage.setItem(CUE_VOLUME_STORAGE, String(volume));
}

function loadCueVolume() {
  setCueVolume(localStorage.getItem(CUE_VOLUME_STORAGE) ?? DEFAULT_CUE_VOLUME, false);
}

function bindEscapeClose(dialog, closeAction = null) {
  dialog?.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeAction?.();
    dialog.close();
  });
}

function closeOpenDialogFromEscape() {
  const entries = [
    // L'éditeur audio est au premier plan (ouvert par-dessus le dialog audio) :
    // Esc doit le fermer AVANT le dialog audio en arrière-plan.
    { dialog: els.audioEditorDialog, action: () => aeDestroy() },
    { dialog: els.shortcutDialog, action: () => {
      restoreShortcutDraft();
      state.shortcutDraft = null;
      setBoardPadEditing(false);
    } },
    { dialog: els.imageDialog, action: () => {
      restoreImageDraft();
      state.imageDraft = null;
    } },
    { dialog: els.audioDialog, action: () => {
      stopAudioDialogStartedPlayback();
      restoreAudioDraft();
      state.audioDraft = null;
    } },
    { dialog: els.masterAudioDialog, action: () => {
      restoreMasterAudioDraft();
      state.masterAudioDraft = null;
    } },
    { dialog: els.cueDialog, action: () => {
      clearCueDialogDraft();
    } },
    { dialog: els.folderImportDialog, action: () => {
      state.folderImportFiles = [];
    } },
    { dialog: els.padTransferDialog, action: () => {
      state.transferPad = null;
    } },
    { dialog: els.bulkEditDialog },
    { dialog: els.patchBayDialog },
    { dialog: els.cancelEditDialog },
    { dialog: els.helpDialog },
  ];
  const entry = entries.find((item) => item.dialog?.open);
  if (!entry) return false;
  entry.action?.();
  entry.dialog.close();
  return true;
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
  if (pad?.videoName) return `Vidéo · ${pad.videoName}${pad.videoDuration ? ` · ${formatTime(pad.videoDuration)}` : ""}`;
  if (pad?.textContent) return `Texte · ${pad.textName || "saisi"} · ${formatTime(pad.textDuration || estimateSpeechDuration(pad.textContent, pad.textRate))}`;
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

function padListIndexLabel(pad) {
  return state.shortcutsEnabled && !isPortableDevice() ? keyForIndex(pad.index) : String(pad.index + 1);
}

function padCueOptionLabel(pad) {
  return `${padListIndexLabel(pad)}. ${pad.title}`;
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
  const padCount = Math.max(1, Number(board?.padCount) || DEFAULT_PAD_COUNT);
  if (mode === "auto") {
    const columns = Math.max(1, Math.floor(Math.sqrt(padCount)));
    return {
      mode,
      columns,
      rows: Math.ceil(padCount / columns),
    };
  }
  if (mode !== "custom") return { mode, ...PAD_LAYOUTS[mode] };
  const columns = normalizeLayoutNumber(board?.padColumns, 4);
  return {
    mode,
    columns,
    rows: Math.max(1, Math.ceil(padCount / columns)),
  };
}

function stagePortablePortraitLayoutForBoard(board) {
  const padCount = Math.max(1, Number(board?.padCount) || DEFAULT_PAD_COUNT);
  return {
    mode: "custom",
    columns: 2,
    rows: Math.max(1, Math.ceil(padCount / 2)),
  };
}

function shouldForcePortablePortraitLayout() {
  return isPortablePortrait();
}

function effectiveLayoutForBoard(board) {
  if (shouldForcePortablePortraitLayout()) return stagePortablePortraitLayoutForBoard(board);

  const layout = layoutForBoard(board);
  if (shouldLimitPortableLandscapeColumns() && layout.columns > 5) {
    return {
      ...layout,
      columns: 5,
      rows: Math.max(1, Math.ceil((Number(board?.padCount) || DEFAULT_PAD_COUNT) / 5)),
    };
  }

  return layout;
}

function normalizeCueAction(action) {
  return CUE_ACTIONS.includes(action) ? action : "playPad";
}

function normalizeCueCondition(condition) {
  return CUE_CONDITIONS.includes(condition) ? condition : "manual";
}

function normalizeCueStep(step = {}) {
  return {
    id: step.id || createId(),
    action: normalizeCueAction(step.action),
    target: String(step.target || ""),
    waitSeconds: Math.max(0, Math.round(Number(step.waitSeconds) || 0)),
    condition: normalizeCueCondition(step.condition),
    conditionTarget: String(step.conditionTarget || ""),
  };
}

function normalizeCues(cues) {
  return Array.isArray(cues) ? cues.map(normalizeCueStep) : [];
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

function formatBoardCreatedAt(createdAt) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "non renseignée";
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function updateMasterInputLabel() {
  if (!els.masterInputName) return;
  const id = String(state.selectedMicrophoneId || "").trim();
  const hasExplicitMicrophone = Boolean(id && id !== "__default__");
  const label = hasExplicitMicrophone ? String(state.selectedMicrophoneLabel || "").trim() : "";
  els.masterInputName.textContent = `Entrée : ${hasExplicitMicrophone && label ? label : "aucune"}`;
}

function setPadTitle(pad, title, options = {}) {
  const { syncInput = true, trimTitle = true } = options;
  const rawTitle = String(title ?? "");
  const displayTitle = trimTitle ? rawTitle.trim() : rawTitle;
  pad.title = rawTitle.trim() ? displayTitle : `Pad ${pad.index + 1}`;
  pad.titleEl.textContent = pad.title;
  if (syncInput) pad.nameEl.value = pad.title;
  fitPadTitle(pad);
}

function fitPadTitle(pad) {
  const title = pad.titleEl;
  const node = pad.node;
  if (!title || !node) return;
  title.style.fontSize = "";
  if (document.body.dataset.skin !== "basic") return;
  if (document.body.classList.contains("board-edit-mode")) return;
  const hasVisual = node.classList.contains("has-visual-image") && !node.classList.contains("is-visual-hidden");
  const hasColorOnly = node.classList.contains("has-color") && !node.classList.contains("has-visual-image") && !node.classList.contains("is-visual-hidden");
  if ((!hasVisual && !hasColorOnly) || node.classList.contains("is-editing")) return;
  if (title.scrollWidth <= title.clientWidth) return;
  const currentSize = parseFloat(getComputedStyle(title).fontSize);
  const fitted = Math.max(Math.floor(currentSize * (title.clientWidth / title.scrollWidth) * 10) / 10, 9);
  title.style.fontSize = fitted + "px";
}

function padType(pad) {
  if (pad?.videoName || pad?.videoPath || pad?.videoUrl) return "video";
  if (pad?.textContent || pad?.textMode) return "text";
  return "audio";
}

function padTypeLabel(type) {
  if (type === "video") return "Vidéo";
  if (type === "text") return "Texte";
  return "Audio";
}

function padTypeIconMarkup(type) {
  if (type === "video") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="6" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="m16 10 4-2v8l-4-2V10Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  }
  if (type === "text") {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19c3-6 6-10 14-14-2 8-6 11-14 14Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8 16c2-1 4-3 6-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6l-5 4H4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
}

function updatePadType(pad) {
  if (!pad) return;
  const type = padType(pad);
  if (pad.typeEl) {
    pad.typeEl.innerHTML = padTypeIconMarkup(type);
    pad.typeEl.title = padTypeLabel(type);
    pad.typeEl.setAttribute("aria-label", padTypeLabel(type));
  }
  pad.node?.classList.toggle("is-text-pad", type === "text");
  pad.node?.classList.toggle("is-video-pad", type === "video");
  pad.node?.classList.toggle("is-audio-pad", type === "audio");
}

function normalizedTextRate(value, fallback = DEFAULT_TEXT_RATE) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(MAX_TEXT_RATE, Math.max(MIN_TEXT_RATE, number)) : fallback;
}

function audioTextGenderValue(fallback = "female") {
  if (els.audioTextGenderMale?.checked) return "male";
  if (els.audioTextGenderFemale?.checked) return "female";
  return fallback === "male" ? "male" : "female";
}

function setAudioTextGenderControls(gender = "female") {
  const normalized = gender === "male" ? "male" : "female";
  if (els.audioTextGenderFemale) els.audioTextGenderFemale.checked = normalized === "female";
  if (els.audioTextGenderMale) els.audioTextGenderMale.checked = normalized === "male";
}

function setPadTextSettings(pad, settings = {}) {
  pad.textContent = String(settings.textContent ?? pad.textContent ?? "");
  pad.textName = String(settings.textName ?? pad.textName ?? "");
  pad.textMode = Boolean(settings.textMode ?? pad.textMode ?? pad.textContent);
  if (pad.textMode) {
    pad.fadeMode = "none";
    pad.fadeInSeconds = "";
    pad.fadeOutSeconds = "";
    pad.fadeSeconds = "";
  }
  pad.textLang = String(settings.textLang || pad.textLang || "fr-FR");
  pad.textGender = ["female", "male"].includes(settings.textGender) ? settings.textGender : (pad.textGender || "female");
  pad.textVoiceURI = String(settings.textVoiceURI ?? pad.textVoiceURI ?? "");
  pad.textRate = normalizedTextRate(settings.textRate ?? pad.textRate ?? DEFAULT_TEXT_RATE);
  pad.textDuration = estimateSpeechDuration(pad.textContent, pad.textRate);
  updatePadType(pad);
  updatePadTime(pad);
}

function setPadNote(pad, text = "", showOnStart = false, showOnEnd = false) {
  pad.noteText = String(text || "").trim();
  pad.noteShowOnStart = Boolean(showOnStart && pad.noteText);
  pad.noteShowOnEnd = Boolean(showOnEnd && pad.noteText);
  pad.node?.classList.toggle("has-note", Boolean(pad.noteText));
  pad.noteButton?.classList.toggle("has-note", Boolean(pad.noteText));
  pad.noteButton?.setAttribute("aria-pressed", String(Boolean(pad.noteText)));
}

function padTargetValue(pad) {
  return `pad:${pad.uid || pad.index}`;
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
  const enabledSetting = localStorage.getItem(boardShortcutsEnabledKey(state.currentBoardId));
  state.shortcutsEnabled = enabledSetting == null ? !isPortableDevice() : enabledSetting !== "off";
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

function stopLastStartedPadFromKeyboard() {
  const pad = isPadPlaying(state.lastStartedPad)
    ? state.lastStartedPad
    : state.pads.find((item) => isPadPlaying(item));
  if (!pad) {
    setStatus("Aucun pad à arrêter", "stop");
    return false;
  }
  stopPad(pad, fadeDurationForPad(pad, "out") > 0);
  return true;
}

function stopEvent(event) {
  event.preventDefault();
  event.stopPropagation();
}

function stopButtonEvent(event) {
  event?.preventDefault?.();
  event?.stopPropagation?.();
  event?.stopImmediatePropagation?.();
}

function startPerfMeasure(label) {
  const start = performance.now();
  let previous = start;
  const log = (step, extra = {}) => {
    const now = performance.now();
    console.debug("[perf]", label, step, {
      totalMs: Number((now - start).toFixed(2)),
      stepMs: Number((now - previous).toFixed(2)),
      ...extra,
    });
    previous = now;
  };
  log("start");
  return { log, start };
}

function perfElapsedMs(start) {
  return Number((performance.now() - start).toFixed(2));
}

function approximateMediaSize(value) {
  if (!value) return 0;
  if (typeof value === "string") return value.length;
  if (typeof value.byteLength === "number") return value.byteLength;
  if (typeof value.size === "number") return value.size;
  if (value.buffer && typeof value.buffer.byteLength === "number") return value.buffer.byteLength;
  return 0;
}

function restorePadMediaSize(...records) {
  return records.reduce((largest, record) => {
    if (!record) return largest;
    return Math.max(
      largest,
      approximateMediaSize(record.audio),
      approximateMediaSize(record.video),
      approximateMediaSize(record.visualImage),
      approximateMediaSize(record.textContent)
    );
  }, 0);
}

function shouldPreloadAudioOnRestore() {
  return false;
}

function setPadDecodedAudioMetadata(pad, buffer, audioSource = null) {
  pad.audioDuration = Number(buffer?.duration) || 0;
  pad.audioSampleRate = Number(buffer?.sampleRate) || 0;
  pad.audioChannels = Number(buffer?.numberOfChannels) || 0;
  const byteLength = approximateMediaSize(audioSource);
  pad.audioByteLength = byteLength || pad.audioByteLength || 0;
  pad.waveformPeaks = buildWaveformPeaks(buffer);
}

async function ensurePadAudioDecoded(pad, saved, rawSaved = null, meta = null) {
  if (pad.buffer) return pad.buffer;
  if (pad.audioDecodePromise) return await pad.audioDecodePromise;

  if (!saved) {
    rawSaved = rawSaved || await dbGet(padAudioKey(pad));
    meta = meta || await dbGet(padMetaKey(pad));
    saved = await resolvePadAudioRecord(pad, meta, rawSaved);
  }

  const audioSource = saved?.audio || rawSaved?.audio;
  if (!audioSource) throw new Error(`No audio to decode for pad ${pad.index}`);

  pad.audioPending = true;
  pad.audioDecodePromise = (async () => {
    prepareAudio();
    const buffer = await state.audioContext.decodeAudioData(audioSource.slice(0));
    pad.buffer = buffer;
    setPadDecodedAudioMetadata(pad, buffer, audioSource);
    applyEffectiveBufferState(pad); // durée + waveform = buffer effectif (régions appliquées)
    return buffer;
  })();

  try {
    return await pad.audioDecodePromise;
  } finally {
    delete pad.audioDecodePromise;
    pad.audioPending = false;
  }
}

// Remplit en arrière-plan les durées manquantes (pads non décodés) pour les afficher
// en studio/garage sans passer par la scène. Décode juste pour la durée + la waveform,
// puis libère le buffer (pas de préchargement mémoire) ; la durée est sauvegardée → instantané ensuite.
let durationBackfillToken = 0;
async function backfillPadDurations() {
  const token = ++durationBackfillToken;
  const pads = state.pads.filter((p) =>
    !p.duration && !p.buffer && !p.videoName && !p.textContent
    && (p.audioStored || p.hasDirectAudio || p.audioName || p.audioPath));
  for (const pad of pads) {
    if (token !== durationBackfillToken || state.stageMode) return; // board changé / scène : on arrête
    if (pad.duration || pad.buffer) continue;
    try {
      const rawSaved = await dbGet(padAudioKey(pad));
      const meta = await dbGet(padMetaKey(pad));
      const saved = await resolvePadAudioRecord(pad, meta, rawSaved);
      const audio = saved?.audio || rawSaved?.audio;
      if (!audio) continue;
      prepareAudio();
      if (!state.audioContext) return;
      const buf = await state.audioContext.decodeAudioData(audio.slice(0));
      if (token !== durationBackfillToken) return;
      if (pad.buffer || pad.duration) continue;
      pad.audioDuration = buf.duration;
      const cutTotal = (pad.regions || [])
        .filter((r) => r.type === "cut")
        .reduce((s, r) => s + Math.max(0, Math.min(buf.duration, r.end) - Math.max(0, r.start)), 0);
      setPadDuration(pad, Math.max(0, buf.duration - cutTotal));
      pad.waveformPeaks = buildWaveformPeaks(buf);
      renderWaveform(pad);
      updatePadTime(pad);
      savePadMeta(pad);
    } catch {}
    await new Promise((r) => setTimeout(r, 30)); // respiration entre décodages
  }
}

function restorePadBaseInfo(pad, summary = {}) {
  return {
    padIndex: pad.index,
    padNumber: pad.index + 1,
    title: pad.title,
    detectedType: summary.detectedType || "empty",
    mediaSizeBytes: summary.mediaSizeBytes || 0,
    duration: summary.duration || 0,
    audioLink: summary.audioLink || "none",
  };
}

function restorePadResultSummary(results, restoreWallMs) {
  const valid = results.filter(Boolean);
  const top3 = [...valid]
    .sort((left, right) => (right.totalMs || 0) - (left.totalMs || 0))
    .slice(0, 3)
    .map((item) => ({
      padIndex: item.padIndex,
      padNumber: item.padNumber,
      title: item.title,
      detectedType: item.detectedType,
      totalMs: item.totalMs,
      mediaSizeBytes: item.mediaSizeBytes,
      duration: item.duration,
      audioLink: item.audioLink,
    }));
  const counts = valid.reduce((acc, item) => {
    const type = item.detectedType || "empty";
    if (type === "audio") acc.audio += 1;
    else if (type === "video") acc.video += 1;
    else if (type === "text") acc.text += 1;
    else acc.empty += 1;
    return acc;
  }, { audio: 0, video: 0, text: 0, empty: 0 });
  return {
    restoreWallMs,
    sumPadRestoreMs: Number(valid.reduce((sum, item) => sum + (item.totalMs || 0), 0).toFixed(2)),
    slowestPad: top3[0] || null,
    top3SlowestPads: top3,
    audioPads: counts.audio,
    videoPads: counts.video,
    textPads: counts.text,
    emptyPads: counts.empty,
  };
}

function bindSafeActionButton(button, action) {
  if (!button) return;
  const run = (event) => {
    stopButtonEvent(event);
    if (button.disabled || button.getAttribute("aria-disabled") === "true") return;
    const now = performance.now();
    const lastRun = Number(button.dataset.lastRun || 0);
    if (now - lastRun < 700) return;
    button.dataset.lastRun = String(now);
    Promise.resolve(action(event)).catch(() => {});
  };
  button.addEventListener("click", run);
  button.addEventListener("touchend", run, { passive: false });
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
  const perf = startPerfMeasure("renderShortcutRows");
  if (!els.shortcutRows) {
    perf.log("missing container");
    return;
  }
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
  perf.log("complete", { rows: state.shortcuts.length });
}

function updateShortcutIndicators() {
  document.body.classList.toggle("shortcuts-disabled", !state.shortcutsEnabled);
  if (els.keyboardShortcuts) {
    els.keyboardShortcuts.disabled = false;
    els.keyboardShortcuts.setAttribute("aria-disabled", "false");
  }
  state.pads.forEach((pad) => {
    const shortcut = state.shortcuts.find((item) => item.padIndex === pad.index && item.key);
    if (!pad.shortcutEl) return;
    pad.shortcutEl.dataset.padNumber = String(pad.index + 1);
    const showNumber = !state.shortcutsEnabled || isPortableDevice();
    pad.shortcutEl.classList.toggle("is-number", showNumber);
    pad.shortcutEl.textContent = showNumber ? String(pad.index + 1) : (shortcut?.key || "");
    pad.shortcutEl.hidden = !showNumber && !shortcut?.key;
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
  els.editPads?.setAttribute("title", state.boardEditMode ? "Revenir au mode live" : "Mode edit des pads");
  if (!state.boardEditMode) {
    setCableOverlayVisible(false);
    // Conserver la sélection de pads en sortant du garage (comme studio → garage).
    // Seul le masquage « compact » est remis au neutre.
    state.filterCompact = false;
    state.boardManageSectionOpen = false;
    if (els.boardManageSectionBody) els.boardManageSectionBody.hidden = true;
    if (els.boardManageSectionToggle) els.boardManageSectionToggle.setAttribute("aria-expanded", "false");
  } else {
    state.versionsSectionOpen = false;
    if (els.boardVersionRow) els.boardVersionRow.hidden = true;
    if (els.versionsSectionToggle) els.versionsSectionToggle.setAttribute("aria-expanded", "false");
  }
  state.filterSectionOpen = false;
  setBoardEditing(state.boardEditMode, false);
  state.pads.forEach((pad) => setPadEditing(pad, state.boardEditMode));
  updateAllPadAlerts(); // garde les badges à jour en entrant/sortant du garage
  refreshBoardTagFilterOptions();
  localStorage.setItem(BOARD_EDIT_MODE_STORAGE, state.boardEditMode ? "on" : "off");
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

function comparableBoardSnapshot(snapshot) {
  return JSON.stringify({
    board: snapshot?.board || null,
    pads: (snapshot?.pads || []).map((item) => ({
      index: item.index,
      meta: item.meta || null,
      audio: item.audio || null,
    })),
  });
}

async function boardEditHasChanges() {
  if (!state.boardEditSnapshot) return false;
  const current = await createBoardSnapshot(currentBoard());
  return comparableBoardSnapshot(current) !== comparableBoardSnapshot(state.boardEditSnapshot);
}

async function openCancelBoardEditDialog() {
  if (!(await boardEditHasChanges())) {
    setBoardPadEditing(false);
    return;
  }
  if (els.cancelEditDialog?.showModal) {
    els.cancelEditDialog.showModal();
    return;
  }
  cancelBoardEdit().catch(() => setStatus("Annulation impossible", "stop"));
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
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
    "audio/aac",
  ];
  return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
}

function recordingExtension(type = "") {
  const cleanType = String(type || "").toLowerCase();
  if (cleanType.includes("webm")) return "webm";
  if (cleanType.includes("ogg")) return "ogg";
  if (cleanType.includes("wav")) return "wav";
  if (cleanType.includes("mpeg") || cleanType.includes("mp3")) return "mp3";
  return "m4a";
}

function microphoneLabel(device, index) {
  return String(device?.label || "").trim() || `Micro ${index + 1}`;
}

function microphoneSelects() {
  return [els.microphoneSelect, els.masterMicrophoneSelect].filter(Boolean);
}

function syncMicrophoneSelectValues() {
  microphoneSelects().forEach((select) => {
    const value = state.selectedMicrophoneId || "";
    if (value && ![...select.options].some((option) => option.value === value)) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = state.selectedMicrophoneLabel || "micro sélectionné";
      select.append(option);
    }
    select.value = value;
  });
}

function persistMicrophoneSelection() {
  localStorage.setItem(MICROPHONE_STORAGE, JSON.stringify({
    id: state.selectedMicrophoneId || "",
    label: state.selectedMicrophoneLabel || "",
  }));
}

function loadMicrophoneSelection() {
  try {
    const saved = JSON.parse(localStorage.getItem(MICROPHONE_STORAGE) || "{}");
    state.selectedMicrophoneId = String(saved.id || "");
    state.selectedMicrophoneLabel = String(saved.label || "");
  } catch {
    state.selectedMicrophoneId = "";
    state.selectedMicrophoneLabel = "";
  }
  syncMicrophoneSelectValues();
  updateMasterInputLabel();
  updateRecordingUi();
}

async function refreshMicrophoneDevices(requestPermission = false) {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Micro indisponible dans ce navigateur", "stop");
    return [];
  }
  let permissionStream = null;
  try {
    if (requestPermission) {
      permissionStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    const devices = typeof navigator.mediaDevices.enumerateDevices === "function"
      ? await navigator.mediaDevices.enumerateDevices()
      : [];
    const inputs = devices.filter((device) => device.kind === "audioinput");
    const availableInputIds = new Set();
    microphoneSelects().forEach((select) => {
      const current = state.selectedMicrophoneId || select.value || "";
      select.innerHTML = '<option value="">Aucun micro sélectionné</option>';
      inputs.forEach((device, index) => {
        const option = document.createElement("option");
        option.value = device.deviceId || "__default__";
        option.textContent = microphoneLabel(device, index);
        availableInputIds.add(option.value);
        select.append(option);
      });
      select.value = [...select.options].some((option) => option.value === current) ? current : "";
    });
    if (state.selectedMicrophoneId && !availableInputIds.has(state.selectedMicrophoneId)) {
      state.selectedMicrophoneId = "";
      state.selectedMicrophoneLabel = "";
      persistMicrophoneSelection();
      syncMicrophoneSelectValues();
      updateMasterInputLabel();
      updateRecordingUi();
    }
    if (els.microphoneSummary) {
      els.microphoneSummary.textContent = inputs.length
        ? "Choisir une source, puis cliquer sur Sélectionner. L’enregistrement démarrera au prochain clic sur l’icône micro."
        : "Aucun micro détecté.";
    }
    return inputs;
  } catch (error) {
    if (error?.name === "NotAllowedError" || error?.name === "SecurityError") {
      setStatus("Micro refusé: autoriser l’accès au micro dans les préférences système", "stop");
      if (els.microphoneSummary) {
        els.microphoneSummary.textContent = "Micro inaccessible : autoriser l’accès au micro dans les préférences système, puis actualiser.";
      }
      return [];
    }
    throw error;
  } finally {
    permissionStream?.getTracks().forEach((track) => track.stop());
  }
}

function openMicrophoneDialog(pad) {
  state.pendingRecordingPad = pad;
  if (els.microphoneSummary) {
    els.microphoneSummary.textContent = "Autoriser l’accès au micro, choisir une source, puis cliquer à nouveau sur l’icône micro pour enregistrer.";
  }
  refreshMicrophoneDevices(false).catch(() => {});
  if (els.microphoneDialog?.showModal) {
    els.microphoneDialog.showModal();
  } else {
    setStatus("Choisir un micro dans la fenêtre audio");
  }
}

async function selectMicrophoneFromDialog() {
  const select = els.microphoneSelect;
  const option = select?.selectedOptions?.[0];
  if (!select?.value) {
    state.selectedMicrophoneId = "";
    state.selectedMicrophoneLabel = "";
    persistMicrophoneSelection();
    syncMicrophoneSelectValues();
    updateMasterInputLabel();
    updateRecordingUi();
    setStatus("Micro non sélectionné", "stop");
    return;
  }
  state.selectedMicrophoneId = select.value;
  state.selectedMicrophoneLabel = option?.textContent || "micro sélectionné";
  persistMicrophoneSelection();
  syncMicrophoneSelectValues();
  updateMasterInputLabel();
  els.microphoneDialog?.close();
  window.setTimeout(() => els.microphoneDialog?.close(), 0);
  updateRecordingUi();
  setStatus(`Micro sélectionné: ${state.selectedMicrophoneLabel}. Cliquer à nouveau sur micro pour enregistrer.`);
}

function selectMicrophoneFromMaster() {
  const select = els.masterMicrophoneSelect;
  const option = select?.selectedOptions?.[0];
  state.selectedMicrophoneId = select?.value || "";
  state.selectedMicrophoneLabel = state.selectedMicrophoneId ? (option?.textContent || "micro sélectionné") : "";
  persistMicrophoneSelection();
  syncMicrophoneSelectValues();
  updateMasterInputLabel();
  updateRecordingUi();
  setStatus(state.selectedMicrophoneId ? `Micro sélectionné: ${state.selectedMicrophoneLabel}` : "Micro non sélectionné");
}

function microphoneConstraints() {
  return state.selectedMicrophoneId && state.selectedMicrophoneId !== "__default__"
    ? { audio: { deviceId: { exact: state.selectedMicrophoneId } } }
    : { audio: true };
}

function updateRecordingUi() {
  state.pads.forEach((pad) => {
    pad.recordButton?.classList.toggle("is-recording", state.recordingPad === pad);
    pad.recordButton?.classList.toggle("is-mic-ready", Boolean(state.selectedMicrophoneId) && state.recordingPad !== pad);
    pad.recordButton?.classList.toggle("is-mic-unset", !state.selectedMicrophoneId && state.recordingPad !== pad);
  });
  els.audioRecord?.classList.toggle("is-recording", Boolean(state.recordingPad));
  els.audioRecord?.classList.toggle("is-mic-ready", Boolean(state.selectedMicrophoneId) && !state.recordingPad);
  els.audioRecord?.classList.toggle("is-mic-unset", !state.selectedMicrophoneId && !state.recordingPad);
  els.audioRecord?.setAttribute("aria-pressed", String(Boolean(state.recordingPad)));
}

function clampEqGain(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(12, Math.max(-12, number)) : 0;
}

function configureEqFilter(filter, type, frequency, gain, q = 1) {
  if (!filter) return;
  filter.type = type;
  filter.frequency.value = frequency;
  if ("Q" in filter) filter.Q.value = q;
  filter.gain.value = clampEqGain(gain);
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
    state.masterEqLow = state.audioContext.createBiquadFilter();
    state.masterEqMid = state.audioContext.createBiquadFilter();
    state.masterEqHigh = state.audioContext.createBiquadFilter();
    state.masterAnalyser.fftSize = 256;
    state.masterMeterData = new Uint8Array(state.masterAnalyser.fftSize);
    state.masterGain.gain.value = clamp01(els.masterVolume.value);
    state.masterBypassGain.gain.value = clamp01(els.masterVolume.value);
    state.masterGain.connect(state.masterDry).connect(state.masterAnalyser);
    state.masterGain.connect(state.masterConvolver).connect(state.masterWet).connect(state.masterAnalyser);
    state.masterBypassGain.connect(state.masterAnalyser);
    state.masterAnalyser
      .connect(state.masterEqLow)
      .connect(state.masterEqMid)
      .connect(state.masterEqHigh);
    applyStoredMasterOutput().catch(() => {});
    applyMasterReverb();
    applyMasterEq();
  }
}

function masterOutputCanUseElementSink() {
  const audio = document.createElement("audio");
  return typeof audio.setSinkId === "function";
}

function ensureMasterOutputAudioElement() {
  if (state.masterOutputAudio) return state.masterOutputAudio;
  const audio = document.createElement("audio");
  audio.autoplay = true;
  audio.playsInline = true;
  audio.setAttribute("aria-hidden", "true");
  audio.style.display = "none";
  document.body.appendChild(audio);
  state.masterOutputAudio = audio;
  return audio;
}

function disconnectMasterFinalOutput() {
  if (!state.masterEqHigh) return;
  try {
    state.masterEqHigh.disconnect();
  } catch {
    // Already disconnected.
  }
}

function connectMasterDirectOutput() {
  if (!state.audioContext || !state.masterEqHigh) return false;
  disconnectMasterFinalOutput();
  state.masterOutputDestination = null;
  if (state.masterOutputAudio) {
    state.masterOutputAudio.pause();
    state.masterOutputAudio.srcObject = null;
  }
  state.masterEqHigh.connect(state.audioContext.destination);
  return true;
}

async function connectMasterStreamOutput(deviceId) {
  if (!state.audioContext || !state.masterEqHigh || !deviceId || !masterOutputCanUseElementSink()) return false;
  const audio = ensureMasterOutputAudioElement();
  const destination = state.audioContext.createMediaStreamDestination();
  disconnectMasterFinalOutput();
  state.masterOutputDestination = destination;
  state.masterEqHigh.connect(destination);
  audio.srcObject = destination.stream;
  try {
    await audio.setSinkId(deviceId);
    await audio.play();
    return true;
  } catch (error) {
    connectMasterDirectOutput();
    throw error;
  }
}

async function applyStoredMasterOutput() {
  if (!state.audioContext || !state.masterEqHigh) return false;
  if (!state.masterOutputDeviceId) return connectMasterDirectOutput();
  if (await connectMasterStreamOutput(state.masterOutputDeviceId)) return true;
  if (typeof state.audioContext.setSinkId !== "function") {
    connectMasterDirectOutput();
    return false;
  }
  connectMasterDirectOutput();
  await state.audioContext.setSinkId(state.masterOutputDeviceId);
  return true;
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
    uid: createId(),
    node,
    key: keyForIndex(index),
    title: `Pad ${index + 1}`,
    buffer: null,
    hasDirectAudio: false,
    source: null,
    gain: null,
    pan: null,
    analyser: null,
    meterData: null,
    audioName: "",
    audioUid: "",
    audioType: "",
    audioPath: "",
    audioPathTrusted: false,
    audioStored: false,
    audioPending: false,
    audioDuration: 0,
    audioSampleRate: 0,
    audioChannels: 0,
    audioByteLength: 0,
    videoName: "",
    videoPath: "",
    videoType: "",
    videoDuration: 0,
    videoWindow: null,
    videoUrl: "",
    videoTimer: null,
    textContent: "",
    textMode: false,
    textName: "",
    textLang: "fr-FR",
    textGender: "female",
    textVoiceURI: "",
    textRate: DEFAULT_TEXT_RATE,
    speechUtterance: null,
    speechStopTimer: null,
    speechFadeTimer: null,
    speechMutedPause: false,
    textStartedAt: 0,
    textDuration: 0,
    noteText: "",
    noteShowOnStart: false,
    noteShowOnEnd: false,
    startedAt: 0,
    stopAt: 0,
    duration: 0,
    playMode: "oneshot",
    resumeOffset: 0,
    keepResumeOffsetOnEnd: false,
    audioRefIndex: null,
    holdPointerId: null,
    holdPressTimer: null,
    holdTriggered: false,
    suppressNextStartClick: false,
    volume: 0.85,
    panValue: 0,
    loop: false,
    duckTrigger: false,
    duckMode: "none",
    duckPercent: 60,
    reverse: false,
    muted: false,
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
    eqMode: "global",
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    mono: false,
    normalizeEnabled: true,
    normalizedGain: 1,
    startStopMode: "none",
    startStopTag: "",
    endStartMode: "none",
    endStartTarget: "",
    trimStart: 0,
    trimEnd: 0,
    regions: [],
    envelope: [],
    waveformPeaks: [],
    visualImage: "",
    visualImageHidden: false,
    visualKind: "",
    visualPositionX: 50,
    visualPositionY: 50,
    visualZoom: 1,
    isPaused: false,
  };

  pad.titleEl = node.querySelector("[data-title]");
  pad.shortcutEl = node.querySelector("[data-shortcut]");
  pad.typeEl = node.querySelector("[data-pad-type]");
  pad.nameEl = node.querySelector("[data-name]");
  pad.tagsEl = node.querySelector("[data-tags]");
  pad.tagsDisplayEl = node.querySelector("[data-tags-display]");
  pad.tagsChipsEl = node.querySelector("[data-tags-chips]");
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
  pad.muteEl = node.querySelector('[data-action="mute"]');
  pad.cueButton = node.querySelector('[data-action="cue-preview"]');
  pad.noteButton = node.querySelector('[data-action="note"]');
  pad.cueButton?.setAttribute("aria-pressed", "false");
  if (pad.cueButton && !outputSelectionSupported()) {
    pad.cueButton.disabled = true;
    pad.cueButton.setAttribute("aria-disabled", "true");
  }
  pad.dragHandle = node.querySelector('[data-action="drag"]');
  pad.duplicateButton = node.querySelector('[data-action="duplicate-pad"]');
  pad.transferButton = node.querySelector('[data-action="transfer-pad"]');
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
    eqMode: pad.eqMode,
    eqLow: pad.eqLow,
    eqMid: pad.eqMid,
    eqHigh: pad.eqHigh,
    mono: pad.mono,
    reverse: pad.reverse,
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
  setPadTextSettings(pad, {
    textContent: pad.textContent,
    textMode: pad.textMode,
    textName: pad.textName,
    textLang: pad.textLang,
    textGender: pad.textGender,
    textVoiceURI: pad.textVoiceURI,
    textRate: pad.textRate,
  });
  setPadNote(pad, pad.noteText, pad.noteShowOnStart, pad.noteShowOnEnd);
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
    pad.imageInput.value = "";
    const image = await resizeImageForPad(file);
    if (!image) return;
    state.imageDialogMode = "image";
    setPadVisualImage(pad, image, false, { visualKind: "image" });
    if (state.imagePad === pad) syncImageDialog(pad);
    savePadMeta(pad);
  });
  pad.cameraInput?.addEventListener("change", async () => {
    const file = pad.cameraInput.files?.[0];
    if (!file) return;
    pad.cameraInput.value = "";
    const image = await resizeImageForPad(file);
    if (!image) return;
    state.imageDialogMode = "image";
    setPadVisualImage(pad, image, false, { visualKind: "image" });
    if (state.imagePad === pad) syncImageDialog(pad);
    savePadMeta(pad);
  });

  node.addEventListener("dragover", (event) => {
    if (document.body.classList.contains("stage-mode")) return;
    if (!event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    node.classList.add("is-drop-target");
  });
  node.addEventListener("dragleave", (event) => {
    if (!node.contains(event.relatedTarget)) node.classList.remove("is-drop-target");
  });
  node.addEventListener("drop", async (event) => {
    node.classList.remove("is-drop-target");
    if (document.body.classList.contains("stage-mode")) return;
    event.preventDefault();
    const files = [...(event.dataTransfer?.files || [])];
    if (!files.length) return;
    const isTextDoc = (f) => /^text\//.test(f.type) || /\.(rtf|docx|md|txt|text)$/i.test(f.name || "");
    const contentFile = files.find((f) => /^(audio|video|text)\//.test(f.type) || isTextDoc(f));
    const imageFile = files.find((f) => /^image\//.test(f.type));
    if (contentFile) {
      if (/^video\//.test(contentFile.type)) {
        await loadVideoIntoPad(pad, contentFile).catch(() => setStatus("Impossible de charger la vidéo", "stop"));
      } else if (isTextDoc(contentFile)) {
        try {
          const text = await readTextFile(contentFile);
          pad.textName = contentFile.name;
          setPadAsTextFromControls(pad, text);
          if (isDefaultPadTitle(pad.title)) setPadTitle(pad, cleanName(contentFile.name));
          savePadMeta(pad);
          setStatus("Texte importé");
        } catch {
          setStatus("Import texte impossible", "stop");
        }
      } else {
        await loadFileIntoPad(pad, contentFile).catch(() => setStatus("Impossible de charger l'audio", "stop"));
      }
    }
    if (imageFile) {
      try {
        const dataUrl = await resizeImageForPad(imageFile);
        if (dataUrl) {
          setPadVisualImage(pad, dataUrl, false, { visualKind: "image" });
          savePadMeta(pad);
        }
      } catch {
        setStatus("Impossible de charger l'illustration", "stop");
      }
    }
  });

  const trigger = node.querySelector('[data-action="play"]');
  node.addEventListener("click", (event) => {
    handleManualCrossfadePadClick(pad, event);
  }, { capture: true });
  node.addEventListener("click", (event) => {
    if (document.body.dataset.skin !== "basic" || pad.node.classList.contains("is-editing")) return;
    if (!pad.visualImage && !pad.color) return;
    if (pad.visualImageHidden) return;
    if (event.target.closest("input, select, textarea, dialog, .pad-progress, .visual-toggle-button")) return;
    const clickedButton = event.target.closest("button");
    if (clickedButton && clickedButton !== trigger) return;
    event.preventDefault();
    if (isPadPlaying(pad)) {
      stopPad(pad, fadeDurationForPad(pad, "out") > 0);
      return;
    }
    playPad(pad, fadeDurationForPad(pad, "in") > 0, 0).catch(() => setStatus("Lecture impossible", "stop"));
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
  node.querySelector('[data-action="stop"]').addEventListener("click", (event) => {
    stopEvent(event);
    stopPad(pad, fadeDurationForPad(pad, "out") > 0);
  });
  node.querySelector('[data-action="delete-pad"]').addEventListener("click", () => deletePad(pad));
  if (pad.duplicateButton) {
    pad.duplicateButton.dataset.padIndex = String(index);
    pad.duplicateButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      duplicatePadFromNode(node, pad);
    });
  }
  pad.transferButton?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openPadTransferDialog(pad);
  });
  node.querySelector('[data-action="audio"]').addEventListener("click", (event) => {
    stopEvent(event);
    openAudioDialog(pad);
  });
  pad.cueButton?.addEventListener("click", (event) => {
    stopEvent(event);
    if (!outputSelectionSupported()) {
      setStatus("Pré-écoute Cue indisponible dans ce navigateur", "stop");
      return;
    }
    previewPadCue(pad).catch(() => setStatus("Pré-écoute impossible", "stop"));
  });
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
    syncCueControls();
    savePadMeta(pad);
  });
  pad.tagsEl.addEventListener("input", () => {
    setPadTags(pad, pad.tagsEl.value);
    refreshStopGroupOptions();
    refreshBoardTagFilterOptions();
    refreshCrossfadeTargetOptions();
    syncCueControls();
    savePadMeta(pad);
  });
  pad.tagsEl.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const sorted = padTagList(pad).sort((a, b) => a.localeCompare(b)).join(", ");
      setPadTags(pad, sorted);
      const field = pad.tagsEl.closest(".tag-field");
      if (field) {
        field.classList.remove("tags-input-open");
        field.querySelector(".tags-add-btn")?.setAttribute("aria-expanded", "false");
      }
      pad.tagsEl.blur();
    }
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
    syncVideoProjectionAudio(pad);
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
    syncVideoProjectionAudio(pad);
    savePadMeta(pad);
  });

  pad.duckEl.addEventListener("click", () => {
    setPadDuckMode(pad, pad.duckTrigger ? "none" : "global", pad.duckPercent);
    applyDucking();
    savePadMeta(pad);
  });

  pad.muteEl?.addEventListener("click", (event) => {
    stopEvent(event);
    setPadMuted(pad, !pad.muted, false);
  });

  pad.noteButton?.addEventListener("click", (event) => {
    stopEvent(event);
    openNoteDialog(pad);
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
    if (mode === "oneshot") {
      button.addEventListener("pointerdown", (event) => {
        if (event.button != null && event.button !== 0) return;
        event.stopPropagation();
        pad.holdTriggered = false;
        pad.holdPointerId = event.pointerId;
        button.setPointerCapture?.(event.pointerId);
        window.clearTimeout(pad.holdPressTimer);
        pad.holdPressTimer = window.setTimeout(() => {
          pad.holdTriggered = true;
          setPadMode(pad, "hold");
          savePadMeta(pad);
          playPad(pad, fadeDurationForPad(pad, "in") > 0, 0).catch(() => setStatus("Lecture impossible", "stop"));
        }, PRESS_MS * 2);
      });
      const endStartPress = (event) => {
        if (pad.holdPointerId !== event.pointerId) return;
        window.clearTimeout(pad.holdPressTimer);
        pad.holdPressTimer = null;
        pad.holdPointerId = null;
        if (pad.holdTriggered) {
          event.preventDefault();
          pad.holdTriggered = false;
          pad.suppressNextStartClick = true;
          stopPad(pad, fadeDurationForPad(pad, "out") > 0);
        }
      };
      button.addEventListener("pointerup", endStartPress);
      button.addEventListener("pointercancel", endStartPress);
      button.addEventListener("pointerleave", (event) => {
        if (pad.holdPointerId === event.pointerId) endStartPress(event);
      });
    }
    button.addEventListener("click", (event) => {
      stopEvent(event);
      if (mode === "oneshot" && pad.suppressNextStartClick) {
        pad.suppressNextStartClick = false;
        return;
      }
      setPadMode(pad, mode);
      savePadMeta(pad);
      if (mode === "oneshot") {
        playPad(pad, fadeDurationForPad(pad, "in") > 0, 0).catch(() => setStatus("Lecture impossible", "stop"));
      } else if (mode === "toggle") {
        togglePad(pad);
      }
    });
  });

  syncHoverLabels(node);
  return pad;
}

function normalizeBoard(board, fallbackName = "Projet") {
  const mode = normalizeLayoutMode(board?.layoutMode);
  return {
    id: board?.id || createId(),
    name: board?.name || fallbackName,
    createdAt: board?.createdAt || new Date().toISOString(),
    padCount: Math.max(1, Number(board?.padCount) || DEFAULT_PAD_COUNT),
    masterVolume: clamp01(board?.masterVolume),
    layoutMode: mode,
    padColumns: mode === "custom" ? normalizeLayoutNumber(board?.padColumns, 4) : 0,
    padRows: mode === "custom" ? normalizeLayoutNumber(board?.padRows, 3) : 0,
    cuesEnabled: board?.cuesEnabled !== false,
    cues: normalizeCues(board?.cues),
    cueIndex: Math.max(0, Number(board?.cueIndex) || 0),
    skin: board?.skin || null,
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
  state.pads.forEach((pad) => syncVideoProjectionAudio(pad));
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
  const layout = effectiveLayoutForBoard(board);
  const enabled = layout.columns > 0 && layout.rows > 0;
  els.pads.classList.toggle("has-pad-layout", enabled);
  if (enabled) {
    els.pads.style.setProperty("--pad-columns", String(layout.columns));
    els.pads.style.setProperty("--pad-rows", String(layout.rows));
    els.pads.dataset.columns = String(layout.columns);
  } else {
    els.pads.style.removeProperty("--pad-columns");
    els.pads.style.removeProperty("--pad-rows");
    delete els.pads.dataset.columns;
  }
}

function activeFilterLabels() {
  const labels = [];
  state.activeStructuralFilters.forEach((val) => {
    const opt = els.boardTagFilter?.querySelector(`option[value="${val}"]`);
    if (opt) labels.push(opt.textContent.trim().toLowerCase());
  });
  state.activeTagFilters.forEach((tag) => labels.push(tag));
  return labels;
}

function applyBoardTagFilter() {
  const hasFilter = state.activeStructuralFilters.length > 0 || state.activeTagFilters.length > 0;
  const invert = state.invertSelection;
  // La sélection s'applique dès qu'il y a un filtre OU l'inversion (qui, sans
  // filtre, sélectionne tous les pads).
  const active = hasFilter || invert;
  const selectedPads = selectedPadsForCurrentFilter();
  const selectedSet = new Set(selectedPads);
  state.pads.forEach((pad) => {
    pad.node.classList.toggle("is-tag-match", active ? selectedSet.has(pad) : false);
    pad.node.classList.toggle("is-tag-dimmed", active ? !selectedSet.has(pad) : false);
  });
  if (!active) {
    // Pas de message « Mode … » (redondant avec les boutons de mode).
  } else if (!hasFilter) {
    // Inversion sans filtre = tous les pads sélectionnés.
    const n = selectedPads.length;
    setStatus(`${n} pad${n > 1 ? "s" : ""} sur ${state.pads.length} sélectionné${n > 1 ? "s" : ""}`);
  } else {
    const labels = activeFilterLabels();
    const sep = state.tagFilterLogic === "or" ? " OU " : " ET ";
    const labelStr = labels.join(sep);
    if (!selectedPads.length) {
      setStatus(invert ? `Tous les pads ont ${labelStr}` : `Aucun pad avec ${labelStr}`, "stop");
    } else {
      const n = selectedPads.length;
      setStatus(`${n} pad${n > 1 ? "s" : ""} sur ${state.pads.length} ${invert ? "sans" : "avec"} ${labelStr}`);
    }
  }
  if (els.bulkEditPads) {
    els.bulkEditPads.disabled = !active || selectedPads.length === 0;
  }
  syncFilterCompact();
  syncCompactToggleVisibility();
}

function cueActionLabel(action) {
  return {
    playPad: "Lance pad",
    stopPad: "Stoppe pad",
    playTag: "Lance tag",
    stopTag: "Stoppe tag",
    wait: "Attente",
  }[normalizeCueAction(action)] || "Cue";
}

function cueConditionLabel(step) {
  const normalized = normalizeCueStep(step);
  if (normalized.condition === "manual") return "";
  if (normalized.condition === "padEnd") {
    const pad = padFromTarget(normalized.conditionTarget);
    return `si fin pad · ${pad?.title || "choisir"}`;
  }
  const tag = normalized.conditionTarget.replace(/^tag:/, "") || "choisir";
  return `si fin tag · ${tag}`;
}

function cueStepLabel(step) {
  const normalized = normalizeCueStep(step);
  const condition = cueConditionLabel(normalized);
  if (normalized.action === "wait") {
    const label = `Attendre ${normalized.waitSeconds || 1}s`;
    return condition ? `${label} · ${condition}` : label;
  }
  const targets = padsFromCueTarget(normalized);
  const targetLabel = normalized.action.endsWith("Tag")
    ? normalized.target.replace(/^tag:/, "") || "tag"
    : (targets[0]?.title || "pad");
  const label = `${cueActionLabel(normalized.action)} · ${targetLabel}`;
  return condition ? `${label} · ${condition}` : label;
}

function cueTargetLabel(step) {
  const normalized = normalizeCueStep(step);
  if (normalized.action === "wait") return `${normalized.waitSeconds || 1}s`;
  if (!normalized.target) return "Choisir";
  if (normalized.action.endsWith("Tag")) return normalized.target.replace(/^tag:/, "") || "tag";
  return padsFromCueTarget(normalized)[0]?.title || "pad";
}

function cueFadeLabel(step) {
  const normalized = normalizeCueStep(step);
  if (normalized.action === "playPad") {
    const pad = padsFromCueTarget(normalized)[0];
    const seconds = pad ? fadeDurationForPad(pad, "in") : 0;
    return seconds > 0 ? `fade in ${seconds}s` : "";
  }
  if (normalized.action === "stopPad") {
    const pad = padsFromCueTarget(normalized)[0];
    const seconds = pad ? fadeDurationForPad(pad, "out") : 0;
    return seconds > 0 ? `fade out ${seconds}s` : "";
  }
  if (normalized.action === "playTag") return "fade in selon pads";
  if (normalized.action === "stopTag") return "fade out selon pads";
  return "";
}

function cueDurationUnits(step) {
  const normalized = normalizeCueStep(step);
  if (normalized.action === "wait") return Math.max(1, normalized.waitSeconds || 1);
  const fade = cueFadeLabel(normalized).match(/(\d+(?:\.\d+)?)s/);
  return fade ? Math.max(1, Number(fade[1])) : 1;
}

function cueIndexForBoard(board = currentBoard()) {
  const total = board?.cues?.length || 0;
  if (!total) return 0;
  return Math.min(total - 1, Math.max(0, Number(board?.cueIndex) || 0));
}

function clearCueWaitTimer() {
  if (state.cueWaitTimer) {
    window.clearTimeout(state.cueWaitTimer);
    state.cueWaitTimer = null;
  }
  if (els.cueNext) els.cueNext.disabled = false;
  if (els.cueRun) els.cueRun.disabled = false;
}

function syncCueControls() {
  const board = currentBoard();
  const cues = normalizeCues(board?.cues);
  if (board) {
    board.cues = cues;
    board.cueIndex = cueIndexForBoard(board);
    if (board.cuesEnabled == null) board.cuesEnabled = false;
  }
  const hasCues = cues.length > 0;
  const cuesEnabled = board?.cuesEnabled === true;
  document.body.classList.toggle("cues-enabled", Boolean(cuesEnabled));
  els.cueEditor?.classList.toggle("is-active", cuesEnabled);
  els.cueEditor?.setAttribute("aria-pressed", String(cuesEnabled));
  els.cueEditor?.setAttribute("aria-label", cuesEnabled ? "Désactiver les cues" : "Activer les cues");
  els.cueEditor?.setAttribute("title", cuesEnabled ? "Désactiver les cues" : "Activer les cues");
  const cueActionDisabled = !hasCues || !cuesEnabled || Boolean(state.cueWaitTimer);
  if (els.cueRun) els.cueRun.disabled = cueActionDisabled;
  if (els.cueNext) els.cueNext.disabled = cueActionDisabled;
  if (els.resetCuePosition) els.resetCuePosition.disabled = !hasCues || !cuesEnabled;
  const hasCrossfade = patchBayRows().length > 0;
  if (els.showCables) {
    const available = armedCrossfadeAvailable();
    els.showCables.disabled = !available;
    els.showCables.setAttribute("aria-disabled", String(!available));
  }
  if (!armedCrossfadeAvailable() && state.crossfadeArm.active) {
    cancelManualCrossfade({ message: "Crossfade armé désactivé" });
  }
  if (els.patchBay) els.patchBay.disabled = !hasCrossfade;
  if (!hasCrossfade && document.body.classList.contains("show-cables")) setCableOverlayVisible(false);
  if (els.cueStatus) {
    els.cueStatus.textContent = !cuesEnabled
      ? "Cues désactivées"
      : hasCues
      ? `${board.cueIndex + 1}/${cues.length} · ${cueStepLabel(cues[board.cueIndex])}`
      : "Pas de cue";
  }
  renderCueTimeline(cues);
  requestAnimationFrame(() => syncFloatingCueFrame(true));
}

function syncFloatingCueFrame(resetAnchor = false) {
  if (!els.liveTools) return;
  const shouldFloat = currentBoard()?.cuesEnabled === true && !state.boardEditMode;
  if (!shouldFloat) {
    document.body.classList.remove("cues-stuck");
    state.cueFloatAnchorTop = null;
    return;
  }
  const topOffset = Math.max(8, Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-top")) || 8);
  const wasStuck = document.body.classList.contains("cues-stuck");
  if (resetAnchor || state.cueFloatAnchorTop == null) {
    if (wasStuck) document.body.classList.remove("cues-stuck");
    state.cueFloatAnchorTop = els.liveTools.getBoundingClientRect().top + window.scrollY;
  }
  const shouldStick = window.scrollY + topOffset >= state.cueFloatAnchorTop;
  document.body.classList.toggle("cues-stuck", shouldStick);
}

function cueSelectablePads() {
  return state.pads.filter(cuePlayablePad);
}

function cueAutoAddablePads() {
  return cueSelectablePads();
}

function fillCueTargetSelect(select, action, selectedValue = "") {
  if (!select) return;
  const mode = normalizeCueAction(action);
  select.innerHTML = "";
  if (mode === "wait") {
    select.disabled = true;
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Attente";
    select.append(option);
    return;
  }
  select.disabled = false;
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Choisir";
  select.append(empty);

  if (mode.endsWith("Pad")) {
    const padGroup = document.createElement("optgroup");
    padGroup.label = "Pads";
    cueSelectablePads().forEach((pad) => {
      const option = document.createElement("option");
      option.value = padTargetValue(pad);
      option.textContent = padCueOptionLabel(pad);
      padGroup.append(option);
    });
    select.append(padGroup);
  } else {
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
  }

  select.value = [...select.options].some((option) => option.value === selectedValue) ? selectedValue : "";
}

function fillCueConditionTargetSelect(select, condition, selectedValue = "") {
  if (!select) return;
  const mode = normalizeCueCondition(condition);
  select.innerHTML = "";
  if (mode === "manual") {
    select.disabled = true;
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Manuel par défaut";
    select.append(option);
    return;
  }
  select.disabled = false;
  const empty = document.createElement("option");
  empty.value = "";
  empty.textContent = "Choisir";
  select.append(empty);
  if (mode === "padEnd") {
    const padGroup = document.createElement("optgroup");
    padGroup.label = "Pads";
    cueSelectablePads().forEach((pad) => {
      const option = document.createElement("option");
      option.value = padTargetValue(pad);
      option.textContent = padCueOptionLabel(pad);
      padGroup.append(option);
    });
    select.append(padGroup);
  } else {
    const tagGroup = document.createElement("optgroup");
    tagGroup.label = "Tags";
    boardTags().forEach((tag) => {
      const option = document.createElement("option");
      option.value = `tag:${tag}`;
      option.textContent = tag;
      tagGroup.append(option);
    });
    select.append(tagGroup);
  }
  select.value = [...select.options].some((option) => option.value === selectedValue) ? selectedValue : "";
}

function cueDraft() {
  if (!state.cueDraft) state.cueDraft = normalizeCues(currentBoard()?.cues);
  return state.cueDraft;
}

function syncAddAllCuePadsButton(draft = cueDraft()) {
  if (!els.addAllCuePads) return;
  const hasCueSteps = Boolean(draft?.length);
  const playableCount = cueAutoAddablePads().length;
  els.addAllCuePads.disabled = hasCueSteps || playableCount === 0;
  els.addAllCuePads.classList.toggle("is-disabled", els.addAllCuePads.disabled);
  els.addAllCuePads.title = hasCueSteps
    ? "Disponible seulement quand la liste de cues est vide"
    : playableCount
      ? `Ajouter ${playableCount} pad${playableCount > 1 ? "s" : ""} non vide${playableCount > 1 ? "s" : ""}`
      : "Aucun pad non vide";
}

function renderCueRows() {
  const perf = startPerfMeasure("renderCueRows");
  const draft = cueDraft();
  if (!els.cueRows) {
    perf.log("missing container", { cueCount: draft.length });
    return;
  }
  els.cueRows.innerHTML = "";
  syncAddAllCuePadsButton(draft);
  if (!draft.length) {
    const empty = document.createElement("p");
    empty.className = "cue-empty";
    empty.textContent = "Aucune étape. Ajouter une étape pour créer la séquence.";
    els.cueRows.append(empty);
    renderCueTimeline(draft);
    perf.log("complete", { cueCount: 0 });
    return;
  }
  draft.forEach((step, index) => {
    const row = document.createElement("div");
    row.className = "cue-row";
    row.draggable = true;
    row.dataset.cueIndex = String(index);

    const number = document.createElement("span");
    number.className = "cue-row-number";
    number.textContent = String(index + 1);

    const cueField = (label, element, className) => {
      const field = document.createElement("label");
      field.className = `cue-field ${className}`;
      const title = document.createElement("span");
      title.className = "cue-field-title";
      title.textContent = label;
      field.append(title, element);
      return field;
    };

    const action = document.createElement("select");
    action.setAttribute("aria-label", "Action cue");
    [
      ["playPad", "Lance pad"],
      ["stopPad", "Stoppe pad"],
      ["playTag", "Lance tag"],
      ["stopTag", "Stoppe tag"],
      ["wait", "Attendre"],
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      action.append(option);
    });
    action.value = normalizeCueAction(step.action);
    const actionField = cueField("Action", action, "cue-action-field");

    const target = document.createElement("select");
    target.setAttribute("aria-label", "Cible cue");
    fillCueTargetSelect(target, action.value, step.target);
    const targetField = cueField("Cible", target, "cue-target-field");

    const wait = document.createElement("input");
    wait.type = "number";
    wait.min = "0";
    wait.max = "600";
    wait.step = "1";
    wait.value = String(step.waitSeconds || 2);
    wait.setAttribute("aria-label", "Secondes");
    wait.disabled = action.value !== "wait";
    const waitField = document.createElement("label");
    waitField.className = "cue-field cue-wait-field";
    const waitTitle = document.createElement("span");
    waitTitle.className = "cue-field-title";
    waitTitle.textContent = "Durée de l'attente";
    const waitUnit = document.createElement("span");
    waitUnit.textContent = "secondes";
    waitField.append(waitTitle, wait, waitUnit);

    const condition = document.createElement("select");
    condition.setAttribute("aria-label", "Condition cue");
    [
      ["manual", "Manuel"],
      ["padEnd", "Quand pad finit"],
      ["tagEnd", "Quand tag finit"],
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      condition.append(option);
    });
    condition.value = normalizeCueCondition(step.condition);
    const conditionField = cueField("Condition", condition, "cue-condition-field");

    const conditionTarget = document.createElement("select");
    conditionTarget.setAttribute("aria-label", "Cible condition");
    fillCueConditionTargetSelect(conditionTarget, condition.value, step.conditionTarget);
    const conditionTargetField = cueField("Cible condition", conditionTarget, "cue-condition-target-field");

    const remove = document.createElement("button");
    remove.className = "icon-button cue-remove-button";
    remove.type = "button";
    remove.setAttribute("aria-label", "Supprimer cette cue");
    remove.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const syncCueRowFields = () => {
      const isWait = normalizeCueAction(action.value) === "wait";
      targetField.hidden = isWait;
      target.disabled = isWait;
      waitField.hidden = false;
      wait.disabled = !isWait;
      waitField.classList.toggle("is-disabled", !isWait);
      waitField.setAttribute("aria-disabled", String(!isWait));
    };
    syncCueRowFields();

    action.addEventListener("change", () => {
      step.action = normalizeCueAction(action.value);
      if (step.action === "wait") step.target = "";
      fillCueTargetSelect(target, step.action, step.target);
      syncCueRowFields();
      renderCueTimeline(draft);
    });
    condition.addEventListener("change", () => {
      step.condition = normalizeCueCondition(condition.value);
      if (step.condition === "manual") step.conditionTarget = "";
      fillCueConditionTargetSelect(conditionTarget, step.condition, step.conditionTarget);
      renderCueTimeline(draft);
    });
    target.addEventListener("change", () => {
      step.target = target.value;
      renderCueTimeline(draft);
    });
    conditionTarget.addEventListener("change", () => {
      step.conditionTarget = conditionTarget.value;
      renderCueTimeline(draft);
    });
    wait.addEventListener("input", () => {
      step.waitSeconds = Math.max(0, Math.round(Number(wait.value) || 0));
      renderCueTimeline(draft);
    });
    remove.addEventListener("click", () => {
      draft.splice(index, 1);
      renderCueRows();
    });
    row.addEventListener("dragstart", (event) => {
      state.cueDragIndex = index;
      row.classList.add("is-dragging");
      event.dataTransfer?.setData("text/plain", String(index));
      if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragend", () => {
      state.cueDragIndex = -1;
      row.classList.remove("is-dragging");
      els.cueRows?.querySelectorAll(".cue-row").forEach((item) => item.classList.remove("is-drop-target"));
    });
    row.addEventListener("dragover", (event) => {
      if (state.cueDragIndex < 0 || state.cueDragIndex === index) return;
      event.preventDefault();
      row.classList.add("is-drop-target");
      if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
    });
    row.addEventListener("dragleave", () => row.classList.remove("is-drop-target"));
    row.addEventListener("drop", (event) => {
      event.preventDefault();
      row.classList.remove("is-drop-target");
      const fromIndex = state.cueDragIndex;
      state.cueDragIndex = -1;
      if (fromIndex < 0 || fromIndex === index || !draft[fromIndex]) return;
      const [moved] = draft.splice(fromIndex, 1);
      draft.splice(index, 0, moved);
      renderCueRows();
    });

    row.append(number, actionField, targetField, waitField, conditionField, conditionTargetField, remove);
    els.cueRows.append(row);
  });
  renderCueTimeline(draft);
  perf.log("complete", { cueCount: draft.length });
}

function renderCueTimeline(cues = cueDraft()) {
  if (!els.cueTimeline) return;
  const normalizedCues = normalizeCues(cues);
  els.cueTimeline.innerHTML = "";
  els.cueTimeline.classList.toggle("is-empty", !normalizedCues.length);
  if (!normalizedCues.length) {
    const empty = document.createElement("p");
    empty.className = "cue-timeline-empty";
    empty.textContent = "Aucune étape cue.";
    els.cueTimeline.append(empty);
    return;
  }

  normalizedCues.forEach((step, index) => {
    const block = document.createElement("div");
    const actionGroup = step.action === "wait" ? "wait" : (step.action.startsWith("play") ? "play" : "stop");
    block.className = `cue-block cue-block-${actionGroup}`;
    if (currentBoard()?.cueIndex === index) block.classList.add("is-current");
    block.style.setProperty("--cue-units", String(cueDurationUnits(step)));

    const number = document.createElement("span");
    number.className = "cue-block-number";
    number.textContent = String(index + 1);

    const title = document.createElement("strong");
    title.textContent = cueActionLabel(step.action);

    const target = document.createElement("span");
    target.textContent = cueTargetLabel(step);

    const fade = document.createElement("small");
    fade.textContent = cueFadeLabel(step) || (step.action === "wait" ? "pause" : "cut direct");

    block.append(number, title, target, fade);

    const condition = cueConditionLabel(step);
    if (condition) {
      block.classList.add("has-condition");
      const conditionEl = document.createElement("em");
      conditionEl.className = "cue-block-condition";
      conditionEl.textContent = condition;
      block.append(conditionEl);
    }

    els.cueTimeline.append(block);
  });
}

function openCueDialog() {
  state.cueDraft = normalizeCues(currentBoard()?.cues);
  renderCueRows();
  if (els.cueDialog?.showModal) {
    els.cueDialog.showModal();
  } else {
    setStatus("Cues");
  }
}

function clearCueDialogDraft() {
  state.cueDraft = null;
  if (els.cueRows) els.cueRows.innerHTML = "";
  if (els.cueTimeline) {
    els.cueTimeline.innerHTML = "";
    els.cueTimeline.classList.add("is-empty");
  }
}

function cuePlayablePad(pad) {
  if (!pad) return false;
  if (pad.node?.classList.contains("is-empty") || pad.node?.classList.contains("is-missing-audio")) return false;
  const type = padType(pad);
  if (type === "video") return Boolean(String(pad.videoName || pad.videoPath || "").trim());
  if (type === "text") return Boolean(String(pad.textContent || "").trim());
  if (type !== "audio") return false;
  if (pad.buffer && Number.isFinite(Number(pad.buffer.duration)) && Number(pad.buffer.duration) > 0) return true;
  return Boolean(String(pad.audioName || pad.audioPath || "").trim());
}

function addAllPadsToCueDraft() {
  const draft = cueDraft();
  if (draft.length) {
    syncAddAllCuePadsButton(draft);
    setStatus("Liste cues non vide: ajout automatique désactivé", "stop");
    return;
  }
  const playablePads = cueAutoAddablePads();
  if (!playablePads.length) {
    renderCueRows();
    setStatus("Aucun pad non vide", "stop");
    return;
  }
  state.cueDraft = playablePads.map((pad) => (
    normalizeCueStep({
      action: "playPad",
      target: padTargetValue(pad),
    })
  ));
  renderCueRows();
  setStatus(`${playablePads.length} pad${playablePads.length > 1 ? "s" : ""} ajouté${playablePads.length > 1 ? "s" : ""}`);
}

function saveCueDraft() {
  const board = currentBoard();
  if (!board) return;
  board.cues = normalizeCues(state.cueDraft).filter((step) => {
    const hasActionTarget = step.action === "wait" || step.target;
    const hasConditionTarget = step.condition === "manual" || step.conditionTarget;
    if (!hasActionTarget || !hasConditionTarget) return false;
    if (step.action.endsWith("Pad")) {
      const targetPad = padsFromCueTarget(step)[0];
      if (!cuePlayablePad(targetPad)) return false;
    }
    if (step.condition === "padEnd") {
      const conditionPad = padsFromCrossfadeTarget(step.conditionTarget)[0];
      if (!cuePlayablePad(conditionPad)) return false;
    }
    return true;
  });
  board.cueIndex = Math.min(board.cues.length - 1, Math.max(0, Number(board.cueIndex) || 0));
  if (board.cueIndex < 0) board.cueIndex = 0;
  state.cueDraft = null;
  saveBoards();
  syncCueControls();
}

function padsFromCueTarget(step) {
  const target = String(step?.target || "").trim();
  if (!target) return [];
  if (target.startsWith("tag:")) return padsWithTag(target.slice(4));
  return padsFromCrossfadeTarget(target);
}

function cueConditionMet(step, endedPad = null) {
  const normalized = normalizeCueStep(step);
  if (normalized.condition === "manual") return false;
  if (!normalized.conditionTarget) return false;
  if (normalized.condition === "padEnd") {
    const targetPad = padFromTarget(normalized.conditionTarget);
    return Boolean(targetPad && targetPad === endedPad && !targetPad.source);
  }
  if (normalized.condition === "tagEnd") {
    const tag = normalized.conditionTarget.replace(/^tag:/, "");
    const pads = padsWithTag(tag);
    return Boolean(pads.length && (!endedPad || padTagList(endedPad).includes(tag)) && pads.every((pad) => !pad.source));
  }
  return false;
}

function cueConditionWaitLabel(step) {
  const normalized = normalizeCueStep(step);
  if (normalized.condition === "padEnd") {
    const pad = padFromTarget(normalized.conditionTarget);
    return `En attente de fin de pad : ${pad?.title || "cible condition"}`;
  }
  if (normalized.condition === "tagEnd") {
    const tag = normalized.conditionTarget.replace(/^tag:/, "");
    return `En attente de fin du tag : ${tag || "cible condition"}`;
  }
  return "Cue en attente de condition";
}

function checkCueConditions(endedPad = null) {
  const board = currentBoard();
  if (board?.cuesEnabled === false || !board?.cues?.length || state.cueRunning || state.cueWaitTimer) return;
  const step = normalizeCueStep(board.cues[cueIndexForBoard(board)]);
  if (!cueConditionMet(step, endedPad)) return;
  runCurrentCue({ automatic: true }).catch(() => setStatus("Cue condition impossible", "stop"));
}

async function executeCueStep(step) {
  const normalized = normalizeCueStep(step);
  if (normalized.action === "wait") {
    const seconds = Math.max(1, normalized.waitSeconds || 1);
    setStatus(`Cue attente ${seconds}s`);
    if (els.cueNext) els.cueNext.disabled = true;
    return new Promise((resolve) => {
      state.cueWaitTimer = window.setTimeout(() => {
        state.cueWaitTimer = null;
        resolve();
      }, seconds * 1000);
    });
  }

  const pads = padsFromCueTarget(normalized);
  if (!pads.length) {
    setStatus("Cue sans cible");
    return;
  }
  if (normalized.action.startsWith("play")) {
    await Promise.all(pads.map((pad) => playPad(pad, fadeDurationForPad(pad, "in") > 0, 0).catch(() => null)));
    setStatus(`${pads.length} cue${pads.length > 1 ? "s" : ""} lancée${pads.length > 1 ? "s" : ""}`);
  } else {
    pads.forEach((pad) => stopPad(pad, fadeDurationForPad(pad, "out") > 0));
    setStatus(`${pads.length} cue${pads.length > 1 ? "s" : ""} stoppée${pads.length > 1 ? "s" : ""}`);
  }
}

function advanceCuePosition() {
  const board = currentBoard();
  if (board?.cuesEnabled === false) {
    setStatus("Cues désactivées");
    syncCueControls();
    return;
  }
  if (!board?.cues?.length) {
    setStatus("Pas de cue");
    syncCueControls();
    return;
  }
  clearCueWaitTimer();
  board.cueIndex = (cueIndexForBoard(board) + 1) % board.cues.length;
  saveBoards();
  syncCueControls();
}

async function runCurrentCue(options = {}) {
  const board = currentBoard();
  if (board?.cuesEnabled === false) {
    setStatus("Cues désactivées");
    syncCueControls();
    return;
  }
  if (!board?.cues?.length) {
    setStatus("Pas de cue");
    syncCueControls();
    return;
  }
  clearCueWaitTimer();
  if (state.cueRunning) return;
  state.cueRunning = true;
  const index = cueIndexForBoard(board);
  const step = normalizeCueStep(board.cues[index]);
  try {
    if (!options.automatic && step.condition !== "manual") {
      setStatus(cueConditionWaitLabel(step));
      return;
    }
    if (options.automatic) setStatus("Cue condition");
    await executeCueStep(step);
    if (options.advance !== false) {
      board.cueIndex = board.cues.length ? (index + 1) % board.cues.length : 0;
    }
    saveBoards();
    syncCueControls();
  } finally {
    state.cueRunning = false;
  }
}

function padsForBoardTagSelection() {
  const value = String(els.boardTagFilter?.value || "").trim();
  const pads = padsForBoardFilterValue(value);
  if (pads.length || !value) return pads;
  return state.pads.filter((pad) => pad.node?.classList.contains("is-tag-match"));
}

function padsForBoardFilterValue(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return [];
  if (normalized === "all") return [...state.pads];
  if (normalized === "state:empty") return state.pads.filter(isEmptyPad);
  if (normalized.startsWith("type:")) {
    const type = normalized.slice(5);
    return state.pads.filter((pad) => padType(pad) === type);
  }
  if (normalized.startsWith("pad:")) {
    const index = Number(normalized.slice(4));
    return Number.isInteger(index) && state.pads[index] ? [state.pads[index]] : [];
  }
  if (normalized.startsWith("option:")) {
    const option = normalized.slice(7);
    return state.pads.filter((pad) => padMatchesAudioOption(pad, option));
  }
  if (normalized === "aspect:sketch") return state.pads.filter((pad) => pad.visualKind === "sketch");
  if (normalized === "aspect:image") return state.pads.filter((pad) => pad.visualKind === "image");
  if (normalized === "aspect:color") return state.pads.filter((pad) => Boolean(pad.color));
  return state.pads.filter((pad) => padTagList(pad).includes(normalized));
}

function padsForTagFilters(tagFilters, logic = "or") {
  if (!tagFilters.length) return [];
  if (logic === "and") {
    return state.pads.filter((pad) => tagFilters.every((tag) => padTagList(pad).includes(tag)));
  }
  return state.pads.filter((pad) => tagFilters.some((tag) => padTagList(pad).includes(tag)));
}

function matchingPadsForCurrentFilter() {
  const filterSets = [];
  state.activeStructuralFilters.forEach((val) => filterSets.push(new Set(padsForBoardFilterValue(val))));
  state.activeTagFilters.forEach((tag) => filterSets.push(new Set(state.pads.filter((p) => padTagList(p).includes(tag)))));
  if (!filterSets.length) return [];
  if (filterSets.length === 1) return [...filterSets[0]];
  if (state.tagFilterLogic === "or") {
    const union = new Set();
    filterSets.forEach((s) => s.forEach((p) => union.add(p)));
    return [...union];
  }
  let result = [...filterSets[0]];
  for (let i = 1; i < filterSets.length; i++) result = result.filter((p) => filterSets[i].has(p));
  return result;
}

// Pads réellement sélectionnés = ceux qui matchent le filtre, ou l'inverse quand
// l'inversion de sélection est active (sélectionne les pads NON sélectionnés).
function selectedPadsForCurrentFilter() {
  const matching = matchingPadsForCurrentFilter();
  // Sans inversion : les pads du filtre (vide si aucun filtre).
  if (!state.invertSelection) return matching;
  // Avec inversion : le complément — donc TOUS les pads s'il n'y a pas de filtre.
  const set = new Set(matching);
  return state.pads.filter((pad) => !set.has(pad));
}

function syncFilterCompact() {
  // Aucun pad sélectionné → « masquer les pads non sélectionnés » n'a pas de sens :
  // on force l'état neutre et on désactive le bouton (studio comme garage).
  const selectedCount = selectedPadsForCurrentFilter().length;
  if (selectedCount === 0 && state.filterCompact) state.filterCompact = false;
  const active = state.filterCompact && !state.stageMode;
  document.body.classList.toggle("filter-compact", active);
  if (els.filterCompactCount) {
    const hiddenCount = active
      ? state.pads.filter((p) => p.node?.classList.contains("is-tag-dimmed")).length
      : 0;
    els.filterCompactCount.textContent = active
      ? `${hiddenCount} masqué${hiddenCount > 1 ? "s" : ""}`
      : "";
    els.filterCompactCount.classList.toggle("is-empty", hiddenCount === 0);
  }
  if (els.filterCompactToggle) {
    els.filterCompactToggle.disabled = selectedCount === 0;
    els.filterCompactToggle.classList.toggle("is-active", active);
    els.filterCompactToggle.setAttribute(
      "aria-label",
      active ? "Tout afficher" : "Masquer les pads non sélectionnés"
    );
  }
}

function syncCompactToggleVisibility() {
  // visibility handled by CSS (garage only); just sync the active state here
  if (els.filterCompactToggle) {
    els.filterCompactToggle.classList.toggle("is-active", state.filterCompact);
  }
}

function makeChipGroup(label) {
  const group = document.createElement("div");
  group.className = "chip-group";
  const lbl = document.createElement("span");
  lbl.className = "chip-group-label";
  lbl.textContent = label;
  group.append(lbl);
  const chips = document.createElement("div");
  chips.className = "chip-group-chips";
  group.append(chips);
  return { group, chips };
}

function refreshTagFilterChips() {
  if (!els.tagFilterChips) return;
  els.tagFilterChips.innerHTML = "";
  const hasActiveFilters = state.activeStructuralFilters.length > 0 || state.activeTagFilters.length > 0;

  // Titre + toggle section
  const titleEl = document.getElementById("filterSectionTitle");
  if (titleEl) titleEl.textContent = state.boardEditMode ? "SÉLECTION / MODIFICATION" : "SÉLECTION";
  if (els.filterSectionToggle) {
    els.filterSectionToggle.setAttribute("aria-expanded", String(state.filterSectionOpen));
  }
  const countEl = document.getElementById("filterSectionCount");
  if (countEl) {
    const activeCount = state.activeStructuralFilters.length + state.activeTagFilters.length;
    countEl.textContent = String(activeCount);
    countEl.hidden = state.filterSectionOpen || activeCount === 0;
  }

  // Structural chips grouped by optgroup
  const totalPads = state.pads.length;
  const options = [...(els.boardTagFilter?.options || [])].filter((o) => o.value && o.value !== "all");
  const groupLabelMap = { "Types": "Type", "État": "État", "Aspect du pad": "Aspect", "Options audio": "Audio" };
  let currentGroup = null;
  let currentChips = null;
  options.forEach((opt) => {
    const groupLabel = opt.closest("optgroup")?.label || "";
    const shortLabel = groupLabelMap[groupLabel] || groupLabel;
    if (shortLabel !== currentGroup) {
      const { group, chips } = makeChipGroup(shortLabel);
      els.tagFilterChips.append(group);
      currentGroup = shortLabel;
      currentChips = chips;
    }
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tag-filter-chip structural-chip";
    chip.textContent = opt.textContent;
    chip.dataset.value = opt.value;
    chip.dataset.filterType = "structural";
    const matchCount = padsForBoardFilterValue(opt.value).length;
    if (state.activeStructuralFilters.includes(opt.value)) chip.classList.add("is-active");
    else if (totalPads > 0 && matchCount === totalPads) { chip.classList.add("is-universal"); chip.disabled = true; }
    else if (matchCount === 0) { chip.classList.add("is-void"); chip.disabled = true; }
    currentChips.append(chip);
  });

  // Tag chips group
  const tags = boardTags();
  if (tags.length > 0) {
    const { group, chips } = makeChipGroup("Tags");
    tags.forEach((tag) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tag-filter-chip";
      chip.textContent = tag;
      chip.dataset.tag = tag;
      chip.dataset.filterType = "tag";
      const tagCount = state.pads.filter((p) => padTagList(p).includes(tag)).length;
      if (state.activeTagFilters.includes(tag)) chip.classList.add("is-active");
      else if (totalPads > 0 && tagCount === totalPads) { chip.classList.add("is-universal"); chip.disabled = true; }
      else if (tagCount === 0) { chip.classList.add("is-void"); chip.disabled = true; }
      chips.append(chip);
    });
    els.tagFilterChips.append(group);
  }

  // Row visibility
  if (els.tagFilterChipsRow) {
    els.tagFilterChipsRow.hidden = (options.length === 0 && tags.length === 0) || !state.filterSectionOpen;
  }

  // Logic radio buttons
  if (els.tagFilterLogicGroup) {
    els.tagFilterLogicGroup.querySelectorAll(".tag-filter-logic-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.logic === state.tagFilterLogic);
    });
  }

  // Bouton inverser la sélection : toujours actif (sans filtre, il sélectionne tout).
  const invertBtn = document.getElementById("filterInvertBtn");
  if (invertBtn) {
    invertBtn.classList.toggle("is-active", state.invertSelection);
    invertBtn.disabled = false;
  }

  // Tous button greyed state
  if (els.filterTousBtn) {
    els.filterTousBtn.classList.toggle("is-empty", !hasActiveFilters);
  }

  syncCompactToggleVisibility();
}

function hasNumberChanged(value, defaultValue, epsilon = 0.0001) {
  return Math.abs((Number(value) || 0) - defaultValue) > epsilon;
}

function hasStringChanged(value, defaultValue = "") {
  return String(value ?? "").trim() !== defaultValue;
}

function isDefaultTitleForPad(pad) {
  const title = String(pad?.title || "").trim().toLowerCase();
  return !title || title === `pad ${Number(pad?.index) + 1}`;
}

function padHasCustomShortcut(pad) {
  const shortcut = state.shortcuts.find((item) => Number(item.padIndex) === pad.index);
  if (!shortcut) return false;
  return normalizeShortcutKey(shortcut.key) !== normalizeShortcutKey(KEYS[pad.index] || "");
}

function padHasCueReference(pad) {
  const cues = normalizeCues(currentBoard()?.cues);
  return cues.some((step) => {
    if (padsFromCueTarget(step).includes(pad)) return true;
    if (step.condition === "padEnd" && padFromTarget(step.conditionTarget) === pad) return true;
    if (step.condition === "tagEnd") return padsWithTag(step.conditionTarget.replace(/^tag:/, "")).includes(pad);
    return false;
  });
}

function isEmptyPad(pad) {
  if (!pad) return false;
  const isVisiblyEmpty = pad.node?.classList.contains("is-empty") || pad.node?.classList.contains("is-missing-audio");
  if (!isVisiblyEmpty) return false;
  return !(
    pad.buffer
    || pad.hasDirectAudio
    || hasStringChanged(pad.videoUrl)
    || pad.textMode
    || hasStringChanged(pad.textContent)
    || hasStringChanged(pad.textName)
    || hasStringChanged(pad.visualImage)
    || hasStringChanged(pad.noteText)
    || padTagList(pad).length
    || !isDefaultTitleForPad(pad)
    || padHasCustomShortcut(pad)
    || padHasCueReference(pad)
    || pad.startStopMode !== "none"
    || pad.endStartMode !== "none"
    || hasStringChanged(pad.startStopTag)
    || hasStringChanged(pad.endStartTarget)
    || hasStringChanged(pad.color)
  );
}

function syncBulkTemplateFields(pad) {
  if (!pad) return;
  // Référence des valeurs initiales : sert à restaurer un réglage quand on décoche sa case.
  state.bulkTemplatePadObj = pad;
  if (els.bulkVolume) els.bulkVolume.value = String(pad.volume);
  if (els.bulkPan) els.bulkPan.value = String(pad.panValue);
  if (els.bulkTags) els.bulkTags.value = pad.tags;
  renderBulkTagChips();
  updateBulkRangeValues();
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

function syncBulkVisualMode(mode = state.bulkVisualMode) {
  state.bulkVisualMode = ["color", "image", "sketch"].includes(mode) ? mode : "color";
  els.bulkVisualModeBtns?.forEach((btn) => btn.classList.toggle("is-active", btn.dataset.bulkVisualMode === state.bulkVisualMode));
  els.bulkVisualPanels?.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.bulkVisualPanel === state.bulkVisualMode));
}

function syncBulkSketchTools() {
  els.bulkSketchColorBtns?.forEach((btn) => {
    btn.classList.toggle("is-active", !state.bulkSketchEraser && btn.dataset.bulkSketchColor === state.bulkSketchColor);
  });
  els.bulkSketchSizeBtns?.forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.bulkSketchSize) === state.bulkSketchSize);
  });
  els.bulkSketchEraserBtn?.classList.toggle("is-active", state.bulkSketchEraser);
  els.bulkSketchEraserBtn?.setAttribute("aria-pressed", String(state.bulkSketchEraser));
}

function initBulkSketchCanvas() {
  const canvas = els.bulkSketchCanvas;
  if (!canvas) return null;
  canvas.width = 640;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#111319";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.lineCap = "round";
  return ctx;
}

function clearBulkSketchCanvas() {
  const canvas = els.bulkSketchCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#111319";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function bindBulkSketchCanvas() {
  const canvas = els.bulkSketchCanvas;
  if (!canvas) return;

  function sketchPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = state.bulkSketchEraser ? Math.max(state.bulkSketchSize * 2.5, 20) : state.bulkSketchSize;
    ctx.strokeStyle = state.bulkSketchEraser ? "#111319" : state.bulkSketchColor;
    state.bulkSketchDrawing = true;
    canvas.setPointerCapture?.(event.pointerId);
    const point = sketchPoint(event);
    if (!point) return;
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!state.bulkSketchDrawing) return;
    const ctx = canvas.getContext("2d");
    const point = sketchPoint(event);
    if (!point) return;
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  });

  canvas.addEventListener("pointerup", () => { state.bulkSketchDrawing = false; });
  canvas.addEventListener("pointercancel", () => { state.bulkSketchDrawing = false; });
}

function bindBulkSketchTools() {
  els.bulkSketchColorBtns?.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.bulkSketchColor = btn.dataset.bulkSketchColor;
      state.bulkSketchEraser = false;
      syncBulkSketchTools();
    });
  });
  els.bulkSketchSizeBtns?.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.bulkSketchSize = Number(btn.dataset.bulkSketchSize);
      syncBulkSketchTools();
    });
  });
  els.bulkSketchEraserBtn?.addEventListener("click", () => {
    state.bulkSketchEraser = !state.bulkSketchEraser;
    syncBulkSketchTools();
  });
  els.bulkSketchClear?.addEventListener("click", clearBulkSketchCanvas);
}

function bindBulkVisual() {
  els.bulkVisualModeBtns?.forEach((btn) => {
    btn.addEventListener("click", () => {
      syncBulkVisualMode(btn.dataset.bulkVisualMode);
      if (state.bulkVisualMode === "sketch" && !state.bulkSketchInitialized) {
        initBulkSketchCanvas();
        syncBulkSketchTools();
        state.bulkSketchInitialized = true;
      }
      if (state.bulkVisualMode === "image") {
        els.bulkImageInput?.click();
      }
    });
  });

  els.bulkImageInput?.addEventListener("change", () => {
    const file = els.bulkImageInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      state.bulkVisualImage = e.target.result;
      const canvas = els.bulkImageCanvas;
      if (!canvas) return;
      const img = new Image();
      img.onload = () => {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext("2d").drawImage(img, 0, 0);
      };
      img.src = state.bulkVisualImage;
    };
    reader.readAsDataURL(file);
  });
}

function fillActionSelect(select, selectedValue = "none") {
  if (!select) return;
  select.innerHTML = '<option value="none">Pas d’effet</option><option value="play">Lance pad ou tag</option><option value="duck">Duck pad ou tag</option><option value="mute">Mute/demute pad ou tag</option><option value="stop">Stoppe pad ou tag</option>';
  select.value = ["none", "play", "duck", "mute", "stop"].includes(selectedValue) ? selectedValue : "none";
}

function fillBulkCrossfadeControls(pad) {
  fillActionSelect(els.bulkStartStopMode, pad?.startStopMode || "none");
  fillActionSelect(els.bulkEndStartMode, pad?.endStartMode || "none");
  fillCrossfadeTargetSelect(els.bulkStartStopTarget, pad?.startStopTag || "");
  fillCrossfadeTargetSelect(els.bulkEndStartTarget, pad?.endStartTarget || "");
}

function resetBulkAutoTrimUi() {
  state.bulkAutoTrimResults = null;
  if (els.bulkApplyAutoTrim) els.bulkApplyAutoTrim.checked = false;
  if (els.bulkAutoTrimStatus) els.bulkAutoTrimStatus.textContent = "Non calculé";
}

async function prepareBulkAutoTrim() {
  const pads = state.bulkEditPads.filter((pad) => pad && padType(pad) === "audio");
  if (!pads.length) {
    resetBulkAutoTrimUi();
    setStatus("Trim auto groupé : aucun pad audio", "stop");
    return;
  }
  if (els.bulkAutoTrim) els.bulkAutoTrim.disabled = true;
  if (els.bulkAutoTrimStatus) els.bulkAutoTrimStatus.textContent = "Calcul...";
  const results = new Map();
  let detectedCount = 0;
  let skippedCount = 0;
  try {
    for (const pad of pads) {
      try {
        const result = await calculateAutoTrimForPad(pad);
        if (result?.detected) {
          results.set(pad.index, result);
          detectedCount += 1;
        } else {
          skippedCount += 1;
        }
      } catch (error) {
        console.error(error);
        skippedCount += 1;
      }
    }
    state.bulkAutoTrimResults = results.size ? results : null;
    if (els.bulkApplyAutoTrim) els.bulkApplyAutoTrim.checked = Boolean(results.size);
    const summary = results.size
      ? `${detectedCount} prêt${detectedCount > 1 ? "s" : ""}${skippedCount ? `, ${skippedCount} ignoré${skippedCount > 1 ? "s" : ""}` : ""}`
      : "Aucun silence détecté";
    if (els.bulkAutoTrimStatus) els.bulkAutoTrimStatus.textContent = summary;
    setStatus(`Trim auto groupé : ${summary}`);
  } finally {
    if (els.bulkAutoTrim) els.bulkAutoTrim.disabled = false;
  }
}

// Le bouton « Appliquer » n'est actif que si au moins un champ est coché (une
// modification à appliquer). Sinon désactivé (à l'ouverture notamment).
function syncBulkApplyState() {
  const anyChecked = [
    els.bulkApplyVolume, els.bulkApplyPan, els.bulkApplyTags, els.bulkApplyVisual,
    els.bulkApplyLiveFade, els.bulkApplyAudioFlags, els.bulkApplyAutoTrim,
    els.bulkApplyReverb, els.bulkApplyCrossfade,
  ].some((cb) => cb?.checked);
  if (els.applyBulkEdit) els.applyBulkEdit.disabled = !anyChecked;
}

// Valeur chiffrée du volume (%) et du pan (−100…100, 0 = centre).
function updateBulkRangeValues() {
  if (els.bulkVolumeValue && els.bulkVolume) {
    els.bulkVolumeValue.textContent = `${Math.round((Number(els.bulkVolume.value) || 0) * 100)}%`;
  }
  if (els.bulkPanValue && els.bulkPan) {
    els.bulkPanValue.textContent = String(Math.round((Number(els.bulkPan.value) || 0) * 100));
  }
}

// Tags en chips (même principe que le pad) : le champ #bulkTags porte la chaîne
// « a, b, c », les chips en sont le rendu (avec × pour retirer).
function renderBulkTagChips() {
  const chips = els.bulkTagsChips;
  if (!chips || !els.bulkTags) return;
  chips.innerHTML = "";
  const list = [...new Set(
    els.bulkTags.value.split(/[#,;]+|\s+/).map((t) => t.trim().toLowerCase()).filter(Boolean)
  )];
  list.forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "pad-tag-chip";
    chip.textContent = tag;
    const rm = document.createElement("button");
    rm.type = "button";
    rm.className = "pad-tag-chip-remove";
    rm.setAttribute("aria-label", `Supprimer le tag ${tag}`);
    rm.textContent = "×";
    rm.addEventListener("click", (e) => {
      e.stopPropagation();
      els.bulkTags.value = list.filter((t) => t !== tag).join(", ");
      renderBulkTagChips();
      markBulkFieldChanged(els.bulkApplyTags);
    });
    chip.append(rm);
    chips.append(chip);
  });
}

// Modifier un réglage coche automatiquement sa case « appliquer ».
function markBulkFieldChanged(applyCheckbox) {
  if (applyCheckbox && !applyCheckbox.checked) applyCheckbox.checked = true;
  syncBulkApplyState();
}

// Groupes « case ↔ contrôles » : chaque groupe sait restaurer ses contrôles à la
// valeur initiale (celle du pad modèle) quand on décoche sa case.
function bulkFieldGroups() {
  const restoreReverb = (pad) => {
    if (els.bulkReverbNone) els.bulkReverbNone.checked = pad.reverbMode === "none";
    if (els.bulkReverbGlobal) els.bulkReverbGlobal.checked = pad.reverbMode !== "none" && pad.reverbMode !== "pad";
    if (els.bulkReverbPad) els.bulkReverbPad.checked = pad.reverbMode === "pad";
    if (els.bulkReverbPreset) els.bulkReverbPreset.value = pad.reverbPreset === "none" ? "hall" : pad.reverbPreset;
    if (els.bulkReverbWet) els.bulkReverbWet.value = String(pad.reverbWet ?? 0.5);
  };
  return [
    { apply: els.bulkApplyVolume, controls: [els.bulkVolume],
      restore: (pad) => { if (els.bulkVolume) els.bulkVolume.value = String(pad.volume); updateBulkRangeValues(); } },
    { apply: els.bulkApplyPan, controls: [els.bulkPan],
      restore: (pad) => { if (els.bulkPan) els.bulkPan.value = String(pad.panValue); updateBulkRangeValues(); } },
    { apply: els.bulkApplyTags, controls: [els.bulkTags],
      restore: (pad) => { if (els.bulkTags) els.bulkTags.value = pad.tags; renderBulkTagChips(); } },
    { apply: els.bulkApplyLiveFade, controls: [els.bulkFadeInEnabled, els.bulkFadeOutEnabled],
      restore: (pad) => {
        if (els.bulkFadeInEnabled) els.bulkFadeInEnabled.checked = pad.fadeInEnabled;
        if (els.bulkFadeOutEnabled) els.bulkFadeOutEnabled.checked = pad.fadeOutEnabled;
      } },
    { apply: els.bulkApplyAudioFlags, controls: [els.bulkLoop, els.bulkDuck],
      restore: (pad) => {
        if (els.bulkLoop) els.bulkLoop.checked = pad.loop;
        if (els.bulkDuck) els.bulkDuck.checked = pad.duckTrigger;
      } },
    { apply: els.bulkApplyReverb,
      controls: [els.bulkReverbNone, els.bulkReverbGlobal, els.bulkReverbPad, els.bulkReverbPreset, els.bulkReverbWet],
      restore: restoreReverb },
    { apply: els.bulkApplyCrossfade,
      controls: [els.bulkStartStopMode, els.bulkStartStopTarget, els.bulkEndStartMode, els.bulkEndStartTarget],
      restore: (pad) => fillBulkCrossfadeControls(pad) },
    { apply: els.bulkApplyVisual, controls: [],
      restore: (pad) => setBulkColorValue(pad.color || "") },
  ];
}

function bindBulkFieldGroups() {
  bulkFieldGroups().forEach((group) => {
    group.controls.filter(Boolean).forEach((control) => {
      const evt = control.type === "range" || control.type === "text" ? "input" : "change";
      control.addEventListener(evt, () => markBulkFieldChanged(group.apply));
    });
    group.apply?.addEventListener("change", () => {
      // Décocher = revenir à la valeur initiale du réglage.
      if (!group.apply.checked && state.bulkTemplatePadObj) group.restore(state.bulkTemplatePadObj);
      syncBulkApplyState();
    });
  });
  // Aspect du pad : choisir une couleur coche la case correspondante.
  els.bulkColorButtons?.forEach((btn) => {
    btn.addEventListener("click", () => markBulkFieldChanged(els.bulkApplyVisual));
  });
}

function openBulkEditDialog() {
  const singleStructural = state.activeStructuralFilters.length === 1 && !state.activeTagFilters.length
    ? state.activeStructuralFilters[0] : null;
  let pads = selectedPadsForCurrentFilter();
  if (!pads.length && !state.activeStructuralFilters.length && !state.activeTagFilters.length) {
    pads = padsForBoardTagSelection();
  }
  if (!pads.length) {
    setStatus(activeFilterLabels().length ? `Aucun pad avec ${activeFilterLabels().join(", ")}` : "Sélectionner des pads avec les filtres");
    return;
  }
  if (singleStructural === "state:empty") {
    confirmDeleteEmptyPads(pads).catch(() => setStatus("Suppression des pads vides impossible", "stop"));
    return;
  }

  const isAspectPreset = Boolean(singleStructural?.startsWith("aspect:"));
  if (!isAspectPreset && !state.activeStructuralFilters.length && !state.activeTagFilters.length) {
    const shouldEditAll = window.confirm("Modifier tous les pads ?");
    if (!shouldEditAll) return;
    pads = state.pads;
  }

  state.bulkEditPads = pads;
  resetBulkAutoTrimUi();
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
  [els.bulkApplyVolume, els.bulkApplyPan, els.bulkApplyTags, els.bulkApplyVisual, els.bulkApplyLiveFade, els.bulkApplyAudioFlags, els.bulkApplyAutoTrim, els.bulkApplyReverb, els.bulkApplyCrossfade]
    .forEach((checkbox) => { if (checkbox) checkbox.checked = false; });

  if (isAspectPreset) {
    const mode = singleStructural === "aspect:sketch" ? "sketch" : singleStructural === "aspect:image" ? "image" : "color";
    syncBulkVisualMode(mode);
    if (els.bulkApplyVisual) els.bulkApplyVisual.checked = true;
    if (mode === "sketch" && !state.bulkSketchInitialized) {
      initBulkSketchCanvas();
      syncBulkSketchTools();
      state.bulkSketchInitialized = true;
    }
  } else {
    syncBulkVisualMode(state.bulkVisualMode);
  }

  syncBulkTemplateFields(pads[0]);
  syncBulkApplyState();
  if (els.bulkEditDialog?.showModal) {
    els.bulkEditDialog.showModal();
    if (isAspectPreset && state.bulkVisualMode === "image") els.bulkImageInput?.click();
  } else {
    setStatus("Modification groupée prête");
  }
}

async function confirmDeleteEmptyPads(pads) {
  const uniquePads = [...new Set(pads)].filter(Boolean);
  if (!uniquePads.length) {
    window.alert("Aucun pad vide sélectionné");
    return;
  }
  const count = uniquePads.length;
  const label = `${count} pad${count > 1 ? "s" : ""} vide${count > 1 ? "s" : ""}`;
  const remainingCount = Math.max(1, currentBoard().padCount - count);
  const suffix = count >= currentBoard().padCount
    ? "\n\nLe dernier pad du board sera conservé."
    : "";
  if (!window.confirm(`Supprimer ${label} ?${suffix}`)) return;

  const indexes = uniquePads
    .map((pad) => pad.index)
    .filter((index) => Number.isInteger(index))
    .sort((a, b) => b - a);
  let deletedCount = 0;
  for (const index of indexes) {
    if (currentBoard().padCount <= 1) break;
    const pad = state.pads[index];
    if (!pad || !isEmptyPad(pad)) continue;
    const removed = await removePadFromCurrentBoard(pad, { confirm: false, render: false, status: false });
    if (removed) deletedCount += 1;
  }

  if (deletedCount) {
    await renderPads();
    setBoardPadEditing(true);
  }
  state.activeStructuralFilters = [];
  state.activeTagFilters = [];
  refreshBoardTagFilterOptions();
  applyBoardTagFilter();
  const keptLast = count > deletedCount && remainingCount === 1;
  setStatus(`${deletedCount} pad${deletedCount > 1 ? "s" : ""} vide${deletedCount > 1 ? "s" : ""} supprimé${deletedCount > 1 ? "s" : ""}${keptLast ? " · dernier pad conservé" : ""}`);
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
    if (els.bulkApplyVisual?.checked) {
      if (state.bulkVisualMode === "color") {
        setPadColor(pad, els.bulkColor?.value || "");
      } else if (state.bulkVisualMode === "image" && state.bulkVisualImage) {
        setPadVisualImage(pad, state.bulkVisualImage, false, { visualKind: "image" });
      } else if (state.bulkVisualMode === "sketch") {
        const dataUrl = els.bulkSketchCanvas?.toDataURL("image/png");
        if (dataUrl) setPadVisualImage(pad, dataUrl, false, { visualKind: "sketch" });
      }
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
    const bulkTrim = els.bulkApplyAutoTrim?.checked ? state.bulkAutoTrimResults?.get(pad.index) : null;
    if (bulkTrim) {
      setPadTrim(pad, bulkTrim.start, bulkTrim.end);
      updatePadTime(pad);
    }
    await savePadMeta(pad);
  }
  refreshStopGroupOptions();
  refreshBoardTagFilterOptions();
  refreshCrossfadeTargetOptions();
  applyDucking();
  state.activeStructuralFilters = [];
  state.activeTagFilters = [];
  refreshTagFilterChips();
  applyBoardTagFilter();
  els.bulkEditDialog?.close();
  setStatus(`${pads.length} pad${pads.length > 1 ? "s" : ""} modifié${pads.length > 1 ? "s" : ""}`);
}

function renderBoardLayoutControls() {
  const board = currentBoard();
  if (!board) return;
  const layout = effectiveLayoutForBoard(board);
  const portraitLocked = shouldForcePortablePortraitLayout();
  const landscapeLimited = shouldLimitPortableLandscapeColumns();

  if (els.padColumns) {
    renderPadColumnOptions(landscapeLimited ? 5 : 8);
    els.padColumns.value = portraitLocked ? "2" : (layout.mode === "auto" ? "auto" : String(layout.columns || 4));
    els.padColumns.disabled = portraitLocked;
    els.padColumns.setAttribute("aria-disabled", String(portraitLocked));
  }

  const displayedColumns = portraitLocked ? 2 : layout.columns || 4;
  if (els.padColumnsComputed) {
    els.padColumnsComputed.textContent = String(displayedColumns);
  }
  if (els.padRows) {
    const rows = portraitLocked
      ? Math.max(1, Math.ceil((Number(board.padCount) || DEFAULT_PAD_COUNT) / 2))
      : layout.rows || "";
    els.padRows.value = rows;
    els.padRows.textContent = String(rows);
  }
}

function updateBoardLayout() {
  const board = currentBoard();
  if (!board) return;
  if (shouldForcePortablePortraitLayout()) {
    renderBoardLayoutControls();
    applyPadLayout(board);
    setStatus("Mode portrait portable : 2 colonnes fixes");
    return;
  }
  if (els.padColumns?.value === "auto") {
    board.layoutMode = "auto";
    board.padColumns = 0;
    board.padRows = 0;
  } else {
    board.layoutMode = "custom";
    const selectedColumns = normalizeLayoutNumber(els.padColumns?.value, board.padColumns || 4);
    board.padColumns = shouldLimitPortableLandscapeColumns() ? Math.min(selectedColumns, 5) : selectedColumns;
    board.padRows = Math.max(1, Math.ceil(board.padCount / board.padColumns));
  }
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
  const stageTitle = document.getElementById("stageBoardTitle");
  if (stageTitle) stageTitle.textContent = currentBoard().name;
  setMasterVolume(currentBoard().masterVolume ?? DEFAULT_MASTER_VOLUME, false);
  renderBoardLayoutControls();
  applyPadLayout();
  refreshVersionOptions();
  syncCueControls();
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
  const previousPointerEvents = draggedPad.node.style.pointerEvents;
  draggedPad.node.style.pointerEvents = "none";

  const targetNode = document.elementFromPoint(clientX, clientY)?.closest("[data-pad]");

  draggedPad.node.style.pointerEvents = previousPointerEvents;

  const targetPad = state.pads.find((pad) => pad.node === targetNode);
  if (!targetPad || targetPad === draggedPad) return -1;

  const orderedPads = state.pads.filter((pad) => pad !== draggedPad);
  const targetIndex = orderedPads.indexOf(targetPad);
  if (targetIndex < 0) return -1;

  const rect = targetPad.node.getBoundingClientRect();
  const after = clientX > rect.left + rect.width / 2;

  const toIndex = targetIndex + (after ? 1 : 0);
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
      syncPadIndexesFromDom();
      refreshStopGroupOptions();
      refreshBoardTagFilterOptions();
      refreshCrossfadeTargetOptions();
      updateShortcutIndicators();
      setBoardPadEditing(true);
      setStatus("Pads réordonnés");
    } catch {
      state.pads = drag.originalPads;
      state.pads.forEach((item) => els.pads.append(item.node));
      setBoardPadEditing(true);
      setStatus("Réorganisation impossible", "stop");
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

async function renderPads(options = {}) {
  const perf = startPerfMeasure("renderPads");
  const preserveEditMode = options.preserveEditMode === true && state.boardEditMode;
  cancelManualCrossfade({ silent: true });
  stopAll();
  resetRecordingState();
  if (!preserveEditMode) {
    state.boardEditMode = false;
    document.body.classList.remove("board-edit-mode");
    setBoardEditing(false, false);
  }
  if (!preserveEditMode) {
    els.editPads?.classList.remove("is-active");
    els.editPads?.setAttribute("aria-pressed", "false");
  }
  state.pads = [];
  els.pads.innerHTML = "";
  const board = currentBoard();
  perf.log("preparation complete", { padCount: board.padCount });
  // Immediate feedback while a large board is being prepared.
  setStatus("Ouverture du board…", "progress");
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const restoreJobs = [];
  for (let index = 0; index < board.padCount; index += 1) {
    const pad = makePad(index);
    state.pads.push(pad);
    els.pads.append(pad.node);
    bindButtonFeedback(pad.node);
    restoreJobs.push(
      restorePad(pad).catch((error) => {
        pad.node.classList.add("is-empty");
        console.debug("[perf]", "restorePad", "error", {
          padIndex: pad.index,
          padNumber: pad.index + 1,
          title: pad.title,
          error: error?.message || String(error),
        });
        return {
          padIndex: pad.index,
          padNumber: pad.index + 1,
          title: pad.title,
          detectedType: "empty",
          totalMs: 0,
          mediaSizeBytes: 0,
          duration: 0,
          audioLink: "none",
          error: true,
        };
      })
    );
  }
  perf.log("restore queued", { padCount: restoreJobs.length });
  const restoreStartedAt = performance.now();
  const restoreTotal = restoreJobs.length;
  let restoreDone = 0;
  const trackedJobs = restoreJobs.map((job) => job.then((res) => {
    restoreDone += 1;
    setStatus(`Ouverture du board… ${restoreDone} / ${restoreTotal}`, "progress");
    return res;
  }));
  const restoreResults = await Promise.all(trackedJobs);
  perf.log("restore complete", {
    padCount: restoreJobs.length,
    ...restorePadResultSummary(restoreResults, Number((performance.now() - restoreStartedAt).toFixed(2))),
  });
  refreshStopGroupOptions();
  refreshBoardTagFilterOptions();
  refreshCrossfadeTargetOptions();
  loadShortcutsForCurrentBoard();
  renderShortcutRows();
  updateShortcutIndicators();
  updateRecordingUi();
  syncCueControls();
  setStatus("Board prêt pour l’édition", "success");
  perf.log("complete", { padCount: state.pads.length });
  state.pads.forEach(fitPadTitle);
  updateAllPadAlerts(); // calcule les badges (dont source/cible crossfade) après restauration
  if (!state.stageMode) backfillPadDurations(); // durées affichées sans passer par la scène
}

async function switchBoard(boardId) {
  if (state.stageMode) {
    if (els.boardSelect) els.boardSelect.value = state.currentBoardId;
    setStatus("Mode scène : changement de board désactivé");
    return;
  }
  const wasEditing = state.boardEditMode;
  clearCueWaitTimer();
  setBoardPadEditing(false);
  if (wasEditing) {
    state.boardEditMode = true;
    document.body.classList.add("board-edit-mode");
  }
  state.currentBoardId = boardId;
  const newBoard = state.boards.find((b) => b.id === boardId) || state.boards[0];
  const boardSkin = newBoard?.skin || localStorage.getItem(SKIN_STORAGE) || "classic";
  applySkin(boardSkin);
  if (!newBoard?.skin) saveSkinToCurrentBoard(); // inherit global skin for new boards
  saveBoards();
  renderBoardOptions();
  await renderPads({ preserveEditMode: wasEditing });
  if (wasEditing) setBoardPadEditing(true);
}

async function addBoard() {
  setBoardPadEditing(false);
  const name = nextBoardName();
  const board = {
    id: createId(),
    name,
    createdAt: new Date().toISOString(),
    padCount: DEFAULT_PAD_COUNT,
    masterVolume: DEFAULT_MASTER_VOLUME,
    layoutMode: "auto",
    padColumns: 0,
    padRows: 0,
    cuesEnabled: false,
    cues: [],
    cueIndex: 0,
  };
  state.boards.push(board);
  state.currentBoardId = board.id;
  applyDefaultMasterAudioSettings(false, true);
  state.shortcutsEnabled = false;
  localStorage.setItem(boardShortcutsEnabledKey(board.id), "off");
  saveBoards();
  renderBoardOptions();
  await renderPads();
  // Rester en garage sur le nouveau board, section GESTION ouverte, nom en édition
  // (renommer est la première chose à faire).
  setBoardPadEditing(true);
  state.boardManageSectionOpen = true;
  if (els.boardManageSectionBody) els.boardManageSectionBody.hidden = false;
  if (els.boardManageSectionToggle) els.boardManageSectionToggle.setAttribute("aria-expanded", "true");
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
    createdAt: new Date().toISOString(),
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
      source: padSourceNotice(pad),
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

function padSourceNotice(pad) {
  if (!pad?.buffer) return "-";
  return pad.buffer.numberOfChannels === 1 ? "mono" : "stéréo";
}

function fadeNotice(pad) {
  if (pad.fadeMode === "none") return "";
  const inSeconds = fadeDurationForPad(pad, "in");
  const outSeconds = fadeDurationForPad(pad, "out");
  if (inSeconds <= 0 && outSeconds <= 0) return "";
  const scope = pad.fadeMode === "pad" ? "pad" : "global";
  const parts = [];
  if (inSeconds > 0) parts.push(`in ${inSeconds}s`);
  if (outSeconds > 0) parts.push(`out ${outSeconds}s`);
  return `fade ${scope} ${parts.join(" / ")}`;
}

function padAudioNotice(pad) {
  const items = [];
  if (!pad.buffer && !pad.audioName) return "-";
  if (pad.buffer?.sampleRate) items.push(formatSampleRate(pad.buffer.sampleRate));
  if (pad.normalizeEnabled) items.push(`normalisation ${pad.normalizedGain.toFixed(2)}x`);
  if (pad.mono && pad.buffer?.numberOfChannels !== 1) items.push("mono");
  if (pad.loop) items.push("loop");
  if (pad.reverse) items.push("reverse");
  if (pad.muted) items.push("mute");
  if (pad.duckTrigger && pad.duckMode === "pad") items.push(`ducking ${pad.duckPercent}%`);
  const fade = fadeNotice(pad);
  if (fade) items.push(fade);
  if ((Number(pad.pitchSemitones) || 0) !== 0 || Math.round(Number(pad.pitchFine) || 0) !== 0) {
    items.push(`pitch ${pad.pitchSemitones >= 0 ? "+" : ""}${pad.pitchSemitones} demi-tons ${pad.pitchFine >= 0 ? "+" : ""}${Math.round(pad.pitchFine)} cents`);
  }
  const masterReverb = masterReverbSettings();
  if (pad.reverbMode === "global" && masterReverb.preset !== "none" && masterReverb.wet > 0) {
    items.push("reverb globale");
  } else if (pad.reverbMode === "pad" && pad.reverbPreset !== "none" && pad.reverbWet > 0) {
    items.push(`reverb ${pad.reverbPreset} ${Math.round(pad.reverbWet * 100)}%`);
  }
  const eq = [
    ["basses", pad.eqLow],
    ["médiums", pad.eqMid],
    ["aigus", pad.eqHigh],
  ].filter(([, value]) => clampEqGain(value) !== 0);
  if (eq.length) items.push(`EQ ${eq.map(([label, value]) => `${label} ${clampEqGain(value) > 0 ? "+" : ""}${clampEqGain(value)}dB`).join(" / ")}`);
  if (pad.startStopMode !== "none" || pad.endStartMode !== "none") items.push("crossfade");
  return items.join(" ; ") || "-";
}

function shortcutNoticeForPad(pad) {
  if (!state.shortcutsEnabled) return "";
  const shortcut = state.shortcuts.find((item) => item.padIndex === pad.index && item.key);
  return shortcut?.key || "";
}

function boardAudioNotice() {
  const reverb = masterReverbSettings();
  const items = [`Volume master ${Math.round((currentBoard().masterVolume ?? DEFAULT_MASTER_VOLUME) * 100)}%`];
  if (masterFadeEnabled("in") && Number(els.fadeInSeconds?.value) > 0) items.push(`Fade in ${Number(els.fadeInSeconds.value)}s`);
  if (masterFadeEnabled("out") && Number(els.fadeSeconds?.value) > 0) items.push(`Fade out ${Number(els.fadeSeconds.value)}s`);
  if (armedCrossfadeEnabled() && armedCrossfadeSeconds() > 0) items.push(`Crossfade armé ${armedCrossfadeSeconds()}s`);
  if (masterDuckEnabled() && duckAmount() > 0) items.push(`Ducking ${duckPercentValue()}%`);
  if (reverb.preset !== "none" && reverb.wet > 0) items.push(`Reverb ${reverb.preset} ${Math.round(reverb.wet * 100)}%`);
  const eq = masterEqSettings();
  const eqItems = [
    ["basses", eq.low],
    ["médiums", eq.mid],
    ["aigus", eq.high],
  ].filter(([, value]) => value !== 0);
  if (eqItems.length) items.push(`EQ ${eqItems.map(([label, value]) => `${label} ${value > 0 ? "+" : ""}${value}dB`).join(" / ")}`);
  return items.join(" ; ");
}

function boardSoundCount() {
  const keys = new Set();
  state.pads.forEach((pad) => {
    if (!pad.buffer && !pad.audioName) return;
    const refIndex = Number(pad.audioRefIndex);
    keys.add(pad.audioUid ? `audio:${pad.audioUid}` : `slot:${Number.isInteger(refIndex) ? refIndex : pad.index}`);
  });
  return keys.size;
}

function boardNoticeCrossfadeRows() {
  return patchBayRows().map((row) => ({
    source: row.sourcePad.title,
    phase: cablePhaseLabel(row.phase),
    action: cableActionLabel(row.action),
    target: row.targetLabel,
  }));
}

function boardNoticeCueRows() {
  return normalizeCues(currentBoard()?.cues).map((step, index) => ({
    index: index + 1,
    action: cueActionLabel(step.action),
    target: cueTargetLabel(step),
    condition: cueConditionLabel(step) || "Manuel",
    fade: cueFadeLabel(step) || (step.action === "wait" ? "Pause" : "-"),
  }));
}

async function boardNoticeVersionRows(board) {
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  return pruneVersionHistory(history).map((snapshot, index) => ({
    index: index + 1,
    label: String(snapshot?.label || "").trim() || formatVersionLabel(snapshot?.savedAt),
    savedAt: snapshot?.savedAt ? new Date(snapshot.savedAt).toLocaleString("fr-FR") : "-",
    archived: snapshot?.archived ? "Oui" : "Non",
    printed: snapshot?.id && snapshot.id === els.versionSelect?.value,
  }));
}

async function boardNoticeHtml() {
  const board = currentBoard();
  const rows = boardNoticeRows();
  const crossfadeRows = boardNoticeCrossfadeRows();
  const cueRows = boardNoticeCueRows();
  const versionRows = await boardNoticeVersionRows(board);
  const selectedVersion = versionRows.find((row) => row.printed);
  const printedVersion = selectedVersion
    ? `${selectedVersion.index}. ${selectedVersion.label}`
    : "État courant du board";
  const showShortcuts = state.shortcutsEnabled && rows.some((row) => row.shortcut);
  const soundCount = boardSoundCount();
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
  <p class="meta">Générée le ${escapeHtml(date)} avec Soundboard Live · vincent lainé (c) 2026.</p>
  <p class="meta">Version imprimée : ${escapeHtml(printedVersion)}.</p>
  <h2>Board</h2>
  <p>Ce board contient ${board.padCount} pad${board.padCount > 1 ? "s" : ""} et ${soundCount} son${soundCount > 1 ? "s" : ""} différent${soundCount > 1 ? "s" : ""}. ${escapeHtml(boardAudioNotice())}.</p>
  <h2>Versions</h2>
  ${versionRows.length ? `
  <table>
    <thead>
      <tr><th>#</th><th>Nom</th><th>Date</th><th>Archivée</th></tr>
    </thead>
    <tbody>
      ${versionRows.map((row) => `<tr><td>${row.index}</td><td>${escapeHtml(row.label)}${row.printed ? " (imprimée)" : ""}</td><td>${escapeHtml(row.savedAt)}</td><td>${escapeHtml(row.archived)}</td></tr>`).join("")}
    </tbody>
  </table>` : "<p>Aucune version sauvegardée.</p>"}
  <h2>Pads</h2>
  <table>
    <thead>
      <tr><th>#</th>${showShortcuts ? "<th>Raccourci</th>" : ""}<th>Nom</th><th>Audio</th><th>Durée</th><th>Source</th><th>Tags</th><th>Volume</th><th>Pan</th><th>Paramètres audio du pad</th></tr>
    </thead>
    <tbody>
      ${rows.map((row, index) => `<tr><td>${index + 1}</td>${showShortcuts ? `<td>${escapeHtml(row.shortcut || "-")}</td>` : ""}<td>${escapeHtml(row.title)}</td><td>${escapeHtml(row.audio)}</td><td>${escapeHtml(row.duration)}</td><td>${escapeHtml(row.source)}</td><td>${escapeHtml(row.tags)}</td><td>${escapeHtml(row.volume)}</td><td>${escapeHtml(row.pan)}</td><td>${escapeHtml(row.audioSettings)}</td></tr>`).join("")}
    </tbody>
  </table>
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
  <h2>Cues</h2>
  ${cueRows.length ? `
  <table>
    <thead>
      <tr><th>#</th><th>Action</th><th>Cible</th><th>Condition</th><th>Fade / pause</th></tr>
    </thead>
    <tbody>
      ${cueRows.map((row) => `<tr><td>${row.index}</td><td>${escapeHtml(row.action)}</td><td>${escapeHtml(row.target)}</td><td>${escapeHtml(row.condition)}</td><td>${escapeHtml(row.fade)}</td></tr>`).join("")}
    </tbody>
  </table>` : "<p>Aucune cue configurée.</p>"}
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

async function exportBoardNotice() {
  const board = currentBoard();
  const html = await boardNoticeHtml();
  const baseName = `notice-${fileSafeName(board.name)}`;
  setBoardPadEditing(false);
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

async function audioSourceToBase64(audio) {
  if (!audio) return "";
  if (audio instanceof ArrayBuffer) return arrayBufferToBase64(audio);
  if (ArrayBuffer.isView(audio)) {
    return arrayBufferToBase64(audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength));
  }
  if (typeof Blob !== "undefined" && audio instanceof Blob) {
    return arrayBufferToBase64(await audio.arrayBuffer());
  }
  return "";
}

async function audioRecordForExport(record, dataKey = "audio") {
  if (!record?.audio) return null;
  const data = await audioSourceToBase64(record.audio);
  if (!data) return null;
  return {
    ...record,
    [dataKey]: data,
  };
}

async function videoRecordForExport(record) {
  if (!record?.video) return null;
  const data = await audioSourceToBase64(record.video);
  if (!data) return null;
  return {
    name: record.videoName || record.name || "video.mp4",
    path: record.videoPath || record.path || record.videoName || "video.mp4",
    type: record.videoType || record.type || "video/mp4",
    duration: Number(record.videoDuration) || 0,
    data,
  };
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

// Redimensionne et recompresse une image pour qu'elle tienne dans une propriété CSS custom.
// Les data URL trop longues (~> 500 Ko de texte) sont ignorées silencieusement par Safari mobile.
async function resizeImageForPad(file) {
  if (file.size > MAX_IMAGE_SIZE) {
    setStatus(`Image trop volumineuse (max ${Math.round(MAX_IMAGE_SIZE / 1024 / 1024)} Mo)`, "stop", { alert: true });
    return null;
  }
  const dataUrl = await fileToDataUrl(file);
  if (/^image\/svg/.test(file.type)) return dataUrl; // SVG : pas de canvas nécessaire
  if (file.size <= 100 * 1024) return dataUrl; // Petite image : utiliser telle quelle
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_DIM = 1200;
      const scale = Math.min(1, MAX_DIM / Math.max(img.width || 1, img.height || 1));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      const isPng = /^image\/(png|gif)/.test(file.type);
      resolve(canvas.toDataURL(isPng ? "image/png" : "image/jpeg", 0.85));
    };
    img.onerror = () => resolve(dataUrl); // Fallback : data URL originale
    img.src = dataUrl;
  });
}

async function fileToText(file) {
  if (typeof file?.text === "function") {
    try {
      return await file.text();
    } catch {
      // Older embedded browsers sometimes expose file.text() but fail at runtime.
    }
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}

function parseBoardJson(text) {
  const cleanText = String(text || "").replace(/^\uFEFF/, "").trim();
  return JSON.parse(cleanText);
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

function isPortableDevice() {
  return window.matchMedia("(max-width: 950px), (pointer: coarse)").matches
    || /Android|iPhone|iPad|iPod|Mobile|FxiOS/i.test(navigator.userAgent || "");
}

function isPortablePortrait() {
  return window.matchMedia("(orientation: portrait) and (max-width: 950px), (orientation: portrait) and (pointer: coarse)").matches;
}

function isPortableLandscape() {
  return window.matchMedia("(orientation: landscape)").matches && isPortableDevice();
}

function shouldLimitPortableLandscapeColumns() {
  return isPortableLandscape();
}

function renderPadColumnOptions(limit = 8) {
  if (!els.padColumns) return;
  const currentValue = els.padColumns.value || "auto";
  els.padColumns.innerHTML = "";

  const autoOption = document.createElement("option");
  autoOption.value = "auto";
  autoOption.textContent = "Auto";
  els.padColumns.append(autoOption);

  for (let columns = 1; columns <= limit; columns += 1) {
    const option = document.createElement("option");
    option.value = String(columns);
    option.textContent = String(columns);
    els.padColumns.append(option);
  }

  if ([...els.padColumns.options].some((option) => option.value === currentValue)) {
    els.padColumns.value = currentValue;
  }
}

function updateSkinOptions() {
  if (!els.skinSelect) return;

  // Preserve the current selection: rebuilding the custom optgroup removes its
  // options and would otherwise reset the select to its first option ("basic").
  const previousValue = els.skinSelect.value;

  const minimalOption = els.skinSelect.querySelector('option[value="minimal"]');
  if (minimalOption) {
    minimalOption.disabled = !canUseMinimalSkin();
    minimalOption.hidden = !canUseMinimalSkin();
  }

  const previousGroup = els.skinSelect.querySelector('optgroup[data-custom-skins="true"]');
  if (previousGroup) previousGroup.remove();

  const customSkins = readCustomSkins();

  const group = document.createElement("optgroup");
  group.dataset.customSkins = "true";
  group.label = "Skins utilisateur";
  els.skinSelect.append(group);

  customSkins
    .slice()
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" }))
    .forEach((skin) => {
      const option = document.createElement("option");
      option.value = `${CUSTOM_SKIN_PREFIX}${skin.id}`;
      option.textContent = skin.name;
      option.dataset.customSkin = "true";
      group.append(option);
    });

  // Restore the previous selection if it still exists (raw value in quotes —
  // CSS.escape would break the "custom:" colon inside the attribute selector)
  if (previousValue && els.skinSelect.querySelector(`option[value="${previousValue}"]`)) {
    els.skinSelect.value = previousValue;
  }
}

function normalizeSkinName(skin) {
  const rawSkin = String(skin || "").trim().toLowerCase();
  const migratedSkin = rawSkin === "scene" ? "candy" : rawSkin === "minimal" ? "classic" : rawSkin === "visual" ? "basic" : rawSkin;
  return ["basic", "candy", "classic", "contrast", "neon", "studio"].includes(migratedSkin) ? migratedSkin : "classic";
}

function readCustomSkins() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CUSTOM_SKINS_STORAGE) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((skin) => skin && skin.id && skin.name && skin.variables)
      .map((skin) => {
        // Migrate the old light help background (illegible with the light help text)
        const old = String(skin.variables["--color_ui_help_background"] || "").replace(/\s/g, "");
        if (old === "rgba(255,206,92,0.12)") {
          skin.variables["--color_ui_help_background"] = "#23262d";
        }
        return skin;
      });
  } catch {
    return [];
  }
}

function writeCustomSkins(skins) {
  localStorage.setItem(CUSTOM_SKINS_STORAGE, JSON.stringify(Array.isArray(skins) ? skins : []));
}

function customSkinById(id) {
  return readCustomSkins().find((skin) => skin.id === id) || null;
}

function clearCustomSkinVariables() {
  CUSTOM_SKIN_VARIABLES.forEach((name) => {
    document.documentElement.style.removeProperty(name);
    document.body?.style.removeProperty(name);
  });
  // Retirer aussi les alias inline, sinon ils masqueraient ceux d'un skin prédéfini.
  clearSkinAliases(document.documentElement);
  clearSkinAliases(document.body);
}

function applyCustomSkinVariables(skin) {
  clearCustomSkinVariables();
  const variables = skin?.variables || {};
  CUSTOM_SKIN_VARIABLES.forEach((name) => {
    const value = String(variables[name] || "").trim();
    if (value) {
      document.documentElement.style.setProperty(name, value);
      document.body?.style.setProperty(name, value);
    }
  });
  // Forcer les alias (--muted, --text…) à se re-résoudre sur les couleurs du skin perso.
  reapplySkinAliases(document.documentElement);
  reapplySkinAliases(document.body);
}

function snapshotCurrentSkinVariables(source = document.body) {
  const computed = getComputedStyle(source);
  const variables = {};
  CUSTOM_SKIN_VARIABLES.forEach((name) => {
    const value = computed.getPropertyValue(name).trim();
    if (value) variables[name] = value;
  });
  return variables;
}

function saveCurrentSkinAsCustom() {
  const name = window.prompt("Nom du skin utilisateur");
  const cleanName = String(name || "").trim();
  if (!cleanName) return;

  const skins = readCustomSkins();
  const id = createId();
  const skin = {
    id,
    name: cleanName,
    createdAt: new Date().toISOString(),
    variables: snapshotCurrentSkinVariables(skinPreviewRoot() || document.body),
  };

  skins.push(skin);
  writeCustomSkins(skins);
  updateSkinOptions();
  applySkin(`${CUSTOM_SKIN_PREFIX}${id}`);
  setStatus(`Skin utilisateur enregistré: ${cleanName}`, "success");
}

const ESSENTIAL_SKIN_FIELD_GROUPS = [
  {
    title: "Blocs",
    fields: [
      ["--color_ui_background", "Fond général"],
      ["--color_ui_panel", "Fond blocs"],
      ["--color_ui_frame_background", "Fond cadres Board"],
      ["--color_ui_text", "Titre blocs"],
    ],
  },
  {
    title: "Pads",
    fields: [
      ["--color_pad_background", "Fond pad"],
      ["--color_pad_trigger_background", "Fond titre"],
      ["--color_pad_title_text", "Titre"],
      ["--color_pad_border", "Bordure pad"],
      ["--color_pad_button_background", "Boutons"],
      ["--color_pad_button_border", "Bordure boutons"],
      ["--color_pad_button_text", "Textes boutons"],
    ],
  },
];

const ADVANCED_SKIN_FIELD_GROUPS = [
  {
    title: "Blocs (expert)",
    fields: [
      ["--color_ui_text_muted", "Texte secondaire"],
      ["--color_ui_button_icon", "Icônes boutons"],
      ["--color_ui_border", "Bordures"],
    ],
  },
  {
    title: "Pads (expert)",
    fields: [
      ["--color_pad_progress_fill", "Progression"],
      ["--color_pad_tag_background", "Fond tag"],
      ["--color_pad_progress_background", "Fond progression"],
    ],
  },
  {
    title: "Messages",
    fields: [
      // Avertissement/Danger supprimés (mission #8) : convertis en Stop. Les variables
      // --color_status_warning/_danger restent définies (compat skins + CSS fonctionnel)
      // mais ne sont plus éditables ici.
      ["--color_status_success", "Succès"],
      ["--color_status_progress", "Progression"],
      ["--color_status_stop", "Stop"],
    ],
  },
  {
    title: "Aide",
    fields: [
      ["--color_ui_help_background", "Fond aide"],
      ["--color_ui_help_border", "Bordure aide"],
      ["--color_ui_help", "Texte aide"],
    ],
  },
];

function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const hn = h / 360, sn = s / 100, ln = l / 100;
  let r, g, b;
  if (sn === 0) {
    r = g = b = ln;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = ln < 0.5 ? ln * (1 + sn) : ln + sn - ln * sn;
    const p = 2 * ln - q;
    r = hue2rgb(p, q, hn + 1 / 3);
    g = hue2rgb(p, q, hn);
    b = hue2rgb(p, q, hn - 1 / 3);
  }
  return "#" + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

// Returns exactly 6 teintes: index 0 = the base color, indices 1-5 = derived.
function getSkinHarmonyColors(baseHex, type) {
  if (!/^#[0-9a-fA-F]{6}$/.test(baseHex)) return Array(6).fill(baseHex);
  const [h, s] = hexToHSL(baseHex);
  const sat = Math.max(s, 55);
  const c = (hue, light = 52) => hslToHex(hue, sat, light);
  switch (type) {
    case "analogue":
      return [baseHex, c(h - 30), c(h - 15), c(h + 15), c(h + 30), c(h + 45)];
    case "complementaire":
      return [baseHex, c(h + 30), c(h + 150), c(h + 180), c(h + 210), c(h + 330)];
    case "complementaire-divise":
      return [baseHex, c(h - 30), c(h + 30), c(h + 150), c(h + 180), c(h + 210)];
    case "triade":
      return [baseHex, c(h + 120), c(h + 240), c(h + 60), c(h + 180), c(h + 300)];
    case "carre":
      return [baseHex, c(h + 90), c(h + 180), c(h + 270), c(h + 45), c(h + 225)];
    case "compose":
      // Composé : base + paire analogue (±30) + grappe complémentaire (180, 150, 210).
      return [baseHex, c(h + 30), c(h - 30), c(h + 180), c(h + 150), c(h + 210)];
    case "nuances":
      return [baseHex, hslToHex(h, s, 18), hslToHex(h, s, 32), hslToHex(h, s, 50), hslToHex(h, s, 68), hslToHex(h, s, 84)];
    case "monochromatique":
      return [baseHex, hslToHex(h, s, 18), hslToHex(h, s * 0.7, 34), hslToHex(h, s * 0.5, 52), hslToHex(h, s * 0.4, 68), hslToHex(h, s * 0.25, 84)];
    default:
      return [baseHex, c(h + 60), c(h + 120), c(h + 180), c(h + 240), c(h + 300)];
  }
}

function updateHarmonySwatch() {
  const baseHex = document.querySelector("#skinHarmonyColor")?.value;
  const type = document.querySelector("[name='skinHarmonyType']:checked")?.value || "complementaire";
  if (!baseHex) return;
  // Personnalisée : palette manuelle, on ne recalcule pas le nuancier.
  if (type === "personnalisee") return;
  const colors = getSkinHarmonyColors(baseHex, type);
  const spans = document.querySelectorAll("#skinHarmonySwatch span");
  spans.forEach((span, i) => {
    span.style.background = colors[i] || "";
    span.title = colors[i] || "";
  });
}

// Mode personnalisé : remplit le nuancier avec les couleurs courantes du skin
// (une variable représentative par teinte), pour que les teintes affichées
// correspondent à la réalité avant édition.
function populateCustomSwatchFromCurrent() {
  const read = (v) => {
    const fromState = state.skinEditorVariables?.[v];
    if (/^#[0-9a-fA-F]{6}$/.test(fromState || "")) return fromState;
    const field = els.skinEditorFields?.querySelector(`input[data-skin-variable="${CSS.escape(v)}"]`);
    return field ? normalizeColorInputValue(field.value) : "";
  };
  document.querySelectorAll("#skinHarmonySwatch span").forEach((span, i) => {
    const v = HARMONY_TINT_VARS[i]?.[0];
    const color = v ? read(v) : "";
    if (color) { span.style.background = color; span.title = color; }
  });
}

// Active/désactive le champ « Couleur de base » (désactivé en harmonie
// personnalisée, où la palette est éditée manuellement).
function setHarmonyBaseColorEnabled(enabled) {
  const input = document.querySelector("#skinHarmonyColor");
  if (input) input.disabled = !enabled;
  document.querySelector(".skin-harmony-color-wrap")?.classList.toggle("is-disabled", !enabled);
}

// Construit la table des teintes d'harmonie (state.skinEditorHarmonyBase) à
// partir de la couleur/type courants, SANS toucher aux champs ni à l'aperçu.
// Séparé d'applySkinHarmony pour pouvoir préparer la base à l'ouverture de
// l'éditeur (afin que les curseurs sat/lum aient une base à ajuster) sans
// écraser les couleurs réelles du skin.
function buildSkinHarmonyBase() {
  const baseHex = document.querySelector("#skinHarmonyColor")?.value;
  const type = document.querySelector("[name='skinHarmonyType']:checked")?.value || "complementaire";
  if (!baseHex || !/^#[0-9a-fA-F]{6}$/.test(baseHex)) {
    state.skinEditorHarmonyBase = null;
    return false;
  }

  // The 6 teintes (base + 5) are used AS-IS to color the surfaces — that's the
  // whole model: pick a base, derive 5 teintes, color the skin with all 6.
  const t = getSkinHarmonyColors(baseHex, type);
  const [bh, bs] = hexToHSL(baseHex);

  // Palette 1→6 (t[0]..t[5]), rôles FIXES :
  //  1 Fond général · 2 Fond blocs · 3 Fond cadres Board · 4 Fond pads · 5 Fond boutons · 6 Fond titre.
  // La couleur 1 (= couleur de base) couvre la plus grande surface : le fond général.
  // Textes dérivés pour la lisibilité, teintés par la teinte de base ; contraste calculé
  // sur le fond général (palette 1) et non plus sur t[5].
  const bgL = hexToHSL(t[0])[2];
  const darkBg = bgL < 50;
  const textHex  = darkBg ? hslToHex(bh, Math.min(bs, 15), 93) : hslToHex(bh, Math.min(bs, 25), 12);
  const mutedHex = darkBg ? hslToHex(bh, Math.min(bs, 18), 64) : hslToHex(bh, Math.min(bs, 30), 36);

  state.skinEditorHarmonyBase = {
    "--color_ui_background":                   t[0], // palette 1 — fond général
    "--color_ui_panel":                        t[1], // palette 2 — fond blocs
    "--color_ui_panel_secondary":              t[2], // palette 3 — boutons des blocs
    "--color_ui_frame_background":             t[2], // palette 3 — fond des cadres du Board
    "--color_ui_border":                       t[2],
    "--color_ui_text":                         textHex,
    "--color_ui_text_muted":                   mutedHex,
    "--color_ui_button_icon":                  textHex, // icônes boutons ← titre blocs (défaut)
    "--color_pad_background":                  t[3], // palette 4 — fond pads
    "--color_pad_border":                      t[3],
    "--color_pad_note_background":             t[3],
    "--color_pad_button_background":           t[4], // palette 5 — fond boutons
    "--color_pad_button_border":               t[4],
    "--color_pad_button_text":                 textHex,
    "--color_pad_title_text":                  textHex,
    "--color_pad_trigger_background":          t[5], // palette 6 — fond titre
    "--color_pad_trigger_playing_background":  t[5], // pad actif ← fond titre (défaut)
    "--color_pad_progress_fill":               mutedHex, // progression : repli lisible, PAS la palette 1
  };
  return true;
}

function applySkinHarmony() {
  if (!buildSkinHarmonyBase()) return;   // base temporaire = teintes d'harmonie
  // Appliquer la palette PURE (curseurs sat/lum remis à zéro), puis re-capturer
  // toutes les couleurs courantes comme base des curseurs : ils ajusteront
  // ensuite S/L de la palette entière, de façon cohérente.
  const sat = document.querySelector("#skinHarmonySaturation");
  const lum = document.querySelector("#skinHarmonyLightness");
  if (sat) sat.value = 0;
  if (lum) lum.value = 0;
  applyHarmonyAdjustments();
  captureSkinSatLumBase();
}

function applyHarmonyAdjustments() {
  const base = state.skinEditorHarmonyBase;
  if (!base) return;
  const satDelta  = parseInt(document.querySelector("#skinHarmonySaturation")?.value  ?? 0);
  const lightDelta = parseInt(document.querySelector("#skinHarmonyLightness")?.value ?? 0);
  document.getElementById("skinHarmonySatOutput")  && (document.getElementById("skinHarmonySatOutput").value  = (satDelta  >= 0 ? "+" : "") + satDelta);
  document.getElementById("skinHarmonyLightOutput") && (document.getElementById("skinHarmonyLightOutput").value = (lightDelta >= 0 ? "+" : "") + lightDelta);
  const preview = skinPreviewRoot();
  Object.entries(base).forEach(([name, baseHex]) => {
    const [h, s, l] = hexToHSL(baseHex);
    const adjusted = hslToHex(h, Math.max(0, Math.min(100, s + satDelta)), Math.max(0, Math.min(100, l + lightDelta)));
    state.skinEditorVariables[name] = adjusted;
    preview?.style.setProperty(name, adjusted);
    const input = els.skinEditorFields?.querySelector(`input[data-skin-variable="${CSS.escape(name)}"]`);
    if (input) input.value = adjusted;
  });
}

// Base des curseurs sat/lum = couleurs courantes du skin (delta 0). Les curseurs
// décalent alors la saturation/luminosité des couleurs EXISTANTES (teintes
// préservées) au lieu de régénérer une palette d'harmonie. Capturée à l'ouverture
// de l'éditeur ; applySkinHarmony() la remplace par les teintes d'harmonie quand
// l'utilisateur valide une nouvelle couleur de base.
function captureSkinSatLumBase() {
  const base = {};
  els.skinEditorFields?.querySelectorAll("input[data-skin-variable]").forEach((inp) => {
    const v = normalizeColorInputValue(inp.value);
    if (v) base[inp.dataset.skinVariable] = v;
  });
  state.skinEditorHarmonyBase = Object.keys(base).length ? base : null;
}

function applySwatchHighlight(index) {
  // Couleur réelle de la teinte affichée (vaut pour tous les modes, y compris
  // « personnalisée » où les teintes sont éditées à la main).
  const span = document.querySelector(`#skinHarmonySwatch span[data-swatch-index="${index}"]`);
  const swatchColor = span ? normalizeColorInputValue(getComputedStyle(span).backgroundColor) : "";
  if (!swatchColor) return;
  const targetHue = hexToHSL(swatchColor)[0];
  skinPreviewFrameDoc()?.querySelectorAll("[data-skin-variable]").forEach(el => {
    const applied = state.skinEditorVariables[el.dataset.skinVariable];
    if (!/^#[0-9a-fA-F]{6}$/.test(applied)) { el.classList.remove("skin-hue-match"); return; }
    const [elHue] = hexToHSL(applied);
    const diff = Math.min(Math.abs(elHue - targetHue), 360 - Math.abs(elHue - targetHue));
    el.classList.toggle("skin-hue-match", diff <= 35);
  });
}

function clearSwatchHighlight() {
  const active = document.querySelector("#skinHarmonySwatch span.is-active");
  if (active) {
    applySwatchHighlight(parseInt(active.dataset.swatchIndex ?? 0));
  } else {
    skinPreviewFrameDoc()?.querySelectorAll("[data-skin-variable]").forEach(el => el.classList.remove("skin-hue-match"));
  }
}

// Clic sur une teinte du nuancier : seulement surligner, de façon persistante,
// les éléments de la simulation qui partagent cette teinte. Ne modifie AUCUNE
// couleur et n'ouvre pas le picker (la couleur de base se choisit via son champ).
// Quelles variables de skin utilise chaque teinte (t0..t5), d'après le mapping
// d'harmonie (cf. buildSkinHarmonyBase). Sert à l'édition d'une seule teinte en
// mode « personnalisée ».
const HARMONY_TINT_VARS = [
  ["--color_ui_background"],                                                         // t0 = palette 1 — fond général
  ["--color_ui_panel"],                                                             // t1 = palette 2 — fond blocs
  ["--color_ui_panel_secondary", "--color_ui_frame_background", "--color_ui_border"], // t2 = palette 3 — cadres Board / boutons blocs
  ["--color_pad_background", "--color_pad_border", "--color_pad_note_background"],  // t3 = palette 4 — fond pads
  ["--color_pad_button_background", "--color_pad_button_border"],                   // t4 = palette 5 — fond boutons
  ["--color_pad_trigger_background", "--color_pad_trigger_playing_background"],     // t5 = palette 6 — fond titre
];

function handleSwatchClick(e) {
  const span = e.target.closest("#skinHarmonySwatch span");
  if (!span) return;
  const index = parseInt(span.dataset.swatchIndex ?? 0);
  document.querySelectorAll("#skinHarmonySwatch span").forEach((s, i) => s.classList.toggle("is-active", i === index));

  // En harmonie « personnalisée », cliquer une teinte l'édite (sans recalculer
  // les autres). Dans les autres harmonies : surbrillance seule.
  const type = document.querySelector("[name='skinHarmonyType']:checked")?.value;
  if (type === "personnalisee") {
    editHarmonyTinte(index, span);
    return;
  }
  applySwatchHighlight(index);
}

// Édite une seule teinte (mode personnalisé) : ouvre un color picker pour cette
// teinte et applique sa nouvelle couleur AUX seules variables qu'elle pilote.
function editHarmonyTinte(index, span) {
  const current = normalizeColorInputValue(getComputedStyle(span).backgroundColor) || "#ffffff";
  const input = document.createElement("input");
  input.type = "color";
  input.value = current;
  const rect = span.getBoundingClientRect();
  Object.assign(input.style, { position: "fixed", left: `${Math.round(rect.left)}px`, top: `${Math.round(rect.bottom)}px`, width: "1px", height: "1px", opacity: "0", pointerEvents: "none" });
  document.body.appendChild(input);

  const apply = () => {
    const color = input.value;
    span.style.background = color;
    span.title = color;
    const preview = skinPreviewRoot();
    (HARMONY_TINT_VARS[index] || []).forEach((v) => {
      state.skinEditorVariables[v] = color;
      if (state.skinEditorHarmonyBase) state.skinEditorHarmonyBase[v] = color; // base des curseurs sat/lum
      preview?.style.setProperty(v, color);
      const field = els.skinEditorFields?.querySelector(`input[data-skin-variable="${CSS.escape(v)}"]`);
      if (field) field.value = color;
    });
  };
  input.addEventListener("input", apply);
  input.addEventListener("change", () => { apply(); input.remove(); });

  if (typeof input.showPicker === "function") {
    try { input.showPicker(); } catch { input.click(); }
  } else {
    input.click();
  }
}

function normalizeColorInputValue(value) {
  const text = String(value || "").trim();

  if (/^#[0-9a-fA-F]{6}$/.test(text)) return text;

  // 3-digit hex
  const hex3 = text.match(/^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/);
  if (hex3) return "#" + hex3.slice(1).map(c => c + c).join("");

  const rgba = text.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgba) {
    return "#" + [rgba[1], rgba[2], rgba[3]]
      .map((part) => Math.max(0, Math.min(255, Number(part))).toString(16).padStart(2, "0"))
      .join("");
  }

  // Extract first solid color from a gradient or complex value
  const nested = text.match(/(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/);
  if (nested) return normalizeColorInputValue(nested[1]);

  return "";
}

// getComputedStyle ne substitue PAS le var() à l'intérieur de la valeur d'une
// custom property : une variable définie comme « --a: var(--b) » se relit
// littéralement "var(--b)". On suit la chaîne var() pour que le champ de
// l'éditeur reçoive une vraie couleur au lieu d'une référence.
function resolveComputedSkinVar(computed, name, depth = 0) {
  const raw = String(computed.getPropertyValue(name) || "").trim();
  const m = raw.match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (m && depth < 8) return resolveComputedSkinVar(computed, m[1], depth + 1);
  return raw;
}

function renderSkinEditorFields() {
  if (!els.skinEditorFields) return;
  els.skinEditorFields.innerHTML = "";

  // Ensure current skin is applied to body before reading color values
  const current = String(localStorage.getItem(SKIN_STORAGE) || "classic");
  const currentId = current.startsWith(CUSTOM_SKIN_PREFIX) ? current.slice(CUSTOM_SKIN_PREFIX.length) : "";
  const customSkin = currentId ? customSkinById(currentId) : null;
  if (customSkin) {
    applyCustomSkinVariables(customSkin);
  }

  // Read from body — predefined skins set their vars on body[data-skin="X"],
  // not on :root, so documentElement would only return classic defaults.
  const computed = getComputedStyle(document.body);
  const preview = skinPreviewRoot();
  // Re-déclarer les alias sur le preview pour que --muted/--text/--line… se re-résolvent
  // sur les couleurs éditées (sinon réglages comme « Texte secondaire » restent sans effet).
  reapplySkinAliases(preview);

  function renderFieldGroup(group, container) {
    const title = document.createElement("h3");
    title.className = "skin-editor-group-title";
    title.textContent = group.title;
    container.append(title);

    group.fields.forEach(([name, label]) => {
      const value = normalizeColorInputValue(resolveComputedSkinVar(computed, name));
      const row = document.createElement("div");
      const inputId = `skin-color-${name.replace(/[^a-z0-9_-]/gi, "-")}`;
      row.className = "skin-editor-field";
      row.dataset.skinVariable = name;
      row.innerHTML = `<input id="${inputId}" type="color" data-skin-variable="${name}" value="${value || "#ffffff"}"><label for="${inputId}">${label}</label>`;
      const input = row.querySelector("input");
      if (value) {
        preview?.style.setProperty(name, value);
        state.skinEditorVariables[name] = value;
      }
      input.addEventListener("input", () => {
        state.skinEditorVariables[name] = input.value;
        preview?.style.setProperty(name, input.value);
      });
      container.append(row);
    });
  }

  ESSENTIAL_SKIN_FIELD_GROUPS.forEach((group) => renderFieldGroup(group, els.skinEditorFields));

  // Snapshot advanced variable values onto preview so elements keep their colors when section is collapsed
  const advancedVarNames = new Set();
  ADVANCED_SKIN_FIELD_GROUPS.forEach((group) => {
    group.fields.forEach(([name]) => {
      advancedVarNames.add(name);
      const value = normalizeColorInputValue(resolveComputedSkinVar(computed, name));
      if (value) {
        preview?.style.setProperty(name, value);
        state.skinEditorVariables[name] = value;
      }
    });
  });
  state.skinEditorAdvancedVars = advancedVarNames;

  const details = document.createElement("details");
  details.className = "skin-editor-advanced-section";
  if (state.skinEditorAdvancedOpen) details.open = true;

  const summary = document.createElement("summary");
  summary.className = "skin-editor-group-title skin-editor-advanced-summary";
  summary.textContent = "Expert";
  details.append(summary);

  const advancedFields = document.createElement("div");
  advancedFields.className = "skin-editor-advanced-fields";
  ADVANCED_SKIN_FIELD_GROUPS.forEach((group) => renderFieldGroup(group, advancedFields));
  details.append(advancedFields);

  details.addEventListener("toggle", () => {
    state.skinEditorAdvancedOpen = details.open;
  });

  els.skinEditorFields.append(details);
}

function skinVariableSelector(variable) {
  return `[data-skin-variable="${CSS.escape(variable)}"]`;
}

function clearSkinEditorVariableHighlight() {
  document
    .querySelectorAll(".skin-editor-field.is-linked-variable")
    .forEach((node) => node.classList.remove("is-linked-variable"));
  // Preview highlights live inside the iframe
  skinPreviewFrameDoc()
    ?.querySelectorAll(".skin-variable-highlight")
    .forEach((node) => node.classList.remove("skin-variable-highlight"));
}

function highlightSkinEditorVariable(variable, options = {}) {
  if (!variable) return;
  clearSkinEditorVariableHighlight();

  const selector = skinVariableSelector(variable);
  // Preview elements live inside the iframe document
  skinPreviewFrameDoc()?.querySelectorAll(selector).forEach((node) => {
    node.classList.add("skin-variable-highlight");
  });

  const field = els.skinEditorFields?.querySelector(`.skin-editor-field${selector}`);
  if (!field) return;

  field.classList.add("is-linked-variable");
  if (options.scrollField) {
    field.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}

function handleSkinPreviewVariableClick(event) {
  const previewTarget = event.target.closest?.("[data-skin-variable]");
  if (!previewTarget || !previewTarget.dataset.skinVariable || !els.skinEditorFields) return;

  const variable = previewTarget.dataset.skinVariable;

  const advancedSection = els.skinEditorFields.querySelector(".skin-editor-advanced-section");
  if (state.skinEditorAdvancedVars?.has(variable) && advancedSection && !advancedSection.open) return;

  const input = els.skinEditorFields.querySelector(`input[type="color"][data-skin-variable="${CSS.escape(variable)}"]`);
  if (!input) return;

  event.preventDefault();
  highlightSkinEditorVariable(variable, { scrollField: true });
  const row = input.closest(".skin-editor-field");
  row?.classList.add("is-targeted");
  window.setTimeout(() => row?.classList.remove("is-targeted"), 900);
  input.focus({ preventScroll: false });
  input.click();
}

function handleSkinVariablePointerOver(event) {
  const target = event.target.closest?.("[data-skin-variable]");
  if (!target || !target.dataset.skinVariable) return;
  const variable = target.dataset.skinVariable;
  const advancedSection = els.skinEditorFields?.querySelector(".skin-editor-advanced-section");
  if (state.skinEditorAdvancedVars?.has(variable) && advancedSection && !advancedSection.open) return;
  highlightSkinEditorVariable(variable);
}

function handleSkinVariablePointerOut(event) {
  const related = event.relatedTarget;
  if (related?.closest?.("[data-skin-variable]")) return;
  clearSkinEditorVariableHighlight();
}

function syncSkinPreviewMode() {
  const selected = document.querySelector("[name='skinPreviewMode']:checked")?.value || "studio";
  const doc = skinPreviewFrameDoc();
  const shell = doc?.querySelector(".skin-preview-board-shell");
  if (!doc || !shell) return;
  const isStage = selected === "stage";
  const isGarage = selected === "basic";

  // Drive the iframe <body> exactly like the real app: the real CSS
  // (body.stage-mode … / body.board-edit-mode …) then applies as-is.
  doc.body.classList.toggle("stage-mode", isStage);
  doc.body.classList.toggle("board-edit-mode", isGarage);
  doc.body.dataset.boardMode = isStage ? "stage" : isGarage ? "garage" : "studio";
  // Always the ACTIVE skin — garage is a board mode, not the "basic" skin.
  // (Forcing basic gave the basic-only garage grid, differing from real boards.)
  doc.body.dataset.skin = document.body.dataset.skin || "classic";

  // The pad reflects the mode exactly like the real board.
  const pad = shell.querySelector(".pad");
  const trigger = pad?.querySelector(".pad-trigger");
  if (pad) {
    pad.classList.toggle("is-playing", isStage);
    pad.classList.toggle("is-editing", isGarage);
  }
  if (trigger) trigger.dataset.skinVariable = isStage ? "--color_pad_trigger_playing_background" : "--color_pad_trigger_background";

  // Hide color fields whose elements aren't visible in the selected preview mode.
  const hiddenFieldsByMode = {
    // Garage = edit mode: progress bar and VU meter are hidden.
    basic: ["--color_pad_progress_fill", "--color_pad_progress_background"],
    // Scène = playing: pad-actions buttons and controls are hidden.
    stage: [
      "--color_pad_button_background",
      "--color_pad_button_border",
      "--color_pad_button_text",
    ],
    studio: [],
  };
  const toHide = new Set(hiddenFieldsByMode[selected] || []);
  els.skinEditorFields?.querySelectorAll(".skin-editor-field[data-skin-variable]").forEach((field) => {
    field.hidden = toHide.has(field.dataset.skinVariable);
  });

  // Content height changes with the mode → re-measure the iframe
  requestAnimationFrame(resizeSkinPreviewFrame);
  window.setTimeout(resizeSkinPreviewFrame, 200);
}

// Returns the current harmony settings ({ baseHex, type, satDelta, lightDelta })
// or null when the harmony color is unset/invalid. Used both for the global
// last-used memory and to embed the harmony in each saved skin (#4).
function _snapshotHarmonySettings() {
  const baseHex = document.querySelector("#skinHarmonyColor")?.value;
  const isUnset = document.querySelector(".skin-harmony-color-wrap")?.classList.contains("is-unset");
  if (isUnset || !baseHex || !/^#[0-9a-fA-F]{6}$/.test(baseHex)) return null;
  const type = document.querySelector("[name='skinHarmonyType']:checked")?.value || "complementaire";
  const satDelta = parseInt(document.querySelector("#skinHarmonySaturation")?.value ?? 0);
  const lightDelta = parseInt(document.querySelector("#skinHarmonyLightness")?.value ?? 0);
  return { baseHex, type, satDelta, lightDelta };
}

function saveSkinHarmonySettings() {
  const settings = _snapshotHarmonySettings();
  if (!settings) {
    localStorage.removeItem(SKIN_HARMONY_STORAGE);
    return;
  }
  localStorage.setItem(SKIN_HARMONY_STORAGE, JSON.stringify(settings));
}

function loadSkinHarmonySettings() {
  try {
    const raw = localStorage.getItem(SKIN_HARMONY_STORAGE);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function deriveSkinHarmonyFromCurrentSkin() {
  const computed = getComputedStyle(document.body);
  const candidates = [
    "--color_pad_trigger_background",
    "--color_pad_progress_fill",
    "--color_ui_border",
    "--color_ui_panel",
  ];
  let baseHex = "";
  for (const v of candidates) {
    baseHex = normalizeColorInputValue(computed.getPropertyValue(v));
    if (baseHex) break;
  }
  if (!baseHex) return;
  const colorInput = document.querySelector("#skinHarmonyColor");
  const colorWrap = document.querySelector(".skin-harmony-color-wrap");
  if (colorInput) colorInput.value = baseHex;
  if (colorWrap) colorWrap.classList.remove("is-unset");
  // Only update swatch display — don't overwrite skin colors with harmony
  updateHarmonySwatch();
}

function restoreSkinHarmonyFromSettings(settings) {
  const colorInput = document.querySelector("#skinHarmonyColor");
  const colorWrap = document.querySelector(".skin-harmony-color-wrap");
  if (colorInput) colorInput.value = settings.baseHex;
  if (colorWrap) colorWrap.classList.remove("is-unset");
  const typeRadio = document.querySelector(`[name='skinHarmonyType'][value='${settings.type}']`);
  if (typeRadio) typeRadio.checked = true;
  const sat = document.querySelector("#skinHarmonySaturation");
  const lum = document.querySelector("#skinHarmonyLightness");
  if (sat) sat.value = settings.satDelta ?? 0;
  if (lum) lum.value = settings.lightDelta ?? 0;
  // Only update swatch display — don't overwrite skin colors with harmony
  updateHarmonySwatch();
}

function applySkinFonts() {
  const family = document.querySelector("#skinFontFamily")?.value || "";
  const size = document.querySelector("#skinFontSize")?.value || "14";
  const output = document.getElementById("skinFontSizeOutput");
  if (output) output.value = size + "px";
  const preview = skinPreviewRoot();
  if (preview) {
    if (family) preview.style.setProperty("--skin_font_family", family);
    else preview.style.removeProperty("--skin_font_family");
    preview.style.setProperty("--skin_font_size_title", size + "px");
  }
  // Also apply to body so it shows on the real board
  if (family) document.body.style.setProperty("--skin_font_family", family);
  else document.body.style.removeProperty("--skin_font_family");
  document.body.style.setProperty("--skin_font_size_title", size + "px");
  localStorage.setItem(SKIN_FONTS_STORAGE, JSON.stringify({ family, size }));
}

function loadSkinFonts() {
  try {
    const raw = localStorage.getItem(SKIN_FONTS_STORAGE);
    const settings = raw ? JSON.parse(raw) : null;
    if (!settings) return;
    const familySelect = document.querySelector("#skinFontFamily");
    const sizeRange = document.querySelector("#skinFontSize");
    if (familySelect && settings.family !== undefined) familySelect.value = settings.family;
    if (sizeRange && settings.size !== undefined) sizeRange.value = settings.size;
    applySkinFonts();
  } catch {}
}

// --- Skin preview iframe ---------------------------------------------------
// The preview lives in an iframe so the REAL board CSS applies with the real
// mode classes (stage-mode / board-edit-mode) on its <body>, exactly like the
// app. This avoids re-implementing the per-mode styling in the editor page.

function skinPreviewFrameDoc() {
  return document.getElementById("skinPreviewFrame")?.contentDocument || null;
}

// Element on which skin CSS variables are set (the iframe <body>, mirroring the
// real app where the active skin's variables live on document.body).
function skinPreviewRoot() {
  return skinPreviewFrameDoc()?.body || null;
}

function buildSkinPreviewFrame() {
  const frame = document.getElementById("skinPreviewFrame");
  const tpl = document.getElementById("skinPreviewTemplate");
  if (!frame || !tpl) return;
  const cssHref = document.querySelector('link[rel="stylesheet"][href*="styles.css"]')?.getAttribute("href") || "styles.css";
  const fontsHref = document.querySelector('link[href*="fonts.googleapis.com/css2"]')?.getAttribute("href") || "";
  const doc = frame.contentDocument;
  doc.open();
  doc.write(
    '<!doctype html><html><head><meta charset="utf-8">'
    + (fontsHref ? '<link rel="stylesheet" href="' + fontsHref + '">' : '')
    + '<link rel="stylesheet" href="' + cssHref + '">'
    + '<style>html,body{margin:0;background:transparent}body{padding:8px;overflow:hidden}'
    + '.app{min-height:0!important}'
    // Keep the preview content in a fixed left column (the shell is not the real
    // topbar, so the per-mode topbar layout — esp. stage — would push the pad
    // right / overflow). The pad inside still uses the real desktop CSS.
    + '.skin-preview-board-shell{display:flex!important;flex-direction:column!important;'
    + 'align-items:stretch!important;width:520px!important;max-width:520px!important;gap:8px}'
    + '.skin-preview-board-shell>*{max-width:100%;min-width:0;margin:0}'
    + '.skin-preview-board.pads{grid-template-columns:minmax(0,340px)!important}</style>'
    + '</head><body></body></html>'
  );
  doc.close();
  const shell = tpl.content.firstElementChild.cloneNode(true);
  // Swap the hand-crafted preview pad for a clone of the REAL #padTemplate so
  // the real pad CSS (per mode) applies verbatim.
  const padsContainer = shell.querySelector(".pads");
  const realPad = buildSkinPreviewPad();
  if (padsContainer && realPad) {
    padsContainer.querySelectorAll(".pad").forEach((p) => p.remove());
    padsContainer.appendChild(realPad);
  }
  doc.body.appendChild(shell);

  // "click an element → focus its field" / hover highlight, across the iframe
  doc.addEventListener("click", handleSkinPreviewVariableClick);
  doc.addEventListener("mouseover", handleSkinVariablePointerOver);
  doc.addEventListener("mouseout", handleSkinVariablePointerOut);
  doc.body.querySelectorAll("[data-skin-variable]").forEach((el) => { el.style.cursor = "pointer"; });

  // Auto-size the iframe to its content (CSS/fonts load async → re-measure)
  requestAnimationFrame(resizeSkinPreviewFrame);
  [150, 400, 900].forEach((d) => window.setTimeout(resizeSkinPreviewFrame, d));
}

// Map preview pad elements → the skin variable they represent (for the
// "click element → focus its field" / hover-highlight feature).
const SKIN_PREVIEW_PAD_VARS = [
  [".pad", "--color_pad_border"],
  [".pad-head", "--color_pad_background"],
  [".pad-trigger", "--color_pad_trigger_background"],
  [".pad-title", "--color_pad_title_text"],
  ["[data-tags-display]", "--color_pad_tag_background"],
  [".pad-tag-chip", "--color_pad_tag_background"],
  [".pad-stop-button", "--color_status_stop"],
  [".pad-mute-button", "--color_status_stop"],
  [".pad-note-button", "--color_pad_button_background"],
  [".pad-time", "--color_ui_text_muted"],
  [".pad-progress", "--color_pad_progress_background"],
  [".pad-progress-fill", "--color_pad_progress_fill"],
  [".pad-vu", "--color_pad_progress_background"],
  [".pad-shortcut", "--color_pad_button_background"],
  [".pad-type", "--color_ui_text_muted"],
];

// Build a real pad (clone of #padTemplate) with demo content for the preview.
function buildSkinPreviewPad() {
  const tpl = document.getElementById("padTemplate");
  if (!tpl) return null;
  const pad = tpl.content.firstElementChild.cloneNode(true);
  pad.classList.add("is-audio-pad");

  const setText = (sel, txt) => { const el = pad.querySelector(sel); if (el) el.textContent = txt; };
  const setVal = (sel, val) => { const el = pad.querySelector(sel); if (el) el.value = val; };
  setText(".pad-title", "Jingle ouverture");
  const shortcut = pad.querySelector(".pad-shortcut");
  if (shortcut) { shortcut.textContent = "1"; shortcut.classList.add("is-number"); }
  setText(".pad-time", "00:12");
  setVal("[data-name]", "Jingle ouverture");
  // Tags de démo modifiables depuis le champ « Tags (aperçu) ».
  const tagsRaw = document.getElementById("skinPreviewTags")?.value ?? "intro, jingle";
  const tagList = tagsRaw.split(",").map((t) => t.trim()).filter(Boolean);
  setText("[data-tags-display]", tagList.join(", ") || "intro");
  setVal("[data-tags]", tagsRaw);
  const chips = pad.querySelector("[data-tags-chips]");
  if (chips) {
    chips.innerHTML = "";
    tagList.forEach((t) => { const s = document.createElement("span"); s.className = "pad-tag-chip"; s.textContent = t; chips.appendChild(s); });
  }
  pad.querySelector(".pad-note-button")?.classList.add("has-note");
  const pf = pad.querySelector(".pad-progress-fill"); if (pf) pf.style.width = "42%";
  const vu = pad.querySelector(".vu-fill"); if (vu) vu.style.width = "30%";

  // Annotate for the highlight/click feature
  SKIN_PREVIEW_PAD_VARS.forEach(([sel, v]) => pad.querySelectorAll(sel).forEach((el) => { el.dataset.skinVariable = v; }));
  pad.querySelectorAll(".pad-actions button").forEach((b) => { b.dataset.skinVariable = "--color_pad_button_background"; });

  return pad;
}

// Met à jour les tags du pad d'aperçu (sans le reconstruire) quand on édite « Tags (aperçu) ».
function applySkinPreviewTags() {
  const root = skinPreviewRoot();
  if (!root) return;
  const raw = document.getElementById("skinPreviewTags")?.value ?? "";
  const tagList = raw.split(",").map((t) => t.trim()).filter(Boolean);
  root.querySelectorAll("[data-tags-display]").forEach((el) => { el.textContent = tagList.join(", ") || "intro"; });
  root.querySelectorAll("[data-tags]").forEach((el) => { el.value = raw; });
  root.querySelectorAll("[data-tags-chips]").forEach((chips) => {
    chips.innerHTML = "";
    tagList.forEach((t) => { const s = chips.ownerDocument.createElement("span"); s.className = "pad-tag-chip"; s.textContent = t; chips.appendChild(s); });
  });
}

function resizeSkinPreviewFrame() {
  const frame = document.getElementById("skinPreviewFrame");
  const doc = frame?.contentDocument;
  if (!frame || !doc?.body) return;
  frame.style.height = Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight) + "px";
}

function openSkinEditor() {
  state.skinEditorVariables = {};
  buildSkinPreviewFrame();
  renderSkinEditorFields();

  // Sync preview mode with current board mode (stage/studio/garage)
  const boardMode = document.body.dataset.boardMode || "studio";
  const previewMode = boardMode === "garage" ? "basic" : boardMode === "stage" ? "stage" : "studio";
  const modeRadio = document.querySelector(`[name='skinPreviewMode'][value='${previewMode}']`);
  if (modeRadio) modeRadio.checked = true;

  syncSkinPreviewMode();

  const current = String(localStorage.getItem(SKIN_STORAGE) || "classic");
  const currentId = current.startsWith(CUSTOM_SKIN_PREFIX) ? current.slice(CUSTOM_SKIN_PREFIX.length) : "";
  const customSkin = currentId ? customSkinById(currentId) : null;

  // Reflect the ACTIVE skin's harmony. A skin remembers its own harmony (#4):
  // if it was saved with one, restore it; otherwise derive the base color from
  // the skin's current colors. Non-destructive — colors aren't overwritten
  // until the user applies harmony.
  state.skinEditorHarmonyBase = null;
  const satSlider = document.querySelector("#skinHarmonySaturation");
  const lumSlider = document.querySelector("#skinHarmonyLightness");
  if (satSlider) satSlider.value = 0;
  if (lumSlider) lumSlider.value = 0;
  if (customSkin?.harmony) {
    restoreSkinHarmonyFromSettings(customSkin.harmony);
  } else {
    deriveSkinHarmonyFromCurrentSkin();
  }
  // Base des curseurs sat/lum = couleurs courantes du skin (les curseurs ajustent
  // S/L de l'existant, ils ne régénèrent pas la palette).
  captureSkinSatLumBase();
  // Couleur de base désactivée si l'harmonie restaurée est « personnalisée ».
  const restoredType = document.querySelector("[name='skinHarmonyType']:checked")?.value;
  setHarmonyBaseColorEnabled(restoredType !== "personnalisee");
  if (restoredType === "personnalisee") populateCustomSwatchFromCurrent();

  loadSkinFonts();

  skinPreviewFrameDoc()?.querySelectorAll("[data-skin-variable]").forEach(el => el.classList.remove("skin-hue-match"));
  const selectedOption = els.skinSelect?.querySelector(`option[value="${current}"]`);
  const fallbackName = selectedOption?.textContent || current || "Mon skin";

  if (els.skinEditorName) {
    // Pour un skin intégré, on laisse le champ vide (placeholder seulement) :
    // « Enregistrer sous » ne doit pas hériter du nom réservé du skin intégré.
    els.skinEditorName.value = customSkin?.name || "";
    els.skinEditorName.placeholder = fallbackName;
  }

  if (els.deleteSkinEditor) {
    els.deleteSkinEditor.disabled = !customSkin;
  }

  // « Enregistrer » écrase le skin custom courant : sans objet pour un skin
  // prédéfini (rien à écraser) → on le grise, l'utilisateur passe par
  // « Enregistrer sous… ».
  if (els.saveSkinEditor) {
    els.saveSkinEditor.disabled = !customSkin;
  }

  if (els.skinEditorDialog?.showModal) {
    els.skinEditorDialog.showModal();
  }
}

function clearSkinEditorPreviewVariables() {
  const root = skinPreviewRoot();
  CUSTOM_SKIN_VARIABLES.forEach((name) => {
    root?.style.removeProperty(name);
  });
}

function closeSkinEditor() {
  clearSkinEditorVariableHighlight();
  clearSkinEditorPreviewVariables();
  // #5 : un color picker natif (<input type=color>) encore ouvert reste affiché
  // si on ferme l'éditeur sans avoir cliqué ailleurs. Retirer le focus du champ
  // couleur actif le ferme dans la plupart des navigateurs.
  const active = document.activeElement;
  if (active instanceof HTMLInputElement && active.type === "color") active.blur();
  document.querySelector("#skinHarmonyColor")?.blur();
  els.skinEditorDialog?.close();
  applySkin(localStorage.getItem(SKIN_STORAGE) || "classic");
}

function handleSkinSelectChange() {
  const value = String(els.skinSelect?.value || "classic");
  applySkin(value);
  saveSkinToCurrentBoard();
}


const BUILT_IN_SKIN_NAMES = [
  "Basic/Custom",
  "Candy",
  "Classic Dark",
  "High Contrast",
  "Neon Stage",
  "Studio Grey",
];

function isBuiltInSkinDisplayName(name) {
  const normalized = String(name || "").trim().toLowerCase();
  return BUILT_IN_SKIN_NAMES.some((skinName) => skinName.toLowerCase() === normalized);
}

function saveSkinToCurrentBoard() {
  const board = currentBoard();
  if (!board) return;
  const skinValue = localStorage.getItem(SKIN_STORAGE) || "classic";
  if (board.skin === skinValue) return;
  board.skin = skinValue;
  saveBoards();
}

function _snapshotEditorVariables() {
  const preview = skinPreviewRoot();
  return {
    ...snapshotCurrentSkinVariables(preview || document.body),
    ...state.skinEditorVariables,
  };
}

// Overwrite current custom skin directly; falls back to save-as for built-in skins
function saveSkinEditorOverwrite() {
  const current = String(localStorage.getItem(SKIN_STORAGE) || "");
  const currentId = current.startsWith(CUSTOM_SKIN_PREFIX) ? current.slice(CUSTOM_SKIN_PREFIX.length) : "";

  if (currentId) {
    const skins = readCustomSkins();
    const index = skins.findIndex((skin) => skin.id === currentId);
    if (index !== -1) {
      const name = String(els.skinEditorName?.value || skins[index].name).trim() || skins[index].name;
      skins[index] = { ...skins[index], name, updatedAt: new Date().toISOString(), variables: _snapshotEditorVariables(), harmony: _snapshotHarmonySettings() };
      writeCustomSkins(skins);
      updateSkinOptions();
      applySkin(`${CUSTOM_SKIN_PREFIX}${currentId}`);
      saveSkinToCurrentBoard();
      closeSkinEditor();
      return;
    }
  }

  // No current custom skin — fall through to save-as
  saveSkinEditorAs();
}

// Always create a new custom skin; asks to replace if name already exists
// « Enregistrer sous… » : ouvre un dialogue pour saisir/modifier le nom, puis
// enregistre un nouveau skin utilisateur dans l'app. Le contrôle du nom réservé
// n'intervient qu'APRÈS saisie (le champ n'est plus pré-rempli avec un nom intégré).
function saveSkinEditorAs() {
  const field = String(els.skinEditorName?.value || "").trim();
  const suggested = field && !isBuiltInSkinDisplayName(field) ? field : "Mon skin";

  const entered = window.prompt("Nom du skin", suggested);
  if (entered === null) return;
  const name = String(entered).trim();

  if (!name) { window.alert("Nom du skin obligatoire"); return; }
  if (isBuiltInSkinDisplayName(name)) { window.alert("Ce nom est réservé à un skin intégré"); return; }

  const skins = readCustomSkins();
  const existing = skins.find((skin) => String(skin.name || "").trim().toLowerCase() === name.toLowerCase());
  if (existing) {
    if (!window.confirm(`Un skin « ${existing.name} » existe déjà. Le remplacer ?`)) return;
    const idx = skins.findIndex((s) => s.id === existing.id);
    if (idx !== -1) skins.splice(idx, 1);
  }

  const skin = { id: createId(), name, createdAt: new Date().toISOString(), variables: _snapshotEditorVariables(), harmony: _snapshotHarmonySettings() };
  skins.push(skin);
  writeCustomSkins(skins);
  if (els.skinEditorName) els.skinEditorName.value = name;
  updateSkinOptions();
  applySkin(`${CUSTOM_SKIN_PREFIX}${skin.id}`);
  saveSkinToCurrentBoard();
  closeSkinEditor();
}

function deleteCurrentCustomSkin() {
  const current = String(localStorage.getItem(SKIN_STORAGE) || "");

  if (!current.startsWith(CUSTOM_SKIN_PREFIX)) {
    window.alert("Aucun skin utilisateur sélectionné");
    return;
  }

  const id = current.slice(CUSTOM_SKIN_PREFIX.length);
  const skin = customSkinById(id);

  if (!skin) {
    window.alert("Skin utilisateur introuvable");
    return;
  }

  const confirmed = window.confirm(`Supprimer le skin utilisateur « ${skin.name} » ?`);
  if (!confirmed) return;

  const skins = readCustomSkins().filter((candidate) => candidate.id !== id);
  writeCustomSkins(skins);

  updateSkinOptions();
  applySkin("classic");
  saveSkinToCurrentBoard();
  closeSkinEditor();
  setStatus(`Skin utilisateur supprimé: ${skin.name}`, "success");
}

function applySkin(skin) {
  const requestedSkin = String(skin || "classic");
  const isCustomSkin = requestedSkin.startsWith(CUSTOM_SKIN_PREFIX);
  const customSkinId = isCustomSkin ? requestedSkin.slice(CUSTOM_SKIN_PREFIX.length) : "";
  const customSkin = isCustomSkin ? customSkinById(customSkinId) : null;
  const skinName = customSkin ? "classic" : normalizeSkinName(requestedSkin);

  updateSkinOptions();
  document.body.dataset.skin = skinName;

  if (customSkin) {
    applyCustomSkinVariables(customSkin);
  } else {
    clearCustomSkinVariables();
  }

  if (els.skinSelect) {
    const selectedValue = customSkin ? `${CUSTOM_SKIN_PREFIX}${customSkin.id}` : skinName;
    const hasOption = Boolean(els.skinSelect.querySelector(`option[value="${selectedValue}"]`));
    if (hasOption) els.skinSelect.value = selectedValue;
  }

  localStorage.setItem(SKIN_STORAGE, customSkin ? `${CUSTOM_SKIN_PREFIX}${customSkin.id}` : skinName);
  if (skinName === "basic") revealGalleryPads();
  state.pads.forEach(fitPadTitle);
}

function revealGalleryPads(save = true) {
  state.pads.forEach((pad) => {
    if (!pad.visualImageHidden) return;
    setPadVisualImage(pad, pad.visualImage, false);
    if (save) savePadMeta(pad).catch(() => {});
  });
}

async function shareOrDownloadBoard(blob, filename, boardName) {
  let file = null;
  try {
    file = new File([blob], filename, { type: "application/json" });
  } catch {
    file = null;
  }
  const preferShareSheet = shouldPreferShareSheetForExport();

  if (preferShareSheet && file && await tryShareBoardFile(file, boardName)) return;

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

  if (!preferShareSheet && file && await tryShareBoardFile(file, boardName)) return;

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
  try {
    if (navigator.canShare && !navigator.canShare({ files: [file] })) return false;
  } catch {
    return false;
  }
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

function lightweightAudioSnapshot(record, index) {
  if (!record) return null;
  const refIndex = Number(record.audioRefIndex);
  const audioUid = audioRecordUid(record);
  return {
    ...record,
    audioUid,
    audio: undefined,
    video: undefined,
    audioRefIndex: Number.isInteger(refIndex) ? refIndex : index,
    preserveCurrentAudio: true,
  };
}

function audioRecordUid(record) {
  return String(record?.audioUid || record?.uid || "").trim();
}

function ensureAudioRecordUid(record, fallbackUid = "") {
  return audioRecordUid(record) || String(fallbackUid || "").trim() || createId();
}

function lightweightVersionSnapshot(snapshot) {
  if (!snapshot) return snapshot;
  return {
    ...snapshot,
    lightweight: true,
    pads: Array.isArray(snapshot.pads)
      ? snapshot.pads.map((item) => ({
        ...item,
        audio: lightweightAudioSnapshot(item.audio, Number(item.index) || 0),
      }))
      : [],
  };
}

function versionHistoryForStorage(history = []) {
  const pruned = pruneVersionHistory(history);
  return isPortableDevice() ? pruned.map(lightweightVersionSnapshot) : pruned;
}

async function createBoardSnapshot(board, options = {}) {
  const includeMedia = options.includeMedia !== false;
  syncPadIndexesFromDom();
  await persistCurrentPadsForExport();
  const pads = [];
  for (let index = 0; index < board.padCount; index += 1) {
    const audio = await dbGet(padAudioKeyFor(board.id, index));
    pads.push({
      index,
      meta: await dbGet(padMetaKeyFor(board.id, index)),
      audio: includeMedia ? audio : lightweightAudioSnapshot(audio, index),
    });
  }
  return {
    id: createId(),
    savedAt: new Date().toISOString(),
    notes: String(options.notes || ""),
    lightweight: !includeMedia,
    board: {
      name: board.name,
      padCount: board.padCount,
      masterVolume: board.masterVolume ?? DEFAULT_MASTER_VOLUME,
      layoutMode: board.layoutMode || "auto",
      padColumns: board.padColumns || 0,
      padRows: board.padRows || 0,
      cuesEnabled: board.cuesEnabled !== false,
      cues: normalizeCues(board.cues),
      cueIndex: cueIndexForBoard(board),
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
  const preservedAudio = new Map();
  const preservedAudioByUid = new Map();
  for (let index = 0; index < previousPadCount; index += 1) {
    const record = await dbGet(padAudioKeyFor(board.id, index));
    preservedAudio.set(index, record);
    const uid = audioRecordUid(record);
    if (uid) preservedAudioByUid.set(uid, record);
  }
  board.name = snapshot.board?.name || board.name;
  board.padCount = Math.max(1, Number(snapshot.board?.padCount) || DEFAULT_PAD_COUNT);
  board.masterVolume = clamp01(snapshot.board?.masterVolume);
  board.layoutMode = normalizeLayoutMode(snapshot.board?.layoutMode);
  board.padColumns = board.layoutMode === "custom" ? normalizeLayoutNumber(snapshot.board?.padColumns, 4) : 0;
  board.padRows = board.layoutMode === "custom" ? normalizeLayoutNumber(snapshot.board?.padRows, 3) : 0;
  board.cuesEnabled = snapshot.board?.cuesEnabled !== false;
  board.cues = normalizeCues(snapshot.board?.cues);
  board.cueIndex = Math.min(board.cues.length - 1, Math.max(0, Number(snapshot.board?.cueIndex) || 0));
  if (board.cueIndex < 0) board.cueIndex = 0;

  const maxPadCount = Math.max(previousPadCount, board.padCount);
  for (let index = 0; index < maxPadCount; index += 1) {
    await dbDelete(padMetaKeyFor(board.id, index));
    await dbDelete(padAudioKeyFor(board.id, index));
  }

  for (const item of snapshot.pads || []) {
    const index = Number(item.index);
    if (!Number.isInteger(index) || index < 0 || index >= board.padCount) continue;
    if (item.meta) await dbSet(padMetaKeyFor(board.id, index), item.meta);
    if (item.audio?.preserveCurrentAudio) {
      const refIndex = Number(item.audio.audioRefIndex);
      const audioUid = audioRecordUid(item.audio) || audioRecordUid(item.meta);
      const preserved = (audioUid && preservedAudioByUid.get(audioUid))
        || preservedAudio.get(Number.isInteger(refIndex) ? refIndex : index);
      if (preserved) {
        await dbSet(padAudioKeyFor(board.id, index), {
          ...preserved,
          ...item.audio,
          audioUid: ensureAudioRecordUid(item.audio, audioRecordUid(preserved)),
          audio: preserved.audio,
          video: preserved.video,
          preserveCurrentAudio: undefined,
        });
      }
    } else if (item.audio) {
      await dbSet(padAudioKeyFor(board.id, index), item.audio);
    }
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
  const snapshot = await createBoardSnapshot(board, { includeMedia: !isPortableDevice() });
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  history.unshift(snapshot);
  try {
    await dbSet(boardHistoryKey(board.id), versionHistoryForStorage(history));
    await refreshVersionOptions(snapshot.id);
    setStatus(snapshot.lightweight ? `Version sauvegardee sans copie audio: ${board.name}` : `Version sauvegardee: ${board.name}`);
  } catch (error) {
    console.warn("Sauvegarde complète impossible, tentative sans copie media", error);
    const fallbackSnapshot = await createBoardSnapshot(board, { includeMedia: false });
    const fallbackHistory = await dbGet(boardHistoryKey(board.id)) || [];
    fallbackHistory.unshift(fallbackSnapshot);
    await dbSet(boardHistoryKey(board.id), versionHistoryForStorage(fallbackHistory));
    await refreshVersionOptions(fallbackSnapshot.id);
    setStatus(`Version sauvegardee sans copie audio: ${board.name}`);
  }
}

function pruneVersionHistory(history = []) {
  const kept = [];
  let regularCount = 0;
  history.forEach((snapshot) => {
    if (snapshot?.archived) {
      kept.push(snapshot);
      return;
    }
    if (regularCount < HISTORY_LIMIT) {
      kept.push(snapshot);
      regularCount += 1;
    }
  });
  return kept;
}

function versionOptionLabel(snapshot, index) {
  const label = String(snapshot?.label || "").trim() || formatVersionLabel(snapshot?.savedAt);
  return `${index + 1}. ${snapshot?.archived ? "[archive] " : ""}${label}`;
}

async function serializeBoardSnapshotForExport(snapshot, includeAudio = true) {
  if (!snapshot) return null;
  return {
    id: snapshot.id || createId(),
    label: snapshot.label || "",
    notes: snapshot.notes || "",
    archived: Boolean(snapshot.archived),
    savedAt: snapshot.savedAt || new Date().toISOString(),
    board: {
      ...(snapshot.board || {}),
      cues: normalizeCues(snapshot.board?.cues),
    },
    pads: Array.isArray(snapshot.pads)
      ? await Promise.all(snapshot.pads.map(async (item) => {
        const savedAudio = item?.audio;
        const index = Number(item?.index) || 0;
        const audio = includeAudio
          ? await audioRecordForExport(savedAudio, "audio")
          : lightweightAudioSnapshot(savedAudio, index);
        return {
          index,
          meta: item?.meta || null,
          audio,
          hasAudio: Boolean(savedAudio?.audio || savedAudio?.audioRefIndex != null || item?.hasAudio),
        };
      }))
      : [],
  };
}

function deserializeBoardSnapshotFromExport(snapshot) {
  if (!snapshot) return null;
  return {
    id: snapshot.id || createId(),
    label: snapshot.label || "",
    notes: snapshot.notes || "",
    archived: Boolean(snapshot.archived),
    savedAt: snapshot.savedAt || new Date().toISOString(),
    board: {
      ...(snapshot.board || {}),
      cues: normalizeCues(snapshot.board?.cues),
    },
    pads: Array.isArray(snapshot.pads)
      ? snapshot.pads.map((item) => {
        let audio = null;
        if (item?.audio?.audio) {
          audio = {
            ...item.audio,
            audio: base64ToArrayBuffer(item.audio.audio),
          };
        } else if (item?.audio) {
          audio = item.audio;
        }
        return {
          index: Number(item?.index) || 0,
          meta: item?.meta || null,
          audio,
          hasAudio: Boolean(item?.hasAudio || audio),
        };
      })
      : [],
  };
}

async function hydrateImportedVersionAudio(versions, boardId) {
  const currentAudioByUid = new Map();
  const board = state.boards.find((item) => item.id === boardId);
  const padCount = Math.max(0, Number(board?.padCount) || 0);
  for (let index = 0; index < padCount; index += 1) {
    const currentAudio = await dbGet(padAudioKeyFor(boardId, index));
    const uid = audioRecordUid(currentAudio);
    if (uid) currentAudioByUid.set(uid, currentAudio);
  }
  for (const snapshot of versions) {
    for (const item of snapshot.pads || []) {
      if (item.hasAudio === false) continue;
      const index = Number(item.index);
      if (!Number.isInteger(index) || index < 0) continue;
      const uid = audioRecordUid(item.audio) || audioRecordUid(item.meta);
      const currentAudio = (uid && currentAudioByUid.get(uid)) || await dbGet(padAudioKeyFor(boardId, index));
      if (currentAudio?.audio) {
        item.audio = {
          ...currentAudio,
          ...(item.audio || {}),
          audioUid: ensureAudioRecordUid(item.audio || currentAudio, audioRecordUid(currentAudio)),
          audio: currentAudio.audio,
          video: currentAudio.video,
        };
      }
    }
  }
}

async function refreshVersionOptions(selectedId = "") {
  if (!els.versionSelect || !state.db) return;
  const board = currentBoard();
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  const visibleHistory = pruneVersionHistory(history);
  if (visibleHistory.length !== history.length) await dbSet(boardHistoryKey(board.id), visibleHistory);
  const effectiveSelectedId = selectedId || visibleHistory[0]?.id || "";
  els.versionSelect.innerHTML = '<option value="">Versions</option>';
  visibleHistory.forEach((snapshot, index) => {
    const option = document.createElement("option");
    option.value = snapshot.id;
    option.textContent = versionOptionLabel(snapshot, index);
    els.versionSelect.append(option);
  });
  els.versionSelect.value = visibleHistory.some((snapshot) => snapshot.id === effectiveSelectedId) ? effectiveSelectedId : "";
  syncVersionButtons(visibleHistory);
}

function syncVersionButtons(history = null) {
  const selectedId = els.versionSelect?.value || "";
  const snapshots = Array.isArray(history) ? history : [];
  const snapshot = snapshots.find((item) => item.id === selectedId);
  const hasSelection = Boolean(snapshot);
  const hasNotes = Boolean(String(snapshot?.notes || "").trim());
  [els.restoreVersion, els.renameVersion, els.archiveVersion, els.deleteVersion].forEach((button) => {
    if (!button) return;
    button.disabled = !hasSelection;
    button.classList.toggle("is-disabled", !hasSelection);
  });
  if (els.versionNotes) {
    els.versionNotes.classList.toggle("has-version-notes", hasNotes);
    els.versionNotes.classList.toggle("is-muted", !hasNotes);
    els.versionNotes.setAttribute("aria-pressed", String(hasNotes));
  }
}

async function renameSelectedBoardVersion() {
  const board = currentBoard();
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  const selectedId = els.versionSelect?.value;
  const snapshot = history.find((item) => item.id === selectedId);
  if (!snapshot) {
    setStatus("Choisir une version");
    return;
  }
  const currentLabel = String(snapshot.label || formatVersionLabel(snapshot.savedAt));
  const nextLabel = window.prompt("Nom de la version", currentLabel);
  if (nextLabel == null) return;
  snapshot.label = nextLabel.trim() || formatVersionLabel(snapshot.savedAt);
  await dbSet(boardHistoryKey(board.id), history);
  await refreshVersionOptions(snapshot.id);
  setStatus(`Version renommee: ${snapshot.label}`);
}

async function selectedVersionSnapshot() {
  const board = currentBoard();
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  const selectedId = els.versionSelect?.value;
  const snapshot = history.find((item) => item.id === selectedId);
  return { board, history, snapshot };
}

async function openVersionNotesDialog() {
  const { board, snapshot } = await selectedVersionSnapshot();
  if (!snapshot) {
    setStatus("Choisir une version");
    return;
  }
  state.versionNotesDraft = String(snapshot.notes || "");
  const label = String(snapshot.label || "").trim() || formatVersionLabel(snapshot.savedAt);
  if (els.versionNotesBoard) {
    els.versionNotesBoard.textContent = `Board : ${board?.name || "—"}`;
  }
  if (els.versionNotesBoardCreated) {
    els.versionNotesBoardCreated.textContent = `Board créé le : ${formatBoardCreatedAt(board?.createdAt)}`;
  }
  if (els.versionNotesLabel) {
    els.versionNotesLabel.textContent = `${snapshot.archived ? "Archive" : "Version"} · ${label}`;
  }
  if (els.versionNotesEditor) {
    els.versionNotesEditor.value = state.versionNotesDraft;
    els.versionNotesEditor.readOnly = false;
  }
  els.versionNotesDialog?.showModal?.();
  els.versionNotesEditor?.focus();
}

async function saveVersionNotesDialog() {
  const { board, history, snapshot } = await selectedVersionSnapshot();
  if (!snapshot) {
    setStatus("Choisir une version");
    return;
  }
  snapshot.notes = String(els.versionNotesEditor?.value || "").trim();
  await dbSet(boardHistoryKey(board.id), history);
  await refreshVersionOptions(snapshot.id);
  state.versionNotesDraft = null;
  els.versionNotesDialog?.close();
  setStatus("Notes de version enregistrées");
}

async function closeVersionNotesDialog() {
  if (els.versionNotesDialog?.open) {
    await saveVersionNotesDialog();
    return;
  }
  state.versionNotesDraft = null;
  els.versionNotesDialog?.close();
}

async function toggleSelectedBoardVersionArchive() {
  const board = currentBoard();
  const history = await dbGet(boardHistoryKey(board.id)) || [];
  const selectedId = els.versionSelect?.value;
  const snapshot = history.find((item) => item.id === selectedId);
  if (!snapshot) {
    setStatus("Choisir une version");
    return;
  }
  snapshot.archived = !snapshot.archived;
  const nextHistory = versionHistoryForStorage(history);
  await dbSet(boardHistoryKey(board.id), nextHistory);
  await refreshVersionOptions(snapshot.id);
  setStatus(snapshot.archived ? "Version archivee" : "Version desarchivee");
}

async function deleteSelectedBoardVersion() {
  const { board, history, snapshot } = await selectedVersionSnapshot();
  if (!snapshot) {
    setStatus("Choisir une version");
    return;
  }
  const label = String(snapshot.label || "").trim() || formatVersionLabel(snapshot.savedAt);
  const kind = snapshot.archived ? "version archivée" : "version";
  if (!window.confirm(`Supprimer la ${kind} "${label}" ?`)) return;
  const nextHistory = history.filter((item) => item.id !== snapshot.id);
  await dbSet(boardHistoryKey(board.id), nextHistory);
  await refreshVersionOptions(nextHistory[0]?.id || "");
  setStatus(`Version supprimée: ${label}`);
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

  const selectedLabel = els.versionSelect?.selectedOptions?.[0]?.textContent || versionOptionLabel(snapshot, history.indexOf(snapshot));
  if (!window.confirm(`Restaurer "${board.name}" depuis ${selectedLabel} ?`)) return;

  await applyBoardSnapshot(snapshot);
  setBoardPadEditing(false);
  await refreshVersionOptions(snapshot.id);
  setStatus(`Version restauree: ${selectedLabel}`);
}

function normalizeExportMode(modeOrIncludeAudio = "full") {
  if (modeOrIncludeAudio === true) return "full";
  if (modeOrIncludeAudio === false) return "settings";
  return ["full", "audioOnly", "settings"].includes(modeOrIncludeAudio) ? modeOrIncludeAudio : "full";
}

async function exportCurrentBoard(modeOrIncludeAudio = "full") {
  const exportMode = normalizeExportMode(modeOrIncludeAudio);
  const includeAudio = exportMode !== "settings";
  const includeVideo = exportMode === "full";
  const board = currentBoard();
  // Immediate feedback: the prep step (persist) can take a moment with no UI.
  setStatus("Préparation de l'export…", "progress");
  await new Promise((resolve) => requestAnimationFrame(() => resolve()));
  const pads = [];
  syncPadIndexesFromDom();
  await persistCurrentPadsForExport();
  const orderedPads = orderedPadsForCurrentBoard();
  const orderedPadByIndex = new Map(orderedPads.map((pad) => [pad.index, pad]));
  const shortcuts = state.shortcuts.length ? state.shortcuts : defaultShortcuts();
  const history = await dbGet(boardHistoryKey(board.id)) || [];

  for (let index = 0; index < board.padCount; index += 1) {
    const pad = orderedPadByIndex.get(index) || state.pads.find((item) => item.index === index) || makePad(index);
    const meta = await dbGet(padMetaKey(pad));
    const saved = await dbGet(padAudioKey(pad));
    const hasVideoPad = Boolean(saved?.video || saved?.videoName || meta?.videoName || meta?.videoPath);
    setStatus(`Export : ${index + 1} / ${board.padCount} — ${meta?.title || saved?.title || `Pad ${index + 1}`}`, "progress");
    const audioInfo = hasVideoPad ? null : await resolvePadAudioRecord(pad, meta, saved);
    const exportAudio = includeAudio && !hasVideoPad ? await audioRecordForExport(audioInfo, "data") : null;
    const exportVideo = includeVideo ? await videoRecordForExport(saved) : null;
    const audioRef = hasVideoPad ? NaN : Number(meta?.audioRefIndex ?? saved?.audioRefIndex);
    const audioUid = ensureAudioRecordUid(audioInfo || saved || meta, meta?.uid || saved?.uid || pad.uid);
    pads.push({
      index,
      uid: meta?.uid || saved?.uid || pad.uid || createId(),
      audioUid,
      title: meta?.title || saved?.title || `Pad ${index + 1}`,
      volume: meta?.volume ?? saved?.volume ?? 0.85,
      panValue: meta?.panValue ?? saved?.panValue ?? 0,
      loop: Boolean(meta?.loop ?? saved?.loop),
      duckTrigger: Boolean(meta?.duckTrigger ?? saved?.duckTrigger),
      duckMode: meta?.duckMode ?? saved?.duckMode ?? ((meta?.duckTrigger ?? saved?.duckTrigger) ? "global" : "none"),
      duckPercent: meta?.duckPercent ?? saved?.duckPercent ?? duckPercentValue(),
      reverse: Boolean(meta?.reverse ?? saved?.reverse),
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
      eqMode: meta?.eqMode ?? saved?.eqMode ?? "global",
      eqLow: meta?.eqLow ?? saved?.eqLow ?? 0,
      eqMid: meta?.eqMid ?? saved?.eqMid ?? 0,
      eqHigh: meta?.eqHigh ?? saved?.eqHigh ?? 0,
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
      audio: (exportAudio || audioInfo?.name || audioInfo?.path || meta?.audioName || meta?.audioPath) ? {
        audioUid,
        name: audioInfo?.name || meta?.audioName || saved?.name || `Pad ${index + 1}`,
        path: audioInfo?.path || saved?.path || meta?.audioPath || audioInfo?.name || meta?.audioName || `Pad ${index + 1}`,
        pathTrusted: Boolean(audioInfo?.pathTrusted || saved?.pathTrusted || meta?.audioPathTrusted),
        type: audioInfo?.type || saved?.type || "audio/mpeg",
        data: exportAudio?.data || "",
      } : null,
      video: (exportVideo || saved?.videoName || meta?.videoName || meta?.videoPath) ? {
        audioUid,
        name: exportVideo?.name || saved?.videoName || meta?.videoName || `Pad ${index + 1}`,
        path: exportVideo?.path || saved?.videoPath || meta?.videoPath || saved?.videoName || meta?.videoName || `Pad ${index + 1}`,
        type: exportVideo?.type || saved?.videoType || meta?.videoType || "video/mp4",
        duration: exportVideo?.duration ?? saved?.videoDuration ?? meta?.videoDuration ?? 0,
        data: exportVideo?.data || "",
      } : null,
      textContent: meta?.textContent ?? saved?.textContent ?? "",
      textMode: Boolean(meta?.textMode ?? saved?.textMode),
      textName: meta?.textName ?? saved?.textName ?? "",
      textLang: meta?.textLang ?? saved?.textLang ?? "fr-FR",
      textGender: meta?.textGender ?? saved?.textGender ?? "female",
      textVoiceURI: meta?.textVoiceURI ?? saved?.textVoiceURI ?? "",
      textRate: meta?.textRate ?? saved?.textRate ?? DEFAULT_TEXT_RATE,
      noteText: meta?.noteText ?? saved?.noteText ?? "",
      noteShowOnStart: Boolean(meta?.noteShowOnStart ?? saved?.noteShowOnStart),
      noteShowOnEnd: Boolean(meta?.noteShowOnEnd ?? saved?.noteShowOnEnd),
    });
  }

  const versionsForExport = (await Promise.all(pruneVersionHistory(history)
    .map((snapshot) => serializeBoardSnapshotForExport(snapshot, false))))
    .filter(Boolean);

  const payload = {
    format: "soundboard-live-board",
    version: 1,
    exportedAt: new Date().toISOString(),
    includesAudio: includeAudio,
    includesVideo: includeVideo,
    exportMode,
    versions: versionsForExport,
    board: {
      name: board.name,
      padCount: board.padCount,
      // Skins : référence du skin sélectionné par le board + TOUTE la bibliothèque
      // de skins perso (ils font partie des réglages et voyagent avec le board).
      skin: board.skin || null,
      customSkins: readCustomSkins(),
      masterVolume: board.masterVolume ?? DEFAULT_MASTER_VOLUME,
      layoutMode: board.layoutMode || "auto",
      padColumns: board.padColumns || 0,
      padRows: board.padRows || 0,
      cuesEnabled: board.cuesEnabled !== false,
      cues: normalizeCues(board.cues),
      cueIndex: cueIndexForBoard(board),
      shortcutsEnabled: state.shortcutsEnabled,
      shortcuts: shortcuts.map((shortcut) => ({
        key: normalizeShortcutKey(shortcut.key),
        padIndex: Math.min(board.padCount - 1, Math.max(0, Number(shortcut.padIndex) || 0)),
      })),
      versions: versionsForExport,
      pads,
    },
  };

  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const suffix = exportMode === "full"
    ? "soundboard"
    : exportMode === "audioOnly"
      ? "soundboard-audio-sans-video"
      : "soundboard-settings";
  await shareOrDownloadBoard(blob, `${safeFileName(board.name)}.${timestampForFile()}.${suffix}.json`, board.name);
}

function orderedPadsForCurrentBoard() {
  syncPadIndexesFromDom();
  return [...els.pads.querySelectorAll("[data-pad]")]
    .map((node) => padFromNode(node))
    .filter(Boolean)
    .sort((a, b) => a.index - b.index);
}

async function persistCurrentPadsForExport() {
  const pads = orderedPadsForCurrentBoard();
  for (const pad of pads) {
    await savePadMeta(pad);
  }
}

// Enregistre les skins perso embarqués dans un board importé (toute la
// bibliothèque ; rétrocompatible avec l'ancien champ `customSkin` singulier),
// en dédoublonnant par id (on conserve une version locale existante). Renvoie
// ensuite la référence de skin que le board doit appliquer, ou null.
function registerImportedCustomSkins(boardData) {
  let incoming = Array.isArray(boardData?.customSkins) ? boardData.customSkins : [];
  if (!incoming.length && boardData?.customSkin) incoming = [boardData.customSkin];

  if (incoming.length) {
    const skins = readCustomSkins();
    const ids = new Set(skins.map((s) => s.id));
    let added = false;
    for (const c of incoming) {
      if (!c || !c.id || !c.variables || ids.has(c.id)) continue;
      skins.push({ id: c.id, name: c.name || "Skin importé", createdAt: c.createdAt || new Date().toISOString(), variables: c.variables, harmony: c.harmony || null });
      ids.add(c.id);
      added = true;
    }
    if (added) { writeCustomSkins(skins); updateSkinOptions(); }
  }

  const ref = boardData?.skin;
  if (typeof ref !== "string" || !ref) return null;
  if (ref.startsWith(CUSTOM_SKIN_PREFIX)) {
    return customSkinById(ref.slice(CUSTOM_SKIN_PREFIX.length)) ? ref : null; // seulement si présent
  }
  return ref; // skin intégré
}

async function importBoardFile(file) {
  let payload;
  try {
    payload = parseBoardJson(await fileToText(file));
  } catch {
    setStatus("Fichier board illisible");
    return;
  }

  if (payload?.format !== "soundboard-live-board" || !payload.board) {
    setStatus("Fichier board invalide", "stop");
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
    cuesEnabled: payload.board.cuesEnabled !== false,
    cues: payload.board.cues,
    cueIndex: payload.board.cueIndex,
  });
  // Enregistre les skins perso embarqués et restaure le skin du board.
  const restoredSkin = registerImportedCustomSkins(payload.board);
  if (restoredSkin) importedBoard.skin = restoredSkin;
  setBoardPadEditing(false);
  state.boards.push(importedBoard);
  state.currentBoardId = importedBoard.id;
  saveBoards();
  renderBoardOptions();
  if (importedBoard.skin) applySkin(importedBoard.skin);

  let audioFailures = 0;
  for (let index = 0; index < importedBoard.padCount; index += 1) {
    const item = pads.find((padItem) => Number(padItem?.index) === index) || {};
    const transientPad = { index };
    const meta = {
      uid: item.uid || createId(),
      title: item.title || `Pad ${index + 1}`,
      volume: item.volume ?? 0.85,
      panValue: item.panValue ?? 0,
      loop: Boolean(item.loop),
      duckTrigger: Boolean(item.duckTrigger),
      duckMode: item.duckMode || (item.duckTrigger ? "global" : "none"),
      duckPercent: item.duckPercent ?? duckPercentValue(),
      reverse: Boolean(item.reverse),
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
      eqMode: item.eqMode || "global",
      eqLow: item.eqLow ?? 0,
      eqMid: item.eqMid ?? 0,
      eqHigh: item.eqHigh ?? 0,
      mono: Boolean(item.mono),
      normalizeEnabled: item.normalizeEnabled ?? true,
      normalizedGain: item.normalizedGain ?? 1,
      visualImage: item.visualImage || "",
      visualImageHidden: Boolean(item.visualImageHidden),
      visualKind: item.visualKind || "",
      audioUid: item.audioUid || item.audio?.audioUid || item.video?.audioUid || "",
      audioName: item.audio?.name || item.audioName || "",
      audioPath: item.audio?.path || item.audioPath || item.audio?.name || "",
      audioPathTrusted: Boolean(item.audio?.pathTrusted || item.audioPathTrusted),
      audioDuration: Number(item.audioDuration ?? item.audio?.duration) || 0,
      audioSampleRate: Number(item.audioSampleRate) || 0,
      audioChannels: Number(item.audioChannels) || 0,
      audioByteLength: Number(item.audioByteLength) || 0,
      videoName: item.video?.name || item.videoName || "",
      videoPath: item.video?.path || item.videoPath || item.video?.name || "",
      videoType: item.video?.type || item.videoType || "",
      videoDuration: item.video?.duration ?? item.videoDuration ?? 0,
      textContent: item.textContent || "",
      textMode: Boolean(item.textMode || item.textContent),
      textName: item.textName || "",
      textLang: item.textLang || "fr-FR",
      textGender: item.textGender || "female",
      textVoiceURI: item.textVoiceURI || "",
      textRate: item.textRate ?? DEFAULT_TEXT_RATE,
      noteText: item.noteText || "",
      noteShowOnStart: Boolean(item.noteShowOnStart),
      noteShowOnEnd: Boolean(item.noteShowOnEnd),
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
          uid: meta.uid,
          audioUid: meta.audioUid || createId(),
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
    } else if (item.audio?.name || item.audio?.path) {
      await dbSet(padAudioKey(transientPad), {
        uid: meta.uid,
        audioUid: meta.audioUid || createId(),
        name: item.audio.name || meta.title,
        path: item.audio.path || item.audio.name || meta.title,
        pathTrusted: Boolean(item.audio.pathTrusted),
        title: meta.title,
        type: item.audio.type || "audio/mpeg",
        ...meta,
      });
    }
    if (item.video?.data) {
      try {
        await dbSet(padAudioKey(transientPad), {
          ...(await dbGet(padAudioKey(transientPad)) || {}),
          uid: meta.uid,
          audioUid: meta.audioUid || item.video?.audioUid || createId(),
          title: meta.title,
          video: base64ToArrayBuffer(item.video.data),
          videoName: item.video.name || meta.videoName || meta.title,
          videoPath: item.video.path || meta.videoPath || item.video.name || meta.title,
          videoType: item.video.type || meta.videoType || "video/mp4",
          videoDuration: Number(item.video.duration || meta.videoDuration) || 0,
        });
      } catch {
        audioFailures += 1;
      }
    } else if (item.video?.name || item.video?.path) {
      await dbSet(padAudioKey(transientPad), {
        ...(await dbGet(padAudioKey(transientPad)) || {}),
        uid: meta.uid,
        audioUid: meta.audioUid || item.video?.audioUid || createId(),
        title: meta.title,
        videoName: item.video.name || meta.videoName || meta.title,
        videoPath: item.video.path || meta.videoPath || item.video.name || meta.title,
        videoType: item.video.type || meta.videoType || "video/mp4",
        videoDuration: Number(item.video.duration || meta.videoDuration) || 0,
      });
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

  const rawImportedVersions = [
    ...(Array.isArray(payload.versions) ? payload.versions : []),
    ...(Array.isArray(payload.board.versions) ? payload.board.versions : []),
  ];
  const seenImportedVersionIds = new Set();
  const importedVersions = rawImportedVersions
    .filter((snapshot) => {
      const id = String(snapshot?.id || "");
      if (!id) return true;
      if (seenImportedVersionIds.has(id)) return false;
      seenImportedVersionIds.add(id);
      return true;
    })
    .map(deserializeBoardSnapshotFromExport)
    .filter(Boolean);
  const prunedImportedVersions = pruneVersionHistory(importedVersions);
  await hydrateImportedVersionAudio(prunedImportedVersions, importedBoard.id);
  if (prunedImportedVersions.length) {
    await dbSet(boardHistoryKey(importedBoard.id), prunedImportedVersions);
  }

  await renderPads();
  await refreshVersionOptions(prunedImportedVersions[0]?.id || "");
  setStatus(audioFailures
    ? `${importedBoard.name} importe (${audioFailures} audio ignore${audioFailures > 1 ? "s" : ""})`
    : `${importedBoard.name} importe`);
}

async function addPad() {
  const board = currentBoard();
  board.padCount += 1;
  saveBoards();
  const pad = makePad(board.padCount - 1);
  await dbDelete(padMetaKey(pad));
  await dbDelete(padAudioKey(pad));
  await savePadMeta(pad);
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

function resetDeletedPadCrossfadeRefs(record, deletedPad) {
  if (!record || !deletedPad) return record;
  const deletedTargets = new Set([
    padTargetValue(deletedPad),
    `pad:${deletedPad.index}`,
  ]);
  const next = { ...record };
  if (deletedTargets.has(String(next.startStopTag || ""))) {
    next.startStopMode = "none";
    next.startStopTag = "";
  }
  if (deletedTargets.has(String(next.endStartTarget || ""))) {
    next.endStartMode = "none";
    next.endStartTarget = "";
  }
  return next;
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

function copyableBoardsForCurrentBoard() {
  return state.boards
    .filter((board) => board.id !== state.currentBoardId)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr", { sensitivity: "base" }));
}

function openPadTransferDialog(pad) {
  if (!state.boardEditMode) return;
  const targets = copyableBoardsForCurrentBoard();
  if (!targets.length) {
    setStatus("Créer un autre board pour transférer un pad");
    return;
  }
  state.transferPad = pad;
  if (els.padTransferName) els.padTransferName.textContent = pad.title || `Pad ${pad.index + 1}`;
  if (els.padTransferBoard) {
    els.padTransferBoard.innerHTML = "";
    targets.forEach((board) => {
      const option = document.createElement("option");
      option.value = board.id;
      option.textContent = board.name;
      els.padTransferBoard.append(option);
    });
  }
  if (els.padTransferDialog?.showModal) els.padTransferDialog.showModal();
}

function resetPadSpecificCrossfadeTargets(record) {
  if (!record) return record;
  const next = { ...record, audioRefIndex: null };
  if (String(next.startStopTag || "").startsWith("pad:")) {
    next.startStopMode = "none";
    next.startStopTag = "";
  }
  if (String(next.endStartTarget || "").startsWith("pad:")) {
    next.endStartMode = "none";
    next.endStartTarget = "";
  }
  return next;
}

// Un slot stocké est « vide » s'il n'a ni blob (audio/vidéo), ni nom/chemin média, ni texte.
// NB : on n'utilise PAS audioRefIndex : savePadMeta convertit null → 0 (Number(null) === 0),
// donc tout pad vide neuf a audioRefIndex: 0 et paraîtrait « lié à pad 0 ». Le vrai audio est
// couvert par le blob et par audioName/audioPath (un pad lié a toujours un nom).
function storedPadIsEmpty(meta, rawSaved) {
  if (rawSaved?.audio || rawSaved?.video) return false; // blob présent
  if (rawSaved?.videoName || rawSaved?.videoPath || meta?.videoName || meta?.videoPath) return false; // vidéo (réf.)
  if (meta?.textMode || meta?.textContent) return false; // texte
  if (rawSaved?.name || rawSaved?.path || meta?.audioName || meta?.audioPath) return false; // audio (réf. ou manquant)
  return true;
}

// Premier pad vide du board (dans [0, padCount)) ; à défaut, padCount (= ajout à la fin).
async function firstEmptyPadIndex(boardId, padCount) {
  for (let i = 0; i < padCount; i += 1) {
    const meta = await dbGet(padMetaKeyFor(boardId, i));
    const rawSaved = await dbGet(padAudioKeyFor(boardId, i));
    if (storedPadIsEmpty(meta, rawSaved)) return i;
  }
  return padCount;
}

async function copyPadToBoard(pad, targetBoardId) {
  const sourceBoardId = state.currentBoardId;
  const targetBoard = state.boards.find((board) => board.id === targetBoardId);
  if (!pad || !targetBoard || targetBoard.id === sourceBoardId) return null;

  syncPadIndexesFromDom();
  await savePadMeta(pad);
  const sourceMeta = await dbGet(padMetaKeyFor(sourceBoardId, pad.index));
  const sourceAudio = await dbGet(padAudioKeyFor(sourceBoardId, pad.index));
  const resolvedAudio = await resolvePadAudioRecord(pad, sourceMeta, sourceAudio);
  // Coller dans le premier pad VIDE du board cible (pas systématiquement à la fin).
  const targetIndex = await firstEmptyPadIndex(targetBoard.id, targetBoard.padCount);
  const title = sourceMeta?.title || sourceAudio?.title || pad.title || `Pad ${pad.index + 1}`;
  const uid = createId();
  const targetMeta = resetPadSpecificCrossfadeTargets({
    ...(sourceMeta || {}),
    uid,
    title,
  });
  const targetAudio = resolvedAudio?.audio
    ? resetPadSpecificCrossfadeTargets({
      ...resolvedAudio,
      uid,
      title,
      audioRefIndex: null,
    })
    : null;

  await dbSet(padMetaKeyFor(targetBoard.id, targetIndex), targetMeta);
  if (targetAudio) {
    await dbSet(padAudioKeyFor(targetBoard.id, targetIndex), targetAudio);
  } else {
    await dbDelete(padAudioKeyFor(targetBoard.id, targetIndex));
  }
  // N'agrandir le board que si on a ajouté à la fin (aucun pad vide réutilisé).
  if (targetIndex >= targetBoard.padCount) targetBoard.padCount = targetIndex + 1;
  saveBoards();
  return { targetBoard, targetIndex, title };
}

async function transferPadToBoard(move = false) {
  const pad = state.transferPad;
  const targetBoardId = els.padTransferBoard?.value;
  if (!pad || !targetBoardId) {
    setStatus("Pad à transférer introuvable", "stop");
    return;
  }
  const sourceBoard = currentBoard();
  if (move && sourceBoard.padCount <= 1) {
    setStatus("Dernier pad non déplaçable");
    return;
  }
  const copied = await copyPadToBoard(pad, targetBoardId);
  if (!copied) {
    setStatus("Transfert impossible", "stop");
    return;
  }
  if (move) {
    await removePadFromCurrentBoard(pad, { confirm: false, render: true, status: false });
    setStatus(`${copied.title} déplacé vers ${copied.targetBoard.name}`);
  } else {
    renderBoardOptions();
    if (state.boardEditMode) setBoardPadEditing(true);
    setStatus(`${copied.title} copié vers ${copied.targetBoard.name}`);
  }
  state.transferPad = null;
  els.padTransferDialog?.close();
}

async function duplicatePadFromNode(sourceNode, directPad = null) {
  if (!state.boardEditMode) return;
  const padNodes = [...els.pads.querySelectorAll("[data-pad]")];
  const sourceIndex = padNodes.indexOf(sourceNode);
  if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= state.pads.length) {
    setStatus("Pad à copier introuvable", "stop");
    return;
  }
  const sourcePad = directPad?.node === sourceNode ? directPad : padFromNode(sourceNode);
  if (!sourcePad) {
    setStatus("Pad à copier introuvable", "stop");
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
    uid: createId(),
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
  await removePadFromCurrentBoard(pad, { confirm: true, render: true, status: true });
}

function orphanAudioKey() {
  return `${ORPHAN_AUDIO_PREFIX}${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function sameAudioPayload(a, b) {
  return Boolean(a && b && a === b);
}

function snapshotsReferenceAudio(snapshots, audioRecord) {
  if (!audioRecord?.audio) return false;
  return snapshots.some((snapshot) => sameAudioPayload(snapshot.audio?.audio, audioRecord.audio));
}

async function preserveAudioForCleanup(record, source = "") {
  if (!recordContainsAudio(record)) return "";
  const key = orphanAudioKey();
  await dbSet(key, {
    ...record,
    cleanupSource: source,
    cleanupCreatedAt: new Date().toISOString(),
  });
  return key;
}

async function removePadFromCurrentBoard(pad, options = {}) {
  if (!state.boardEditMode) return;
  const shouldConfirm = options.confirm !== false;
  const shouldRender = options.render !== false;
  const shouldStatus = options.status !== false;
  const board = currentBoard();
  if (board.padCount <= 1) {
    setStatus("Dernier pad non supprimable");
    return false;
  }
  if (shouldConfirm && !window.confirm(`Supprimer le pad "${pad.title}" ?`)) return false;

  stopAll();
  if (state.recordingPad === pad) resetRecordingState();

  const boardId = state.currentBoardId;
  const deletedAudio = await dbGet(padAudioKeyFor(boardId, pad.index));
  const remainingPads = state.pads.filter((item) => item !== pad);
  const snapshots = [];
  for (const item of remainingPads) {
    const audioRecord = adjustAudioRefAfterDelete(await dbGet(padAudioKeyFor(boardId, item.index)), pad.index, deletedAudio);
    const metaRecord = adjustAudioRefAfterDelete(await dbGet(padMetaKeyFor(boardId, item.index)), pad.index);
    snapshots.push({
      audio: resetDeletedPadCrossfadeRefs(audioRecord, pad),
      meta: resetDeletedPadCrossfadeRefs(metaRecord, pad),
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

  if (deletedAudio?.audio && !snapshotsReferenceAudio(snapshots, deletedAudio)) {
    await preserveAudioForCleanup(deletedAudio, `${board.name} / ${pad.title}`);
  }
  await dbDelete(padMetaKeyFor(boardId, board.padCount - 1));
  await dbDelete(padAudioKeyFor(boardId, board.padCount - 1));
  board.padCount = remainingPads.length;
  if (!shouldRender) {
    state.pads = remainingPads;
    state.pads.forEach((item, index) => {
      item.index = index;
    });
  }
  saveBoards();
  if (shouldRender) {
    await renderPads();
    setBoardPadEditing(true);
  }
  if (shouldStatus) setStatus(`${pad.title} supprime`);
  if (shouldStatus) offerAudioCleanupAfterDeletion().catch(() => {});
  return true;
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
    const record = await dbGet(padAudioKeyFor(board.id, index));
    if (record?.audio) await preserveAudioForCleanup(record, `${board.name} / pad ${index + 1}`);
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
  setBoardPadEditing(false);
  setStatus(`${board.name} supprime`);
  offerAudioCleanupAfterDeletion().catch(() => setStatus(`${board.name} supprime · nettoyage indisponible`, "stop"));
}

function isAudioStoreKey(key) {
  return /^pad-\d+$/.test(String(key || ""))
    || /^board-.+-pad-\d+$/.test(String(key || ""))
    || String(key || "").startsWith(ORPHAN_AUDIO_PREFIX);
}

function recordContainsAudio(record) {
  return Boolean(record?.audio);
}

function referencedAudioKeyForRecord(boardId, index, record) {
  const refIndex = Number(record?.audioRefIndex);
  return padAudioKeyFor(boardId, Number.isInteger(refIndex) ? refIndex : index);
}

async function referencedAudioKeysForBoard(board) {
  const keys = new Set();
  const padCount = Math.max(0, Number(board?.padCount) || 0);
  for (let index = 0; index < padCount; index += 1) {
    const ownKey = padAudioKeyFor(board.id, index);
    keys.add(ownKey);
    const [audioRecord, metaRecord] = await Promise.all([
      dbGet(ownKey),
      dbGet(padMetaKeyFor(board.id, index)),
    ]);
    keys.add(referencedAudioKeyForRecord(board.id, index, audioRecord));
    keys.add(referencedAudioKeyForRecord(board.id, index, metaRecord));
  }
  return keys;
}

function referencedAudioKeysForSnapshot(boardId, snapshot) {
  const keys = new Set();
  (snapshot?.pads || []).forEach((item) => {
    const index = Number(item?.index);
    if (!Number.isInteger(index) || index < 0) return;
    const audio = item?.audio;
    const meta = item?.meta;
    if (audio?.preserveCurrentAudio || audio?.audioRefIndex != null) {
      keys.add(referencedAudioKeyForRecord(boardId, index, audio));
    }
    if (meta?.audioRefIndex != null) {
      keys.add(referencedAudioKeyForRecord(boardId, index, meta));
    }
  });
  return keys;
}

async function referencedAudioKeysForAllBoards() {
  const keys = new Set();
  for (const board of state.boards) {
    const boardKeys = await referencedAudioKeysForBoard(board);
    boardKeys.forEach((key) => keys.add(key));
    const history = await dbGet(boardHistoryKey(board.id)) || [];
    history.forEach((snapshot) => {
      referencedAudioKeysForSnapshot(board.id, snapshot).forEach((key) => keys.add(key));
    });
  }
  return keys;
}

function cleanupAudioLabel(record, key) {
  return String(record?.title || record?.name || record?.audioName || record?.path || key || "son").trim();
}

function cleanupAudioDetail(record) {
  const details = [
    record?.cleanupSource ? `source: ${record.cleanupSource}` : "",
    record?.name || record?.audioName || "",
    record?.type || "",
  ].filter(Boolean);
  return details.join(" · ");
}

function cleanupSourceBoardName(record) {
  const source = String(record?.cleanupSource || "").split("/")[0]?.trim();
  return source || currentBoard()?.name || "board";
}

async function orphanAudioCandidates() {
  const [keys, referenced] = await Promise.all([
    dbKeys(),
    referencedAudioKeysForAllBoards(),
  ]);
  const candidates = [];
  for (const key of keys) {
    if (!isAudioStoreKey(key) || referenced.has(key)) continue;
    const record = await dbGet(key);
    if (!recordContainsAudio(record)) continue;
    candidates.push({
      key,
      record,
      label: cleanupAudioLabel(record, key),
      detail: cleanupAudioDetail(record),
    });
  }
  return candidates.sort((a, b) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }));
}

function selectedCleanupCandidates() {
  const selectedKeys = new Set([...els.audioCleanupList?.querySelectorAll("input:checked") || []].map((input) => input.value));
  return (state.audioCleanupCandidates || []).filter((candidate) => selectedKeys.has(candidate.key));
}

function renderAudioCleanupDialog(candidates) {
  state.audioCleanupCandidates = candidates;
  if (els.audioCleanupSummary) {
    els.audioCleanupSummary.textContent = "Le ou les sons suivants ne sont plus référencés (ils n’apparaissent plus dans aucun pad, aucun board, aucune version sauvegardée ou archivée) :";
  }
  if (!els.audioCleanupList) return;
  els.audioCleanupList.innerHTML = "";
  candidates.forEach((candidate) => {
    const label = document.createElement("label");
    label.className = "cleanup-audio-item";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = candidate.key;
    input.checked = true;
    const text = document.createElement("span");
    text.textContent = candidate.label;
    const detail = document.createElement("small");
    detail.textContent = candidate.detail || candidate.key;
    label.append(input, text, detail);
    els.audioCleanupList.append(label);
  });
}

async function offerAudioCleanupAfterDeletion() {
  const candidates = await orphanAudioCandidates();
  if (!candidates.length) return;
  renderAudioCleanupDialog(candidates);
  if (els.audioCleanupDialog?.showModal) {
    els.audioCleanupDialog.showModal();
  } else if (window.confirm(`${candidates.length} son(s) ne sont plus référencés. Les supprimer ?`)) {
    await deleteSelectedCleanupAudio(candidates);
  }
}

async function exportCleanupAudioFiles() {
  const candidates = selectedCleanupCandidates();
  if (!candidates.length) {
    setStatus("Aucun son sélectionné", "stop");
    return;
  }
  if (!window.showDirectoryPicker) {
    setStatus("Sélection de dossier indisponible dans ce navigateur", "stop");
    return;
  }
  const directory = await window.showDirectoryPicker({ mode: "readwrite" });
  const stamp = timestampForFile();
  let written = 0;
  for (const candidate of candidates) {
    if (!candidate.record?.audio) continue;
    const type = candidate.record.type || "audio/mpeg";
    const extension = recordingExtension(type);
    const boardName = safeFileName(cleanupSourceBoardName(candidate.record));
    const padName = safeFileName(cleanupAudioLabel(candidate.record, candidate.key));
    const filename = `${stamp}.${boardName}.${padName}.${extension}`;
    const handle = await directory.getFileHandle(filename, { create: true });
    const writable = await handle.createWritable();
    await writable.write(new Blob([candidate.record.audio], { type }));
    await writable.close();
    written += 1;
  }
  els.audioCleanupDialog?.close();
  setStatus(`${written} son${written > 1 ? "s" : ""} enregistré${written > 1 ? "s" : ""}`);
}

async function deleteSelectedCleanupAudio(candidates = selectedCleanupCandidates()) {
  if (!candidates.length) {
    setStatus("Aucun son sélectionné", "stop");
    return;
  }
  const names = candidates.map((candidate) => `- ${candidate.label}`).join("\n");
  if (!window.confirm(`Supprimer définitivement les sons sélectionnés ?\n\n${names}`)) return;
  for (const candidate of candidates) {
    await dbDelete(candidate.key);
  }
  state.audioCleanupCandidates = [];
  els.audioCleanupDialog?.close();
  setStatus(`${candidates.length} son${candidates.length > 1 ? "s" : ""} supprimé${candidates.length > 1 ? "s" : ""}`);
}

async function repairAccidentalPadTitles() {
  if (state.currentBoardId !== DEFAULT_BOARD_ID) return;
  if (localStorage.getItem(PAD_NAME_REPAIR) === "done") return;

  const boardId = state.currentBoardId;

  for (const pad of state.pads) {
    const accidentalTitle = KEYS[pad.index];
    const title = `Pad ${pad.index + 1}`;
    const meta = await dbGet(padMetaKeyFor(boardId, pad.index));
    const saved = await dbGet(padAudioKeyFor(boardId, pad.index));
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

// --- Text file import: plain, RTF, DOCX -----------------------------------
function decodeXmlEntities(s) {
  return String(s)
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, "&");
}

// Proper-ish RTF → text: walks brace groups and skips header/destination
// groups (font table, color table, stylesheet, info…) so their content
// (font names, the ";;" separators, metadata) is not emitted.
function rtfToText(rtf) {
  const s = String(rtf || "");
  const n = s.length;
  const IGNORE = new Set([
    "fonttbl", "colortbl", "stylesheet", "info", "pict", "object", "header",
    "footer", "headerl", "headerr", "footerl", "footerr", "themedata",
    "colorschememapping", "latentstyles", "datastore", "listtable",
    "listoverridetable", "rsidtbl", "generator", "filetbl", "revtbl",
    "xmlnstbl", "mmathPr", "operator", "nonshppict", "fldinst",
  ]);
  const stack = [{ ignore: false, uc: 1 }];
  const top = () => stack[stack.length - 1];
  let out = "";
  let skip = 0; // unicode-fallback chars to skip after \uN
  let i = 0;
  const put = (str) => { if (!top().ignore) out += str; };
  const unit = (str) => { if (skip > 0) { skip -= 1; return; } put(str); };
  while (i < n) {
    const c = s[i];
    if (c === "{") { stack.push({ ignore: top().ignore, uc: top().uc }); i += 1; continue; }
    if (c === "}") { if (stack.length > 1) stack.pop(); i += 1; continue; }
    if (c === "\\") {
      const nx = s[i + 1];
      if (nx === "\\" || nx === "{" || nx === "}") { unit(nx); i += 2; continue; }
      if (nx === "*") { top().ignore = true; i += 2; continue; }
      if (nx === "'") { unit(String.fromCharCode(parseInt(s.substr(i + 2, 2), 16) || 0)); i += 4; continue; }
      if (/[a-z]/i.test(nx)) {
        let j = i + 1;
        while (j < n && /[a-z]/i.test(s[j])) j += 1;
        const word = s.slice(i + 1, j);
        let k = j;
        let p = "";
        if (s[k] === "-") { p = "-"; k += 1; }
        while (k < n && /[0-9]/.test(s[k])) { p += s[k]; k += 1; }
        if (s[k] === " ") k += 1;
        i = k;
        if (IGNORE.has(word)) top().ignore = true;
        else if (word === "par" || word === "line" || word === "sect" || word === "page") put("\n");
        else if (word === "tab") put("\t");
        else if (word === "uc") top().uc = Math.max(0, parseInt(p || "1", 10));
        else if (word === "u") {
          put(String.fromCharCode(((parseInt(p || "0", 10) % 65536) + 65536) % 65536));
          skip = top().uc;
        }
        continue;
      }
      i += 2; // control symbol (\~, \-, …)
      continue;
    }
    if (c === "\r" || c === "\n") { i += 1; continue; }
    unit(c);
    i += 1;
  }
  return out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function inflateRawToText(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new TextDecoder("utf-8").decode(await new Response(stream).arrayBuffer());
}

function docxXmlToText(xml) {
  let s = String(xml || "")
    .replace(/<w:tab\b[^>]*\/?>/g, "\t")
    .replace(/<w:br\b[^>]*\/?>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "");
  return decodeXmlEntities(s).replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
}

async function extractDocxText(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const dv = new DataView(arrayBuffer);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= 0 && i > bytes.length - 22 - 65536; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("ZIP EOCD introuvable");
  const cdOffset = dv.getUint32(eocd + 16, true);
  const cdCount = dv.getUint16(eocd + 10, true);
  let p = cdOffset;
  let target = null;
  for (let n = 0; n < cdCount; n += 1) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nameLen));
    if (name === "word/document.xml") { target = { method, compSize, localOffset }; break; }
    p += 46 + nameLen + extraLen + commentLen;
  }
  if (!target) throw new Error("word/document.xml introuvable");
  const lo = target.localOffset;
  if (dv.getUint32(lo, true) !== 0x04034b50) throw new Error("En-tête local ZIP invalide");
  const dataStart = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
  const data = bytes.subarray(dataStart, dataStart + target.compSize);
  const xml = target.method === 0 ? new TextDecoder("utf-8").decode(data) : await inflateRawToText(data);
  return docxXmlToText(xml);
}

// Read a text-bearing file, parsing RTF/DOCX into plain text.
async function readTextFile(file) {
  const name = String(file?.name || "").toLowerCase();
  if (name.endsWith(".docx")) return extractDocxText(await file.arrayBuffer());
  if (name.endsWith(".rtf")) return rtfToText(await file.text());
  return file.text();
}

async function loadFileIntoPad(pad, file) {
  await ensureAudio();
  const arrayBuffer = await file.arrayBuffer();
  const exposedPath = file.path || file.webkitRelativePath || "";
  await loadAudioIntoPad(pad, arrayBuffer, file.name, file.type, exposedPath, Boolean(exposedPath));
}

async function loadAudioIntoPad(pad, arrayBuffer, name, type, path = "", pathTrusted = false, options = {}) {
  await ensureAudio();
  disposeVideoProjection(pad);
  const buffer = await state.audioContext.decodeAudioData(arrayBuffer.slice(0));
  const nextTitle = options.keepTitle ? pad.title : cleanName(name);
  pad.buffer = buffer;
  pad.regions = []; // nouvel audio : les anciennes régions ne s'appliquent plus
  pad.effectiveBuffer = null;
  pad.effectiveBufferSig = "";
  pad.reversedBufferSource = null;
  syncStagePending();
  pad.hasDirectAudio = true;
  pad.audioName = name;
  pad.audioUid = createId();
  pad.audioType = type || "";
  pad.audioPath = path || name;
  pad.audioPathTrusted = Boolean(pathTrusted && path);
  setPadDecodedAudioMetadata(pad, buffer, arrayBuffer);
  pad.videoName = "";
  pad.videoPath = "";
  pad.videoType = "";
  pad.videoDuration = 0;
  pad.textContent = "";
  pad.textMode = false;
  pad.textName = "";
  pad.audioRefIndex = null;
  setPadNormalization(pad, true, normalizedGainForBuffer(buffer));
  setPadTitle(pad, nextTitle);
  setPadDuration(pad, buffer.duration);
  updatePadType(pad);
  renderWaveform(pad);
  pad.node.classList.remove("is-empty");
  pad.node.classList.remove("is-missing-audio");
  await dbSet(padAudioKey(pad), {
    uid: pad.uid,
    audioUid: pad.audioUid,
    name,
    path: pad.audioPath,
    pathTrusted: pad.audioPathTrusted,
    title: pad.title,
    type,
    audio: arrayBuffer,
    audioDuration: pad.audioDuration,
    audioSampleRate: pad.audioSampleRate,
    audioChannels: pad.audioChannels,
    audioByteLength: pad.audioByteLength,
    waveformPeaks: pad.waveformPeaks,
    volume: pad.volume,
    panValue: pad.panValue,
    loop: pad.loop,
    duckTrigger: pad.duckTrigger,
    duckMode: pad.duckMode,
    duckPercent: pad.duckPercent,
    reverse: pad.reverse,
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
    eqMode: pad.eqMode,
    eqLow: pad.eqLow,
    eqMid: pad.eqMid,
    eqHigh: pad.eqHigh,
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

function yieldFolderImportBatch(index) {
  if ((index + 1) % 8 !== 0) return Promise.resolve();
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function importAudioFileIntoPad(pad, file, index, total) {
  try {
    const buffer = await file.arrayBuffer();
    const exposedPath = file.webkitRelativePath || file.path || file.name;
    await loadAudioIntoPad(pad, buffer, file.name, file.type, exposedPath, Boolean(exposedPath));
    if (total > 12) setStatus(`Import dossier: ${index + 1}/${total}`);
    await yieldFolderImportBatch(index);
    return true;
  } catch (error) {
    console.warn("Import fichier audio impossible", file?.name, error);
    if (pad) {
      setPadTitle(pad, cleanName(file?.name || pad.title));
      pad.hasDirectAudio = false;
      pad.node?.classList.add("is-empty", "is-missing-audio");
      await savePadMeta(pad).catch(() => {});
    }
    await yieldFolderImportBatch(index);
    return false;
  }
}

function folderImportStatus(imported, total) {
  if (imported === total) {
    return `${total} pad${total > 1 ? "s" : ""} importé${total > 1 ? "s" : ""} depuis le dossier`;
  }
  return `${imported}/${total} fichier${total > 1 ? "s" : ""} importé${imported > 1 ? "s" : ""} - certains fichiers n'ont pas pu être chargés`;
}

function videoDurationFromBlob(blob) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const video = document.createElement("video");
    const cleanup = () => URL.revokeObjectURL(url);
    video.preload = "metadata";
    video.addEventListener("loadedmetadata", () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      cleanup();
      resolve(duration);
    }, { once: true });
    video.addEventListener("error", () => {
      cleanup();
      resolve(0);
    }, { once: true });
    video.src = url;
  });
}

async function loadVideoIntoPad(pad, file) {
  const arrayBuffer = await file.arrayBuffer();
  const exposedPath = file.path || file.webkitRelativePath || "";
  const blob = new Blob([arrayBuffer.slice(0)], { type: file.type || "video/mp4" });
  const duration = await videoDurationFromBlob(blob);
  disposeVideoProjection(pad);
  pad.buffer = null;
  pad.hasDirectAudio = false;
  pad.audioName = "";
  pad.audioUid = createId();
  pad.audioPath = "";
  pad.audioType = "";
  pad.audioRefIndex = null;
  pad.waveformPeaks = [];
  pad.videoName = file.name;
  pad.videoPath = exposedPath || file.name;
  pad.videoType = file.type || "video/mp4";
  pad.videoDuration = duration;
  pad.textContent = "";
  pad.textMode = false;
  pad.textName = "";
  setPadTrim(pad, 0, 0);
  setPadTitle(pad, cleanName(file.name));
  setPadDuration(pad, duration);
  updatePadType(pad);
  renderWaveform(pad);
  pad.node.classList.remove("is-empty", "is-missing-audio");
  await dbSet(padAudioKey(pad), {
    uid: pad.uid,
    audioUid: pad.audioUid,
    title: pad.title,
    video: arrayBuffer,
    videoName: pad.videoName,
    videoPath: pad.videoPath,
    videoType: pad.videoType,
    videoDuration: pad.videoDuration,
  });
  await savePadMeta(pad);
  if (state.audioPad === pad) syncAudioDialog(pad);
  setStatus(`Vidéo liée: ${pad.title}`);
}

function audioFilesFromSelection(files) {
  return [...(files || [])].filter((file) => (
    file?.type?.startsWith("audio/")
    || AUDIO_FILE_RE.test(file?.name || "")
  )).sort((a, b) => String(a.webkitRelativePath || a.name).localeCompare(String(b.webkitRelativePath || b.name), "fr", { sensitivity: "base" }));
}

function audioFileIdentity(file) {
  return [
    normalizedFileName(file?.webkitRelativePath || file?.name),
    normalizedFileName(file?.name),
    normalizedFileStem(file?.name),
  ].filter(Boolean);
}

function videoFilesFromSelection(files) {
  return [...(files || [])].filter((file) => (
    file?.type?.startsWith("video/")
    || /\.(mp4|mov|m4v|webm)$/i.test(file?.name || "")
  )).sort((a, b) => String(a.webkitRelativePath || a.name).localeCompare(String(b.webkitRelativePath || b.name), "fr", { sensitivity: "base" }));
}

function videoFileIdentity(file) {
  return [
    normalizedFileName(file?.webkitRelativePath || file?.name),
    normalizedFileName(file?.name),
    normalizedFileStem(file?.name),
  ].filter(Boolean);
}

function missingVideoCandidateNames(pad, meta = null, saved = null) {
  return [
    pad.videoName,
    pad.videoPath,
    pad.title,
    meta?.videoPath,
    meta?.videoName,
    meta?.title,
    saved?.videoName,
    saved?.videoPath,
    saved?.title,
  ]
    .flatMap((value) => [normalizedFileName(value), normalizedFileStem(value)])
    .filter(Boolean);
}

async function relinkMissingVideoFromFolder(files, boardId = state.currentBoardId) {
  const videoFiles = videoFilesFromSelection(files);
  if (!videoFiles.length) {
    setStatus("Aucun fichier vidéo trouvé dans ce dossier", "stop");
    return;
  }

  const byName = new Map();
  videoFiles.forEach((file) => {
    videoFileIdentity(file).forEach((key) => {
      if (key && !byName.has(key)) byName.set(key, file);
    });
  });

  let linked = 0;
  let missing = 0;
  const usedFiles = new Set();

  for (const pad of state.pads) {
    const meta = await dbGet(padMetaKey(pad));
    const saved = await dbGet(padAudioKey(pad));
    const expectsVideo = Boolean(pad.videoName || pad.videoPath || meta?.videoName || meta?.videoPath || saved?.videoName || saved?.videoPath);


    if (!expectsVideo || saved?.video) continue;

    const candidates = missingVideoCandidateNames(pad, meta, saved);
    const file = candidates
      .map((name) => byName.get(name))
      .find((item) => item && !usedFiles.has(item));

    if (!file) {
      missing += 1;
      pad.node?.classList.add("is-missing-audio");
      continue;
    }

    await loadVideoIntoPad(pad, file);
    usedFiles.add(file);
    linked += 1;
  }

  setBoardPadEditing(false);
  setStatus(linked ? `${linked} vidéo${linked > 1 ? "s" : ""} retrouvée${linked > 1 ? "s" : ""}` : `${missing || "Aucune"} vidéo manquante retrouvée`);
}

async function boardHasAnyMedia(board = currentBoard()) {
  for (let index = 0; index < board.padCount; index += 1) {
    const pad = state.pads.find((item) => item.index === index) || { index };
    const meta = await dbGet(padMetaKeyFor(board.id, index));
    const saved = await dbGet(padAudioKeyFor(board.id, index));
    if (pad.buffer || pad.videoName || saved?.audio || saved?.video || meta?.audioName || meta?.videoName) return true;
  }
  return false;
}

async function fillBlankBoardFromAudioFiles(files) {
  const board = currentBoard();
  stopAll();
  resetRecordingState();
  const previousPadCount = board.padCount;
  for (let index = 0; index < previousPadCount; index += 1) {
    await dbDelete(padMetaKeyFor(board.id, index));
    await dbDelete(padAudioKeyFor(board.id, index));
  }
  board.padCount = Math.max(1, files.length);
  saveBoards();
  await renderPads();
  let imported = 0;
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const pad = state.pads[index];
    if (await importAudioFileIntoPad(pad, file, index, files.length)) imported += 1;
  }
  setBoardPadEditing(false);
  setStatus(folderImportStatus(imported, files.length));
}

async function addAudioFilesAsNewPads(files) {
  if (!files.length) return;
  const board = currentBoard();
  const startIndex = board.padCount;
  board.padCount += files.length;
  saveBoards();
  await renderPads();
  let imported = 0;
  for (let offset = 0; offset < files.length; offset += 1) {
    const pad = state.pads[startIndex + offset];
    const file = files[offset];
    if (await importAudioFileIntoPad(pad, file, offset, files.length)) imported += 1;
  }
  setBoardPadEditing(false);
  setStatus(imported === files.length
    ? `${files.length} nouveau${files.length > 1 ? "x" : ""} pad${files.length > 1 ? "s" : ""} ajouté${files.length > 1 ? "s" : ""}`
    : folderImportStatus(imported, files.length));
}

function openFolderImportDialog(files) {
  state.folderImportFiles = files;
  if (!els.folderImportList) return;
  els.folderImportList.innerHTML = "";
  if (els.folderImportSummary) {
    els.folderImportSummary.textContent = `${files.length} fichier${files.length > 1 ? "s" : ""} audio non utilisé${files.length > 1 ? "s" : ""}.`;
  }
  files.forEach((file, index) => {
    const label = document.createElement("label");
    label.className = "folder-import-item";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = true;
    checkbox.dataset.folderFileIndex = String(index);
    const name = document.createElement("span");
    name.className = "folder-import-name";
    name.textContent = file.webkitRelativePath || file.name;
    label.append(checkbox, name);
    els.folderImportList.append(label);
  });
  if (els.folderImportDialog?.showModal) {
    els.folderImportDialog.showModal();
  } else {
    setStatus("Choisir les sons à ajouter");
  }
}

async function applyFolderImportSelection() {
  const selected = [...els.folderImportList?.querySelectorAll("input[type='checkbox']:checked") || []]
    .map((input) => state.folderImportFiles[Number(input.dataset.folderFileIndex)])
    .filter(Boolean);
  state.folderImportFiles = [];
  els.folderImportDialog?.close();
  if (!selected.length) {
    setStatus("Aucun fichier ajouté", "stop");
    return;
  }
  await addAudioFilesAsNewPads(selected);
}

function missingAudioCandidateNames(pad, meta = null, saved = null) {
  return [
    pad.audioName,
    pad.audioPath,
    pad.title,
    meta?.audioPath,
    meta?.audioName,
    meta?.title,
    saved?.name,
    saved?.path,
    saved?.title,
  ]
    .flatMap((value) => [normalizedFileName(value), normalizedFileStem(value)])
    .filter(Boolean);
}

async function relinkMissingAudioFromFolder(files) {
  const audioFiles = audioFilesFromSelection(files);
  if (!audioFiles.length) {
    setStatus("Aucun fichier audio trouvé dans ce dossier", "stop");
    return;
  }

  if (!await boardHasAnyMedia()) {
    await fillBlankBoardFromAudioFiles(audioFiles);
    return;
  }

  const byName = new Map();
  audioFiles.forEach((file) => {
    audioFileIdentity(file).forEach((key) => {
      if (key && !byName.has(key)) byName.set(key, file);
    });
  });

  let linked = 0;
  let missing = 0;
  const usedFiles = new Set();
  const unmatchedPads = [];
  for (const pad of state.pads) {
    const meta = await dbGet(padMetaKey(pad));
    const saved = await dbGet(padAudioKey(pad));
    if (pad.buffer || saved?.audio) continue;

    const file = missingAudioCandidateNames(pad, meta, saved)
      .map((name) => byName.get(name))
      .find((item) => item && !usedFiles.has(item));

    if (!file) {
      if (pad.node.classList.contains("is-missing-audio")) {
        missing += 1;
        unmatchedPads.push(pad);
      }
      continue;
    }

    const buffer = await file.arrayBuffer();
    const exposedPath = file.webkitRelativePath || file.path || file.name;
    await loadAudioIntoPad(pad, buffer, file.name, file.type, exposedPath, Boolean(exposedPath), { keepTitle: true });
    usedFiles.add(file);
    linked += 1;
  }

  const currentAudioKeys = new Set();
  for (const pad of state.pads) {
    const saved = await dbGet(padAudioKey(pad));
    [
      pad.audioName,
      pad.audioPath,
      saved?.name,
      saved?.path,
    ].flatMap((value) => [normalizedFileName(value), normalizedFileStem(value)])
      .filter(Boolean)
      .forEach((key) => currentAudioKeys.add(key));
  }

  const unusedFiles = audioFiles.filter((file) => {
    if (usedFiles.has(file)) return false;
    return !audioFileIdentity(file).some((key) => currentAudioKeys.has(key));
  });
  if (unmatchedPads.length && unusedFiles.length === unmatchedPads.length) {
    for (let index = 0; index < unmatchedPads.length; index += 1) {
      const pad = unmatchedPads[index];
      const file = unusedFiles[index];
      const buffer = await file.arrayBuffer();
      const exposedPath = file.webkitRelativePath || file.path || file.name;
      await loadAudioIntoPad(pad, buffer, file.name, file.type, exposedPath, Boolean(exposedPath), { keepTitle: true });
      usedFiles.add(file);
      linked += 1;
    }
    missing = 0;
  }

  const remainingNewFiles = unusedFiles.filter((file) => !usedFiles.has(file));
  await persistCurrentPadsForExport();
  if (remainingNewFiles.length) {
    openFolderImportDialog(remainingNewFiles);
    setStatus(linked
      ? `${linked} son${linked > 1 ? "s" : ""} retrouvé${linked > 1 ? "s" : ""}, nouveaux sons à choisir`
      : "Nouveaux sons à choisir");
    return;
  }
  setBoardPadEditing(false);
  setStatus(linked ? `${linked} son${linked > 1 ? "s" : ""} retrouvé${linked > 1 ? "s" : ""}` : `${missing || "Aucun"} son manquant retrouvé`);
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
    setStatus("Micro indisponible dans ce navigateur", "stop");
    return;
  }

  if (!window.MediaRecorder) {
    setStatus("Enregistrement non supporte ici", "stop");
    return;
  }

  if (!state.selectedMicrophoneId) {
    openMicrophoneDialog(pad);
    return;
  }

  try {
    setStatus(`Micro: ${state.selectedMicrophoneLabel || "source sélectionnée"}`);
    const stream = await navigator.mediaDevices.getUserMedia(microphoneConstraints());
    const mimeType = bestRecordingType();
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

    state.recordingPad = pad;
    state.recordingChunks = [];
    state.recordingStream = stream;
    state.recordingStartedAt = performance.now();
    state.recorder = recorder;
    startRecordingWaveform(stream, pad);
    updateRecordingUi();
    setStatus(`● Enregistrement en cours: ${pad.title}`);

    recorder.addEventListener("dataavailable", (event) => {
      if (event.data.size) state.recordingChunks.push(event.data);
    });

    recorder.addEventListener("stop", async () => {
      const recordedPad = state.recordingPad;
      const chunks = state.recordingChunks;
      const type = recorder.mimeType || mimeType || "audio/webm";
      const extension = recordingExtension(type);

      resetRecordingState();

      if (!recordedPad || !chunks.length) return;

      const blob = new Blob(chunks, { type });
      const buffer = await blob.arrayBuffer();
      await loadAudioIntoPad(recordedPad, buffer, `Enregistrement ${recordedPad.index + 1}.${extension}`, type);
      setStatus(`${recordedPad.title} enregistre`);
    });

    recorder.start(250);
  } catch (error) {
    resetRecordingState();
    if (error?.name === "NotAllowedError") {
      setStatus("Micro refusé: autoriser l’accès au micro dans les préférences système", "stop");
    } else if (error?.name === "NotFoundError") {
      setStatus("Aucun micro detecte", "stop");
    } else {
      setStatus(`Erreur micro${error?.name ? `: ${error.name}` : ""}`);
    }
  }
}

function stopRecording() {
  if (state.recorder && state.recorder.state !== "inactive") {
    state.recorder.stop();
  }
}

function startRecordingWaveform(stream, pad) {
  if (!state.audioContext || !stream) return;
  stopRecordingWaveform();
  const source = state.audioContext.createMediaStreamSource(stream);
  const analyser = state.audioContext.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);
  state.recordingSource = source;
  state.recordingAnalyser = analyser;
  state.recordingMeterData = new Uint8Array(analyser.fftSize);
  const draw = () => {
    if (!state.recordingAnalyser || state.recordingPad !== pad) return;
    state.recordingAnalyser.getByteTimeDomainData(state.recordingMeterData);
    drawRecordingWaveform(pad, state.recordingMeterData);
    state.recordingWaveformFrame = requestAnimationFrame(draw);
  };
  draw();
}

function stopRecordingWaveform() {
  if (state.recordingWaveformFrame) {
    cancelAnimationFrame(state.recordingWaveformFrame);
  }
  try {
    state.recordingSource?.disconnect();
  } catch {}
  state.recordingWaveformFrame = null;
  state.recordingSource = null;
  state.recordingAnalyser = null;
  state.recordingMeterData = null;
}

function drawRecordingWaveform(pad, data) {
  const canvas = state.audioPad === pad && els.audioDialog?.open
    ? els.audioWaveformCanvas
    : pad.waveformCanvas;
  const host = state.audioPad === pad && els.audioDialog?.open
    ? els.audioWaveform
    : pad.waveformEl;
  if (!canvas || !host || !data?.length) return;
  const rect = host.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.floor((rect.width || 1) * dpr));
  const height = Math.max(1, Math.floor((rect.height || 1) * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(255, 95, 86, 0.95)";
  ctx.lineWidth = Math.max(1, dpr * 1.4);
  ctx.beginPath();
  for (let index = 0; index < data.length; index += 1) {
    const x = (index / Math.max(1, data.length - 1)) * width;
    const y = (data[index] / 255) * height;
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function resetRecordingState() {
  stopRecordingWaveform();
  state.recordingStream?.getTracks().forEach((track) => track.stop());
  state.recordingPad?.recordButton.classList.remove("is-recording");
  state.recorder = null;
  state.recordingPad = null;
  state.recordingChunks = [];
  state.recordingStream = null;
  state.recordingStartedAt = 0;
  updateRecordingUi();
}

async function restorePad(pad) {
  const perf = startPerfMeasure("restorePad");
  const summary = {
    padIndex: pad.index,
    padNumber: pad.index + 1,
    title: pad.title,
    detectedType: "empty",
    mediaSizeBytes: 0,
    duration: 0,
    audioLink: "none",
    totalMs: 0,
  };
  const log = (step, extra = {}) => {
    perf.log(step, { ...restorePadBaseInfo(pad, summary), ...extra });
  };
  const finish = (step = "complete") => {
    summary.title = pad.title;
    summary.duration = pad.duration || pad.videoDuration || summary.duration || 0;
    summary.totalMs = perfElapsedMs(perf.start);
    log(step, { totalPadMs: summary.totalMs });
    return { ...summary };
  };

  const meta = await dbGet(padMetaKey(pad));
  summary.mediaSizeBytes = restorePadMediaSize(meta);
  log("indexedDB meta read", { hasMeta: Boolean(meta) });
  if (meta) {
    pad.uid = meta.uid || pad.uid;
    setPadTitle(pad, meta.title || pad.title);
    pad.volume = meta.volume ?? pad.volume;
    pad.panValue = meta.panValue ?? pad.panValue;
    setPadLoop(pad, Boolean(meta.loop));
    setPadDuckMode(pad, meta.duckMode ?? (meta.duckTrigger ? "global" : "none"), meta.duckPercent ?? duckPercentValue());
    setPadTags(pad, meta.tags || "");
    setPadColor(pad, meta.color || "");
    setPadFade(pad, meta.fadeSeconds ?? "");
    setPadLiveFade(pad, Boolean(meta.fadeInEnabled), Boolean(meta.fadeOutEnabled));
    setPadAudioSettings(pad, meta);
    setPadNormalization(pad, meta.normalizeEnabled ?? true, meta.normalizedGain ?? 1);
    log("normalization audio applied", { source: "meta" });
    setPadVisualImage(pad, meta.visualImage || "", Boolean(meta.visualImageHidden), meta);
    log("image restored", { source: "meta", hasImage: Boolean(meta.visualImage) });
    setPadCrossfade(pad, {
      startStopMode: meta.startStopMode,
      startStopTag: meta.startStopTag,
      endStartMode: meta.endStartMode,
      endStartTarget: meta.endStartTarget,
    });
    const metaTrimStartedAt = performance.now();
    setPadTrim(pad, meta.trimStart ?? 0, meta.trimEnd ?? 0);
    pad.regions = Array.isArray(meta.regions) ? meta.regions : [];
    pad.envelope = Array.isArray(meta.envelope) ? meta.envelope : [];
    log("renderWaveform", { source: "setPadTrim/meta", measuredMs: perfElapsedMs(metaTrimStartedAt) });
    setPadTextSettings(pad, {
      textContent: meta.textContent,
      textMode: meta.textMode,
      textName: meta.textName,
      textLang: meta.textLang,
      textGender: meta.textGender,
      textVoiceURI: meta.textVoiceURI,
      textRate: meta.textRate,
    });
    setPadNote(pad, meta.noteText, meta.noteShowOnStart, meta.noteShowOnEnd);
    setPadMode(pad, meta.playMode || pad.playMode);
    pad.audioRefIndex = Number.isInteger(Number(meta.audioRefIndex)) ? Number(meta.audioRefIndex) : null;
    pad.volumeEl.value = pad.volume;
    updatePadVolumeValue(pad);
    pad.panEl.value = pad.panValue;
    updatePadPanValue(pad);
    log("pad settings applied", { source: "meta" });
  }

  const rawSaved = await dbGet(padAudioKey(pad));
  pad.audioStored = Boolean(rawSaved?.audio);
  pad.audioPending = false;
  summary.mediaSizeBytes = restorePadMediaSize(meta, rawSaved);
  log("indexedDB audio read", {
    hasAudioRecord: Boolean(rawSaved),
    hasDirectAudio: Boolean(rawSaved?.audio),
    hasVideo: Boolean(rawSaved?.video),
    audioRefIndex: rawSaved?.audioRefIndex ?? meta?.audioRefIndex ?? null,
  });
  if (rawSaved?.video) {
    summary.detectedType = "video";
    summary.audioLink = "video";
    summary.mediaSizeBytes = restorePadMediaSize(rawSaved, meta);
    log("video restore start");
    pad.audioUid = ensureAudioRecordUid(rawSaved, pad.uid);
    pad.videoName = rawSaved.videoName || rawSaved.name || meta?.videoName || "";
    pad.videoPath = meta?.videoPath || rawSaved.videoPath || rawSaved.path || pad.videoName;
    pad.videoType = rawSaved.videoType || rawSaved.type || "video/mp4";
    pad.videoDuration = Number(rawSaved.videoDuration || meta?.videoDuration) || 0;
    summary.duration = pad.videoDuration;
    pad.buffer = null;
    pad.hasDirectAudio = false;
    pad.audioName = "";
    pad.audioPath = "";
    pad.audioType = "";
    setPadTitle(pad, meta?.title || rawSaved.title || cleanName(pad.videoName || `Pad ${pad.index + 1}`));
    // Filet de sécurité : le blob vidéo est bien présent mais tous les libellés
    // sont vides (record historiquement corrompu). On garantit une identité vidéo
    // non vide pour que padType() classe le pad en vidéo, et non en audio vide.
    if (!pad.videoName && !pad.videoPath) {
      pad.videoName = pad.title || `Vidéo ${pad.index + 1}`;
      pad.videoPath = pad.videoName;
    }
    setPadDuration(pad, pad.videoDuration);
    log("updatePadTime", { duration: pad.videoDuration });
    pad.node.classList.remove("is-empty", "is-missing-audio");
    if (!meta?.uid && !rawSaved.uid) {
      await safeSaveRestoredPadMeta(pad, meta);
      log("savePadMeta", { reason: "missing uid" });
    }
    if (document.body.dataset.skin === "basic") revealGalleryPads(false);
    updatePadType(pad);
    log("updatePadType");
    return finish("video restore complete");
  }
  if (!rawSaved?.video && (meta?.videoName || meta?.videoPath || rawSaved?.videoName || rawSaved?.videoPath)) {
    summary.detectedType = "video";
    summary.audioLink = "video-missing";
    pad.audioUid = ensureAudioRecordUid(rawSaved || meta, pad.uid);
    pad.videoName = meta?.videoName || rawSaved?.videoName || "";
    pad.videoPath = meta?.videoPath || rawSaved?.videoPath || pad.videoName;
    pad.videoType = meta?.videoType || rawSaved?.videoType || "video/mp4";
    pad.videoDuration = Number(meta?.videoDuration || rawSaved?.videoDuration) || 0;
    summary.duration = pad.videoDuration;
    pad.buffer = null;
    pad.hasDirectAudio = false;
    pad.audioName = "";
    pad.audioPath = "";
    pad.audioType = "";
    setPadTitle(pad, meta?.title || rawSaved?.title || cleanName(pad.videoName || `Pad ${pad.index + 1}`));
    setPadDuration(pad, pad.videoDuration);
    pad.node.classList.remove("is-empty");
    pad.node.classList.add("is-missing-audio");
    updatePadType(pad);
    log("updatePadType");
    return finish("video metadata restore complete");
  }

  const saved = await resolvePadAudioRecord(pad, meta, rawSaved);
  pad.audioStored = Boolean(saved?.audio || rawSaved?.audio);
  summary.mediaSizeBytes = restorePadMediaSize(meta, rawSaved, saved);
  summary.audioLink = saved?.audio
    ? (rawSaved?.audio ? "direct" : "referenced")
    : "none";
  log("audio linked/ref resolved", {
    hasResolvedAudio: Boolean(saved?.audio),
    hasDirectAudio: Boolean(rawSaved?.audio),
    audioRefIndex: saved?.audioRefIndex ?? rawSaved?.audioRefIndex ?? meta?.audioRefIndex ?? null,
  });
  if (!saved?.audio) {
    pad.buffer = null;
    pad.hasDirectAudio = false;
    const missingAudio = Boolean(
      meta?.audioPath
      || meta?.audioName
      || rawSaved?.name
      || rawSaved?.path
      || rawSaved?.audioRefIndex != null
      || meta?.audioRefIndex != null
    );
    pad.audioName = rawSaved?.name || fileBaseName(meta?.audioPath || rawSaved?.path || pad.audioName);
    pad.hasDirectAudio = false;
    pad.audioPath = meta?.audioPath || rawSaved?.path || rawSaved?.name || pad.audioPath;
    pad.audioType = rawSaved?.type || pad.audioType || "";
    pad.node.classList.toggle("is-missing-audio", missingAudio);
    if (pad.textMode || pad.textContent) {
      summary.detectedType = "text";
      pad.node.classList.remove("is-empty", "is-missing-audio");
      setPadDuration(pad, pad.textDuration || estimateSpeechDuration(pad.textContent, pad.textRate));
      summary.duration = pad.duration;
      log("updatePadTime", { duration: pad.duration, source: "text" });
    }
    if (missingAudio) setStatus(`Son manquant: ${pad.title}`, "stop");
    if (!missingAudio && !pad.textMode && !pad.textContent) {
      summary.detectedType = meta?.visualImage || rawSaved?.visualImage ? "image" : "empty";
      pad.node.classList.add("is-empty");
      setPadDuration(pad, 0);
      log("updatePadTime", { duration: 0, source: "empty" });
      renderWaveform(pad);
      log("renderWaveform", { source: "empty" });
    }
    if (!meta?.uid) {
      await safeSaveRestoredPadMeta(pad, meta);
      log("savePadMeta", { reason: "missing uid" });
    }
    if (document.body.dataset.skin === "basic") revealGalleryPads(false);
    updatePadType(pad);
    log("updatePadType");
    return finish("empty/text restore complete");
  }

  if (shouldPreloadAudioOnRestore()) {
    log("audio decode start", { audioBytes: approximateMediaSize(saved.audio) });
    pad.buffer = await ensurePadAudioDecoded(pad, saved, rawSaved, meta);
    summary.duration = pad.buffer.duration;
    log("audio decoded", {
      duration: pad.buffer.duration,
      sampleRate: pad.buffer.sampleRate,
      channels: pad.buffer.numberOfChannels,
    });
  } else {
    pad.buffer = null;
  }
  summary.detectedType = "audio";
  pad.hasDirectAudio = Boolean(rawSaved?.audio);
  pad.uid = meta?.uid || saved.uid || pad.uid;
  pad.audioUid = ensureAudioRecordUid(saved, pad.uid);
  pad.audioName = saved.name || "";
  pad.audioPath = meta?.audioPath || saved.path || saved.name || "";
  pad.audioType = saved.type || "";
  pad.audioPathTrusted = Boolean(meta?.audioPathTrusted || saved.pathTrusted);
  pad.audioDuration = Number(meta?.audioDuration ?? saved.audioDuration) || 0;
  pad.audioSampleRate = Number(meta?.audioSampleRate ?? saved.audioSampleRate) || 0;
  pad.audioChannels = Number(meta?.audioChannels ?? saved.audioChannels) || 0;
  pad.audioByteLength = Number(meta?.audioByteLength ?? saved.audioByteLength) || 0;
  log("waveform calculated", { peakCount: pad.waveformPeaks.length });
  setPadTitle(pad, meta?.title || saved.title || cleanName(saved.name || `Pad ${pad.index + 1}`));
  pad.volume = saved.volume ?? pad.volume;
  pad.panValue = saved.panValue ?? pad.panValue;
  setPadLoop(pad, Boolean(saved.loop));
  setPadDuckMode(pad, meta?.duckMode ?? saved.duckMode ?? ((meta?.duckTrigger ?? saved.duckTrigger) ? "global" : "none"), meta?.duckPercent ?? saved.duckPercent ?? duckPercentValue());
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
    eqMode: meta?.eqMode ?? saved.eqMode ?? "global",
    eqLow: meta?.eqLow ?? saved.eqLow,
    eqMid: meta?.eqMid ?? saved.eqMid,
    eqHigh: meta?.eqHigh ?? saved.eqHigh,
    mono: meta?.mono ?? saved.mono,
    reverse: meta?.reverse ?? saved.reverse,
  });
  setPadNormalization(pad, meta?.normalizeEnabled ?? saved.normalizeEnabled ?? true, meta?.normalizedGain ?? saved.normalizedGain ?? 1);
  log("normalization audio applied", { source: "audio" });
  setPadVisualImage(pad, meta?.visualImage ?? saved.visualImage ?? "", Boolean(meta?.visualImageHidden ?? saved.visualImageHidden), {
    visualPositionX: meta?.visualPositionX ?? saved.visualPositionX,
    visualPositionY: meta?.visualPositionY ?? saved.visualPositionY,
    visualZoom: meta?.visualZoom ?? saved.visualZoom,
    visualKind: meta?.visualKind ?? saved.visualKind,
  });
  log("image restored", { source: "audio", hasImage: Boolean(meta?.visualImage ?? saved.visualImage) });
  setPadCrossfade(pad, {
    startStopMode: meta?.startStopMode ?? saved.startStopMode,
    startStopTag: meta?.startStopTag ?? saved.startStopTag,
    endStartMode: meta?.endStartMode ?? saved.endStartMode,
    endStartTarget: meta?.endStartTarget ?? saved.endStartTarget,
  });
  const audioTrimStartedAt = performance.now();
  setPadTrim(pad, meta?.trimStart ?? saved.trimStart ?? 0, meta?.trimEnd ?? saved.trimEnd ?? 0);
  log("renderWaveform", { source: "setPadTrim/audio", measuredMs: perfElapsedMs(audioTrimStartedAt) });
  setPadTextSettings(pad, {
    textContent: meta?.textContent ?? saved.textContent,
    textMode: meta?.textMode ?? saved.textMode,
    textName: meta?.textName ?? saved.textName,
    textLang: meta?.textLang ?? saved.textLang,
    textGender: meta?.textGender ?? saved.textGender,
    textVoiceURI: meta?.textVoiceURI ?? saved.textVoiceURI,
    textRate: meta?.textRate ?? saved.textRate,
  });
  setPadNote(pad, meta?.noteText ?? saved.noteText, meta?.noteShowOnStart ?? saved.noteShowOnStart, meta?.noteShowOnEnd ?? saved.noteShowOnEnd);
  setPadMode(pad, saved.playMode || pad.playMode);
  const restoredRef = Number(meta?.audioRefIndex ?? saved.audioRefIndex);
  pad.audioRefIndex = rawSaved?.audio
    ? null
    : Number.isInteger(restoredRef)
      ? restoredRef
      : null;
  log("pad settings applied", { source: "audio" });
  if (pad.buffer) {
    applyEffectiveBufferState(pad); // durée + waveform = buffer effectif (régions)
    log("updatePadTime", { duration: pad.duration });
    renderWaveform(pad);
    log("renderWaveform", { peakCount: pad.waveformPeaks.length });
  } else {
    setPadDuration(pad, pad.audioDuration || 0);
    log("updatePadTime", { duration: pad.audioDuration || 0, source: "metadata-only" });
    renderWaveform(pad);
    log("renderWaveform", { source: "metadata-only" });
  }
  pad.volumeEl.value = pad.volume;
  updatePadVolumeValue(pad);
  pad.panEl.value = pad.panValue;
  updatePadPanValue(pad);
  pad.node.classList.remove("is-empty");
  pad.node.classList.remove("is-missing-audio");
  if (!meta?.uid && !saved.uid) {
    await safeSaveRestoredPadMeta(pad, meta);
    log("savePadMeta", { reason: "missing uid" });
  }
  if (document.body.dataset.skin === "basic") revealGalleryPads(false);
  updatePadType(pad);
  log("updatePadType");
  return finish("audio restore complete");
}

async function resolvePadAudioRecord(pad, meta, saved) {
  if (saved?.audio) return saved;
  // Résolution par audioUid désactivée :
  // un pad vide ne doit jamais récupérer automatiquement l'audio d'un autre pad.
  const refIndex = Number(saved?.audioRefIndex);
  if (!Number.isInteger(refIndex) || refIndex < 0 || refIndex === pad.index) return saved;
  const referenced = await dbGet(padAudioKeyFor(state.currentBoardId, refIndex));
  if (!referenced?.audio) return saved;
  return {
    ...referenced,
    ...(saved || {}),
    audioUid: ensureAudioRecordUid(saved || referenced, audioRecordUid(referenced)),
    audio: referenced.audio,
    name: saved?.name || referenced.name,
    path: saved?.path || referenced.path,
    type: saved?.type || referenced.type,
    audioRefIndex: refIndex,
  };
}

function waitForMediaMetadata(media) {
  if (Number.isFinite(media?.duration) && media.duration > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const done = () => resolve();
    media.addEventListener("loadedmetadata", done, { once: true });
    media.addEventListener("durationchange", done, { once: true });
    window.setTimeout(done, 500);
  });
}

function cueTrimSegment(pad, media) {
  const duration = Number.isFinite(media?.duration) && media.duration > 0
    ? media.duration
    : pad.duration || 0;
  const start = duration
    ? Math.min(Math.max(0, pad.trimStart || 0), Math.max(0, duration - 0.01))
    : 0;
  const rawEnd = pad.trimEnd ? pad.trimEnd : duration;
  const end = duration
    ? Math.min(Math.max(rawEnd, start + 0.01), duration)
    : 0;
  return {
    start,
    end,
    duration: Math.max(0.01, end - start),
  };
}

function clearCuePreviewTrimControls() {
  if (state.cuePreviewTrimTimer) {
    window.clearTimeout(state.cuePreviewTrimTimer);
    state.cuePreviewTrimTimer = null;
  }
  if (state.cuePreviewAudio && state.cuePreviewTrimHandler) {
    state.cuePreviewAudio.removeEventListener("timeupdate", state.cuePreviewTrimHandler);
  }
  if (state.cuePreviewAudio && state.cuePreviewEndedHandler) {
    state.cuePreviewAudio.removeEventListener("ended", state.cuePreviewEndedHandler);
  }
  state.cuePreviewTrimHandler = null;
  state.cuePreviewEndedHandler = null;
}

function stopCuePreview() {
  clearCuePreviewTrimControls();
  if (state.cuePreviewUtterance) {
    window.speechSynthesis?.cancel?.();
    state.cuePreviewUtterance = null;
  }
  if (state.cuePreviewAudio) {
    state.cuePreviewAudio.pause();
    state.cuePreviewAudio.removeAttribute("src");
    state.cuePreviewAudio.srcObject = null;
    state.cuePreviewAudio.remove?.();
    state.cuePreviewAudio = null;
  }
  if (state.cuePreviewPad) {
    state.cuePreviewPad.node?.classList.remove("is-cue-previewing");
    state.cuePreviewPad.cueButton?.classList.remove("is-active");
    state.cuePreviewPad.cueButton?.setAttribute("aria-pressed", "false");
    state.cuePreviewPad = null;
  }
  if (state.cuePreviewUrl) {
    URL.revokeObjectURL(state.cuePreviewUrl);
    state.cuePreviewUrl = "";
  }
  state.cuePreviewMeterSource?.disconnect?.();
  state.cuePreviewMeterSource = null;
  state.cuePreviewAnalyser = null;
  state.cuePreviewMeterData = null;
  setMeterLevel(els.cueVu, 0);
  state.audioDialogStartedCue = null;
}

async function ensureSpeechVoices() {
  if (!("speechSynthesis" in window)) return [];
  const current = window.speechSynthesis.getVoices?.() || [];
  if (current.length) return current;
  return new Promise((resolve) => {
    const done = () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", done);
      resolve(window.speechSynthesis.getVoices?.() || []);
    };
    window.speechSynthesis.addEventListener?.("voiceschanged", done, { once: true });
    window.setTimeout(done, 350);
  });
}

async function previewTextCue(pad) {
  if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
    setStatus("Cue texte indisponible dans ce navigateur", "stop");
    return;
  }
  await ensureSpeechVoices();
  const liveSettings = state.audioPad === pad && els.audioDialog?.open
    ? {
        textContent: els.audioTextInlineEditor?.value ?? pad.textContent,
        textLang: els.audioTextLang?.value || pad.textLang || "fr-FR",
        textGender: audioTextGenderValue(pad.textGender || "female"),
        textVoiceURI: els.audioTextVoice?.value ?? pad.textVoiceURI ?? "",
        textRate: els.audioTextRate?.value || pad.textRate || DEFAULT_TEXT_RATE,
      }
    : pad;
  const text = String(liveSettings?.textContent || "").trim();
  if (!text) {
    setStatus(`Texte vide: ${pad?.title || "pad"}`);
    return;
  }
  stopCuePreview();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = liveSettings.textLang || "fr-FR";
  utterance.rate = normalizedTextRate(liveSettings.textRate);
  utterance.pitch = speechPitchForPad(liveSettings);
  utterance.volume = Math.min(1, Math.max(0, cueVolumeValue()));
  const voice = speechVoiceForPad(liveSettings);
  if (voice) utterance.voice = voice;
  utterance.onend = () => {
    if (state.cuePreviewUtterance === utterance) stopCuePreview();
  };
  utterance.onerror = () => {
    if (state.cuePreviewUtterance === utterance) stopCuePreview();
    setStatus("Cue texte impossible", "stop");
  };
  state.cuePreviewUtterance = utterance;
  state.cuePreviewPad = pad;
  pad.node?.classList.add("is-cue-previewing");
  pad.cueButton?.classList.add("is-active");
  pad.cueButton?.setAttribute("aria-pressed", "true");
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  startTimer();
  setStatus(`Cue texte: ${pad.title}`);
}

async function selectCueOutput() {
  if (!outputSelectionSupported()) {
    saveCueOutput("", "par défaut");
    setStatus("Sortie Cue séparée indisponible dans ce navigateur", "stop");
    return false;
  }
  const output = await navigator.mediaDevices.selectAudioOutput();
  saveCueOutput(output.deviceId, output.label || "sortie Cue");
  await refreshOutputSelectOptions();
  setStatus(`Sortie Cue: ${state.cueOutputLabel}`);
  return true;
}

async function selectMasterOutput() {
  if (!outputSelectionSupported()) {
    saveMasterOutput("", "par défaut");
    setStatus("Choix de sortie master indisponible dans ce navigateur", "stop");
    return false;
  }
  await ensureAudio();
  const output = await navigator.mediaDevices.selectAudioOutput();
  saveMasterOutput(output.deviceId, output.label || "sortie master");
  await refreshOutputSelectOptions();
  const routed = await applyStoredMasterOutput();
  setStatus(routed ? `Sortie master: ${state.masterOutputLabel}` : `Sortie master mémorisée: ${state.masterOutputLabel}`);
  return true;
}

async function handleMasterOutputChange() {
  const select = els.masterOutputSelect;
  if (!select) return;
  if (select.value === "__unavailable__") return;
  const label = select.selectedOptions?.[0]?.textContent || "par défaut";
  saveMasterOutput(select.value, label);
  if (select.value) await ensureAudio();
  const routed = await applyStoredMasterOutput();
  setStatus(routed ? `Sortie master: ${state.masterOutputLabel}` : `Sortie master: ${state.masterOutputLabel}`);
}

async function handleCueOutputChange() {
  const select = els.masterCueOutputSelect;
  if (!select) return;
  if (select.value === "__unavailable__") return;
  const label = select.selectedOptions?.[0]?.textContent || "par défaut";
  saveCueOutput(select.value, label);
  setStatus(`Sortie Cue: ${state.cueOutputLabel}`);
}

async function handleOutputSelectPointer(event, type) {
  const select = event.currentTarget;
  if (!outputSelectUsesNativePicker(select)) return;
  event.preventDefault();
  if (type === "master") {
    await selectMasterOutput();
  } else {
    await selectCueOutput();
  }
}

async function handleOutputSelectKeydown(event, type) {
  if (!["Enter", " "].includes(event.key)) return;
  const select = event.currentTarget;
  if (!outputSelectUsesNativePicker(select)) return;
  event.preventDefault();
  if (type === "master") {
    await selectMasterOutput();
  } else {
    await selectCueOutput();
  }
}

function connectCuePreviewMeter(media) {
  if (!state.audioContext || !media?.captureStream) return false;
  try {
    const stream = media.captureStream();
    const source = state.audioContext.createMediaStreamSource(stream);
    const analyser = state.audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    state.cuePreviewMeterSource = source;
    state.cuePreviewAnalyser = analyser;
    state.cuePreviewMeterData = new Uint8Array(analyser.fftSize);
    return true;
  } catch (error) {
    console.warn("VU Cue indisponible", error);
    state.cuePreviewMeterSource = null;
    state.cuePreviewAnalyser = null;
    state.cuePreviewMeterData = null;
    return false;
  }
}

async function previewPadCue(pad, options = {}) {
  if ((state.cuePreviewAudio || state.cuePreviewUtterance) && state.cuePreviewPad === pad) {
    stopCuePreview();
    setStatus(`Cue arrêtée: ${pad.title}`);
    return;
  }
  if (padType(pad) === "text") {
    await previewTextCue(pad);
    return;
  }
  if (!pad?.buffer && !pad?.videoName) {
    setStatus(`Pré-écoute impossible: média manquant sur ${pad?.title || "pad"}`);
    return;
  }

  const meta = await dbGet(padMetaKey(pad));
  const rawSaved = await dbGet(padAudioKey(pad));
  const saved = await resolvePadAudioRecord(pad, meta, rawSaved);
  const hasVideoCue = Boolean(rawSaved?.video);
  const hasAudioCue = Boolean(saved?.audio);
  if (!hasAudioCue && !hasVideoCue) {
    pad.node.classList.add("is-missing-audio");
    setStatus(`Média manquant: ${pad.title}`);
    return;
  }

  try {
    stopCuePreview();
    const blob = hasVideoCue
      ? new Blob([rawSaved.video.slice(0)], { type: rawSaved.videoType || pad.videoType || "video/mp4" })
      : new Blob([saved.audio.slice(0)], { type: saved.type || "audio/mpeg" });
    const url = URL.createObjectURL(blob);
    const audio = hasVideoCue ? document.createElement("video") : new Audio();
    audio.src = url;
    audio.volume = cueVolumeValue();
    if (hasVideoCue) {
      audio.playsInline = true;
      audio.style.position = "fixed";
      audio.style.left = "-9999px";
      audio.style.width = "1px";
      audio.style.height = "1px";
      audio.style.opacity = "0";
      document.body.append(audio);
    }
    let cueOutputSelected = false;
    let outputDeviceId = state.cueOutputDeviceId || "";
    const canSelectOutput = outputSelectionSupported();
    if (!outputDeviceId && canSelectOutput && options.selectOutput !== false) {
      const output = await navigator.mediaDevices.selectAudioOutput();
      outputDeviceId = output.deviceId;
      saveCueOutput(output.deviceId, output.label || "sortie Cue");
    }
    if (outputDeviceId && typeof audio.setSinkId === "function") {
      await audio.setSinkId(outputDeviceId);
      cueOutputSelected = true;
    }
    await waitForMediaMetadata(audio);
    const segment = cueTrimSegment(pad, audio);
    try {
      audio.currentTime = segment.start;
    } catch {}
    pad.resumeOffset = segment.start;
    updatePadProgress(pad);
    updatePadTime(pad);
    const restartCueSegment = () => {
      try {
        audio.currentTime = segment.start;
      } catch {}
      audio.play().catch(() => stopCuePreview());
    };
    state.cuePreviewTrimHandler = () => {
      if (!state.cuePreviewAudio || state.cuePreviewAudio !== audio) return;
      if (segment.end <= 0 || audio.currentTime < segment.end - 0.03) return;
      if (pad.loop) {
        restartCueSegment();
      } else {
        stopCuePreview();
      }
    };
    state.cuePreviewEndedHandler = () => {
      if (pad.loop) {
        restartCueSegment();
      } else {
        stopCuePreview();
      }
    };
    audio.addEventListener("timeupdate", state.cuePreviewTrimHandler);
    audio.addEventListener("ended", state.cuePreviewEndedHandler);
    state.cuePreviewAudio = audio;
    state.cuePreviewPad = pad;
    state.cuePreviewUrl = url;
    if (options.fromAudioDialog) state.audioDialogStartedCue = pad;
    pad.node?.classList.add("is-cue-previewing");
    pad.cueButton?.classList.add("is-active");
    pad.cueButton?.setAttribute("aria-pressed", "true");
    prepareAudio();
    connectCuePreviewMeter(audio);
    await audio.play();
    if (!pad.loop && segment.duration > 0) {
      state.cuePreviewTrimTimer = window.setTimeout(() => {
        if (state.cuePreviewAudio === audio) stopCuePreview();
      }, Math.max(20, segment.duration * 1000 + 80));
    }
    startTimer();
    setStatus(cueOutputSelected ? `Cue: ${pad.title}` : `Cue sortie par défaut: ${pad.title}`);
  } catch (error) {
    stopCuePreview();
    setStatus(error?.name === "NotAllowedError" ? "Pré-écoute annulée" : "Pré-écoute impossible");
  }
}

// Le test du dialogue « Réglages du pad » produit-il du son en ce moment ?
function audioTestIsPlaying() {
  const pad = state.audioPad;
  if (pad && state.audioDialogStartedPad === pad && isPadPlaying(pad)) return true;
  if (state.audioDialogStartedCue
    && ((state.cuePreviewAudio && !state.cuePreviewAudio.paused) || state.cuePreviewUtterance)) return true;
  return false;
}

// Icône du bouton test : triangle à l'arrêt/pause, [ïï] pendant la lecture.
function syncAudioTestPlayButton() {
  els.audioTestPlay?.classList.toggle("is-playing", audioTestIsPlaying());
}

function stopAudioDialogStartedPlayback() {
  if (state.audioDialogStartedCue && state.cuePreviewPad === state.audioDialogStartedCue) {
    stopCuePreview();
  }
  if (state.audioDialogStartedPad) {
    stopPad(state.audioDialogStartedPad, false);
  }
  state.audioDialogStartedPad = null;
  state.audioDialogStartedCue = null;
  syncAudioTestPlayButton();
}

async function playAudioDialogTest() {
  const pad = state.audioPad;
  if (!pad) return;
  // Reprise : si ce pad a été mis en pause via le bouton test, ne pas réinitialiser sa
  // position (playbackOffset renverra resumeOffset). Sinon, repartir proprement.
  const resuming = !state.cueOutputDeviceId && state.audioDialogStartedPad === pad && pad.isPaused;
  if (!resuming) stopAudioDialogStartedPlayback();
  if (state.cueOutputDeviceId) {
    await previewPadCue(pad, { useSavedOutput: true, selectOutput: false, fromAudioDialog: true });
    syncAudioTestPlayButton();
    return;
  }
  state.audioDialogStartedPad = pad;
  await playPad(pad, false, playbackOffset(pad));
  syncAudioTestPlayButton();
}

// Bascule lecture/pause du bouton test, à l'image de l'éditeur audio.
function toggleAudioDialogTest() {
  const pad = state.audioPad;
  if (!pad) return;
  if (audioTestIsPlaying()) {
    if (state.audioDialogStartedPad === pad && !state.audioDialogStartedCue && isPadPlaying(pad)) {
      stopPad(pad, false, true, { triggerEnd: false }); // pause (conserve la position)
      syncAudioTestPlayButton();
    } else {
      stopAudioDialogStartedPlayback(); // cue : arrêt (pas de reprise en pré-écoute)
    }
    return;
  }
  playAudioDialogTest().catch(() => setStatus("Test audio impossible"));
}

async function savePadMeta(pad, options = {}) {
  if (!pad.uid) pad.uid = createId();
  const previousMeta = await dbGet(padMetaKey(pad));
  const previousSaved = await dbGet(padAudioKey(pad));
  const preservedVideoName = pad.videoName || previousMeta?.videoName || previousSaved?.videoName || "";
  const preservedVideoPath = pad.videoPath || previousMeta?.videoPath || previousSaved?.videoPath || "";
  const preservedVideoType = pad.videoType || previousMeta?.videoType || previousSaved?.videoType || "";
  const preservedVideoDuration = pad.videoDuration || previousMeta?.videoDuration || previousSaved?.videoDuration || 0;
  // Un pad vidéo ne doit pas perdre sa référence vidéo persistée quand ses champs
  // en mémoire sont momentanément vides (blob évincé/rompu) : sinon, au rechargement,
  // plus rien n'indique que c'était une vidéo et l'indicateur « média manquant » ne
  // s'affiche jamais. On préserve donc la réf. vidéo — SAUF si le pad porte désormais
  // un autre média (audio/texte) ou qu'on le vide explicitement (forgetVideo).
  const padHasOtherMedia = Boolean(
    pad.hasDirectAudio || pad.buffer || pad.audioName || pad.audioPath
    || pad.audioRefIndex != null || pad.textMode || pad.textContent,
  );
  const keepVideoRef = !options.forgetVideo && !padHasOtherMedia;
  const meta = {
    uid: pad.uid || createId(),
    title: pad.title,
    volume: pad.volume,
    panValue: pad.panValue,
    loop: pad.loop,
    duckTrigger: pad.duckTrigger,
    duckMode: pad.duckMode,
    duckPercent: pad.duckPercent,
    reverse: pad.reverse,
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
    eqMode: pad.eqMode,
    eqLow: pad.eqLow,
    eqMid: pad.eqMid,
    eqHigh: pad.eqHigh,
    mono: pad.mono,
    normalizeEnabled: pad.normalizeEnabled,
    normalizedGain: pad.normalizedGain,
    visualImage: pad.visualImage,
    visualImageHidden: pad.visualImageHidden,
    visualKind: pad.visualKind,
    audioName: pad.audioName,
    audioUid: pad.audioUid,
    audioPath: pad.audioPath,
    audioPathTrusted: pad.audioPathTrusted,
    audioDuration: pad.audioDuration,
    audioSampleRate: pad.audioSampleRate,
    audioChannels: pad.audioChannels,
    audioByteLength: pad.audioByteLength,
    waveformPeaks: pad.waveformPeaks,
    videoName: keepVideoRef ? preservedVideoName : pad.videoName,
    videoPath: keepVideoRef ? preservedVideoPath : pad.videoPath,
    videoType: keepVideoRef ? preservedVideoType : pad.videoType,
    videoDuration: keepVideoRef ? preservedVideoDuration : pad.videoDuration,
    textContent: pad.textContent,
    textMode: pad.textMode,
    textName: pad.textName,
    textLang: pad.textLang,
    textGender: pad.textGender,
    textVoiceURI: pad.textVoiceURI,
    textRate: pad.textRate,
    noteText: pad.noteText,
    noteShowOnStart: pad.noteShowOnStart,
    noteShowOnEnd: pad.noteShowOnEnd,
    visualPositionX: pad.visualPositionX,
    visualPositionY: pad.visualPositionY,
    visualZoom: pad.visualZoom,
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
    trimStart: pad.trimStart,
    trimEnd: pad.trimEnd,
    regions: pad.regions || [],
    envelope: pad.envelope || [],
    playMode: pad.playMode,
    audioRefIndex: Number.isInteger(Number(pad.audioRefIndex)) ? Number(pad.audioRefIndex) : null,
  };
  await dbSet(padMetaKey(pad), meta);
  const saved = await dbGet(padAudioKey(pad));
  if (saved) {
    const audioUid = ensureAudioRecordUid(saved, pad.audioUid || pad.uid);
    pad.audioUid = audioUid;
    await dbSet(padAudioKey(pad), {
      ...saved,
      ...meta,
      audioUid,
    });
  }
}

async function safeSaveRestoredPadMeta(pad, meta) {
  if (!meta) return savePadMeta(pad);

  if (!pad.uid) pad.uid = meta.uid || createId();
  pad.audioUid = pad.audioUid || ensureAudioRecordUid(meta, pad.uid);

  if ((!pad.title || isDefaultPadTitle(pad.title)) && meta.title && !isDefaultPadTitle(meta.title)) {
    pad.title = meta.title;
  }
  if ((pad.tags == null || pad.tags === "") && meta.tags != null) pad.tags = meta.tags;
  if ((pad.color == null || pad.color === "") && meta.color != null) pad.color = meta.color;
  if ((pad.noteText == null || pad.noteText === "") && meta.noteText != null) pad.noteText = meta.noteText;
  if (pad.noteShowOnStart == null && meta.noteShowOnStart != null) pad.noteShowOnStart = meta.noteShowOnStart;
  if (pad.noteShowOnEnd == null && meta.noteShowOnEnd != null) pad.noteShowOnEnd = meta.noteShowOnEnd;
  if ((pad.visualImage == null || pad.visualImage === "") && meta.visualImage != null) pad.visualImage = meta.visualImage;
  if (pad.visualImageHidden == null && meta.visualImageHidden != null) pad.visualImageHidden = meta.visualImageHidden;
  if (pad.visualKind == null && meta.visualKind != null) pad.visualKind = meta.visualKind;
  if (pad.visualPositionX == null && meta.visualPositionX != null) pad.visualPositionX = meta.visualPositionX;
  if (pad.visualPositionY == null && meta.visualPositionY != null) pad.visualPositionY = meta.visualPositionY;
  if (pad.visualZoom == null && meta.visualZoom != null) pad.visualZoom = meta.visualZoom;

  return savePadMeta(pad);
}

function setStatus(text, type = "", options = {}) {
  const normalizedType = type || "neutral";
  els.status.textContent = text;
  // Types de message : succès / progression / stop uniquement (les anciens « warning »
  // et « danger » ont été convertis en « stop », cf. mission #8).
  els.status.classList.toggle("is-success", normalizedType === "success");
  els.status.classList.toggle("is-progress", normalizedType === "progress");
  els.status.classList.toggle("is-stop", normalizedType === "stop");

  // Le type ne fait que colorer la barre de statut. L'alerte modale est opt-in
  // (options.alert) et réservée aux rares cas bloquants — pas déclenchée
  // automatiquement par le type, sinon chaque message warning/danger popperait.
  if (options.alert && !state.stageMode) {
    window.alert(text);
  }
}

function stageLockSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STAGE_LOCK_STORAGE) || "{}");
    return {
      enabled: Boolean(saved.enabled && saved.password),
      password: String(saved.password || ""),
    };
  } catch {
    return { enabled: false, password: "" };
  }
}

function updateStageLockUi() {
  const lock = stageLockSettings();
  els.stageLock?.classList.toggle("is-active", lock.enabled);
  els.stageLock?.setAttribute("aria-pressed", String(lock.enabled));
  els.stageLock?.setAttribute("aria-label", lock.enabled ? "Déverrouiller le mode scène" : "Verrouiller le mode scène");
  els.stageLock?.setAttribute("title", lock.enabled ? "Déverrouiller le mode scène" : "Verrouiller le mode scène");
}

function toggleStageLock() {
  const lock = stageLockSettings();
  if (!lock.enabled) {
    const password = window.prompt("Choisissez un mot de passe pour verrouiller le mode scène");
    if (!password) return;
    const confirmPassword = window.prompt("Confirmez le mot de passe");
    if (confirmPassword === null) return;
    if (confirmPassword !== password) {
      setStatus("Les mots de passe ne correspondent pas", "stop", { alert: true });
      return;
    }
    localStorage.setItem(STAGE_LOCK_STORAGE, JSON.stringify({ enabled: true, password }));
    updateStageLockUi();
    setStatus("Mode scène verrouillé");
    return;
  }

  const password = window.prompt("Mot de passe pour déverrouiller le mode scène");
  if (password !== lock.password) {
    setStatus("Mot de passe incorrect");
    return;
  }
  localStorage.setItem(STAGE_LOCK_STORAGE, JSON.stringify({ enabled: false, password: "" }));
  updateStageLockUi();
  setStatus("Mode scène déverrouillé");
}

async function prepareBoardForStage(options = {}) {
  const allPads = orderedPadsForCurrentBoard();

  const hasAnyMedia = allPads.some((pad) => (
    pad.audioStored || pad.buffer || pad.videoName || pad.videoPath
    || pad.textMode || String(pad.textContent || "").trim()
  ));
  if (!hasAnyMedia) {
    setStatus("Mode scène impossible : aucun média sur ce board", "stop");
    return { ok: false, failures: [], emptyPads: [], noMedia: true };
  }

  const emptyPads = allPads.filter((pad) => pad.node?.classList.contains("is-empty"));
  const audioCandidates = allPads.filter((pad) => padType(pad) === "audio" && pad.audioStored && !pad.buffer);

  // Sur mobile : pas de préchargement, les sons se chargent au premier déclenchement.
  if (options.skipDecode) {
    const n = audioCandidates.length;
    setStatus(`Board prêt pour la scène : ${n} son${n > 1 ? "s" : ""} chargé${n > 1 ? "s" : ""} au premier déclenchement`, "success");
    return { ok: true, failures: [], emptyPads, validPads: [], skipPreload: true };
  }

  // Phase 1 — scan rapide (lecture DB, pas de décodage)
  if (audioCandidates.length) {
    setStatus(`Vérification des fichiers (${audioCandidates.length})…`, "progress");
  }
  const missingPads = [];
  const validPads = [];
  for (const pad of audioCandidates) {
    const rawSaved = await dbGet(padAudioKey(pad));
    const resolved = await resolvePadAudioRecord(pad, null, rawSaved);
    if (!resolved?.audio && !rawSaved?.audio) {
      pad.node?.classList.add("is-missing-audio");
      missingPads.push(pad);
    } else {
      validPads.push(pad);
    }
  }

  return { ok: missingPads.length === 0, failures: missingPads, emptyPads, validPads };
}

async function preloadStagePads(pads) {
  const total = pads.length;
  if (!total) {
    setStatus("Board prêt pour la scène : aucun média à précharger", "success");
    return;
  }
  for (let i = 0; i < total; i += 1) {
    const pad = pads[i];
    setStatus(`Préchargement : ${i + 1} / ${total} — ${pad.title}`, "progress");
    try {
      pad.buffer = await ensurePadAudioDecoded(pad);
      applyEffectiveBufferState(pad); // durée effective déjà posée par le décodage ; on garde la cohérence
      renderWaveform(pad);
    } catch (error) {
      console.error(error);
      pad.node?.classList.add("is-missing-audio");
    }
  }
  setStatus(`Board prêt pour la scène : ${total}/${total} média${total > 1 ? "s" : ""} préchargé${total > 1 ? "s" : ""}`, "success");
}

function syncHoverLabels(root = document) {
  root.querySelectorAll("button[aria-label], [role='button'][aria-label]").forEach((button) => {
    if (!button.getAttribute("title")) {
      button.setAttribute("title", button.getAttribute("aria-label"));
    }
  });
}

function syncStageVisiblePads() {
  let activeCount = 0;
  state.pads.forEach((pad) => {
    const active = cuePlayablePad(pad);
    // En scène, on masque TOUT pad non jouable : vide OU média manquant (le message
    // « pads défectueux ignorés » les annonce déjà, et le dialog de confirmation a
    // prévenu). Régression PR#15 : les pads vidéo à lien rompu (désormais reconnus
    // is-missing-audio) restaient visibles/grisés au lieu d'être masqués comme avant.
    pad.node?.classList.toggle("is-stage-hidden", state.stageMode && !active);
    if (state.stageMode && active) activeCount += 1;
  });
  return activeCount;
}

function confirmStageDespiteMissing({ missingPads = [], emptyPads = [] }) {
  return new Promise((resolve) => {
    const fillList = (section, intro, list, pads, label) => {
      section.hidden = pads.length === 0;
      if (!pads.length) return;
      const n = pads.length;
      intro.textContent = label(n);
      list.innerHTML = "";
      pads.forEach((pad) => {
        const li = document.createElement("li");
        li.textContent = pad.title || `Pad ${pad.index + 1}`;
        list.append(li);
      });
    };
    fillList(
      els.stageMissingSection, els.stageMissingFilesIntro, els.stageMissingFilesList,
      missingPads,
      (n) => `${n} pad${n > 1 ? "s ont" : " a"} un fichier introuvable :`
    );
    fillList(
      els.stageEmptySection, els.stageEmptyPadsIntro, els.stageEmptyPadsList,
      emptyPads,
      (n) => `${n} pad${n > 1 ? "s sont" : " est"} vide${n > 1 ? "s" : ""} et ${n > 1 ? "seront ignorés" : "sera ignoré"} :`
    );

    function finish(result) {
      els.cancelStageMissing.removeEventListener("click", onCancel);
      els.confirmStageMissing.removeEventListener("click", onConfirm);
      els.stageMissingFilesDialog.removeEventListener("close", onCancel);
      if (els.stageMissingFilesDialog.open) els.stageMissingFilesDialog.close();
      resolve(result);
    }
    const onCancel = () => finish(false);
    const onConfirm = () => finish(true);

    els.cancelStageMissing.addEventListener("click", onCancel);
    els.confirmStageMissing.addEventListener("click", onConfirm);
    els.stageMissingFilesDialog.addEventListener("close", onCancel, { once: true });
    els.stageMissingFilesDialog.showModal();
  });
}

async function setStageMode(enabled, requestFullscreen = false, options = {}) {
  const lock = stageLockSettings();
  if (!enabled && state.stageMode && lock.enabled && !options.skipLock) {
    const password = window.prompt("Mot de passe mode scène");
    if (password !== lock.password) {
      setStatus("Mode scène verrouillé");
      return;
    }
  }
  if (enabled) {
    // Restauration au rafraîchissement (skipDecode) : préchargement sauté → pas de
    // clignotement « préparation » (fixé plus bas à la valeur réelle de skipPreload).
    state.stageSkipPreload = Boolean(options.skipDecode);
    // Stop global immédiat avant d'entrer en scène (si un son est en lecture).
    state.pads.forEach((pad) => { if (isPadPlaying(pad)) stopPad(pad, false, false, { triggerEnd: false, noFlash: true }); });
    state.stageMode = true;
    // Entrée en scène : désélectionner les pads (aucune sélection/filtre actif).
    state.activeStructuralFilters = [];
    state.activeTagFilters = [];
    state.invertSelection = false;
    state.filterCompact = false;
    refreshTagFilterChips();
    applyBoardTagFilter();
    // Entrée en scène : repositionner les cues au début (cue 1 / index 0).
    const cueEntryBoard = currentBoard();
    if (cueEntryBoard) {
      cueEntryBoard.cueIndex = 0;
      saveBoards();
      syncCueControls();
    }
    syncBoardModeSelector();
    syncStagePending();
    const { ok, failures, emptyPads = [], validPads = [], noMedia, skipPreload = false } = await prepareBoardForStage(options);
    if (noMedia) {
      state.stageMode = false;
      syncBoardModeSelector();
      syncStagePending();
      localStorage.setItem(STAGE_MODE_STORAGE, "off");
      return;
    }
    if (!ok) {
      const proceed = await confirmStageDespiteMissing({ missingPads: failures, emptyPads });
      if (!proceed) {
        failures.forEach((pad) => pad.node?.classList.remove("is-missing-audio"));
        state.stageMode = false;
        syncBoardModeSelector();
        syncStagePending();
        localStorage.setItem(STAGE_MODE_STORAGE, "off");
        return;
      }
    }
    if (!skipPreload) await preloadStagePads(validPads);
    state.stageSkipPreload = skipPreload;
    if (failures.length > 0) {
      const n = failures.length;
      setStatus(`Mode scène — ${n} pad${n > 1 ? "s" : ""} défectueux ignoré${n > 1 ? "s" : ""}`, "stop");
    } else if (emptyPads.length > 0) {
      const n = emptyPads.length;
      setStatus(`Mode scène — ${n} pad${n > 1 ? "s" : ""} vide${n > 1 ? "s" : ""} ignoré${n > 1 ? "s" : ""}`, "stop");
    }
  }

  state.stageMode = Boolean(enabled);
  document.body.classList.toggle("stage-mode", state.stageMode);
  els.stageMode?.classList.toggle("is-active", state.stageMode);
  els.stageMode?.setAttribute("aria-pressed", String(state.stageMode));
  if (els.boardSelect) {
    els.boardSelect.disabled = state.stageMode;
    els.boardSelect.setAttribute("aria-disabled", String(state.stageMode));
  }
  localStorage.setItem(STAGE_MODE_STORAGE, state.stageMode ? "on" : "off");
  updateSkinOptions();
  renderBoardLayoutControls();
  applyPadLayout(currentBoard());

  if (state.stageMode) {
    setBoardPadEditing(false);
    const activeCount = syncStageVisiblePads();
    setStatus(`Board prêt pour la scène : ${activeCount} pad${activeCount > 1 ? "s" : ""} actif${activeCount > 1 ? "s" : ""}`, "success");
    const canRequestFullscreen = Boolean(document.documentElement.requestFullscreen) && !isPortableDevice();
    if (requestFullscreen && !document.fullscreenElement && canRequestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
    if (requestFullscreen && !canRequestFullscreen) {
      setStatus("Mode scène actif : activez le plein écran depuis les contrôles du navigateur sur smartphone", "success");
    }
  } else {
    state.stageSkipPreload = false;
    syncStageVisiblePads();
    // Sortie de scène : effacer le message « Board prêt pour la scène… »
    if (/^(Board prêt pour la scène|Mode scène)/.test(els.status.textContent || "")) {
      setStatus("");
    }
    if (requestFullscreen && document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
  }
  syncStagePending();
}

function syncStagePending() {
  // Pas de clignotement « préparation » quand le préchargement a été volontairement
  // sauté (restauration au rafraîchissement) : sinon il tourne à l'infini alors que
  // l'audio se charge à la demande au premier déclenchement.
  const pending = state.stageMode && !state.stageSkipPreload && orderedPadsForCurrentBoard().some(
    (pad) => padType(pad) === "audio" && pad.audioStored && !pad.buffer
  );
  els.stageMode?.classList.toggle("is-stage-pending", pending);
  document.querySelectorAll("[data-board-mode-target='stage']").forEach((b) =>
    b.classList.toggle("is-stage-pending", pending)
  );
}

function duckingActive() {
  return (
    state.pads.some((pad) => isPadPlaying(pad) && duckAmountForSource(pad) > 0) ||
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

function armedCrossfadeEnabled() {
  return Boolean(els.armedCrossfadeEnabled?.checked);
}

function armedCrossfadeSeconds() {
  return Math.max(0, Number(els.armedCrossfadeSeconds?.value) || 0);
}

function cuesEnabledForManualCrossfade() {
  return currentBoard()?.cuesEnabled === true;
}

function armedCrossfadeAvailable() {
  return cuesEnabledForManualCrossfade() && armedCrossfadeEnabled() && manualCrossfadeDuration() > 0;
}

function syncArmedCrossfadeControls() {
  const enabled = armedCrossfadeEnabled();
  const available = armedCrossfadeAvailable();
  if (els.armedCrossfadeSeconds) {
    els.armedCrossfadeSeconds.disabled = !enabled;
    els.armedCrossfadeSeconds.closest("label")?.classList.toggle("is-disabled", !enabled);
  }
  if (els.showCables) {
    els.showCables.disabled = !available;
    els.showCables.setAttribute("aria-disabled", String(!available));
    els.showCables.setAttribute("title", available ? "Armer crossfade manuel" : "Crossfade armé indisponible");
  }
  if (!available && state.crossfadeArm.active) {
    cancelManualCrossfade({ message: "Crossfade armé désactivé" });
  } else {
    syncManualCrossfadeUi();
  }
}

function masterDuckEnabled() {
  return Boolean(els.masterDuckEnabled?.checked);
}

function badgeClassFor(label) {
  const text = String(label || "").toLowerCase();
  if (text.includes("fade") || text === "f in" || text === "f out") return "is-fade";
  if (text.includes("duck")) return "is-duck";
  if (text.includes("mute")) return "is-stop";
  if (text.includes("revrs")) return "is-reverse";
  if (text.includes("rev")) return "is-reverb";
  if (text.includes("eq")) return "is-eq";
  if (text === "xf→") return "is-xfade-source";
  if (text === "→xf") return "is-xfade-target";
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
  // Ordre demandé : Loop · Revrs · Mono · EQ · Rev · f in · f out · Duck · →xf · xf→
  if (pad.loop) items.push("Loop");
  if (pad.reverse) items.push("Revrs");
  if (pad.mono) items.push("Mono");
  if (pad.eqMode === "pad" && [pad.eqLow, pad.eqMid, pad.eqHigh].some((value) => clampEqGain(value) !== 0)) items.push("EQ");
  if (pad.reverbMode === "pad" && pad.reverbPreset !== "none") items.push("Rev");
  if (fadeDurationForPad(pad, "in") > 0) items.push("f in");
  if (fadeDurationForPad(pad, "out") > 0) items.push("f out");
  if (pad.duckTrigger && pad.duckMode === "pad") items.push("Duck");
  if (state.crossfadeTargetUids?.has(pad.uid)) items.push("→xf"); // cible
  if (pad.startStopMode !== "none" || pad.endStartMode !== "none") items.push("xf→"); // source
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
  const eq = masterEqSettings();
  if ([eq.low, eq.mid, eq.high].some((value) => value !== 0)) items.push("EQ");
  if (els.masterOptionBadges) els.masterOptionBadges.innerHTML = badgeMarkup(items);
}

function updateAudioOptionBadges(pad = state.audioPad) {
  if (els.audioOptionBadges) els.audioOptionBadges.innerHTML = pad ? badgeMarkup(padOptionBadges(pad)) : "";
}

// Délai du clignotement de fin, réglable dans « audio master » (défaut 10s).
function endingAlertSeconds() {
  const raw = Number(els.endingAlertSeconds?.value);
  if (Number.isFinite(raw) && raw > 0) return raw;
  const stored = Number(localStorage.getItem(ENDING_ALERT_STORAGE));
  return Number.isFinite(stored) && stored > 0 ? stored : DEFAULT_ENDING_ALERT_SECONDS;
}

// Précision affichée sous le champ « Alerte fin » (reflète la valeur choisie).
function updateEndingAlertHint() {
  if (!els.endingAlertHint) return;
  const v = endingAlertSeconds();
  els.endingAlertHint.textContent = `(pour les sons de plus de ${v} secondes, ou la moitié de la durée du son pour les autres)`;
}

function updatePadAlerts(pad) {
  if (!pad?.node) return;
  const remaining = remainingSeconds(pad);
  const duration = playableDuration(pad);
  // Clignotement de fin : pour un son plus long que le délai réglé (défaut 10s), on
  // clignote sur ce délai ; pour un son plus court, sur la moitié de sa durée.
  const alertWindow = endingAlertSeconds();
  const endingThreshold = duration > alertWindow ? alertWindow : duration / 2;
  const playing = isPadPlaying(pad);
  const isEnding = Boolean(playing && !pad.loop && remaining > 0 && remaining <= endingThreshold);
  const isDuckSource = Boolean(playing && duckAmountForSource(pad) > 0 && pad.duckMode !== "global");
  const isDucked = Boolean(playing && duckingActive() && !pad.duckTrigger);
  const hasFadeIn = fadeDurationForPad(pad, "in") > 0;
  const hasFadeOut = fadeDurationForPad(pad, "out") > 0;

  if (!playing || remaining > endingThreshold) {
    pad.preEndFlashSeen = false;
    pad.node.classList.remove("is-preend-flash");
  }
  if (isEnding && !pad.preEndFlashSeen) {
    pad.preEndFlashSeen = true;
    flashPadPreEnd(pad, remaining);
  }
  pad.node.classList.toggle("is-ending", isEnding);
  pad.node.classList.toggle("is-looping", pad.loop);
  pad.node.classList.toggle("is-reverse", Boolean(pad.reverse));
  pad.node.classList.toggle("is-mono", Boolean(pad.mono));
  pad.node.classList.toggle("is-eq", pad.eqMode === "pad" && [pad.eqLow, pad.eqMid, pad.eqHigh].some((value) => clampEqGain(value) !== 0));
  pad.node.classList.toggle("is-duck-trigger", pad.duckTrigger && pad.duckMode === "pad");
  pad.node.classList.toggle("is-duck-source", isDuckSource);
  pad.node.classList.toggle("is-ducked", isDucked);
  pad.node.classList.toggle("is-muted", Boolean(pad.muted));
  pad.node.classList.toggle("has-audio-fade-in", hasFadeIn);
  pad.node.classList.toggle("has-audio-fade-out", hasFadeOut);
  pad.node.classList.toggle("has-reverb", pad.reverbMode === "pad" && pad.reverbPreset !== "none");
  const isXfadeSource = pad.startStopMode !== "none" || pad.endStartMode !== "none";
  pad.node.classList.toggle("has-crossfade", isXfadeSource);
  pad.node.classList.toggle("is-xfade-source", isXfadeSource);
  pad.node.classList.toggle("is-xfade-target", Boolean(state.crossfadeTargetUids?.has(pad.uid)));
}

// Ensemble des pads qui sont CIBLE d'un crossfade (visés par le start/end d'un autre pad).
function recomputeCrossfadeTargets() {
  const set = new Set();
  state.pads.forEach((src) => {
    [[src.startStopMode, src.startStopTag], [src.endStartMode, src.endStartTarget]].forEach(([mode, target]) => {
      if (mode === "none" || !String(target || "").trim()) return;
      padsFromCrossfadeTarget(target, src).forEach((p) => { if (p?.uid) set.add(p.uid); });
    });
  });
  state.crossfadeTargetUids = set;
}

function updateAllPadAlerts() {
  recomputeCrossfadeTargets();
  state.pads.forEach(updatePadAlerts);
}

function flashPadPreEnd(pad, durationSeconds = 1.35) {
  if (!pad?.crossfadeFlashEl) return;
  const remaining = Number(durationSeconds) || 1.05;
  // Le flash de fin couvre TOUTE la fenêtre restante (jusqu'au délai réglé) :
  // clignotement rouge accéléré (lent → rapide) qui s'arrête avec le son.
  const duration = Math.min(endingAlertSeconds(), Math.max(0.6, remaining));
  pad.node.classList.remove("is-preend-flash");
  pad.node.style.setProperty("--preend-flash-duration", `${duration}s`);
  void pad.node.offsetWidth;
  pad.node.classList.add("is-preend-flash");
  window.setTimeout(() => pad.node?.classList.remove("is-preend-flash"), duration * 1000 + 40);
}

function flashPadStop(pad, fadeSeconds = 0) {
  if (!pad?.crossfadeFlashEl) return;
  const totalDuration = Math.max(2.5, fadeSeconds);
  const iterations = Math.ceil(totalDuration / 0.72);
  pad.node.classList.remove("is-stop-flash");
  pad.node.style.setProperty("--stop-flash-iterations", String(iterations));
  void pad.node.offsetWidth;
  pad.node.classList.add("is-stop-flash");
  window.setTimeout(() => pad.node?.classList.remove("is-stop-flash"), iterations * 720 + 100);
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
    const buttonMode = button.dataset.mode;
    const active = buttonMode === pad.playMode || (buttonMode === "oneshot" && pad.playMode === "hold");
    const paused = Boolean(pad.isPaused && buttonMode === "toggle");
    const playingActive = buttonMode === "toggle" ? false : Boolean(isPadPlaying(pad) && active);
    button.classList.toggle("is-active", Boolean(playingActive || paused));
    button.setAttribute("aria-pressed", String(Boolean(playingActive || paused)));
  });
  pad.node?.classList.toggle("is-paused", Boolean(pad.isPaused));
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

function setPadDuckMode(pad, mode = "global", percent = pad?.duckPercent ?? 60) {
  if (!pad) return;
  pad.duckMode = ["none", "global", "pad"].includes(mode) ? mode : "global";
  pad.duckPercent = Math.min(100, Math.max(0, Math.round(Number(percent) || 0)));
  setPadDuckTrigger(pad, pad.duckMode !== "none");
}

function setPadTags(pad, tags) {
  pad.tags = tags.trim();
  pad.tagsEl.value = pad.tags;
  pad.tagsDisplayEl.textContent = pad.tags;
  pad.tagsDisplayEl.hidden = !pad.tags;
  renderPadTagChips(pad);
}

function renderPadTagChips(pad) {
  if (!pad.tagsChipsEl) return;
  pad.tagsChipsEl.innerHTML = "";
  padTagList(pad).forEach((tag) => {
    const chip = document.createElement("span");
    chip.className = "pad-tag-chip";
    chip.textContent = tag;
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "pad-tag-chip-remove";
    removeBtn.setAttribute("aria-label", `Supprimer le tag ${tag}`);
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const newTags = padTagList(pad).filter((t) => t !== tag).join(", ");
      setPadTags(pad, newTags);
      refreshBoardTagFilterOptions();
    });
    chip.append(removeBtn);
    pad.tagsChipsEl.append(chip);
  });
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
  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = "-";
  els.boardTagFilter.append(emptyOption);
  const allOption = document.createElement("option");
  allOption.value = "all";
  allOption.textContent = "Tous";
  els.boardTagFilter.append(allOption);
  const typeGroup = document.createElement("optgroup");
  typeGroup.label = "Types";
  [
    ["type:audio", "Audio"],
    ["type:video", "Vidéo"],
    ["type:text", "Texte"],
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    typeGroup.append(option);
  });
  els.boardTagFilter.append(typeGroup);
  if (state.boardEditMode) {
    const stateGroup = document.createElement("optgroup");
    stateGroup.label = "État";
    const emptyPadsOption = document.createElement("option");
    emptyPadsOption.value = "state:empty";
    emptyPadsOption.textContent = "Pads vides";
    stateGroup.append(emptyPadsOption);
    els.boardTagFilter.append(stateGroup);

    const aspectGroup = document.createElement("optgroup");
    aspectGroup.label = "Aspect du pad";
    [["aspect:sketch", "Dessin"], ["aspect:image", "Image"], ["aspect:color", "Couleur"]].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      aspectGroup.append(option);
    });
    els.boardTagFilter.append(aspectGroup);
  }
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
  // Purge any structural filters whose option no longer exists
  state.activeStructuralFilters = state.activeStructuralFilters.filter((val) =>
    [...els.boardTagFilter.options].some((o) => o.value === val)
  );
  refreshTagFilterChips();
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

function fillCrossfadeTargetSelect(select, selectedValue = null) {
  if (!select) return;
  const currentValue = String(selectedValue == null ? select.value : selectedValue).trim();
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
  } else if (currentValue) {
    const missingOption = document.createElement("option");
    missingOption.value = currentValue;
    missingOption.textContent = "Cible à retrouver";
    missingOption.dataset.missingTarget = "true";
    select.append(missingOption);
    select.value = currentValue;
  } else {
    select.value = "";
  }
  select.selectedIndex = Math.max(0, select.selectedIndex);
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
  pad.eqMode = ["none", "global", "pad"].includes(settings.eqMode) ? settings.eqMode : (pad.eqMode || "global");
  pad.eqLow = clampEqGain(settings.eqLow ?? pad.eqLow);
  pad.eqMid = clampEqGain(settings.eqMid ?? pad.eqMid);
  pad.eqHigh = clampEqGain(settings.eqHigh ?? pad.eqHigh);
  setPadDuckMode(pad, settings.duckMode ?? pad.duckMode ?? "global", settings.duckPercent ?? pad.duckPercent ?? duckPercentValue());
  pad.mono = Boolean(settings.mono ?? pad.mono);
  pad.reverse = Boolean(settings.reverse ?? pad.reverse);
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
  pad.node.style.setProperty("--pad-image-size", pad.visualKind === "sketch" ? "contain" : (pad.visualZoom <= 1 ? "cover" : `${pad.visualZoom * 100}%`));
  if (pad.visualImage) {
    pad.node.style.setProperty("--pad-image", `url("${pad.visualImage}")`);
    pad.visualPreviewEl?.style.setProperty("background-image", `url("${pad.visualImage}")`);
  } else {
    pad.node.style.removeProperty("--pad-image");
    pad.visualPreviewEl?.style.removeProperty("background-image");
  }
  fitPadTitle(pad);
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
  fitPadTitle(pad);
}

function syncImageColorButtons(pad = state.imagePad) {
  if (!pad) return;
  els.imageColorButtons?.forEach((button) => {
    button.classList.toggle("is-active", (button.dataset.imageColor || "") === pad.color);
  });
}

function setImageDialogMode(mode) {
  state.imageDialogMode = ["color", "image", "sketch"].includes(mode) ? mode : "color";
  syncImageDialog(state.imagePad);
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
  if (["none", "play", "duck", "mute", "stop"].includes(mode)) return mode;
  if (["all", "tag"].includes(mode)) return "stop";
  if (mode === "pad") return "play";
  return legacyTarget ? "play" : "none";
}

function normalizeCrossfadeTarget(value, legacyMode = "") {
  const target = String(value || "").trim();
  if (!target) return target;
  if (target.startsWith("pad:")) {
    return target;
  }
  if (target.includes(":")) return target;
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
  updateAllPadAlerts(); // recalcule aussi les cibles (le badge →xf des autres pads en dépend)
  syncCueControls();
  if (state.boardEditMode) refreshBoardTagFilterOptions();
}

function numericInputValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function formatSecondsTenths(seconds) {
  return `${(Math.round(Math.max(0, seconds) * 10) / 10).toFixed(1)}s`;
}

function formatTrimAutoSummary(result) {
  if (!result) return "aucun trim";
  const startText = formatSecondsTenths(result.start);
  const endText = result.end ? formatSecondsTenths(result.end) : "fin";
  return `${startText} → ${endText}`;
}

function autoTrimForBuffer(buffer) {
  if (!buffer?.length || !buffer.sampleRate || !buffer.duration) return null;
  const channels = Math.max(1, Math.min(buffer.numberOfChannels || 1, 2));
  const sampleRate = buffer.sampleRate;
  const blockSize = Math.max(1, Math.floor(sampleRate * 0.01));
  const stride = Math.max(1, Math.floor(blockSize / 24));
  const blockCount = Math.ceil(buffer.length / blockSize);
  const blockPeaks = new Float32Array(blockCount);
  let globalPeak = 0;

  for (let blockIndex = 0; blockIndex < blockCount; blockIndex += 1) {
    const start = blockIndex * blockSize;
    const end = Math.min(buffer.length, start + blockSize);
    let peak = 0;
    for (let channelIndex = 0; channelIndex < channels; channelIndex += 1) {
      const data = buffer.getChannelData(channelIndex);
      for (let frame = start; frame < end; frame += stride) {
        peak = Math.max(peak, Math.abs(data[frame] || 0));
      }
    }
    blockPeaks[blockIndex] = peak;
    globalPeak = Math.max(globalPeak, peak);
  }

  if (globalPeak < 0.0005) return null;

  const threshold = Math.max(0.0015, Math.min(0.02, globalPeak * 0.005));
  let firstActive = -1;
  let lastActive = -1;
  for (let index = 0; index < blockPeaks.length; index += 1) {
    if (blockPeaks[index] >= threshold) {
      firstActive = index;
      break;
    }
  }
  for (let index = blockPeaks.length - 1; index >= 0; index -= 1) {
    if (blockPeaks[index] >= threshold) {
      lastActive = index;
      break;
    }
  }

  if (firstActive < 0 || lastActive < firstActive) return null;

  const padding = 0.02;
  const minSilence = 0.06;
  const rawStart = Math.max(0, (firstActive * blockSize) / sampleRate - padding);
  const rawEnd = Math.min(buffer.duration, ((lastActive + 1) * blockSize) / sampleRate + padding);
  const start = rawStart >= minSilence ? Math.round(rawStart * 100) / 100 : 0;
  const end = buffer.duration - rawEnd >= minSilence ? Math.round(rawEnd * 100) / 100 : 0;

  return {
    start,
    end,
    threshold,
    detected: Boolean(start || end),
  };
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

async function calculateAutoTrimForPad(pad) {
  if (!pad || padType(pad) !== "audio") return null;
  const buffer = await ensurePadAudioDecoded(pad);
  return autoTrimForBuffer(buffer);
}

async function applyAutoTrimToAudioDialog() {
  const pad = state.audioPad;
  if (!pad) return;
  if (padType(pad) !== "audio") {
    setStatus("Trim auto disponible uniquement pour un pad audio");
    return;
  }
  const button = els.audioAutoTrim;
  if (button) button.disabled = true;
  try {
    const result = await calculateAutoTrimForPad(pad);
    if (!result) {
      setStatus("Trim auto impossible : audio silencieux ou indisponible", "stop");
      return;
    }
    if (!result.detected) {
      setStatus("Trim auto : aucun silence détecté");
      return;
    }
    setPadTrim(pad, result.start, result.end);
    updatePadTime(pad);
    renderAudioDialogWaveform(pad);
    setStatus(`Trim auto : ${formatTrimAutoSummary(result)}`);
  } catch (error) {
    console.error(error);
    setStatus("Trim auto impossible");
  } finally {
    if (button) button.disabled = false;
  }
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

// Temps d'origine → temps effectif (après retrait des coupures). Point dans une coupure → couture.
function origToEffTime(pad, tOrig, regions = pad.regions) {
  const cuts = (regions || [])
    .filter((r) => r.type === "cut")
    .map((r) => [r.start, r.end])
    .sort((a, b) => a[0] - b[0]);
  let removed = 0;
  for (const [a, b] of cuts) {
    if (tOrig >= b) removed += (b - a);
    else if (tOrig > a) removed += (tOrig - a);
  }
  return Math.max(0, tOrig - removed);
}

// Positions (en secondes sur la timeline effective) des coupures, pour les marquer dans la waveform.
function cutSeamsEffective(pad) {
  const regs = (pad.regions || [])
    .filter((r) => r.type === "cut")
    .map((r) => ({ start: r.start, end: r.end }))
    .sort((a, b) => a.start - b.start);
  const seams = [];
  let removed = 0;
  for (const r of regs) {
    seams.push(Math.max(0, r.start - removed));
    removed += Math.max(0, r.end - r.start);
  }
  return seams;
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
  if (pad.duration) {
    const seams = cutSeamsEffective(pad);
    if (seams.length) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 91, 91, 0.95)";
      ctx.lineWidth = Math.max(1, dpr);
      ctx.setLineDash([4 * dpr, 3 * dpr]);
      seams.forEach((s) => {
        const x = (s / pad.duration) * width;
        if (x <= 0.5 || x >= width - 0.5) return;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      });
      ctx.restore();
    }
  }
  // Enveloppe de volume (lecture seule) reportée sur la waveform.
  if (pad.duration && Array.isArray(pad.envelope) && pad.envelope.length) {
    const pts = pad.envelope.slice().sort((a, b) => a.time - b.time);
    ctx.save();
    ctx.strokeStyle = "rgba(120, 210, 130, 0.95)";
    ctx.lineWidth = Math.max(1.5, dpr * 1.5);
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = (origToEffTime(pad, p.time) / pad.duration) * width;
      const y = (1 - Math.min(1, Math.max(0, p.volume))) * height;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.restore();
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
  // Le trim n'est plus éditable depuis les Réglages (barres retirées) : il se règle
  // dans l'éditeur audio (Trim auto). La waveform des Réglages reste un affichage.
  return; // eslint-disable-line no-unreachable
  if (!els.audioWaveform) return;
  els.audioWaveform.addEventListener("pointerdown", (event) => {
    const pad = state.audioPad;
    if (pad?.videoName) return;
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

function syncAudioDialog(pad = state.audioPad, options = {}) {
  if (!pad) return;
  const isAudio = padType(pad) === "audio";
  if (els.audioPadName) els.audioPadName.textContent = pad.title;
  if (els.audioFilePath) els.audioFilePath.textContent = audioCharacteristics(pad);
  updateOutputLabels();
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
  if (els.audioReverse) {
    els.audioReverse.checked = pad.reverse;
    els.audioReverse.classList.toggle("is-active", pad.reverse);
    els.audioReverse.setAttribute("aria-pressed", String(pad.reverse));
  }
  if (els.audioDuckNone) els.audioDuckNone.checked = pad.duckMode === "none";
  if (els.audioDuckGlobal) els.audioDuckGlobal.checked = pad.duckMode !== "none" && pad.duckMode !== "pad";
  if (els.audioDuckPad) els.audioDuckPad.checked = pad.duckMode === "pad";
  if (els.audioDuckPercent) els.audioDuckPercent.value = String(pad.duckPercent ?? duckPercentValue());
  if (els.audioPadDuckField) els.audioPadDuckField.hidden = pad.duckMode !== "pad";
  if (els.audioDuckGlobalHint) els.audioDuckGlobalHint.textContent = `(${duckPercentValue()}%)`;
  if (els.audioFadeInLabel) els.audioFadeInLabel.textContent = `Fade in (${Math.max(0, Number(els.fadeInSeconds?.value) || 0)}s global)`;
  if (els.audioFadeOutLabel) els.audioFadeOutLabel.textContent = `Fade out (${Math.max(0, Number(els.fadeSeconds?.value) || 0)}s global)`;
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
  if (els.audioEqNone) els.audioEqNone.checked = pad.eqMode === "none";
  if (els.audioEqGlobal) els.audioEqGlobal.checked = pad.eqMode !== "none" && pad.eqMode !== "pad";
  if (els.audioEqPad) els.audioEqPad.checked = pad.eqMode === "pad";
  if (els.audioPadEqFields) els.audioPadEqFields.hidden = pad.eqMode !== "pad";
  if (els.audioEqLow) els.audioEqLow.value = String(pad.eqLow);
  if (els.audioEqMid) els.audioEqMid.value = String(pad.eqMid);
  if (els.audioEqHigh) els.audioEqHigh.value = String(pad.eqHigh);
  updateAudioEqValues(pad);
  if (els.audioTextLang) els.audioTextLang.value = pad.textLang || "fr-FR";
  setAudioTextGenderControls(pad.textGender || "female");
  fillAudioTextVoiceOptions(pad);
  if (els.audioTextRate) els.audioTextRate.value = String(normalizedTextRate(pad.textRate));
  if (els.audioTextRateValue) els.audioTextRateValue.textContent = `${normalizedTextRate(pad.textRate).toFixed(2)}x`;
  if (els.audioTextInlineEditor && document.activeElement !== els.audioTextInlineEditor) {
    els.audioTextInlineEditor.value = pad.textContent || "";
  }
  if (els.audioAutoTrim) {
    els.audioAutoTrim.disabled = !isAudio;
    els.audioAutoTrim.classList.toggle("is-disabled", !isAudio);
  }
  updateAudioOptionBadges(pad);
  fillAudioCrossfadeControls(pad);
  syncAudioDialogMediaAvailability(pad);
  syncAudioTestPlayButton();
  if (options.renderWaveform !== false) renderAudioDialogWaveform(pad);
}

function fillAudioTextVoiceOptions(pad = state.audioPad) {
  if (!els.audioTextVoice) return;
  const currentValue = pad?.textVoiceURI || "";
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const langRoot = String(pad?.textLang || els.audioTextLang?.value || "fr-FR").toLowerCase().split("-")[0];
  const voicesKey = voices.map((voice) => `${voice.voiceURI || ""}:${voice.name || ""}:${voice.lang || ""}:${voice.localService ? "1" : "0"}`).join("|");
  const optionsKey = `${langRoot}|${voicesKey}`;
  if (els.audioTextVoice.dataset.voiceOptionsKey !== optionsKey) {
    const sortedVoices = [...voices].sort((a, b) => {
      const aLang = String(a.lang || "").toLowerCase().startsWith(langRoot) ? 0 : 1;
      const bLang = String(b.lang || "").toLowerCase().startsWith(langRoot) ? 0 : 1;
      return aLang - bLang || String(a.name || "").localeCompare(String(b.name || ""));
    });
    els.audioTextVoice.innerHTML = '<option value="">Automatique</option>';
    sortedVoices.forEach((voice) => {
      const option = document.createElement("option");
      option.value = voice.voiceURI || voice.name || "";
      option.textContent = `${voice.name || "Voix"}${voice.lang ? ` · ${voice.lang}` : ""}${voice.localService ? " · système" : " · navigateur"}`;
      els.audioTextVoice.append(option);
    });
    els.audioTextVoice.dataset.voiceOptionsKey = optionsKey;
  }
  els.audioTextVoice.value = [...els.audioTextVoice.options].some((option) => option.value === currentValue) ? currentValue : "";
}

function fillAudioCrossfadeControls(pad = state.audioPad) {
  if (!pad) return;
  const draft = state.audioPad === pad && state.audioCrossfadeDraft
    ? state.audioCrossfadeDraft
    : {
      startStopMode: pad.startStopMode,
      startStopTag: pad.startStopTag,
      endStartMode: pad.endStartMode,
      endStartTarget: pad.endStartTarget,
    };
  const actionOptions = '<option value="none">Pas d’effet</option><option value="play">Lance pad ou tag</option><option value="duck">Duck pad ou tag</option><option value="mute">Mute/demute pad ou tag</option><option value="stop">Stoppe pad ou tag</option>';
  if (els.audioStartStopMode) {
    els.audioStartStopMode.innerHTML = actionOptions;
    els.audioStartStopMode.value = draft.startStopMode || "none";
  }
  if (els.audioEndStartMode) {
    els.audioEndStartMode.innerHTML = actionOptions;
    els.audioEndStartMode.value = draft.endStartMode || "none";
  }
  fillCrossfadeTargetSelect(els.audioStartStopTarget, draft.startStopMode === "none" ? "" : draft.startStopTag);
  fillCrossfadeTargetSelect(els.audioEndStartTarget, draft.endStartMode === "none" ? "" : draft.endStartTarget);
}

function updateAudioCrossfadeDraftFromControls() {
  const startMode = selectedOptionValue(els.audioStartStopMode) || "none";
  const endMode = selectedOptionValue(els.audioEndStartMode) || "none";
  state.audioCrossfadeDraft = {
    startStopMode: startMode,
    startStopTag: startMode === "none" ? "" : selectedOptionValue(els.audioStartStopTarget),
    endStartMode: endMode,
    endStartTarget: endMode === "none" ? "" : selectedOptionValue(els.audioEndStartTarget),
  };
  return state.audioCrossfadeDraft;
}

function commitAudioDialogCrossfade() {
  if (!state.audioPad) return;
  setPadCrossfade(state.audioPad, state.audioCrossfadeDraft || updateAudioCrossfadeDraftFromControls());
}

function saveAudioPadFromDialog() {
  if (!state.audioPad) return;
  commitAudioDialogCrossfade();
  savePadMeta(state.audioPad);
}

function settleNativeSelects() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      window.setTimeout(resolve, 0);
    });
  });
}

function selectedOptionValue(select) {
  if (!select) return "";
  return String(select.value ?? "").trim();
}

// ===== Éditeur audio (régions cut/silence) — wavesurfer =====
let aeWS = null, aeRegions = null, aePad = null, aeNewType = "cut";
let aeEnvelope = null, aeMode = "regions", aeDragSel = null;
let aeEnvDirty = false, aeHadSavedEnv = false, aeEnvBaselineSig = "", aeReady = false, aeSeedAt = 0, aeRestoring = false;
const aeEnvSig = (pts) => (pts || []).map((p) => `${(+p.time).toFixed(3)}:${(+p.volume).toFixed(3)}`).sort().join("|");
const AE_TINT = { cut: "rgba(255,60,60,0.16)", silence: "rgba(255,150,40,0.14)" };
const AE_EDGE = { cut: "#ff5b5b", silence: "#ffa83a" };
const aeFmt = (s) => `${Math.floor(Math.max(0,s)/60)}:${(Math.max(0,s)%60).toFixed(3).padStart(6,"0")}`;
const aeEl = (id) => document.getElementById(id);

async function padAudioBlob(pad) {
  const rawSaved = await dbGet(padAudioKey(pad));
  const meta = await dbGet(padMetaKey(pad));
  const saved = await resolvePadAudioRecord(pad, meta, rawSaved);
  const audio = saved?.audio || rawSaved?.audio;
  if (!audio) return null;
  return new Blob([audio], { type: saved?.type || rawSaved?.type || "audio/wav" });
}

function aeDecorate(region, type) {
  region.__type = type;
  const el = region.element; if (!el) return;
  el.querySelectorAll(".ae-rg-label, .ae-rg-dots").forEach((n) => n.remove()); // idempotent (évite les doublons)
  el.style.setProperty("--rg", AE_EDGE[type]);
  const lab = document.createElement("div");
  lab.className = "ae-rg-label"; lab.textContent = type === "cut" ? "CUT" : "MUTE";
  const dots = document.createElement("div");
  dots.className = "ae-rg-dots"; dots.innerHTML = '<i class="no" title="Supprimer la région">✕</i>';
  dots.querySelector(".no").onclick = (e) => { e.stopPropagation(); region.remove(); };
  el.appendChild(lab); el.appendChild(dots);
}

// Bornes audibles sur la timeline effective (cut retiré, silence muté).
// In = 1er instant audible, Out = dernier instant audible, audible = durée réellement entendue.
function aeEffectiveBounds() {
  const d = aeWS?.getDuration() || 0;
  const regs = (aeRegions?.getRegions() || [])
    .map((r) => ({
      type: r.__type === "silence" ? "silence" : "cut",
      a: Math.max(0, Math.min(d, r.start)),
      b: Math.max(0, Math.min(d, r.end)),
    }))
    .filter((r) => r.b > r.a);
  const pts = new Set([0, d]);
  regs.forEach((r) => { pts.add(r.a); pts.add(r.b); });
  const bounds = [...pts].sort((x, y) => x - y);
  const inAny = (mid, type) => regs.some((r) => r.type === type && mid >= r.a && mid < r.b);
  let eff = 0; let inT = 0; let inFound = false; let outT = 0; let audible = 0;
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const p = bounds[i]; const q = bounds[i + 1];
    if (q <= p) continue;
    const mid = (p + q) / 2;
    if (inAny(mid, "cut")) continue; // retiré → n'avance pas la timeline effective
    const len = q - p;
    if (!inAny(mid, "silence")) {
      if (!inFound) { inT = p; inFound = true; } // In = 1er instant audible (timeline d'origine)
      outT = eff + len;                          // Out = fin audible (timeline effective)
      audible += len;
    }
    eff += len;
  }
  return { total: d, inT, outT, audible };
}

function aeUpdateTimes() {
  if (!aeWS || !aeRegions) return;
  const b = aeEffectiveBounds();
  aeEl("aeTotal").textContent = aeFmt(b.total);
  aeEl("aeIn").textContent = aeFmt(b.inT);
  aeEl("aeOut").textContent = aeFmt(b.outT);
  aeEl("aeSel").textContent = aeFmt(b.audible);
}

function aeAdd(type) {
  if (!aeWS || !aeRegions) return;
  aeNewType = type;
  const d = aeWS.getDuration() || 1;
  const start = aeWS.getCurrentTime() || d * 0.4;
  const end = Math.min(d, start + Math.max(0.3, d * 0.08));
  // La décoration est faite par le handler region-created (avec aeNewType = type) → pas de double.
  aeRegions.addRegion({ start, end, color: AE_TINT[type], drag: true, resize: true });
  aeUpdateTimes();
}

const AE_HINT_REGIONS = "Rouge = cut (retiré du son) · Orange = mute (mis à zéro) · Zone grisée = trim in/out (réglé dans Réglages). Glisser sur la waveform pour créer une région ; poignées pour ajuster ; ✕ pour supprimer.";
const AE_HINT_ENV = "Enveloppe de volume : double-cliquer = ajouter un point · glisser = déplacer · sortir de la zone = supprimer. Haut = 100 %, bas = silence. Les fades in/out (Réglages) forment les extrémités de la courbe (« Appliquer les fades » les régénère).";

function aeUpdateHint() {
  const h = document.querySelector(".ae-hint");
  if (h) h.textContent = aeMode === "envelope" ? AE_HINT_ENV : AE_HINT_REGIONS;
}

function aeSetMode(mode) {
  aeMode = mode === "envelope" ? "envelope" : "regions";
  aeEl("aeModeRegions")?.classList.toggle("is-active", aeMode === "regions");
  aeEl("aeModeEnvelope")?.classList.toggle("is-active", aeMode === "envelope");
  aeEl("aeRegionGroup")?.classList.toggle("is-dim", aeMode !== "regions");
  aeEl("aeEnvGroup")?.classList.toggle("is-dim", aeMode !== "envelope");
  const wave = aeEl("aeWave");
  if (wave) {
    wave.classList.toggle("ae-mode-reg", aeMode === "regions");
    wave.classList.toggle("ae-mode-env", aeMode === "envelope");
  }
  if (aeMode === "regions") {
    if (!aeDragSel && aeRegions) aeDragSel = aeRegions.enableDragSelection({ color: AE_TINT.cut });
  } else if (aeDragSel) {
    aeDragSel(); aeDragSel = null;
  }
  // Régions estompées en mode enveloppe (leur interactivité est gérée par l'enveloppe
  // SVG au-dessus via le CSS ::part ; on ne touche PAS à pointer-events des régions,
  // sinon elles restaient non déplaçables après un aller-retour de mode).
  (aeRegions?.getRegions() || []).forEach((r) => {
    if (r.element) r.element.style.opacity = aeMode === "envelope" ? "0.3" : "";
  });
  if (aeMode === "envelope") aeMaybeReseedFades(); // recale le fade sur les régions actuelles
  aeUpdateHint();
}

function aeFlatEnvelope() {
  const d = aeWS?.getDuration() || 0;
  aeSeedAt = performance.now();
  aeEnvelope?.setPoints([{ time: 0, volume: 1 }, { time: d, volume: 1 }]);
}

// Règle A : (re)génère les extrémités de l'enveloppe à partir des fades in/out du pad,
// en préservant les points manuels du milieu.
function aeSeedFadesIntoEnvelope(pad) {
  if (!aeEnvelope) return;
  const origDur = aeWS?.getDuration() || 0;
  if (!origDur) return;
  const regions = aeLiveRegions(); // tient compte des cut/silence en cours d'édition
  const cutTotal = regions
    .filter((r) => r.type === "cut")
    .reduce((s, r) => s + Math.max(0, Math.min(origDur, r.end) - Math.max(0, r.start)), 0);
  const dur = Math.max(0.01, origDur - cutTotal); // durée effective live
  const fi = padOwnFade(pad, "in");
  const fo = padOwnFade(pad, "out");
  const tIn0 = Math.min(dur, Math.max(0, pad.trimStart || 0));
  const tIn1 = Math.min(dur, tIn0 + fi);
  const tOut1 = pad.trimEnd ? Math.min(pad.trimEnd, dur) : dur;
  const tOut0 = Math.max(tIn1, tOut1 - fo);
  const E = (tEff) => aeEffToOrig(pad, tEff, regions);
  // points manuels du milieu (temps effectif strictement entre les fenêtres de fade)
  const middle = (aeEnvelope.getPoints() || [])
    .map((p) => ({ time: p.time, volume: p.volume }))
    .filter((p) => { const e = origToEffTime(pad, p.time, regions); return e > tIn1 + 1e-3 && e < tOut0 - 1e-3; });
  const seeded = [];
  // Sans fade-in : plein dès le tout début (t=0) pour éviter une fausse montée
  // depuis le coin bas-gauche (segment par défaut de la polyline).
  if (fi > 0.01) seeded.push({ time: E(tIn0), volume: 0 }, { time: E(tIn1), volume: 1 });
  else seeded.push({ time: 0, volume: 1 });
  middle.forEach((p) => seeded.push(p));
  // Sans fade-out : plein jusqu'à la toute fin (t=origDur) pour éviter une fausse descente.
  if (fo > 0.01) seeded.push({ time: E(tOut0), volume: 1 }, { time: E(tOut1), volume: 0 });
  else seeded.push({ time: origDur, volume: 1 });
  seeded.sort((a, b) => a.time - b.time);
  const clean = [];
  for (const p of seeded) {
    const last = clean[clean.length - 1];
    if (last && Math.abs(last.time - p.time) < 0.005) last.volume = Math.min(last.volume, p.volume);
    else clean.push({ ...p });
  }
  aeSeedAt = performance.now();
  aeEnvelope.setPoints(clean);
}

// Tant que l'enveloppe n'a pas été éditée à la main, garder le fade calé sur le
// début/fin audibles quand les régions (cut) changent.
function aeMaybeReseedFades() {
  if (!aeReady || !aeEnvelope || !aePad || aeEnvDirty) return;
  if (!(padOwnFade(aePad, "in") || padOwnFade(aePad, "out"))) return;
  aeSeedFadesIntoEnvelope(aePad);
  aeEnvBaselineSig = aeEnvSig(aeEnvelope.getPoints());
}

// Gain de l'enveloppe au temps t (interpolation linéaire entre points).
function aeEnvGainAt(t) {
  const pts = (aeEnvelope?.getPoints?.() || []).slice().sort((a, b) => a.time - b.time);
  if (!pts.length) return 1;
  if (t <= pts[0].time) return pts[0].volume;
  for (let i = 0; i < pts.length - 1; i += 1) {
    const a = pts[i]; const b = pts[i + 1];
    if (t >= a.time && t <= b.time) {
      const f = (t - a.time) / ((b.time - a.time) || 1);
      return a.volume + (b.volume - a.volume) * f;
    }
  }
  return pts[pts.length - 1].volume;
}

function aeUndo() {
  if (aeMode === "envelope") {
    const d = aeWS?.getDuration() || 0;
    const pts = (aeEnvelope?.getPoints() || []).slice().sort((a, b) => a.time - b.time);
    for (let i = pts.length - 1; i >= 0; i -= 1) {
      if (pts[i].time > 0.001 && pts[i].time < d - 0.001) { aeEnvelope.removePoint(pts[i]); return; }
    }
  } else {
    const a = aeRegions?.getRegions() || [];
    a[a.length - 1]?.remove();
  }
}

function aeReset() {
  if (!aePad) return;
  if (!window.confirm("Réinitialiser l'éditeur audio ?\n\nCela supprime les coupures, les silences, l'enveloppe, le trim et les fades de ce pad.")) return;
  // Données du pad : régions, enveloppe, trim, fades (on ne touche pas pitch/reverb/eq…).
  aePad.regions = [];
  aePad.envelope = [];
  aePad.effectiveBuffer = null;
  aePad.effectiveBufferSig = "";
  aePad.reversedBufferSource = null;
  setPadTrim(aePad, 0, 0);
  aePad.fadeMode = "global";
  aePad.fadeInSeconds = normalizeOptionalSeconds("");
  aePad.fadeOutSeconds = normalizeOptionalSeconds("");
  if (aePad.buffer) applyEffectiveBufferState(aePad);
  // Vue éditeur
  aeRegions?.clearRegions();
  aeFlatEnvelope();
  aeEnvDirty = true;
  aeUpdateTimes();
  aeUpdateTrimOverlay();
  // Réglages + persistance
  updatePadTime(aePad);
  renderWaveform(aePad);
  if (state.audioPad === aePad && els.audioDialog?.open) {
    syncAudioDialog(aePad, { renderWaveform: false });
    renderAudioDialogWaveform(aePad);
  }
  savePadMeta(aePad);
  if (state.audioMediaDraft && state.audioPad === aePad) {
    dbGet(padMetaKey(aePad)).then((m) => { if (state.audioMediaDraft) state.audioMediaDraft.metaRecord = m; });
  }
  setStatus("Éditeur audio réinitialisé", "success");
}

async function aeRunTrimAuto() {
  if (!aePad) return;
  try {
    const result = await calculateAutoTrimForPad(aePad);
    if (!result || !result.detected) { setStatus("Trim auto : aucun silence détecté"); return; }
    setPadTrim(aePad, result.start, result.end);
    updatePadTime(aePad);
    aeUpdateTrimOverlay();
    if (state.audioPad === aePad && els.audioDialog?.open) renderAudioDialogWaveform(aePad);
    setStatus(`Trim auto : ${formatTrimAutoSummary(result)}`);
  } catch (error) {
    console.error(error);
    setStatus("Trim auto impossible");
  }
}

function aeDestroy() {
  try { aeWS?.destroy(); } catch {}
  aeWS = null; aeRegions = null; aePad = null; aeTrimEls = null; aeTrimDrag = null;
  aeEnvelope = null; aeDragSel = null; aeMode = "regions";
  aeEnvDirty = false; aeHadSavedEnv = false; aeEnvBaselineSig = ""; aeReady = false; aeRestoring = false;
  if (aeEl("aeWave")) aeEl("aeWave").innerHTML = "";
}

// Régions actuellement présentes dans l'éditeur (live), au format {type,start,end}.
function aeLiveRegions() {
  if (!aeRegions) return aePad?.regions || [];
  return aeRegions.getRegions().map((r) => ({ type: r.__type === "silence" ? "silence" : "cut", start: r.start, end: r.end }));
}

// Fades propres au pad (mode "pad" uniquement — les fades globaux ne sont pas repris).
function padOwnFade(pad, type) {
  if (pad.fadeMode !== "pad") return 0;
  const v = Number(type === "in" ? pad.fadeInSeconds : pad.fadeOutSeconds);
  return Number.isFinite(v) && v > 0 ? v : 0;
}

// Convertit un temps de la timeline effective (après cut) vers la timeline d'origine.
function aeEffToOrig(pad, tEff, regions = pad.regions) {
  const total = pad.buffer?.duration || aeWS?.getDuration() || 0;
  const cuts = (regions || [])
    .filter((r) => r.type === "cut")
    .map((r) => [Math.max(0, r.start), Math.min(total, r.end)])
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);
  const kept = []; let cur = 0;
  for (const [a, b] of cuts) { if (a > cur) kept.push([cur, a]); cur = Math.max(cur, b); }
  if (cur < total) kept.push([cur, total]);
  let acc = 0;
  for (const [a, b] of kept) {
    const len = b - a;
    if (tEff <= acc + len) return a + (tEff - acc);
    acc += len;
  }
  return total;
}

let aeTrimEls = null;
let aeTrimDrag = null;

// Position pointeur → temps d'origine (en tenant compte du zoom/scroll de wavesurfer).
function aePointerOrigTime(clientX) {
  if (!aeWS) return 0;
  const total = aeWS.getDuration() || 0;
  try {
    const wrapper = aeWS.getWrapper();
    const scrollEl = wrapper.parentElement || wrapper;
    const contentW = wrapper.scrollWidth || wrapper.getBoundingClientRect().width;
    const rect = scrollEl.getBoundingClientRect();
    const x = (clientX - rect.left) + (scrollEl.scrollLeft || 0);
    return contentW ? Math.max(0, Math.min(total, (x / contentW) * total)) : 0;
  } catch { return 0; }
}

function aeBindTrimHandle(el, which) {
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault(); e.stopPropagation();
    el.setPointerCapture?.(e.pointerId);
    aeTrimDrag = { which, pointerId: e.pointerId };
  });
  el.addEventListener("pointermove", (e) => {
    if (!aeTrimDrag || aeTrimDrag.pointerId !== e.pointerId || !aePad) return;
    const tEff = origToEffTime(aePad, aePointerOrigTime(e.clientX), aeLiveRegions());
    const dur = aePad.duration || aeWS.getDuration() || 0;
    if (which === "in") setPadTrim(aePad, Math.max(0, Math.min(tEff, (aePad.trimEnd || dur) - 0.05)), aePad.trimEnd);
    else setPadTrim(aePad, aePad.trimStart, Math.max((aePad.trimStart || 0) + 0.05, Math.min(tEff, dur)));
    aeUpdateTrimOverlay();
    updatePadTime(aePad);
  });
  const end = (e) => {
    if (!aeTrimDrag || aeTrimDrag.pointerId !== e.pointerId) return;
    aeTrimDrag = null;
    el.releasePointerCapture?.(e.pointerId);
    if (!aePad) return;
    savePadMeta(aePad);
    if (state.audioMediaDraft && state.audioPad === aePad) {
      dbGet(padMetaKey(aePad)).then((m) => { if (state.audioMediaDraft) state.audioMediaDraft.metaRecord = m; });
    }
    if (state.audioPad === aePad && els.audioDialog?.open) renderAudioDialogWaveform(aePad);
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function aeEnsureTrimEls() {
  const wave = aeEl("aeWave");
  if (!wave) return null;
  if (aeTrimEls && aeTrimEls.root.parentElement === wave) return aeTrimEls;
  const root = document.createElement("div");
  root.className = "ae-trim-overlay";
  const dimL = document.createElement("div"); dimL.className = "ae-trim-dim";
  const dimR = document.createElement("div"); dimR.className = "ae-trim-dim";
  const lineI = document.createElement("div"); lineI.className = "ae-trim-line";
  const lineO = document.createElement("div"); lineO.className = "ae-trim-line";
  const handleI = document.createElement("div"); handleI.className = "ae-trim-handle"; handleI.title = "Début (trim in)";
  const handleO = document.createElement("div"); handleO.className = "ae-trim-handle"; handleO.title = "Fin (trim out)";
  root.append(dimL, dimR, lineI, lineO, handleI, handleO);
  wave.appendChild(root);
  aeBindTrimHandle(handleI, "in");
  aeBindTrimHandle(handleO, "out");
  aeTrimEls = { root, dimL, dimR, lineI, lineO, handleI, handleO };
  return aeTrimEls;
}

// Bornes du trim (in/out) exprimées en temps d'origine — cohérentes avec l'overlay
// grisé affiché. Sert à la fois à dessiner l'overlay et à borner la lecture.
function aeTrimBoundsOrig() {
  if (!aeWS || !aePad) return null;
  const total = aeWS.getDuration() || 0;
  if (!total) return null;
  const dur = aePad.duration || total; // durée effective
  const tIn = trimStart(aePad);
  const tOut = aePad.trimEnd ? Math.min(trimEnd(aePad), dur) : dur;
  return { total, origIn: aeEffToOrig(aePad, tIn), origOut: aeEffToOrig(aePad, tOut) };
}

// Matérialise dans l'éditeur le trim (in/out) réglé dans la fenêtre Réglages.
function aeUpdateTrimOverlay() {
  if (!aeWS || !aePad) return;
  const o = aeEnsureTrimEls(); if (!o) return;
  const b = aeTrimBoundsOrig();
  if (!b) { o.root.hidden = true; return; }
  const { total, origIn, origOut } = b;
  let wrapper; let scrollEl; let contentW; let scrollLeft = 0; let viewW;
  try {
    wrapper = aeWS.getWrapper();
    scrollEl = wrapper.parentElement || wrapper;
    contentW = wrapper.scrollWidth || wrapper.getBoundingClientRect().width;
    scrollLeft = scrollEl.scrollLeft || 0;
    viewW = scrollEl.clientWidth || contentW;
  } catch { o.root.hidden = true; return; }
  if (!contentW) { o.root.hidden = true; return; }
  const xOf = (t) => (t / total) * contentW - scrollLeft;
  const clamp = (x) => Math.max(0, Math.min(viewW, x));
  const xIn = clamp(xOf(origIn));
  const xOut = clamp(xOf(origOut));
  o.root.hidden = false;
  o.dimL.style.left = "0px"; o.dimL.style.width = `${xIn}px`;
  o.dimR.style.left = `${xOut}px`; o.dimR.style.width = `${Math.max(0, viewW - xOut)}px`;
  o.lineI.style.left = `${xIn}px`; o.lineI.hidden = origIn <= 0.001;
  o.lineO.style.left = `${xOut}px`; o.lineO.hidden = origOut >= total - 0.001;
  o.handleI.style.left = `${xIn}px`;
  o.handleO.style.left = `${xOut}px`;
}

// Aperçu fidèle : pendant la lecture, saute les régions "cut" et coupe le son sur les "silence".
function aeSyncPreview(t) {
  if (!aeWS || !aeRegions) return;
  // Respecter le trim : la lecture ne joue que la région conservée [in, out].
  if (aeWS.isPlaying?.()) {
    const b = aeTrimBoundsOrig();
    if (b) {
      if (t >= b.origOut - 0.005) { // fin du trim → on arrête et on revient au début du trim
        aeWS.pause();
        aeWS.setTime(Math.max(0, b.origIn));
        aeEl("aePlay")?.classList.remove("is-playing");
        return;
      }
      if (t < b.origIn - 0.005) { aeWS.setTime(b.origIn); return; } // avant le trim → on saute au début
    }
  }
  let inSilence = false;
  for (const r of aeRegions.getRegions()) {
    if (t >= r.start && t < r.end) {
      if (r.__type === "cut") {
        const d = aeWS.getDuration() || 0;
        if (r.end >= d - 0.015) { // coupure jusqu'à la fin → on arrête
          aeWS.pause();
          aeWS.setTime(0);
          aeEl("aePlay")?.classList.remove("is-playing");
          return;
        }
        aeWS.setTime(Math.min(d, r.end + 0.002)); // saute la coupure
        return;
      }
      inSilence = true;
    }
  }
  aeWS.setVolume(inSilence ? 0 : aeEnvGainAt(t));
}

async function openPadRegionsEditor(pad) {
  if (!window.WaveSurfer || !window.WaveSurferRegions) { setStatus("Éditeur indisponible (wavesurfer non chargé)"); return; }
  if (padType(pad) !== "audio") { setStatus("Édition de régions : pads audio uniquement"); return; }
  const blob = await padAudioBlob(pad);
  if (!blob) { setStatus("Pas d'audio à éditer"); return; }
  // Reprise : si le pad est en cours de test dans les Réglages, reprendre au même endroit.
  let resumeAt = null;
  if ((state.audioDialogStartedPad === pad || state.cuePreviewPad === pad) && (pad.source || pad.speechUtterance)) {
    resumeAt = aeEffToOrig(pad, trimStart(pad) + playbackOffset(pad));
  }
  stopAudioDialogStartedPlayback();
  const hadSavedEnv = (pad.envelope || []).length > 0;
  aeDestroy();
  aePad = pad;
  aeHadSavedEnv = hadSavedEnv;
  aeEnvDirty = false;
  aeEl("aeClipTitle").textContent = pad.title || `Pad ${pad.index + 1}`;
  aeEl("aeTotal").textContent = aeEl("aeIn").textContent = aeEl("aeOut").textContent = aeEl("aeSel").textContent = "0:00.000";
  const helpPanel = aeEl("aeHelpPanel");
  if (helpPanel) helpPanel.hidden = true;
  els.audioEditorDialog?.showModal?.();

  aeRegions = window.WaveSurferRegions.create();
  aeEnvelope = window.WaveSurferEnvelope
    ? window.WaveSurferEnvelope.create({
        points: (pad.envelope || []).map((p) => ({ time: p.time, volume: p.volume })),
        lineColor: "rgba(120, 210, 130, 0.95)",
        lineWidth: 3,
        dragPointSize: 14,
        dragPointFill: "#cfe2ff",
        dragPointStroke: "rgba(0,0,0,0.55)",
        dragLine: false,
      })
    : null;
  const plugins = aeEnvelope ? [aeRegions, aeEnvelope] : [aeRegions];
  aeWS = window.WaveSurfer.create({
    container: "#aeWave", url: URL.createObjectURL(blob), plugins,
    waveColor: "#3a9bff", progressColor: "#2f7fd6", cursorColor: "#cfe2ff", cursorWidth: 2,
    barWidth: 2, barGap: 1, barRadius: 2, height: 220, normalize: true, fillParent: true, minPxPerSec: 1, dragToSeek: true,
  });
  if (aeEnvelope) {
    aeEnvelope.setVolume = () => {}; // on pilote le volume d'aperçu nous-mêmes (cut/silence + enveloppe)
    // Édition manuelle (double-clic / glisser un point) → enveloppe "sale" (≠ simple reflet des fades).
    // Garde temporelle pour ignorer les changements issus de nos propres setPoints (seeding, throttlés ~200 ms).
    aeEnvelope.on("points-change", () => { if (aeReady && performance.now() - aeSeedAt > 300) aeEnvDirty = true; });
  }
  aeRegions.on("region-created", (r) => { if (!aeRestoring && !r.__type) aeDecorate(r, aeNewType); aeUpdateTimes(); aeMaybeReseedFades(); });
  aeRegions.on("region-updated", () => { aeUpdateTimes(); aeMaybeReseedFades(); });
  aeRegions.on("region-removed", () => { aeUpdateTimes(); aeMaybeReseedFades(); });
  aeSetMode("regions");
  aeWS.on("ready", () => {
    aeEl("aeTotal").textContent = aeFmt(aeWS.getDuration());
    aeRestoring = true; // évite la décoration en double via l'événement region-created
    (pad.regions || []).forEach((rg) => {
      const r = aeRegions.addRegion({ start: rg.start, end: rg.end, color: AE_TINT[rg.type] || AE_TINT.cut, drag: true, resize: true });
      aeDecorate(r, rg.type === "silence" ? "silence" : "cut");
    });
    aeRestoring = false;
    requestAnimationFrame(() => { // après layout, sinon le SVG de l'enveloppe n'est pas encore dimensionné
      if (!aeEnvelope || aePad !== pad) return;
      if (!hadSavedEnv) aeSeedFadesIntoEnvelope(pad); // défaut : la courbe reflète les fades du pad
      if ((aeEnvelope.getPoints() || []).length < 2) aeFlatEnvelope(); // sinon le plugin met tout à 0
      aeEnvBaselineSig = aeEnvSig(aeEnvelope.getPoints()); // référence pour détecter une vraie édition
      aeReady = true;
    });
    aeUpdateTimes();
    aeUpdateTrimOverlay();
    // « Appliquer les fades » : actif seulement si le pad a un fade propre (mode "pad").
    const ff = aeEl("aeEnvFromFades");
    if (ff) ff.disabled = !(padOwnFade(pad, "in") || padOwnFade(pad, "out"));
    if (resumeAt != null) {
      const d = aeWS.getDuration() || 0;
      aeWS.setTime(Math.max(0, Math.min(d - 0.05, resumeAt)));
      aeWS.play();
    }
  });
  aeWS.on("play", () => aeEl("aePlay")?.classList.add("is-playing"));
  aeWS.on("pause", () => aeEl("aePlay")?.classList.remove("is-playing"));
  aeWS.on("timeupdate", aeSyncPreview);
  aeWS.on("audioprocess", aeSyncPreview);
  aeWS.on("seeking", aeSyncPreview);
  aeWS.on("zoom", aeUpdateTrimOverlay);
  aeWS.on("scroll", aeUpdateTrimOverlay);
  aeWS.on("redraw", aeUpdateTrimOverlay);
}

async function aeApply() {
  if (aePad && aeRegions) {
    const regions = aeRegions.getRegions()
      .map((r) => ({ type: r.__type === "silence" ? "silence" : "cut", start: +r.start.toFixed(4), end: +r.end.toFixed(4) }))
      .filter((r) => r.end - r.start > 0.01)
      .sort((a, b) => a.start - b.start);
    aePad.regions = regions;
    // Enveloppe : on ne l'enregistre que si l'utilisateur l'a réellement éditée
    // (sinon la courbe = simple reflet des fades → on laisse les fades aux curseurs).
    const userEditedEnv = aeEnvDirty || aeEnvSig(aeEnvelope?.getPoints()) !== aeEnvBaselineSig;
    let envelope = (aeEnvelope?.getPoints() || [])
      .map((p) => ({ time: +Number(p.time).toFixed(4), volume: +Math.min(1, Math.max(0, Number(p.volume))).toFixed(3) }))
      .sort((a, b) => a.time - b.time);
    if (!aeHadSavedEnv && !userEditedEnv) envelope = [];
    else if (!envelope.length || envelope.every((p) => p.volume >= 0.999)) envelope = [];
    aePad.envelope = envelope;
    // S'assurer que le buffer est décodé pour recaler la durée immédiatement (pas seulement à la prochaine lecture).
    if (!aePad.buffer && (aePad.audioStored || aePad.hasDirectAudio)) {
      try { aePad.buffer = await ensurePadAudioDecoded(aePad); } catch {}
    }
    if (aePad.buffer) {
      applyEffectiveBufferState(aePad); // recale durée + waveform + cache reverse
      renderWaveform(aePad);
      updatePadTime(aePad);
      if (state.audioPad === aePad && els.audioDialog?.open) renderAudioDialogWaveform(aePad);
    }
    await savePadMeta(aePad);
    // Keep the audio-dialog draft in sync so a later "Cancel" doesn't revert regions
    if (state.audioMediaDraft && state.audioPad === aePad) {
      state.audioMediaDraft.metaRecord = await dbGet(padMetaKey(aePad));
    }
    const cutN = regions.filter((r) => r.type === "cut").length;
    const silN = regions.filter((r) => r.type === "silence").length;
    setStatus(`Appliqué : ${cutN} coupure(s), ${silN} silence(s)${envelope.length ? `, enveloppe (${envelope.length} pts)` : ""}`, "success");
  }
  els.audioEditorDialog?.close();
  aeDestroy();
}

async function openAudioDialog(pad) {
  const perf = startPerfMeasure("openAudioDialog");
  state.audioPad = pad;
  await ensureSpeechVoices();
  state.audioDraft = audioDraftFromPad(pad);
  state.audioMediaDraft = {
    audioRecord: await dbGet(padAudioKey(pad)),
    metaRecord: await dbGet(padMetaKey(pad)),
  };
  state.audioCrossfadeDraft = {
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
  };
  if (els.applyAudio) els.applyAudio.disabled = false;
  syncAudioDialog(pad, { renderWaveform: false });
  perf.log("preparation complete", { padIndex: pad.index, padType: padType(pad) });
  if (els.audioDialog?.showModal) {
    perf.log("before showModal");
    els.audioDialog.showModal();
    perf.log("after showModal");
    requestAnimationFrame(() => {
      if (state.audioPad !== pad || !els.audioDialog?.open) return;
      renderAudioDialogWaveform(pad);
      perf.log("deferred render complete");
    });
    ensureAudioDialogBufferReady(pad); // décode si besoin → waveform + caractéristiques
  } else {
    setStatus("Réglages audio");
    perf.log("showModal unavailable");
  }
}

// À l'ouverture du dialogue, l'audio peut ne pas être décodé (chargement paresseux) :
// sans buffer, la waveform est vide et le libellé indique « Aucun fichier ». On décode alors.
async function ensureAudioDialogBufferReady(pad) {
  if (pad.buffer || padType(pad) !== "audio") return;
  if (!(pad.audioStored || pad.hasDirectAudio || pad.audioName || pad.audioPath)) return;
  try {
    pad.buffer = await ensurePadAudioDecoded(pad);
  } catch {
    return;
  }
  if (state.audioPad !== pad || !els.audioDialog?.open) return;
  if (els.audioFilePath) els.audioFilePath.textContent = audioCharacteristics(pad);
  updatePadTime(pad);
  renderAudioDialogWaveform(pad);
}

function audioDraftFromPad(pad) {
  return {
    normalizeEnabled: pad.normalizeEnabled,
    normalizedGain: pad.normalizedGain,
    mono: pad.mono,
    loop: pad.loop,
    duckTrigger: pad.duckTrigger,
    reverse: pad.reverse,
    fadeMode: pad.fadeMode,
    fadeInSeconds: pad.fadeInSeconds,
    fadeOutSeconds: pad.fadeOutSeconds,
    pitchSemitones: pad.pitchSemitones,
    pitchFine: pad.pitchFine,
    reverbPreset: pad.reverbPreset,
    reverbWet: pad.reverbWet,
    reverbMode: pad.reverbMode,
    eqMode: pad.eqMode,
    eqLow: pad.eqLow,
    eqMid: pad.eqMid,
    eqHigh: pad.eqHigh,
    startStopMode: pad.startStopMode,
    startStopTag: pad.startStopTag,
    endStartMode: pad.endStartMode,
    endStartTarget: pad.endStartTarget,
    trimStart: pad.trimStart,
    trimEnd: pad.trimEnd,
    textContent: pad.textContent,
    textMode: pad.textMode,
    textName: pad.textName,
    textLang: pad.textLang,
    textGender: pad.textGender,
    textVoiceURI: pad.textVoiceURI,
    textRate: pad.textRate,
  };
}

async function restoreAudioDraft() {
  const pad = state.audioPad;
  const draft = state.audioDraft;
  if (!pad || !draft) return;
  const mediaDraft = state.audioMediaDraft;
  if (mediaDraft) {
    if (mediaDraft.audioRecord) await dbSet(padAudioKey(pad), mediaDraft.audioRecord);
    else await dbDelete(padAudioKey(pad));
    if (mediaDraft.metaRecord) await dbSet(padMetaKey(pad), mediaDraft.metaRecord);
    else await dbDelete(padMetaKey(pad));
  }
  setPadNormalization(pad, draft.normalizeEnabled, draft.normalizedGain);
  setPadLoop(pad, draft.loop);
  if (pad.source) pad.source.loop = pad.loop;
  setPadDuckMode(pad, draft.duckMode ?? (draft.duckTrigger ? "global" : "none"), draft.duckPercent ?? duckPercentValue());
  setPadAudioSettings(pad, draft);
  setPadCrossfade(pad, draft);
  state.audioCrossfadeDraft = null;
  setPadTrim(pad, draft.trimStart, draft.trimEnd);
  setPadTextSettings(pad, draft);
  if (pad.source) refreshPlayingPadOutput(pad);
  applyDucking();
  syncAudioDialog(pad);
  if (mediaDraft) await restorePad(pad);
  else savePadMeta(pad);
}

function openTextDialog(pad = state.audioPad) {
  if (!pad) return;
  state.textPad = pad;
  if (els.textEditor) els.textEditor.value = pad.textContent || "";
  els.textDialog?.showModal?.();
}

function applyTextDialog() {
  const pad = state.textPad || state.audioPad;
  if (!pad) return;
  const text = String(els.textEditor?.value || "").trim();
  setPadAsTextFromControls(pad, text);
  syncAudioDialog(pad);
  savePadMeta(pad);
  els.textDialog?.close();
  state.textPad = null;
}

function setPadAsTextFromControls(pad, text, options = {}) {
  if (!pad) return;
  disposeVideoProjection(pad);
  pad.buffer = null;
  pad.hasDirectAudio = false;
  pad.audioName = "";
  pad.audioPath = "";
  pad.videoName = "";
  pad.videoPath = "";
  dbDelete(padAudioKey(pad)).catch(() => {});

  // Cleared text → become a clean empty pad (reset title + show the [?] marker).
  // forceText keeps the pad in (empty) text mode — used when entering text mode
  // to type, so the editor opens instead of the pad being emptied.
  if (!options.forceText && !String(text || "").trim()) {
    pad.textContent = "";
    pad.textMode = false;
    pad.textName = "";
    pad.textDuration = 0;
    setPadTitle(pad, `Pad ${pad.index + 1}`);
    setPadDuration(pad, 0);
    pad.node.classList.add("is-empty");
    pad.node.classList.remove("is-missing-audio");
    updatePadType(pad);
    renderWaveform(pad);
    updateShortcutIndicators();
    refreshBoardTagFilterOptions();
    refreshCrossfadeTargetOptions();
    return;
  }

  pad.node.classList.remove("is-empty", "is-missing-audio");
  setPadTextSettings(pad, {
    textContent: text,
    textMode: true,
    textName: String(text || "").trim() ? (pad.textName || "Texte saisi") : "",
    textLang: els.audioTextLang?.value || pad.textLang,
    textGender: audioTextGenderValue(pad.textGender),
    textVoiceURI: els.audioTextVoice?.value ?? pad.textVoiceURI,
    textRate: els.audioTextRate?.value || pad.textRate,
  });
  setPadDuration(pad, pad.textDuration);
  updateShortcutIndicators();
  refreshBoardTagFilterOptions();
  refreshCrossfadeTargetOptions();
}

async function clearAudioPadMedia(pad = state.audioPad) {
  if (!pad) return;
  stopPad(pad, false, false, { triggerEnd: false });
  disposeVideoProjection(pad);
  if (padType(pad) === "text") {
    pad.textContent = "";
    pad.textMode = false;
    pad.textName = "";
    pad.textDuration = 0;
    setPadTitle(pad, `Pad ${pad.index + 1}`);
    setPadDuration(pad, 0);
    pad.node.classList.add("is-empty");
    pad.node.classList.remove("is-missing-audio");
    updatePadType(pad);
    updatePadTime(pad);
    renderWaveform(pad);
    await dbDelete(padAudioKey(pad));
    await savePadMeta(pad, { forgetVideo: true });
    syncAudioDialog(pad);
    refreshBoardTagFilterOptions();
    refreshCrossfadeTargetOptions();
    setStatus(`Pad vidé: ${pad.title}`);
    return;
  }
  pad.buffer = null;
  pad.regions = [];
  pad.effectiveBuffer = null;
  pad.effectiveBufferSig = "";
  pad.reversedBufferSource = null;
  pad.hasDirectAudio = false;
  pad.audioName = "";
  pad.audioUid = "";
  pad.audioPath = "";
  pad.audioType = "";
  pad.audioRefIndex = null;
  pad.videoName = "";
  pad.videoPath = "";
  pad.videoType = "";
  pad.videoDuration = 0;
  pad.textContent = "";
  pad.textMode = false;
  pad.textName = "";
  pad.waveformPeaks = [];
  setPadTitle(pad, `Pad ${pad.index + 1}`);
  setPadDuration(pad, 0);
  setPadTrim(pad, 0, 0);
  pad.node.classList.add("is-empty");
  pad.node.classList.remove("is-missing-audio");
  await dbDelete(padAudioKey(pad));
  await savePadMeta(pad, { forgetVideo: true });
  syncAudioDialog(pad);
  refreshBoardTagFilterOptions();
  refreshCrossfadeTargetOptions();
  setStatus(`Média effacé: ${pad.title}`);
}

function cancelTextDialog() {
  els.textDialog?.close();
  state.textPad = null;
}

function openNoteDialog(pad) {
  state.notePad = pad;
  if (els.noteEditor) els.noteEditor.value = pad.noteText || "";
  if (els.noteShowOnStart) els.noteShowOnStart.checked = Boolean(pad.noteShowOnStart);
  if (els.noteShowOnEnd) els.noteShowOnEnd.checked = Boolean(pad.noteShowOnEnd);
  if (els.noteShowRow) els.noteShowRow.hidden = !pad.noteText;
  if (els.noteShowEndRow) els.noteShowEndRow.hidden = !pad.noteText;
  els.noteDialog?.showModal?.();
}

function syncNoteDialogVisibility() {
  if (els.noteShowRow) els.noteShowRow.hidden = !String(els.noteEditor?.value || "").trim();
  if (els.noteShowEndRow) els.noteShowEndRow.hidden = !String(els.noteEditor?.value || "").trim();
}

function applyNoteDialog() {
  const pad = state.notePad;
  if (!pad) return;
  setPadNote(pad, els.noteEditor?.value || "", Boolean(els.noteShowOnStart?.checked), Boolean(els.noteShowOnEnd?.checked));
  savePadMeta(pad);
  els.noteDialog?.close();
  state.notePad = null;
}

function cancelNoteDialog() {
  els.noteDialog?.close();
  state.notePad = null;
}

function refreshPlayingPadOutput(pad) {
  if (!pad?.source || !state.audioContext) return;
  const offset = playbackOffset(pad);
  playPad(pad, false, offset, { skipStartCrossfade: true }).catch(() => setStatus("Réglage audio impossible"));
}

function resetAudioDialogSettings() {
  const pad = state.audioPad;
  if (!pad) return;
  const hadEditorEdits = (pad.regions?.length || 0) > 0 || (pad.envelope?.length || 0) > 0;
  const message = hadEditorEdits
    ? "Réinitialiser tous les réglages audio de ce pad ?\n\nLes régions (cut / silence) et l'enveloppe de volume de l'éditeur seront aussi supprimées."
    : "Réinitialiser tous les réglages audio de ce pad ?";
  if (!window.confirm(message)) return;
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
    duckMode: "global",
    duckPercent: duckPercentValue(),
    eqMode: "global",
    eqLow: 0,
    eqMid: 0,
    eqHigh: 0,
    mono: false,
    reverse: false,
  });
  setPadNormalization(pad, true, pad.normalizedGain);
  setPadLoop(pad, false);
  setPadCrossfade(pad, {
    startStopMode: "none",
    startStopTag: "",
    endStartMode: "none",
    endStartTarget: "",
  });
  if (pad.textMode || pad.textContent) {
    setPadTextSettings(pad, {
      textLang: "fr-FR",
      textGender: "female",
      textVoiceURI: "",
      textRate: DEFAULT_TEXT_RATE,
    });
  }
  setPadTrim(pad, 0, 0);
  // Réinitialise aussi l'éditeur : régions (cut/silence) + enveloppe.
  pad.regions = [];
  pad.envelope = [];
  pad.effectiveBuffer = null;
  pad.effectiveBufferSig = "";
  pad.reversedBufferSource = null;
  if (pad.buffer) applyEffectiveBufferState(pad);
  state.audioCrossfadeDraft = {
    startStopMode: "none",
    startStopTag: "",
    endStartMode: "none",
    endStartTarget: "",
  };
  syncAudioDialog(pad);
  savePadMeta(pad);
  if (hadEditorEdits) setStatus("Éditeur audio réinitialisé : régions et enveloppe supprimées", "success");
}

function applyDefaultMasterAudioSettings(showStatus = true, includeVolumes = false) {
  if (els.masterFadeInEnabled) els.masterFadeInEnabled.checked = false;
  if (els.masterFadeOutEnabled) els.masterFadeOutEnabled.checked = true;
  if (els.masterDuckEnabled) els.masterDuckEnabled.checked = true;
  if (els.armedCrossfadeEnabled) els.armedCrossfadeEnabled.checked = true;
  if (els.fadeInSeconds) els.fadeInSeconds.value = "2";
  if (els.fadeSeconds) els.fadeSeconds.value = "2";
  if (els.armedCrossfadeSeconds) els.armedCrossfadeSeconds.value = "2";
  if (els.duckPercent) els.duckPercent.value = "60";
  if (els.endingAlertSeconds) els.endingAlertSeconds.value = String(DEFAULT_ENDING_ALERT_SECONDS);
  if (els.masterReverbPreset) els.masterReverbPreset.value = "none";
  if (els.masterReverbWet) els.masterReverbWet.value = "0.5";
  if (els.masterEqLow) els.masterEqLow.value = "0";
  if (els.masterEqMid) els.masterEqMid.value = "0";
  if (els.masterEqHigh) els.masterEqHigh.value = "0";
  localStorage.setItem(MASTER_FADE_IN_ENABLED_STORAGE, "off");
  localStorage.setItem(MASTER_FADE_OUT_ENABLED_STORAGE, "off");
  localStorage.setItem(MASTER_DUCK_ENABLED_STORAGE, "on");
  localStorage.setItem(ARMED_CROSSFADE_ENABLED_STORAGE, "on");
  localStorage.setItem(FADE_IN_STORAGE, "2");
  localStorage.setItem(FADE_OUT_STORAGE, "2");
  localStorage.setItem(ARMED_CROSSFADE_SECONDS_STORAGE, "2");
  localStorage.setItem(DUCKING_STORAGE, "60");
  localStorage.setItem(ENDING_ALERT_STORAGE, String(DEFAULT_ENDING_ALERT_SECONDS));
  updateEndingAlertHint();
  if (includeVolumes) {
    setMasterVolume(DEFAULT_MASTER_VOLUME, true);
    setCueVolume(DEFAULT_CUE_VOLUME, true);
  }
  saveMasterReverbSettings();
  saveMasterEqSettings();
  updateMasterReverbValue();
  applyMasterReverb();
  applyMasterEq();
  applyDucking();
  syncArmedCrossfadeControls();
  updateMasterOptionBadges();
  if (showStatus) setStatus("Audio master réinitialisé");
}

function resetMasterAudioSettings() {
  applyDefaultMasterAudioSettings(true, true);
}

function masterAudioDraftFromControls() {
  return {
    fadeInEnabled: Boolean(els.masterFadeInEnabled?.checked),
    fadeOutEnabled: Boolean(els.masterFadeOutEnabled?.checked),
    duckEnabled: Boolean(els.masterDuckEnabled?.checked),
    armedCrossfadeEnabled: Boolean(els.armedCrossfadeEnabled?.checked),
    fadeInSeconds: els.fadeInSeconds?.value ?? "2",
    fadeOutSeconds: els.fadeSeconds?.value ?? "2",
    armedCrossfadeSeconds: els.armedCrossfadeSeconds?.value ?? "2",
    duckPercent: els.duckPercent?.value ?? "60",
    endingAlertSeconds: els.endingAlertSeconds?.value ?? String(DEFAULT_ENDING_ALERT_SECONDS),
    reverbPreset: els.masterReverbPreset?.value || "none",
    reverbWet: els.masterReverbWet?.value ?? "0.5",
    eqLow: els.masterEqLow?.value ?? "0",
    eqMid: els.masterEqMid?.value ?? "0",
    eqHigh: els.masterEqHigh?.value ?? "0",
  };
}

function persistMasterAudioControls() {
  localStorage.setItem(MASTER_FADE_IN_ENABLED_STORAGE, els.masterFadeInEnabled?.checked ? "on" : "off");
  localStorage.setItem(MASTER_FADE_OUT_ENABLED_STORAGE, els.masterFadeOutEnabled?.checked ? "on" : "off");
  localStorage.setItem(MASTER_DUCK_ENABLED_STORAGE, els.masterDuckEnabled?.checked ? "on" : "off");
  localStorage.setItem(ARMED_CROSSFADE_ENABLED_STORAGE, els.armedCrossfadeEnabled?.checked ? "on" : "off");
  localStorage.setItem(FADE_IN_STORAGE, String(els.fadeInSeconds?.value ?? "2"));
  localStorage.setItem(FADE_OUT_STORAGE, String(els.fadeSeconds?.value ?? "2"));
  localStorage.setItem(ARMED_CROSSFADE_SECONDS_STORAGE, String(els.armedCrossfadeSeconds?.value ?? "2"));
  localStorage.setItem(DUCKING_STORAGE, String(els.duckPercent?.value ?? "60"));
  localStorage.setItem(ENDING_ALERT_STORAGE, String(els.endingAlertSeconds?.value ?? DEFAULT_ENDING_ALERT_SECONDS));
  updateEndingAlertHint();
  saveMasterReverbSettings();
  saveMasterEqSettings();
  updateMasterReverbValue();
  applyMasterReverb();
  applyMasterEq();
  applyDucking();
  syncArmedCrossfadeControls();
  updateMasterOptionBadges();
  updateAllPadAlerts();
}

function restoreMasterAudioDraft() {
  const draft = state.masterAudioDraft;
  if (!draft) return;
  if (els.masterFadeInEnabled) els.masterFadeInEnabled.checked = draft.fadeInEnabled;
  if (els.masterFadeOutEnabled) els.masterFadeOutEnabled.checked = draft.fadeOutEnabled;
  if (els.masterDuckEnabled) els.masterDuckEnabled.checked = draft.duckEnabled;
  if (els.armedCrossfadeEnabled) els.armedCrossfadeEnabled.checked = draft.armedCrossfadeEnabled;
  if (els.fadeInSeconds) els.fadeInSeconds.value = draft.fadeInSeconds;
  if (els.fadeSeconds) els.fadeSeconds.value = draft.fadeOutSeconds;
  if (els.armedCrossfadeSeconds) els.armedCrossfadeSeconds.value = draft.armedCrossfadeSeconds;
  if (els.duckPercent) els.duckPercent.value = draft.duckPercent;
  if (els.endingAlertSeconds) els.endingAlertSeconds.value = draft.endingAlertSeconds;
  if (els.masterReverbPreset) els.masterReverbPreset.value = draft.reverbPreset;
  if (els.masterReverbWet) els.masterReverbWet.value = draft.reverbWet;
  if (els.masterEqLow) els.masterEqLow.value = draft.eqLow;
  if (els.masterEqMid) els.masterEqMid.value = draft.eqMid;
  if (els.masterEqHigh) els.masterEqHigh.value = draft.eqHigh;
  persistMasterAudioControls();
}

function syncImageDialog(pad = state.imagePad) {
  if (!pad) return;
  const livePadRect = pad.node?.getBoundingClientRect();
  if (document.body.dataset.skin === "basic") {
    els.imageDialog?.style.setProperty("--image-pad-aspect", "1 / 1");
  } else if (livePadRect?.width && livePadRect?.height) {
    els.imageDialog?.style.setProperty("--image-pad-aspect", `${livePadRect.width} / ${livePadRect.height}`);
  }
  const mode = state.imageDialogMode || "color";
  els.imageDialog?.classList.toggle("is-color-mode", mode === "color");
  els.imageDialog?.classList.toggle("is-image-mode", mode === "image");
  els.imageDialog?.classList.toggle("is-sketch-mode", mode === "sketch");
  els.imageColorToggle?.classList.toggle("is-active", mode === "color");
  els.imageLibrary?.classList.toggle("is-active", mode === "image");
  els.imageCamera?.classList.toggle("is-active", mode === "image");
  els.imageSketch?.classList.toggle("is-active", mode === "sketch");
  if (els.imageColorFrame) els.imageColorFrame.hidden = mode !== "color";
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
  const perf = startPerfMeasure("openImageDialog");
  state.imagePad = pad;
  state.imageDraft = imageDraftFromPad(pad);
  if (pad.visualImage && pad.visualKind === "sketch") {
    state.imageDialogMode = "sketch";
  } else if (pad.visualImage && pad.visualKind === "image") {
    state.imageDialogMode = "image";
  } else {
    state.imageDialogMode = "color";
  }
  syncImageDialog(pad);
  perf.log("preparation complete", { padIndex: pad.index });
  if (els.imageDialog?.showModal) {
    perf.log("before showModal");
    els.imageDialog.showModal();
    perf.log("after showModal");
    if (state.imageDialogMode === "sketch") openSketchMode(pad);
    perf.log("deferred render complete");
  } else {
    pad.imageInput?.click();
    perf.log("showModal unavailable");
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

function initSketchCanvas() {
  const canvas = els.imageSketchCanvas;
  if (!canvas) return null;
  canvas.width = 640;
  canvas.height = 640;
  els.imageDialog?.style.setProperty("--image-pad-aspect", "1 / 1");
  const ctx = canvas.getContext("2d");
  ctx.lineCap = "round";
  return ctx;
}

function syncSketchTools() {
  els.sketchColorBtns.forEach((btn) => {
    btn.classList.toggle("is-active", !state.sketchEraser && btn.dataset.sketchColor === state.sketchColor);
  });
  els.sketchSizeBtns.forEach((btn) => {
    btn.classList.toggle("is-active", Number(btn.dataset.sketchSize) === state.sketchSize);
  });
  els.sketchEraserBtn?.classList.toggle("is-active", state.sketchEraser);
  els.sketchEraserBtn?.setAttribute("aria-pressed", String(state.sketchEraser));
}

function bindSketchTools() {
  els.sketchColorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sketchColor = btn.dataset.sketchColor;
      state.sketchEraser = false;
      syncSketchTools();
    });
  });
  els.sketchSizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sketchSize = Number(btn.dataset.sketchSize);
      syncSketchTools();
    });
  });
  els.sketchEraserBtn?.addEventListener("click", () => {
    state.sketchEraser = !state.sketchEraser;
    syncSketchTools();
  });
}

function clearSketchCanvas() {
  const canvas = els.imageSketchCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#111319";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function openSketchMode(pad) {
  setImageDialogMode("sketch");
  syncSketchTools();
  const canvas = els.imageSketchCanvas;
  const ctx = initSketchCanvas();
  if (!ctx || !canvas) return;
  if (pad?.visualKind === "sketch" && pad.visualImage) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = pad.visualImage;
  } else {
    clearSketchCanvas();
    if (pad) {
      setPadVisualImage(pad, canvas.toDataURL("image/png"), false, { visualKind: "sketch" });
      syncImageDialog(pad);
      savePadMeta(pad);
    }
  }
}

function bindImageSketch() {
  const canvas = els.imageSketchCanvas;
  if (!canvas) return;

  canvas.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineWidth = state.sketchEraser ? Math.max(state.sketchSize * 2.5, 20) : state.sketchSize;
    ctx.strokeStyle = state.sketchEraser ? "#111319" : state.sketchColor;
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
    const ctx = canvas.getContext("2d");
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
  els.imageSketch?.addEventListener("click", () => openSketchMode(state.imagePad));
}

function playbackOffset(pad) {
  const duration = playableDuration(pad);
  if (!duration) return 0;
  if (pad?.speechUtterance) {
    if (pad.isPaused) return Math.min(duration, Math.max(0, pad.resumeOffset || 0));
    const elapsed = Math.max(0, performance.now() / 1000 - pad.startedAt);
    return pad.loop ? elapsed % duration : Math.min(duration, elapsed);
  }
  if (pad.videoName) {
    const video = videoElementForPad(pad);
    if (video) return Math.min(duration, Math.max(0, video.currentTime || 0));
    return Math.min(duration, Math.max(0, pad.resumeOffset || 0));
  }
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

function setDisabledField(element, disabled) {
  if (!element) return;
  element.disabled = disabled;
  element.closest("label")?.classList.toggle("is-disabled", disabled);
}

function setAudioSectionUnavailable(selector, unavailable) {
  const section = els.audioDialog?.querySelector(selector);
  if (!section) return;
  section.classList.toggle("is-unavailable", unavailable);
  section.setAttribute("aria-disabled", String(unavailable));
  section.querySelectorAll("input, select, button").forEach((control) => {
    control.disabled = unavailable;
  });
}

function setAudioSectionHidden(selector, hidden) {
  const section = els.audioDialog?.querySelector(selector);
  if (!section) return;
  section.hidden = Boolean(hidden);
}

function syncAudioDialogMediaAvailability(pad) {
  const isVideo = padType(pad) === "video";
  const isText = padType(pad) === "text";
  els.audioDialog?.classList.toggle("is-video-pad", isVideo);
  els.audioDialog?.classList.toggle("is-text-pad", isText);
  setAudioSectionUnavailable('[aria-label="Waveform et trim"]', isVideo);
  setAudioSectionUnavailable('[aria-label="Normalisation"]', isText);
  setAudioSectionUnavailable('[aria-label="Pitch"]', isVideo || isText);
  setAudioSectionUnavailable('[aria-label="Reverb"]', isVideo || isText);
  setAudioSectionUnavailable('[aria-label="Égalisation audio pad"]', isVideo || isText);
  setAudioSectionUnavailable('[aria-label="Fades"]', isText);
  setDisabledField(els.audioNormalize, isVideo || isText);
  setDisabledField(els.audioMono, isVideo || isText || Boolean(pad?.buffer?.numberOfChannels === 1));
  setDisabledField(els.audioReverse, isVideo || isText);
  // Vidéo : le cadre waveform, le trim auto, le bouton lire et l'éditeur audio sont
  // MASQUÉS via CSS (.audio-dialog.is-video-pad …, classe posée juste au-dessus) — ces
  // outils agissent sur un buffer audio, absent en vidéo. Le CSS gère le masquage car
  // .icon-button{display:grid} / .audio-section{display:grid} et le style inline du
  // conteneur battent l'attribut [hidden]. Le reste du dialogue (volume, mute, loop,
  // ducking, fades, crossfade…) reste valable pour la vidéo.
  setAudioSectionHidden('[aria-label="Waveform et trim"]', false);
  setAudioSectionHidden('[aria-label="Normalisation"]', isText);
  setAudioSectionHidden('[aria-label="Pitch"]', isText);
  setAudioSectionHidden('[aria-label="Reverb"]', isText);
  setAudioSectionHidden('[aria-label="Égalisation audio pad"]', isText);
  setAudioSectionHidden('[aria-label="Fades"]', isText);
  setAudioSectionHidden('.audio-text-section', !isText);
  if (els.audioTextEditorFrame) {
    els.audioTextEditorFrame.hidden = !isText;
  }
  if (els.audioWaveform) els.audioWaveform.hidden = isText;
  els.audioDialog?.querySelector(".trim-values")?.toggleAttribute("hidden", isText);
}

function seekPadToRatio(pad, ratio) {
  const duration = playableDuration(pad);
  if (!duration) return;
  const offset = Math.min(duration, Math.max(0, ratio * duration));
  pad.resumeOffset = offset;
  updatePadProgress(pad);
  if (state.cuePreviewPad === pad && state.cuePreviewAudio) {
    try {
      state.cuePreviewAudio.currentTime = offset;
    } catch {}
    updatePadProgress(pad);
    updatePadTime(pad);
    return;
  }
  if (pad.videoName) {
    const video = videoElementForPad(pad);
    if (video) video.currentTime = offset;
    updatePadTime(pad);
    return;
  }
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
  return duckPercentValue() / 100;
}

function duckPercentValue() {
  return Math.min(100, Math.max(0, Math.round(Number(els.duckPercent?.value) || 0)));
}

function duckAmountForSource(pad) {
  if (!pad?.duckTrigger || pad.duckMode === "none") return 0;
  if (pad.duckMode === "pad") {
    return Math.min(100, Math.max(0, Number(pad.duckPercent) || 0)) / 100;
  }
  return duckAmount();
}

function duckFactorForPad(pad) {
  const sourceDuckAmount = state.pads.reduce((max, other) => {
    if (other === pad || !isPadPlaying(other)) return max;
    return Math.max(max, duckAmountForSource(other));
  }, 0);
  const hasCrossfadeDuck = [...state.crossfadeDucks.values()].some((targets) => targets.has(pad));
  const amount = hasCrossfadeDuck ? Math.max(sourceDuckAmount, duckAmount()) : sourceDuckAmount;
  return Math.max(0, 1 - amount);
}

function targetPadGain(pad) {
  if (pad.muted) return 0.0001;
  return pad.volume * (pad.normalizeEnabled ? pad.normalizedGain : 1) * duckFactorForPad(pad);
}

function fadeDurationForPad(pad, type = "out") {
  if (padType(pad) === "text") return 0;
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

function manualCrossfadeDuration() {
  const value = Number(els.armedCrossfadeSeconds?.value);
  return Number.isFinite(value) ? Math.max(0, value) : 2;
}

function applyDucking(exceptPad = null) {
  const now = state.audioContext?.currentTime || 0;
  state.pads.forEach((pad) => {
    if (pad === exceptPad) return;
    if (state.audioContext && pad.source && pad.gain) {
      pad.gain.gain.cancelScheduledValues(now);
      pad.gain.gain.setTargetAtTime(targetPadGain(pad), now, 0.035);
    }
    if (pad.videoWindow) syncVideoProjectionAudio(pad);
    if (pad.speechUtterance && !pad.isPaused) pad.speechUtterance.volume = speechTargetVolume(pad);
  });
  updateAllPadAlerts();
}

function setCrossfadeDuck(sourceKey, targets, durationSeconds = 0) {
  clearCrossfadeDuck(sourceKey, false);
  const activeTargets = targets.filter((pad) => isPadPlaying(pad));
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
  if (value.startsWith("pad:")) {
    const raw = value.slice(4);
    const byUid = state.pads.find((pad) => pad !== exceptPad && pad.uid === raw);
    if (byUid) return byUid;
    const index = Number(raw);
    const legacyPad = Number.isInteger(index) ? state.pads[index] : null;
    return legacyPad && legacyPad !== exceptPad ? legacyPad : null;
  }
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
    const raw = value.slice(4);
    const index = Number(raw);
    const targetPad = state.pads.find((pad) => pad.uid === raw) || (Number.isInteger(index) ? state.pads[index] : null);
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
  el.classList.remove("is-crossfade-start", "is-crossfade-stop", "is-crossfade-demute", "is-crossfade-flashing");
  void el.offsetWidth;
  const className = stateName === "start"
    ? "is-crossfade-start"
    : stateName === "demute"
      ? "is-crossfade-demute"
      : "is-crossfade-stop";
  el.classList.add(className, "is-crossfade-flashing");
  window.setTimeout(() => {
    el.classList.remove("is-crossfade-start", "is-crossfade-stop", "is-crossfade-demute", "is-crossfade-flashing");
    if (pad.muted) el.classList.add("is-crossfade-muted");
  }, 3300);
}

function setPadMuted(pad, muted, pulse = true) {
  if (!pad) return;
  pad.muted = Boolean(muted);
  if (pad.speechUtterance) {
    if (pad.muted && !pad.speechMutedPause) {
      pad.speechMutedPause = true;
      window.speechSynthesis?.pause?.();
    } else if (!pad.muted && pad.speechMutedPause) {
      const offset = playbackOffset(pad);
      pad.speechMutedPause = false;
      if (offset >= playableDuration(pad)) {
        window.speechSynthesis?.cancel?.();
        clearSpeechPad(pad, true);
      } else {
        speakPadTextFromOffset(pad, offset);
      }
    } else {
      pad.speechUtterance.volume = speechTargetVolume(pad);
    }
  }
  if (pad.gain && state.audioContext) {
    const now = state.audioContext.currentTime;
    pad.gain.gain.cancelScheduledValues(now);
    pad.gain.gain.setTargetAtTime(targetPadGain(pad), now, 0.025);
  }
  if (pad.videoWindow) syncVideoProjectionAudio(pad);
  pad.crossfadeFlashEl?.classList.toggle("is-crossfade-muted", pad.muted);
  pad.muteEl?.classList.toggle("is-active", pad.muted);
  pad.muteEl?.setAttribute("aria-pressed", String(pad.muted));
  if (pulse) flashCrossfadeTarget(pad, pad.muted ? "stop" : "demute");
  updatePadAlerts(pad);
}

function clearPadMuteState(pad) {
  if (!pad?.muted) return;
  pad.muted = false;
  if (pad.speechMutedPause && pad.speechUtterance && !pad.isPaused) {
    window.speechSynthesis?.resume?.();
  }
  pad.speechMutedPause = false;
  if (pad.speechUtterance) {
    pad.speechUtterance.volume = speechTargetVolume(pad);
  }
  if (pad.videoWindow) syncVideoProjectionAudio(pad);
  pad.crossfadeFlashEl?.classList.remove("is-crossfade-muted");
  pad.muteEl?.classList.remove("is-active");
  pad.muteEl?.setAttribute("aria-pressed", "false");
  updatePadAlerts(pad);
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
    if (action === "play" && (targetPad.buffer || targetPad.videoName || targetPad.textMode || targetPad.textContent)) {
      flashCrossfadeTarget(targetPad, "start");
      playPad(targetPad, true, 0, { skipStartCrossfade: true }).catch(() => setStatus("Crossfade impossible"));
    }
    if (action === "mute") {
      setPadMuted(targetPad, !targetPad.muted, true);
    }
    if (action === "stop" && isPadPlaying(targetPad)) {
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

function audioPadsCurrentlyPlaying() {
  return state.pads.filter((pad) => padType(pad) === "audio" && pad?.source && isPadPlaying(pad));
}

function manualCrossfadeSourcePad() {
  return state.pads.find((pad) => pad.uid === state.crossfadeArm.sourcePadUid) || null;
}

function isManualCrossfadeSourceCandidate(pad) {
  return Boolean(padType(pad) === "audio" && pad?.source && isPadPlaying(pad));
}

function isManualCrossfadeAudioTarget(pad, sourcePad = manualCrossfadeSourcePad()) {
  return Boolean(
    pad
    && pad !== sourcePad
    && padType(pad) === "audio"
    && !isPadPlaying(pad)
    && (pad.buffer || pad.audioStored || pad.audioName || pad.audioPath)
  );
}

function manualCrossfadeTargetsFor(sourcePad) {
  return state.pads.filter((pad) => isManualCrossfadeAudioTarget(pad, sourcePad));
}

function syncManualCrossfadeUi() {
  const armed = Boolean(state.crossfadeArm.active);
  const phase = state.crossfadeArm.phase;
  const sourcePad = manualCrossfadeSourcePad();
  document.body.classList.toggle("crossfade-armed", armed);
  document.body.classList.toggle("crossfade-source-choice", armed && phase === "source");
  document.body.classList.toggle("crossfade-target-choice", armed && phase === "target");
  document.body.dataset.crossfadePrompt = armed
    ? (phase === "source" ? "Étape 1/2 : choisissez la source à fondre" : "Étape 2/2 : choisissez la cible audio")
    : "";
  const buttonActive = armed || document.body.classList.contains("show-cables");
  els.showCables?.classList.toggle("is-active", buttonActive);
  els.showCables?.setAttribute("aria-pressed", String(buttonActive));
  els.showCables?.setAttribute("aria-label", armed ? "Annuler crossfade armé" : "Armer crossfade manuel");
  if (!els.showCables?.disabled) {
    els.showCables?.setAttribute("title", armed ? "Annuler crossfade armé" : "Armer crossfade manuel");
  }
  state.pads.forEach((pad) => {
    const isSourceCandidate = armed && phase === "source" && isManualCrossfadeSourceCandidate(pad);
    const isSource = armed && phase === "target" && pad === sourcePad;
    const isTarget = armed && phase === "target" && isManualCrossfadeAudioTarget(pad, sourcePad);
    pad.node?.classList.toggle("is-crossfade-source", isSource);
    pad.node?.classList.toggle("is-crossfade-source-candidate", isSourceCandidate);
    pad.node?.classList.toggle("is-crossfade-target", isTarget);
    pad.node?.classList.toggle("is-crossfade-unavailable", armed && phase === "target" && !isSource && !isTarget);
  });
}

function cancelManualCrossfade(options = {}) {
  const wasArmed = Boolean(state.crossfadeArm.active);
  state.crossfadeArm = {
    active: false,
    phase: "target",
    sourcePadUid: null,
  };
  syncManualCrossfadeUi();
  if (wasArmed && !options.silent) {
    setStatus(options.message || "Crossfade annulé");
  }
}

function armManualCrossfade() {
  if (!cuesEnabledForManualCrossfade()) {
    setStatus("Activer les cues pour armer le crossfade manuel.");
    return;
  }
  if (!armedCrossfadeAvailable()) {
    setStatus("Crossfade armé désactivé");
    return;
  }
  if (state.crossfadeArm.active) {
    cancelManualCrossfade();
    return;
  }

  const sourcePads = audioPadsCurrentlyPlaying();
  if (!sourcePads.length) {
    setStatus("Aucun pad audio en lecture.");
    return;
  }

  setCableOverlayVisible(false);
  if (sourcePads.length > 1) {
    state.crossfadeArm = {
      active: true,
      phase: "source",
      sourcePadUid: null,
    };
    syncManualCrossfadeUi();
    setStatus("Étape 1/2 : choisissez le pad source à fondre parmi les pads en lecture.", "progress");
    return;
  }

  const [sourcePad] = sourcePads;
  if (!manualCrossfadeTargetsFor(sourcePad).length) {
    setStatus("Aucune cible audio disponible.");
    return;
  }
  state.crossfadeArm = {
    active: true,
    phase: "target",
    sourcePadUid: sourcePad.uid,
  };
  syncManualCrossfadeUi();
  setStatus("Étape 2/2 : choisissez le pad cible audio.", "progress");
}

function chooseManualCrossfadeSource(sourcePad) {
  if (!state.crossfadeArm.active || state.crossfadeArm.phase !== "source") return false;
  if (!isManualCrossfadeSourceCandidate(sourcePad)) {
    setStatus("Choisissez un pad audio en lecture.");
    return true;
  }
  if (!manualCrossfadeTargetsFor(sourcePad).length) {
    setStatus("Aucune cible audio disponible.");
    return true;
  }
  state.crossfadeArm = {
    active: true,
    phase: "target",
    sourcePadUid: sourcePad.uid,
  };
  syncManualCrossfadeUi();
  setStatus(`Source sélectionnée : ${sourcePad.title}. Étape 2/2 : choisissez le pad cible audio.`, "progress");
  return true;
}

async function executeManualCrossfade(targetPad) {
  const sourcePad = manualCrossfadeSourcePad();
  if (!state.crossfadeArm.active || state.crossfadeArm.phase !== "target" || !sourcePad) return;

  if (!isPadPlaying(sourcePad) || !sourcePad.source) {
    cancelManualCrossfade({ message: "Crossfade annulé : source arrêtée" });
    return;
  }

  if (targetPad === sourcePad) {
    cancelManualCrossfade();
    return;
  }

  if (isManualCrossfadeSourceCandidate(targetPad)) {
    setStatus("Un pad audio en lecture ne peut pas être cible du crossfade armé.");
    return;
  }

  if (!isManualCrossfadeAudioTarget(targetPad, sourcePad)) {
    setStatus(padType(targetPad) === "audio"
      ? "Pad cible indisponible : crossfade manuel impossible."
      : "Cible non audio : crossfade manuel indisponible.");
    return;
  }

  const duration = manualCrossfadeDuration();
  try {
    await ensurePadAudioDecoded(targetPad);
  } catch {
    targetPad.node?.classList.add("is-missing-audio");
    cancelManualCrossfade({ message: "Audio cible manquant : crossfade annulé." });
    return;
  }

  cancelManualCrossfade({ silent: true });
  flashCrossfadeTarget(targetPad, "start");
  flashCrossfadeTarget(sourcePad, "stop");
  try {
    await playPad(targetPad, true, 0, { skipStartCrossfade: true, fadeInSecondsOverride: duration });
    stopPad(sourcePad, true, false, { triggerEnd: false, fadeOutSecondsOverride: duration });
    setStatus(`Crossfade : ${sourcePad.title} → ${targetPad.title}`, "success");
  } catch {
    setStatus("Crossfade impossible", "stop");
  }
}

function handleManualCrossfadePadClick(pad, event) {
  if (!state.crossfadeArm.active) return false;
  if (event.target.closest("input, select, textarea, dialog, .pad-progress")) return false;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation?.();
  if (state.crossfadeArm.phase === "source") {
    chooseManualCrossfadeSource(pad);
  } else {
    executeManualCrossfade(pad);
  }
  return true;
}

function cableColor(action) {
  if (action === "play") return "#49d3a0";
  if (action === "stop") return "#ff5f56";
  if (action === "duck") return "#f6c451";
  if (action === "mute") return "#8b7cff";
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
    const raw = target.slice(4);
    const index = Number(raw);
    const pad = state.pads.find((item) => item.uid === raw) || (Number.isInteger(index) ? state.pads[index] : null);
    return pad && pad !== exceptPad ? pad.title : `Pad ${Number.isInteger(index) ? index + 1 : "-"}`;
  }
  const pad = padFromTarget(target, exceptPad);
  return pad ? pad.title : target;
}

function cableActionLabel(action) {
  if (action === "play") return "Lance";
  if (action === "stop") return "Stoppe";
  if (action === "duck") return "Duck";
  if (action === "mute") return "Mute/demute";
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
  const perf = startPerfMeasure("openPatchBayDialog");
  renderPatchBay();
  perf.log("preparation complete");
  if (els.patchBayDialog?.showModal) {
    perf.log("before showModal");
    els.patchBayDialog.showModal();
    perf.log("after showModal");
    requestAnimationFrame(() => {
      drawPatchBayOverlay();
      perf.log("deferred render complete");
    });
  } else {
    perf.log("showModal unavailable");
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
  if (visible) drawCableOverlay();
  if (!visible) {
    els.pads?.closest(".deck")?.style.removeProperty("--cable-extra-bottom");
    if (els.cableLegend) {
      els.cableLegend.style.left = "";
      els.cableLegend.style.top = "";
    }
  }
  syncManualCrossfadeUi();
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
  const savedArmedCrossfadeEnabled = localStorage.getItem(ARMED_CROSSFADE_ENABLED_STORAGE);
  if (els.masterFadeInEnabled) els.masterFadeInEnabled.checked = savedFadeInEnabled == null ? false : savedFadeInEnabled === "on";
  if (els.masterFadeOutEnabled) els.masterFadeOutEnabled.checked = savedFadeOutEnabled == null ? true : savedFadeOutEnabled === "on";
  if (els.masterDuckEnabled) els.masterDuckEnabled.checked = savedDuckEnabled == null ? true : savedDuckEnabled === "on";
  if (els.armedCrossfadeEnabled) els.armedCrossfadeEnabled.checked = savedArmedCrossfadeEnabled == null ? true : savedArmedCrossfadeEnabled === "on";
  if (els.armedCrossfadeSeconds) els.armedCrossfadeSeconds.value = localStorage.getItem(ARMED_CROSSFADE_SECONDS_STORAGE) || els.armedCrossfadeSeconds.value || "2";
  syncArmedCrossfadeControls();
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

function masterEqSettings() {
  return {
    low: clampEqGain(els.masterEqLow?.value),
    mid: clampEqGain(els.masterEqMid?.value),
    high: clampEqGain(els.masterEqHigh?.value),
  };
}

function saveMasterEqSettings() {
  localStorage.setItem(MASTER_EQ_STORAGE, JSON.stringify(masterEqSettings()));
}

function loadMasterEqSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(MASTER_EQ_STORAGE)) || {};
  } catch {
    saved = {};
  }
  if (els.masterEqLow) els.masterEqLow.value = String(clampEqGain(saved.low));
  if (els.masterEqMid) els.masterEqMid.value = String(clampEqGain(saved.mid));
  if (els.masterEqHigh) els.masterEqHigh.value = String(clampEqGain(saved.high));
  updateMasterEqValues();
}

function updateEqOutput(output, value) {
  if (!output) return;
  const gain = clampEqGain(value);
  output.textContent = `${gain > 0 ? "+" : ""}${gain} dB`;
}

function updateMasterEqValues() {
  updateEqOutput(els.masterEqLowValue, els.masterEqLow?.value);
  updateEqOutput(els.masterEqMidValue, els.masterEqMid?.value);
  updateEqOutput(els.masterEqHighValue, els.masterEqHigh?.value);
  updateMasterOptionBadges();
}

function updateAudioEqValues(pad = state.audioPad) {
  updateEqOutput(els.audioEqLowValue, pad?.eqLow ?? els.audioEqLow?.value);
  updateEqOutput(els.audioEqMidValue, pad?.eqMid ?? els.audioEqMid?.value);
  updateEqOutput(els.audioEqHighValue, pad?.eqHigh ?? els.audioEqHigh?.value);
}

function applyMasterEq() {
  updateMasterEqValues();
  if (!state.audioContext || !state.masterEqLow || !state.masterEqMid || !state.masterEqHigh) return;
  configureEqFilter(state.masterEqLow, "lowshelf", 160, 0);
  configureEqFilter(state.masterEqMid, "peaking", 1000, 0, 1);
  configureEqFilter(state.masterEqHigh, "highshelf", 6000, 0);
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

// Programme l'enveloppe de volume (pad.envelope, points {time,volume} en temps d'origine)
// sur un gain dédié, sur la fenêtre réellement jouée (trim), en tenant compte du reverse.
function scheduleEnvelopeGain(pad, envGain, now, startOffset, segStart, segEnd, baseDuration) {
  const pts = (pad.envelope || [])
    .map((p) => ({ t: Math.max(0, Math.min(baseDuration, origToEffTime(pad, p.time))), v: Math.min(1, Math.max(0, p.volume)) }))
    .sort((a, b) => a.t - b.t);
  if (!pts.length) return;
  const envAt = (t) => {
    if (t <= pts[0].t) return pts[0].v;
    for (let i = 0; i < pts.length - 1; i += 1) {
      const a = pts[i]; const b = pts[i + 1];
      if (t >= a.t && t <= b.t) { const f = (t - a.t) / ((b.t - a.t) || 1); return a.v + (b.v - a.v) * f; }
    }
    return pts[pts.length - 1].v;
  };
  const reverse = !!pad.reverse;
  const eStart = reverse ? (baseDuration - startOffset) : startOffset; // temps effectif au démarrage
  const eEnd = reverse ? segStart : segEnd;                            // temps effectif en fin
  if (Math.abs(eEnd - eStart) < 0.005) return;
  const lo = Math.min(eStart, eEnd); const hi = Math.max(eStart, eEnd);
  const inside = pts.filter((p) => p.t > lo + 1e-4 && p.t < hi - 1e-4);
  inside.sort((a, b) => (reverse ? b.t - a.t : a.t - b.t));
  const timeOf = (tEff) => Math.max(now, now + (reverse ? (eStart - tEff) : (tEff - eStart)));
  const g = envGain.gain;
  g.setValueAtTime(envAt(eStart), now);
  for (const p of inside) g.linearRampToValueAtTime(p.v, timeOf(p.t));
  g.linearRampToValueAtTime(envAt(eEnd), timeOf(eEnd));
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

function connectPadEq(pad, input, output) {
  if (!state.audioContext) {
    input.connect(output);
    return;
  }
  const eq = pad.eqMode === "pad"
    ? { low: pad.eqLow, mid: pad.eqMid, high: pad.eqHigh }
    : pad.eqMode === "global"
      ? masterEqSettings()
      : { low: 0, mid: 0, high: 0 };
  const low = state.audioContext.createBiquadFilter();
  const mid = state.audioContext.createBiquadFilter();
  const high = state.audioContext.createBiquadFilter();
  configureEqFilter(low, "lowshelf", 160, eq.low);
  configureEqFilter(mid, "peaking", 1000, eq.mid, 1);
  configureEqFilter(high, "highshelf", 6000, eq.high);
  input.connect(low).connect(mid).connect(high).connect(output);
  pad.eqNodes = { low, mid, high };
}

function videoElementForPad(pad) {
  if (!pad?.videoWindow || pad.videoWindow.closed) return null;
  try {
    return pad.videoWindow.document.querySelector("video");
  } catch {
    return null;
  }
}

function syncVideoProjectionAudio(pad) {
  const video = videoElementForPad(pad);
  if (!video) return;
  video.volume = videoTargetVolume(pad);
  video.muted = Boolean(pad.muted);
  video.loop = Boolean(pad.loop);
}

function videoTargetVolume(pad) {
  const masterVolume = clamp01(els.masterVolume?.value, currentBoard()?.masterVolume ?? DEFAULT_MASTER_VOLUME);
  return Math.min(1, Math.max(0, pad.volume * masterVolume * duckFactorForPad(pad)));
}

function writeVideoProjectionDocument(projection, title, body) {
  if (!projection) return;
  projection.document.open();
  projection.document.write(`<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
html,body{margin:0;width:100%;height:100%;background:#000;color:#fff;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
video{width:100%;height:100%;object-fit:contain;background:#000}
.label{position:fixed;left:14px;bottom:12px;padding:6px 9px;border-radius:6px;background:rgba(0,0,0,.58);font-size:13px;letter-spacing:.02em}
.loading{display:grid;place-items:center;width:100%;height:100%;color:#d7dde8;font-size:18px}
</style>
</head>
<body>${body}</body>
</html>`);
  projection.document.close();
}

function fadeVideoVolume(video, fromVolume, toVolume, seconds) {
  if (!video || seconds <= 0) {
    if (video) video.volume = Math.min(1, Math.max(0, toVolume));
    return Promise.resolve();
  }
  const startTime = performance.now();
  const duration = seconds * 1000;
  const from = Math.min(1, Math.max(0, fromVolume));
  const to = Math.min(1, Math.max(0, toVolume));
  return new Promise((resolve) => {
    const step = () => {
      const ratio = Math.min(1, Math.max(0, (performance.now() - startTime) / duration));
      video.volume = from + (to - from) * ratio;
      if (ratio >= 1) {
        resolve();
        return;
      }
      window.requestAnimationFrame(step);
    };
    step();
  });
}

function isPadPlaying(pad) {
  if (pad?.source) return true;
  if (pad?.speechUtterance) return true;
  const video = videoElementForPad(pad);
  return Boolean(video && !video.paused && !video.ended);
}

function estimateSpeechDuration(text, rate = DEFAULT_TEXT_RATE) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 0;
  return Math.max(1, (words / 2.6) / Math.max(0.4, normalizedTextRate(rate)));
}

function voiceScoreForGender(voice, gender) {
  const name = String(voice?.name || "").toLowerCase();
  const uri = String(voice?.voiceURI || "").toLowerCase();
  const haystack = `${name} ${uri}`;
  const maleTokens = [
    "homme", "masculin", "paul", "thomas", "daniel", "alex", "xavier",
    "nicolas", "yann", "fred", "felix", "olivier", "antoine", "julien", "arthur", "albert",
  ];
  const femaleTokens = [
    "femme", "féminin", "feminin", "amelie", "amélie", "audrey",
    "aurelie", "aurélie", "victoria", "samantha", "marie", "julie", "virginie", "alice",
    "celine", "céline", "claire", "lea", "léa", "anna", "flo",
  ];
  const wanted = gender === "male" ? maleTokens : femaleTokens;
  const unwanted = gender === "male" ? femaleTokens : maleTokens;
  let score = 0;
  if (wanted.some((token) => haystack.includes(token))) score += 10;
  if (unwanted.some((token) => haystack.includes(token))) score -= 20;
  if (gender === "male" && /\bmale\b/.test(haystack) && !/\bfemale\b/.test(haystack)) score += 10;
  if (gender === "female" && /\bfemale\b/.test(haystack)) score += 10;
  if (voice?.default) score += 1;
  return score;
}

function speechVoiceForPad(pad) {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const selectedVoice = String(pad?.textVoiceURI || "");
  if (selectedVoice) {
    const exact = voices.find((voice) => voice.voiceURI === selectedVoice || voice.name === selectedVoice);
    if (exact) return exact;
  }
  const lang = String(pad.textLang || "fr-FR").toLowerCase();
  const langRoot = lang.split("-")[0];
  const byLang = voices.filter((voice) => String(voice.lang || "").toLowerCase().startsWith(langRoot));
  const gender = pad.textGender === "male" ? "male" : "female";
  const bestByLang = [...byLang].sort((a, b) => voiceScoreForGender(b, gender) - voiceScoreForGender(a, gender))[0];
  const bestAny = [...voices].sort((a, b) => voiceScoreForGender(b, gender) - voiceScoreForGender(a, gender))[0];
  return (bestByLang && voiceScoreForGender(bestByLang, gender) > 0 ? bestByLang : null)
    || byLang[0]
    || (bestAny && voiceScoreForGender(bestAny, gender) > 0 ? bestAny : null)
    || voices[0]
    || null;
}

function speechPitchForPad(pad) {
  return pad?.textGender === "male" ? 0.72 : 1.04;
}

function showPadNoteOverlay(pad, phase = "start") {
  const shouldShow = phase === "end" ? pad?.noteShowOnEnd : pad?.noteShowOnStart;
  if (!pad?.noteText || !shouldShow || !els.padNoteOverlay) return;
  state.noteOverlayPad = pad;
  els.padNoteOverlay.textContent = pad.noteText;
  els.padNoteOverlay.hidden = false;
}

function hidePadNoteOverlay(pad = null) {
  if (pad && state.noteOverlayPad && state.noteOverlayPad !== pad) return;
  state.noteOverlayPad = null;
  if (els.padNoteOverlay) {
    els.padNoteOverlay.hidden = true;
    els.padNoteOverlay.textContent = "";
  }
}

function clearSpeechPad(pad, triggerEnd = false) {
  if (!pad) return;
  if (pad.speechStopTimer) {
    window.clearTimeout(pad.speechStopTimer);
    pad.speechStopTimer = null;
  }
  if (pad.speechFadeTimer) {
    window.clearInterval(pad.speechFadeTimer);
    pad.speechFadeTimer = null;
  }
  pad.speechUtterance = null;
  pad.speechMutedPause = false;
  pad.textStartedAt = 0;
  pad.stopAt = 0;
  pad.node.classList.remove("is-playing");
  hidePadNoteOverlay(pad);
  updatePadModeButtons(pad);
  updatePadTime(pad);
  applyDucking();
  updateAllPadAlerts();
  if (triggerEnd) {
    showPadNoteOverlay(pad, "end");
    executeEndCrossfade(pad);
    checkCueConditions(pad);
  }
}

function speechTargetVolume(pad) {
  return Math.min(1, Math.max(0, pad?.muted ? 0 : Number(pad?.volume) || 0));
}

function textFromSpeechOffset(pad, offset = 0) {
  const words = String(pad?.textContent || "").trim().match(/\S+/g) || [];
  if (!words.length) return "";
  const duration = Math.max(1, pad?.textDuration || estimateSpeechDuration(pad.textContent, pad.textRate));
  const ratio = Math.min(0.98, Math.max(0, Number(offset) / duration));
  const startIndex = Math.min(words.length - 1, Math.max(0, Math.floor(words.length * ratio)));
  return words.slice(startIndex).join(" ");
}

function speakPadTextFromOffset(pad, offset = 0) {
  const text = textFromSpeechOffset(pad, offset);
  if (!text) {
    window.speechSynthesis?.cancel?.();
    clearSpeechPad(pad, true);
    return;
  }
  const previousUtterance = pad.speechUtterance;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = pad.textLang || "fr-FR";
  utterance.rate = normalizedTextRate(pad.textRate);
  utterance.pitch = speechPitchForPad(pad);
  utterance.volume = speechTargetVolume(pad);
  const voice = speechVoiceForPad(pad);
  if (voice) utterance.voice = voice;
  pad.speechUtterance = utterance;
  pad.speechMutedPause = false;
  pad.isPaused = false;
  pad.startedAt = performance.now() / 1000 - Math.max(0, offset);
  pad.node.classList.add("is-playing");
  utterance.onend = () => {
    if (pad.speechUtterance === utterance) clearSpeechPad(pad, true);
  };
  utterance.onerror = () => {
    if (pad.speechUtterance === utterance) clearSpeechPad(pad, false);
    setStatus("Lecture de texte impossible");
  };
  if (previousUtterance) window.speechSynthesis?.cancel?.();
  window.speechSynthesis?.speak?.(utterance);
  updatePadModeButtons(pad);
  updatePadTime(pad);
  startTimer();
}

function fadeSpeechVolume(pad, from, to, seconds, done = null) {
  if (!pad?.speechUtterance || seconds <= 0) {
    if (pad?.speechUtterance) pad.speechUtterance.volume = to;
    done?.();
    return;
  }
  if (pad.speechFadeTimer) {
    window.clearInterval(pad.speechFadeTimer);
    pad.speechFadeTimer = null;
  }
  const utterance = pad.speechUtterance;
  const startedAt = performance.now();
  const durationMs = seconds * 1000;
  utterance.volume = Math.min(1, Math.max(0, from));
  pad.speechFadeTimer = window.setInterval(() => {
    if (pad.speechUtterance !== utterance) {
      window.clearInterval(pad.speechFadeTimer);
      pad.speechFadeTimer = null;
      return;
    }
    const progress = Math.min(1, (performance.now() - startedAt) / durationMs);
    utterance.volume = Math.min(1, Math.max(0, from + (to - from) * progress));
    if (progress >= 1) {
      window.clearInterval(pad.speechFadeTimer);
      pad.speechFadeTimer = null;
      done?.();
    }
  }, 50);
}

async function playPadText(pad, options = {}) {
  if (!("speechSynthesis" in window) || !window.SpeechSynthesisUtterance) {
    setStatus("Lecture de texte indisponible dans ce navigateur");
    return;
  }
  await ensureSpeechVoices();
  const text = String(pad.textContent || "").trim();
  if (!text) {
    setStatus(`Texte vide: ${pad.title}`);
    return;
  }
  if (!options.skipStartCrossfade) executeStartCrossfade(pad);
  stopPad(pad, false, false, { triggerEnd: false });
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = pad.textLang || "fr-FR";
  utterance.rate = normalizedTextRate(pad.textRate);
  utterance.pitch = speechPitchForPad(pad);
  const targetVolume = speechTargetVolume(pad);
  utterance.volume = targetVolume;
  const voice = speechVoiceForPad(pad);
  if (voice) utterance.voice = voice;
  pad.speechUtterance = utterance;
  pad.textDuration = estimateSpeechDuration(text, utterance.rate);
  pad.startedAt = performance.now() / 1000;
  pad.stopAt = 0;
  pad.isPaused = false;
  pad.node.classList.add("is-playing");
  state.lastStartedPad = pad;
  updatePadModeButtons(pad);
  updatePadTime(pad);
  showPadNoteOverlay(pad);
  applyDucking(pad);
  startTimer();
  utterance.onend = () => {
    if (pad.speechUtterance === utterance) clearSpeechPad(pad, true);
  };
  utterance.onerror = () => {
    if (pad.speechUtterance === utterance) clearSpeechPad(pad, false);
    setStatus("Lecture de texte impossible");
  };
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
  setStatus(`Lecture texte: ${pad.title}`);
}

function markVideoStopped(pad, triggerEnd = false) {
  if (!pad) return;
  if (pad.videoTimer) {
    window.clearTimeout(pad.videoTimer);
    pad.videoTimer = null;
  }
  pad.startedAt = 0;
  pad.stopAt = 0;
  pad.node.classList.remove("is-playing");
  updatePadModeButtons(pad);
  updatePadTime(pad);
  if (triggerEnd) {
    executeEndCrossfade(pad);
    checkCueConditions(pad);
  }
}

async function stopVideoProjection(pad, options = {}) {
  const { preservePosition = false, resetPosition = true, triggerEnd = true, fade = false } = options;
  const video = videoElementForPad(pad);
  const duration = playableDuration(pad);
  if (video) {
    pad.resumeOffset = preservePosition
      ? Math.min(duration || video.duration || 0, Math.max(0, video.currentTime || 0))
      : 0;
    pad.isPaused = Boolean(preservePosition && pad.resumeOffset > 0);
    if (!pad.muted && fade) {
      await fadeVideoVolume(video, video.volume, 0, fadeDurationForPad(pad, "out"));
    }
    video.pause();
    if (resetPosition) {
      try {
        video.currentTime = 0;
      } catch {}
    }
    syncVideoProjectionAudio(pad);
  } else {
    pad.resumeOffset = 0;
    pad.isPaused = false;
  }
  if (!preservePosition) pad.isPaused = false;
  clearPadMuteState(pad);
  markVideoStopped(pad, triggerEnd);
}

function disposeVideoProjection(pad) {
  if (!pad) return;
  if (pad.videoTimer) {
    window.clearTimeout(pad.videoTimer);
    pad.videoTimer = null;
  }
  if (pad.videoWindow && !pad.videoWindow.closed) {
    try {
      pad.videoWindow.close();
    } catch {}
  }
  pad.videoWindow = null;
  if (pad.videoUrl) {
    URL.revokeObjectURL(pad.videoUrl);
    pad.videoUrl = "";
  }
  markVideoStopped(pad, false);
}

async function playPadVideo(pad, options = {}) {
  const projection = (pad.videoWindow && !pad.videoWindow.closed)
    ? pad.videoWindow
    : window.open("about:blank", `soundboard-video-${pad.uid || pad.index}`, "popup=yes,width=1280,height=720");
  if (projection) {
    writeVideoProjectionDocument(projection, escapeText(pad.title || "Video"), `<div class="loading">${escapeText(pad.title || "Video")}</div>`);
  }
  const record = await dbGet(padAudioKey(pad));
  if (!record?.video) {
    if (projection && !pad.videoWindow) {
      try {
        projection.close();
      } catch {}
    }
    pad.node.classList.add("is-missing-audio");
    setStatus(`Vidéo manquante: ${pad.title}`);
    return;
  }
  if (!options.skipStartCrossfade) executeStartCrossfade(pad);
  let url = pad.videoUrl;
  if (!url) {
    const blob = new Blob([record.video.slice(0)], { type: record.videoType || pad.videoType || "video/mp4" });
    url = URL.createObjectURL(blob);
    pad.videoUrl = url;
  }
  if (!projection) {
    if (!pad.videoWindow && pad.videoUrl) {
      URL.revokeObjectURL(pad.videoUrl);
      pad.videoUrl = "";
    }
    setStatus("Projection vidéo bloquée par le navigateur");
    return;
  }
  const title = escapeText(pad.title || record.videoName || "Video");
  writeVideoProjectionDocument(projection, title, `<video src="${url}" controls playsinline></video><div class="label">${title}</div>`);
  pad.videoWindow = projection;
  const video = videoElementForPad(pad);
  const targetVolume = videoTargetVolume(pad);
  if (video) {
    video.currentTime = Math.min(playableDuration(pad), Math.max(0, options.offset ?? pad.resumeOffset ?? 0));
    syncVideoProjectionAudio(pad);
    if (!pad.muted && options.fadeIn && fadeDurationForPad(pad, "in") > 0) {
      video.volume = 0;
    }
    video.addEventListener("play", () => {
      pad.node.classList.add("is-playing");
      state.lastStartedPad = pad;
      pad.isPaused = false;
      pad.startedAt = performance.now() / 1000 - (video.currentTime || 0);
      updatePadModeButtons(pad);
      updatePadTime(pad);
      showPadNoteOverlay(pad);
      startTimer();
    });
    video.addEventListener("pause", () => {
      if (!video.ended) markVideoStopped(pad, false);
    });
    video.addEventListener("ended", () => {
      pad.resumeOffset = 0;
      markVideoStopped(pad, true);
    }, { once: true });
  }
  state.lastStartedPad = pad;
  pad.startedAt = performance.now() / 1000;
  pad.isPaused = false;
  updatePadModeButtons(pad);
  updatePadTime(pad);
  try {
    await video?.play();
    if (video && !pad.muted && options.fadeIn && fadeDurationForPad(pad, "in") > 0) {
      fadeVideoVolume(video, 0, targetVolume, fadeDurationForPad(pad, "in"));
    }
  } catch {
    setStatus("Lecture vidéo à confirmer dans la fenêtre de projection");
  }
  setStatus(`Projection vidéo: ${pad.title}`);
}

function clearPlayingPad(pad, source, triggerEnd = false) {
  if (source && pad.source !== source) return;
  const stoppedManually = Boolean(pad.stopAt);
  const wasManualCrossfadeSource = state.crossfadeArm.active && manualCrossfadeSourcePad() === pad;
  pad.source = null;
  pad.gain = null;
  pad.envGain = null;
  pad.pan = null;
  pad.analyser = null;
  pad.meterData = null;
  pad.reverbNodes = null;
  pad.monoNodes = null;
  pad.eqNodes = null;
  pad.stopAt = 0;
  clearCrossfadeDuck(pad, false);
  pad.node.classList.remove("is-playing", "is-stop-flash");
  hidePadNoteOverlay(pad);
  updatePadModeButtons(pad);
  setMeterLevel(pad.vuEl, 0);
  updatePadTime(pad);
  applyDucking();
  updateAllPadAlerts();
  syncAudioTestPlayButton(); // fin/arrêt de lecture → icône du bouton test revient au triangle
  if (wasManualCrossfadeSource) {
    cancelManualCrossfade({ message: "Crossfade annulé : source arrêtée" });
  }
  if (triggerEnd) {
    if (!stoppedManually) showPadNoteOverlay(pad, "end");
    executeEndCrossfade(pad);
    checkCueConditions(pad);
  }
}

// ===== Régions → buffer effectif (moteur non destructif) =====
// pad.regions = [{ type:"cut"|"silence", start, end }] en secondes sur la timeline d'origine.
// "cut" retire l'intervalle (raccourcit le buffer) ; "silence" met l'intervalle à zéro (durée inchangée).
function regionsSignature(regions) {
  return (regions || [])
    .map((r) => `${r.type === "silence" ? "s" : "c"}:${r.start}:${r.end}`)
    .join("|");
}

function applyRegionsToBuffer(buffer, regions) {
  if (!buffer || !regions || !regions.length || !state.audioContext) return buffer;
  const sr = buffer.sampleRate;
  const n = buffer.length;
  const cuts = [];
  const sils = [];
  for (const r of regions) {
    const a = Math.max(0, Math.min(n, Math.round((r.start || 0) * sr)));
    const b = Math.max(0, Math.min(n, Math.round((r.end || 0) * sr)));
    if (b > a) (r.type === "silence" ? sils : cuts).push([a, b]);
  }
  if (!cuts.length && !sils.length) return buffer;

  // Points de découpe = toutes les frontières de régions
  const pts = new Set([0, n]);
  for (const [a, b] of cuts) { pts.add(a); pts.add(b); }
  for (const [a, b] of sils) { pts.add(a); pts.add(b); }
  const bounds = [...pts].sort((x, y) => x - y);
  const inAny = (mid, arr) => arr.some(([a, b]) => mid >= a && mid < b);

  // Plan des segments conservés (cut prioritaire si chevauchement)
  const segs = [];
  let outLen = 0;
  for (let i = 0; i < bounds.length - 1; i += 1) {
    const p = bounds[i];
    const q = bounds[i + 1];
    if (q <= p) continue;
    const mid = (p + q) >> 1;
    if (inAny(mid, cuts)) continue; // retiré
    segs.push({ p, q, silence: inAny(mid, sils) });
    outLen += q - p;
  }
  if (outLen <= 0) return buffer; // tout coupé → on garde l'original (évite un buffer vide)

  const ch = buffer.numberOfChannels;
  const out = state.audioContext.createBuffer(ch, outLen, sr);
  for (let c = 0; c < ch; c += 1) {
    const src = buffer.getChannelData(c);
    const dst = out.getChannelData(c);
    let w = 0;
    for (const s of segs) {
      const len = s.q - s.p;
      if (!s.silence) dst.set(src.subarray(s.p, s.q), w); // silence : déjà à zéro
      w += len;
    }
  }
  return out;
}

function effectiveBufferForPad(pad) {
  if (!pad?.buffer) return null;
  const sig = regionsSignature(pad.regions);
  if (!sig) { pad.effectiveBuffer = null; pad.effectiveBufferSig = ""; return pad.buffer; }
  if (pad.effectiveBufferSig === sig && pad.effectiveBufferSource === pad.buffer && pad.effectiveBuffer) {
    return pad.effectiveBuffer;
  }
  const eff = applyRegionsToBuffer(pad.buffer, pad.regions);
  pad.effectiveBuffer = eff;
  pad.effectiveBufferSig = sig;
  pad.effectiveBufferSource = pad.buffer;
  return eff;
}

// Recale durée / waveform / cache reverse sur le buffer effectif (régions appliquées).
function applyEffectiveBufferState(pad) {
  if (!pad?.buffer) return;
  const eff = effectiveBufferForPad(pad);
  pad.reversedBufferSource = null; // invalide le cache reverse
  setPadDuration(pad, eff.duration);
  pad.waveformPeaks = buildWaveformPeaks(eff);
}

function reversedBufferForPad(pad) {
  const base = effectiveBufferForPad(pad);
  if (!base || !state.audioContext) return base || null;
  if (pad.reversedBufferSource === base && pad.reversedBuffer) return pad.reversedBuffer;
  const source = base;
  const reversed = state.audioContext.createBuffer(source.numberOfChannels, source.length, source.sampleRate);
  for (let channel = 0; channel < source.numberOfChannels; channel += 1) {
    const input = source.getChannelData(channel);
    const output = reversed.getChannelData(channel);
    for (let index = 0; index < input.length; index += 1) {
      output[index] = input[input.length - 1 - index];
    }
  }
  pad.reversedBuffer = reversed;
  pad.reversedBufferSource = source;
  return reversed;
}

async function playPad(pad, fade = false, offset = 0, options = {}) {
  if (pad.videoName) {
    await playPadVideo(pad, { ...options, offset, fadeIn: fade });
    return;
  }
  if (pad.textMode || (pad.textContent && !pad.buffer)) {
    await playPadText(pad, { ...options, fadeIn: fade });
    return;
  }
  if (!pad.buffer) {
    if (pad.audioStored) {
      pad.node.classList.remove("is-missing-audio");
      setStatus(`Préparation audio : ${pad.title}`);
      try {
        pad.buffer = await ensurePadAudioDecoded(pad);
        syncStagePending();
      } catch (error) {
        console.error(error);
        pad.audioStored = false;
        pad.node.classList.add("is-missing-audio");
        syncStagePending();
        setStatus(`Son manquant: ${pad.title}`);
        openAudioDialog(pad);
        return;
      }
    } else {
      if (pad.audioName || pad.audioPath) {
        pad.node.classList.add("is-missing-audio");
        setStatus(`Son manquant: ${pad.title}`);
      } else {
        setStatus(`Réglages audio: ${pad.title}`);
      }
      openAudioDialog(pad);
      return;
    }
  }

  await ensureAudio();
  if (!options.skipStartCrossfade) executeStartCrossfade(pad);
  stopPad(pad, false, false, { triggerEnd: false, noFlash: true }); // redémarrage interne (seek) → pas de flash
  const segmentStart = trimStart(pad);
  const segmentEnd = trimEnd(pad);
  const segmentDuration = playableDuration(pad);
  const segmentOffset = segmentDuration ? Math.min(Math.max(0, offset), Math.max(0, segmentDuration - 0.01)) : 0;
  const baseBuffer = effectiveBufferForPad(pad) || pad.buffer; // régions cut/silence appliquées
  const playbackBuffer = pad.reverse ? reversedBufferForPad(pad) : baseBuffer;
  const reverseSegmentStart = Math.max(0, baseBuffer.duration - segmentEnd);
  const reverseSegmentEnd = Math.min(baseBuffer.duration, baseBuffer.duration - segmentStart);
  const startOffset = pad.reverse ? reverseSegmentStart + segmentOffset : segmentStart + segmentOffset;
  // Enveloppe présente : elle porte le volume. Seuls les fades PROPRES au pad y sont repris,
  // donc on ne saute le fade statique que dans ce cas (les fades globaux restent appliqués).
  const hasEnv = !pad.loop && Array.isArray(pad.envelope) && pad.envelope.length > 0;
  const foldPadFade = hasEnv && pad.fadeMode === "pad";

  const ctx = state.audioContext;
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  const pan = ctx.createStereoPanner();
  const analyser = ctx.createAnalyser();
  const now = ctx.currentTime;
  const fadeTime = options.fadeInSecondsOverride != null
    ? Math.max(0, Number(options.fadeInSecondsOverride) || 0)
    : fadeDurationForPad(pad, "in");
  const naturalDuration = Math.max(0.01, segmentEnd - startOffset);
  const naturalStopAt = now + naturalDuration;
  const naturalFadeOutTime = (!pad.loop && !foldPadFade) ? Math.min(fadeDurationForPad(pad, "out"), naturalDuration) : 0;
  const naturalFadeOutStart = naturalStopAt - naturalFadeOutTime;
  const effectiveFadeInTime = fade && !foldPadFade && fadeTime > 0
    ? Math.min(fadeTime, naturalFadeOutTime > 0 ? Math.max(0, naturalFadeOutStart - now) : naturalDuration)
    : 0;
  const targetGain = targetPadGain(pad);

  analyser.fftSize = 256;
  source.buffer = playbackBuffer;
  source.loop = pad.loop;
  source.loopStart = pad.reverse ? reverseSegmentStart : segmentStart;
  source.loopEnd = pad.reverse ? reverseSegmentEnd : segmentEnd;
  source.playbackRate.setValueAtTime(1, now);
  if (source.detune) source.detune.setValueAtTime((pad.pitchSemitones + pad.pitchFine / 100) * 100, now);
  gain.gain.setValueAtTime(effectiveFadeInTime > 0 ? 0 : targetGain, now);
  pan.pan.setValueAtTime(pad.panValue, now);
  // Couche d'enveloppe de volume (multiplicative, indépendante des fades), si présente.
  let preGain = gain;
  pad.envGain = null;
  if (hasEnv) {
    const envGain = ctx.createGain();
    envGain.gain.setValueAtTime(1, now);
    scheduleEnvelopeGain(pad, envGain, now, startOffset, segmentStart, segmentEnd, baseBuffer.duration);
    envGain.connect(gain);
    pad.envGain = envGain;
    preGain = envGain;
  }
  connectSourceToGain(pad, source, preGain);
  connectPadEq(pad, gain, pan);
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
  state.lastStartedPad = pad;
  pad.isPaused = false;
  pad.meterData = new Uint8Array(analyser.fftSize);
  pad.startedAt = now - segmentOffset;
  pad.stopAt = 0;
  pad.keepResumeOffsetOnEnd = false;
  pad.node.classList.add("is-playing");
  showPadNoteOverlay(pad);
  updatePadModeButtons(pad);
  updatePadTime(pad);
  startTimer();
  setStatus(`${pad.title} joue`);

  source.onended = () => {
    if (pad.source === source) {
      if (!pad.keepResumeOffsetOnEnd) pad.resumeOffset = 0;
      if (!pad.keepResumeOffsetOnEnd) pad.isPaused = false;
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
  if (!isPadPlaying(pad)) {
    if (!preservePosition && pad.isPaused) {
      pad.resumeOffset = 0;
      pad.isPaused = false;
      updatePadModeButtons(pad);
      updatePadTime(pad);
    }
    clearPadMuteState(pad);
    return;
  }
  if (pad?.speechUtterance) {
    const triggerEnd = options.triggerEnd ?? true;
    const finishSpeechStop = () => {
      window.speechSynthesis?.cancel?.();
      clearSpeechPad(pad, triggerEnd);
      clearPadMuteState(pad);
      setStatus(`${pad.title} stop`);
    };
    const fadeTime = fade ? fadeDurationForPad(pad, "out") : 0;
    if (fadeTime > 0) {
      window.clearTimeout(pad.speechStopTimer);
      fadeSpeechVolume(pad, pad.speechUtterance.volume ?? speechTargetVolume(pad), 0, fadeTime, finishSpeechStop);
      setStatus(`${pad.title} fade out`);
    } else {
      finishSpeechStop();
    }
    return;
  }
  if (pad?.videoWindow || pad?.videoUrl || pad?.videoTimer) {
    stopVideoProjection(pad, {
      preservePosition,
      resetPosition: !preservePosition,
      triggerEnd: options.triggerEnd ?? true,
      fade,
    });
    setStatus(`${pad.title} stop`);
    return;
  }
  const wasMuted = Boolean(pad?.muted);
  if (!pad.source || !state.audioContext) {
    clearPadMuteState(pad);
    return;
  }
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
    pad.isPaused = true;
  } else {
    pad.resumeOffset = 0;
    pad.keepResumeOffsetOnEnd = false;
    pad.isPaused = false;
  }

  const effectiveFadeTime = options.fadeOutSecondsOverride != null
    ? Math.max(0, Number(options.fadeOutSecondsOverride) || 0)
    : fadeTime;

  if (!wasMuted && fade && effectiveFadeTime > 0 && gain) {
    if (typeof gain.gain.cancelAndHoldAtTime === "function") {
      gain.gain.cancelAndHoldAtTime(now);
    } else {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(Math.max(0.0001, gain.gain.value || targetPadGain(pad)), now);
    }
    gain.gain.linearRampToValueAtTime(0.0001, now + effectiveFadeTime);
    try {
      source.stop(now + effectiveFadeTime + 0.02);
    } catch {
      clearPlayingPad(pad, source, options.triggerEnd ?? true);
      return;
    }
    pad.stopAt = now + effectiveFadeTime + 0.02;
    if (!options.noFlash) requestAnimationFrame(() => flashPadStop(pad, effectiveFadeTime));
    setStatus(`${pad.title} fade out`);
  } else {
    try {
      source.stop(now);
    } catch {
      clearPlayingPad(pad, source, options.triggerEnd ?? true);
      clearPadMuteState(pad);
      return;
    }
    pad.stopAt = now;
    clearPlayingPad(pad, source, options.triggerEnd ?? true);
    clearPadMuteState(pad);
    if (!options.noFlash) requestAnimationFrame(() => flashPadStop(pad, 0));
    setStatus(`${pad.title} stop`);
  }
}

function remainingSeconds(pad) {
  if (pad?.speechUtterance && pad.textDuration) {
    return Math.max(0, pad.textDuration - playbackOffset(pad));
  }
  if (pad.videoName && pad.node.classList.contains("is-playing") && pad.videoDuration) {
    const video = videoElementForPad(pad);
    const elapsed = video ? Math.max(0, video.currentTime || 0) : Math.max(0, performance.now() / 1000 - pad.startedAt);
    return Math.max(0, pad.videoDuration - elapsed);
  }
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
  pad.timeEl.textContent = isPadPlaying(pad) ? `-${formatTime(seconds)}` : formatTime(playableDuration(pad));
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
  element.style.transform = `scaleX(${scale})`;
}

function updateMeters() {
  const hasPlayingPad = state.pads.some((pad) => pad.source);
  setMeterLevel(els.masterVu, hasPlayingPad ? meterLevel(state.masterAnalyser, state.masterMeterData) : 0);
  setMeterLevel(
    els.cueVu,
    state.cuePreviewAnalyser
      ? meterLevel(state.cuePreviewAnalyser, state.cuePreviewMeterData)
      : ((state.cuePreviewAudio && !state.cuePreviewAudio.paused) || state.cuePreviewUtterance ? cueVolumeValue() : 0)
  );
  state.pads.forEach((pad) => {
    setMeterLevel(pad.vuEl, meterLevel(pad.analyser, pad.meterData));
  });
}

function startTimer() {
  if (state.timerFrame) return;
  const tick = () => {
    state.pads.forEach(updatePadTime);
    updateMeters();
    syncAudioTestPlayButton();
    state.timerFrame = state.pads.some((pad) => isPadPlaying(pad)) || Boolean((state.cuePreviewAudio && !state.cuePreviewAudio.paused) || state.cuePreviewUtterance)
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
  if (pad?.speechUtterance) {
    if (pad.isPaused) {
      pad.speechUtterance.volume = speechTargetVolume(pad);
      window.speechSynthesis?.resume?.();
      pad.startedAt = performance.now() / 1000 - Math.max(0, pad.resumeOffset || 0);
      pad.isPaused = false;
      pad.node.classList.add("is-playing");
      updatePadModeButtons(pad);
      startTimer();
      setStatus(`${pad.title} reprend`);
      return;
    }
    pad.resumeOffset = Math.max(0, performance.now() / 1000 - pad.startedAt);
    window.speechSynthesis?.pause?.();
    pad.isPaused = true;
    pad.node.classList.remove("is-playing");
    updatePadModeButtons(pad);
    updatePadTime(pad);
    setStatus(`${pad.title} pause`);
    return;
  }
  if (isPadPlaying(pad)) {
    stopPad(pad, false, true, { triggerEnd: false });
    return;
  }
  if (!pad.isPaused || !pad.resumeOffset) {
    updatePadModeButtons(pad);
    return;
  }
  playPad(pad, false, pad.resumeOffset, { skipStartCrossfade: true }).catch(() => setStatus("Reprise impossible"));
}

function stopAll() {
  const fadeSeconds = Math.max(0, Number(els.fadeSeconds?.value) || 0);
  state.pads.forEach((pad) => stopPad(pad, true, false, { triggerEnd: false, fadeOutSecondsOverride: fadeSeconds }));
  setStatus("Tout est stoppé");
}

function stopGroup() {
  const tag = els.stopGroupSelect?.value;
  if (!tag) {
    setStatus("Choisir un groupe");
    return;
  }
  const pads = state.pads.filter((pad) => isPadPlaying(pad) && padTagList(pad).includes(tag));
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

    if (event.code === "Space" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      stopLastStartedPadFromKeyboard();
      return;
    }

    const key = event.key.toUpperCase();
    const index = padIndexForShortcutKey(key);
    if (index >= 0 && state.pads[index]) {
      event.preventDefault();
      if (state.crossfadeArm.active) {
        if (state.crossfadeArm.phase === "source") {
          chooseManualCrossfadeSource(state.pads[index]);
        } else {
          executeManualCrossfade(state.pads[index]);
        }
        return;
      }
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
      if (state.crossfadeArm.active) {
        cancelManualCrossfade();
        return;
      }
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
  loadOutputSettings();
  loadMicrophoneSelection();
  if (els.fadeSeconds) {
    els.fadeSeconds.value = localStorage.getItem(FADE_OUT_STORAGE) || els.fadeSeconds.value;
  }
  if (els.fadeInSeconds) {
    els.fadeInSeconds.value = localStorage.getItem(FADE_IN_STORAGE) || els.fadeInSeconds.value;
  }
  if (els.duckPercent) {
    els.duckPercent.value = localStorage.getItem(DUCKING_STORAGE) || els.duckPercent.value;
  }
  if (els.endingAlertSeconds) {
    els.endingAlertSeconds.value = localStorage.getItem(ENDING_ALERT_STORAGE) || els.endingAlertSeconds.value;
  }
  updateEndingAlertHint();
  loadMasterReverbSettings();
  loadMasterEqSettings();
  loadCueVolume();
  state.boards = loadBoards();
  state.currentBoardId = localStorage.getItem(CURRENT_BOARD_STORAGE) || DEFAULT_BOARD_ID;
  if (!state.boards.some((board) => board.id === state.currentBoardId)) {
    state.currentBoardId = state.boards[0].id;
  }
  // Apply board's saved skin, or fall back to global SKIN_STORAGE
  const initBoard = currentBoard();
  const initSkin = initBoard?.skin || localStorage.getItem(SKIN_STORAGE) || "classic";
  applySkin(initSkin);
  if (!initBoard?.skin) saveSkinToCurrentBoard(); // first run: inherit global skin
  renderBoardOptions();
  const isReload = sessionStorage.getItem("soundboard-session-started") === "yes";
  sessionStorage.setItem("soundboard-session-started", "yes");
  const savedStageMode = isReload && localStorage.getItem(STAGE_MODE_STORAGE) === "on";
  const savedGarageMode = isReload && !savedStageMode && localStorage.getItem(BOARD_EDIT_MODE_STORAGE) === "on";
  if (savedGarageMode) state.boardEditMode = true;
  await renderPads({ preserveEditMode: savedGarageMode });
  await repairAccidentalPadTitles();
  await setStageMode(savedStageMode, false, { skipDecode: true });
  if (!state.stageMode && savedGarageMode) {
    setBoardPadEditing(true);
  }
  updateStageLockUi();
  updateMasterOptionBadges();
  syncHoverLabels();

  els.masterVolume.addEventListener("input", async () => {
    await ensureAudio();
    setMasterVolume(els.masterVolume.value);
  });
  els.cueVolume?.addEventListener("input", () => {
    setCueVolume(els.cueVolume.value);
  });
  els.skinSelect?.addEventListener("input", handleSkinSelectChange);
  els.skinSelect?.addEventListener("change", handleSkinSelectChange);
  els.openSkinEditorButton?.addEventListener("click", openSkinEditor);
  els.closeSkinEditor?.addEventListener("click", closeSkinEditor);
  document.querySelector("#applySkinHarmony")?.addEventListener("click", applySkinHarmony);
  // Couleur de base : pendant qu'on bouge dans le picker (input) on ne fait que
  // prévisualiser le nuancier — aucune couleur de la simulation n'est touchée.
  document.querySelector("#skinHarmonyColor")?.addEventListener("input", () => {
    document.querySelector(".skin-harmony-color-wrap")?.classList.remove("is-unset");
    document.querySelectorAll("#skinHarmonySwatch span").forEach(s => s.classList.remove("is-active"));
    updateHarmonySwatch();
  });
  // La palette d'harmonie n'est générée + appliquée qu'à la VALIDATION d'une
  // nouvelle couleur de base (change), pas au simple clic d'ouverture du picker.
  document.querySelector("#skinHarmonyColor")?.addEventListener("change", () => {
    document.querySelector(".skin-harmony-color-wrap")?.classList.remove("is-unset");
    skinPreviewFrameDoc()?.querySelectorAll("[data-skin-variable]").forEach(el => el.classList.remove("skin-hue-match"));
    updateHarmonySwatch();
    applySkinHarmony();
    saveSkinHarmonySettings();
  });
  // Changer l'harmonie est un choix délibéré : on recalcule la palette avec les
  // nouvelles teintes et on met à jour l'aperçu (comme un pick de couleur).
  // « Personnalisée » fige la palette (édition manuelle) et désactive la couleur
  // de base — on ne recalcule alors rien.
  document.querySelector(".skin-harmony-types")?.addEventListener("change", () => {
    const type = document.querySelector("[name='skinHarmonyType']:checked")?.value;
    setHarmonyBaseColorEnabled(type !== "personnalisee");
    if (type === "personnalisee") { populateCustomSwatchFromCurrent(); saveSkinHarmonySettings(); return; }
    updateHarmonySwatch();
    applySkinHarmony();
    saveSkinHarmonySettings();
  });
  document.querySelector("#skinHarmonySwatch")?.addEventListener("click", handleSwatchClick);
  document.querySelector("#skinHarmonySwatch")?.addEventListener("mouseover", e => {
    const span = e.target.closest("#skinHarmonySwatch span");
    if (span) applySwatchHighlight(parseInt(span.dataset.swatchIndex ?? 0));
  });
  document.querySelector("#skinHarmonySwatch")?.addEventListener("mouseleave", clearSwatchHighlight);
  document.querySelector("#skinHarmonySaturation")?.addEventListener("input", () => { applyHarmonyAdjustments(); saveSkinHarmonySettings(); });
  document.querySelector("#skinHarmonyLightness")?.addEventListener("input", () => { applyHarmonyAdjustments(); saveSkinHarmonySettings(); });
  document.querySelector("#resetHarmonyAdjust")?.addEventListener("click", () => {
    const sat = document.querySelector("#skinHarmonySaturation");
    const lum = document.querySelector("#skinHarmonyLightness");
    if (sat) sat.value = 0;
    if (lum) lum.value = 0;
    applyHarmonyAdjustments();
    saveSkinHarmonySettings();
  });
  document.querySelector("#skinFontFamily")?.addEventListener("change", applySkinFonts);
  document.querySelector("#skinFontSize")?.addEventListener("input", applySkinFonts);
  document.querySelector("#skinPreviewTags")?.addEventListener("input", applySkinPreviewTags);
  els.cancelSkinEditor?.addEventListener("click", closeSkinEditor);

  els.saveSkinEditor?.addEventListener("click", saveSkinEditorOverwrite);
  els.saveSkinEditorAs?.addEventListener("click", saveSkinEditorAs);
  els.deleteSkinEditor?.addEventListener("click", deleteCurrentCustomSkin);
  // Preview click/hover listeners are attached inside the iframe (buildSkinPreviewFrame).
  // Only the mode-radio change listener stays on the editor section.
  document.querySelector(".skin-editor-preview")?.addEventListener("change", (e) => {
    if (e.target.matches("[name='skinPreviewMode']")) syncSkinPreviewMode();
  });
  els.skinEditorFields?.addEventListener("mouseover", handleSkinVariablePointerOver);
  els.skinEditorFields?.addEventListener("mouseout", handleSkinVariablePointerOut);
  els.skinEditorFields?.addEventListener("focusin", handleSkinVariablePointerOver);
  els.skinEditorFields?.addEventListener("focusout", handleSkinVariablePointerOut);
  els.skinEditorFields?.addEventListener("click", handleSkinVariablePointerOver);
  els.skinEditorFields?.addEventListener("input", handleSkinVariablePointerOver);
  els.boardTagFilter?.addEventListener("change", () => applyBoardTagFilter());
  document.addEventListener("click", (e) => {
    if (e.target.closest?.("#filterSectionToggle")) {
      state.filterSectionOpen = !state.filterSectionOpen;
      refreshTagFilterChips();
      return;
    }
    if (e.target.closest?.("#versionsSectionToggle")) {
      state.versionsSectionOpen = !state.versionsSectionOpen;
      els.versionsSectionToggle?.setAttribute("aria-expanded", String(state.versionsSectionOpen));
      if (els.boardVersionRow) els.boardVersionRow.hidden = !state.versionsSectionOpen;
      return;
    }
    if (e.target.closest?.("#boardManageSectionToggle")) {
      state.boardManageSectionOpen = !state.boardManageSectionOpen;
      els.boardManageSectionToggle?.setAttribute("aria-expanded", String(state.boardManageSectionOpen));
      if (els.boardManageSectionBody) els.boardManageSectionBody.hidden = !state.boardManageSectionOpen;
      return;
    }
    const tagsAddBtn = e.target.closest?.(".tags-add-btn");
    if (tagsAddBtn) {
      const field = tagsAddBtn.closest(".tag-field");
      if (field) {
        field.classList.toggle("tags-input-open");
        tagsAddBtn.setAttribute("aria-expanded", String(field.classList.contains("tags-input-open")));
        if (field.classList.contains("tags-input-open")) {
          field.querySelector("[data-tags]")?.focus();
        }
      }
      return;
    }
    if (e.target.closest?.("#filterInvertBtn")) {
      state.invertSelection = !state.invertSelection;
      refreshTagFilterChips();
      applyBoardTagFilter();
      return;
    }
    const logicBtn = e.target.closest?.(".tag-filter-logic-btn");
    if (logicBtn?.dataset.logic) {
      state.tagFilterLogic = logicBtn.dataset.logic;
      refreshTagFilterChips();
      applyBoardTagFilter();
      return;
    }
    const chip = e.target.closest?.(".tag-filter-chip");
    if (!chip) return;
    if (chip.dataset.filterType === "structural") {
      const val = chip.dataset.value;
      const idx = state.activeStructuralFilters.indexOf(val);
      if (idx >= 0) state.activeStructuralFilters.splice(idx, 1);
      else state.activeStructuralFilters.push(val);
    } else {
      const tag = chip.dataset.tag;
      const idx = state.activeTagFilters.indexOf(tag);
      if (idx >= 0) state.activeTagFilters.splice(idx, 1);
      else state.activeTagFilters.push(tag);
    }
    refreshTagFilterChips();
    applyBoardTagFilter();
  });
  els.filterTousBtn?.addEventListener("click", () => {
    state.activeStructuralFilters = [];
    state.activeTagFilters = [];
    state.invertSelection = false;
    refreshTagFilterChips();
    applyBoardTagFilter();
  });
  els.filterCompactToggle?.addEventListener("click", () => {
    if (state.filterCompact) {
      // Tout afficher : désactiver le compact ET réinitialiser le filtre
      state.activeStructuralFilters = [];
      state.activeTagFilters = [];
      state.invertSelection = false;
      state.filterCompact = false;
      refreshTagFilterChips();
      applyBoardTagFilter();
    } else {
      state.filterCompact = true;
      syncFilterCompact();
      syncCompactToggleVisibility();
    }
  });
  els.padColumns?.addEventListener("input", updateBoardLayout);
  els.padColumns?.addEventListener("change", updateBoardLayout);
  bindSafeActionButton(els.showCables, () => armManualCrossfade());
  window.matchMedia("(max-width: 950px), (pointer: coarse)").addEventListener?.("change", () => {
    applySkin(localStorage.getItem(SKIN_STORAGE) || "classic");
    updateShortcutIndicators();
  });
  window.addEventListener("resize", () => {
    renderBoardLayoutControls();
    applyPadLayout(currentBoard());
    state.pads.forEach(renderWaveform);
    if (document.body.classList.contains("show-cables")) drawCableOverlay();
    syncFloatingCueFrame(true);
    window.setTimeout(() => state.pads.forEach(fitPadTitle), 0);
  });
  window.addEventListener("scroll", () => syncFloatingCueFrame(false), { passive: true });
  els.duckPercent?.addEventListener("input", () => {
    const value = duckPercentValue();
    localStorage.setItem(DUCKING_STORAGE, String(value));
    if (els.audioDuckGlobalHint) els.audioDuckGlobalHint.textContent = `(${value}%)`;
    applyDucking();
    updateMasterOptionBadges();
    updateAllPadAlerts();
  });
  els.duckPercent?.addEventListener("change", () => {
    const value = duckPercentValue();
    els.duckPercent.value = value;
    localStorage.setItem(DUCKING_STORAGE, String(value));
    if (els.audioDuckGlobalHint) els.audioDuckGlobalHint.textContent = `(${value}%)`;
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
  bindSafeActionButton(els.stopAll, () => stopAll());
  bindSafeActionButton(els.cueStopAll, () => stopAll());
  bindSafeActionButton(els.stopGroup, () => stopGroup());
  bindSafeActionButton(els.stageMode, () => {
    setStageMode(!state.stageMode, true);
  });
  bindSafeActionButton(els.stageLock, () => toggleStageLock());
  els.editPads?.addEventListener("click", () => {
    if (state.boardEditMode) {
      setBoardPadEditing(false);
      return;
    }
    beginBoardEdit().catch(() => setStatus("Mode edit impossible"));
  });
  els.cancelBoardEdit?.addEventListener("click", () => openCancelBoardEditDialog().catch(() => setStatus("Annulation impossible")));
  els.saveBoardEdit?.addEventListener("click", () => {
    setBoardPadEditing(false);
    setStatus("Mode live");
  });
  els.discardBoardEdit?.addEventListener("click", () => openCancelBoardEditDialog().catch(() => setStatus("Annulation impossible")));
  els.keepBoardEdit?.addEventListener("click", () => els.cancelEditDialog?.close());
  els.confirmCancelBoardEdit?.addEventListener("click", () => {
    els.cancelEditDialog?.close();
    cancelBoardEdit().catch(() => setStatus("Annulation impossible"));
  });
  els.cancelEditDialog?.addEventListener("click", (event) => {
    if (event.target === els.cancelEditDialog) els.cancelEditDialog.close();
  });
  bindSafeActionButton(els.patchBay, () => openPatchBayDialog());
  els.closePatchBay?.addEventListener("click", () => els.patchBayDialog?.close());
  els.patchBayDialog?.addEventListener("click", (event) => {
    if (event.target === els.patchBayDialog) els.patchBayDialog.close();
  });
  bindSafeActionButton(els.cueEditor, () => {
    const board = currentBoard();
    if (!board) return;
    const nextEnabled = board.cuesEnabled === false;
    board.cuesEnabled = nextEnabled;
    saveBoards();
    syncCueControls();
    setStatus(board.cuesEnabled ? "Cues activées" : "Cues désactivées");
  });
  bindSafeActionButton(els.openCueDialog, () => openCueDialog());
  bindSafeActionButton(els.cueRun, () => {
    runCurrentCue().catch(() => {
      clearCueWaitTimer();
      setStatus("Cue impossible");
    });
  });
  bindSafeActionButton(els.cueNext, () => {
    advanceCuePosition();
  });
  els.addCueStep?.addEventListener("click", () => {
    cueDraft().push(normalizeCueStep({ action: "playPad", target: "" }));
    renderCueRows();
  });
  els.addAllCuePads?.addEventListener("click", addAllPadsToCueDraft);
  bindSafeActionButton(els.resetCuePosition, () => {
    const board = currentBoard();
    if (!board) return;
    board.cueIndex = 0;
    saveBoards();
    syncCueControls();
    setStatus("Cues au début");
  });
  els.applyCues?.addEventListener("click", () => {
    saveCueDraft();
    els.cueDialog?.close();
    setStatus("Cues enregistrées");
  });
  els.cancelCues?.addEventListener("click", () => {
    clearCueDialogDraft();
    els.cueDialog?.close();
  });
  els.closeCueDialog?.addEventListener("click", () => {
    clearCueDialogDraft();
    els.cueDialog?.close();
  });
  els.cueDialog?.addEventListener("click", (event) => {
    if (event.target === els.cueDialog) {
      clearCueDialogDraft();
      els.cueDialog.close();
    }
  });
  window.addEventListener("resize", () => {
    if (els.patchBayDialog?.open) drawPatchBayOverlay();
    if (document.body.classList.contains("show-cables")) {
      drawCableOverlay();
      positionCableLegend();
    }
    syncFloatingCueFrame(true);
  });
  els.bulkEditPads?.addEventListener("click", openBulkEditDialog);
  els.closeBulkEdit?.addEventListener("click", () => els.bulkEditDialog?.close());
  els.cancelBulkEdit?.addEventListener("click", () => els.bulkEditDialog?.close());
  // Activation du bouton « Appliquer » dès qu'un champ est coché.
  els.bulkEditDialog?.addEventListener("change", syncBulkApplyState);
  // Valeur chiffrée volume/pan qui suit les curseurs.
  els.bulkVolume?.addEventListener("input", updateBulkRangeValues);
  els.bulkPan?.addEventListener("input", updateBulkRangeValues);
  // Tags en chips (comme le pad) : le champ pilote les chips, le bouton + le révèle.
  els.bulkTags?.addEventListener("input", renderBulkTagChips);
  els.bulkTagsAdd?.addEventListener("click", () => {
    const field = els.bulkTagsAdd.closest(".tag-field");
    const open = field?.classList.toggle("tags-input-open");
    els.bulkTagsAdd.setAttribute("aria-expanded", String(Boolean(open)));
    if (open) els.bulkTags?.focus();
  });
  // Modifier un réglage coche sa case ; décocher la case restaure la valeur initiale.
  bindBulkFieldGroups();
  els.bulkEditDialog?.addEventListener("click", (event) => {
    if (event.target === els.bulkEditDialog) els.bulkEditDialog.close();
  });
  els.bulkEditDialog?.addEventListener("close", () => {
    resetBulkAutoTrimUi();
    // Sortie de modif groupée : « masquer les pads non sélectionnés » revient au neutre.
    if (state.filterCompact) {
      state.filterCompact = false;
      syncFilterCompact();
      syncCompactToggleVisibility();
    }
  });
  els.bulkTemplatePad?.addEventListener("change", () => {
    const pad = state.bulkEditPads.find((item) => String(item.index) === els.bulkTemplatePad.value);
    syncBulkTemplateFields(pad);
  });
  els.bulkColorButtons?.forEach((button) => {
    button.addEventListener("click", () => setBulkColorValue(button.dataset.bulkColor || ""));
  });
  els.bulkAutoTrim?.addEventListener("click", () => {
    prepareBulkAutoTrim().catch(() => setStatus("Trim auto groupé impossible"));
  });
  els.applyBulkEdit?.addEventListener("click", () => {
    applyBulkEdit().catch(() => setStatus("Modification groupée impossible"));
  });
  els.copyPadToBoard?.addEventListener("click", () => {
    transferPadToBoard(false).catch(() => setStatus("Copie impossible"));
  });
  els.movePadToBoard?.addEventListener("click", () => {
    transferPadToBoard(true).catch(() => setStatus("Déplacement impossible"));
  });
  els.cancelPadTransfer?.addEventListener("click", () => {
    state.transferPad = null;
    els.padTransferDialog?.close();
  });
  els.padTransferDialog?.addEventListener("click", (event) => {
    if (event.target === els.padTransferDialog) {
      state.transferPad = null;
      els.padTransferDialog.close();
    }
  });
  bindSafeActionButton(els.saveVersion, () => saveBoardVersion().catch(() => setStatus("Sauvegarde impossible")));
  bindSafeActionButton(els.restoreVersion, () => restoreSelectedBoardVersion().catch(() => setStatus("Restauration impossible")));
  els.renameVersion?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const wasEditing = state.boardEditMode;
    renameSelectedBoardVersion()
      .then(() => {
        if (!wasEditing && state.boardEditMode) setBoardPadEditing(false);
      })
      .catch(() => setStatus("Renommage impossible"));
  });
  bindSafeActionButton(els.archiveVersion, () => {
    const wasEditing = state.boardEditMode;
    toggleSelectedBoardVersionArchive()
      .then(() => {
        if (!wasEditing && state.boardEditMode) setBoardPadEditing(false);
      })
      .catch(() => setStatus("Archivage impossible"));
  });
  bindSafeActionButton(els.deleteVersion, () => deleteSelectedBoardVersion().catch(() => setStatus("Suppression version impossible")));
  els.versionSelect?.addEventListener("change", () => {
    selectedVersionSnapshot()
      .then(({ history }) => syncVersionButtons(history))
      .catch(() => syncVersionButtons([]));
  });
  bindSafeActionButton(els.versionNotes, () => openVersionNotesDialog().catch(() => setStatus("Notes indisponibles")));
  els.closeVersionNotes?.addEventListener("click", () => {
    closeVersionNotesDialog().catch(() => setStatus("Enregistrement notes impossible"));
  });
  els.versionNotesDialog?.addEventListener("click", (event) => {
    if (event.target === els.versionNotesDialog) {
      closeVersionNotesDialog().catch(() => setStatus("Enregistrement notes impossible"));
    }
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
  els.boardNotice?.addEventListener("click", () => {
    exportBoardNotice().catch(() => setStatus("Notice impossible"));
  });
  els.addPad?.addEventListener("click", addPad);
  els.exportBoardAudioOnly?.addEventListener("click", () => {
    exportCurrentBoard("audioOnly")
      .then(() => setBoardPadEditing(false))
      .catch(() => setStatus("Export sons et réglages impossible"));
  });
  els.exportBoardLite?.addEventListener("click", () => {
    exportCurrentBoard("settings")
      .then(() => setBoardPadEditing(false))
      .catch(() => setStatus("Export sans audio impossible"));
  });
  els.importBoard?.addEventListener("click", () => els.importBoardFile?.click());
  els.importBoardFile?.addEventListener("change", () => {
    const file = els.importBoardFile.files?.[0];
    if (file) {
      importBoardFile(file)
        .then(() => setBoardPadEditing(false))
        .catch(() => setStatus("Import impossible"));
      els.importBoardFile.value = "";
    }
  });
  els.relinkAudioFolder?.addEventListener("click", () => {
    if (!els.relinkAudioFolderInput) return;
    setStatus("Choisir le dossier contenant les sons");
    els.relinkAudioFolderInput.click();
  });
  els.relinkAudioFolderInput?.addEventListener("change", () => {
    const files = els.relinkAudioFolderInput.files;
    if (files?.length) {
      relinkMissingAudioFromFolder(files).catch(() => setStatus("Relocalisation impossible"));
      els.relinkAudioFolderInput.value = "";
    }
  });
  els.relinkVideoFolder?.addEventListener("click", () => {
    if (!els.relinkVideoFolderInput) return;
    setStatus("Choisir le dossier contenant les vidéos");
    els.relinkVideoFolderInput.click();
  });
  els.relinkVideoFolderInput?.addEventListener("change", () => {
    const files = els.relinkVideoFolderInput.files;
    if (files?.length) {
      const boardId = state.currentBoardId;
      relinkMissingVideoFromFolder(files, boardId).catch(() => setStatus("Relocalisation vidéo impossible"));
      els.relinkVideoFolderInput.value = "";
    }
  });
  els.applyFolderImport?.addEventListener("click", () => {
    applyFolderImportSelection().catch(() => setStatus("Ajout des sons impossible"));
  });
  els.cancelFolderImport?.addEventListener("click", () => {
    state.folderImportFiles = [];
    els.folderImportDialog?.close();
    setStatus("Ajout des sons annulé");
  });
  els.exportCleanupAudio?.addEventListener("click", () => {
    exportCleanupAudioFiles().catch(() => setStatus("Enregistrement des sons impossible"));
  });
  els.confirmAudioCleanup?.addEventListener("click", () => {
    deleteSelectedCleanupAudio().catch(() => setStatus("Suppression audio impossible"));
  });
  els.cancelAudioCleanup?.addEventListener("click", () => {
    state.audioCleanupCandidates = [];
    els.audioCleanupDialog?.close();
    setStatus("Sons conservés");
  });
  els.refreshMicrophones?.addEventListener("click", () => {
    refreshMicrophoneDevices(true).catch(() => setStatus("Micro inaccessible"));
  });
  els.applyMicrophone?.addEventListener("click", (event) => {
    stopEvent(event);
    selectMicrophoneFromDialog().catch(() => setStatus("Sélection micro impossible"));
  });
  els.cancelMicrophone?.addEventListener("click", () => {
    state.pendingRecordingPad = null;
    els.microphoneDialog?.close();
    setStatus("Micro non sélectionné");
  });
  els.microphoneDialog?.addEventListener("click", (event) => {
    if (event.target === els.microphoneDialog) {
      state.pendingRecordingPad = null;
      els.microphoneDialog.close();
    }
  });
  els.folderImportDialog?.addEventListener("click", (event) => {
    if (event.target === els.folderImportDialog) {
      state.folderImportFiles = [];
      els.folderImportDialog.close();
    }
  });
  els.audioCleanupDialog?.addEventListener("click", (event) => {
    if (event.target === els.audioCleanupDialog) {
      state.audioCleanupCandidates = [];
      els.audioCleanupDialog.close();
    }
  });
  const openContextHelp = (sectionKeys, title = "Aide") => {
    if (!els.helpDialog) return;
    const allowed = new Set(sectionKeys);
    els.helpSections?.forEach((section) => {
      section.hidden = !allowed.has(section.dataset.helpSection);
    });
    let visibleColumns = 0;
    els.helpColumns?.forEach((column) => {
      const hasVisibleSection = [...column.querySelectorAll("[data-help-section]")].some((section) => !section.hidden);
      column.hidden = !hasVisibleSection;
      if (hasVisibleSection) visibleColumns += 1;
    });
    els.helpDialog.classList.toggle("single-help-column", visibleColumns <= 1);
    if (els.helpTitle) els.helpTitle.textContent = title;
    if (els.helpDialog.open) return;
    if (typeof els.helpDialog.showModal === "function") {
      els.helpDialog.showModal();
    } else if (typeof els.helpDialog.show === "function") {
      els.helpDialog.show();
    }
  };

  els.helpButton?.addEventListener("click", () => {
    if (state.boardEditMode) {
      openContextHelp(["board-edit", "pad-edit"], "Aide Board / Pad (Edit)");
    } else {
      openContextHelp(["board-live", "pad-live"], "Aide Board / Pad (Live)");
    }
  });
  els.masterAudioHelp?.addEventListener("click", () => openContextHelp(["audio-master"], "Aide Audio (Master)"));
  document.querySelector("#audioHelp")?.addEventListener("click", () => openContextHelp(["audio-pad"], "Aide Réglages du pad"));
  els.masterHelp?.addEventListener("click", () => openContextHelp(["master"], "Aide Master"));
  els.cuesHelp?.addEventListener("click", () => openContextHelp(["cues-crossfade"], "Aide Cues / Crossfade"));
  els.closeHelp?.addEventListener("click", () => els.helpDialog?.close());
  els.helpDialog?.addEventListener("click", (event) => {
    if (event.target === els.helpDialog) els.helpDialog.close();
  });
  els.closeAudio?.addEventListener("click", () => {
    stopAudioDialogStartedPlayback();
    restoreAudioDraft()
      .catch(() => setStatus("Annulation audio impossible"))
      .finally(() => {
        state.audioDraft = null;
        state.audioMediaDraft = null;
        state.audioCrossfadeDraft = null;
        els.audioDialog?.close();
      });
  });
  els.applyAudio?.addEventListener("click", async () => {
    if (state.audioPad) {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      await settleNativeSelects();
      updateAudioCrossfadeDraftFromControls();
      saveAudioPadFromDialog();
    }
    state.audioDraft = null;
    state.audioMediaDraft = null;
    state.audioCrossfadeDraft = null;
    stopAudioDialogStartedPlayback();
    els.audioDialog?.close();
  });
  els.cancelAudio?.addEventListener("click", () => {
    stopAudioDialogStartedPlayback();
    restoreAudioDraft()
      .catch(() => setStatus("Annulation audio impossible"))
      .finally(() => {
        state.audioDraft = null;
        state.audioMediaDraft = null;
        state.audioCrossfadeDraft = null;
        els.audioDialog?.close();
      });
  });
  els.masterAudio?.addEventListener("click", () => {
    state.masterAudioDraft = masterAudioDraftFromControls();
    updateEndingAlertHint();
    refreshMicrophoneDevices(false).catch(() => {});
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
  els.masterOutputSelect?.addEventListener("pointerdown", (event) => {
    handleOutputSelectPointer(event, "master").catch(() => setStatus("Sortie master impossible"));
  });
  els.masterOutputSelect?.addEventListener("keydown", (event) => {
    handleOutputSelectKeydown(event, "master").catch(() => setStatus("Sortie master impossible"));
  });
  els.masterOutputSelect?.addEventListener("change", () => {
    handleMasterOutputChange().catch(() => setStatus("Sortie master impossible"));
  });
  els.masterCueOutputSelect?.addEventListener("pointerdown", (event) => {
    handleOutputSelectPointer(event, "cue").catch(() => setStatus("Sortie Cue impossible"));
  });
  els.masterCueOutputSelect?.addEventListener("keydown", (event) => {
    handleOutputSelectKeydown(event, "cue").catch(() => setStatus("Sortie Cue impossible"));
  });
  els.masterCueOutputSelect?.addEventListener("change", () => {
    handleCueOutputChange().catch(() => setStatus("Sortie Cue impossible"));
  });
  els.masterMicrophoneSelect?.addEventListener("pointerdown", () => {
    refreshMicrophoneDevices(true).catch(() => setStatus("Micro inaccessible"));
  });
  els.masterMicrophoneSelect?.addEventListener("change", () => {
    selectMicrophoneFromMaster();
  });
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
  els.armedCrossfadeEnabled?.addEventListener("change", () => {
    localStorage.setItem(ARMED_CROSSFADE_ENABLED_STORAGE, els.armedCrossfadeEnabled.checked ? "on" : "off");
    syncArmedCrossfadeControls();
    updateMasterOptionBadges();
  });
  els.armedCrossfadeSeconds?.addEventListener("input", () => {
    const value = Math.max(0, Number(els.armedCrossfadeSeconds.value) || 0);
    els.armedCrossfadeSeconds.value = String(value);
    localStorage.setItem(ARMED_CROSSFADE_SECONDS_STORAGE, String(value));
    syncArmedCrossfadeControls();
    updateMasterOptionBadges();
  });
  els.armedCrossfadeSeconds?.addEventListener("change", () => {
    const value = Math.max(0, Number(els.armedCrossfadeSeconds.value) || 0);
    els.armedCrossfadeSeconds.value = String(value);
    localStorage.setItem(ARMED_CROSSFADE_SECONDS_STORAGE, String(value));
    syncArmedCrossfadeControls();
    updateMasterOptionBadges();
  });
  ["input", "change"].forEach((evt) => {
    els.endingAlertSeconds?.addEventListener(evt, () => {
      const value = Math.max(1, Math.round(Number(els.endingAlertSeconds.value) || DEFAULT_ENDING_ALERT_SECONDS));
      if (evt === "change") els.endingAlertSeconds.value = String(value);
      localStorage.setItem(ENDING_ALERT_STORAGE, String(value));
      updateEndingAlertHint();
      updateAllPadAlerts();
    });
  });
  [els.masterReverbPreset, els.masterReverbWet].forEach((element) => {
    element?.addEventListener("input", () => {
      saveMasterReverbSettings();
      applyMasterReverb();
    });
  });
  [els.masterEqLow, els.masterEqMid, els.masterEqHigh].forEach((element) => {
    element?.addEventListener("input", () => {
      saveMasterEqSettings();
      applyMasterEq();
      state.pads.forEach(refreshPlayingPadOutput);
    });
  });
  els.audioDialog?.addEventListener("click", (event) => {
    if (event.target === els.audioDialog) {
      stopAudioDialogStartedPlayback();
      restoreAudioDraft()
        .catch(() => setStatus("Annulation audio impossible"))
        .finally(() => {
          state.audioDraft = null;
          state.audioMediaDraft = null;
          state.audioCrossfadeDraft = null;
          els.audioDialog.close();
        });
    }
  });
  bindAudioDialogTrim();
  els.audioAutoTrim?.addEventListener("click", () => {
    applyAutoTrimToAudioDialog().catch(() => setStatus("Trim auto impossible"));
  });
  els.audioTestPlay?.addEventListener("click", () => {
    toggleAudioDialogTest();
  });
  els.audioTestStop?.addEventListener("click", () => {
    stopAudioDialogStartedPlayback();
  });
  els.audioRecord?.addEventListener("click", () => {
    if (state.audioPad) toggleRecording(state.audioPad);
  });
  els.audioErase?.addEventListener("click", () => {
    if (state.audioPad) clearAudioPadMedia(state.audioPad).catch(() => setStatus("Effacement impossible"));
  });
  els.audioImport?.addEventListener("click", () => {
    if (state.audioPad) state.audioPad.fileInput?.click();
  });
  els.audioVideoImport?.addEventListener("click", () => {
    if (state.audioPad) els.audioVideoFile?.click();
  });
  els.audioRegionsEdit?.addEventListener("click", () => {
    if (state.audioPad) openPadRegionsEditor(state.audioPad);
  });
  aeEl("aeModeRegions")?.addEventListener("click", () => aeSetMode("regions"));
  aeEl("aeModeEnvelope")?.addEventListener("click", () => aeSetMode("envelope"));
  aeEl("aeEnvFromFades")?.addEventListener("click", () => {
    if (!aePad) return;
    aeSeedFadesIntoEnvelope(aePad); // re-cale les extrémités sur les fades ; reste "non sale" (suit les cuts)
    aeEnvBaselineSig = aeEnvSig(aeEnvelope?.getPoints());
  });
  aeEl("aeTrimAuto")?.addEventListener("click", aeRunTrimAuto);
  aeEl("aeAddCut")?.addEventListener("click", () => aeAdd("cut"));
  aeEl("aeAddSilence")?.addEventListener("click", () => aeAdd("silence"));
  aeEl("aeReset")?.addEventListener("click", aeReset);
  aeEl("aeUndo")?.addEventListener("click", aeUndo);
  aeEl("aePlay")?.addEventListener("click", () => {
    if (!aeWS) return;
    if (!aeWS.isPlaying?.()) { // au lancement, si le curseur est hors du trim, démarrer au début du trim
      const b = aeTrimBoundsOrig();
      const t = aeWS.getCurrentTime?.() || 0;
      if (b && (t < b.origIn - 0.005 || t >= b.origOut - 0.005)) aeWS.setTime(Math.max(0, b.origIn));
    }
    aeWS.playPause();
  });
  aeEl("aeToStart")?.addEventListener("click", () => {
    const b = aeTrimBoundsOrig(); // « revenir au début » = début de la région conservée
    aeWS?.setTime(b ? Math.max(0, b.origIn) : 0);
  });
  let aePx = 1;
  aeEl("aeZoomIn")?.addEventListener("click", () => { aePx = Math.min(600, aePx * 1.6); aeWS?.zoom(aePx); });
  aeEl("aeZoomOut")?.addEventListener("click", () => { aePx = Math.max(1, aePx / 1.6); aeWS?.zoom(aePx); });
  aeEl("aeApply")?.addEventListener("click", aeApply);
  aeEl("aeCancel")?.addEventListener("click", () => { els.audioEditorDialog?.close(); aeDestroy(); });
  aeEl("aeHelp")?.addEventListener("click", () => { const p = aeEl("aeHelpPanel"); if (p) p.hidden = false; });
  aeEl("aeHelpClose")?.addEventListener("click", () => { const p = aeEl("aeHelpPanel"); if (p) p.hidden = true; });
  els.audioTextImport?.addEventListener("click", () => {
    if (!state.audioPad) return;
    // Already a text pad → import a file directly (the inline editor is already
    // available for typing). Otherwise offer the file/type choice.
    if (padType(state.audioPad) === "text") {
      els.audioTextFile?.click();
      return;
    }
    const chooseFile = window.confirm("OK : sélectionner un fichier texte. Annuler : saisir le texte.");
    if (chooseFile) {
      els.audioTextFile?.click();
    } else {
      setPadAsTextFromControls(state.audioPad, state.audioPad.textContent || "", { forceText: true });
      syncAudioDialog(state.audioPad);
      requestAnimationFrame(() => {
        els.audioTextInlineEditor?.focus();
        els.audioTextInlineEditor?.select();
      });
    }
  });
  els.audioVideoFile?.addEventListener("change", () => {
    const file = els.audioVideoFile.files?.[0];
    if (file && state.audioPad) {
      loadVideoIntoPad(state.audioPad, file).catch(() => setStatus("Import vidéo impossible"));
      els.audioVideoFile.value = "";
    }
  });
  els.audioTextFile?.addEventListener("change", async () => {
    const file = els.audioTextFile.files?.[0];
    const pad = state.audioPad;
    if (!file || !pad) return;
    try {
      const text = await readTextFile(file);
      pad.textName = file.name || "Texte";
      setPadAsTextFromControls(pad, text);
      if (isDefaultPadTitle(pad.title)) setPadTitle(pad, cleanName(file.name || "Texte"));
      syncAudioDialog(pad);
      saveAudioPadFromDialog();
      setStatus("Texte importé");
    } catch {
      setStatus("Import texte impossible");
    } finally {
      els.audioTextFile.value = "";
    }
  });
  els.audioReset?.addEventListener("click", resetAudioDialogSettings);
  els.audioNormalize?.addEventListener("change", () => {
    if (!state.audioPad) return;
    setPadNormalization(state.audioPad, els.audioNormalize.checked, state.audioPad.normalizedGain);
    if (state.audioPad.gain && state.audioContext) {
      state.audioPad.gain.gain.setTargetAtTime(targetPadGain(state.audioPad), state.audioContext.currentTime, 0.015);
    }
    syncVideoProjectionAudio(state.audioPad);
    syncAudioDialog(state.audioPad);
    saveAudioPadFromDialog();
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
    saveAudioPadFromDialog();
  });
  els.audioLoop?.addEventListener("click", () => {
    if (!state.audioPad) return;
    setPadLoop(state.audioPad, !state.audioPad.loop);
    if (state.audioPad.source) state.audioPad.source.loop = state.audioPad.loop;
    syncVideoProjectionAudio(state.audioPad);
    syncAudioDialog(state.audioPad);
    saveAudioPadFromDialog();
  });
  els.audioReverse?.addEventListener("change", () => {
    if (!state.audioPad) return;
    setPadAudioSettings(state.audioPad, { reverse: els.audioReverse.checked });
    if (state.audioPad.source) refreshPlayingPadOutput(state.audioPad);
    syncAudioDialog(state.audioPad);
    saveAudioPadFromDialog();
  });
  [els.audioDuckNone, els.audioDuckGlobal, els.audioDuckPad].forEach((element) => {
    element?.addEventListener("change", () => {
      if (!state.audioPad) return;
      const nextMode = els.audioDuckNone?.checked ? "none" : (els.audioDuckPad?.checked ? "pad" : "global");
      setPadDuckMode(state.audioPad, nextMode, state.audioPad.duckPercent || duckPercentValue());
      applyDucking();
      syncVideoProjectionAudio(state.audioPad);
      syncAudioDialog(state.audioPad);
      saveAudioPadFromDialog();
    });
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
      saveAudioPadFromDialog();
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
      saveAudioPadFromDialog();
    });
  });
  [els.audioEqNone, els.audioEqGlobal, els.audioEqPad].forEach((element) => {
    element?.addEventListener("change", () => {
      if (!state.audioPad) return;
      setPadAudioSettings(state.audioPad, {
        eqMode: els.audioEqNone?.checked ? "none" : (els.audioEqPad?.checked ? "pad" : "global"),
      });
      refreshPlayingPadOutput(state.audioPad);
      syncAudioDialog(state.audioPad);
      saveAudioPadFromDialog();
    });
  });
  [els.audioFadeIn, els.audioFadeOut, els.audioPitchSemitones, els.audioPitchFine, els.audioReverbPreset, els.audioReverbWet, els.audioEqLow, els.audioEqMid, els.audioEqHigh, els.audioDuckPercent].forEach((element) => {
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
        duckMode: els.audioDuckNone?.checked ? "none" : (els.audioDuckPad?.checked ? "pad" : "global"),
        duckPercent: els.audioDuckPercent?.value,
        eqMode: els.audioEqNone?.checked ? "none" : (els.audioEqPad?.checked ? "pad" : "global"),
        eqLow: els.audioEqLow?.value,
        eqMid: els.audioEqMid?.value,
        eqHigh: els.audioEqHigh?.value,
      });
      applyDucking();
      syncVideoProjectionAudio(state.audioPad);
      if (state.audioPad.source && state.audioContext) {
        const now = state.audioContext.currentTime;
        state.audioPad.source.detune?.setTargetAtTime((state.audioPad.pitchSemitones + state.audioPad.pitchFine / 100) * 100, now, 0.015);
        if ([els.audioReverbPreset, els.audioReverbWet, els.audioEqLow, els.audioEqMid, els.audioEqHigh].includes(element)) {
          refreshPlayingPadOutput(state.audioPad);
        }
      }
      syncAudioDialog(state.audioPad);
      saveAudioPadFromDialog();
    });
  });
  const saveAudioTextControlSettings = () => {
    if (!state.audioPad) return;
    setPadTextSettings(state.audioPad, {
      textLang: els.audioTextLang?.value,
      textGender: audioTextGenderValue(state.audioPad.textGender),
      textVoiceURI: els.audioTextVoice?.value,
      textRate: els.audioTextRate?.value,
    });
    syncAudioDialog(state.audioPad);
    saveAudioPadFromDialog();
  };
  [els.audioTextLang, els.audioTextGenderFemale, els.audioTextGenderMale, els.audioTextVoice, els.audioTextRate].forEach((element) => {
    element?.addEventListener("input", saveAudioTextControlSettings);
    element?.addEventListener("change", saveAudioTextControlSettings);
  });
  els.audioTextInlineEditor?.addEventListener("input", () => {
    if (!state.audioPad) return;
    setPadAsTextFromControls(state.audioPad, els.audioTextInlineEditor.value);
    syncAudioDialog(state.audioPad);
    saveAudioPadFromDialog();
  });
  els.applyText?.addEventListener("click", applyTextDialog);
  els.cancelText?.addEventListener("click", cancelTextDialog);
  els.textDialog?.addEventListener("click", (event) => {
    if (event.target === els.textDialog) cancelTextDialog();
  });
  els.noteEditor?.addEventListener("input", syncNoteDialogVisibility);
  els.applyNote?.addEventListener("click", applyNoteDialog);
  els.cancelNote?.addEventListener("click", cancelNoteDialog);
  els.noteDialog?.addEventListener("click", (event) => {
    if (event.target === els.noteDialog) cancelNoteDialog();
  });
  els.padNoteOverlay?.addEventListener("click", () => hidePadNoteOverlay());
  const handleAudioCrossfadeChange = () => {
    if (!state.audioPad) return;
    if (els.audioStartStopMode?.value === "none" && els.audioStartStopTarget) els.audioStartStopTarget.value = "";
    if (els.audioEndStartMode?.value === "none" && els.audioEndStartTarget) els.audioEndStartTarget.value = "";
    updateAudioCrossfadeDraftFromControls();
    window.setTimeout(() => {
      if (state.audioPad) updateAudioCrossfadeDraftFromControls();
    }, 0);
  };
  [els.audioStartStopMode, els.audioStartStopTarget, els.audioEndStartMode, els.audioEndStartTarget].forEach((element) => {
    element?.addEventListener("input", handleAudioCrossfadeChange);
    element?.addEventListener("change", handleAudioCrossfadeChange);
    element?.addEventListener("blur", handleAudioCrossfadeChange);
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
    setImageDialogMode("color");
  });
  els.imageColorButtons?.forEach((button) => {
    button.addEventListener("click", () => {
      const pad = state.imagePad;
      if (!pad) return;
      setPadColor(pad, button.dataset.imageColor || "");
      if (!button.dataset.imageColor || !pad.visualImage) setPadVisualImage(pad, "", false);
      syncImageDialog(pad);
      savePadMeta(pad);
    });
  });
  els.imageLibrary?.addEventListener("click", () => {
    setImageDialogMode("image");
    state.imagePad?.imageInput?.click();
  });
  els.imageCamera?.addEventListener("click", () => {
    setImageDialogMode("image");
    state.imagePad?.cameraInput?.click();
  });
  els.imageDialog?.addEventListener("dragover", (event) => {
    if (!event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    els.imageDialog.classList.add("is-drop-target");
  });
  els.imageDialog?.addEventListener("dragleave", (event) => {
    if (!els.imageDialog.contains(event.relatedTarget)) els.imageDialog.classList.remove("is-drop-target");
  });
  els.imageDialog?.addEventListener("drop", async (event) => {
    els.imageDialog.classList.remove("is-drop-target");
    event.preventDefault();
    const pad = state.imagePad;
    if (!pad) return;
    const file = [...(event.dataTransfer?.files || [])].find((f) => /^image\//.test(f.type));
    if (!file) return;
    try {
      const dataUrl = await resizeImageForPad(file);
      if (!dataUrl) return;
      setPadVisualImage(pad, dataUrl, false, { visualKind: "image" });
      state.imageDialogMode = "image";
      syncImageDialog(pad);
    } catch {
      setStatus("Impossible de charger l'image");
    }
  });
  els.imageRemove?.addEventListener("click", () => {
    const pad = state.imagePad;
    if (!pad) return;
    setPadColor(pad, "");
    setPadVisualImage(pad, "", false);
    if (state.imageDialogMode === "sketch") {
      initSketchCanvas();
      clearSketchCanvas();
    }
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
  bindSketchTools();
  bindBulkSketchCanvas();
  bindBulkSketchTools();
  bindBulkVisual();
  syncBulkVisualMode("color");
  syncBulkSketchTools();
  els.shortcutEnabled?.addEventListener("change", () => {
    state.shortcutsEnabled = els.shortcutEnabled.checked;
    updateShortcutIndicators();
  });
  els.keyboardShortcuts?.addEventListener("click", (event) => {
    if (els.keyboardShortcuts.disabled || els.keyboardShortcuts.getAttribute("aria-disabled") === "true") {
      stopEvent(event);
      return;
    }
    renderShortcutRows();
    state.shortcutDraft = shortcutDraftFromState();
    if (els.shortcutDialog?.showModal) {
      els.shortcutDialog.showModal();
    } else {
      setStatus("Raccourcis clavier");
    }
  });
  els.closeShortcuts?.addEventListener("click", () => {
    restoreShortcutDraft();
    state.shortcutDraft = null;
    els.shortcutDialog?.close();
    setBoardPadEditing(false);
  });
  els.applyShortcuts?.addEventListener("click", () => {
    saveShortcutDraft();
    els.shortcutDialog?.close();
    setBoardPadEditing(false);
  });
  els.cancelShortcuts?.addEventListener("click", () => {
    restoreShortcutDraft();
    state.shortcutDraft = null;
    els.shortcutDialog?.close();
    setBoardPadEditing(false);
  });
  els.shortcutDialog?.addEventListener("click", (event) => {
    if (event.target === els.shortcutDialog) {
      restoreShortcutDraft();
      state.shortcutDraft = null;
      els.shortcutDialog.close();
      setBoardPadEditing(false);
    }
  });
  bindEscapeClose(els.helpDialog);
  bindEscapeClose(els.patchBayDialog);
  bindEscapeClose(els.cancelEditDialog);
  bindEscapeClose(els.cueDialog, () => {
    clearCueDialogDraft();
  });
  bindEscapeClose(els.bulkEditDialog);
  bindEscapeClose(els.padTransferDialog, () => {
    state.transferPad = null;
  });
  bindEscapeClose(els.folderImportDialog, () => {
    state.folderImportFiles = [];
  });
  bindEscapeClose(els.audioCleanupDialog, () => {
    state.audioCleanupCandidates = [];
  });
  bindEscapeClose(els.microphoneDialog, () => {
    state.pendingRecordingPad = null;
  });
  bindEscapeClose(els.audioDialog, () => {
    stopAudioDialogStartedPlayback();
    restoreAudioDraft().catch(() => setStatus("Annulation audio impossible"));
    state.audioDraft = null;
    state.audioMediaDraft = null;
  });
  bindEscapeClose(els.masterAudioDialog, () => {
    restoreMasterAudioDraft();
    state.masterAudioDraft = null;
  });
  bindEscapeClose(els.imageDialog, () => {
    restoreImageDraft();
    state.imageDraft = null;
  });
  bindEscapeClose(els.noteDialog, cancelNoteDialog);
  bindEscapeClose(els.versionNotesDialog, () => {
    closeVersionNotesDialog().catch(() => setStatus("Enregistrement notes impossible"));
  });
  bindEscapeClose(els.shortcutDialog, () => {
    restoreShortcutDraft();
    state.shortcutDraft = null;
    setBoardPadEditing(false);
  });
  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!closeOpenDialogFromEscape()) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
  bindButtonFeedback(document.querySelector(".topbar"));
  bindKeyboard();
  bindPerformanceTouchGuards();

  setStatus("Touchez un pad ou chargez vos sons");
}

init();

function shouldUseServiceWorker() {
  const ua = navigator.userAgent || "";
  const firefox = /Firefox|FxiOS/i.test(ua);
  return !(firefox && isPortableDevice());
}

if ("serviceWorker" in navigator && window.isSecureContext && shouldUseServiceWorker()) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
} else if ("serviceWorker" in navigator && !shouldUseServiceWorker()) {
  navigator.serviceWorker.getRegistrations?.()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => {});
}

/* Sélecteur de modes Garage / Studio / Scène */
function boardModeSelectorCurrentMode() {
  if (document.body.classList.contains("stage-mode") || state.stageMode) return "stage";
  if (document.body.classList.contains("board-edit-mode") || state.boardEditMode) return "garage";
  return "studio";
}

function boardModeSelectorAllowedModes(current = boardModeSelectorCurrentMode()) {
  return {
    stage: current === "studio" || current === "stage",
    studio: true,
    garage: current === "studio" || current === "garage",
  };
}

function syncBoardModeSelector() {
  const current = boardModeSelectorCurrentMode();
  const allowed = boardModeSelectorAllowedModes(current);

  if (document.body.dataset.boardMode !== current) {
    document.body.dataset.boardMode = current;
  }

  if (current === "stage" && typeof setBoardModePending === "function") {
    setBoardModePending("");
  }

  document.querySelectorAll("[data-board-mode-target]").forEach((button) => {
    const mode = String(button.dataset.boardModeTarget || "");
    const isCurrent = mode === current;
    const isAllowed = Boolean(allowed[mode]);

    button.classList.toggle("is-current", isCurrent);
    button.classList.toggle("is-disabled", !isAllowed);

    button.disabled = !isAllowed;
    button.setAttribute("aria-disabled", String(!isAllowed));
    button.setAttribute("aria-current", isCurrent ? "true" : "false");
    button.setAttribute("aria-pressed", String(isCurrent));
  });
}

function syncBoardModeSelectorSoon() {
  syncBoardModeSelector();
  window.requestAnimationFrame?.(syncBoardModeSelector);
  window.setTimeout(syncBoardModeSelector, 80);
}

function setBoardModePending(targetMode = "") {
  document.querySelectorAll("[data-board-mode-target]").forEach((button) => {
    const isPending = Boolean(targetMode) && button.dataset.boardModeTarget === targetMode;
    button.classList.toggle("is-pending", isPending);
    button.setAttribute("aria-busy", String(isPending));
  });
}

function setBoardModeFromSelector(targetMode) {
  const current = boardModeSelectorCurrentMode();
  const allowed = boardModeSelectorAllowedModes(current);

  if (!allowed[targetMode]) {
    setStatus("Passer par le mode Studio");
    syncBoardModeSelectorSoon();
    return;
  }

  if (targetMode === current) {
    syncBoardModeSelectorSoon();
    return;
  }

  if (targetMode === "studio") {
    // Suspendre l'observateur pendant la transition pour éviter les lectures d'état intermédiaire
    boardModeBodyObserver.disconnect();
    if (state.stageMode || document.body.classList.contains("stage-mode")) {
      setStageMode(false, false);
    }
    if (state.boardEditMode || document.body.classList.contains("board-edit-mode")) {
      setBoardPadEditing(false);
    }
    boardModeBodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    syncBoardModeSelectorSoon();
    return;
  }

  if (targetMode === "garage") {
    if (current !== "studio") {
      setStatus("Passer par le mode Studio");
      syncBoardModeSelectorSoon();
      return;
    }
    boardModeBodyObserver.disconnect();
    setBoardPadEditing(true);
    boardModeBodyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    syncBoardModeSelectorSoon();
    return;
  }

  if (targetMode === "stage") {
    if (current !== "studio") {
      setStatus("Passer par le mode Studio");
      syncBoardModeSelectorSoon();
      return;
    }
    setBoardModePending("stage");
    setStageMode(true, false);
  }
}

document.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-board-mode-target]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  setBoardModeFromSelector(button.dataset.boardModeTarget);
});

const boardModeBodyObserver = new MutationObserver(syncBoardModeSelectorSoon);
boardModeBodyObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
});

window.addEventListener("load", () => window.setTimeout(syncBoardModeSelectorSoon, 0));
window.addEventListener("resize", () => window.setTimeout(syncBoardModeSelectorSoon, 0));


/* Alignement dynamique Studio vers Scène */
const stageStudioLayoutSnapshot = {
  selectorRect: null,
  topbarRect: null,
  inlineStyles: [],
};

function stageStudioLayoutElements() {
  return [
    [document.querySelector(".topbar"), ["grid-template-columns", "align-items", "gap"]],
    [document.querySelector(".brand"), ["display", "align-items", "gap", "min-height"]],
    [document.querySelector(".mark"), ["width", "height", "min-width", "min-height"]],
    [document.querySelector(".mark svg"), ["width", "height"]],
    [document.querySelector(".brand h1"), ["font-size", "line-height", "margin", "font-weight"]],
    [document.querySelector(".brand p"), ["font-size", "line-height", "margin", "display"]],
    [document.querySelector("#audioStatus"), ["font-size", "line-height", "margin", "display"]],
    [document.querySelector(".brand-tools"), ["display", "align-self", "grid-template-columns", "gap"]],
  ].filter(([element]) => Boolean(element));
}

function captureStudioLayoutForStage() {
  const selector = document.querySelector(".board-mode-selector");
  const currentMode = typeof boardModeSelectorCurrentMode === "function"
    ? boardModeSelectorCurrentMode()
    : (document.body.classList.contains("stage-mode") ? "stage" : "studio");

  if (!selector || currentMode !== "studio") return;

  // Flush any pending stage transforms so positions are measured clean
  clearStageStudioLayout();

  stageStudioLayoutSnapshot.selectorRect = selector.getBoundingClientRect();

  const topbar = document.querySelector(".topbar");
  stageStudioLayoutSnapshot.topbarRect = topbar ? topbar.getBoundingClientRect() : null;

  stageStudioLayoutSnapshot.inlineStyles = stageStudioLayoutElements().map(([element, props]) => {
    const computed = window.getComputedStyle(element);
    return {
      element,
      props: props.map((prop) => [prop, computed.getPropertyValue(prop)]),
    };
  });
}

function clearStageStudioLayout() {
  stageStudioLayoutSnapshot.inlineStyles.forEach(({ element, props }) => {
    props.forEach(([prop]) => element.style.removeProperty(prop));
  });

  const topbar = document.querySelector(".topbar");
  if (topbar) {
    topbar.style.removeProperty("position");
    topbar.style.removeProperty("transform");
    topbar.style.removeProperty("top");
    topbar.style.removeProperty("left");
  }

  const boardStrip = document.querySelector(".board-strip");
  if (boardStrip) {
    boardStrip.style.removeProperty("position");
    boardStrip.style.removeProperty("transform");
    boardStrip.style.removeProperty("left");
    boardStrip.style.removeProperty("top");
  }
}

function applyStageStudioLayout() {
  if (!document.body.classList.contains("stage-mode")) {
    clearStageStudioLayout();
    return;
  }

  stageStudioLayoutSnapshot.inlineStyles.forEach(({ element, props }) => {
    props.forEach(([prop, value]) => {
      element.style.setProperty(prop, value, "important");
    });
  });

  const topbar = document.querySelector(".topbar");
  const studioTopbarRect = stageStudioLayoutSnapshot.topbarRect;

  if (topbar && studioTopbarRect) {
    topbar.style.setProperty("position", "relative", "important");
    topbar.style.setProperty("left", "0", "important");

    const stageTopbarRect = topbar.getBoundingClientRect();
    const topbarDy = Math.round(studioTopbarRect.top - stageTopbarRect.top);

    topbar.style.setProperty("transform", `translateY(${topbarDy}px)`, "important");
  }

  // On mobile the CSS grid already positions the board-strip correctly in stage
  // mode (position: static; transform: none via skin CSS). Skip JS transforms
  // so they don't fight the cascade and misplace the board.
  if (window.matchMedia("(max-width: 950px), (pointer: coarse)").matches) return;

  const boardStrip = document.querySelector(".board-strip");
  const selector = document.querySelector(".board-mode-selector");
  const studioRect = stageStudioLayoutSnapshot.selectorRect;

  if (!boardStrip || !selector || !studioRect) return;

  boardStrip.style.setProperty("position", "relative", "important");
  boardStrip.style.setProperty("transform", "none", "important");

  const stageRect = selector.getBoundingClientRect();
  const dx = Math.round(studioRect.left - stageRect.left);
  const dy = Math.round(studioRect.top - stageRect.top);

  boardStrip.style.setProperty("transform", `translate(${dx}px, ${dy}px)`, "important");
}

let stageStudioLayoutFrame = 0;

function applyStageStudioLayoutSoon() {
  if (stageStudioLayoutFrame) {
    cancelAnimationFrame(stageStudioLayoutFrame);
  }

  stageStudioLayoutFrame = requestAnimationFrame(() => {
    stageStudioLayoutFrame = 0;
    applyStageStudioLayout();
  });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-board-mode-target='stage']");
  if (!button) return;
  captureStudioLayoutForStage();
}, true);

const stageStudioLayoutObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    const prev = (mutation.oldValue || "").replace(/\bcues-stuck\b/g, "").trim();
    const next = document.body.className.replace(/\bcues-stuck\b/g, "").trim();
    if (prev !== next) {
      applyStageStudioLayoutSoon();
      return;
    }
  }
});
stageStudioLayoutObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ["class"],
  attributeOldValue: true,
});

window.addEventListener("resize", applyStageStudioLayoutSoon);
window.addEventListener("load", applyStageStudioLayoutSoon);
