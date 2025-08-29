import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  Switch,
  TouchableOpacity,
} from 'react-native';

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
  sellerData: { lastName: string };
};

const COLORS = {
  blue: '#39A9DB',
  green: '#8BC34A',
  text: '#000000',
  label: '#1d1d1d',
  border: '#A8CBE6',
  surface: '#FFFFFF',
  bg: '#F5FAFF',
};

const CarForm: React.FC<CarFormProps> = ({ onNext, onBack, initialData = {} }) => {
  const [brand, setBrand] = useState(initialData.brand || '');
  const [model, setModel] = useState(initialData.model || '');
  const [spz, setSpz] = useState(initialData.spz || '');
  const [year, setYear] = useState(initialData.year || '');
  const [vin, setVin] = useState(initialData.vin || '');
  const [weight, setWeight] = useState(initialData.weight || '');
  const [curbWeight, setCurbWeight] = useState(initialData.curbWeight || '');
  const [catalyst, setCatalyst] = useState(initialData.catalyst ?? false);
  const [battery, setBattery] = useState(initialData.battery ?? false);
  const [radio, setRadio] = useState(initialData.radio ?? false);
  const [deposit, setDeposit] = useState(initialData.deposit ?? false);

  const allValid =
    brand.trim() &&
    model.trim() &&
    spz.trim() &&
    year.trim() &&
    vin.trim() &&
    weight.trim() &&
    curbWeight.trim();

  const handleNext = () => {
    if (!allValid) {
      Alert.alert('Chybí údaje', 'Vyplňte všechna povinná pole.');
      return;
    }
    onNext({
      brand: brand.trim(),
      model: model.trim(),
      spz: spz.trim(),
      year: year.trim(),
      vin: vin.trim(),
      weight: weight.trim(),
      curbWeight: curbWeight.trim(),
      catalyst,
      battery,
      radio,
      deposit,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Údaje o vozidle</Text>

      <Text style={styles.label}>Značka</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="Značka" placeholderTextColor="#666" />

      <Text style={styles.label}>Model</Text>
      <TextInput style={styles.input} value={model} onChangeText={setModel} placeholder="Model" placeholderTextColor="#666" />

      <Text style={styles.label}>SPZ</Text>
      <TextInput style={styles.input} value={spz} onChangeText={setSpz} placeholder="SPZ" placeholderTextColor="#666" />

      <Text style={styles.label}>Rok výroby</Text>
      <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="YYYY" keyboardType="number-pad" placeholderTextColor="#666" />

      <Text style={styles.label}>VIN</Text>
      <TextInput style={styles.input} value={vin} onChangeText={setVin} placeholder="VIN" placeholderTextColor="#666" />

      <Text style={styles.label}>Provozní hmotnost (kg)</Text>
      <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="Provozní hmotnost" keyboardType="number-pad" placeholderTextColor="#666" />

      <Text style={styles.label}>Pohotovostní hmotnost (kg)</Text>
      <TextInput style={styles.input} value={curbWeight} onChangeText={setCurbWeight} placeholder="Pohotovostní hmotnost" keyboardType="number-pad" placeholderTextColor="#666" />

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Katalyzátor</Text>
        <Switch value={catalyst} onValueChange={setCatalyst} trackColor={{ false: '#cfcfcf', true: COLORS.green }} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Baterie</Text>
        <Switch value={battery} onValueChange={setBattery} trackColor={{ false: '#cfcfcf', true: COLORS.green }} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Rádio</Text>
        <Switch value={radio} onValueChange={setRadio} trackColor={{ false: '#cfcfcf', true: COLORS.green }} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Depozit</Text>
        <Switch value={deposit} onValueChange={setDeposit} trackColor={{ false: '#cfcfcf', true: COLORS.green }} />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.buttonText}>Zpět</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.nextButton, !allValid && styles.buttonDisabled]} onPress={handleNext} disabled={!allValid}>
          <Text style={styles.buttonText}>Pokračovat</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: COLORS.bg },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: COLORS.text },
  label: { fontSize: 16, marginBottom: 6, color: COLORS.label, fontWeight: '600' },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, marginBottom: 14, backgroundColor: COLORS.surface, color: COLORS.text },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  switchLabel: { fontSize: 16, color: COLORS.label },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  backButton: { flex: 1, marginRight: 8, padding: 12, backgroundColor: '#9E9E9E', borderRadius: 24, alignItems: 'center' },
  nextButton: { flex: 1, marginLeft: 8, padding: 12, backgroundColor: COLORS.blue, borderRadius: 24, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#BBDFF1' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default CarForm;
