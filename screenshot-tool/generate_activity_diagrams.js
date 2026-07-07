const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const { flows } = require('./generate_40_diagrams.js');

function escapeXML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateActivitySVG(flow) {
  const width = 600;
  const height = 110 + (flow.steps.length * 90) + 70;
  const boxWidth = 320;
  const boxHeight = 50;
  
  // High-fidelity dark mode palette
  const actorColors = {
    "Sinh viên": "#a78bfa",        // purple
    "Giảng viên": "#f59e0b",       // orange
    "Admin": "#f87171",            // rose
    "Người dùng": "#e2e8f0",       // slate
    "Frontend": "#38bdf8",         // sky
    "Backend API": "#10b981",      // emerald
    "PostgreSQL DB": "#34d399",    // light emerald
    "Queue Service": "#818cf8",    // indigo
    "RabbitMQ Worker": "#f43f5e",   // rose dark
    "Drive Service": "#fb7185",     // rose light
    "LibreOffice Service": "#fbbf24", // amber
    "System OS": "#94a3b8",        // slate-400
    "Gemini AI API": "#c084fc",     // purple light
    "System Security": "#22d3ee",   // cyan
    "Hangfire Scheduler": "#fda4af", // rose light
    "Hangfire Worker": "#f43f5e"
  };

  let stepsSVG = '';
  let arrowsSVG = '';
  
  // Start Node (UML Solid circle)
  stepsSVG += `
    <!-- Start Node -->
    <circle cx="300" cy="80" r="12" fill="#38bdf8"/>
    <text x="300" y="60" fill="#38bdf8" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">START</text>
  `;
  
  // Arrow from start to first step
  arrowsSVG += `
    <line x1="300" y1="92" x2="300" y2="120" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
  `;

  flow.steps.forEach((step, idx) => {
    const y = 120 + idx * 90;
    const color = actorColors[step.actor] || "#10b981";
    
    // Step box (UML Action State)
    stepsSVG += `
      <g transform="translate(${300 - boxWidth/2}, ${y})">
        <!-- Action Glow Shadow -->
        <rect width="${boxWidth}" height="${boxHeight}" rx="12" ry="12" fill="#1e293b" stroke="${color}" stroke-width="2" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.4));"/>
        
        <!-- Step Number badge -->
        <circle cx="18" cy="25" r="9" fill="${color}" opacity="0.2"/>
        <circle cx="18" cy="25" r="7" fill="${color}"/>
        <text x="18" y="28" fill="#0f172a" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle">${idx + 1}</text>
        
        <!-- Actor name indicator -->
        <text x="38" y="16" fill="${color}" font-size="7.5" font-family="Inter, sans-serif" font-weight="900" style="text-transform: uppercase; letter-spacing: 0.5px;">${escapeXML(step.actor)}</text>
        
        <!-- Action Text -->
        <text x="38" y="34" fill="#ffffff" font-size="10.5" font-family="Inter, sans-serif" font-weight="700">${escapeXML(step.text)}</text>
      </g>
    `;
    
    // Connective Flow Arrows (UML Control Flow)
    if (idx < flow.steps.length - 1) {
      arrowsSVG += `
        <line x1="300" y1="${y + boxHeight}" x2="300" y2="${y + 90}" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      `;
    } else {
      const endY = y + boxHeight + 45;
      arrowsSVG += `
        <line x1="300" y1="${y + boxHeight}" x2="300" y2="${endY - 14}" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)"/>
      `;
      // End Node (UML Double circle)
      stepsSVG += `
        <!-- End Node -->
        <circle cx="300" cy="${endY}" r="14" fill="none" stroke="#f43f5e" stroke-width="2"/>
        <circle cx="300" cy="${endY}" r="8" fill="#f43f5e"/>
        <text x="300" y="${endY + 28}" fill="#f43f5e" font-size="8" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">END</text>
      `;
    }
  });

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <defs>
        <!-- Marker for control flow arrowheads -->
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#64748b"/>
        </marker>
      </defs>
      
      <style>
        .title { font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 800; fill: #ffffff; letter-spacing: 0.5px; }
      </style>
      
      <!-- Premium Canvas Background -->
      <rect width="100%" height="100%" fill="#0f172a" rx="16"/>
      
      <!-- Top Swimlane/Process Title Block -->
      <rect width="100%" height="50" fill="#1e293b" rx="16"/>
      <text x="25" y="30" class="title">${escapeXML(flow.title.toUpperCase())}</text>
      
      <!-- Flow Category Tag -->
      <rect x="445" y="13" width="130" height="24" rx="12" fill="#38bdf8" opacity="0.15"/>
      <text x="510" y="28" fill="#38bdf8" font-size="8.5" font-family="Inter, sans-serif" font-weight="900" text-anchor="middle" letter-spacing="1">ACTIVITY FLOW</text>
      
      ${arrowsSVG}
      ${stepsSVG}
      
      <!-- Footer Copyright Label -->
      <text x="300" y="${height - 15}" fill="#475569" font-size="8" font-family="Inter, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1.5">UEF ETHESIS PORTAL DIAGRAM GENERATOR</text>
    </svg>
  `;
}

async function generateAll() {
  const outputDir = path.join(__dirname, '..', 'flows', 'activity_diagram');
  const downloadsDir = path.join(process.env.USERPROFILE || '', 'Downloads', 'activity_diagram');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  console.log(`Starting generation of 40 technical UML Activity Diagrams...`);

  for (const flow of flows) {
    try {
      const svgContent = generateActivitySVG(flow);
      const fileName = `flow_${flow.id}`;
      
      const svgPath = path.join(outputDir, `${fileName}.svg`);
      const pngPath = path.join(outputDir, `${fileName}.png`);
      
      const dlSvgPath = path.join(downloadsDir, `${fileName}.svg`);
      const dlPngPath = path.join(downloadsDir, `${fileName}.png`);

      // 1. Write SVG file
      fs.writeFileSync(svgPath, svgContent);
      fs.writeFileSync(dlSvgPath, svgContent);
      
      // 2. Convert to PNG using sharp
      const svgBuffer = Buffer.from(svgContent);
      await sharp(svgBuffer)
        .png()
        .toFile(pngPath);
        
      await sharp(svgBuffer)
        .png()
        .toFile(dlPngPath);

      console.log(`[Generated] Activity Flow ${flow.id}: ${flow.title}`);
    } catch (err) {
      console.error(`Error generating diagram for flow ${flow.id}:`, err);
    }
  }

  console.log(`Successfully generated 40 Activity Diagrams in flows/activity_diagram directory!`);
}

generateAll();
