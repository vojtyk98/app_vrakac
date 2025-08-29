import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import SellerForm, { SellerFormData } from './SellerForm';
import CarForm, { CarData } from './CarForm';
import { useNavigation } from '@react-navigation/native';

const FormsWizard: React.FC = () => {
  const [sellerData, setSellerData] = useState<SellerFormData | null>(null);
  const navigation = useNavigation<any>();

  return (
    <View style={styles.wrapper}>
      {!sellerData && (
        <SellerForm onNext={(data) => setSellerData(data)} initialData={undefined} />
      )}

      {sellerData && (
        <CarForm
          onNext={(carData) => {
            // po druhém kroku rovnou přejdi na PhotoUploadForm a dej mu data přes route.params
            navigation.navigate('PhotoUploadForm', { sellerData, carData });
          }}
          onBack={() => setSellerData(null)}
          initialData={{}}
          sellerData={sellerData}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
});

export default FormsWizard;
