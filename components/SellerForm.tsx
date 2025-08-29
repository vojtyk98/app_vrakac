import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import QRCode from 'react-native-qrcode-svg';

export type SellerFormData = {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  phone: string;
  idNumber: string;
  accountNumber: string;
  amount: string;
  qrBase64?: string;
};

type SellerFormProps = {
  onNext: (data: SellerFormData) => void;
  initialData?: SellerFormData;
};

const COLORS = {
  blue: '#39A9DB',   // světlejší modrá z loga
  green: '#8BC34A',  // světlejší zelená z loga
  text: '#000000',
  label: '#1d1d1d',
  border: '#A8CBE6',
  surface: '#FFFFFF',
  bg: '#F5FAFF',
  error: '#D32F2F',
};

const computeCzIban = (local: string): string => {
  const [acc, bank] = local.split('/');
  const padded = acc.padStart(16, '0');
  const bban = bank + padded;
  const rearr = bban + 'CZ00';
  const numeric = rearr.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());
  const cs = (98n - (BigInt(numeric) % 97n)).toString().padStart(2, '0');
  return `CZ${cs}${bban}`;
};

const makeSpdPayload = (iban: string, amount: string, name: string, currency = 'CZK'): string => {
  const parts = ['SPD*1.0', `ACC:${iban}`, `RN:${name}`];
  parts.push(`AM:${parseFloat(amount).toFixed(2)}`, `CC:${currency}`);
  return parts.join('*');
};

// vloží tečky do data ve formátu DD.MM.RRRR během psaní
const formatBirthDate = (input: string): string => {
  const digits = input.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
};

const SellerForm: React.FC<SellerFormProps> = ({ onNext, initialData }) => {
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [birthDate, setBirthDate] = useState(initialData?.birthDate || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [idNumber, setIdNumber] = useState(initialData?.idNumber || '');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [spdString, setSpdString] = useState('');
  const [qrBase64, setQrBase64] = useState<string>('');
  const qrRef = useRef<QRCode | null>(null);

  const accRaw = accountNumber.replace(/\s+/g, '');
  const accValid = /^\d{1,10}\/\d{4}$/.test(accRaw);
  const allValid =
    !!firstName && !!lastName && !!birthDate && !!email && !!phone && !!idNumber && accValid && !!amount;

  useEffect(() => {
    if (accValid && amount && firstName && lastName) {
      try {
        const iban = computeCzIban(accRaw);
        const fullName = `${firstName} ${lastName}`;
        const spd = makeSpdPayload(iban, amount, fullName);
        setSpdString(spd);
        setTimeout(() => {
          if (qrRef.current && (qrRef.current as any).toDataURL) {
            (qrRef.current as any).toDataURL((data: string) => setQrBase64(data));
          }
        }, 150);
      } catch {
        setSpdString('');
      }
    } else {
      setSpdString('');
    }
  }, [accRaw, amount, firstName, lastName, accValid]);

  const onDateChange = (_: any, d?: Date) => {
    setShowDatePicker(false);
    if (d) {
      const day = String(d.getDate()).padStart(2, '0');
      const mon = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      setBirthDate(`${day}.${mon}.${year}`);
    }
  };

  const handleNext = () => {
    if (!allValid) {
      Alert.alert('Chyba', 'Vyplňte všechna povinná pole správně.');
      return;
    }
    onNext({
      firstName,
      lastName,
      birthDate,
      email,
      phone,
      idNumber,
      accountNumber: accRaw,
      amount,
      qrBase64: qrBase64 ? qrBase64 : undefined,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>Prodávající</Text>

      <Text style={styles.label}>Jméno</Text>
      <TextInput
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
        placeholder="Jméno"
        placeholderTextColor="#666"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Příjmení</Text>
      <TextInput
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
        placeholder="Příjmení"
        placeholderTextColor="#666"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Datum narození</Text>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={birthDate}
          onChangeText={(text) => setBirthDate(formatBirthDate(text))}
          placeholder="DD.MM.RRRR"
          placeholderTextColor="#666"
          keyboardType="numbers-and-punctuation"
          maxLength={10}
        />
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
          <Text style={styles.dateIcon}>📅</Text>
        </TouchableOpacity>
      </View>
      {showDatePicker && (
        <DateTimePicker
          value={birthDate ? new Date(birthDate.split('.').reverse().join('-')) : new Date()}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={onDateChange}
        />
      )}

      <Text style={styles.label}>E-mail</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="email@example.com"
        placeholderTextColor="#666"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Telefon</Text>
      <TextInput
        style={styles.input}
        value={phone}
        onChangeText={setPhone}
        placeholder="+420 777 123 456"
        placeholderTextColor="#666"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Číslo dokladu</Text>
      <TextInput
        style={styles.input}
        value={idNumber}
        onChangeText={setIdNumber}
        placeholder="OP nebo pas"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Číslo účtu</Text>
      <TextInput
        style={styles.input}
        value={accountNumber}
        onChangeText={(t) => setAccountNumber(t.replace(/\s+/g, ''))}
        placeholder="1974047020/3030"
        placeholderTextColor="#666"
      />

      <Text style={styles.label}>Částka</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={(t) => setAmount(t.replace(',', '.'))}
        placeholder="10000.00"
        placeholderTextColor="#666"
        keyboardType="decimal-pad"
      />

      <Text style={styles.qrLabel}>QR platba (SPD)</Text>
      <View style={styles.qrContainer}>
        {spdString ? (
          <>
            <QRCode
              value={spdString}
              size={180}
              getRef={(c) => {
                qrRef.current = c;
              }}
            />
            <Text style={styles.amountLabel}>Částka: {parseFloat(amount || '0').toFixed(2)} Kč</Text>
            <Text selectable style={styles.payloadText}>
              {spdString}
            </Text>
          </>
        ) : (
          <Text style={styles.errorText}>vyplňte údaje</Text>
        )}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={[styles.button, !allValid && styles.buttonDisabled]} onPress={handleNext} disabled={!allValid}>
          <Text style={styles.buttonText}>Pokračovat</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: COLORS.bg },
  heading: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: COLORS.text, textAlign: 'center' },
  label: { fontWeight: '600', marginTop: 12, marginBottom: 6, color: COLORS.label },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
  },

  dateRow: { flexDirection: 'row', alignItems: 'center' },
  dateButton: { marginLeft: 8, padding: 8, backgroundColor: COLORS.blue, borderRadius: 8 },
  dateIcon: { fontSize: 18, color: '#fff' },

  qrLabel: { fontWeight: 'bold', marginTop: 18, textAlign: 'center', color: COLORS.label },
  qrContainer: { alignItems: 'center', marginVertical: 16 },
  amountLabel: { fontSize: 18, fontWeight: 'bold', marginTop: 12, color: COLORS.text },
  payloadText: { fontSize: 10, color: '#555', marginTop: 4 },
  errorText: { color: COLORS.error, textAlign: 'center', marginTop: 8 },

  buttonRow: { marginTop: 24 },
  button: { backgroundColor: COLORS.green, padding: 14, borderRadius: 24, alignItems: 'center' },
  buttonDisabled: { backgroundColor: '#B6DDB6' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default SellerForm;
