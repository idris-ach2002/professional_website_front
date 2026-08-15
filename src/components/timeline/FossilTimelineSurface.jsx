import { useEffect, useMemo, useRef } from "react";
import "../../styles/sections/timeline-fossils.css";

const FOSSIL_BY_CATEGORY = {
  SCHOOL: "leaf",
  INTERNSHIP: "trilobite",
  ALTERNANCE: "ammonite",
  CDI: "ammonite",
  CDD: "shell",
  FREELANCE: "shell",
  CERTIFICATION: "leaf",
  VOLUNTEERING: "coral",
};

function fossilTypeFor(category, index) {
  return FOSSIL_BY_CATEGORY[String(category ?? "").toUpperCase()]
    ?? ["ammonite", "trilobite", "leaf", "shell", "coral"][index % 5];
}

function seedFrom(value) {
  let hash = 2166136261;
  for (const char of String(value)) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function strokeRelief(ctx, drawPath, weight = 1) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.save();
  ctx.translate(1.8, 2.4);
  ctx.strokeStyle = "rgba(82,61,45,.27)";
  ctx.lineWidth = 4.6 * weight;
  ctx.beginPath();
  drawPath(ctx);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "rgba(177,150,113,.76)";
  ctx.lineWidth = 3 * weight;
  ctx.beginPath();
  drawPath(ctx);
  ctx.stroke();

  ctx.save();
  ctx.translate(-.8, -1);
  ctx.strokeStyle = "rgba(247,235,213,.84)";
  ctx.lineWidth = 1.05 * weight;
  ctx.beginPath();
  drawPath(ctx);
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

function fillRelief(ctx, drawPath) {
  ctx.save();
  ctx.save();
  ctx.translate(2.1, 2.8);
  ctx.fillStyle = "rgba(79,58,43,.20)";
  ctx.beginPath();
  drawPath(ctx);
  ctx.fill();
  ctx.restore();

  const gradient = ctx.createLinearGradient(0, 0, 220, 260);
  gradient.addColorStop(0, "rgba(239,226,199,.54)");
  gradient.addColorStop(.5, "rgba(210,187,149,.46)");
  gradient.addColorStop(1, "rgba(150,121,86,.34)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  drawPath(ctx);
  ctx.fill();

  ctx.strokeStyle = "rgba(249,239,218,.48)";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  drawPath(ctx);
  ctx.stroke();
  ctx.restore();
}

function drawAmmonite(ctx, width, height, progress, random) {
  const size = Math.min(width * .48, height * .78);
  const cx = width * .76;
  const cy = height * .46;
  const turns = Math.PI * 5.35;
  const maxRadius = size * .34;

  const pointAt = (t) => {
    const f = t / turns;
    const r = size * .018 + f * maxRadius;
    const a = t - Math.PI * .24;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * .92, r, a };
  };

  strokeRelief(ctx, (p) => {
    let first = true;
    for (let t = .30; t <= turns; t += .035) {
      const pt = pointAt(t);
      if (first) {
        p.moveTo(pt.x, pt.y);
        first = false;
      } else {
        p.lineTo(pt.x, pt.y);
      }
    }
  }, 1);

  for (let t = Math.PI * 1.0; t < turns - .35; t += .31) {
    const pt = pointAt(t);
    const tangent = t + Math.PI / 2;
    const rib = Math.max(size * .018, pt.r * .23);
    const bend = rib * (.18 + random() * .18);

    strokeRelief(ctx, (p) => {
      p.moveTo(pt.x - Math.cos(tangent) * rib * .46, pt.y - Math.sin(tangent) * rib * .46);
      p.quadraticCurveTo(
        pt.x + Math.cos(pt.a) * bend,
        pt.y + Math.sin(pt.a) * bend,
        pt.x + Math.cos(tangent) * rib * .46,
        pt.y + Math.sin(tangent) * rib * .46,
      );
    }, .58);
  }

  ctx.save();
  ctx.globalAlpha = .10 + progress * .14;
  for (let i = 0; i < 24; i += 1) {
    const t = .4 + random() * (turns - .8);
    const pt = pointAt(t);
    ctx.beginPath();
    ctx.arc(pt.x + (random() - .5) * 8, pt.y + (random() - .5) * 8, .5 + random() * 1.4, 0, Math.PI * 2);
    ctx.fillStyle = random() > .5 ? "rgba(244,224,187,.56)" : "rgba(91,69,48,.48)";
    ctx.fill();
  }
  ctx.restore();
}

function drawTrilobite(ctx, width, height) {
  const size = Math.min(width * .48, height * .78);
  const cx = width * .76;
  const cy = height * .48;
  const bodyW = size * .40;
  const bodyH = size * .64;

  const body = (p) => {
    p.moveTo(cx, cy - bodyH * .50);
    p.bezierCurveTo(cx + bodyW * .52, cy - bodyH * .48, cx + bodyW * .55, cy - bodyH * .10, cx + bodyW * .44, cy + bodyH * .25);
    p.bezierCurveTo(cx + bodyW * .35, cy + bodyH * .48, cx + bodyW * .13, cy + bodyH * .53, cx, cy + bodyH * .50);
    p.bezierCurveTo(cx - bodyW * .13, cy + bodyH * .53, cx - bodyW * .35, cy + bodyH * .48, cx - bodyW * .44, cy + bodyH * .25);
    p.bezierCurveTo(cx - bodyW * .55, cy - bodyH * .10, cx - bodyW * .52, cy - bodyH * .48, cx, cy - bodyH * .50);
    p.closePath();
  };
  fillRelief(ctx, body);

  fillRelief(ctx, (p) => {
    p.moveTo(cx, cy - bodyH * .43);
    p.bezierCurveTo(cx + bodyW * .14, cy - bodyH * .26, cx + bodyW * .11, cy + bodyH * .29, cx, cy + bodyH * .39);
    p.bezierCurveTo(cx - bodyW * .11, cy + bodyH * .29, cx - bodyW * .14, cy - bodyH * .26, cx, cy - bodyH * .43);
    p.closePath();
  });

  strokeRelief(ctx, (p) => {
    p.moveTo(cx - bodyW * .40, cy - bodyH * .27);
    p.quadraticCurveTo(cx, cy - bodyH * .40, cx + bodyW * .40, cy - bodyH * .27);
  }, .8);

  for (let i = 0; i < 9; i += 1) {
    const f = i / 8;
    const y = cy - bodyH * .18 + f * bodyH * .43;
    const half = bodyW * (.39 - f * .07);
    strokeRelief(ctx, (p) => {
      p.moveTo(cx - half, y - 3);
      p.quadraticCurveTo(cx - bodyW * .11, y + 3, cx, y);
      p.quadraticCurveTo(cx + bodyW * .11, y + 3, cx + half, y - 3);
    }, .5);
  }

  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + side * bodyW * .22, cy - bodyH * .29, size * .020, size * .033, side * .18, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(118,91,65,.54)";
    ctx.fill();
    ctx.strokeStyle = "rgba(247,233,207,.52)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawLeaf(ctx, width, height) {
  const size = Math.min(width * .48, height * .78);
  const cx = width * .76;
  const cy = height * .44;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-.42);

  const leaf = (p) => {
    p.moveTo(-size * .30, size * .15);
    p.bezierCurveTo(-size * .24, -size * .24, size * .08, -size * .40, size * .34, -size * .22);
    p.bezierCurveTo(size * .33, size * .04, size * .08, size * .31, -size * .27, size * .27);
    p.bezierCurveTo(-size * .34, size * .26, -size * .35, size * .20, -size * .30, size * .15);
    p.closePath();
  };
  fillRelief(ctx, leaf);

  strokeRelief(ctx, (p) => {
    p.moveTo(-size * .31, size * .22);
    p.quadraticCurveTo(0, -.01 * size, size * .31, -size * .21);
  }, .66);

  for (let i = 1; i <= 11; i += 1) {
    const f = i / 12;
    const x = -size * .24 + f * size * .49;
    const y = size * .16 - f * size * .30;
    const reach = size * (.08 + Math.sin(f * Math.PI) * .075);
    strokeRelief(ctx, (p) => {
      p.moveTo(x, y);
      p.quadraticCurveTo(x - reach * .55, y - reach * .18, x - reach, y - reach * .48);
    }, .37);
    strokeRelief(ctx, (p) => {
      p.moveTo(x, y);
      p.quadraticCurveTo(x + reach * .50, y + reach * .20, x + reach, y + reach * .43);
    }, .37);
  }

  strokeRelief(ctx, (p) => {
    p.moveTo(-size * .31, size * .22);
    p.lineTo(-size * .40, size * .34);
  }, .45);
  ctx.restore();
}

function drawShell(ctx, width, height) {
  const size = Math.min(width * .48, height * .78);
  const cx = width * .76;
  const cy = height * .50;
  const half = size * .32;
  const top = cy - size * .31;
  const bottom = cy + size * .24;

  fillRelief(ctx, (p) => {
    p.moveTo(cx, top);
    p.bezierCurveTo(cx + half * .70, top + size * .08, cx + half, cy + size * .02, cx + half * .94, bottom);
    p.quadraticCurveTo(cx, bottom + size * .09, cx - half * .94, bottom);
    p.bezierCurveTo(cx - half, cy + size * .02, cx - half * .70, top + size * .08, cx, top);
    p.closePath();
  });

  for (let i = -7; i <= 7; i += 1) {
    const f = i / 7;
    strokeRelief(ctx, (p) => {
      p.moveTo(cx, top + size * .018);
      p.quadraticCurveTo(cx + f * half * .36, cy - size * .01, cx + f * half * .86, bottom - size * .018);
    }, .42);
  }
}

function drawCoral(ctx, width, height, random) {
  const size = Math.min(width * .48, height * .78);
  const startX = width * .76;
  const startY = height * .78;

  const branch = (x, y, length, angle, depth) => {
    if (depth <= 0 || length < size * .025) return;
    const ex = x + Math.cos(angle) * length;
    const ey = y + Math.sin(angle) * length;

    strokeRelief(ctx, (p) => {
      p.moveTo(x, y);
      p.quadraticCurveTo((x + ex) / 2 + (random() - .5) * 5, (y + ey) / 2 + (random() - .5) * 5, ex, ey);
    }, Math.max(.34, depth * .15));

    branch(ex, ey, length * (.67 + random() * .07), angle - (.34 + random() * .22), depth - 1);
    branch(ex, ey, length * (.64 + random() * .08), angle + (.30 + random() * .20), depth - 1);
  };

  branch(startX, startY, size * .23, -Math.PI / 2, 5);
}


function drawStoneSlab(ctx, width, height, random) {
  const pad = Math.max(5, Math.min(width, height) * .014);
  const c1 = 18 + random() * 15;
  const c2 = 14 + random() * 13;
  const c3 = 16 + random() * 14;
  const c4 = 18 + random() * 14;

  ctx.beginPath();
  ctx.moveTo(pad + c1, pad + random() * 4);
  ctx.lineTo(width - pad - c2, pad + random() * 3);
  ctx.quadraticCurveTo(width - pad * .45, pad + c2 * .55, width - pad, pad + c2);
  ctx.lineTo(width - pad - random() * 3, height - pad - c3);
  ctx.quadraticCurveTo(width - pad * .55, height - pad * .45, width - pad - c3, height - pad);
  ctx.lineTo(pad + c4, height - pad + random() * 1.5);
  ctx.quadraticCurveTo(pad * .55, height - pad * .55, pad, height - pad - c4);
  ctx.lineTo(pad + random() * 2, pad + c1);
  ctx.quadraticCurveTo(pad * .55, pad * .60, pad + c1, pad);
  ctx.closePath();

  ctx.save();
  ctx.shadowColor = "rgba(30, 27, 22, .24)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 14;
  const slab = ctx.createLinearGradient(0, 0, width, height);
  slab.addColorStop(0, "rgba(232,227,214,.92)");
  slab.addColorStop(.34, "rgba(216,208,190,.86)");
  slab.addColorStop(.72, "rgba(198,187,167,.78)");
  slab.addColorStop(1, "rgba(176,163,143,.70)");
  ctx.fillStyle = slab;
  ctx.fill();
  ctx.restore();

  ctx.strokeStyle = "rgba(252, 247, 236, .82)";
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.clip();

  const coolWash = ctx.createRadialGradient(
    width * .88,
    height * .16,
    0,
    width * .88,
    height * .16,
    Math.max(width, height) * .66,
  );
  coolWash.addColorStop(0, "rgba(255,244,218,.18)");
  coolWash.addColorStop(.46, "rgba(247,229,193,.08)");
  coolWash.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = coolWash;
  ctx.fillRect(0, 0, width, height);

  const lowerWash = ctx.createRadialGradient(
    width * .10,
    height,
    0,
    width * .10,
    height,
    Math.max(width, height) * .72,
  );
  lowerWash.addColorStop(0, "rgba(176,124,88,.12)");
  lowerWash.addColorStop(.46, "rgba(143,135,110,.065)");
  lowerWash.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = lowerWash;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 150; i += 1) {
    const x = random() * width;
    const y = random() * height;
    const radius = .35 + random() * 1.35;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = random() > .48
      ? `rgba(255,255,252,${.020 + random() * .055})`
      : `rgba(93,80,65,${.018 + random() * .045})`;
    ctx.fill();
  }

  ctx.lineCap = "round";
  for (let i = 0; i < 9; i += 1) {
    const y = height * (.10 + i * .10) + (random() - .5) * 7;
    ctx.beginPath();
    ctx.moveTo(width * .04, y);
    ctx.bezierCurveTo(
      width * .28,
      y + (random() - .5) * 5,
      width * .63,
      y + (random() - .5) * 7,
      width * .96,
      y + (random() - .5) * 4,
    );
    ctx.strokeStyle = `rgba(121,105,86,${.020 + random() * .026})`;
    ctx.lineWidth = .7 + random() * .65;
    ctx.stroke();
  }

  for (let i = 0; i < 4; i += 1) {
    let x = width * (.56 + random() * .34);
    let y = height * (.12 + random() * .70);
    const points = [[x, y]];
    for (let segment = 0; segment < 4; segment += 1) {
      x += (random() - .5) * 18;
      y += 8 + random() * 18;
      points.push([x, y]);
    }

    ctx.beginPath();
    points.forEach(([px, py], index) => {
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = "rgba(111,91,70,.12)";
    ctx.lineWidth = .8;
    ctx.stroke();

    ctx.save();
    ctx.translate(-.7, -.8);
    ctx.beginPath();
    points.forEach(([px, py], index) => {
      if (index === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = "rgba(255,248,231,.32)";
    ctx.lineWidth = .55;
    ctx.stroke();
    ctx.restore();
  }
}

function strokeEngraving(ctx, drawPath, alpha = .35, weight = 1, phase = 0) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.save();
  ctx.translate(1.25, 1.45);
  ctx.strokeStyle = `rgba(97,51,39,${alpha * .75})`;
  ctx.lineWidth = 2.1 * weight;
  ctx.beginPath();
  drawPath(ctx);
  ctx.stroke();
  ctx.restore();
  ctx.save();
  ctx.translate(-.65, -.75);
  const livingStroke = ctx.createLinearGradient(0, 0, 190, 130);
  const shimmer = .72 + Math.sin(phase) * .18;
  livingStroke.addColorStop(0, `rgba(183,104,76,${alpha * .72 * shimmer})`);
  livingStroke.addColorStop(.43, `rgba(205,132,94,${alpha * .92})`);
  livingStroke.addColorStop(.72, `rgba(157,92,68,${alpha * .70 * (1.08 - shimmer * .22)})`);
  livingStroke.addColorStop(1, `rgba(244,210,181,${alpha * .68})`);
  ctx.strokeStyle = livingStroke;
  ctx.lineWidth = .95 * weight;
  ctx.beginPath();
  drawPath(ctx);
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawTechGlyphs(ctx, width, height, progress, random, ambient = 0) {
  const alpha = .09 + progress * .34;
  const left = width * .055;
  const right = width * .62;
  const top = height * .075;
  const bottom = height * .90;
  const glyphCount = width < 420 ? 9 : 15;

  for (let i = 0; i < glyphCount; i += 1) {
    const gx = left + random() * Math.max(20, right - left);
    const gy = top + random() * Math.max(20, bottom - top);
    const size = 8 + random() * 17;
    const kind = i % 5;
    const localAlpha = alpha * (.5 + random() * .5);
    const driftX = Math.sin(ambient * 1.35 + i * .91) * (1.2 + progress * 1.6);
    const driftY = Math.cos(ambient * 1.05 + i * .67) * (.8 + progress * 1.1);
    const x = gx + driftX;
    const y = gy + driftY;
    const glyphPhase = ambient * 1.7 + i * .52;

    if (kind === 0) {
      strokeEngraving(ctx, (p) => {
        for (let t = 0; t <= Math.PI * 3.7; t += .13) {
          const r = 1.2 + t * .62;
          const px = x + Math.cos(t) * r;
          const py = y + Math.sin(t) * r * .82;
          if (t === 0) p.moveTo(px, py); else p.lineTo(px, py);
        }
      }, localAlpha, .68, glyphPhase);
    } else if (kind === 1) {
      strokeEngraving(ctx, (p) => {
        p.moveTo(x - size, y);
        p.quadraticCurveTo(x - size * .45, y - size * .42, x, y);
        p.quadraticCurveTo(x + size * .45, y + size * .42, x + size, y);
      }, localAlpha, .62, glyphPhase);
      strokeEngraving(ctx, (p) => { p.moveTo(x - size * .6, y + 5); p.lineTo(x + size * .62, y + 5); }, localAlpha * .7, .45, glyphPhase);
    } else if (kind === 2) {
      const pts = [
        [x - size * .72, y + size * .34],
        [x - size * .18, y - size * .28],
        [x + size * .24, y + size * .10],
        [x + size * .72, y - size * .36],
      ];
      strokeEngraving(ctx, (p) => {
        p.moveTo(pts[0][0], pts[0][1]);
        pts.slice(1).forEach(([x, y]) => p.lineTo(x, y));
      }, localAlpha, .65, glyphPhase);
      pts.forEach(([x,y]) => {
        ctx.beginPath(); ctx.arc(x,y,1.7,0,Math.PI*2); ctx.fillStyle=`rgba(128,73,55,${localAlpha*.78})`; ctx.fill();
      });
    } else if (kind === 3) {
      strokeEngraving(ctx, (p) => {
        p.moveTo(x - size * .6, y - size * .52);
        p.lineTo(x, y);
        p.lineTo(x - size * .6, y + size * .52);
        p.moveTo(x + size * .6, y - size * .52);
        p.lineTo(x, y);
        p.lineTo(x + size * .6, y + size * .52);
      }, localAlpha, .66, glyphPhase);
    } else {
      strokeEngraving(ctx, (p) => {
        p.moveTo(x, y - size * .62);
        p.lineTo(x + size * .48, y);
        p.lineTo(x, y + size * .62);
        p.lineTo(x - size * .48, y);
        p.closePath();
      }, localAlpha, .58, glyphPhase);
      strokeEngraving(ctx, (p) => { p.moveTo(x - size * .42, y); p.lineTo(x + size * .42, y); }, localAlpha * .78, .45, glyphPhase);
    }
  }

  ctx.save();
  ctx.globalAlpha = .08 + progress * .20;
  for (let i = 0; i < 7; i += 1) {
    const y = height * (.16 + i * .105) + (random() - .5) * 5 + Math.sin(ambient * 1.2 + i * .8) * 1.6;
    ctx.beginPath();
    ctx.moveTo(width * .04, y);
    ctx.bezierCurveTo(width * .22, y - 5 + random() * 10, width * .47, y - 6 + random() * 12, width * .68, y + (random() - .5) * 7);
    ctx.strokeStyle = i % 3 === 0
      ? `rgba(164,91,67,${.22 + progress * .20})`
      : i % 3 === 1
        ? `rgba(194,112,80,${.18 + progress * .18})`
        : `rgba(132,75,60,${.17 + progress * .17})`;
    ctx.lineWidth = .6 + random() * .6;
    ctx.stroke();
  }
  ctx.restore();
}

function drawLivingMineralWash(ctx, width, height, progress, ambient) {
  const travel = (Math.sin(ambient * .72) + 1) / 2;
  const cx = width * (.18 + travel * .56);
  const cy = height * (.24 + Math.cos(ambient * .54) * .08);
  const radius = Math.max(width, height) * .62;
  const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  wash.addColorStop(0, `rgba(255,238,205,${.035 + progress * .045})`);
  wash.addColorStop(.34, `rgba(205,170,126,${.030 + progress * .040})`);
  wash.addColorStop(.62, `rgba(153,111,80,${.016 + progress * .028})`);
  wash.addColorStop(1, "rgba(72,58,45,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawTorchIllumination(ctx, width, height, progress, fromLeft = false) {
  if (progress <= .03) return;
  const cx = width * (fromLeft ? .09 : .91);
  const cy = height * .48;
  const radius = Math.max(width, height) * (.24 + progress * .20);
  const torch = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  torch.addColorStop(0, `rgba(116,229,255,${.07 + progress * .18})`);
  torch.addColorStop(.28, `rgba(49,185,230,${.05 + progress * .14})`);
  torch.addColorStop(.7, `rgba(28,143,190,${.025 + progress * .07})`);
  torch.addColorStop(1, "rgba(13,100,143,0)");
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = torch;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawMineralPocket(ctx, width, height, progress, random) {
  const cx = width * .76;
  const cy = height * .46;
  const radius = Math.min(width * .50, height) * .42;
  const halo = ctx.createRadialGradient(cx - radius * .22, cy - radius * .26, radius * .05, cx, cy, radius);
  halo.addColorStop(0, `rgba(247,230,199,${.06 + progress * .05})`);
  halo.addColorStop(.65, "rgba(137,116,91,.07)");
  halo.addColorStop(1, "rgba(55,44,35,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 88; i += 1) {
    const theta = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * radius;
    const x = cx + Math.cos(theta) * r;
    const y = cy + Math.sin(theta) * r * .86;
    ctx.beginPath();
    ctx.arc(x, y, .35 + random() * 1.45, 0, Math.PI * 2);
    ctx.fillStyle = random() > .48
      ? `rgba(250,251,248,${.018 + random() * .05})`
      : `rgba(96,78,59,${.028 + random() * .07})`;
    ctx.fill();
  }
}

function drawSediment(ctx, width, height, progress, random) {
  const alpha = Math.max(.025, .22 * (1 - progress));
  const cx = width * .76;
  const cy = height * .46;
  const radius = Math.min(width * .50, height) * .42;

  for (let i = 0; i < 46; i += 1) {
    const theta = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * radius;
    ctx.beginPath();
    ctx.arc(cx + Math.cos(theta) * r, cy + Math.sin(theta) * r * .90, 1.5 + random() * 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(119,98,73,${alpha * (.35 + random() * .65)})`;
    ctx.fill();
  }
}

function drawFloatingDust(ctx, width, height, progress, random, ambient) {
  const count = width < 420 ? 24 : 38;
  const travelHeight = height + 30;
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const baseX = random() * width;
    const baseY = random() * travelHeight;
    const speed = 2.4 + random() * 4.2;
    const phase = random() * Math.PI * 2;
    const sway = 2.5 + random() * 7;
    const y = ((baseY - ambient * speed + travelHeight * 4) % travelHeight) - 10;
    const x = baseX + Math.sin(ambient * (.22 + random() * .12) + phase) * sway;
    const radius = .45 + random() * 1.45;
    const alpha = (.055 + random() * .11) * (.88 + progress * .24);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = random() > .22
      ? `rgba(229,211,178,${alpha})`
      : `rgba(144,102,75,${alpha * .72})`;
    ctx.fill();
  }
  ctx.restore();
}

export default function FossilTimelineSurface({ category, index, label, immersive = false }) {
  const canvasRef = useRef(null);
  const fossilType = useMemo(() => fossilTypeFor(category, index), [category, index]);
  const seed = useMemo(() => seedFrom(`${category}-${index}-${label ?? "fossil"}`), [category, index, label]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.closest(".timeline-expedition-row") ?? canvas?.closest(".timeline-card--zoom");
    if (!canvas || !host) return undefined;

    const context = canvas.getContext("2d");
    if (!context) return undefined;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let frame = 0;
    let lastTime = 0;
    let currentProgress = .025;
    let targetProgress = .025;
    let compactVisible = false;
    let surfaceVisible = false;
    let lastPaint = 0;
    const torchFromLeft = host.classList.contains("is-right");
    const compactMedia = window.matchMedia?.("(max-width: 1240px)");

    const phaseProgress = () => {
      if (immersive) return 1;
      if (compactMedia?.matches) return compactVisible ? .58 : .22;
      const phase = host.dataset.timelineInspection;
      if (phase === "active") return 1;
      if (phase === "approaching") return .86;
      return .045;
    };

    const draw = (progress, time = 0) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const nextWidth = Math.max(1, Math.round(rect.width));
      const nextHeight = Math.max(1, Math.round(rect.height));

      if (nextWidth !== width || nextHeight !== height || canvas.width !== Math.round(nextWidth * dpr) || canvas.height !== Math.round(nextHeight * dpr)) {
        width = nextWidth;
        height = nextHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, width, height);

      const random = createRandom(seed);
      const ambient = time * .001;
      const fossilPulse = .84 + ((Math.sin(ambient * 1.18 + index) + 1) / 2) * .16;
      const fossilScale = 1 + Math.sin(ambient * .92 + index * .7) * .012;
      const fossilX = width * .76;
      const fossilY = height * .46;
      context.save();
      drawStoneSlab(context, width, height, random);
      drawMineralPocket(context, width, height, progress, random);
      drawLivingMineralWash(context, width, height, progress, ambient);
      drawTechGlyphs(context, width, height, progress, random, ambient);

      context.save();
      context.translate(fossilX, fossilY);
      context.scale(fossilScale, fossilScale);
      context.translate(-fossilX, -fossilY);
      context.globalAlpha = (.055 + progress * .70) * fossilPulse;
      if (fossilType === "trilobite") drawTrilobite(context, width, height);
      else if (fossilType === "leaf") drawLeaf(context, width, height);
      else if (fossilType === "shell") drawShell(context, width, height);
      else if (fossilType === "coral") drawCoral(context, width, height, random);
      else drawAmmonite(context, width, height, progress, random);
      context.restore();

      drawSediment(context, width, height, progress, random);
      drawFloatingDust(context, width, height, progress, random, ambient);
      if (!compactMedia?.matches) {
        drawTorchIllumination(context, width, height, progress, torchFromLeft);
      }
      context.restore();
    };

    const tick = (time) => {
      const delta = lastTime ? Math.min(50, time - lastTime) : 16;
      lastTime = time;
      const amount = reducedMotion?.matches ? 1 : 1 - Math.exp(-delta / 48);
      currentProgress += (targetProgress - currentProgress) * amount;
      const transitioning = Math.abs(targetProgress - currentProgress) > .006;
      const ambientActive = surfaceVisible && !reducedMotion?.matches;
      const shouldPaint = transitioning || !ambientActive || !lastPaint || time - lastPaint >= 34;

      if (shouldPaint) {
        if (!transitioning) currentProgress = targetProgress;
        draw(currentProgress, time);
        lastPaint = time;
      }

      if (transitioning || ambientActive) {
        frame = window.requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const schedule = () => {
      targetProgress = phaseProgress();
      if (reducedMotion?.matches) {
        currentProgress = targetProgress;
        draw(currentProgress, performance.now());
        return;
      }
      if (!frame) {
        lastTime = 0;
        frame = window.requestAnimationFrame(tick);
      }
    };

    const mutationObserver = new MutationObserver(schedule);
    mutationObserver.observe(host, { attributes: true, attributeFilter: ["data-timeline-inspection"] });

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(() => draw(currentProgress, performance.now()))
      : null;
    resizeObserver?.observe(canvas);

    const surfaceObserver = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          surfaceVisible = Boolean(entries[0]?.isIntersecting);
          if (surfaceVisible) schedule();
          else if (frame && Math.abs(targetProgress - currentProgress) <= .006) {
            window.cancelAnimationFrame(frame);
            frame = 0;
          }
        }, { threshold: .01, rootMargin: "120px 0px 120px 0px" })
      : null;
    surfaceObserver?.observe(host);

    const compactObserver = typeof IntersectionObserver !== "undefined"
      ? new IntersectionObserver((entries) => {
          if (!compactMedia?.matches) return;
          compactVisible = Boolean(entries[0]?.isIntersecting);
          host.dataset.fossilCompactScan = compactVisible ? "ambient" : "idle";
          schedule();
        }, { threshold: .52, rootMargin: "-8% 0px -18% 0px" })
      : null;
    compactObserver?.observe(host);
    reducedMotion?.addEventListener?.("change", schedule);

    targetProgress = phaseProgress();
    currentProgress = targetProgress;
    draw(currentProgress, performance.now());

    return () => {
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      compactObserver?.disconnect();
      surfaceObserver?.disconnect();
      delete host.dataset.fossilCompactScan;
      reducedMotion?.removeEventListener?.("change", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [fossilType, immersive, seed, index]);

  return (
    <div className="timeline-fossil-surface" data-fossil-type={fossilType} aria-hidden="true">
      <canvas ref={canvasRef} className="timeline-fossil-canvas" />
    </div>
  );
}
