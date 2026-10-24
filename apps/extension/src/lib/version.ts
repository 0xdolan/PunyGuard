/** Display version from the built manifest (prerelease builds carry it in `version_name`). */
export const APP_VERSION = (() => {
  const manifest = browser.runtime.getManifest();
  return manifest.version_name ?? manifest.version;
})();
