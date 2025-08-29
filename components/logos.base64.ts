// components/logos.base64.ts
import RNFS from 'react-native-fs';
import { Image, Platform } from 'react-native';

// očista base64 (odstranění data: prefixů a whitespace)
const cleanB64 = (s: string) => (s || '').replace(/(\r\n|\n|\r|\s)/g, '');

// načte RN asset a vrátí base64 – funguje pro file://, asset:/ i http(s)://
const readAssetAsBase64 = async (asset: number, cacheName: string): Promise<string> => {
  const src = Image.resolveAssetSource(asset);
  let uri = src?.uri || '';
  if (!uri) return '';

  try {
    // 1) file:// (často v debug buildu)
    if (uri.startsWith('file://')) {
      const p = uri.replace('file://', '');
      const b64 = await RNFS.readFile(p, 'base64');
      return cleanB64(b64);
    }

    // 2) asset:/… (Android release)
    //   → čte z "android/app/src/main/assets" (při buildu je RN balíček přístupný jako asset:/)
    if (Platform.OS === 'android' && uri.startsWith('asset:/')) {
      const name = uri.replace('asset:/', ''); // např. "logo_top_right.png"
      const b64 = await RNFS.readFileAssets(name, 'base64');
      return cleanB64(b64);
    }

    // 3) http(s):// (Metro server v debug režimu)
    if (uri.startsWith('http')) {
      const dir =
        Platform.OS === 'ios' ? RNFS.TemporaryDirectoryPath : RNFS.CachesDirectoryPath;
      const dest = `${dir}/${cacheName}`;
      await RNFS.downloadFile({ fromUrl: uri, toFile: dest }).promise;
      const b64 = await RNFS.readFile(dest, 'base64');
      return cleanB64(b64);
    }

    // 4) fallback – zkusíme přečíst "jak je"
    const b64 = await RNFS.readFile(uri, 'base64');
    return cleanB64(b64);
  } catch (e) {
    console.warn('logos.base64: nepodařilo se načíst asset', cacheName, e);
    return '';
  }
};

// jednoduchý cache, ať zbytečně nečteme disk
let _top = '';
let _bottom = '';

/** Vrátí data URL pro logo nahoře vpravo */
export const getLogoTopRightSrc = async (asset: number): Promise<string> => {
  if (!_top) _top = await readAssetAsBase64(asset, 'logo_top_right.png');
  return _top ? `data:image/png;base64,${_top}` : '';
};

/** Vrátí data URL pro logo dole vlevo */
export const getLogoBottomLeftSrc = async (asset: number): Promise<string> => {
  if (!_bottom) _bottom = await readAssetAsBase64(asset, 'logo_bottom_left.png');
  return _bottom ? `data:image/png;base64,${_bottom}` : '';
};

/** Volitelné – vymazání cache (když během běhu vyměníš obrázky) */
export const resetLogosBase64Cache = () => {
  _top = '';
  _bottom = '';
};
