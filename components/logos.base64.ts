// components/logos.base64.ts
import RNFS from 'react-native-fs';
import { Image, Platform } from 'react-native';

// Smaže whitespacy/newlines z base64
const cleanB64 = (s: string) => (s || '').replace(/(\r\n|\n|\r|\s)/g, '');

// Načte RN asset jako base64 (řeší file://, asset:/ i http(s) z Metro serveru)
const readAssetAsBase64 = async (asset: number, cacheName: string): Promise<string> => {
  const src = Image.resolveAssetSource(asset);
  let uri = src?.uri || '';
  if (!uri) return '';

  try {
    // 1) file://... (často v release)
    if (uri.startsWith('file://')) {
      return cleanB64(await RNFS.readFile(uri.replace('file://', ''), 'base64'));
    }

    // 2) asset:/... (Android release)
    if (uri.startsWith('asset:/')) {
      const name = uri.replace('asset:/', ''); // např. "logo_top_right.png"
      const b64 = await RNFS.readFileAssets(name, 'base64');
      return cleanB64(b64);
    }

    // 3) http(s)://... (debug přes Metro/iOS)
    if (uri.startsWith('http')) {
      const dir =
        Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : RNFS.CachesDirectoryPath;
      const dest = `${dir}/${cacheName}`;
      await RNFS.downloadFile({ fromUrl: uri, toFile: dest }).promise;
      return cleanB64(await RNFS.readFile(dest, 'base64'));
    }

    // 4) fallback – zkus jako lokální cestu
    return cleanB64(await RNFS.readFile(uri, 'base64'));
  } catch (e) {
    console.warn('logos.base64: nepodařilo se načíst asset', cacheName, e);
    return '';
  }
};

let _top = '';
let _bottom = '';

/** Vrátí kompletní data URL pro logo nahoře vpravo */
export const getLogoTopRightSrc = async (asset: number): Promise<string> => {
  if (!_top) _top = await readAssetAsBase64(asset, 'logo_top.png');
  return _top ? `data:image/png;base64,${_top}` : '';
};

/** Vrátí kompletní data URL pro logo dole vlevo */
export const getLogoBottomLeftSrc = async (asset: number): Promise<string> => {
  if (!_bottom) _bottom = await readAssetAsBase64(asset, 'logo_bottom.png');
  return _bottom ? `data:image/png;base64,${_bottom}` : '';
};

/** Volitelně: vymazat cache (když vyměníš obrázky za běhu) */
export const resetLogosBase64Cache = () => {
  _top = '';
  _bottom = '';
};
