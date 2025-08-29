// App.tsx (dočasný smoke test)
import React from 'react';
import { SafeAreaView, View, Text } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
        <Text style={{fontSize: 18}}>App běží ✔️ (smoke test)</Text>
      </View>
    </SafeAreaView>
  );
}
