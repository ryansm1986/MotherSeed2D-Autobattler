import { getEnemyDrawProfile } from "../../game/content/enemies";
import { characterClasses } from "../../game/content/classes";
import {
  animatedGrassTufts,
  groveClearings,
  grovePathRoutes,
  terrainOverlays,
  world,
} from "../../game/world/arena";
import { allEnemies, lootCorpse, type EnemyState, type GameState, type Obstacle, type PartyMemberState } from "../../game/state";
import type { AnimationName, DirectionName, MonsterAnimationName, Vec2, WorldAssetName } from "../../game/types";
import { canPlayerTalkToCodger, isIntroRoom } from "../../game/world/intro-room";
import {
  magicMissileAnimationRate,
  magicMissileForwardRotation,
  magicMissileLifetime,
  enemyRockThrowAnimationRate,
  motherslashWaveAnimationRate,
  motherslashWaveRadius,
  moonwellBeamAnimationRate,
  moonwellBeamFrameScale,
  moonfallFrameScale,
  moonfallImpactDuration,
  moonBurstAnimationRate,
  moonBurstFrameScale,
  clericHealAnimationRate,
  clericHealFrameScale,
  shroomlingAnimationRate,
  treeGoblinHeadAnimationRate,
  verdantExplosionAnimationRate,
  nightbloomProjectileAnimationRate,
  nightbloomRootBurstAnimationRate,
  nightbloomNovaAnimationRate,
  nightbloomPetalImpactAnimationRate,
  obsidianProjectileAnimationRate,
  obsidianSmiteAnimationRate,
  obsidianWheelAnimationRate,
  obsidianImpactAnimationRate,
  abyssalProjectileAnimationRate,
  abyssalImpactAnimationRate,
  abyssalNovaAnimationRate,
  briarheartProjectileAnimationRate,
  briarheartVineAnimationRate,
  briarheartNovaAnimationRate,
  briarheartImpactAnimationRate,
  woundclockProjectileAnimationRate,
  woundclockTrapAnimationRate,
  woundclockImpactAnimationRate,
  warriorSkillAnimationRate,
} from "../../game/combat/projectiles";
import type { CanvasRenderer, DrawProfile, RenderAssets, SpriteFrame } from "./types";
import type { CardinalDirectionName } from "../../game/types";
import { createCamera, resizeCanvas, updateCamera } from "./camera";

const warriorSpriteDraw = {
  standard: {
    scale: 0.67,
    anchorX: 96,
    anchorY: 181,
    baselineOffset: 28,
  },
  wideAction: {
    scale: 0.8,
    anchorX: 96,
    anchorY: 181,
    baselineOffset: 28,
  },
};

const purpleMageSpriteDraw = {
  standard: {
    scale: 0.98,
    anchorX: 64,
    anchorY: 118,
    baselineOffset: 28,
    targetContentHeight: 120,
  },
  wideAction: {
    scale: 0.98,
    anchorX: 96,
    anchorY: 140,
    baselineOffset: 28,
    targetContentHeight: 120,
  },
  dodge: {
    scale: 0.54,
    anchorX: 128,
    anchorY: 241,
    baselineOffset: 28,
    targetContentHeight: 112,
  },
  specialCast: {
    scale: 0.68,
    anchorX: 160,
    anchorY: 298,
    baselineOffset: 28,
  },
  spinCast: {
    scale: 0.68,
    anchorX: 160,
    anchorY: 298,
    baselineOffset: 28,
    targetContentHeight: 120,
  },
};

const clericSpriteDraw = {
  standard: {
    scale: 0.98,
    anchorX: 192,
    anchorY: 361,
    baselineOffset: 28,
    targetContentHeight: 120,
  },
  dodge: {
    scale: 0.98,
    anchorX: 192,
    anchorY: 361,
    baselineOffset: 28,
    targetContentHeight: 116,
  },
  cast: {
    scale: 0.82,
    anchorX: 192,
    anchorY: 361,
    baselineOffset: 28,
    targetContentHeight: 136,
  },
};

const codgerSpriteDraw = {
  targetContentHeight: 128,
  baselineOffset: 28,
  shadowWidth: 52,
  shadowHeight: 20,
  talkOffsetY: -170,
  speechOffsetY: -215,
};

export function createCanvasRenderer(canvas: HTMLCanvasElement, assets: RenderAssets): CanvasRenderer {
  const canvasContext = canvas.getContext("2d", { alpha: false });

  if (!canvasContext) {
    throw new Error("Canvas 2D rendering is unavailable");
  }

  const ctx: CanvasRenderingContext2D = canvasContext;
  const camera = createCamera();

  function resize() {
    resizeCanvas(canvas, ctx, camera);
  }

  function draw(state: GameState, delta: number) {
    updateCamera(camera, state, delta);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.save();
    ctx.scale(camera.scale, camera.scale);
    ctx.translate(-camera.x, -camera.y);

    drawWorld(ctx, assets);
    drawVerdantExplosions(ctx, state, assets);
    allEnemies(state).forEach((enemy) => drawTelegraph(ctx, enemy));
    drawMoonBurstEffects(ctx, state, assets);
    drawWarriorSkillEffects(ctx, state, assets);

    const drawables = [
      ...(isIntroRoom(state)
        ? [{
            y: state.intro.codger.y,
            draw: () => drawCodger(ctx, state, assets),
          }]
        : []),
      ...allEnemies(state).map((enemy) => ({
        y: enemy.y,
        draw: () => drawEnemy(ctx, state, enemy, assets, state.enemy === enemy),
      })),
      ...state.party.members.map((member) => ({
        y: member.y,
        draw: () => drawPlayer(ctx, state, assets, member),
      })),
    ].sort((a, b) => a.y - b.y);

    drawables.forEach((item) => item.draw());
    drawPartyHealthBars(ctx, state, assets);
    drawMagicMissiles(ctx, state, assets);
    drawClericHealEffects(ctx, state, assets);
    drawEnemyRockThrows(ctx, state, assets);
    drawNightbloomProjectiles(ctx, state, assets);
    drawObsidianProjectiles(ctx, state, assets);
    drawAbyssalProjectiles(ctx, state, assets);
    drawBriarheartProjectiles(ctx, state, assets);
    drawWoundclockProjectiles(ctx, state, assets);
    drawShroomSporeClouds(ctx, state, assets);
    drawShroomlings(ctx, state, assets);
    drawTreeGoblinHeads(ctx, state, assets);
    drawNightbloomGroundEffects(ctx, state, assets);
    drawObsidianGroundEffects(ctx, state, assets);
    drawAbyssalGroundEffects(ctx, state, assets);
    drawBriarheartGroundEffects(ctx, state, assets);
    drawWoundclockGroundEffects(ctx, state, assets);
    drawMotherslashWaves(ctx, state, assets);
    drawMoonfallStrikes(ctx, state, assets);
    drawMoonwellBeams(ctx, state, assets);
    drawLoot(ctx, state, assets);
    drawFloatingCombatTexts(ctx, state);
    drawCodgerOverlay(ctx, state);

    ctx.restore();
  }

  return {
    camera,
    resize,
    draw,
  };
}

function drawWorld(ctx: CanvasRenderingContext2D, assets: RenderAssets) {
  if (assets.dungeonTreeRoomFrame) {
    drawDungeonTreeRoom(ctx, assets.dungeonTreeRoomFrame);
    return;
  }

  drawTileGround(ctx, assets);
}

function drawDungeonTreeRoom(ctx: CanvasRenderingContext2D, frame: SpriteFrame) {
  ctx.save();
  ctx.fillStyle = "#050403";
  ctx.fillRect(0, 0, world.width, world.height);
  ctx.drawImage(frame.canvas, 0, 0, world.width, world.height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.rect(0, 0, world.width, world.height);
  drawWalkableBoundaryPath(ctx, -8);
  ctx.fill("evenodd");
  ctx.restore();
}

function drawTileGround(ctx: CanvasRenderingContext2D, assets: RenderAssets) {
  const grassTexture = assets.grassTerrainTile ?? assets.worldAssets.grassTile;
  if (!grassTexture) {
    ctx.fillStyle = "#6b8f32";
    ctx.fillRect(0, 0, world.width, world.height);
    return;
  }

  drawLargeGrassLayer(ctx, grassTexture);
  drawGroveClearings(ctx);
  drawGrassPathNetwork(ctx);
  drawTerrainPropLayer(ctx, assets);
  drawAnimatedGrassLayer(ctx, assets);
  drawArenaBoundaryShade(ctx);
}

function drawLargeGrassLayer(ctx: CanvasRenderingContext2D, grassTexture: SpriteFrame) {
  ctx.save();
  ctx.fillStyle = "#7fac38";
  ctx.fillRect(0, 0, world.width, world.height);

  for (let y = 0; y < world.height; y += grassTexture.h) {
    for (let x = 0; x < world.width; x += grassTexture.w) {
      ctx.drawImage(grassTexture.canvas, x, y, grassTexture.w + 1, grassTexture.h + 1);
    }
  }

  ctx.globalAlpha = 0.18;
  ctx.globalCompositeOperation = "multiply";
  for (let index = 0; index < 20; index += 1) {
    const angle = index * 2.399963;
    const radius = 130 + ((index * 127) % 620);
    const x = world.center.x + Math.cos(angle) * radius;
    const y = world.center.y + Math.sin(angle) * radius * 0.72;
    ctx.fillStyle = index % 3 === 0 ? "#5e7330" : "#446038";
    ctx.beginPath();
    ctx.ellipse(x, y, 95 + (index % 4) * 25, 44 + (index % 5) * 14, angle * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawGroveClearings(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  groveClearings.forEach((clearing) => {
    ctx.globalAlpha = clearing.alpha;
    ctx.fillStyle = "#b7c95a";
    ctx.beginPath();
    ctx.ellipse(clearing.x, clearing.y, clearing.rx, clearing.ry, clearing.rotation, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawGrassPathNetwork(ctx: CanvasRenderingContext2D) {
  grovePathRoutes.forEach((route, index) => {
    drawSoftRoute(ctx, route, 118 - index * 12, "rgba(55, 72, 28, 0.24)");
    drawSoftRoute(ctx, route, 72 - index * 8, "rgba(151, 164, 68, 0.19)");
    drawSoftRoute(ctx, route, 22, "rgba(232, 221, 126, 0.09)");
  });
}

function drawSoftRoute(ctx: CanvasRenderingContext2D, points: Vec2[], width: number, strokeStyle: string) {
  if (points.length < 2) return;

  ctx.save();
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = strokeStyle;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    ctx.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
  }

  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.stroke();
  ctx.restore();
}

function drawArenaBoundaryShade(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = "rgba(6, 16, 11, 0.32)";
  ctx.beginPath();
  ctx.rect(0, 0, world.width, world.height);
  drawWalkableBoundaryPath(ctx, -8);
  ctx.fill("evenodd");

  ctx.strokeStyle = "rgba(223, 215, 127, 0.2)";
  ctx.lineWidth = 7;
  ctx.setLineDash([28, 24]);
  ctx.beginPath();
  drawWalkableBoundaryPath(ctx, -18);
  ctx.stroke();
  ctx.restore();
}

function drawWalkableBoundaryPath(ctx: CanvasRenderingContext2D, inset = 0) {
  const points = world.walkableBoundary;
  if (points.length === 0) return;

  ctx.moveTo(points[0].x, points[0].y + inset);
  for (let index = 1; index < points.length; index += 1) {
    const current = points[index];
    const previous = points[index - 1];
    const midX = (previous.x + current.x) / 2;
    const midY = (previous.y + current.y) / 2 + inset;
    ctx.quadraticCurveTo(previous.x, previous.y + inset, midX, midY);
  }
  const last = points[points.length - 1];
  const first = points[0];
  ctx.quadraticCurveTo(last.x, last.y + inset, (last.x + first.x) / 2, (last.y + first.y) / 2 + inset);
  ctx.quadraticCurveTo(first.x, first.y + inset, first.x, first.y + inset);
  ctx.closePath();
}

function drawTerrainPropLayer(ctx: CanvasRenderingContext2D, assets: RenderAssets) {
  terrainOverlays.forEach((overlay) => {
    const prop = assets.grassTerrainProps[overlay.kind];
    if (!prop) return;
    drawTerrainProp(ctx, prop, overlay.x, overlay.y, overlay.scale, overlay.alpha);
  });
}

function drawAnimatedGrassLayer(ctx: CanvasRenderingContext2D, assets: RenderAssets) {
  if (assets.animatedGrassFrames.length === 0) return;
  const currentFrame = Math.floor(performance.now() / 120);
  animatedGrassTufts.forEach((tuft) => {
    const frame = assets.animatedGrassFrames[(currentFrame + tuft.phase) % assets.animatedGrassFrames.length];
    drawTerrainProp(ctx, frame, tuft.x, tuft.y, tuft.scale, 0.5);
  });
}

function drawTerrainProp(ctx: CanvasRenderingContext2D, prop: SpriteFrame, x: number, y: number, scale: number, alpha: number) {
  const width = prop.w * scale;
  const height = prop.h * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(prop.canvas, x - width / 2, y - height, width, height);
  ctx.restore();
}

function drawTelegraph(ctx: CanvasRenderingContext2D, enemy: EnemyState) {
  if (enemy.state !== "windup" && enemy.state !== "active") return;

  const active = enemy.state === "active";
  ctx.save();
  ctx.globalAlpha = active ? 0.58 : 0.34;
  ctx.fillStyle = active ? "#ff4f3e" : "#f2d36b";
  ctx.strokeStyle = active ? "#ffd0c8" : "#fff0a8";
  ctx.lineWidth = 3;

  if (enemy.currentAttack === "spore_cloud") {
    ctx.fillStyle = active ? "rgba(126, 229, 101, 0.48)" : "rgba(188, 245, 112, 0.32)";
    ctx.strokeStyle = active ? "#d9ff90" : "#f4ffb8";
    ctx.beginPath();
    ctx.ellipse(enemy.x + enemy.attackForward.x * 78, enemy.y + enemy.attackForward.y * 52, 78, 46, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "bite") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    const spread = Math.PI * 0.56;
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.arc(enemy.x, enemy.y, 106, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "arm_attack") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    const spread = Math.PI * 0.72;
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.arc(enemy.x, enemy.y, 168, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "head_throw") {
    ctx.fillStyle = active ? "rgba(244, 132, 82, 0.42)" : "rgba(242, 211, 107, 0.24)";
    ctx.strokeStyle = active ? "#ffd0c8" : "#fff0a8";
    ctx.setLineDash([12, 9]);
    ctx.beginPath();
    ctx.ellipse(enemy.x + enemy.attackForward.x * 96, enemy.y + enemy.attackForward.y * 58, 118, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "rock_slam") {
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, 155, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "rock_spray") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    const spread = Math.PI * 0.68;
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.arc(enemy.x, enemy.y, 260, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "petal_fan") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    const spread = enemy.phaseBloomed ? Math.PI * 0.68 : Math.PI * 0.46;
    ctx.fillStyle = active ? "rgba(207, 75, 172, 0.46)" : "rgba(242, 211, 107, 0.25)";
    ctx.strokeStyle = active ? "#ffc3ef" : "#fff0a8";
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.arc(enemy.x, enemy.y, 430, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "root_snare") {
    const offsets = enemy.phaseBloomed
      ? [{ x: 0, y: 0 }, { x: 112, y: -36 }, { x: -102, y: 64 }, { x: 42, y: 116 }, { x: -58, y: -118 }]
      : [{ x: 0, y: 0 }, { x: 96, y: -28 }, { x: -88, y: 54 }];
    ctx.fillStyle = active ? "rgba(93, 221, 113, 0.4)" : "rgba(242, 211, 107, 0.24)";
    ctx.strokeStyle = active ? "#caff9a" : "#fff0a8";
    offsets.forEach((offset, index) => {
      ctx.globalAlpha = active ? 0.54 : Math.max(0.18, 0.34 - index * 0.035);
      ctx.beginPath();
      ctx.ellipse(enemy.attackTarget.x + offset.x, enemy.attackTarget.y + offset.y, 72, 42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else if (enemy.currentAttack === "nightbloom_nova") {
    ctx.fillStyle = active ? "rgba(207, 75, 172, 0.36)" : "rgba(242, 211, 107, 0.22)";
    ctx.strokeStyle = active ? "#ffc3ef" : "#fff0a8";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 8, enemy.phaseBloomed ? 320 : 282, enemy.phaseBloomed ? 154 : 136, 0, 0, Math.PI * 2);
    ctx.ellipse(enemy.x, enemy.y + 8, 76, 38, 0, 0, Math.PI * 2);
    ctx.fill("evenodd");
    ctx.stroke();
  } else if (enemy.currentAttack === "phase_bloom") {
    ctx.fillStyle = "rgba(191, 102, 255, 0.32)";
    ctx.strokeStyle = "#f5d2ff";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 8, 210, 104, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "glass_lance") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    ctx.fillStyle = active ? "rgba(255, 78, 55, 0.44)" : "rgba(242, 211, 107, 0.24)";
    ctx.strokeStyle = active ? "#ffd0c8" : "#fff0a8";
    ctx.translate(enemy.x + enemy.attackForward.x * 250, enemy.y + enemy.attackForward.y * 250);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(-250, -18, 500, 36, 18);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "shard_spiral") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    const spread = enemy.phaseBloomed ? Math.PI * 1.72 : Math.PI * 1.35;
    ctx.fillStyle = active ? "rgba(255, 104, 74, 0.34)" : "rgba(242, 211, 107, 0.2)";
    ctx.strokeStyle = active ? "#ffb39f" : "#fff0a8";
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.arc(enemy.x, enemy.y, 390, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "reliquary_smite") {
    const offsets = enemy.phaseBloomed
      ? [{ x: 0, y: 0 }, { x: 124, y: 46 }, { x: -108, y: -58 }, { x: 72, y: -126 }, { x: -74, y: 128 }]
      : [{ x: 0, y: 0 }, { x: 118, y: 42 }, { x: -96, y: -52 }];
    ctx.fillStyle = active ? "rgba(255, 78, 55, 0.38)" : "rgba(242, 211, 107, 0.22)";
    ctx.strokeStyle = active ? "#ffceb5" : "#fff0a8";
    offsets.forEach((offset, index) => {
      ctx.globalAlpha = active ? 0.52 : Math.max(0.18, 0.34 - index * 0.035);
      ctx.beginPath();
      ctx.ellipse(enemy.attackTarget.x + offset.x, enemy.attackTarget.y + offset.y, 78, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else if (enemy.currentAttack === "penitent_wheel") {
    ctx.fillStyle = active ? "rgba(255, 78, 55, 0.32)" : "rgba(242, 211, 107, 0.2)";
    ctx.strokeStyle = active ? "#ffceb5" : "#fff0a8";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 8, enemy.phaseBloomed ? 356 : 308, enemy.phaseBloomed ? 168 : 148, 0, 0, Math.PI * 2);
    ctx.ellipse(enemy.x, enemy.y + 8, 82, 40, 0, 0, Math.PI * 2);
    ctx.fill("evenodd");
    ctx.stroke();
  } else if (enemy.currentAttack === "phase_rupture") {
    ctx.fillStyle = "rgba(255, 86, 58, 0.28)";
    ctx.strokeStyle = "#ffd7c4";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 8, 230, 112, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "bell_shard") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    ctx.fillStyle = active ? "rgba(108, 196, 255, 0.42)" : "rgba(242, 211, 107, 0.22)";
    ctx.strokeStyle = active ? "#c8efff" : "#fff0a8";
    ctx.translate(enemy.x + enemy.attackForward.x * 260, enemy.y + enemy.attackForward.y * 260);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(-260, -17, 520, 34, 17);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "tolling_fan") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    const spread = enemy.phaseBloomed ? Math.PI * 1.68 : Math.PI * 1.12;
    ctx.fillStyle = active ? "rgba(108, 196, 255, 0.32)" : "rgba(242, 211, 107, 0.2)";
    ctx.strokeStyle = active ? "#b9ebff" : "#fff0a8";
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.arc(enemy.x, enemy.y, 410, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "grave_mark") {
    const offsets = enemy.phaseBloomed
      ? [{ x: 0, y: 0 }, { x: 132, y: -44 }, { x: -118, y: 62 }, { x: 72, y: 132 }, { x: -82, y: -126 }]
      : [{ x: 0, y: 0 }, { x: 126, y: -38 }, { x: -112, y: 54 }];
    ctx.fillStyle = active ? "rgba(108, 196, 255, 0.36)" : "rgba(242, 211, 107, 0.22)";
    ctx.strokeStyle = active ? "#c8efff" : "#fff0a8";
    offsets.forEach((offset, index) => {
      ctx.globalAlpha = active ? 0.5 : Math.max(0.18, 0.34 - index * 0.035);
      ctx.beginPath();
      ctx.ellipse(enemy.attackTarget.x + offset.x, enemy.attackTarget.y + offset.y, 82, 46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else if (enemy.currentAttack === "dirge_nova") {
    ctx.fillStyle = active ? "rgba(108, 196, 255, 0.3)" : "rgba(242, 211, 107, 0.2)";
    ctx.strokeStyle = active ? "#c8efff" : "#fff0a8";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 8, enemy.phaseBloomed ? 372 : 324, enemy.phaseBloomed ? 176 : 154, 0, 0, Math.PI * 2);
    ctx.ellipse(enemy.x, enemy.y + 8, 86, 42, 0, 0, Math.PI * 2);
    ctx.fill("evenodd");
    ctx.stroke();
  } else if (enemy.currentAttack === "phase_toll") {
    ctx.fillStyle = "rgba(108, 196, 255, 0.28)";
    ctx.strokeStyle = "#d9f4ff";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 8, 248, 118, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "briar_skewer") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    ctx.fillStyle = active ? "rgba(199, 255, 104, 0.42)" : "rgba(242, 211, 107, 0.22)";
    ctx.strokeStyle = active ? "#eaff9e" : "#fff0a8";
    ctx.translate(enemy.x + enemy.attackForward.x * 270, enemy.y + enemy.attackForward.y * 270);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(-270, -18, 540, 36, 18);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "seed_barrage") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    const spread = enemy.phaseBloomed ? Math.PI * 1.62 : Math.PI * 1.1;
    ctx.fillStyle = active ? "rgba(221, 181, 63, 0.34)" : "rgba(242, 211, 107, 0.2)";
    ctx.strokeStyle = active ? "#ffe176" : "#fff0a8";
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y);
    ctx.arc(enemy.x, enemy.y, 420, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "strangler_grove") {
    const offsets = enemy.phaseBloomed
      ? [{ x: 0, y: 0 }, { x: 126, y: -48 }, { x: -116, y: 66 }, { x: 70, y: 132 }, { x: -78, y: -130 }, { x: 0, y: -180 }]
      : [{ x: 0, y: 0 }, { x: 116, y: -44 }, { x: -104, y: 60 }];
    ctx.fillStyle = active ? "rgba(110, 224, 86, 0.38)" : "rgba(242, 211, 107, 0.22)";
    ctx.strokeStyle = active ? "#d8ff8d" : "#fff0a8";
    offsets.forEach((offset, index) => {
      ctx.globalAlpha = active ? 0.52 : Math.max(0.18, 0.34 - index * 0.032);
      ctx.beginPath();
      ctx.ellipse(enemy.attackTarget.x + offset.x, enemy.attackTarget.y + offset.y, 82, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else if (enemy.currentAttack === "pollen_nova") {
    ctx.fillStyle = active ? "rgba(221, 181, 63, 0.32)" : "rgba(242, 211, 107, 0.2)";
    ctx.strokeStyle = active ? "#ffe176" : "#fff0a8";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 8, enemy.phaseBloomed ? 378 : 326, enemy.phaseBloomed ? 180 : 156, 0, 0, Math.PI * 2);
    ctx.ellipse(enemy.x, enemy.y + 8, 88, 42, 0, 0, Math.PI * 2);
    ctx.fill("evenodd");
    ctx.stroke();
  } else if (enemy.currentAttack === "sovereign_bloom") {
    ctx.fillStyle = "rgba(199, 255, 104, 0.28)";
    ctx.strokeStyle = "#eaff9e";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 8, 254, 120, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "chrono_lance") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    ctx.fillStyle = active ? "rgba(93, 210, 255, 0.42)" : "rgba(242, 211, 107, 0.22)";
    ctx.strokeStyle = active ? "#c7f5ff" : "#fff0a8";
    ctx.translate(enemy.x + enemy.attackForward.x * 300, enemy.y + enemy.attackForward.y * 300);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(-300, -16, 600, 32, 16);
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "gear_orbit") {
    const count = enemy.phaseBloomed ? 9 : 6;
    ctx.fillStyle = active ? "rgba(95, 218, 255, 0.28)" : "rgba(242, 211, 107, 0.18)";
    ctx.strokeStyle = active ? "#c7f5ff" : "#fff0a8";
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + performance.now() / 900;
      const x = enemy.x + Math.cos(angle) * 116;
      const y = enemy.y - 18 + Math.sin(angle) * 82;
      ctx.beginPath();
      ctx.ellipse(x, y, 34, 20, angle, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  } else if (enemy.currentAttack === "clockhand_sweep") {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    const spread = Math.PI * 1.22;
    ctx.fillStyle = active ? "rgba(93, 210, 255, 0.24)" : "rgba(242, 211, 107, 0.18)";
    ctx.strokeStyle = active ? "#c7f5ff" : "#fff0a8";
    ctx.beginPath();
    ctx.moveTo(enemy.x, enemy.y - 12);
    ctx.arc(enemy.x, enemy.y - 12, 470, angle - spread / 2, angle + spread / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (enemy.currentAttack === "time_rift") {
    const offsets = enemy.phaseBloomed
      ? [{ x: 0, y: 0 }, { x: 146, y: -82 }, { x: -136, y: 86 }, { x: 84, y: 146 }, { x: -92, y: -142 }]
      : [{ x: 0, y: 0 }, { x: 132, y: -72 }, { x: -126, y: 74 }];
    ctx.fillStyle = active ? "rgba(93, 210, 255, 0.34)" : "rgba(242, 211, 107, 0.2)";
    ctx.strokeStyle = active ? "#c7f5ff" : "#fff0a8";
    offsets.forEach((offset, index) => {
      ctx.globalAlpha = active ? 0.5 : Math.max(0.18, 0.34 - index * 0.035);
      ctx.beginPath();
      ctx.ellipse(enemy.attackTarget.x + offset.x, enemy.attackTarget.y + offset.y, 82, 48, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  } else if (enemy.currentAttack === "hour_zero") {
    ctx.fillStyle = "rgba(93, 210, 255, 0.26)";
    ctx.strokeStyle = "#c7f5ff";
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 4, 286, 132, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    const angle = Math.atan2(enemy.attackForward.y, enemy.attackForward.x);
    ctx.translate(enemy.x + enemy.attackForward.x * 185, enemy.y + enemy.attackForward.y * 185);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.roundRect(-185, -18, 370, 36, 18);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawShroomSporeClouds(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.shroomSporeClouds.forEach((cloud) => {
    const age = cloud.timer / cloud.duration;
    const wobble = Math.sin(cloud.timer * 5.2) * 6;
    const frame = assets.poisonCloudFrames[
      Math.floor(cloud.timer / 0.12) % Math.max(assets.poisonCloudFrames.length, 1)
    ];

    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = ((cloud.radius + wobble) * 2.15) / Math.max(bounds.w, bounds.h, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;

      ctx.save();
      ctx.globalAlpha = Math.max(0, 0.92 * (1 - age * 0.22));
      ctx.shadowColor = "rgba(196, 234, 84, 0.58)";
      ctx.shadowBlur = 16;
      ctx.drawImage(
        frame.canvas,
        cloud.x - anchorX * scale,
        cloud.y - 18 - anchorY * scale,
        frame.w * scale,
        frame.h * scale,
      );
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.48 * (1 - age * 0.35));
    ctx.fillStyle = "#7ee565";
    ctx.strokeStyle = "#d9ff90";
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(126, 229, 101, 0.62)";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(cloud.x, cloud.y - 18, cloud.radius + wobble, cloud.radius * 0.55, 0.12, 0, Math.PI * 2);
    ctx.ellipse(cloud.x - 28, cloud.y - 26, cloud.radius * 0.58, cloud.radius * 0.38, -0.34, 0, Math.PI * 2);
    ctx.ellipse(cloud.x + 30, cloud.y - 28, cloud.radius * 0.52, cloud.radius * 0.34, 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawShroomlings(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.shroomlings.forEach((shroomling) => {
    const tossProgress = Math.min(shroomling.timer / shroomling.tossDuration, 1);
    const lift = shroomling.timer < shroomling.tossDuration ? Math.sin(tossProgress * Math.PI) * 54 : 0;
    const frames = assets.shroomlingFrames[shroomling.direction] ?? assets.shroomlingFrames.down ?? [];
    const frame = frames[Math.floor(shroomling.timer / shroomlingAnimationRate) % Math.max(frames.length, 1)];
    drawShadow(ctx, shroomling.x, shroomling.y + 8, 18, 8, 0.24);

    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = 48 / Math.max(bounds.w, bounds.h, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.save();
      ctx.drawImage(
        frame.canvas,
        shroomling.x - anchorX * scale,
        shroomling.y - lift - 18 - anchorY * scale,
        frame.w * scale,
        frame.h * scale,
      );
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(shroomling.x, shroomling.y - lift);
    ctx.fillStyle = "#c65579";
    ctx.strokeStyle = "#31141f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, -14, 20, 13, 0, Math.PI, Math.PI * 2);
    ctx.lineTo(15, -8);
    ctx.lineTo(-15, -8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f1d6d1";
    ctx.strokeStyle = "#31141f";
    ctx.beginPath();
    ctx.roundRect(-8, -8, 16, 24, 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
}

function drawTreeGoblinHeads(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.treeGoblinHeads.forEach((head) => {
    const progress = Math.min(head.timer / head.duration, 1);
    const frame = assets.spinningHeadFrames[
      Math.floor(head.timer / treeGoblinHeadAnimationRate) % Math.max(assets.spinningHeadFrames.length, 1)
    ];

    drawShadow(ctx, head.x, head.y + 18, 24, 9, 0.24);
    ctx.save();
    ctx.globalAlpha = Math.max(0.2, 1 - Math.max(0, progress - 0.86) / 0.14);
    ctx.translate(head.x, head.y - 20);
    ctx.rotate(head.timer * 5.25);

    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = 62 / Math.max(bounds.w, bounds.h, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.fillStyle = "#815332";
      ctx.strokeStyle = "#2a1710";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 24, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawMagicMissiles(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.magicMissiles.forEach((missile) => {
    ctx.save();
    ctx.translate(missile.x, missile.y);
    ctx.rotate(missile.rotation + magicMissileForwardRotation);

    const animationAge = magicMissileLifetime - missile.ttl;
    const isClericFireball = missile.visual === "clericFireball";
    const frames = isClericFireball ? assets.clericFireballFrames : assets.magicMissileFrames;
    const frame = frames.length > 0 ? frames[Math.floor(animationAge / magicMissileAnimationRate) % frames.length] : null;
    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = (isClericFireball ? 72 : 58) / Math.max(bounds.w, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.shadowColor = isClericFireball ? "rgba(255, 83, 34, 0.72)" : "rgba(127, 200, 255, 0.72)";
      ctx.shadowBlur = isClericFireball ? 24 : 18;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.fillStyle = isClericFireball ? "#ff4e2b" : "#7fc8ff";
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  });
}

function drawClericHealEffects(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.clericHealEffects.forEach((effect) => {
    const progress = Math.min(effect.timer / effect.duration, 1);
    const frame = assets.clericHealFrames[
      Math.floor(effect.timer / clericHealAnimationRate) % Math.max(assets.clericHealFrames.length, 1)
    ];

    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, progress - 0.72) / 0.28);
    ctx.translate(effect.x, effect.y - 54);
    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = clericHealFrameScale;
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h * 0.62;
      ctx.shadowColor = "rgba(126, 231, 95, 0.62)";
      ctx.shadowBlur = 22;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.strokeStyle = "rgba(126, 231, 95, 0.82)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 8, 48, 82, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawEnemyRockThrows(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.enemyRockThrows.forEach((projectile) => {
    const progress = Math.min(projectile.timer / projectile.duration, 1);
    const lift = Math.sin(progress * Math.PI) * 88;
    const frame = assets.enemyRockThrowFrames[
      Math.floor(projectile.timer / enemyRockThrowAnimationRate) % Math.max(assets.enemyRockThrowFrames.length, 1)
    ];

    drawShadow(ctx, projectile.x, projectile.y + 10, 26 - lift * 0.08, 10 - lift * 0.035, 0.25);

    ctx.save();
    ctx.translate(projectile.x, projectile.y - 34 - lift);
    ctx.rotate(projectile.rotation);

    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = 60 / Math.max(bounds.w, bounds.h, 1);
      const width = frame.w * scale;
      const height = frame.h * scale;
      ctx.drawImage(frame.canvas, -width / 2, -height / 2, width, height);
    } else {
      ctx.fillStyle = "#6f644c";
      ctx.strokeStyle = "#2e291f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, 22, 18, 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawObsidianProjectiles(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.obsidianLances.forEach((projectile) => {
    const frame = assets.obsidianLanceFrames[
      Math.floor(projectile.timer / obsidianProjectileAnimationRate) % Math.max(assets.obsidianLanceFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 84, "#ff6f4f");
  });

  state.combat.obsidianShards.forEach((projectile) => {
    const frame = assets.obsidianShardFrames[
      Math.floor(projectile.timer / obsidianProjectileAnimationRate) % Math.max(assets.obsidianShardFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 54, "#ffb08d");
  });

  state.combat.obsidianImpacts.forEach((impact) => {
    const frameIndex = Math.min(
      assets.obsidianSmiteFrames.length - 1,
      Math.floor(impact.timer / obsidianImpactAnimationRate),
    );
    const frame = assets.obsidianSmiteFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = 72 / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;

    ctx.save();
    ctx.translate(impact.x, impact.y);
    ctx.rotate(impact.rotation);
    ctx.shadowColor = "rgba(255, 111, 79, 0.62)";
    ctx.shadowBlur = 14;
    ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });
}

function drawAbyssalProjectiles(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.abyssalBellShards.forEach((projectile) => {
    const frame = assets.abyssalBellShardFrames[
      Math.floor(projectile.timer / abyssalProjectileAnimationRate) % Math.max(assets.abyssalBellShardFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 86, "#8fd8ff");
  });

  state.combat.abyssalFanShards.forEach((projectile) => {
    const frame = assets.abyssalBellShardFrames[
      Math.floor(projectile.timer / abyssalProjectileAnimationRate) % Math.max(assets.abyssalBellShardFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 54, "#a9e4ff");
  });

  state.combat.abyssalImpacts.forEach((impact) => {
    const frameIndex = Math.min(
      assets.abyssalTollImpactFrames.length - 1,
      Math.floor(impact.timer / abyssalImpactAnimationRate),
    );
    const frame = assets.abyssalTollImpactFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = 78 / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;

    ctx.save();
    ctx.translate(impact.x, impact.y - 12);
    ctx.rotate(impact.rotation);
    ctx.shadowColor = "rgba(143, 216, 255, 0.68)";
    ctx.shadowBlur = 16;
    ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });
}

function drawBriarheartProjectiles(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.briarheartSkewers.forEach((projectile) => {
    const frame = assets.briarheartSkewerFrames[
      Math.floor(projectile.timer / briarheartProjectileAnimationRate) % Math.max(assets.briarheartSkewerFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 92, "#d8ff8d");
  });

  state.combat.briarheartSeeds.forEach((projectile) => {
    const frame = assets.briarheartSeedFrames[
      Math.floor(projectile.timer / briarheartProjectileAnimationRate) % Math.max(assets.briarheartSeedFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 58, "#ffd95a");
  });

  state.combat.briarheartImpacts.forEach((impact) => {
    const frameIndex = Math.min(
      assets.briarheartImpactFrames.length - 1,
      Math.floor(impact.timer / briarheartImpactAnimationRate),
    );
    const frame = assets.briarheartImpactFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = 82 / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;

    ctx.save();
    ctx.translate(impact.x, impact.y - 12);
    ctx.rotate(impact.rotation);
    ctx.shadowColor = "rgba(255, 217, 90, 0.68)";
    ctx.shadowBlur = 16;
    ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });
}

function drawWoundclockProjectiles(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.woundclockBolts.forEach((projectile) => {
    const frame = assets.woundclockBoltFrames[
      Math.floor(projectile.timer / woundclockProjectileAnimationRate) % Math.max(assets.woundclockBoltFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 78, "#8ceaff");
  });

  state.combat.woundclockGearOrbs.forEach((orb) => {
    const frame = assets.woundclockGearOrbFrames[
      Math.floor(orb.timer / woundclockProjectileAnimationRate) % Math.max(assets.woundclockGearOrbFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, orb.x, orb.y, orb.rotation, frame, 62, "#f4c86f");
  });

  state.combat.woundclockImpacts.forEach((impact) => {
    const frameIndex = Math.min(
      assets.woundclockImpactFrames.length - 1,
      Math.floor(impact.timer / woundclockImpactAnimationRate),
    );
    const frame = assets.woundclockImpactFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = 86 / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;

    ctx.save();
    ctx.translate(impact.x, impact.y - 12);
    ctx.rotate(impact.rotation);
    ctx.shadowColor = "rgba(140, 234, 255, 0.72)";
    ctx.shadowBlur = 18;
    ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });
}

function drawNightbloomProjectiles(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.nightbloomThorns.forEach((projectile) => {
    const frame = assets.nightbloomThornFrames[
      Math.floor(projectile.timer / nightbloomProjectileAnimationRate) % Math.max(assets.nightbloomThornFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 78, "#9dff93");
  });

  state.combat.nightbloomPetals.forEach((projectile) => {
    const frame = assets.nightbloomPetalFrames[
      Math.floor(projectile.timer / nightbloomProjectileAnimationRate) % Math.max(assets.nightbloomPetalFrames.length, 1)
    ];
    drawNightbloomProjectile(ctx, projectile.x, projectile.y, projectile.rotation, frame, 52, "#ff9fe8");
  });

  state.combat.nightbloomPetalImpacts.forEach((impact) => {
    const progress = Math.min(impact.timer / impact.duration, 1);
    const frameIndex = Math.min(
      assets.nightbloomPetalImpactFrames.length - 1,
      Math.floor(impact.timer / nightbloomPetalImpactAnimationRate),
    );
    const frame = assets.nightbloomPetalImpactFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = 78 / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - progress * 0.35);
    ctx.translate(impact.x, impact.y - 18);
    ctx.rotate(impact.rotation);
    ctx.shadowColor = "rgba(255, 159, 232, 0.62)";
    ctx.shadowBlur = 14;
    ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });
}

function drawNightbloomProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rotation: number,
  frame: SpriteFrame | undefined,
  targetSize: number,
  glow: string,
) {
  ctx.save();
  ctx.translate(x, y - 18);
  ctx.rotate(rotation);
  if (frame) {
    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = targetSize / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;
    ctx.shadowColor = glow;
    ctx.shadowBlur = 14;
    ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
  } else {
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(0, 0, targetSize * 0.35, targetSize * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawNightbloomGroundEffects(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.nightbloomRootBursts.forEach((burst) => {
    if (burst.timer < burst.delay) {
      ctx.save();
      ctx.globalAlpha = 0.24 + Math.sin(performance.now() / 95) * 0.05;
      ctx.strokeStyle = "#caff9a";
      ctx.lineWidth = 3;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.ellipse(burst.x, burst.y + 8, burst.radius, burst.radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const localTimer = burst.timer - burst.delay;
    const progress = Math.min(localTimer / burst.duration, 1);
    const frameIndex = Math.min(
      assets.nightbloomRootBurstFrames.length - 1,
      Math.floor(localTimer / nightbloomRootBurstAnimationRate),
    );
    const frame = assets.nightbloomRootBurstFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = (burst.radius * 2.2) / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, progress - 0.72) / 0.28);
    ctx.shadowColor = "rgba(157, 255, 147, 0.58)";
    ctx.shadowBlur = 16;
    ctx.drawImage(frame.canvas, burst.x - anchorX * scale, burst.y - anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });

  state.combat.nightbloomNovaWaves.forEach((wave) => {
    const progress = Math.min(wave.timer / wave.duration, 1);
    const radius = wave.minRadius + (wave.maxRadius - wave.minRadius) * progress;
    const frameIndex = Math.min(
      assets.nightbloomNovaFrames.length - 1,
      Math.floor(wave.timer / nightbloomNovaAnimationRate),
    );
    const frame = assets.nightbloomNovaFrames[frameIndex];
    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.92 - progress * 0.35);
    ctx.translate(wave.x, wave.y + 8);
    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = (radius * 2.1) / Math.max(bounds.w, bounds.h, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.shadowColor = "rgba(255, 159, 232, 0.62)";
      ctx.shadowBlur = 18;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.strokeStyle = "rgba(255, 159, 232, 0.8)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawObsidianGroundEffects(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.obsidianSmites.forEach((smite) => {
    if (smite.timer < smite.delay) {
      ctx.save();
      ctx.globalAlpha = 0.22 + Math.sin(performance.now() / 90) * 0.05;
      ctx.strokeStyle = "#ffb08d";
      ctx.lineWidth = 3;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.ellipse(smite.x, smite.y, smite.radius, smite.radius * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const localTimer = smite.timer - smite.delay;
    const progress = Math.min(localTimer / smite.duration, 1);
    const frameIndex = Math.min(
      assets.obsidianSmiteFrames.length - 1,
      Math.floor(localTimer / obsidianSmiteAnimationRate),
    );
    const frame = assets.obsidianSmiteFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = (smite.radius * 2.15) / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.94 - progress * 0.28);
    ctx.shadowColor = "rgba(255, 111, 79, 0.62)";
    ctx.shadowBlur = 20;
    ctx.drawImage(frame.canvas, smite.x - anchorX * scale, smite.y - anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });

  state.combat.obsidianWheels.forEach((wheel) => {
    const progress = Math.min(wheel.timer / wheel.duration, 1);
    const radius = wheel.minRadius + (wheel.maxRadius - wheel.minRadius) * progress;
    const frameIndex = Math.min(
      assets.obsidianWheelFrames.length - 1,
      Math.floor(wheel.timer / obsidianWheelAnimationRate),
    );
    const frame = assets.obsidianWheelFrames[frameIndex];

    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.9 - progress * 0.32);
    ctx.translate(wheel.x, wheel.y + 8);
    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = (radius * 2.1) / Math.max(bounds.w, bounds.h, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.shadowColor = "rgba(255, 111, 79, 0.7)";
      ctx.shadowBlur = 26;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.strokeStyle = "#ff6f4f";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawAbyssalGroundEffects(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.abyssalGraveMarks.forEach((mark) => {
    if (mark.timer < mark.delay) {
      ctx.save();
      ctx.globalAlpha = 0.22 + Math.sin(performance.now() / 88) * 0.05;
      ctx.strokeStyle = "#a9e4ff";
      ctx.lineWidth = 3;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.ellipse(mark.x, mark.y, mark.radius, mark.radius * 0.56, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const localTimer = mark.timer - mark.delay;
    const progress = Math.min(localTimer / mark.duration, 1);
    const frameIndex = Math.min(
      assets.abyssalTollImpactFrames.length - 1,
      Math.floor(localTimer / abyssalImpactAnimationRate),
    );
    const frame = assets.abyssalTollImpactFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = (mark.radius * 2.16) / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.94 - progress * 0.3);
    ctx.shadowColor = "rgba(143, 216, 255, 0.66)";
    ctx.shadowBlur = 20;
    ctx.drawImage(frame.canvas, mark.x - anchorX * scale, mark.y - anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });

  state.combat.abyssalNovas.forEach((nova) => {
    if (nova.timer < nova.delay) return;
    const localTimer = nova.timer - nova.delay;
    const progress = Math.min(localTimer / nova.duration, 1);
    const radius = nova.minRadius + (nova.maxRadius - nova.minRadius) * progress;
    const frameIndex = Math.min(
      assets.abyssalNovaFrames.length - 1,
      Math.floor(localTimer / abyssalNovaAnimationRate),
    );
    const frame = assets.abyssalNovaFrames[frameIndex];

    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.88 - progress * 0.32);
    ctx.translate(nova.x, nova.y + 8);
    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = (radius * 2.1) / Math.max(bounds.w, bounds.h, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.shadowColor = "rgba(143, 216, 255, 0.76)";
      ctx.shadowBlur = 28;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.strokeStyle = "#8fd8ff";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawBriarheartGroundEffects(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.briarheartVineEruptions.forEach((eruption) => {
    if (eruption.timer < eruption.delay) {
      ctx.save();
      ctx.globalAlpha = 0.22 + Math.sin(performance.now() / 86) * 0.05;
      ctx.strokeStyle = "#d8ff8d";
      ctx.lineWidth = 3;
      ctx.setLineDash([9, 7]);
      ctx.beginPath();
      ctx.ellipse(eruption.x, eruption.y, eruption.radius, eruption.radius * 0.54, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const localTimer = eruption.timer - eruption.delay;
    const progress = Math.min(localTimer / eruption.duration, 1);
    const frameIndex = Math.min(
      assets.briarheartVineFrames.length - 1,
      Math.floor(localTimer / briarheartVineAnimationRate),
    );
    const frame = assets.briarheartVineFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = (eruption.radius * 2.18) / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;

    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.96 - progress * 0.32);
    ctx.shadowColor = "rgba(216, 255, 141, 0.66)";
    ctx.shadowBlur = 20;
    ctx.drawImage(frame.canvas, eruption.x - anchorX * scale, eruption.y - anchorY * scale, frame.w * scale, frame.h * scale);
    ctx.restore();
  });

  state.combat.briarheartPollenNovas.forEach((nova) => {
    const progress = Math.min(nova.timer / nova.duration, 1);
    const radius = nova.minRadius + (nova.maxRadius - nova.minRadius) * progress;
    const frameIndex = Math.min(
      assets.briarheartNovaFrames.length - 1,
      Math.floor(nova.timer / briarheartNovaAnimationRate),
    );
    const frame = assets.briarheartNovaFrames[frameIndex];

    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.9 - progress * 0.32);
    ctx.translate(nova.x, nova.y + 8);
    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = (radius * 2.08) / Math.max(bounds.w, bounds.h, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.shadowColor = "rgba(255, 217, 90, 0.76)";
      ctx.shadowBlur = 28;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.strokeStyle = "#ffd95a";
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawMotherslashWaves(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.motherslashWaves.forEach((wave) => {
    if (wave.timer < 0) return;

    const progress = Math.min(wave.timer / wave.duration, 1);
    const radius = motherslashWaveRadius(wave);
    const frameCount = assets.motherslashWaveFrames.length;
    const frameIndex = frameCount > 0
      ? Math.min(frameCount - 1, Math.floor(wave.timer / motherslashWaveAnimationRate))
      : -1;
    const frame = frameIndex >= 0 ? assets.motherslashWaveFrames[frameIndex] : null;
    const fadeOut = progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1;
    const pulseAlpha = Math.max(0, Math.min(1, fadeOut)) * 0.88;

    ctx.save();
    ctx.globalAlpha = pulseAlpha;
    ctx.translate(wave.x, wave.y + 8);

    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = (radius * 2.06) / Math.max(bounds.w, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.shadowColor = "rgba(110, 255, 185, 0.62)";
      ctx.shadowBlur = 18;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.strokeStyle = "rgba(119, 255, 194, 0.82)";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius, radius * 0.42, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  });
}

function drawWarriorSkillEffects(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.rootbreakerShockwaves.forEach((wave) => {
    drawDirectionalEffect(
      ctx,
      wave.x,
      wave.y - 16,
      wave.timer,
      wave.duration,
      wave.direction,
      assets.rootbreakerShockwaveFrames,
      148,
      "rgba(135, 255, 107, 0.66)",
      () => drawFallbackSlashEffect(ctx, wave.direction, 128, "#9dff64"),
    );
  });

  state.combat.thornwallCounters.forEach((counter) => {
    drawDirectionalEffect(
      ctx,
      counter.x,
      counter.y - 22,
      counter.timer,
      counter.duration,
      counter.direction,
      assets.thornwallCounterFrames,
      190,
      "rgba(143, 255, 112, 0.72)",
      () => drawFallbackArcEffect(ctx, counter.direction, 138, "#7ee565"),
    );
  });

  state.combat.motherloadBreakers.forEach((breaker) => {
    drawDirectionalEffect(
      ctx,
      breaker.x,
      breaker.y - 20,
      breaker.timer,
      breaker.duration,
      breaker.direction,
      assets.motherloadBreakerFrames,
      breaker.empowered ? 220 : 176,
      breaker.empowered ? "rgba(255, 226, 98, 0.84)" : "rgba(122, 255, 159, 0.72)",
      () => drawFallbackSlashEffect(ctx, breaker.direction, breaker.empowered ? 176 : 138, breaker.empowered ? "#ffe262" : "#7aff9f"),
    );
  });

  state.combat.verdantGuillotines.forEach((guillotine) => {
    drawDirectionalEffect(
      ctx,
      guillotine.x,
      guillotine.y - 28,
      guillotine.timer,
      guillotine.duration,
      guillotine.direction,
      assets.verdantGuillotineFrames,
      194,
      "rgba(119, 255, 194, 0.78)",
      () => drawFallbackSlashEffect(ctx, guillotine.direction, 164, "#77ffc2"),
    );
  });
}

function drawDirectionalEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  timer: number,
  duration: number,
  direction: CardinalDirectionName,
  framesByDirection: Partial<Record<CardinalDirectionName, SpriteFrame[]>>,
  targetSize: number,
  glow: string,
  fallback: () => void,
) {
  const frames = framesByDirection[direction] ?? [];
  const progress = Math.min(timer / duration, 1);
  const fadeIn = Math.min(progress / 0.12, 1);
  const fadeOut = progress > 0.78 ? 1 - (progress - 0.78) / 0.22 : 1;
  const frameIndex = Math.min(frames.length - 1, Math.floor(timer / warriorSkillAnimationRate));
  const frame = frameIndex >= 0 ? frames[frameIndex] : null;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));
  ctx.translate(x, y);
  ctx.shadowColor = glow;
  ctx.shadowBlur = 18;

  if (frame) {
    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = targetSize / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;
    ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
  } else {
    fallback();
  }

  ctx.restore();
}

function drawFallbackSlashEffect(ctx: CanvasRenderingContext2D, direction: CardinalDirectionName, length: number, color: string) {
  const rotation = direction === "right"
    ? 0
    : direction === "left"
      ? Math.PI
      : direction === "up"
        ? -Math.PI / 2
        : Math.PI / 2;
  ctx.rotate(rotation);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-length * 0.45, 0);
  ctx.quadraticCurveTo(0, -24, length * 0.45, 0);
  ctx.stroke();
}

function drawFallbackArcEffect(ctx: CanvasRenderingContext2D, direction: CardinalDirectionName, radius: number, color: string) {
  const rotation = direction === "right"
    ? 0
    : direction === "left"
      ? Math.PI
      : direction === "up"
        ? -Math.PI / 2
        : Math.PI / 2;
  ctx.rotate(rotation);
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.45, -Math.PI * 0.35, Math.PI * 0.35);
  ctx.stroke();
}

function drawVerdantExplosions(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  if (assets.verdantExplosionFrames.length === 0) return;

  state.combat.verdantExplosions.forEach((explosion) => {
    if (explosion.timer < 0) return;

    const progress = Math.min(explosion.timer / explosion.duration, 1);
    const frameIndex = Math.min(
      assets.verdantExplosionFrames.length - 1,
      Math.floor(explosion.timer / verdantExplosionAnimationRate),
    );
    const frame = assets.verdantExplosionFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = 330 / Math.max(bounds.w, bounds.h, 1);
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h / 2;
    const fadeIn = Math.min(progress / 0.12, 1);
    const fadeOut = progress > 0.78 ? 1 - (progress - 0.78) / 0.22 : 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));
    ctx.shadowColor = "rgba(151, 255, 93, 0.62)";
    ctx.shadowBlur = 24;
    ctx.drawImage(
      frame.canvas,
      explosion.x - anchorX * scale,
      explosion.y - anchorY * scale,
      frame.w * scale,
      frame.h * scale,
    );
    ctx.restore();
  });
}

function drawWoundclockGroundEffects(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.woundclockSweeps.forEach((sweep) => {
    const progress = Math.min(sweep.timer / sweep.duration, 1);
    const angle = sweep.startAngle + (sweep.endAngle - sweep.startAngle) * progress;
    const alpha = progress < 0.12 ? progress / 0.12 : progress > 0.82 ? 1 - (progress - 0.82) / 0.18 : 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha) * 0.78;
    ctx.translate(sweep.x, sweep.y);
    ctx.rotate(angle);
    ctx.strokeStyle = "#8ceaff";
    ctx.lineWidth = sweep.width;
    ctx.lineCap = "round";
    ctx.shadowColor = "rgba(140, 234, 255, 0.72)";
    ctx.shadowBlur = 22;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(sweep.length, 0);
    ctx.stroke();
    ctx.strokeStyle = "#f4c86f";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(16, 0);
    ctx.lineTo(sweep.length, 0);
    ctx.stroke();
    ctx.restore();
  });

  state.combat.woundclockRifts.forEach((rift) => {
    if (rift.timer < rift.delay) {
      ctx.save();
      ctx.globalAlpha = 0.22 + Math.sin(performance.now() / 84) * 0.05;
      ctx.strokeStyle = "#8ceaff";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 7]);
      ctx.beginPath();
      ctx.ellipse(rift.x, rift.y, rift.radius, rift.radius * 0.54, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
      return;
    }

    const localTimer = rift.timer - rift.delay;
    const progress = Math.min(localTimer / rift.duration, 1);
    const frameIndex = Math.min(
      assets.woundclockRiftFrames.length - 1,
      Math.floor(localTimer / woundclockTrapAnimationRate),
    );
    const frame = assets.woundclockRiftFrames[frameIndex];

    ctx.save();
    ctx.globalAlpha = Math.max(0, 0.94 - progress * 0.34);
    ctx.translate(rift.x, rift.y - 10);
    if (frame) {
      const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
      const scale = (rift.radius * 2.18) / Math.max(bounds.w, bounds.h, 1);
      const anchorX = bounds.x + bounds.w / 2;
      const anchorY = bounds.y + bounds.h / 2;
      ctx.shadowColor = "rgba(140, 234, 255, 0.72)";
      ctx.shadowBlur = 24;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, frame.w * scale, frame.h * scale);
    } else {
      ctx.strokeStyle = "#8ceaff";
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.ellipse(0, 0, rift.radius, rift.radius * 0.54, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawMoonwellBeams(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  if (assets.moonwellBeamFrames.length === 0) return;

  state.combat.moonwellBeams.forEach((beam) => {
    if (beam.timer < 0) return;

    const progress = Math.min(beam.timer / beam.duration, 1);
    const frameIndex = Math.min(
      assets.moonwellBeamFrames.length - 1,
      Math.floor(beam.timer / moonwellBeamAnimationRate),
    );
    const frame = assets.moonwellBeamFrames[frameIndex];
    if (!frame) return;

    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = moonwellBeamFrameScale;
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h;
    const fadeIn = Math.min(progress / 0.1, 1);
    const fadeOut = progress > 0.84 ? 1 - (progress - 0.84) / 0.16 : 1;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));
    ctx.shadowColor = "rgba(205, 175, 255, 0.76)";
    ctx.shadowBlur = 26;
    ctx.drawImage(
      frame.canvas,
      beam.x - anchorX * scale,
      beam.y + 22 - anchorY * scale,
      frame.w * scale,
      frame.h * scale,
    );
    ctx.restore();
  });
}

function drawMoonBurstEffects(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  if (assets.moonBurstFrames.length === 0) return;

  state.combat.moonBurstEffects.forEach((burst) => {
    const frameIndex = Math.min(
      assets.moonBurstFrames.length - 1,
      Math.floor(burst.timer / moonBurstAnimationRate),
    );
    const frame = assets.moonBurstFrames[frameIndex];
    if (!frame) return;

    const progress = Math.min(burst.timer / burst.duration, 1);
    const fadeIn = Math.min(progress / 0.12, 1);
    const fadeOut = progress > 0.78 ? 1 - (progress - 0.78) / 0.22 : 1;
    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = moonBurstFrameScale;
    const anchorX = bounds.x + bounds.w / 2;
    const anchorY = bounds.y + bounds.h;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(fadeIn, fadeOut));
    ctx.shadowColor = "rgba(140, 215, 255, 0.72)";
    ctx.shadowBlur = 20;
    ctx.drawImage(
      frame.canvas,
      burst.x - anchorX * scale,
      burst.y + 18 - anchorY * scale,
      frame.w * scale,
      frame.h * scale,
    );
    ctx.restore();
  });
}

function drawMoonfallStrikes(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  state.combat.moonfallStrikes.forEach((strike) => {
    const progress = Math.min(strike.timer / strike.duration, 1);
    const eased = progress * progress * (3 - 2 * progress);
    const moonY = strike.startY + (strike.targetY - 38 - strike.startY) * eased;
    const impactProgress = strike.impacted ? Math.min((strike.timer - strike.duration * 0.78) / moonfallImpactDuration, 1) : 0;

    ctx.save();
    ctx.globalAlpha = 0.2 + progress * 0.34;
    ctx.strokeStyle = "#d9bbff";
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.ellipse(strike.x, strike.targetY + 8, strike.radius, strike.radius * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    if (impactProgress > 0) {
      ctx.save();
      ctx.globalAlpha = 1 - impactProgress;
      ctx.strokeStyle = "#fff0a8";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(strike.x, strike.targetY + 8, strike.radius * impactProgress, strike.radius * 0.38 * impactProgress, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (assets.moonfallFrames.length > 1) {
      const frameIndex = Math.min(assets.moonfallFrames.length - 1, Math.floor(progress * assets.moonfallFrames.length));
      const frame = assets.moonfallFrames[frameIndex];
      const scale = moonfallFrameScale;
      const width = frame.w * scale;
      const height = frame.h * scale;
      const anchorX = frame.w / 2;
      const anchorY = frame.h * 0.68;
      ctx.save();
      ctx.translate(strike.x, strike.targetY);
      ctx.shadowColor = "rgba(217, 187, 255, 0.82)";
      ctx.shadowBlur = 26;
      ctx.drawImage(frame.canvas, -anchorX * scale, -anchorY * scale, width, height);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(strike.x, moonY);
    ctx.rotate(-0.18 + progress * 0.46);
    if (assets.moonfallFrames[0]) {
      const frame = assets.moonfallFrames[0];
      const scale = ((150 + progress * 18) * 1.2) / Math.max(frame.w, 1);
      const width = frame.w * scale;
      const height = frame.h * scale;
      ctx.shadowColor = "rgba(217, 187, 255, 0.82)";
      ctx.shadowBlur = 26;
      ctx.drawImage(frame.canvas, -width / 2, -height / 2, width, height);
    } else {
      ctx.fillStyle = "#d9bbff";
      ctx.beginPath();
      ctx.arc(0, 0, 54, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets, player = state.player) {
  const visualLift = getPlayerVisualLift(player);
  drawShadow(
    ctx,
    player.x,
    player.y + 18,
    Math.max(32, 52 - visualLift * 0.22),
    Math.max(10, 20 - visualLift * 0.08),
    Math.max(0.18, 0.34 - visualLift * 0.003),
  );

  const frames = activePlayerSpriteSet(player.classId, assets)?.[player.direction][player.anim];
  const frame = frames?.[player.animFrame % frames.length];
  if (!frame) return;

  const layout = playerSpriteLayout(player, frame);
  const isActive = player.id === state.player.id;
  const isTargetable = !!state.party.pendingTargetedSpecial && player.lifeState === "alive";
  const flash = player.invulnerableTime > 0 && Math.floor(performance.now() / 75) % 2 === 0;

  ctx.save();
  ctx.globalAlpha = player.lifeState === "dead" ? 0.42 : flash ? 0.54 : 1;
  if (isActive || isTargetable) {
    ctx.strokeStyle = isTargetable
      ? characterClasses[player.classId].accent
      : "rgba(242, 211, 107, 0.72)";
    ctx.lineWidth = isTargetable ? 4 : 3;
    ctx.shadowColor = isTargetable ? characterClasses[player.classId].accent : "transparent";
    ctx.shadowBlur = isTargetable ? 18 : 0;
    ctx.beginPath();
    ctx.ellipse(player.x, player.y + 18, isTargetable ? 48 : 42, isTargetable ? 19 : 16, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.drawImage(frame.canvas, layout.drawX, layout.drawY, layout.width, layout.height);
  ctx.restore();
}

function playerSpriteLayout(player: PartyMemberState, frame: SpriteFrame) {
  const visualLift = getPlayerVisualLift(player);
  const drawProfile = getPlayerDrawProfile(player.classId, player.anim);
  const directionScale = getPlayerDirectionScale(player.classId, player.anim, player.direction);
  const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
  const normalizedScale = drawProfile.targetContentHeight
    ? drawProfile.targetContentHeight / Math.max(bounds.h, 1)
    : drawProfile.scale;
  const scale = Math.max(normalizedScale, drawProfile.minScale ?? 0) * directionScale;
  const width = frame.w * scale;
  const height = frame.h * scale;
  const anchorX = drawProfile.targetContentHeight ? bounds.x + bounds.w / 2 : drawProfile.anchorX;
  const anchorY = drawProfile.targetContentHeight ? bounds.y + bounds.h : drawProfile.anchorY;

  return {
    drawX: player.x - anchorX * scale,
    drawY: player.y + drawProfile.baselineOffset - anchorY * scale - visualLift,
    width,
    height,
  };
}

function drawPartyHealthBars(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  if (!state.ui.showPartyHealthBars) return;
  state.party.members.forEach((member) => drawPartyHealthBar(ctx, member, assets));
}

function drawPartyHealthBar(ctx: CanvasRenderingContext2D, member: PartyMemberState, assets: RenderAssets) {
  const frames = activePlayerSpriteSet(member.classId, assets)?.[member.direction][member.anim];
  const frame = frames?.[member.animFrame % frames.length];
  const fallbackTop = member.y - 138;
  const layout = frame ? playerSpriteLayout(member, frame) : null;
  const barWidth = 82;
  const barHeight = 9;
  const x = member.x - barWidth / 2;
  const y = (layout ? layout.drawY : fallbackTop) - 18;
  const healthRatio = Math.max(0, Math.min(1, member.health / Math.max(1, member.maxHealth)));
  const accent = characterClasses[member.classId].accent;

  ctx.save();
  ctx.globalAlpha = member.lifeState === "dead" ? 0.58 : 1;
  ctx.fillStyle = "rgba(4, 10, 9, 0.82)";
  ctx.strokeStyle = "rgba(255, 224, 138, 0.74)";
  ctx.lineWidth = 2;
  ctx.shadowColor = "rgba(0, 0, 0, 0.55)";
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(x - 3, y - 3, barWidth + 6, barHeight + 6, 5);
  ctx.fill();
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(47, 12, 14, 0.86)";
  ctx.fillRect(x, y, barWidth, barHeight);
  const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
  gradient.addColorStop(0, "#c7ffd0");
  gradient.addColorStop(0.55, accent);
  gradient.addColorStop(1, "#ffe08a");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, barWidth * healthRatio, barHeight);
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  ctx.fillRect(x, y, barWidth * healthRatio, 2);
  ctx.restore();
}

function getPlayerVisualLift(player: GameState["player"]) {
  if (player.classId !== "warrior") return 0;
  if (player.anim === "verdant_guillotine") {
    const liftByFrame = [0, 46, 76, 0];
    return liftByFrame[player.animFrame] ?? 0;
  }
  if (player.anim !== "front_flip_slash") return 0;
  const liftByFrame = [0, 24, 48, 64, 48, 26, 0, 0, 0];
  return liftByFrame[player.animFrame] ?? 0;
}

function drawCodger(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  const codger = state.intro.codger;
  drawShadow(ctx, codger.x, codger.y + 18, codgerSpriteDraw.shadowWidth, codgerSpriteDraw.shadowHeight, 0.32);

  const frame = assets.codgerIdleFrames[codger.animFrame % Math.max(assets.codgerIdleFrames.length, 1)];
  if (!frame) {
    ctx.save();
    ctx.fillStyle = "#7ea34a";
    ctx.strokeStyle = "#1f301d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(codger.x, codger.y - 58, 38, 76, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }

  const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
  const scale = codgerSpriteDraw.targetContentHeight / Math.max(bounds.h, 1);
  const anchorX = bounds.x + bounds.w / 2;
  const anchorY = bounds.y + bounds.h;
  ctx.drawImage(
    frame.canvas,
    codger.x - anchorX * scale,
    codger.y + codgerSpriteDraw.baselineOffset - anchorY * scale,
    frame.w * scale,
    frame.h * scale,
  );
}

function drawCodgerOverlay(ctx: CanvasRenderingContext2D, state: GameState) {
  if (!isIntroRoom(state)) return;
  const codger = state.intro.codger;

  if (canPlayerTalkToCodger(state) && codger.phase !== "readyForStairs") {
    drawWorldLabel(ctx, codger.x, codger.y + codgerSpriteDraw.talkOffsetY, "E", "Talk");
  }

  if (codger.dialogueText) {
    drawSpeechBubble(ctx, codger.x, codger.y + codgerSpriteDraw.speechOffsetY, codger.dialogueText);
  }
}

function drawWorldLabel(ctx: CanvasRenderingContext2D, x: number, y: number, key: string, label: string) {
  ctx.save();
  ctx.font = "600 26px Cinzel, Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const width = 132;
  const height = 42;
  ctx.fillStyle = "rgba(11, 18, 13, 0.78)";
  ctx.strokeStyle = "rgba(246, 229, 150, 0.78)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - height / 2, width, height, 12);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6e596";
  ctx.fillText(`${key}  ${label}`, x, y + 1);
  ctx.restore();
}

function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string) {
  const maxWidth = 520;
  const bubbleFont = "600 24px Cinzel, Georgia, serif";
  const lines = wrapCanvasText(ctx, text, maxWidth - 52, bubbleFont);
  const lineHeight = 31;
  ctx.save();
  ctx.font = bubbleFont;
  const width = Math.min(maxWidth, Math.max(300, Math.max(...lines.map((line) => ctx.measureText(line).width)) + 52));
  const height = lines.length * lineHeight + 42;
  const left = x - width / 2;
  const top = y - height;

  ctx.fillStyle = "rgba(245, 235, 204, 0.94)";
  ctx.strokeStyle = "rgba(69, 50, 24, 0.88)";
  ctx.lineWidth = 4;
  ctx.shadowColor = "rgba(0, 0, 0, 0.38)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(left, top, width, height, 18);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 20, top + height - 2);
  ctx.lineTo(x + 18, top + height - 2);
  ctx.lineTo(x - 4, top + height + 25);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#2d2414";
  ctx.font = bubbleFont;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  lines.forEach((line, index) => {
    ctx.fillText(line, x, top + 26 + index * lineHeight);
  });
  ctx.restore();
}

function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, font: string) {
  ctx.save();
  ctx.font = font;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  });

  if (current) lines.push(current);
  ctx.restore();
  return lines;
}

function activePlayerSpriteSet(classId: GameState["player"]["classId"], assets: RenderAssets) {
  return assets.playerSprites[classId] ?? assets.playerSprites.warrior ?? null;
}

function getPlayerDrawProfile(classId: GameState["player"]["classId"], animation: AnimationName): DrawProfile {
  if (classId === "mage") {
    if (animation === "dodge_roll") return purpleMageSpriteDraw.dodge;
    if (animation === "attack2") return purpleMageSpriteDraw.spinCast;
    if (animation === "attack1" || animation === "attack1_side_slash" || animation === "front_flip_slash") return purpleMageSpriteDraw.wideAction;
    return purpleMageSpriteDraw.standard;
  }

  if (classId === "cleric") {
    if (animation === "dodge_roll") return clericSpriteDraw.dodge;
    if (animation === "attack1" || animation === "attack1_side_slash" || animation === "attack2") return clericSpriteDraw.cast;
    return clericSpriteDraw.standard;
  }

  return animation === "attack1" || animation === "attack1_side_slash" || animation === "front_flip_slash"
    || animation === "rootbreaker_cleave" || animation === "thornwall_counter"
    || animation === "motherload_breaker" || animation === "verdant_guillotine" || animation === "attack2"
    ? warriorSpriteDraw.wideAction
    : warriorSpriteDraw.standard;
}

function getPlayerDirectionScale(classId: GameState["player"]["classId"], animation: AnimationName, direction: DirectionName) {
  if (classId === "mage") return 1;
  return 1;
}

function drawEnemy(ctx: CanvasRenderingContext2D, state: GameState, enemy: EnemyState, assets: RenderAssets, isTarget: boolean) {
  if (!enemy.visible) return;
  const isCorpse = enemy.state === "dead";
  const isLootCorpse = state.combat.lootCorpseId === enemy.instanceId && !!state.combat.droppedGear;
  const isHoveredLootCorpse = state.combat.hoveredLootCorpseId === enemy.instanceId;
  drawShadow(ctx, enemy.x, enemy.y + 20, isCorpse ? 76 : 96, isCorpse ? 24 : 34, isCorpse ? 0.24 : 0.4);
  if (isLootCorpse) drawLootableCorpseGlow(ctx, enemy, isHoveredLootCorpse);

  const frames = assets.monsterSprites[enemy.monsterId]?.[enemy.direction]?.[enemy.anim]
    ?? assets.monsterSprites.moss_golem?.[enemy.direction]?.[enemy.anim];
  const frame = frames?.[enemy.animFrame % frames.length];
  if (frame) {
    const drawProfile = getEnemyDrawProfile(enemy.monsterId, enemy.anim);
    const bounds = frame.bounds ?? { x: 0, y: 0, w: frame.w, h: frame.h };
    const scale = drawProfile.targetContentHeight
      ? drawProfile.targetContentHeight / Math.max(bounds.h, 1)
      : drawProfile.scale;
    const width = frame.w * scale;
    const height = frame.h * scale;
    const anchorX = drawProfile.targetContentHeight ? bounds.x + bounds.w / 2 : drawProfile.anchorX;
    const anchorY = drawProfile.targetContentHeight ? bounds.y + bounds.h : drawProfile.anchorY;
    const drawX = enemy.x - anchorX * scale;
    const drawY = enemy.y + drawProfile.baselineOffset - anchorY * scale;
    ctx.save();
    ctx.filter = enemy.flashTimer > 0 ? "brightness(1.55) saturate(1.35)" : "none";
    ctx.drawImage(frame.canvas, drawX, drawY, width, height);
    ctx.restore();
  } else {
    ctx.save();
    ctx.fillStyle = isCorpse ? "#574936" : "#5f7f45";
    ctx.strokeStyle = isTarget ? "#f2d36b" : "#24301e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y - 18, enemy.radius * 1.1, enemy.radius * 1.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  if (!isCorpse && state.combat.targetLocked && isTarget) {
    ctx.save();
    ctx.strokeStyle = "#f2d36b";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 12, 72, 40, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawLootableCorpseGlow(ctx: CanvasRenderingContext2D, enemy: EnemyState, hovered: boolean) {
  const pulse = (Math.sin(performance.now() / 260) + 1) * 0.5;
  const alpha = hovered ? 0.46 + pulse * 0.14 : 0.18 + pulse * 0.08;
  const radiusX = hovered ? 82 : 64;
  const radiusY = hovered ? 34 : 24;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const glow = ctx.createRadialGradient(enemy.x, enemy.y + 18, 4, enemy.x, enemy.y + 18, radiusX);
  glow.addColorStop(0, `rgba(255, 238, 150, ${alpha})`);
  glow.addColorStop(0.46, `rgba(178, 255, 104, ${alpha * 0.38})`);
  glow.addColorStop(1, "rgba(178, 255, 104, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.ellipse(enemy.x, enemy.y + 18, radiusX, radiusY, 0, 0, Math.PI * 2);
  ctx.fill();

  if (hovered) {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = "rgba(255, 238, 150, 0.86)";
    ctx.lineWidth = 2;
    ctx.setLineDash([7, 6]);
    ctx.beginPath();
    ctx.ellipse(enemy.x, enemy.y + 18, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRock(ctx: CanvasRenderingContext2D, obstacle: Obstacle, assets: RenderAssets) {
  const asset = assets.worldAssets[obstacle.asset];
  if (asset) {
    drawShadow(ctx, obstacle.x, obstacle.y + obstacle.ry * 0.55, obstacle.rx * 1.35, obstacle.ry * 0.72, 0.28);
    drawWorldAsset(ctx, assets, obstacle.asset, obstacle.x, obstacle.y + obstacle.ry, obstacle.scale);
    return;
  }

  drawShadow(ctx, obstacle.x, obstacle.y + obstacle.ry * 0.55, obstacle.rx * 1.4, obstacle.ry * 0.72, 0.3);

  ctx.save();
  ctx.translate(obstacle.x, obstacle.y);
  ctx.fillStyle = "#4e6041";
  ctx.strokeStyle = "#1c2a1e";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-obstacle.rx, -8);
  ctx.lineTo(-obstacle.rx * 0.4, -obstacle.ry);
  ctx.lineTo(obstacle.rx * 0.35, -obstacle.ry * 0.84);
  ctx.lineTo(obstacle.rx, -obstacle.ry * 0.14);
  ctx.lineTo(obstacle.rx * 0.64, obstacle.ry);
  ctx.lineTo(-obstacle.rx * 0.52, obstacle.ry * 0.82);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.moveTo(-obstacle.rx * 0.35, -obstacle.ry * 0.7);
  ctx.lineTo(obstacle.rx * 0.35, -obstacle.ry * 0.84);
  ctx.lineTo(obstacle.rx * 0.2, -obstacle.ry * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawWorldAsset(ctx: CanvasRenderingContext2D, assets: RenderAssets, assetName: WorldAssetName, x: number, y: number, scale: number) {
  const asset = assets.worldAssets[assetName];
  if (!asset) return;

  const width = asset.w * scale;
  const height = asset.h * scale;
  const shouldShadow = assetName !== "grassTile" && assetName !== "mossTile" && assetName !== "waterTile" && assetName !== "stoneTile";

  if (shouldShadow) {
    drawShadow(ctx, x, y - Math.min(12, height * 0.08), Math.max(18, width * 0.34), Math.max(8, height * 0.1), 0.22);
  }

  ctx.drawImage(asset.canvas, x - width / 2, y - height, width, height);
}

function drawLoot(ctx: CanvasRenderingContext2D, state: GameState, assets: RenderAssets) {
  if (!state.combat.droppedGear) return;
  const corpse = lootCorpse(state);
  if (corpse) {
    const hovered = state.combat.hoveredLootCorpseId === corpse.instanceId;
    const pulse = (Math.sin(performance.now() / 240) + 1) * 0.5;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(255, 238, 150, ${hovered ? 0.72 : 0.42 + pulse * 0.18})`;
    ctx.beginPath();
    ctx.arc(corpse.x + 34, corpse.y - 32 - pulse * 5, hovered ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  const x = state.enemy.x + 42;
  const y = state.enemy.y + 28;
  if (assets.worldAssets.coin) {
    drawWorldAsset(ctx, assets, "coin", x, y + 16, 1.05);
    return;
  }

  ctx.save();
  ctx.fillStyle = "#f2d36b";
  ctx.strokeStyle = "#513812";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x - 16, y - 12, 32, 24, 4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawFloatingCombatTexts(ctx: CanvasRenderingContext2D, state: GameState) {
  state.combat.floatingCombatTexts.forEach((text) => {
    const progress = Math.min(text.timer / text.duration, 1);
    const eased = 1 - (1 - progress) * (1 - progress);
    const rise = eased * 56;
    const drift = text.driftX * Math.sin(progress * Math.PI) * 0.65;
    const scale = 1 + Math.sin(progress * Math.PI) * 0.18;
    const alpha = progress < 0.18 ? progress / 0.18 : progress > 0.72 ? 1 - (progress - 0.72) / 0.28 : 1;
    const label = String(text.value);

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(text.x + drift, text.y - rise);
    ctx.scale(scale, scale);
    ctx.font = "900 30px Cinzel, Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 7;
    ctx.strokeStyle = "rgba(45, 23, 8, 0.92)";
    ctx.shadowColor = "rgba(255, 224, 138, 0.64)";
    ctx.shadowBlur = 12;
    ctx.strokeText(label, 0, 0);
    ctx.fillStyle = "#fff0a8";
    ctx.fillText(label, 0, 0);
    ctx.shadowBlur = 0;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
    ctx.strokeText(label, 0, 0);
    ctx.restore();
  });
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, alpha: number) {
  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
