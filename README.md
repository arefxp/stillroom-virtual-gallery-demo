# Stillroom virtual gallery demo

A small, fictional photography exhibition that demonstrates three linked 360° viewpoints and artwork details. All images were generated for this demo; this is not a real exhibition or a reconstruction of a client gallery.

## Preview

Serve this folder with any static web server, for example `python3 -m http.server 8000`, then open `http://localhost:8000`. The 360 viewer loads Photo Sphere Viewer from jsDelivr. If that library is unavailable, the room buttons still switch between sample images.

## Publish on GitHub Pages

Put the contents of this folder in a public repository. In **Settings → Pages**, choose **Deploy from a branch**, select `main` and `/ (root)`, then save. The site address will be `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

## Replace for a real exhibition

Replace the three panorama files in `assets/`, edit the room links and marker positions in `main.js`, and replace the sample artwork files and copy. Panoramas must be 2:1 equirectangular 360° photos for a true look-around view.
