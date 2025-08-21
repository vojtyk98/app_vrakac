import RNFS from 'react-native-fs';
import { Image, Platform } from 'react-native';

// Odstraní whitespace/newlines z base64
const cleanB64 = (s?: string) => (s || '').replace(/(\r\n|\n|\r|\s)/g, '');

// Bezpečné načtení assetu jako base64 (funguje pro file:// i http dev server)
const readAssetAsBase64 = async (asset: number, cacheName: string): Promise<string> => {
  const src = Image.resolveAssetSource(asset);
  const uri = src?.uri || '';
  if (!uri) return '';

  try {
    if (uri.startsWith('file://')) {
      return cleanB64(await RNFS.readFile(uri.replace('file://', ''), 'base64'));
    }
    if (uri.startsWith('http')) {
      const dir = Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : RNFS.CachesDirectoryPath;
      const dest = `${dir}/${cacheName}`;
      await RNFS.downloadFile({ fromUrl: uri, toFile: dest }).promise;
      return cleanB64(await RNFS.readFile(dest, 'base64'));
    }
    // fallback (někdy RN vrátí asset:/…)
    return cleanB64(await RNFS.readFile(uri, 'base64'));
  } catch (e) {
    console.warn('logos.base64: nepodařilo se načíst asset', cacheName, e);
    return '';
  }
};

let _top = '';
let _bottom = '';

/** Vrací kompletní <img src="..."> (data URL) pro logo nahoře vpravo */
export const getLogoTopRightSrc = async (asset: number): Promise<string> => {
  if (!_top) _top = await readAssetAsBase64(asset, 'logo_top.png');
  return _top ? `data:image/png;base64,${_top}` : '';
};

/** Vrací kompletní <img src="..."> (data URL) pro logo dole vlevo */
export const getLogoBottomLeftSrc = async (asset: number): Promise<string> => {
  if (!_bottom) _bottom = await readAssetAsBase64(asset, 'logo_bottom.png');
  return _bottom ? `data:image/png;base64,${_bottom}` : '';
};
