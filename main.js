const rooms = [
  { name: 'Main room', image: 'assets/gallery-middle.webp' },
  { name: 'Right room', image: 'assets/gallery-alcove.webp' },
  { name: 'Left room', image: 'assets/gallery-entrance.webp' },
];
const stops = rooms.flatMap((room, roomIndex) => ['left', 'middle', 'right'].map((position, positionIndex) => ({
  id: `room-${roomIndex}-${position}`, name: room.name, image: room.image, positionIndex,
})));
const artworks = {
  arcade: { title: 'Light through the arcade', description: 'A study of repetition, shadow, and a long view.', image: 'assets/artwork-arcade.webp', alt: 'Black-and-white photograph of repeating stone arches' },
  staircase: { title: 'The turning stair', description: 'A spiral of stone and light seen from below.', image: 'assets/artwork-staircase.webp', alt: 'Black-and-white photograph of a spiral staircase' },
};
const cover = document.querySelector('#cover');
const shell = document.querySelector('#tour');
const fallback = document.querySelector('#tour-fallback');
const dialog = document.querySelector('#art-dialog');
const roomName = document.querySelector('#room-name');
const backButton = document.querySelector('#move-back');
const forwardButton = document.querySelector('#move-forward');
let viewer;
let tour;
let activeIndex = 0;

function openArt(id) {
  const art = artworks[id];
  if (!art) return;
  const image = document.querySelector('#art-image');
  image.src = art.image;
  image.alt = art.alt;
  dialog.showModal();
}

function syncStop(id) {
  const index = stops.findIndex(stop => stop.id === id);
  if (index < 0) return;
  activeIndex = index;
  const stop = stops[index];
  roomName.textContent = `${stop.name} · ${stop.positionIndex + 1}/3`;
  fallback.style.backgroundImage = `url('${stop.image}')`;
  backButton.disabled = index === 0;
  forwardButton.disabled = index === stops.length - 1;
}

function move(direction) {
  const stop = stops[activeIndex + direction];
  if (stop && tour) tour.setCurrentNode(stop.id);
}

function look(direction) {
  if (!viewer) return;
  const position = viewer.getPosition();
  viewer.animate({ yaw: position.yaw + direction * Math.PI / 5, pitch: position.pitch, speed: '10rpm' });
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
backButton.addEventListener('click', () => move(-1));
forwardButton.addEventListener('click', () => move(1));
document.querySelector('#zoom-in').addEventListener('click', () => viewer?.zoom(viewer.getZoomLevel() + 15));
document.querySelector('#zoom-out').addEventListener('click', () => viewer?.zoom(viewer.getZoomLevel() - 15));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && !shell.hidden) exitTour(); });
document.addEventListener('keydown', event => {
  if (shell.hidden || dialog.open) return;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') look(-1);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') look(1);
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') move(1);
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') move(-1);
});
syncStop(stops[0].id);

const markerPositions = [
  { textureX: 130, textureY: 455 },
  { textureX: 890, textureY: 475 },
  { textureX: 1550, textureY: 455 },
];
const nodes = stops.map((stop, index) => ({
  id: stop.id,
  name: stop.name,
  panorama: stop.image,
  links: [
    ...(index ? [{ nodeId: stops[index - 1].id, position: { textureX: 1380, textureY: 555 } }] : []),
    ...(index < stops.length - 1 ? [{ nodeId: stops[index + 1].id, position: { textureX: 350, textureY: 555 } }] : []),
  ],
  markers: markerPositions.map((position, markerIndex) => ({
    id: `${stop.id}-art-${markerIndex}`,
    html: '<span class="art-hotspot" role="button" aria-label="Open photograph"></span>',
    size: { width: 120, height: 150 },
    position,
    data: { art: markerIndex % 2 ? 'staircase' : 'arcade' },
  })),
}));

try {
  const [{ Viewer }, { VirtualTourPlugin }, { MarkersPlugin }] = await Promise.all([
    import('@photo-sphere-viewer/core'),
    import('@photo-sphere-viewer/virtual-tour-plugin'),
    import('@photo-sphere-viewer/markers-plugin'),
  ]);
  viewer = new Viewer({
    container: document.querySelector('#viewer'), navbar: false, defaultZoomLvl: 20,
    minFov: 30, maxFov: 100, moveSpeed: 1.35, zoomSpeed: 1.5,
    mousewheel: true, mousemove: true, keyboard: 'always',
    plugins: [
      MarkersPlugin.withConfig({ defaultHoverScale: { amount: 1.04, duration: 100 } }),
      VirtualTourPlugin.withConfig({
        startNodeId: stops[0].id,
        transitionOptions: { showLoader: true, speed: '18rpm', effect: 'fade', rotation: true },
        nodes,
      }),
    ],
  });
  tour = viewer.getPlugin(VirtualTourPlugin);
  viewer.getPlugin(MarkersPlugin).addEventListener('select-marker', ({ marker }) => openArt(marker.data.art));
  tour.addEventListener('node-changed', ({ node }) => syncStop(node.id));
  viewer.addEventListener('ready', () => shell.classList.add('viewer-ready'));
} catch (error) {
  console.error('360 viewer could not load.', error);
}
