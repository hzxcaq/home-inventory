import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 翻译资源
const resources = {
  en: {
    translation: {
      // 通用
      appName: 'Home Inventory',
      home: 'Home',
      addresses: 'Addresses',
      rooms: 'Rooms',
      storageLocations: 'Storage Locations',
      items: 'Items',
      search: 'Search',
      settings: 'Settings',

      // 操作
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      loading: 'Loading...',

      // 地址
      addAddress: 'Add Address',
      addressName: 'Address Name',
      address: 'Address',
      manageAddresses: 'Manage Addresses',

      // 房间
      addRoom: 'Add Room',
      roomName: 'Room Name',
      manageRooms: 'Manage Rooms',

      // 储物位置
      addLocation: 'Add Location',
      locationName: 'Location Name',
      type: 'Type',

      // 物品
      addItem: 'Add Item',
      itemName: 'Item Name',
      description: 'Description',
      quantity: 'Quantity',
      photos: 'Photos',
      takePhoto: 'Take Photo',
      selectPhoto: 'Select Photo',

      // 搜索
      searchPlaceholder: 'Search items, rooms, locations...',
      searchResults: 'Search Results',
      noResults: 'No results found',

      // 消息
      addedSuccessfully: 'Added successfully',
      updatedSuccessfully: 'Updated successfully',
      deletedSuccessfully: 'Deleted successfully',
      failedToAdd: 'Failed to add',
      failedToUpdate: 'Failed to update',
      failedToDelete: 'Failed to delete',

      // 确认
      confirmDelete: 'Are you sure you want to delete this?',

      // 其他
      optional: 'Optional',
      required: 'Required',
      pleaseEnter: 'Please enter',
      viewItems: 'View Items',
      noPhotos: 'No photos yet',
      uploadPhoto: 'Upload Photo',
      uploading: 'Uploading...',
      uploadedSuccessfully: 'Uploaded successfully',
      failedToUpload: 'Failed to upload'
    }
  },
  zh: {
    translation: {
      // 通用
      appName: '家庭物品管理',
      home: '首页',
      addresses: '地址',
      rooms: '房间',
      storageLocations: '储物位置',
      items: '物品',
      search: '搜索',
      settings: '设置',

      // 操作
      add: '添加',
      edit: '编辑',
      delete: '删除',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      loading: '加载中...',

      // 地址
      addAddress: '添加地址',
      addressName: '地址名称',
      address: '地址',
      manageAddresses: '管理地址',

      // 房间
      addRoom: '添加房间',
      roomName: '房间名称',
      manageRooms: '管理房间',

      // 储物位置
      addLocation: '添加储物位置',
      locationName: '位置名称',
      type: '类型',

      // 物品
      addItem: '添加物品',
      itemName: '物品名称',
      description: '描述',
      quantity: '数量',
      photos: '照片',
      takePhoto: '拍照',
      selectPhoto: '选择照片',

      // 搜索
      searchPlaceholder: '搜索物品、房间、储物位置...',
      searchResults: '搜索结果',
      noResults: '未找到结果',

      // 消息
      addedSuccessfully: '添加成功',
      updatedSuccessfully: '更新成功',
      deletedSuccessfully: '删除成功',
      failedToAdd: '添加失败',
      failedToUpdate: '更新失败',
      failedToDelete: '删除失败',

      // 确认
      confirmDelete: '确定要删除吗？',

      // 其他
      optional: '可选',
      required: '必填',
      pleaseEnter: '请输入',
      viewItems: '查看物品',
      noPhotos: '暂无照片',
      uploadPhoto: '上传照片',
      uploading: '上传中...',
      uploadedSuccessfully: '上传成功',
      failedToUpload: '上传失败'
    }
  }
};

// 获取保存的语言设置
const getStoredLanguage = async () => {
  try {
    const language = await AsyncStorage.getItem('language');
    return language || 'zh'; // 默认中文
  } catch (error) {
    return 'zh';
  }
};

// 保存语言设置
export const saveLanguage = async (language) => {
  try {
    await AsyncStorage.setItem('language', language);
    i18n.changeLanguage(language);
  } catch (error) {
    console.error('Failed to save language:', error);
  }
};

// 初始化i18n
const initI18n = async () => {
  const language = await getStoredLanguage();

  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: language,
      fallbackLng: 'zh',
      interpolation: {
        escapeValue: false,
      },
    });
};

initI18n();

export default i18n;