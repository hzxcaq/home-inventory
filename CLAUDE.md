# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

家庭物品保存位置记录系统 - 一个多平台应用，用于跨多个地址、房间和储物位置追踪家庭物品。系统由三个独立的应用组成：

- **Backend**: Java Spring Boot REST API（端口 8080）
- **Web**: React Web 应用，支持国际化（中英文）
- **Mobile**: React Native 移动应用

## 构建和运行命令

### 后端（Java Spring Boot）
```bash
cd backend
mvn clean install          # 构建项目
mvn spring-boot:run        # 运行后端服务器
mvn test                   # 运行测试
```

后端运行在 `http://localhost:8080`，使用 H2 内存数据库。H2 控制台可通过 `http://localhost:8080/h2-console` 访问。

### Web 应用（React）
```bash
cd web
npm install                # 安装依赖
npm start                  # 启动开发服务器（端口 3000）
npm run build              # 生产环境构建
npm test                   # 运行测试
```

### 移动应用（React Native）
```bash
cd mobile
npm install                # 安装依赖
npm start                  # 启动 Metro bundler
npm run android            # 在 Android 上运行
npm run ios                # 在 iOS 上运行
npm test                   # 运行测试
npm run lint               # 运行 ESLint
```

## 架构设计

### 数据模型层级关系

系统遵循严格的层级数据模型：

```
Address（地址/房子）
  └── Room（房间：卧室、厨房等）
      └── StorageLocation（储物位置：柜子、抽屉、架子）
          └── Item（实际的家庭物品）
              └── ItemPhoto（物品照片）
```

每个实体都有指向其父级的外键关系：
- `Room.address_id` → `Address.id`
- `StorageLocation.room_id` → `Room.id`
- `Item.storage_location_id` → `StorageLocation.id`
- `ItemPhoto.item_id` → `Item.id`

此外，`Item.category_id` → `Category.id`（可选的分类）。

### 后端结构

**包名**: `com.homeinventory`

- **entity/**: JPA 实体类，使用 Lombok 注解（@Data, @NoArgsConstructor, @AllArgsConstructor）
  - 所有实体都有 `id`、`createdAt`、`updatedAt` 字段
  - `Room` 有 `floorPlanData`（TEXT 类型）用于存储户型图编辑器数据
  - `StorageLocation` 有 `positionX`、`positionY` 用于在户型图上定位

- **repository/**: Spring Data JPA 仓库，继承 `JpaRepository`
  - 支持层级查询的自定义方法：
    - `RoomRepository.findByAddressId(Long)` - 查询特定地址下的所有房间
    - `StorageLocationRepository.findByRoomId(Long)` - 查询特定房间下的所有储物位置
    - `ItemRepository.findByStorageLocationId(Long)` - 查询特定储物位置下的所有物品
    - `ItemRepository.searchByKeyword(String)` - 使用 JPQL 按名称或描述搜索物品

- **controller/**: REST 控制器，提供标准 CRUD 端点
  - GET `/api/{entity}` - 列出所有
  - GET `/api/{entity}/{id}` - 根据 ID 获取
  - POST `/api/{entity}` - 创建
  - PUT `/api/{entity}/{id}` - 更新
  - DELETE `/api/{entity}/{id}` - 删除
  - 特殊端点：
    - GET `/api/items/location/{locationId}` - 根据储物位置获取物品
    - GET `/api/items/search?keyword={keyword}` - 搜索物品（按名称或描述）

**数据库**: H2 内存数据库（重启后重置）。配置在 `application.properties` 中使用 `spring.jpa.hibernate.ddl-auto=create-drop`。

### Web 应用结构

**框架**: React 18 + React Router v6

**路由结构**: 遵循层级导航模式
- `/` - 首页
- `/addresses` - 地址列表
- `/address/:id/rooms` - 特定地址下的房间列表
- `/room/:id/storage-locations` - 特定房间下的储物位置列表
- `/room/:id/items` - 特定房间下的物品列表（跨所有储物位置）

- **src/i18n.js**: i18next 配置，支持中英文翻译
  - 翻译文件存储在 `src/locales/en.json` 和 `src/locales/zh.json`
  - 语言偏好保存在 localStorage 中

- **src/components/**: 可复用组件
  - `LanguageSwitcher.js` - 中英文切换
  - `Navigation.js` - 主导航组件

- **src/pages/**: 对应每个实体的页面组件
  - `AddressPage.js`、`RoomPage.js`、`StorageLocationPage.js`、`ItemPage.js`
  - 每个页面处理其实体的 CRUD 操作

**API 通信**: 使用 axios 与后端通信，地址为 `http://localhost:8080/api`

### 移动应用结构

**框架**: React Native 0.73 + React Navigation

- **导航**: 底部标签栏 + 堆栈导航
- **屏幕**: `HomeScreen`、`AddItemScreen`、`SearchScreen`、`SettingsScreen`
- **图片处理**: 使用 `react-native-image-picker` 和 `react-native-camera` 进行照片拍摄

## 关键技术细节

### 国际化（i18n）
Web 应用通过 react-i18next 支持中英文。添加新的 UI 文本时：
1. 在 `web/src/locales/en.json` 和 `web/src/locales/zh.json` 中添加翻译键
2. 在组件中使用 `useTranslation()` hook：`const { t } = useTranslation();`
3. 使用 `t('key.path')` 引用键值

### 户型图功能
房间可以在 `floorPlanData` 字段（TEXT 列）中存储户型图数据。储物位置可以使用 `positionX` 和 `positionY` 坐标在户型图上定位。

### 数据库持久化
后端使用 H2 内存数据库，采用 `create-drop` 策略。服务器重启后数据会丢失。要持久化数据，需修改 `application.properties` 使用基于文件的 H2 或其他数据库。

## 开发注意事项

- 后端使用 Java 8 和 Spring Boot 2.7.17
- 所有后端实体使用 Lombok - 确保 IDE 中安装了 Lombok 插件
- Web 应用使用 Create React App（react-scripts 5.0.1）
- 移动应用需要配置 React Native 开发环境（Android Studio/Xcode）
- 当前未实现身份验证/授权

## 测试注意事项
- 每次修改后进行测试，刷新前端的同时要记得后端也得重启进行更新
- 后端重启更新，要记得先停止上一次的进程再进行启动


