import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View, Button, FlatList, Image, Alert, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

// ATENÇÃO: Confirme se o IP ainda é este. Se mudou, atualize aqui.
const API_URL = 'http://192.168.3.16:3000'; 

type DefectReport = {
  _id: string;
  title: string;       // Equipamento
  description: string; // Defeito
  laboratory: string;  // Laboratório
  latitude: number;
  longitude: number;
  photo?: string | null;
  createdAt?: string;
};

export default function App() {
  // Estados para o formulário
  const [equipment, setEquipment] = useState(''); // antigo title
  const [defect, setDefect] = useState('');       // antigo description
  const [laboratory, setLaboratory] = useState(''); // NOVO
  
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  
  const [reports, setReports] = useState<DefectReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_URL}/api/places`);
      const data = await res.json();
      setReports(data);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Não foi possível carregar os registros');
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da localização para saber onde está o defeito.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos da câmera para registrar o defeito.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, quality: 0.5, base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };

  const handleSave = async () => {
    if (!equipment || !defect || !laboratory || latitude == null) {
      Alert.alert('Atenção', 'Preencha Equipamento, Laboratório, Defeito e pegue a Localização.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/places`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: equipment,       // Enviando como title para o backend
          description: defect,    // Enviando como description
          laboratory,             // Enviando o novo campo
          latitude,
          longitude,
          photo,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setReports((prev) => [created, ...prev]);
        setEquipment('');
        setDefect('');
        setLaboratory('');
        setLatitude(null);
        setLongitude(null);
        setPhoto(null);
        Alert.alert('Sucesso', 'Defeito registrado!');
      } else {
        Alert.alert('Erro', 'Falha ao salvar.');
      }
    } catch (error) {
      Alert.alert('Erro', 'Sem conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

const handleDelete = (id: string) => {
    Alert.alert(
      'Excluir',
      'Tem certeza que deseja apagar este registro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              // Chama o backend para deletar
              await fetch(`${API_URL}/api/places/${id}`, {
                method: 'DELETE',
              });

              // Atualiza a lista na tela removendo o item instantaneamente
              setReports((prev) => prev.filter((item) => item._id !== id));
              Alert.alert('Sucesso', 'Registro removido.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível deletar.');
            }
          },
        },
      ]
    );
  };

 const renderItem = ({ item }: { item: DefectReport }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>🔧 {item.title}</Text>
        {/* Botão de deletar pequeno no canto */}
        <Button 
          title="X" 
          color="red" 
          onPress={() => handleDelete(item._id)} 
        />
      </View>
      
      <Text style={styles.label}>Laboratório: <Text style={styles.value}>{item.laboratory}</Text></Text>
      <Text style={styles.label}>Defeito: <Text style={styles.value}>{item.description}</Text></Text>
      <Text style={styles.coords}>📍 Lat: {item.latitude.toFixed(4)} | Lng: {item.longitude.toFixed(4)}</Text>
      {item.photo && <Image source={{ uri: item.photo }} style={styles.cardImage} />}
      <Text style={styles.date}>📅 {item.createdAt ? new Date(item.createdAt).toLocaleString() : '-'}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.title}>Reportar Equipamento Defeituoso</Text>

        <TextInput style={styles.input} placeholder="Nome do Equipamento (Ex: Microscópio 01)" value={equipment} onChangeText={setEquipment} />
        <TextInput style={styles.input} placeholder="Laboratório (Ex: Lab. Química A)" value={laboratory} onChangeText={setLaboratory} />
        <TextInput style={[styles.input, styles.textArea]} placeholder="Descrição do Defeito" value={defect} onChangeText={setDefect} multiline />

        <Button title="📍 Obter Localização Atual" onPress={getLocation} />
        <Text style={styles.infoText}>{latitude ? `Local Capturado` : 'Localização pendente...'}</Text>

        <Button title="📸 Foto do Defeito" onPress={takePhoto} />
        {photo && <Image source={{ uri: photo }} style={styles.previewImage} />}

        <View style={{ marginTop: 10 }}>
          <Button title={loading ? 'Salvando...' : '💾 Registrar Defeito'} onPress={handleSave} disabled={loading} color="#d9534f" />
        </View>
      </ScrollView>

      <Text style={styles.listTitle}>Últimos Registros</Text>
      <FlatList data={reports} keyExtractor={(item) => item._id} renderItem={renderItem} contentContainerStyle={styles.list} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0', paddingTop: 40 },
  form: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#ccc' },
  textArea: { height: 80, textAlignVertical: 'top' },
  infoText: { textAlign: 'center', marginVertical: 5, color: '#666' },
  previewImage: { width: '100%', height: 200, borderRadius: 8, marginVertical: 10 },
  listTitle: { fontSize: 18, fontWeight: 'bold', margin: 16, color: '#333' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, elevation: 2 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#d9534f', marginBottom: 5 },
  label: { fontWeight: 'bold', color: '#555' },
  value: { fontWeight: 'normal', color: '#333' },
  coords: { fontSize: 12, color: '#888', marginTop: 5 },
  cardImage: { width: '100%', height: 180, borderRadius: 8, marginTop: 10 },
  date: { fontSize: 11, color: '#999', marginTop: 8, textAlign: 'right' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
});