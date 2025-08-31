// components/logos.base64.ts
import RNFS from 'react-native-fs';
import { Image, Platform } from 'react-native';

/**
 * OPTION 1 (doporučeno - 100% jistota):
 * Vlož sem přímo data URL (včetně "data:image/png;base64,").
 * Pak se nebude nic číst z disku a PDF loga uvidí i v release.
 */
const INLINE_TOP = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABjUA...';      // např. "data:image/png;base64,iVBORw0KGgoAAA..."
const INLINE_BOTTOM = 'data:image/png;base64,iVBORw0KGgoAAAANSU...';   // např. "data:image/png;base64,iVBORw0KGgoAAA..."

/** Očista base64 (odstranění whitespace) */
const cleanB64 = (s: string) => (s || '').replace(/(\r\n|\n|\r|\s)/g, '');

/** Bezpečný název pro cache / dočasné soubory */
const safeName = (s: string) => (s || '').split(/[\\/]/).pop() || '';

/**
 * Přečte RN asset a vrátí čisté base64 (bez prefixu).
 * Podporuje:
 *  - file://  (debug i release)
 *  - http(s):// (debug přes Metro)
 *  - content:// (některé Android verze tak vrací assety/obsah)
 *  - asset:/…  (Android release, POKUD je soubor v android/app/src/main/assets)
 *
 * POZOR: obrázky vložené přes require('./logo.png') RN typicky balí do res/drawable-*,
 * což NENÍ čitelné přes readFileAssets(). Proto je nejlepší mít INLINE_* vyplněné.
 */
const readAssetAsBase64 = async (asset: number, cacheName: string): Promise<string> => {
  const src = Image.resolveAssetSource(asset);
  const uri = src?.uri || '';
  if (!uri) return '';

  try {
    // 1) file:// (často debug)
    if (uri.startsWith('file://')) {
      const p = uri.replace('file://', '');
      const b64 = await RNFS.readFile(p, 'base64');
      return cleanB64(b64);
    }

    // 2) http(s):// (Metro server)
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      const dest = `${RNFS.CachesDirectoryPath}/${safeName(cacheName) || 'logo.tmp'}`;
      await RNFS.downloadFile({ fromUrl: uri, toFile: dest }).promise;
      const b64 = await RNFS.readFile(dest, 'base64');
      return cleanB64(b64);
    }

    // 3) content:// (některá Android URI)
    if (Platform.OS === 'android' && uri.startsWith('content://')) {
      const b64 = await RNFS.readFile(uri, 'base64');
      return cleanB64(b64);
    }

    // 4) asset:/…  (Android release, ale funguje JEN pro soubory v android/app/src/main/assets)
    if (Platform.OS === 'android' && uri.startsWith('asset:/')) {
      const lastSeg = safeName(uri); // poslední část cesty
      const guesses = [
        lastSeg,                         // "logo_top_right.png"
        cacheName,                       // "logo_top_right.png" (z volání)
        `images/${lastSeg}`,
        `assets/${lastSeg}`,
      ];

      for (const g of guesses) {
        try {
          const b64 = await RNFS.readFileAssets(g, 'base64');
          if (b64) return cleanB64(b64);
        } catch { /* zkus další variantu */ }
      }
      // Pokud jsme se sem dostali, nejspíš se jedná o res/drawable (nečitelné RNFS).
      // Tady už pomůže jen INLINE_* fallback.
    }

    // 5) fallback – zkus přímo
    try {
      const b64 = await RNFS.readFile(uri, 'base64');
      return cleanB64(b64);
    } catch {
      // nic
    }

    return '';
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
  // nejdřív inline fallback (pokud je vyplněný)
  if (INLINE_TOP) return INLINE_TOP;

  if (!_top) _top = await readAssetAsBase64(asset, 'logo_top_right.png');
  return _top ? `data:image/png;base64,${_top}` : '';
};

/** Vrátí data URL pro logo dole vlevo */
export const getLogoBottomLeftSrc = async (asset: number): Promise<string> => {
  // nejdřív inline fallback (pokud je vyplněný)
  if (INLINE_BOTTOM) return INLINE_BOTTOM;

  if (!_bottom) _bottom = await readAssetAsBase64(asset, 'logo_bottom_left.png');
  return _bottom ? `data:image/png;base64,${_bottom}` : '';
};

/** Volitelné – vymazání cache (když během běhu vyměníš obrázky) */
export const resetLogosBase64Cache = () => {
  _top = '';
  _bottom = '';
};
