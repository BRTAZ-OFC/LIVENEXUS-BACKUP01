const fs = require('fs');
const files = [
  'dashboard/overlays/Overlay_EditorSidebar.jsx',
  'dashboard/cenarios/editor/Scenario_EditorSidebar.jsx',
  'dashboard/overlays/Overlay_Visualizer.jsx',
  'dashboard/cenarios/editor/Scenario_Visualizer.jsx',
  'dashboard/overlays/Overlay_WidgetElementRenderer.jsx',
  'dashboard/cenarios/editor/Scenario_WidgetElementRenderer.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const l = line.toLowerCase();
    if (l.includes('border') || l.includes('borda') || l.includes('transparent') || l.includes('transparente') || l.includes('select')) {
      console.log(`${file}:${idx + 1}: ${line.trim()}`);
    }
  });
});
