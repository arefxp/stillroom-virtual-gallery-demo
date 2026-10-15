# Stillroom virtual gallery demo

A small, fictional photography exhibition that demonstrates three linked 360° rooms: an entrance hall that branches into a left and a right gallery. Visitors step forward toward a doorway (two steps, then through it), step back to return, and click any framed photograph on the wall to open it in a lightbox. All images were generated for this demo; this is not a real exhibition or a reconstruction of a client gallery.

## Preview

Serve this folder with any static web server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`. The 360 viewer loads Photo Sphere Viewer from jsDelivr. 

## Publish on GitHub Pages

Put the contents of this folder in a public repository. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. The site address will be `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

## Replace for a real exhibition

Replace the panorama files in `assets/`. In `main.js`, each room lists its `doors` and `art` as pixel boxes on its panorama; update those boxes, and point each artwork at its high-resolution file and caption. The current `art-*.webp` files are crops of the placeholder panoramas, so they are low-resolution. Panoramas must be 2:1 equirectangular 360° photos for a true look-around view.
