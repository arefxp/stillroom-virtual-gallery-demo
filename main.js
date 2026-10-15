const rooms = [
  { id: 'entrance', name: 'Entrance', image: 'assets/gallery-entrance.webp', art: 'arcade' },
  { id: 'middle', name: 'Main room', image: 'assets/gallery-middle.webp', art: 'arcade' },
  { id: 'alcove', name: 'Final room', image: 'assets/gallery-alcove.webp', art: 'staircase' },
];
const artworks = {
  arcade: { title: 'Light through the arcade', description: 'A study of repetition, shadow, and a long view.', image: 'assets/artwork-arcade.webp', alt: 'Black-and-white photograph of repeating stone arches' },
  staircase: { title: 'The turning stair', description: 'A spiral of stone and light seen from below.', image: 'assets/artwork-staircase.webp', alt: 'Black-and-white photograph of a spiral staircase' },
};
const shell = document.querySelector('#tour-shell');
const fallback = document.querySelector('#tour-fallback');
const roomName = document.querySelector('#room-name');
const roomButtons = [...document.querySelectorAll('[data-room]')];
const dialog = document.querySelector('#art-dialog');
let activeRoom = rooms[0];
let tour = null;

function setRoom(id, fromViewer = false) {
  const next = rooms.find(room => room.id === id);
  if (!next) return;
  activeRoom = next;
  roomName.textContent = next.name;
  fallback.style.backgroundImage = `url('${next.image}')`;
  fallback.setAttribute('aria-label', `View of the sample gallery ${next.name.toLowerCase()}`);
  roomButtons.forEach(button => {
    const current = button.dataset.room === id;
    button.classList.toggle('active', current);
    if (current) button.setAttribute('aria-current', 'true');
    else button.removeAttribute('aria-current');
  });
  const index = rooms.indexOf(next);
  document.querySelector('#previous-room').disabled = index === 0;
  document.querySelector('#next-room').disabled = index === rooms.length - 1;
  if (tour && !fromViewer) tour.setCurrentNode(id);
}

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

roomButtons.forEach(button => button.addEventListener('click', () => setRoom(button.dataset.room)));
document.querySelector('#previous-room').addEventListener('click', () => setRoom(rooms[rooms.indexOf(activeRoom) - 1]?.id));
document.querySelector('#next-room').addEventListener('click', () => setRoom(rooms[rooms.indexOf(activeRoom) + 1]?.id));
document.querySelector('#view-art').addEventListener('click', () => openArt(activeRoom.art));
document.querySelectorAll('[data-art]').forEach(button => button.addEventListener('click', () => openArt(button.dataset.art)));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
setRoom('entrance');

if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const reveal = new IntersectionObserver((entries, observer) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) return;
      target.animate([
        { opacity: 0, transform: 'translateY(22px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: 580, easing: 'ease-out' });
      observer.unobserve(target);
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.section-intro > *, .works-copy > *, .work, .about-section > *, .footer-top > *').forEach(element => reveal.observe(element));
}

try {
  const [{ Viewer }, { VirtualTourPlugin }, { MarkersPlugin }] = await Promise.all([
    import('@photo-sphere-viewer/core'),
    import('@photo-sphere-viewer/virtual-tour-plugin'),
    import('@photo-sphere-viewer/markers-plugin'),
  ]);
  const viewer = new Viewer({
    container: document.querySelector('#viewer'),
    navbar: false,
    loadingImg: 'assets/artwork-arcade.webp',
    defaultZoomLvl: 25,
    moveSpeed: 1.1,
    mousewheel: false,
    plugins: [
      MarkersPlugin,
      VirtualTourPlugin.withConfig({
        startNodeId: 'entrance',
        nodes: [
          { id: 'entrance', name: 'Entrance', panorama: rooms[0].image, links: [
            { nodeId: 'middle', position: { textureX: 350, textureY: 495 } },
          ], markers: [
            { id: 'entrance-art', html: '<span class="art-marker">View photograph ↗</span>', size: { width: 150, height: 42 }, position: { textureX: 880, textureY: 515 }, data: { art: 'arcade' } },
          ] },
          { id: 'middle', name: 'Main room', panorama: rooms[1].image, links: [
            { nodeId: 'entrance', position: { textureX: 1380, textureY: 490 } },
            { nodeId: 'alcove', position: { textureX: 485, textureY: 505 } },
          ], markers: [
            { id: 'middle-art', html: '<span class="art-marker">View photograph ↗</span>', size: { width: 150, height: 42 }, position: { textureX: 890, textureY: 510 }, data: { art: 'arcade' } },
          ] },
          { id: 'alcove', name: 'Final room', panorama: rooms[2].image, links: [
            { nodeId: 'middle', position: { textureX: 425, textureY: 475 } },
          ], markers: [
            { id: 'alcove-art', html: '<span class="art-marker">View photograph ↗</span>', size: { width: 150, height: 42 }, position: { textureX: 895, textureY: 515 }, data: { art: 'staircase' } },
          ] },
        ],
      }),
    ],
  });
  tour = viewer.getPlugin(VirtualTourPlugin);
  viewer.getPlugin(MarkersPlugin).addEventListener('select-marker', ({ marker }) => openArt(marker.data.art));
  tour.addEventListener('node-changed', ({ node }) => setRoom(node.id, true));
  viewer.addEventListener('ready', () => { shell.classList.add('viewer-ready'); document.querySelector('#tour-hint').textContent = 'Drag to turn the view'; });
} catch (error) {
  document.querySelector('#tour-hint').textContent = 'Choose a room below to explore';
  console.error('360 viewer could not load; room navigation remains available.', error);
}
