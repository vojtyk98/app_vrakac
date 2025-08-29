// src/utils/pdf.ts
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import { Alert } from 'react-native';

type CreateAndSharePdfParams = {
  html: string;
  title?: string;
};

export async function createAndSharePdf({ html, title = 'Dokument' }: CreateAndSharePdfParams) {
  try {
    const stamp = Date.now();
    const baseName = `vrakac-${stamp}`;

    // 1) vytvoř PDF (do dočasné cesty knihovny)
    const result = await RNHTMLtoPDF.convert({
      html,
      fileName: baseName,
      base64: false,
    });

    // 2) přesun PDF do cache (FileProvider ji zná z file_paths.xml)
    const dest = `${RNFS.CachesDirectoryPath}/${baseName}.pdf`;
    try {
      if (await RNFS.exists(dest)) {
        await RNFS.unlink(dest);
      }
    } catch {}

    await RNFS.moveFile(result.filePath!, dest);

    // 3) sdílej (pozor na prefix file://)
    const url = `file://${dest}`;
    await Share.open({
      url,
      type: 'application/pdf',
      subject: title,
      failOnCancel: false,
    });

    return { path: dest, shared: true };
  } catch (e: unknown) {
    // detailní log + uživatelská hláška
    const msg = e instanceof Error ? e.message : String(e);
    console.warn('PDF error:', msg, e);
    Alert.alert('Chyba při vytváření/sdílení PDF', msg);
    return { error: e };
  }
}
