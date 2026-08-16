// Shared deterministic volcano Canvas2D renderer used by main-thread fallback and OffscreenCanvas worker.
function drawParticleField(context, particles, textures, viewport, elapsedSeconds, profile) {
  const { width, height, dpr } = viewport;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, width, height);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const smokeDensity = Math.min(1.5, profile?.smokeDensity ?? 1.34);
  const emberStrength = Math.min(1.8, profile?.embers ?? 0.055);
  const ashStrength = Math.min(1.65, profile?.ash ?? 0.01);
  const bubbleStrength = Math.min(1.8, profile?.bubbles ?? 0.84);
  const sedimentStrength = Math.min(1.5, profile?.sediment ?? 0.12);

  for (const particle of particles) {
    const lifeRatio = Math.min(1, particle.life / Math.max(0.001, particle.ttl));
    const fade = Math.sin(Math.PI * lifeRatio);
    const pulse = 0.84 + Math.sin(particle.phase + elapsedSeconds * 2.1) * 0.16;

    if (particle.type === "smoke" || particle.type === "vent") {
      const texture = textures.smoke[particle.variant % textures.smoke.length];
      const isVent = particle.type === "vent";
      const layer = isVent ? "vent" : particle.plumeLayer ?? "main";
      const layerScale = layer === "vent"
        ? 0.74
        : layer === "hot"
          ? 0.82
          : layer === "diffuse"
            ? 1.08
            : 0.96;
      const densityScale = isVent ? 1 : 0.94 + smokeDensity * 0.08;
      const size = particle.size * layerScale * densityScale;
      const horizontalStretch = layer === "diffuse" ? 1.10 : layer === "main" ? 1.02 : 0.96;
      const verticalStretch = layer === "diffuse" ? 0.96 : 1.05;
      const layerOpacity = layer === "hot"
        ? 0.78
        : layer === "main"
          ? 0.68
          : layer === "diffuse"
            ? 0.46
            : 0.42;

      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.scale(horizontalStretch, verticalStretch);
      context.filter = "none";
      context.globalCompositeOperation = "source-over";
      const smokeFade = Math.min(
        1,
        Math.max(0, lifeRatio / 0.08),
        Math.max(0, (1 - lifeRatio) / 0.12),
      );
      context.globalAlpha = Math.min(
        0.82,
        particle.alpha * Math.max(0.30, smokeFade) * layerOpacity * (0.92 + smokeDensity * 0.10),
      );
      context.drawImage(texture, -size / 2, -size / 2, size, size);

      if (!isVent && layer === "hot" && textures.hotSmoke && lifeRatio < 0.70) {
        context.globalCompositeOperation = "source-over";
        context.globalAlpha = Math.min(
          0.18,
          particle.alpha * Math.max(0.10, 1 - lifeRatio * 1.15),
        );
        context.drawImage(textures.hotSmoke, -size * 0.22, -size * 0.44, size * 0.44, size * 0.86);
      }
      context.restore();
      continue;
    }

    if (particle.type === "bubble") {
      const wobble = Math.sin(particle.phase + elapsedSeconds * 2.4);
      const size = particle.size * 2.25;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(wobble * 0.12);
      context.scale(1 + wobble * 0.10, 1 - wobble * 0.07);
      context.globalAlpha = particle.alpha * Math.max(0.12, fade) * (0.45 + bubbleStrength * 0.62);
      context.drawImage(textures.bubble, -size / 2, -size / 2, size, size);
      context.restore();
      continue;
    }

    if (particle.type === "ash") {
      if (ashStrength < 0.025) continue;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = particle.alpha * Math.max(0.05, fade) * ashStrength;
      context.fillStyle = "rgba(31,38,47,.76)";
      context.beginPath();
      context.ellipse(0, 0, particle.size * 1.45, particle.size * 0.55, 0, 0, Math.PI * 2);
      context.fill();
      context.restore();
      continue;
    }

    if (particle.type === "sediment") {
      if (sedimentStrength < 0.08) continue;
      context.save();
      context.translate(particle.x, particle.y);
      context.globalAlpha = particle.alpha * Math.max(0.04, fade) * sedimentStrength;
      context.fillStyle = "rgba(118,103,82,.54)";
      context.beginPath();
      context.arc(0, 0, particle.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
      continue;
    }



    const texture = particle.type === "ember" ? textures.ember : textures.bio;
    const strength = particle.type === "ember" ? emberStrength : Math.max(0.45, 0.86 - (profile?.lava ?? 0) * 0.18);
    if (strength < 0.02) continue;
    const scale = particle.type === "ember" ? 4.1 : 4.2;
    const size = particle.size * scale;
    context.save();
    context.globalAlpha = particle.alpha * Math.max(0.08, fade) * pulse * strength;
    if (particle.type === "ember") context.globalCompositeOperation = "lighter";
    context.drawImage(texture, particle.x - size / 2, particle.y - size / 2, size, size);
    context.restore();
  }
}


function createSettledDebrisSurface(pixelWidth, pixelHeight) {
  const surface = typeof document !== "undefined"
    ? document.createElement("canvas")
    : new OffscreenCanvas(pixelWidth, pixelHeight);
  surface.width = pixelWidth;
  surface.height = pixelHeight;
  return surface;
}

function traceRock(context, rock, dpr = 1) {
  const r = rock.size * dpr;
  const shape = rock.shape ?? [0.8, 0.7, 0.78, 0.68];
  context.beginPath();
  context.moveTo(-r * shape[0], r * 0.18);
  context.lineTo(-r * 0.26, -r * shape[1]);
  context.lineTo(r * shape[2], -r * 0.32);
  context.lineTo(r * 0.52, r * shape[3]);
  context.closePath();
}

function bakeSettledRock(surface, rock, viewport) {
  if (!surface) return;
  const context = surface.getContext("2d", { alpha: true });
  if (!context) return;
  const { dpr } = viewport;
  context.save();
  context.translate(rock.x * dpr, rock.y * dpr);
  context.rotate(rock.rotation);
  context.globalAlpha = rock.kind === "dust" ? 0.58 : 1;
  context.fillStyle = rock.kind === "dust" ? "rgba(76,72,67,.72)" : "rgba(7,13,18,.96)";
  context.strokeStyle = rock.heat > 0.08 ? `rgba(174,31,8,${Math.min(.48, rock.heat * .44)})` : "rgba(74,92,96,.16)";
  context.lineWidth = Math.max(0.55, dpr * (rock.kind === "mega" ? 0.95 : 0.7));
  traceRock(context, rock, dpr);
  context.fill();
  context.stroke();
  context.restore();
}

function drawRockfall(context, rockfall, settledSurface, viewport) {
  const { width, height, dpr } = viewport;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width * dpr, height * dpr);
  if (settledSurface) context.drawImage(settledSurface, 0, 0);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  for (const rock of rockfall.active) {
    context.save();
    context.translate(rock.x, rock.y);
    context.rotate(rock.rotation);
    if (rock.kind === "dust") {
      context.globalAlpha = 0.66;
      context.fillStyle = "rgba(106,97,86,.76)";
    } else {
      context.fillStyle = rock.kind === "hot" || rock.kind === "mega" ? "rgba(10,12,14,.99)" : "rgba(6,12,17,.98)";
    }
    context.strokeStyle = rock.heat > 0.08 ? `rgba(226,52,12,${Math.min(.68, .18 + rock.heat * .54)})` : "rgba(82,103,108,.22)";
    context.lineWidth = rock.kind === "mega" ? 1.25 : 0.85;
    traceRock(context, rock, 1);
    context.fill();
    context.stroke();
    if (rock.heat > 0.30 && rock.kind !== "dust") {
      context.globalCompositeOperation = "lighter";
      context.globalAlpha = Math.min(0.32, rock.heat * 0.24);
      context.fillStyle = "rgba(255,72,12,.92)";
      context.scale(0.48, 0.48);
      traceRock(context, rock, 1);
      context.fill();
    }
    context.restore();
  }
}


export { drawParticleField, createSettledDebrisSurface, bakeSettledRock, drawRockfall };
