# 数据库 Schema 设计

## 核心实体

### 1. Address（地址）
```sql
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Room（房间）
```sql
CREATE TABLE rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  address_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  floor_plan_data TEXT,  -- JSON 格式的户型图数据
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (address_id) REFERENCES addresses(id)
);
```

### 3. StorageLocation（储物位置）
```sql
CREATE TABLE storage_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT,  -- 如: 柜子, 抽屉, 架子等
  position_x REAL,  -- 户型图中的 X 坐标
  position_y REAL,  -- 户型图中的 Y 坐标
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);
```

### 4. Category（物品分类）
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Item（物品）
```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  storage_location_id INTEGER NOT NULL,
  category_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (storage_location_id) REFERENCES storage_locations(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
```

### 6. ItemPhoto（物品照片）
```sql
CREATE TABLE item_photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  photo_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id)
);
```

## 关系图

```
Address (1) ──── (N) Room
                    │
                    ├─── (N) StorageLocation
                            │
                            └─── (N) Item ──── (N) ItemPhoto
                                    │
                                    └─── (1) Category
```

## 查询示例

### 查找某个地址下所有房间的物品
```sql
SELECT i.*, sl.name as location_name, r.name as room_name, c.name as category_name
FROM items i
JOIN storage_locations sl ON i.storage_location_id = sl.id
JOIN rooms r ON sl.room_id = r.id
JOIN categories c ON i.category_id = c.id
WHERE r.address_id = ?
ORDER BY r.name, sl.name;
```

### 搜索物品
```sql
SELECT i.*, sl.name as location_name, r.name as room_name
FROM items i
JOIN storage_locations sl ON i.storage_location_id = sl.id
JOIN rooms r ON sl.room_id = r.id
WHERE i.name LIKE ? OR i.description LIKE ?
ORDER BY r.name, sl.name;
```
