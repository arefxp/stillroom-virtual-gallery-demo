// Texture coordinates are pixels on the 1774×887 panorama files.
const PANO_WIDTH = 1774;
const rect = (x1, y1, x2, y2) => [
  { textureX: x1, textureY: y1 }, { textureX: x2, textureY: y1 },
  { textureX: x2, textureY: y2 }, { textureX: x1, textureY: y2 },
];
const yawOf = x => (x / PANO_WIDTH) * 2 * Math.PI - Math.PI;
const art = (box, image, title, description) => ({ box, image, title, description });

const rooms = {
  entrance: {
    name: 'Entrance hall',
    image: 'assets/gallery-entrance.webp',
    doors: [
      { to: 'left', box: [300, 315, 395, 505] },
      { to: 'right', box: [1380, 315, 1475, 505] },
    ],
    art: [
      art([32, 292, 167, 507], 'assets/art-entrance-1.webp', 'Long arcade', 'Light falls in measured bands along a vaulted walk.'),
      art([500, 320, 625, 484], 'assets/art-entrance-2.webp', 'Nautilus stair', 'A stair curling inward like a shell.'),
      art([770, 310, 1008, 490], 'assets/art-entrance-3.webp', 'The great hall', 'A colonnaded hall leading to a single bright door.'),
      art([1155, 322, 1268, 480], 'assets/art-entrance-4.webp', 'Edge of shadow', 'A clean wall cutting the sky in two.'),
      art([1603, 292, 1750, 497], 'assets/art-entrance-5.webp', 'Colonnade', 'Columns turning a corner in late light.'),
    ],
  },
  left: {
    name: 'Left gallery',
    image: 'assets/gallery-middle.webp',
    doors: [{ to: 'entrance', box: [1175, 300, 1340, 550] }],
    art: [
      art([38, 250, 256, 537], 'assets/art-middle-1.webp', 'Under the oculus', 'A spiral stair rising toward a round skylight.'),
      art([447, 346, 549, 478], 'assets/art-middle-2.webp', 'Corridor of light', 'Sun and shadow striping a long colonnade.'),
      art([777, 297, 985, 500], 'assets/art-middle-3.webp', 'Dome through the arch', 'A domed building framed by a stone arch.'),
      art([1540, 250, 1733, 520], 'assets/art-middle-4.webp', 'Ribs', 'Vault ribs meeting overhead.'),
    ],
  },
  right: {
    name: 'Right gallery',
    image: 'assets/gallery-alcove.webp',
    doors: [{ to: 'entrance', box: [330, 285, 520, 560] }],
    art: [
      art([36, 250, 207, 530], 'assets/art-alcove-1.webp', 'Columns at noon', 'Hard light through a line of columns.'),
      art([731, 247, 1042, 520], 'assets/art-alcove-2.webp', 'The turning stair', 'A spiral of stone and light seen from above.'),
      art([1557, 250, 1736, 535], 'assets/art-alcove-3.webp', 'Ribs', 'Vault ribs meeting overhead.'),
    ],
  },
};

const STEPS = 2; // forward steps before reaching a doorway
const BASE_ZOOM = 20;
const STEP_ZOOM = 28;

const cover = document.querySelector('#cover');
const shell = document.querySelector('#tour');
const fallback = document.querySelector('#tour-fallback');
const dialog = document.querySelector('#art-dialog');
const dialogImage = document.querySelector('#art-image');
const roomName = document.querySelector('#room-name');
let viewer;
let markers;
let current = 'entrance';
let step = 0;
let busy = false;

function openArt(item) {
  dialogImage.src = item.image;
  dialogImage.alt = item.title;
  document.querySelector('#art-title').textContent = item.title;
  document.querySelector('#art-description').textContent = item.description;
  dialog.showModal();
}

function angleDiff(a, b) {
  return Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
}

function doorAhead() {
  const yaw = viewer.getPosition().yaw;
  return rooms[current].doors.find(door => angleDiff(yaw, doorYaw(door)) < 0.8);
}

const doorYaw = door => yawOf((door.box[0] + door.box[2]) / 2);

function setMarkers() {
  const room = rooms[current];
  const hit = { fill: 'rgba(0,0,0,0)', stroke: 'none' };
  markers.setMarkers([
    ...room.art.map((item, i) => ({ id: `art-${i}`, polygon: rect(...item.box), svgStyle: hit, data: { art: item } })),
    ...room.doors.map((door, i) => ({ id: `door-${i}`, polygon: rect(...door.box), svgStyle: hit, data: { door } })),
    // Street View–style arrow on the floor, in the direction of each doorway.
    ...room.doors.map((door, i) => ({
      id: `arrow-${i}`,
      position: { yaw: doorYaw(door), pitch: -0.38 },
      html: `<button class="floor-arrow" type="button" aria-label="Walk to ${rooms[door.to].name}"><svg viewBox="0 0 100 70" aria-hidden="true"><path d="M10 62 50 18l40 44" /></svg><span>${rooms[door.to].name}</span></button>`,
      size: { width: 150, height: 120 },
      anchor: 'center center',
      data: { door },
    })),
  ]);
}

// Walk-through: push into the doorway, cross-fade into the next room while
// still zoomed in, then ease back out as if you just stepped inside.
async function goTo(id, door) {
  if (!viewer || busy || id === current) return;
  busy = true;
  shell.classList.add('moving');
  markers.clearMarkers();
  try {
    const { yaw } = viewer.getPosition();
    await viewer.animate({ yaw: door ? doorYaw(door) : yaw, pitch: 0, zoom: 92, speed: 1100, easing: 'inQuad' });
    current = id;
    step = 0;
    roomName.textContent = rooms[id].name;
    fallback.style.backgroundImage = `url('${rooms[id].image}')`;
    await viewer.setPanorama(rooms[id].image, {
      position: { yaw: 0, pitch: 0 }, zoom: 80, showLoader: false,
      transition: { speed: 450, rotation: false },
    });
    shell.classList.remove('moving');
    await viewer.animate({ zoom: BASE_ZOOM, speed: 1300, easing: 'outQuad' });
    setMarkers();
  } finally {
    shell.classList.remove('moving');
    busy = false;
  }
}

function walk(direction) {
  if (!viewer || busy) return;
  const door = doorAhead();
  if (direction > 0 && step >= STEPS && door) return goTo(door.to, door);
  if (direction < 0 && step === 0) {
    if (current !== 'entrance') goTo('entrance', rooms[current].doors[0]);
    return;
  }
  step = Math.max(0, Math.min(STEPS, step + direction));
  const target = { zoom: BASE_ZOOM + step * STEP_ZOOM, speed: '8rpm' };
  if (direction > 0 && door) Object.assign(target, { yaw: doorYaw(door), pitch: 0 });
  viewer.animate(target);
}

function look(direction) {
  if (!viewer) return;
  const { yaw, pitch } = viewer.getPosition();
  viewer.animate({ yaw: yaw + direction * Math.PI / 5, pitch, speed: '10rpm' });
}

async function enterTour() {
  cover.hidden = true;
  shell.hidden = false;
  if (shell.requestFullscreen) await shell.requestFullscreen().catch(() => {});
}

async function exitTour() {
  if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
  shell.hidden = true;
  cover.hidden = false;
}

document.querySelector('#enter-tour').addEventListener('click', enterTour);
document.querySelector('#exit-tour').addEventListener('click', exitTour);
document.querySelector('#look-left').addEventListener('click', () => look(-1));
document.querySelector('#look-right').addEventListener('click', () => look(1));
document.querySelector('#move-back').addEventListener('click', () => walk(-1));
document.querySelector('#move-forward').addEventListener('click', () => walk(1));
document.querySelectorAll('[data-room]').forEach(button => button.addEventListener('click', () => goTo(button.dataset.room)));
document.querySelector('#zoom-in').addEventListener('click', () => viewer?.zoom(viewer.getZoomLevel() + 15));
document.querySelector('#zoom-out').addEventListener('click', () => viewer?.zoom(viewer.getZoomLevel() - 15));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !shell.hidden) exitTour(); });
document.addEventListener('keydown', event => {
  if (shell.hidden || dialog.open) return;
  const key = event.key.toLowerCase();
  if (key === 'arrowleft' || key === 'a') look(-1);
  if (key === 'arrowright' || key === 'd') look(1);
  if (key === 'arrowup' || key === 'w') walk(1);
  if (key === 'arrowdown' || key === 's') walk(-1);
});
roomName.textContent = rooms[current].name;
Object.values(rooms).forEach(room => { new Image().src = room.image; }); // warm the cache so transitions don't stall

try {
  const [{ Viewer }, { MarkersPlugin }] = await Promise.all([
    import('@photo-sphere-viewer/core'),
    import('@photo-sphere-viewer/markers-plugin'),
  ]);
  viewer = new Viewer({
    container: document.querySelector('#viewer'), navbar: false, defaultZoomLvl: BASE_ZOOM,
    panorama: rooms.entrance.image,
    minFov: 30, maxFov: 100, moveSpeed: 1.35, zoomSpeed: 1.5,
    mousewheel: true, mousemove: true, keyboard: false,
    plugins: [MarkersPlugin],
  });
  markers = viewer.getPlugin(MarkersPlugin);
  markers.addEventListener('select-marker', ({ marker }) => {
    if (marker.data.art) openArt(marker.data.art);
    else if (marker.data.door) goTo(marker.data.door.to, marker.data.door);
  });
  viewer.addEventListener('ready', () => {
    setMarkers();
    shell.classList.add('viewer-ready');
  }, { once: true });
} catch (error) {
  console.error('360 viewer could not load.', error);
}
