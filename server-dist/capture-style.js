export const captureStyle = `
html,
body {
  scroll-behavior: auto !important;
  overflow-x: hidden !important;
}

*,
*::before,
*::after {
  animation-duration: 0.001s !important;
  animation-delay: 0s !important;
  transition-duration: 0.001s !important;
  transition-delay: 0s !important;
  caret-color: transparent !important;
  print-color-adjust: exact !important;
  -webkit-print-color-adjust: exact !important;
}

.opacity-0,
[style*="opacity: 0"],
[style*="opacity:0"] {
  opacity: 1 !important;
}

[style*="visibility: hidden"],
[style*="visibility:hidden"] {
  visibility: visible !important;
}

button[aria-label*="top" i],
a[aria-label*="top" i],
button[aria-label*="scroll" i],
a[aria-label*="scroll" i],
.fixed.bottom-4,
.fixed.bottom-5,
.fixed.bottom-6,
.fixed.bottom-8,
.fixed.right-4,
.fixed.right-5,
.fixed.right-6,
.fixed.right-8 {
  display: none !important;
}
`;
//# sourceMappingURL=capture-style.js.map