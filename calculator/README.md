# 🧮 Calculator Pro

A professional, feature-rich calculator built with pure **HTML, CSS, and JavaScript** — no frameworks, no dependencies.

---

## 🚀 Live Features

### 🔢 Basic Calculator
- Addition, Subtraction, Multiplication, Division
- Decimal number support
- Percentage calculation (`%`)
- Clear (`AC`) and Delete (`⌫`) buttons
- Chained operations (e.g. `5 + 3 × 2`)

### 🔬 Scientific Mode
| Button | Function |
|--------|----------|
| `sin` `cos` `tan` | Trigonometric functions |
| `log` | Base-10 logarithm |
| `ln` | Natural logarithm |
| `√` | Square root |
| `x²` | Square of current value |
| `xⁿ` | Power (e.g. `2^8`) |
| `π` | Pi constant (3.14159...) |
| `e` | Euler's number (2.71828...) |
| `1/x` | Reciprocal |
| `\|x\|` | Absolute value |
| `n!` | Factorial |
| `(` `)` | Parentheses for grouping |

### 🧠 Expression Parser
- Type full math expressions like `(3+5)×2` or `sin(45)+√(9)`
- No step-by-step required — evaluates the full expression on `=`
- Safe evaluation — no `eval()` used

### 👁️ Live Preview
- Result previews in real-time as you type
- Shows `= answer` in italic below the expression line

### 💾 Memory Functions
| Button | Function |
|--------|----------|
| `MC` | Memory Clear |
| `MR` | Memory Recall |
| `M+` | Add to Memory |
| `M−` | Subtract from Memory |
- Memory indicator `M` shown on display when memory has a value

### 📏 Unit Converter
5 categories with live conversion as you type:

| Category | Units |
|----------|-------|
| Length | Meter, Kilometer, Centimeter, Millimeter, Mile, Yard, Foot, Inch |
| Weight | Kilogram, Gram, Milligram, Pound, Ounce, Ton |
| Temperature | Celsius, Fahrenheit, Kelvin |
| Speed | m/s, km/h, mph, Knot |
| Area | m², km², cm², Hectare, Acre, ft² |

### 📋 Calculation History
- Stores last **20 calculations** automatically
- Click any history item to **restore** its result
- ⭐ **Pin favourite** calculations — pinned items stay at the top
- Pinned items highlighted with a gold left border
- History persists across sessions via **localStorage**

### 📤 Export History
- Download all calculations as a `.txt` file
- Includes pinned status, expression, and result
- Accessible via the **Export** button in the top bar

### 🎨 Dark / Light Mode
- Toggle between light (default) and dark theme
- Theme preference saved in **localStorage**
- Smooth transitions on all elements

### 🔊 Sound Effects
- Subtle Web Audio API click tones on every button press
- Different pitch for: numbers, operators, equals, errors, memory
- Toggle on/off with the 🔊 button — preference saved

### ⌨️ Keyboard Support
| Key | Action |
|-----|--------|
| `0–9` | Number input |
| `.` | Decimal point |
| `+` `-` `*` `/` | Operators |
| `^` | Power |
| `(` `)` | Parentheses |
| `%` | Percentage |
| `Enter` or `=` | Calculate |
| `Backspace` | Delete last character |
| `Escape` | Clear all |

### 📱 Mobile Features
- **Swipe left** on display to delete last character
- **Haptic feedback** (`navigator.vibrate`) on every button press
- Fully responsive across all screen sizes (480px → 320px)
- No horizontal scroll, no input zoom issues

### ✨ UI / UX
- **Ripple animation** on every button press
- **Copy result** button with toast notification
- **Auto-shrinking** result text for long numbers
- Color-coded button groups:
  - 🔵 Numbers — slate blue
  - 🟠 Operators — amber orange
  - 🟢 Utility (AC/DEL/%) — teal
  - 🟣 Memory — indigo
  - 🔵 Scientific — deep ocean teal
  - 🟣 Equals — purple gradient

---

## 📁 File Structure

```
calculator/
├── index.html   — Markup & structure
├── style.css    — All styles, themes, responsive
├── script.js    — All logic & features
└── README.md    — This file
```

---

## 🛠️ Tech Stack

- **HTML5** — Semantic structure
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **JavaScript (ES6+)** — DOM manipulation, Web Audio API, localStorage, Clipboard API

---

## 💡 Concepts Used

`DOM Manipulation` · `Event Listeners` · `Functions` · `Conditions` · `Arrays` · `localStorage` · `Responsive CSS` · `CSS Variables` · `Web Audio API` · `Touch Events` · `Regex` · `Function constructor (safe eval)`

---

## 🌐 Browser Support

Works in all modern browsers — Chrome, Firefox, Safari, Edge.  
Sound requires a user interaction before playing (browser autoplay policy).
