import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

import SellerForm, { SellerFormData } from './SellerForm';
import CarForm, { CarData } from './CarForm';

const COLORS = {
  bg: '#F5FAFF',    // světle modré pozadí
};

const FormsWizard: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [sellerData, setSellerData] = useState<SellerFormData | null>(null);
  const [carData, setCarData] = useState<CarData | null>(null);

  // Pokud přijdeme se signálem k resetu (po dokončení a potvrzení "Začít znovu"),
  // vyprázdníme lokální state.
  useEffect(() => {
    const resetToken = (route.params as any)?.reset;
    if (resetToken) {
      setSellerData(null);
      setCarData(null);
    }
  }, [route.params]);

  // Jakmile máme oba kroky vyplněné, jdeme na PhotoUploadForm
  const navigatedOnce = useRef(false);
  useEffect(() => {
    if (sellerData && carData && !navigatedOnce.current) {
      navigatedOnce.current = true;
      navigation.navigate('PhotoUploadForm', { sellerData, carData });
      // necháme state být – po návratu ho případně smažeme přes reset param
    }
  }, [sellerData, carData, navigation]);

  return (
    <View style={styles.wrapper}>
      {!sellerData && (
        <SellerForm
          onNext={(data) => {
            setSellerData(data);
          }}
          initialData={undefined}
        />
      )}

      {sellerData && !carData && (
        <CarForm
          onNext={(data) => {
            setCarData(data);
          }}
          onBack={() => {
            setSellerData(null);
          }}
          initialData={{}}
          sellerData={sellerData}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: COLORS.bg },
});

export default FormsWizard;
