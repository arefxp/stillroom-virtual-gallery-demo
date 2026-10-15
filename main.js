const rooms = [
  { id: 'entrance', name: 'Entrance', image: 'assets/gallery-entrance.webp' },
  { id: 'middle', name: 'Main room', image: 'assets/gallery-middle.webp' },
  { id: 'alcove', name: 'Final room', image: 'assets/gallery-alcove.webp' },
];
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
  document.querySelector('#art-title').textContent = art.title;
  document.querySelector('#art-description').textContent = art.description;
  const image = document.querySelector('#art-image');
  image.src = art.image;
  image.alt = art.alt;
  dialog.showModal();
}

function syncRoom(id) {
  const index = rooms.findIndex(room => room.id === id);
  if (index < 0) return;
  activeIndex = index;
  roomName.textContent = rooms[index].name;
  fallback.style.backgroundImage = `url('${rooms[index].image}')`;
  backButton.disabled = index === 0;
  forwardButton.disabled = index === rooms.length - 1;
}

function moveRoom(direction) {
  const room = rooms[activeIndex + direction];
  if (room && tour) tour.setCurrentNode(room.id);
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
backButton.addEventListener('click', () => moveRoom(-1));
forwardButton.addEventListener('click', () => moveRoom(1));
document.querySelector('#zoom-in').addEventListener('click', () => viewer?.zoom(viewer.getZoomLevel() + 15));
document.querySelector('#zoom-out').addEventListener('click', () => viewer?.zoom(viewer.getZoomLevel() - 15));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && !shell.hidden) exitTour();
});
document.addEventListener('keydown', event => {
  if (shell.hidden || dialog.open) return;
  if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') look(-1);
  if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') look(1);
  if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') moveRoom(1);
  if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') moveRoom(-1);
});
syncRoom('entrance');

try {
  const [{ Viewer }, { VirtualTourPlugin }, { MarkersPlugin }] = await Promise.all([
    import('@photo-sphere-viewer/core'),
    import('@photo-sphere-viewer/virtual-tour-plugin'),
    import('@photo-sphere-viewer/markers-plugin'),
  ]);
  viewer = new Viewer({
    container: document.querySelector('#viewer'),
    navbar: false,
    defaultZoomLvl: 20,
    minFov: 30,
    maxFov: 100,
    moveSpeed: 1.35,
    zoomSpeed: 1.5,
    mousewheel: true,
    mousemove: true,
    keyboard: 'always',
    plugins: [
      MarkersPlugin.withConfig({ defaultHoverScale: { amount: 1.15, duration: 120 } }),
      VirtualTourPlugin.withConfig({
        startNodeId: 'entrance',
        transitionOptions: { showLoader: true, speed: '18rpm', effect: 'fade', rotation: true },
        nodes: [
          { id: 'entrance', name: 'Entrance', panorama: rooms[0].image, links: [
            { nodeId: 'middle', position: { textureX: 350, textureY: 555 } },
          ], markers: [
            { id: 'entrance-arcade', html: '<span class="art-marker">Enlarge photograph</span>', size: { width: 156, height: 42 }, position: { textureX: 880, textureY: 480 }, data: { art: 'arcade' } },
          ] },
          { id: 'middle', name: 'Main room', panorama: rooms[1].image, links: [
            { nodeId: 'entrance', position: { textureX: 1380, textureY: 555 } },
            { nodeId: 'alcove', position: { textureX: 485, textureY: 555 } },
          ], markers: [
            { id: 'middle-arcade', html: '<span class="art-marker">Enlarge photograph</span>', size: { width: 156, height: 42 }, position: { textureX: 890, textureY: 480 }, data: { art: 'arcade' } },
            { id: 'middle-stair', html: '<span class="art-marker">Enlarge photograph</span>', size: { width: 156, height: 42 }, position: { textureX: 130, textureY: 460 }, data: { art: 'staircase' } },
          ] },
          { id: 'alcove', name: 'Final room', panorama: rooms[2].image, links: [
            { nodeId: 'middle', position: { textureX: 425, textureY: 555 } },
          ], markers: [
            { id: 'alcove-stair', html: '<span class="art-marker">Enlarge photograph</span>', size: { width: 156, height: 42 }, position: { textureX: 895, textureY: 475 }, data: { art: 'staircase' } },
            { id: 'alcove-arcade', html: '<span class="art-marker">Enlarge photograph</span>', size: { width: 156, height: 42 }, position: { textureX: 130, textureY: 455 }, data: { art: 'arcade' } },
          ] },
        ],
      }),
    ],
  });
  tour = viewer.getPlugin(VirtualTourPlugin);
  viewer.getPlugin(MarkersPlugin).addEventListener('select-marker', ({ marker }) => openArt(marker.data.art));
  tour.addEventListener('node-changed', ({ node }) => syncRoom(node.id));
  viewer.addEventListener('ready', () => shell.classList.add('viewer-ready'));
} catch (error) {
  document.querySelector('#tour-help').textContent = 'The 360° viewer could not load. Check your internet connection.';
  console.error('360 viewer could not load.', error);
}
