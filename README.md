# ImageOptim Sketch plugin

A Plugin for Sketch that compresses exported images using [ImageOptim](https://imageoptim.com/mac).

## Installation

- [Download and open ImageOptim.app](https://imageoptim.com/mac).
- [Download and open this plugin](dist/ImageOptim.sketchplugin.zip).
- Double click `ImageOptim.sketchplugin` to install the plugin.

## Usage

The Plugin uses two methods for asset compression:

- Automatically, whenever you export an asset from Sketch using the <samp>File › Export…</samp> menu option or the <samp>Export</samp> button in the toolbar.

- When you choose the <samp>Plugins › Sketch Image Compressor › Export and Optimize All Assets…</samp> menu option. You'll be asked for a path where your assets will be exported, and then the plugin will export *every exportable layer* from your document, and run the assets through ImageOptim.

Please note that both methods won't block Sketch's UI when running, so you'll be able to keep on working while the compressors run. Compression will be done in a separate ImageOptim app. You can switch to the ImageOptim app to see progress and compression results.

## Acknowledgements

Thanks to Ale Muñoz for creating ImageOptim-inspired plugin, which this plugin is based on. We've come a full circle :)

## LICENSE

MIT
