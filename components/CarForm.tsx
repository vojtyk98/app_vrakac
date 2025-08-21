import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SellerFormData } from './SellerForm';

export type CarData = {
  brand: string;
  model: string;
  spz: string;
  year: string;
  vin: string;
  weight: string;
  curbWeight: string;
  catalyst: boolean;
  battery: boolean;
  radio: boolean;
  deposit: boolean;
};

type CarFormProps = {
  onNext: (data: CarData) => void;
  onBack: () => void;
  initialData?: Partial<CarData>;
  sellerData: SellerFormData;
};

const CarForm: React.FC<CarFormProps> = ({ onNext, onBack, initialData }) => {
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [model, setModel] = useState(initialData?.model || '');
  const [spz, setSpz] = useState(initialData?.spz || '');
  const [year, setYear] = useState(initialData?.year || '');
  const [vin, setVin] = useState(initialData?.vin || '');
  const [weight, setWeight] = useState(initialData?.weight || '');
  const [curbWeight, setCurbWeight] = useState(initialData?.curbWeight || '');
  const [catalyst, setCatalyst] = useState(initialData?.catalyst || false);
  const [battery, setBattery] = useState(initialData?.battery || false);
  const [radio, setRadio] = useState(initialData?.radio || false);
  const [deposit, setDeposit] = useState(initialData?.deposit || false);

  const validate = () => {
    if (!brand || !model || !spz || !year || !vin || !weight || !curbWeight) {
      Alert.alert('Chyba', 'Vyplňte všechna povinná pole.');
      return false;
    }
    if (!/^[A-Z0-9]{7,8}$/.test(spz.replace(/\s+/g, '').toUpperCase())) {
      Alert.alert('Chyba', 'SPZ má nesprávný formát.');
      return false;
    }
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin.toUpperCase())) {
      Alert.alert('Chyba', 'VIN musí mít 17 znaků (bez I, O, Q).');
      return false;
    }
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 1900 || yearNum > new Date().getFullYear()) {
      Alert.alert('Chyba', 'Zadejte platný rok výroby.');
      return false;
    }
    if (isNaN(parseInt(weight)) || isNaN(parseInt(curbWeight))) {
      Alert.alert('Chyba', 'Hmotnosti musí být čísla.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validate()) return;
    onNext({
      brand,
      model,
      spz: spz.toUpperCase(),
      year,
      vin: vin.toUpperCase(),
      weight,
      curbWeight,
      catalyst,
      battery,
      radio,
      deposit,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Vozidlo</Text>

      <Text style={styles.label}>Značka</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} />

      <Text style={styles.label}>Model</Text>
      <TextInput style={styles.input} value={model} onChangeText={setModel} />

      <Text style={styles.label}>SPZ</Text>
      <TextInput style={styles.input} value={spz} onChangeText={setSpz} autoCapitalize="characters" />

      <Text style={styles.label}>Rok výroby</Text>
      <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="numeric" />

      <Text style={styles.label}>VIN</Text>
      <TextInput style={styles.input} value={vin} onChangeText={setVin} autoCapitalize="characters" />

      <Text style={styles.label}>Provozní hmotnost (kg)</Text>
      <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />

      <Text style={styles.label}>Pohotovostní hmotnost (kg)</Text>
      <TextInput style={styles.input} value={curbWeight} onChangeText={setCurbWeight} keyboardType="numeric" />

      <View style={styles.checkboxRow}>
        <TouchableOpacity onPress={() => setCatalyst(!catalyst)}>
          <Text>{catalyst ? '✅' : '⬜'} Katalyzátor</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setBattery(!battery)}>
          <Text>{battery ? '✅' : '⬜'} Baterie</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setRadio(!radio)}>
          <Text>{radio ? '✅' : '⬜'} Rádio</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDeposit(!deposit)}>
          <Text>{deposit ? '✅' : '⬜'} Depozit</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
          <Text style={styles.buttonText}>Zpět</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.nextButton]} onPress={handleNext}>
          <Text style={styles.buttonText}>Pokračovat</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { marginTop: 10, marginBottom: 4, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 10, backgroundColor: '#fff' },
  checkboxRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  button: { flex: 1, padding: 14, borderRadius: 24, alignItems: 'center', marginHorizontal: 4 },
  backButton: { backgroundColor: '#777' },
  nextButton: { backgroundColor: '#1769aa' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
});

export default CarForm;
