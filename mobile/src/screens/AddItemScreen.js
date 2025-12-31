import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

export default function AddItemScreen({ navigation }) {
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addresses`);
      setAddresses(response.data);
      if (response.data.length > 0) {
        setSelectedAddress(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const takePhoto = () => {
    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.assets) {
        setSelectedPhoto(response.assets[0]);
      }
    });
  };

  const pickPhoto = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.assets) {
        setSelectedPhoto(response.assets[0]);
      }
    });
  };

  const handleAddItem = async () => {
    if (!itemName || !selectedAddress) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Create item
      const itemResponse = await axios.post(`${API_BASE_URL}/items`, {
        name: itemName,
        description,
        quantity: parseInt(quantity),
        storageLocationId: 1, // TODO: Allow user to select location
      });

      // Upload photo if selected
      if (selectedPhoto) {
        await axios.post(`${API_BASE_URL}/item-photos`, {
          itemId: itemResponse.data.id,
          photoPath: selectedPhoto.uri,
        });
      }

      alert('Item added successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Failed to add item');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Item Name *</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter item name"
        value={itemName}
        onChangeText={setItemName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Enter description"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <Text style={styles.label}>Quantity</Text>
      <TextInput
        style={styles.input}
        placeholder="1"
        value={quantity}
        onChangeText={setQuantity}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Photo</Text>
      <View style={styles.photoButtonContainer}>
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
          <Text style={styles.photoButtonText}>Take Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoButton} onPress={pickPhoto}>
          <Text style={styles.photoButtonText}>Pick Photo</Text>
        </TouchableOpacity>
      </View>

      {selectedPhoto && (
        <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreview} />
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleAddItem}>
        <Text style={styles.submitButtonText}>Add Item</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 12,
  },
  submitButton: {
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
