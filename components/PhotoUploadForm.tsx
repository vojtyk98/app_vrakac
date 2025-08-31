// components/PhotoUploadForm.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Share from 'react-native-share';
import ImageResizer from 'react-native-image-resizer';
import RNFS from 'react-native-fs';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

import { SellerFormData } from './SellerForm';
import { CarData } from './CarForm';

// Inline (build-time) data-URL loga – vytvoříš skriptem make-logos-inline.js
import { TOP_RIGHT_B64, BOTTOM_LEFT_B64 } from './logos.inline';
// Fallback (run-time) čtení assetů jako base64 – kdyby inline nebyly k dispozici
import { getLogoTopRightSrc, getLogoBottomLeftSrc } from './logos.base64';

// Pro require fallback referencí na soubory (kvůli bundleru)
const REQUIRE_TOP_LOGO = require('./logo_top_right.png');
const REQUIRE_BOTTOM_LOGO = require('./logo_bottom_left.png');

type PhotoUploadRoute = RouteProp<
  { PhotoUploadForm: { sellerData: SellerFormData; carData: CarData } },
  'PhotoUploadForm'
>;

const COLORS = {
  blue: '#39A9DB',
  green: '#8BC34A',
  text: '#000000',
  border: '#A8CBE6',
  surface: '#FFFFFF',
  bg: '#FFFFFF',
};

// odhad velikosti base64 obsahu v bajtech
const base64SizeBytes = (base64: string) => {
  const cleaned = (base64 || '').replace(/^data:.*;base64,/, '');
  return Math.ceil((cleaned.length * 3) / 4);
};

// bezpečné zmenšení / čtení fotky -> base64
const tryCompress = async (uri: string, maxDim: number, quality: number): Promise<string> => {
  try {
    const resized = await ImageResizer.createResizedImage(uri, maxDim, maxDim, 'JPEG', quality, 0);
    const path = resized.uri.startsWith('file://') ? resized.uri.replace('file://', '') : resized.uri;
    return await RNFS.readFile(path, 'base64');
  } catch (e) {
    try {
      const raw = uri.startsWith('file://') ? uri.replace('file://', '') : uri;
      return await RNFS.readFile(raw, 'base64');
    } catch {
      console.warn('Nepovedlo se načíst obrázek ani fallback:', e);
      return '';
    }
  }
};

// jednoduché očištění pro názvy souborů
const safeFilePart = (s: string) =>
  (s || '')
    .normalize('NFD')
    // @ts-ignore – unicode diacritics
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const PhotoUploadForm: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<PhotoUploadRoute>();
  const { sellerData, carData } = route.params;

  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [interiorPhoto, setInteriorPhoto] = useState<string | null>(null);
  const [vinPhoto, setVinPhoto] = useState<string | null>(null);
  const [tpFrontPhoto, setTpFrontPhoto] = useState<string | null>(null);
  const [tpBackPhoto, setTpBackPhoto] = useState<string | null>(null);

  const allPhotos =
    !!frontPhoto && !!interiorPhoto && !!vinPhoto && !!tpFrontPhoto && !!tpBackPhoto;

  const pickImage = async (setter: (uri: string) => void) => {
    try {
      const res = await launchImageLibrary({ mediaType: 'photo', quality: 0.8, selectionLimit: 1 });
      if (res.assets && res.assets[0].uri) setter(res.assets[0].uri);
    } catch (e) {
      console.warn('Chyba při výběru fotky:', e);
    }
  };

  // ---------- HTML GENERÁTORY ----------
  const buildProtocolHTML = (
    photoEntries: { key: string; base64?: string }[],
    logos: { topSrc: string; bottomSrc: string }
  ): string => {
    const qrImgTag = sellerData.qrBase64
      ? `<div style="margin:8px 0;"><img src="data:image/png;base64,${sellerData.qrBase64}" width="120" alt="QR platba"/></div>`
      : '';

    // nadpis + logo vpravo, nadpis lámat do 2 řádků, max 3/4 šířky
    const headerBlock = `
      <div style="display:grid; grid-template-columns: 3fr 1fr; column-gap:16px; align-items:start;">
        <div style="min-width:0;">
          <h1 style="margin:0; line-height:1.2; word-break:break-word; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; max-width:75%;">
            Předávací protokol vozidla k ekologické likvidaci
          </h1>
          <div style="color:#444; margin-top:6px;">Shrnutí transakce a platební údaje</div>
        </div>
        <div style="text-align:right;">
          ${logos.topSrc ? `<img src="${logos.topSrc}" style="max-width:150px; width:100%; height:auto; display:inline-block;" />` : ''}
        </div>
      </div>
    `;

    // fotky
    let photosSection = `<h2 style="margin-top:16px;">Fotky vozidla</h2><div style="display:flex; flex-wrap:wrap; gap:10px;">`;
    for (const e of photoEntries) {
      if (!e.base64) continue;
      let label = '';
      switch (e.key) {
        case 'front': label = 'Foto zepředu'; break;
        case 'interior': label = 'Interiér'; break;
        case 'vin': label = 'VIN'; break;
        case 'tpFront': label = 'TP - první strana'; break;
        case 'tpBack': label = 'TP - druhá strana'; break;
        default: label = e.key;
      }
      photosSection += `
        <div style="flex:1; min-width:120px; margin-bottom:8px;">
          <p style="margin:4px 0;font-weight:600;">${label}</p>
          <img src="data:image/jpeg;base64,${e.base64}" style="width:120px; height:auto; object-fit:contain; border:1px solid #ccc; border-radius:4px;" />
        </div>`;
    }
    photosSection += `</div>`;

    const logoBottomLeft = logos.bottomSrc
      ? `<img src="${logos.bottomSrc}" width="120" style="position:fixed; bottom:16px; left:16px;" />`
      : '';

    // 4 řádky s Ano/Ne (katalyzátor, baterie, rádio, depozit)
    const yesNo = (v?: boolean) => (v ? 'Ano' : 'Ne');

    return `
      <div style="font-family: Arial, sans-serif; padding:16px; box-sizing:border-box;">
        ${headerBlock}

        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:16px;">
          <div>
            <h2>Prodávající</h2>
            <table style="border-collapse:collapse; width:100%; font-size:12px;">
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Jméno</th><td style="padding:6px; border-bottom:1px solid #eee;">${sellerData.firstName} ${sellerData.lastName}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Datum narození</th><td style="padding:6px; border-bottom:1px solid #eee;">${sellerData.birthDate}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Email</th><td style="padding:6px; border-bottom:1px solid #eee;">${sellerData.email}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Telefon</th><td style="padding:6px; border-bottom:1px solid #eee;">${sellerData.phone}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Číslo dokladu</th><td style="padding:6px; border-bottom:1px solid #eee;">${sellerData.idNumber}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Číslo účtu</th><td style="padding:6px; border-bottom:1px solid #eee;">${sellerData.accountNumber}</td></tr>
              <tr><th style="text-align:left; padding:6px;">Částka</th><td style="padding:6px; font-weight:600;">${sellerData.amount} Kč</td></tr>
            </table>
          </div>
          <div>
            <h2>Vozidlo</h2>
            <table style="border-collapse:collapse; width:100%; font-size:12px;">
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Značka/Model</th><td style="padding:6px; border-bottom:1px solid #eee;">${carData.brand} ${carData.model}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">SPZ</th><td style="padding:6px; border-bottom:1px solid #eee;">${carData.spz}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Rok</th><td style="padding:6px; border-bottom:1px solid #eee;">${carData.year}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">VIN</th><td style="padding:6px; border-bottom:1px solid #eee;">${carData.vin}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Provozní hm.</th><td style="padding:6px; border-bottom:1px solid #eee;">${carData.weight} kg</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Pohotovostní hm.</th><td style="padding:6px; border-bottom:1px solid #eee;">${carData.curbWeight} kg</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Katalyzátor</th><td style="padding:6px; border-bottom:1px solid #eee;">${yesNo(carData.catalyst)}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Baterie</th><td style="padding:6px; border-bottom:1px solid #eee;">${yesNo(carData.battery)}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Rádio</th><td style="padding:6px; border-bottom:1px solid #eee;">${yesNo(carData.radio)}</td></tr>
              <tr><th style="text-align:left; padding:6px;">Depozit</th><td style="padding:6px;">${yesNo(carData.deposit)}</td></tr>
            </table>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:140px 1fr; gap:16px; align-items:center; margin-top:16px;">
          ${qrImgTag}
          <div style="font-size:12px;">
            <div style="font-weight:600;">Částka k úhradě: ${sellerData.amount} CZK</div>
          </div>
        </div>

        ${photosSection}
        ${logoBottomLeft}
        <div style="position:fixed; bottom:16px; right:16px; font-size:10px; color:#666;">Vygenerováno — ${new Date().toLocaleString('cs-CZ')}</div>
      </div>
    `;
  };

  const buildSummaryHTML = (
    seller: SellerFormData,
    car: CarData,
    logos: { topSrc: string; bottomSrc: string }
  ): string => {
    const headerBlock = `
      <div style="display:grid; grid-template-columns: 3fr 1fr; column-gap:16px; align-items:start;">
        <div style="min-width:0;">
          <h1 style="margin:0; line-height:1.2; word-break:break-word; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; max-width:75%;">
            Souhrn předání vozidla k ekologické likvidaci
          </h1>
        </div>
        <div style="text-align:right;">
          ${logos.topSrc ? `<img src="${logos.topSrc}" style="max-width:150px; width:100%; height:auto; display:inline-block;" />` : ''}
        </div>
      </div>
    `;
    const logoBottomLeft = logos.bottomSrc
      ? `<img src="${logos.bottomSrc}" width="120" style="position:fixed; bottom:16px; left:16px;" />`
      : '';
    const qrTag = seller.qrBase64 ? `<img src="data:image/png;base64,${seller.qrBase64}" width="120" alt="QR platba"/>` : '';

    return `
      <div style="font-family: Arial, sans-serif; padding:16px; box-sizing:border-box;">
        ${headerBlock}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px;">
          <div>
            <h2>Prodávající</h2>
            <table style="border-collapse:collapse; width:100%; font-size:12px;">
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Jméno</th><td style="padding:6px; border-bottom:1px solid #eee;">${seller.firstName} ${seller.lastName}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Datum narození</th><td style="padding:6px; border-bottom:1px solid #eee;">${seller.birthDate}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Účet</th><td style="padding:6px; border-bottom:1px solid #eee;">${seller.accountNumber}</td></tr>
            </table>
          </div>
          <div>
            <h2>Vozidlo</h2>
            <table style="border-collapse:collapse; width:100%; font-size:12px;">
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">Značka/Model</th><td style="padding:6px; border-bottom:1px solid #eee;">${car.brand} ${car.model}</td></tr>
              <tr><th style="text-align:left; padding:6px; border-bottom:1px solid #eee;">SPZ</th><td style="padding:6px; border-bottom:1px solid #eee;">${car.spz}</td></tr>
              <tr><th style="text-align:left; padding:6px;">VIN</th><td style="padding:6px;">${car.vin}</td></tr>
            </table>
          </div>
        </div>
        <h2>Výkupní cena</h2>
        <p style="font-size:16px; font-weight:700; margin:0 0 8px 0;">${seller.amount} Kč</p>
        ${qrTag ? `<div style="margin-top:8px;">${qrTag}</div>` : ''}
        ${logoBottomLeft}
        <div style="position:fixed; bottom:16px; right:16px; font-size:10px; color:#666;">Vygenerováno — ${new Date().toLocaleString('cs-CZ')}</div>
      </div>
    `;
  };

  // ---------- FINISH ----------
  const handleFinish = async () => {
    if (!allPhotos) {
      Alert.alert('Chybí fotky', 'Nahrajte prosím všechny fotografie.');
      return;
    }

    try {
      // 1) loga: preferuj inline (rychlé, bez I/O), jinak fallback na assety
      const topSrc =
        TOP_RIGHT_B64 || (await getLogoTopRightSrc(REQUIRE_TOP_LOGO)) || '';
      const bottomSrc =
        BOTTOM_LEFT_B64 || (await getLogoBottomLeftSrc(REQUIRE_BOTTOM_LOGO)) || '';

      // 2) připrav fotky + komprese
      const photoEntries: { key: string; uri: string | null; base64?: string }[] = [
        { key: 'front', uri: frontPhoto },
        { key: 'interior', uri: interiorPhoto },
        { key: 'vin', uri: vinPhoto },
        { key: 'tpFront', uri: tpFrontPhoto },
        { key: 'tpBack', uri: tpBackPhoto },
      ];

      const dims = [800, 600, 400];
      const qualities = [60, 50, 40, 30];
      const MAX_BYTES = 24.8 * 1024 * 1024;

      for (const entry of photoEntries) {
        if (!entry.uri) continue;
        entry.base64 = await tryCompress(entry.uri, dims[0], qualities[0]);
      }

      const estimateTotalSize = () => {
        let total = 0;
        for (const e of photoEntries) if (e.base64) total += base64SizeBytes(e.base64);
        if (sellerData.qrBase64) total += base64SizeBytes(sellerData.qrBase64);
        if (topSrc) total += base64SizeBytes(topSrc.replace(/^data:image\/png;base64,/, ''));
        if (bottomSrc) total += base64SizeBytes(bottomSrc.replace(/^data:image\/png;base64,/, ''));
        return total;
      };

      let currentDimIdx = 0;
      let currentQualityIdx = 0;

      while (estimateTotalSize() > MAX_BYTES) {
        let degraded = false;
        if (currentQualityIdx + 1 < qualities.length) {
          currentQualityIdx += 1;
          for (const entry of photoEntries) if (entry.uri) entry.base64 = await tryCompress(entry.uri, dims[currentDimIdx], qualities[currentQualityIdx]);
          degraded = true;
        } else if (currentDimIdx + 1 < dims.length) {
          currentDimIdx += 1;
          currentQualityIdx = 0;
          for (const entry of photoEntries) if (entry.uri) entry.base64 = await tryCompress(entry.uri, dims[currentDimIdx], qualities[currentQualityIdx]);
          degraded = true;
        }
        if (!degraded) {
          const removalOrder = ['tpBack', 'interior'];
          for (const key of removalOrder) {
            const entry = photoEntries.find((e) => e.key === key);
            if (entry && entry.base64) {
              entry.base64 = undefined;
              entry.uri = null;
              if (estimateTotalSize() <= MAX_BYTES) break;
            }
          }
          break;
        }
      }

      // 3) Protokol PDF
      const protocolHTML = buildProtocolHTML(photoEntries, { topSrc, bottomSrc });
      const protoNameParts = [
        'predavaci_protokol',
        safeFilePart(sellerData.lastName),
        safeFilePart(sellerData.firstName),
        safeFilePart(carData.spz || carData.vin || ''),
      ].filter(Boolean);
      const { filePath: protocolPath } = await RNHTMLtoPDF.convert({
        html: protocolHTML,
        fileName: protoNameParts.join('_'),
      });

      try {
        await Share.open({
          title: `Předávací protokol - ${sellerData.lastName}`,
          subject: `Předávací protokol - ${sellerData.lastName}`,
          message: 'Předávací protokol',
          url: 'file://' + protocolPath!,
          email: 'turnov@zlikvidujauto.cz,alfeco@seznam.cz',
        });
      } catch (shareErr: any) {
        const msg = (shareErr && shareErr.message) || '';
        if (!((typeof msg === 'string' && msg.toLowerCase().includes('cancel')) || msg.includes?.('User did not share') || msg.includes?.('user cancelled'))) {
          Alert.alert('Chyba', 'Sdílení protokolu selhalo.');
          return;
        }
      }

      // 4) Souhrn PDF
      const summaryHTML = buildSummaryHTML(sellerData, carData, { topSrc, bottomSrc });
      const sumNameParts = [
        'souhrn_predani',
        safeFilePart(sellerData.lastName),
        safeFilePart(sellerData.firstName),
        safeFilePart(carData.spz || carData.vin || ''),
      ].filter(Boolean);
      const { filePath: summaryPath } = await RNHTMLtoPDF.convert({
        html: summaryHTML,
        fileName: sumNameParts.join('_'),
      });

      try {
        await Share.open({
          title: `Souhrn předání vozidla - ${sellerData.lastName}`,
          subject: `Souhrn předání vozidla - ${sellerData.lastName}`,
          message: 'Souhrn předání vozidla k ekologické likvidaci',
          url: 'file://' + summaryPath!,
          email: sellerData.email,
        });
      } catch (shareErr: any) {
        const msg = (shareErr && shareErr.message) || '';
        if (!((typeof msg === 'string' && msg.toLowerCase().includes('cancel')) || msg.includes?.('User did not share') || msg.includes?.('user cancelled'))) {
          Alert.alert('Chyba', 'Sdílení souhrnu selhalo.');
          return;
        }
      }

      // 5) Dotaz na smazání dat
      Alert.alert(
        'Hotovo',
        'Chcete smazat vyplněná data a začít od začátku?',
        [
          // NE – jen zavřít dialog, data zůstanou, žádná navigace (to opravuje "white screen")
          { text: 'Ne', style: 'cancel' },
          // ANO – vrať na start a "zapomeň"
          {
            text: 'Ano',
            style: 'destructive',
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: 'FormsWizard', params: { reset: Date.now() } }],
              }),
          },
        ],
        { cancelable: true }
      );
    } catch (err) {
      console.error('Chyba ve finish:', err);
      Alert.alert(
        'Chyba',
        'Nepodařilo se vytvořit nebo sdílet dokumenty. Zkuste to znovu a ověřte, že máte povolená oprávnění k úložišti.'
      );
    }
  };

  // ---------- UI ----------
  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Nahrání fotografií</Text>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>Foto zepředu</Text>
        {frontPhoto ? (
          <Image source={{ uri: frontPhoto }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Text style={styles.placeholderText}>Žádné foto</Text>
          </View>
        )}
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setFrontPhoto)}>
          <Text style={styles.photoButtonText}>{frontPhoto ? 'Změnit foto' : 'Vybrat foto'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>Interiér</Text>
        {interiorPhoto ? (
          <Image source={{ uri: interiorPhoto }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Text style={styles.placeholderText}>Žádné foto</Text>
          </View>
        )}
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setInteriorPhoto)}>
          <Text style={styles.photoButtonText}>{interiorPhoto ? 'Změnit foto' : 'Vybrat foto'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>VIN kód</Text>
        {vinPhoto ? (
          <Image source={{ uri: vinPhoto }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Text style={styles.placeholderText}>Žádné foto</Text>
          </View>
        )}
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setVinPhoto)}>
          <Text style={styles.photoButtonText}>{vinPhoto ? 'Změnit foto' : 'Vybrat foto'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>První strana TP</Text>
        {tpFrontPhoto ? (
          <Image source={{ uri: tpFrontPhoto }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Text style={styles.placeholderText}>Žádné foto</Text>
          </View>
        )}
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setTpFrontPhoto)}>
          <Text style={styles.photoButtonText}>{tpFrontPhoto ? 'Změnit foto' : 'Vybrat foto'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputBlock}>
        <Text style={styles.label}>Druhá strana TP</Text>
        {tpBackPhoto ? (
          <Image source={{ uri: tpBackPhoto }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.placeholder]}>
            <Text style={styles.placeholderText}>Žádné foto</Text>
          </View>
        )}
        <TouchableOpacity style={styles.photoButton} onPress={() => pickImage(setTpBackPhoto)}>
          <Text style={styles.photoButtonText}>{tpBackPhoto ? 'Změnit foto' : 'Vybrat foto'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.navButton, styles.backButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Zpět</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, !allPhotos && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={!allPhotos}
        >
          <Text style={styles.buttonText}>Dokončit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: COLORS.bg },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: COLORS.text },
  inputBlock: { marginBottom: 24 },
  label: { marginBottom: 8, fontWeight: '600', color: COLORS.text },

  photo: { width: '100%', height: 180, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, marginBottom: 8, backgroundColor: COLORS.surface },
  placeholder: { backgroundColor: '#f0f6fb', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  placeholderText: { color: '#777', fontSize: 16 },

  photoButton: { backgroundColor: COLORS.blue, padding: 10, borderRadius: 8, alignItems: 'center' },
  photoButtonText: { color: '#fff', fontWeight: '600' },

  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 32 },
  navButton: { flex: 1, paddingVertical: 14, borderRadius: 24, alignItems: 'center', marginHorizontal: 8 },
  backButton: { backgroundColor: '#9E9E9E' },
  nextButton: { backgroundColor: COLORS.green },
  buttonDisabled: { backgroundColor: '#B6DDB6' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default PhotoUploadForm;
