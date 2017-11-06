
function showMessage(txt){
  NSApplication.sharedApplication().orderedDocuments().firstObject().displayMessage(txt)
}

function runImageOptim(context, files, hidden) {
  if (!files.length) return;

  const workspace = NSWorkspace.sharedWorkspace();
  const bundleIdentifier = "net.pornel.ImageOptim";
  const appURL = workspace.URLForApplicationWithBundleIdentifier(bundleIdentifier);
  if (!appURL) {
    showMessage("ImageOptim not installed");
    workspace.openURL(NSURL.URLWithString("https://imageoptim.com/mac?sketch"));
    return;
  }

  let flags = NSWorkspaceLaunchWithoutAddingToRecents | NSWorkspaceLaunchAsync;
  if (hidden) {
    flags = flags | NSWorkspaceLaunchWithoutActivation | NSWorkspaceLaunchAndHide;
  }

  workspace.openURLs_withAppBundleIdentifier_options_additionalEventParamDescriptor_launchIdentifiers_(
    files, bundleIdentifier, flags, null, null);
}

function getURLsToCompress(exportedAssets){
  const urlsToCompress = []
  for(let i=0; i < exportedAssets.count(); i++) {
    const asset = exportedAssets.objectAtIndex(i)
    if (NSFileManager.defaultManager().fileExistsAtPath(asset.path)) {
      urlsToCompress.push(NSURL.fileURLWithPath(asset.path));
    }
  }
  return urlsToCompress
}
function openFileDialog(path){
  const openDlg = NSOpenPanel.openPanel()
  openDlg.setTitle('Export & Optimize All Assets In…')
  openDlg.setCanChooseFiles(false)
  openDlg.setCanChooseDirectories(true)
  openDlg.allowsMultipleSelection = false
  openDlg.setCanCreateDirectories(true)
  openDlg.setPrompt('Export')
  if (path) {
    openDlg.setDirectoryURL(path)
  }
  const buttonClicked = openDlg.runModal()
  if (buttonClicked == NSOKButton) {
    return openDlg.URLs().firstObject().path()
  }
  return null
}

function exportAndCompress(context){
  const potentialExports = context.document.allExportableLayers()
  if (potentialExports.count() > 0) {
    showMessage('Exporting assets to ImageOptim')
    const exportFolder = openFileDialog()
    if (exportFolder) {
      // TODO: If there's any exportable layer selected, only export those. Otherwise, export everything under the sun
      const exports = NSMutableArray.alloc().init()
      for(let exportCount=0; exportCount < potentialExports.count(); exportCount++) {
        const exportableLayer = potentialExports.objectAtIndex(exportCount)
        const requests = MSExportRequest.exportRequestsFromExportableLayer(exportableLayer)
        if (requests.count() > 0) {
          for (let j=0; j < requests.count(); j++) {
            const request = requests.objectAtIndex(j)
            const path = NSString.pathWithComponents([exportFolder, request.name() + '.' + request.format()])
            exports.addObject({ request: request, path: path })
          }
        }
      }

      // First we'll need to actually export the assets
      for (let k=0; k < exports.count(); k++) {
        const currentExport = exports.objectAtIndex(k)
        let render
        if (currentExport.request.format() == "svg") {
          render = MSExportRendererWithSVGSupport.exporterForRequest_colorSpace(currentExport.request, NSColorSpace.sRGBColorSpace())
        } else {
          render = MSExporter.exporterForRequest_colorSpace(currentExport.request, NSColorSpace.sRGBColorSpace())
        }
        render.data().writeToFile_atomically(currentExport.path, true)
      }
      // …and then we'll be able to compress them :)
      const urlsToCompress = getURLsToCompress(exports)
      if (urlsToCompress.length > 0) {
        runImageOptim(context, urlsToCompress, false);
      } else {
        coscript.setShouldKeepAround(false)
      }
    }
  } else {
    showMessage('No exportable layers in the document')
  }
}

function compressAutomatically(context){
  const urlsToCompress = getURLsToCompress(context.actionContext.exports)
  runImageOptim(context, urlsToCompress, true)
}

export const SketchPlugin = {
  name: "ImageOptim",
  description: "Optimize exported images with ImageOptim",
  author: "Kornel Lesiński & Ale Muñoz",
  authorEmail: "kornel@imageoptim.com",
  version: "1.0.0",
  identifier: "com.imageoptim.sketch",
  homepage: "https://imageoptim.com",
  compatibleVersion: 3.8,
  commands: {
    imageOptim: {
      name: 'Export and Optimize All Assets…',
      handlers: {
        run : "___imageOptim_run_handler_",
        actions: {
          "ExportSlices": "___imageOptim_run_handler_",
          "Export": "___imageOptim_run_handler_"
        }
      },
      run(context) {
        if (context.actionContext) {
          // Plugin was triggered automatically
          compressAutomatically(context)
        } else {
          // Plugin was triggered from the menu, so crush with all the power we've got : )
          exportAndCompress(context)
        }
      }
    }
  }
}
