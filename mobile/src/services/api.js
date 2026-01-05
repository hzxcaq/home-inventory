import axios from 'axios';

// API基础URL - 在生产环境中需要修改为实际的服务器地址
const API_BASE_URL = 'http://10.0.2.2:8080/api'; // Android模拟器
// const API_BASE_URL = 'http://localhost:8080/api'; // iOS模拟器
// const API_BASE_URL = 'https://your-domain.com/api'; // 生产环境

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

// 地址相关API
export const addressAPI = {
  getAll: () => api.get('/addresses'),
  getById: (id) => api.get(`/addresses/${id}`),
  create: (data) => api.post('/addresses', data),
  update: (id, data) => api.put(`/addresses/${id}`, data),
  delete: (id) => api.delete(`/addresses/${id}`),
};

// 房间相关API
export const roomAPI = {
  getAll: () => api.get('/rooms'),
  getById: (id) => api.get(`/rooms/${id}`),
  getByAddressId: (addressId) => api.get(`/rooms/address/${addressId}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  delete: (id) => api.delete(`/rooms/${id}`),
  createBatch: (data) => api.post('/rooms/batch', data),
};

// 储物位置相关API
export const storageLocationAPI = {
  getAll: () => api.get('/storage-locations'),
  getById: (id) => api.get(`/storage-locations/${id}`),
  getByRoomId: (roomId) => api.get(`/storage-locations/room/${roomId}`),
  create: (data) => api.post('/storage-locations', data),
  update: (id, data) => api.put(`/storage-locations/${id}`, data),
  delete: (id) => api.delete(`/storage-locations/${id}`),
  createBatch: (data) => api.post('/storage-locations/batch', data),
};

// 物品相关API
export const itemAPI = {
  getAll: () => api.get('/items'),
  getById: (id) => api.get(`/items/${id}`),
  getByStorageLocationId: (locationId) => api.get(`/items/location/${locationId}`),
  search: (keyword) => api.get(`/items/search?keyword=${encodeURIComponent(keyword)}`),
  create: (data) => api.post('/items', data),
  update: (id, data) => api.put(`/items/${id}`, data),
  delete: (id) => api.delete(`/items/${id}`),
};

// 物品照片相关API
export const itemPhotoAPI = {
  getByItemId: (itemId) => api.get(`/item-photos/item/${itemId}`),
  upload: (itemId, formData) => {
    return api.post(`/item-photos/upload/${itemId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  delete: (photoId) => api.delete(`/item-photos/${photoId}`),
};

// 搜索API
export const searchAPI = {
  global: async (query) => {
    try {
      const [itemsResponse, roomsResponse, locationsResponse] = await Promise.all([
        itemAPI.getAll(),
        roomAPI.getAll(),
        storageLocationAPI.getAll()
      ]);

      const searchResults = [];

      // 搜索物品
      const items = itemsResponse.data.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(query.toLowerCase()))
      );

      items.forEach(item => {
        searchResults.push({
          id: `item-${item.id}`,
          type: 'item',
          name: item.name,
          description: item.description,
          location: `${item.storageLocation?.room?.address?.name} > ${item.storageLocation?.room?.name} > ${item.storageLocation?.name}`,
          data: item
        });
      });

      // 搜索房间
      const rooms = roomsResponse.data.filter(room =>
        room.name.toLowerCase().includes(query.toLowerCase())
      );

      rooms.forEach(room => {
        searchResults.push({
          id: `room-${room.id}`,
          type: 'room',
          name: room.name,
          location: room.address?.name,
          data: room
        });
      });

      // 搜索储物位置
      const locations = locationsResponse.data.filter(location =>
        location.name.toLowerCase().includes(query.toLowerCase()) ||
        (location.type && location.type.toLowerCase().includes(query.toLowerCase()))
      );

      locations.forEach(location => {
        searchResults.push({
          id: `location-${location.id}`,
          type: 'location',
          name: location.name,
          description: location.type,
          location: `${location.room?.address?.name} > ${location.room?.name}`,
          data: location
        });
      });

      return { data: searchResults };
    } catch (error) {
      console.error('Global search error:', error);
      throw error;
    }
  }
};

export default api;