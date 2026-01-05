import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

// 导入i18n配置
import './i18n';

// 导入屏幕组件
import HomeScreen from './screens/HomeScreen';
import AddressListScreen from './screens/AddressListScreen';
import RoomListScreen from './screens/RoomListScreen';
import StorageLocationListScreen from './screens/StorageLocationListScreen';
import ItemListScreen from './screens/ItemListScreen';
import AddAddressScreen from './screens/AddAddressScreen';
import AddRoomScreen from './screens/AddRoomScreen';
import AddStorageLocationScreen from './screens/AddStorageLocationScreen';
import AddItemScreen from './screens/AddItemScreen';
import SearchScreen from './screens/SearchScreen';
import SettingsScreen from './screens/SettingsScreen';
import ItemDetailScreen from './screens/ItemDetailScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 主页导航栈
function HomeStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#06b6d4',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: t('home') }}
      />
      <Stack.Screen
        name="AddressList"
        component={AddressListScreen}
        options={{ title: t('addresses') }}
      />
      <Stack.Screen
        name="RoomList"
        component={RoomListScreen}
        options={{ title: t('rooms') }}
      />
      <Stack.Screen
        name="StorageLocationList"
        component={StorageLocationListScreen}
        options={{ title: t('storageLocations') }}
      />
      <Stack.Screen
        name="ItemList"
        component={ItemListScreen}
        options={{ title: t('items') }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: t('items') }}
      />
      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ title: t('addAddress') }}
      />
      <Stack.Screen
        name="AddRoom"
        component={AddRoomScreen}
        options={{ title: t('addRoom') }}
      />
      <Stack.Screen
        name="AddStorageLocation"
        component={AddStorageLocationScreen}
        options={{ title: t('addLocation') }}
      />
      <Stack.Screen
        name="AddItem"
        component={AddItemScreen}
        options={{ title: t('addItem') }}
      />
    </Stack.Navigator>
  );
}

// 搜索导航栈
function SearchStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#06b6d4',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="SearchMain"
        component={SearchScreen}
        options={{ title: t('search') }}
      />
    </Stack.Navigator>
  );
}

// 设置导航栈
function SettingsStack() {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#06b6d4',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="SettingsMain"
        component={SettingsScreen}
        options={{ title: t('settings') }}
      />
    </Stack.Navigator>
  );
}

// 获取Tab图标
const getTabBarIcon = (routeName, focused) => {
  let icon;
  switch (routeName) {
    case 'Home':
      icon = focused ? '🏠' : '🏡';
      break;
    case 'Search':
      icon = focused ? '🔍' : '🔎';
      break;
    case 'Settings':
      icon = focused ? '⚙️' : '⚙️';
      break;
    default:
      icon = '📱';
  }
  return icon;
};

export default function App() {
  const { t } = useTranslation();

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => {
            const icon = getTabBarIcon(route.name, focused);
            return <span style={{ fontSize: 24 }}>{icon}</span>;
          },
          tabBarActiveTintColor: '#06b6d4',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#e0e0e0',
            height: 60,
            paddingBottom: 8,
            paddingTop: 8,
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{ title: t('home') }}
        />
        <Tab.Screen
          name="Search"
          component={SearchStack}
          options={{ title: t('search') }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsStack}
          options={{ title: t('settings') }}
        />
      </Tab.Navigator>

      {/* Toast消息组件 */}
      <Toast />
    </NavigationContainer>
  );
}
