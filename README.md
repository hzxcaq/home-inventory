# Home Inventory System

家庭物品保存位置记录系统 - 一个现代化的多平台家庭物品管理应用

## 项目概述

这是一个功能完整的家庭物品管理系统，支持多地址、多房间的物品追踪和管理。系统采用前后端分离架构，提供Web端和移动端两种访问方式。

## 项目结构

```
home-inventory/
├── backend/          # Java Spring Boot 后端 API
├── web/             # React Web 应用
├── mobile/          # React Native 移动应用
└── README.md        # 项目文档
```

## 功能特性

### 🏠 多层级管理
- **地址管理**: 支持多个房子/地址
- **房间管理**: 每个地址下的房间管理
- **储物位置管理**: 房间内的具体储物位置（柜子、抽屉等）
- **物品管理**: 具体物品的详细信息和位置追踪

### 📱 现代化界面
- **响应式设计**: 完美适配桌面端和移动端
- **双视图模式**: 列表视图和网格视图自由切换
- **全局搜索**: 智能搜索物品、房间、储物位置
- **面包屑导航**: 清晰的层级导航和快速跳转
- **国际化支持**: 中英文双语界面

### 📸 物品记录
- **照片上传**: 支持多张照片记录物品外观
- **详细信息**: 物品名称、描述、数量等
- **位置追踪**: 完整的位置路径显示
- **快速操作**: 模态框式的添加和编辑

### 🔍 智能搜索
- **实时搜索**: 输入即搜，300ms防抖
- **多类型搜索**: 同时搜索物品、房间、储物位置
- **精确定位**: 点击搜索结果直接跳转到对应页面
- **路径显示**: 搜索结果显示完整位置路径

## 技术栈

### 后端 (Backend)
- **框架**: Spring Boot 2.7.17
- **语言**: Java 8
- **数据库**: H2 (内存数据库)
- **构建工具**: Maven 3.x
- **API**: RESTful API
- **文件上传**: 支持最大10MB图片上传

### 前端 (Web)
- **框架**: React 18.2.0
- **路由**: React Router v6
- **HTTP客户端**: Axios
- **国际化**: react-i18next
- **构建工具**: Create React App
- **样式**: 原生CSS + 现代化设计

### 移动端 (Mobile)
- **框架**: React Native 0.73
- **导航**: React Navigation
- **相机**: react-native-image-picker

## 系统要求

### 开发环境
- **Node.js**: 16.x 或更高版本
- **Java**: JDK 8 或更高版本
- **Maven**: 3.6.x 或更高版本
- **Git**: 用于版本控制

### 生产环境
- **服务器**: 1 CPU核心, 1GB RAM (最低配置)
- **推荐配置**: 2 CPU核心, 2GB RAM
- **存储空间**: 500MB (系统) + 用户数据存储
- **操作系统**: Linux/Windows/macOS
- **Java运行时**: JRE 8+

## 快速开始

### 1. 克隆项目
```bash
git clone https://github.com/hzxcaq/home-inventory.git
cd home-inventory
```

### 2. 启动后端
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
后端将在 http://localhost:8080 启动

### 3. 启动前端
```bash
cd web
npm install
npm start
```
前端将在 http://localhost:3000 启动

### 4. 访问应用
打开浏览器访问 http://localhost:3000

## 生产环境部署

### 方案一：传统服务器部署

#### 资源需求
- **CPU**: 2核心 (推荐)
- **内存**: 2GB RAM (推荐)
- **存储**: 1GB 可用空间
- **网络**: 公网IP或域名
- **端口**: 80/443 (Web), 8080 (API)

#### 部署步骤

##### 1. 准备服务器环境
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install openjdk-8-jre nginx

# CentOS/RHEL
sudo yum update
sudo yum install java-1.8.0-openjdk nginx
```

##### 2. 构建应用
```bash
# 构建后端
cd backend
mvn clean package -DskipTests
# 生成文件: target/home-inventory-backend-1.0.0.jar (约38MB)

# 构建前端
cd ../web
npm install
npm run build
# 生成目录: build/ (约100KB gzipped)
```

##### 3. 部署后端
```bash
# 创建应用目录
sudo mkdir -p /opt/home-inventory
sudo cp backend/target/home-inventory-backend-1.0.0.jar /opt/home-inventory/

# 创建systemd服务
sudo tee /etc/systemd/system/home-inventory.service > /dev/null <<EOF
[Unit]
Description=Home Inventory Backend
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/home-inventory
ExecStart=/usr/bin/java -jar home-inventory-backend-1.0.0.jar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 启动服务
sudo systemctl daemon-reload
sudo systemctl enable home-inventory
sudo systemctl start home-inventory
```

##### 4. 部署前端 (Nginx)
```bash
# 复制构建文件
sudo cp -r web/build/* /var/www/html/

# 配置Nginx
sudo tee /etc/nginx/sites-available/home-inventory > /dev/null <<EOF
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    root /var/www/html;
    index index.html;

    # 前端路由支持
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # 静态文件缓存
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/home-inventory /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

##### 5. SSL证书配置 (可选)
```bash
# 使用Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 方案二：Docker部署

#### 创建Dockerfile (后端)
```dockerfile
# backend/Dockerfile
FROM openjdk:8-jre-alpine
VOLUME /tmp
COPY target/home-inventory-backend-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]
```

#### 创建Dockerfile (前端)
```dockerfile
# web/Dockerfile
FROM nginx:alpine
COPY build/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

#### Docker Compose配置
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./web
    ports:
      - "80:80"
    depends_on:
      - backend
```

#### 部署命令
```bash
# 构建和启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 方案三：云平台部署

#### Vercel (前端)
```bash
# 安装Vercel CLI
npm i -g vercel

# 部署前端
cd web
vercel --prod
```

#### Railway/Heroku (后端)
```bash
# 添加Procfile
echo "web: java -jar target/home-inventory-backend-1.0.0.jar" > backend/Procfile

# 推送到平台
git subtree push --prefix=backend heroku master
```

## 配置说明

### 环境变量配置
```bash
# 后端环境变量
export SERVER_PORT=8080
export DB_URL=jdbc:h2:mem:testdb
export UPLOAD_DIR=uploads
export MAX_FILE_SIZE=10MB

# 前端环境变量 (web/.env)
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_UPLOAD_URL=http://localhost:8080/uploads
```

### 数据库配置
```properties
# 生产环境建议使用持久化数据库
spring.datasource.url=jdbc:h2:file:./data/inventory
spring.jpa.hibernate.ddl-auto=update
```

## 性能优化

### 前端优化
- **代码分割**: 使用React.lazy()进行路由级别的代码分割
- **图片优化**: 压缩上传图片，使用WebP格式
- **缓存策略**: 静态资源设置长期缓存
- **CDN**: 使用CDN加速静态资源加载

### 后端优化
- **数据库连接池**: 配置合适的连接池大小
- **缓存**: 添加Redis缓存热点数据
- **文件存储**: 使用对象存储服务(如AWS S3)
- **负载均衡**: 多实例部署时使用负载均衡

## 监控和维护

### 日志管理
```bash
# 查看应用日志
sudo journalctl -u home-inventory -f

# 查看Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 备份策略
```bash
# 数据库备份 (如果使用文件数据库)
cp /opt/home-inventory/data/inventory.mv.db /backup/

# 上传文件备份
tar -czf /backup/uploads-$(date +%Y%m%d).tar.gz /opt/home-inventory/uploads/
```

### 更新部署
```bash
# 更新后端
sudo systemctl stop home-inventory
sudo cp new-version.jar /opt/home-inventory/home-inventory-backend-1.0.0.jar
sudo systemctl start home-inventory

# 更新前端
sudo cp -r new-build/* /var/www/html/
```

## 故障排除

### 常见问题

1. **端口占用**
```bash
# 检查端口占用
sudo netstat -tlnp | grep :8080
sudo lsof -i :8080
```

2. **内存不足**
```bash
# 调整JVM内存
java -Xmx512m -jar home-inventory-backend-1.0.0.jar
```

3. **文件上传失败**
```bash
# 检查上传目录权限
sudo chown -R www-data:www-data /opt/home-inventory/uploads/
sudo chmod 755 /opt/home-inventory/uploads/
```

4. **前端API连接失败**
- 检查API_URL配置
- 确认后端服务状态
- 检查防火墙设置

## 开发指南

### 本地开发
```bash
# 启动开发环境
npm run dev:all  # 同时启动前后端

# 代码格式化
npm run format

# 运行测试
npm test
```

### 贡献指南
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目地址: https://github.com/hzxcaq/home-inventory
- 问题反馈: https://github.com/hzxcaq/home-inventory/issues

---

**注意**: 本系统目前使用内存数据库，重启后数据会丢失。生产环境建议配置持久化数据库。
