/* ════════════════════════════════════════════
   Calculator Pro — script.js
   Features:
   ✔ Basic arithmetic + decimal + percent
   ✔ Expression parser (full math expressions)
   ✔ Live preview as you type
   ✔ Scientific mode (sin,cos,tan,log,ln,√,x²,xⁿ,π,e,1/x,|x|,n!)
   ✔ Memory  MC / MR / M+ / M−
   ✔ Unit Converter (length, weight, temp, speed, area)
   ✔ Keyboard support
   ✔ Calculation history + pin favourite
   ✔ Export history as .txt
   ✔ Dark / Light mode (localStorage)
   ✔ Sound effects (Web Audio API)
   ✔ Copy result + toast
   ✔ Ripple animation on buttons
   ✔ Swipe left on display to delete last char (mobile)
   ✔ Haptic feedback (navigator.vibrate)
════════════════════════════════════════════ */

// ══════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════
const state = {
  expr: "",            // raw expression string
  justEvaluated: false,
  memory: 0,
  history: [],
  soundOn: true,
  mode: "basic",       // basic | scientific | unit
};

// ══════════════════════════════════════════
//  DOM REFS
// ══════════════════════════════════════════
const resultEl     = document.getElementById("result");
const exprEl       = document.getElementById("expression");
const liveEl       = document.getElementById("livePreview");
const memEl        = document.getElementById("memIndicator");
const historyList  = document.getElementById("historyList");
const copyBtn      = document.getElementById("copyBtn");
const copyToast    = document.getElementById("copyToast");
const themeToggle  = document.getElementById("themeToggle");
const soundBtn     = document.getElementById("soundBtn");
const exportBtn    = document.getElementById("exportBtn");
const displayEl    = document.getElementById("display");
const exportHistBtn= null; // removed from history panel
const clearHistBtn = document.getElementById("clearHistory");
const tabs         = document.querySelectorAll(".tab");

// Unit converter
const unitCategory = document.getElementById("unitCategory");
const unitFrom     = document.getElementById("unitFrom");
const unitTo       = document.getElementById("unitTo");
const unitInput    = document.getElementById("unitInput");
const unitOutput   = document.getElementById("unitOutput");
const convertBtn   = document.getElementById("convertBtn");

// ══════════════════════════════════════════
//  AUDIO (Web Audio API — no files needed)
// ══════════════════════════════════════════
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playClick(type = "normal") {
  if (!state.soundOn) return;
  try {
    const ctx  = getAudioCtx();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const freqMap = { normal: 600, operator: 900, equals: 1200, error: 200, mem: 750 };
    osc.frequency.value = freqMap[type] || 600;
    osc.type = "sine";

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (_) { /* AudioContext blocked — silent fallback */ }
}

// ══════════════════════════════════════════
//  BUTTON CLICKS (event delegation)
// ══════════════════════════════════════════
document.querySelectorAll(".btn").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    triggerRipple(btn, e);
    haptic();
    const val    = btn.dataset.value;
    const action = btn.dataset.action;
    if (val)    handleValue(val);
    if (action) handleAction(action);
  });
});

// ══════════════════════════════════════════
//  KEYBOARD
// ══════════════════════════════════════════
document.addEventListener("keydown", (e) => {
  // Ignore if focus is on unit inputs / selects
  if (["INPUT", "SELECT"].includes(e.target.tagName)) return;

  const k = e.key;
  if (/^[0-9]$/.test(k))          { playClick(); handleValue(k); return; }
  if (k === ".")                   { playClick(); handleValue("."); return; }
  if (k === "+")                   { playClick("operator"); handleValue("+"); return; }
  if (k === "-")                   { playClick("operator"); handleValue("−"); return; }
  if (k === "*")                   { playClick("operator"); handleValue("×"); return; }
  if (k === "/")                   { e.preventDefault(); playClick("operator"); handleValue("÷"); return; }
  if (k === "^")                   { playClick("operator"); handleValue("^"); return; }
  if (k === "(")                   { playClick(); handleValue("("); return; }
  if (k === ")")                   { playClick(); handleValue(")"); return; }
  if (k === "%")                   { playClick(); handleAction("percent"); return; }
  if (k === "Enter" || k === "=")  { playClick("equals"); handleAction("equals"); return; }
  if (k === "Backspace")           { playClick(); handleAction("delete"); return; }
  if (k === "Escape")              { playClick(); handleAction("clear"); return; }
});

// ══════════════════════════════════════════
//  TOP BAR ACTIONS
// ══════════════════════════════════════════
themeToggle.addEventListener("click", () => {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  applyTheme(dark ? "light" : "dark");
});

soundBtn.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundBtn.classList.toggle("muted", !state.soundOn);
  soundBtn.textContent = state.soundOn ? "🔊" : "🔇";
  localStorage.setItem("calc-sound", state.soundOn ? "1" : "0");
});

exportBtn.addEventListener("click", () => exportHistory());

clearHistBtn.addEventListener("click", () => {
  state.history = [];
  saveHistory();
  renderHistory();
});

// ══════════════════════════════════════════
//  COPY
// ══════════════════════════════════════════
copyBtn.addEventListener("click", () => {
  const text = resultEl.textContent.trim();
  if (!text || text === "Error") return;
  navigator.clipboard.writeText(text).then(() => {
    copyToast.classList.add("show");
    setTimeout(() => copyToast.classList.remove("show"), 1600);
    playClick("mem");
  }).catch(() => {
    // Fallback for browsers that block clipboard without user gesture
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    copyToast.classList.add("show");
    setTimeout(() => copyToast.classList.remove("show"), 1600);
  });
});

// ══════════════════════════════════════════
//  MODE TABS
// ══════════════════════════════════════════
tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const mode = tab.dataset.mode;
    state.mode  = mode;
    document.getElementById("panelBasic").classList.toggle("hidden",      mode !== "basic");
    document.getElementById("panelScientific").classList.toggle("hidden", mode !== "scientific");
    document.getElementById("panelUnit").classList.toggle("hidden",       mode !== "unit");
  });
});

// ══════════════════════════════════════════
//  SWIPE TO DELETE (mobile)
// ══════════════════════════════════════════
let swipeStartX = 0;
displayEl.addEventListener("touchstart", (e) => { swipeStartX = e.touches[0].clientX; }, { passive: true });
displayEl.addEventListener("touchend", (e) => {
  const dx = e.changedTouches[0].clientX - swipeStartX;
  if (dx < -60) {         // swipe left → delete
    haptic();
    playClick();
    handleAction("delete");
  }
});

// ══════════════════════════════════════════
//  CORE INPUT / ACTION HANDLERS
// ══════════════════════════════════════════

function handleValue(v) {
  // Operator characters
  const ops = ["+", "−", "×", "÷", "^"];

  if (ops.includes(v)) {
    playClick("operator");
    // If just evaluated, keep result as start of new expr
    if (state.justEvaluated) state.justEvaluated = false;
    // Replace trailing operator if any
    state.expr = state.expr.replace(/[+−×÷^]$/, "") + v;
    renderDisplay();
    return;
  }

  if (state.justEvaluated && !ops.includes(v)) {
    // Start fresh expression unless chaining operator
    state.expr = "";
    state.justEvaluated = false;
  }

  // Decimal guard: don't add a second dot to current number segment
  if (v === ".") {
    const parts = state.expr.split(/[+−×÷^()]/);
    const last  = parts[parts.length - 1];
    if (last.includes(".")) return;
  }

  // Max length guard
  if (state.expr.length >= 40) return;

  state.expr += v;
  renderDisplay();
}

function handleAction(action) {
  switch (action) {

    // ── Clear ──
    case "clear":
      state.expr          = "";
      state.justEvaluated = false;
      clearActiveOp();
      renderDisplay();
      break;

    // ── Delete ──
    case "delete":
      if (state.justEvaluated) {
        state.expr = "";
        state.justEvaluated = false;
      } else {
        state.expr = state.expr.slice(0, -1);
      }
      renderDisplay();
      break;

    // ── Percent ──
    case "percent": {
      if (!state.expr) return;
      const n = safeEval(state.expr);
      if (n === null) return;
      state.expr = String(fmt(n / 100));
      renderDisplay();
      break;
    }

    // ── Equals ──
    case "equals": {
      if (!state.expr) return;
      const cleanExpr = state.expr;
      const result = safeEval(cleanExpr);
      if (result === null) {
        showError("Math Error");
        playClick("error");
        return;
      }
      if (!isFinite(result)) {
        showError("Undefined");
        playClick("error");
        return;
      }
      playClick("equals");
      const answer = fmt(result);
      addToHistory(displayExpr(cleanExpr), String(answer));
      exprEl.textContent  = displayExpr(cleanExpr) + " =";
      liveEl.textContent  = "";
      resultEl.textContent = String(answer);
      resultEl.classList.remove("error");
      autoSize(String(answer));
      state.expr          = String(answer);
      state.justEvaluated = true;
      clearActiveOp();
      return;
    }

    // ── Memory ──
    case "mc":
      state.memory = 0;
      memEl.textContent = "";
      playClick("mem");
      break;

    case "mr":
      if (state.justEvaluated) state.expr = "";
      state.expr += String(state.memory);
      state.justEvaluated = false;
      playClick("mem");
      renderDisplay();
      break;

    case "m+": {
      const v = safeEval(state.expr);
      if (v !== null) { state.memory += v; memEl.textContent = "M"; playClick("mem"); }
      break;
    }

    case "m-": {
      const v = safeEval(state.expr);
      if (v !== null) { state.memory -= v; memEl.textContent = "M"; playClick("mem"); }
      break;
    }

    // ── Scientific ──
    case "sci-sin":   insertSci("sin");   break;
    case "sci-cos":   insertSci("cos");   break;
    case "sci-tan":   insertSci("tan");   break;
    case "sci-log":   insertSci("log");   break;
    case "sci-ln":    insertSci("ln");    break;
    case "sci-sqrt":  insertSci("sqrt");  break;
    case "sci-sq": {
      // square current expression
      const base = state.justEvaluated ? state.expr : state.expr;
      if (base) { state.expr = "(" + base + ")^2"; renderDisplay(); }
      break;
    }
    case "sci-pow":
      state.expr += "^";
      renderDisplay();
      break;
    case "sci-pi":
      if (state.justEvaluated) { state.expr = ""; state.justEvaluated = false; }
      state.expr += String(Math.PI);
      renderDisplay();
      break;
    case "sci-e":
      if (state.justEvaluated) { state.expr = ""; state.justEvaluated = false; }
      state.expr += String(Math.E);
      renderDisplay();
      break;
    case "sci-inv": {
      const base = state.expr || "0";
      state.expr = "1/(" + base + ")";
      renderDisplay();
      break;
    }
    case "sci-abs": {
      const base = state.expr || "0";
      state.expr = "abs(" + base + ")";
      renderDisplay();
      break;
    }
    case "sci-fact": {
      const n = safeEval(state.expr);
      if (n !== null && Number.isInteger(n) && n >= 0) {
        state.expr = String(factorial(n));
        state.justEvaluated = true;
        renderDisplay();
      } else {
        showError("Integer needed");
      }
      break;
    }
  }
}

function insertSci(fn) {
  if (state.justEvaluated) { state.expr = ""; state.justEvaluated = false; }
  state.expr += fn + "(";
  renderDisplay();
  playClick("operator");
}

// ══════════════════════════════════════════
//  EXPRESSION EVALUATOR (safe, no eval())
// ══════════════════════════════════════════
// Converts display operators to math, handles sin/cos/tan/log/ln/sqrt/abs
function safeEval(expr) {
  if (!expr || expr === "") return null;
  try {
    // Normalise operators
    let e = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/−/g, "-")
      .replace(/\^/g, "**");

    // Expand functions
    e = e.replace(/\bsin\(/g, "Math.sin(")
         .replace(/\bcos\(/g, "Math.cos(")
         .replace(/\btan\(/g, "Math.tan(")
         .replace(/\blog\(/g, "Math.log10(")
         .replace(/\bln\(/g,  "Math.log(")
         .replace(/\bsqrt\(/g,"Math.sqrt(")
         .replace(/\babs\(/g, "Math.abs(");

    // Reject anything that's not a valid math expression
    if (/[^0-9+\-*/.()eMathsincotaglqrb10 ]/.test(e)) return null;

    // eslint-disable-next-line no-new-func
    const result = Function('"use strict"; return (' + e + ')')();
    if (typeof result !== "number") return null;
    return parseFloat(result.toPrecision(12));
  } catch (_) {
    return null;
  }
}

function factorial(n) {
  if (n === 0 || n === 1) return 1;
  if (n > 20) return Infinity;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

// ══════════════════════════════════════════
//  DISPLAY
// ══════════════════════════════════════════
function renderDisplay() {
  // Expression line
  exprEl.textContent = state.justEvaluated ? "" : (state.expr ? displayExpr(state.expr) : "");

  // Live preview
  if (!state.justEvaluated && state.expr.length > 0) {
    const preview = safeEval(state.expr);
    liveEl.textContent = (preview !== null && String(preview) !== state.expr)
      ? "= " + fmt(preview)
      : "";
  } else {
    liveEl.textContent = "";
  }

  // Result / current input
  if (!state.justEvaluated) {
    const show = displayExpr(state.expr) || "0";
    resultEl.textContent = show;
    resultEl.classList.remove("error");
    autoSize(show);
  }
}

// Convert internal operators to display characters
function displayExpr(e) {
  return e
    .replace(/\*/g, "×")
    .replace(/\//g, "÷")
    .replace(/Math\.sin\(/g, "sin(")
    .replace(/Math\.cos\(/g, "cos(")
    .replace(/Math\.tan\(/g, "tan(")
    .replace(/Math\.log10\(/g,"log(")
    .replace(/Math\.log\(/g, "ln(")
    .replace(/Math\.sqrt\(/g,"√(")
    .replace(/Math\.abs\(/g, "|");
}

function showError(msg = "Error") {
  resultEl.textContent = msg;
  resultEl.classList.add("error");
  exprEl.textContent   = "";
  liveEl.textContent   = "";
  state.expr           = "";
  state.justEvaluated  = true;
}

function autoSize(text) {
  const l = text.length;
  if (l > 14)      resultEl.style.fontSize = "1.1rem";
  else if (l > 11) resultEl.style.fontSize = "1.5rem";
  else if (l > 8)  resultEl.style.fontSize = "2rem";
  else             resultEl.style.fontSize = "";
}

function fmt(n) {
  if (isNaN(n)) return "NaN";
  const s = String(n);
  if (s.includes(".") && s.split(".")[1].length > 10) {
    return String(parseFloat(n.toFixed(10)));
  }
  return s;
}

function clearActiveOp() {
  document.querySelectorAll(".btn-operator.active-op")
    .forEach(b => b.classList.remove("active-op"));
}

// ══════════════════════════════════════════
//  HISTORY
// ══════════════════════════════════════════
function addToHistory(expr, result) {
  // Move pinned items aside
  const pinned   = state.history.filter(h => h.pinned);
  const unpinned = state.history.filter(h => !h.pinned);
  unpinned.unshift({ expr, result, pinned: false });
  if (unpinned.length > 20) unpinned.pop();
  state.history = [...pinned, ...unpinned];
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";

  if (state.history.length === 0) {
    historyList.innerHTML = '<li class="history-empty">No calculations yet</li>';
    return;
  }

  // Pinned first
  const sorted = [
    ...state.history.filter(h => h.pinned),
    ...state.history.filter(h => !h.pinned),
  ];

  sorted.forEach((item) => {
    const realIdx = state.history.indexOf(item);
    const li = document.createElement("li");
    li.className = "history-item" + (item.pinned ? " pinned" : "");
    li.innerHTML = `
      <div class="h-expr">${item.expr}</div>
      <div class="h-result">= ${item.result}</div>
      <button class="pin-btn" title="${item.pinned ? "Unpin" : "Pin"}" aria-label="Pin">
        ${item.pinned ? "⭐" : "☆"}
      </button>
    `;

    // Click item → restore result
    li.addEventListener("click", (clickEvt) => {
      if (clickEvt.target.classList.contains("pin-btn")) return;
      state.expr          = String(item.result);
      state.justEvaluated = true;
      liveEl.textContent  = "";
      exprEl.textContent  = "";
      resultEl.textContent = item.result;
      resultEl.classList.remove("error");
      autoSize(item.result);
      playClick("mem");
    });

    // Pin button
    li.querySelector(".pin-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      state.history[realIdx].pinned = !state.history[realIdx].pinned;
      saveHistory();
      renderHistory();
    });

    historyList.appendChild(li);
  });
}

function saveHistory() {
  localStorage.setItem("calc-history", JSON.stringify(state.history));
}

function loadHistory() {
  try {
    const saved = localStorage.getItem("calc-history");
    if (saved) state.history = JSON.parse(saved);
  } catch { state.history = []; }
  renderHistory();
}

// ── Export ──
function exportHistory() {
  if (state.history.length === 0) { alert("No history to export."); return; }
  const lines = state.history.map(h =>
    `${h.pinned ? "⭐ " : ""}${h.expr} = ${h.result}`
  );
  const blob = new Blob(
    ["Calculator Pro — History\n" + new Date().toLocaleString() + "\n\n" + lines.join("\n")],
    { type: "text/plain" }
  );
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "calc-history.txt";
  a.click();
  URL.revokeObjectURL(a.href);
}

// ══════════════════════════════════════════
//  UNIT CONVERTER
// ══════════════════════════════════════════
const unitDefs = {
  length: {
    units: ["Meter","Kilometer","Centimeter","Millimeter","Mile","Yard","Foot","Inch"],
    toBase: { Meter:1, Kilometer:1000, Centimeter:0.01, Millimeter:0.001,
              Mile:1609.34, Yard:0.9144, Foot:0.3048, Inch:0.0254 },
  },
  weight: {
    units: ["Kilogram","Gram","Milligram","Pound","Ounce","Ton"],
    toBase: { Kilogram:1, Gram:0.001, Milligram:0.000001, Pound:0.453592, Ounce:0.0283495, Ton:1000 },
  },
  temp: {
    units: ["Celsius","Fahrenheit","Kelvin"],
    // custom conversion handled separately
    toBase: null,
  },
  speed: {
    units: ["m/s","km/h","mph","Knot"],
    toBase: { "m/s":1, "km/h":0.277778, "mph":0.44704, "Knot":0.514444 },
  },
  area: {
    units: ["m²","km²","cm²","Hectare","Acre","ft²"],
    toBase: { "m²":1, "km²":1e6, "cm²":0.0001, "Hectare":10000, "Acre":4046.86, "ft²":0.092903 },
  },
};

function populateUnits() {
  fillUnitSelects();
  unitCategory.addEventListener("change", fillUnitSelects);
  convertBtn.addEventListener("click", doConvert);
  unitInput.addEventListener("input", doConvert);
  unitFrom.addEventListener("change", doConvert);
  unitTo.addEventListener("change", doConvert);
}

function fillUnitSelects() {
  const cat = unitDefs[unitCategory.value];
  [unitFrom, unitTo].forEach((sel, i) => {
    sel.innerHTML = "";
    cat.units.forEach((u, idx) => {
      const opt = document.createElement("option");
      opt.value = u; opt.textContent = u;
      if (i === 1 && idx === 1) opt.selected = true;
      sel.appendChild(opt);
    });
  });
  doConvert();
}

function doConvert() {
  const val  = parseFloat(unitInput.value);
  if (isNaN(val)) { unitOutput.value = ""; return; }
  const cat  = unitCategory.value;
  const from = unitFrom.value;
  const to   = unitTo.value;

  let result;
  if (cat === "temp") {
    result = convertTemp(val, from, to);
  } else {
    const base = unitDefs[cat].toBase;
    result = val * base[from] / base[to];
  }

  unitOutput.value = parseFloat(result.toPrecision(10));
}

function convertTemp(val, from, to) {
  // Convert to Celsius first
  let c;
  if (from === "Celsius")    c = val;
  if (from === "Fahrenheit") c = (val - 32) * 5/9;
  if (from === "Kelvin")     c = val - 273.15;
  // Celsius to target
  if (to === "Celsius")    return c;
  if (to === "Fahrenheit") return c * 9/5 + 32;
  if (to === "Kelvin")     return c + 273.15;
}

// ══════════════════════════════════════════
//  THEME
// ══════════════════════════════════════════
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeToggle.textContent = theme === "dark" ? "☀️" : "🌙";
  localStorage.setItem("calc-theme", theme);
}
function loadTheme() {
  // Default is always light unless user has explicitly toggled
  const saved = localStorage.getItem("calc-theme");
  applyTheme(saved || "light");
}

// ══════════════════════════════════════════
//  SOUND PREF
// ══════════════════════════════════════════
function loadSound() {
  const s = localStorage.getItem("calc-sound");
  state.soundOn = (s === null) ? true : s === "1";
  soundBtn.classList.toggle("muted", !state.soundOn);
  soundBtn.textContent = state.soundOn ? "🔊" : "🔇";
}

// ══════════════════════════════════════════
//  RIPPLE
// ══════════════════════════════════════════
function triggerRipple(btn, e) {
  btn.classList.remove("ripple");
  void btn.offsetWidth; // reflow
  btn.classList.add("ripple");
  setTimeout(() => btn.classList.remove("ripple"), 400);
}

// ══════════════════════════════════════════
//  HAPTIC
// ══════════════════════════════════════════
function haptic() {
  if (navigator.vibrate) navigator.vibrate(10);
}

// ══════════════════════════════════════════
//  INIT (runs last, after all functions/consts above are defined)
// ══════════════════════════════════════════
loadTheme();
loadSound();
loadHistory();
populateUnits();
renderDisplay();
