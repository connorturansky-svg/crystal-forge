# Crystal Forge — Browser Milestone 1

An experimental parametric crystal cluster generator, running entirely in the browser. No Python, installation or backend.

## Use
Open the GitHub Pages website, choose formation settings, inspect the 3D model and download an STL.

## Hosting
The repository includes a GitHub Actions Pages deployment workflow. Under **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. The workflow deploys whenever changes are pushed to main.

## Limitations
This is a geometry proof of concept, not a validated production fabrication tool. The generated STL has not been checked for watertightness, exact wall thickness, supportless printing or physical fit. Inspect every file in Cura. No LED sockets, individual transforms or 3MF yet.

Three.js currently loads from jsDelivr, so an internet connection is needed.