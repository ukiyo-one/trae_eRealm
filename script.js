// 事件总线系统
class EventBus {
    constructor() {
        this.events = {};
    }

    // 订阅事件
    on(event, callback) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    // 发布事件
    emit(event, data) {
        if (this.events[event]) {
            this.events[event].forEach(callback => {
                callback(data);
            });
        }
    }

    // 取消订阅
    off(event, callback) {
        if (this.events[event]) {
            this.events[event] = this.events[event].filter(cb => cb !== callback);
        }
    }
}

// 全局事件总线
const eventBus = new EventBus();

// 背景效果管理器
class BackgroundEffectManager {
    constructor() {
        // 创建国际象棋棋盘背景
        this.createChessboardBackground();

        // 创建鼠标影响区域
        this.createMouseInfluenceArea();

        // 拖尾数组
        this.trails = [];
        this.maxTrails = 15;
        this.mousePosition = { x: 0, y: 0 };

        // 监听鼠标移动事件
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
            this.createTrail(e.clientX, e.clientY);
            this.updateGridDeformation(e.clientX, e.clientY);
        });

        // 监听触摸移动事件
        document.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                this.mousePosition.x = touch.clientX;
                this.mousePosition.y = touch.clientY;
                this.createTrail(touch.clientX, touch.clientY);
                this.updateGridDeformation(touch.clientX, touch.clientY);
            }
        });

        // 定期清理过期拖尾
        setInterval(() => {
            this.cleanupTrails();
        }, 100);
    }

    // 创建国际象棋棋盘背景
    createChessboardBackground() {
        this.chessboard = document.createElement('div');
        this.chessboard.id = 'chessboard-background';
        document.body.appendChild(this.chessboard);
    }

    // 创建鼠标影响区域
    createMouseInfluenceArea() {
        this.mouseInfluence = document.createElement('div');
        this.mouseInfluence.id = 'mouse-influence';
        document.body.appendChild(this.mouseInfluence);

        // 初始化网格形变元素
        this.gridElements = [];
        const gridSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'));
        const cols = Math.ceil(window.innerWidth / gridSize) + 2;
        const rows = Math.ceil(window.innerHeight / gridSize) + 2;

        for (let i = 0; i < cols * rows; i++) {
            const gridElement = document.createElement('div');
            gridElement.className = 'grid-deformation';
            gridElement.style.width = `${gridSize}px`;
            gridElement.style.height = `${gridSize}px`;
            gridElement.style.left = `${(i % cols - 1) * gridSize}px`;
            gridElement.style.top = `${(Math.floor(i / cols) - 1) * gridSize}px`;
            this.mouseInfluence.appendChild(gridElement);
            this.gridElements.push(gridElement);
        }
    }

    // 创建拖尾
    createTrail(x, y) {
        // 限制拖尾数量
        if (this.trails.length >= this.maxTrails) {
            const oldTrail = this.trails.shift();
            if (oldTrail && oldTrail.parentNode) {
                oldTrail.remove();
            }
        }

        // 创建拖尾元素
        const trail = document.createElement('div');
        trail.className = 'trail';
        trail.style.left = `${x}px`;
        trail.style.top = `${y}px`;

        // 使用黑白红配色方案
        const colors = [
            '#ff0000', // 红色
            '#ffffff', // 白色
            '#000000'  // 黑色
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        trail.style.background = `radial-gradient(circle, ${randomColor} 0%, transparent 70%)`;
        trail.style.boxShadow = `0 0 30px ${randomColor}, 0 0 60px ${randomColor}, inset 0 0 20px rgba(255, 255, 255, 0.2)`;

        // 随机角度用于不规则效果
        const randomAngle = Math.floor(Math.random() * 360);
        trail.style.setProperty('--angle', randomAngle);

        // 添加到容器
        document.body.appendChild(trail);
        this.trails.push(trail);
    }

    // 更新网格形变
    updateGridDeformation(mouseX, mouseY) {
        const gridSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--grid-size'));

        this.gridElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            // 计算距离鼠标的距离
            const distance = Math.sqrt(
                Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
            );

            // 影响范围
            const influenceRadius = 200;

            if (distance < influenceRadius) {
                // 计算形变强度
                const intensity = 1 - (distance / influenceRadius);

                // 计算形变方向
                const angle = Math.atan2(mouseY - centerY, mouseX - centerX);
                const offsetX = Math.cos(angle) * intensity * 20;
                const offsetY = Math.sin(angle) * intensity * 20;

                // 应用形变
                element.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${1 + intensity * 0.2}) rotate(${intensity * 5}deg)`;
                element.style.opacity = `${intensity * 0.5}`;

                // 添加颜色效果
                const hue = (Math.random() * 60) + 0; // 红色系
                element.style.background = `radial-gradient(circle, hsla(${hue}, 100%, 50%, ${intensity * 0.3}) 0%, transparent 70%)`;
            } else {
                // 恢复原始状态
                element.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
                element.style.opacity = '0';
                element.style.background = 'radial-gradient(circle, rgba(255, 0, 0, 0) 0%, transparent 70%)';
            }
        });
    }

    // 清理过期拖尾
    cleanupTrails() {
        // 由于使用CSS动画，我们只需要检查是否已经消失
        this.trails = this.trails.filter(trail => {
            if (trail.parentNode) {
                return true;
            }
            return false;
        });
    }

    // 销毁所有效果
    destroy() {
        // 移除拖尾
        this.trails.forEach(trail => {
            if (trail.parentNode) {
                trail.remove();
            }
        });
        this.trails = [];

        // 移除背景和影响区域
        if (this.chessboard && this.chessboard.parentNode) {
            this.chessboard.remove();
        }
        if (this.mouseInfluence && this.mouseInfluence.parentNode) {
            this.mouseInfluence.remove();
        }
    }
}

// 基础变量
let scene, camera, renderer;
let currentScene = 0;
let scenes = [];
let sceneManager;
let uiManager;
let mouse = { x: 0, y: 0 };
let isMouseDown = false;
let cameraTarget = new THREE.Vector3(0, 1.6, 0);
let cameraPosition = new THREE.Vector3(0, 1.6, 5);
let keys = {};
let moveSpeed = 0.05;

// 场景管理器类
class SceneManager {
    constructor(mainScene, camera) {
        this.mainScene = mainScene;
        this.camera = camera;
        this.scenes = [];
        this.currentSceneIndex = 0;
        this.sceneConfigs = [
            { name: '城市', type: 'city', description: '高度现代化的城市，乙域的外围景观' },
            { name: '小镇', type: 'town', description: '富有风俗民情的小镇，乙域的特色区域' },
            { name: '村庄', type: 'village', description: '物种多样性丰富的村庄，暂时停止开放' },
            { name: '旷原', type: 'plain', description: '一望无垠的旷原，通向乙环的必经之路' },
            { name: '乙环', type: 'ethring', description: '乙域的核心地带，终极目的地' }
        ];

        // 订阅场景切换事件
        eventBus.on('scene:switch', (data) => {
            this.switchScene(data.sceneIndex);
        });

        // 订阅菜单选择事件
        eventBus.on('menu:select', (data) => {
            this.handleMenuSelect(data);
        });
    }

    // 初始化所有场景
    initScenes() {
        this.createScene0(); // 后室走廊
        this.createScene1(); // 泳池空间
        this.createScene2(); // 诡异教室
        this.createScene3(); // 旷原
        this.createScene4(); // 乙环
    }

    // 场景0：后室走廊
    createScene0() {
        const scene0 = new THREE.Group();
        scene0.name = '后室走廊';
        scene0.description = this.sceneConfigs[0].description;

        // 墙壁材质
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x999999 });
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
        const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });

        // 地板
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 100),
            floorMaterial
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene0.add(floor);

        // 天花板
        const ceiling = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 100),
            ceilingMaterial
        );
        ceiling.rotation.x = Math.PI / 2;
        ceiling.position.y = 3;
        ceiling.receiveShadow = true;
        scene0.add(ceiling);

        // 左侧墙壁
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 3),
            wallMaterial
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.x = -10;
        leftWall.position.y = 1.5;
        leftWall.receiveShadow = true;
        scene0.add(leftWall);

        // 右侧墙壁
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 3),
            wallMaterial
        );
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.x = 10;
        rightWall.position.y = 1.5;
        rightWall.receiveShadow = true;
        scene0.add(rightWall);

        // 添加走廊门
        for (let i = 0; i < 10; i++) {
            const door = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 2.5, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x555555 })
            );
            door.position.z = -i * 10;
            door.position.x = Math.random() > 0.5 ? -8 : 8;
            door.position.y = 1.25;
            door.castShadow = true;
            door.name = `door_${i}`;
            scene0.add(door);

            // 门把手
            const handle = new THREE.Mesh(
                new THREE.SphereGeometry(0.05, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
            );
            handle.position.set(door.position.x + (door.position.x > 0 ? -0.5 : 0.5), 1.25, door.position.z - 0.05);
            scene0.add(handle);
        }

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene0.add(ambientLight);

        for (let i = 0; i < 20; i++) {
            const light = new THREE.PointLight(0xccccff, 1, 10);
            light.position.set(0, 2.8, -i * 5);
            scene0.add(light);

            // 灯光闪烁效果
            light.intensity = 0.8 + Math.random() * 0.4;
            setInterval(() => {
                light.intensity = 0.6 + Math.random() * 0.6;
            }, 500 + Math.random() * 1000);
        }

        // 添加隐藏元素
        const hidden1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffaaaa, emissive: 0xff5555 })
        );
        hidden1.position.set(5, 0.5, -15);
        hidden1.name = 'hidden_element_1';
        scene0.add(hidden1);

        scene0.visible = true;
        this.scenes.push(scene0);
        this.mainScene.add(scene0);
    }

    // 场景1：泳池空间
    createScene1() {
        const scene1 = new THREE.Group();
        scene1.name = '泳池空间';
        scene1.description = this.sceneConfigs[1].description;

        // 泳池水材质
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0.8,
            metalness: 0.3,
            roughness: 0.1
        });

        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });

        // 地板
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 30),
            floorMaterial
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene1.add(floor);

        // 泳池
        const pool = new THREE.Mesh(
            new THREE.BoxGeometry(15, 2, 15),
            waterMaterial
        );
        pool.position.y = -1;
        pool.castShadow = true;
        pool.name = 'pool';
        scene1.add(pool);

        // 泳池边缘
        const poolEdge = new THREE.Mesh(
            new THREE.BoxGeometry(16, 0.5, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        scene1.add(poolEdge);

        // 泳池梯子
        for (let i = 0; i < 3; i++) {
            const step = new THREE.Mesh(
                new THREE.BoxGeometry(1, 0.1, 2),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            step.position.set(6, -0.9 + i * 0.3, 0);
            scene1.add(step);
        }

        // 添加超现实元素 - 悬浮椅子
        for (let i = 0; i < 5; i++) {
            const chair = new THREE.Mesh(
                new THREE.BoxGeometry(1, 0.8, 0.5),
                new THREE.MeshStandardMaterial({ color: 0xff8888 })
            );
            chair.position.set(
                -10 + Math.random() * 20,
                Math.random() * 3,
                -10 + Math.random() * 20
            );
            chair.rotation.y = Math.random() * Math.PI * 2;
            chair.name = `floating_chair_${i}`;
            scene1.add(chair);
        }

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x606060, 0.6);
        scene1.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        scene1.add(directionalLight);

        // 添加隐藏元素
        const hidden1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffff88, emissive: 0xffff00 })
        );
        hidden1.position.set(0, -0.5, 5);
        hidden1.name = 'hidden_element_1';
        scene1.add(hidden1);

        scene1.visible = false;
        this.scenes.push(scene1);
        this.mainScene.add(scene1);
    }

    // 场景2：诡异教室
    createScene2() {
        const scene2 = new THREE.Group();
        scene2.name = '诡异教室';
        scene2.description = this.sceneConfigs[2].description;

        // 材质
        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xccaa99 });
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x886644 });
        const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x664422 });
        const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x443322 });

        // 地板
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(25, 25),
            floorMaterial
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene2.add(floor);

        // 墙壁
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(25, 4),
            wallMaterial
        );
        backWall.position.z = -12.5;
        backWall.position.y = 2;
        scene2.add(backWall);

        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(25, 4),
            wallMaterial
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.x = -12.5;
        leftWall.position.y = 2;
        scene2.add(leftWall);

        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(25, 4),
            wallMaterial
        );
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.x = 12.5;
        rightWall.position.y = 2;
        scene2.add(rightWall);

        // 黑板
        const blackboard = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 4),
            new THREE.MeshStandardMaterial({ color: 0x222222 })
        );
        blackboard.position.set(0, 2.5, -12.4);
        blackboard.name = 'blackboard';
        scene2.add(blackboard);

        // 添加桌椅
        for (let i = 0; i < 15; i++) {
            const desk = new THREE.Mesh(
                new THREE.BoxGeometry(1.5, 0.7, 0.8),
                deskMaterial
            );
            desk.position.set(
                -10 + (i % 5) * 5,
                0.35,
                -8 + Math.floor(i / 5) * 4
            );
            desk.name = `desk_${i}`;
            scene2.add(desk);

            const chair = new THREE.Mesh(
                new THREE.BoxGeometry(0.6, 0.6, 0.6),
                chairMaterial
            );
            chair.position.set(
                -10 + (i % 5) * 5,
                0.3,
                -8 + Math.floor(i / 5) * 4 + 1
            );
            chair.name = `chair_${i}`;
            scene2.add(chair);
        }

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x333333, 0.4);
        scene2.add(ambientLight);

        const fluorescentLight = new THREE.RectAreaLight(0xccccff, 5, 4, 1);
        fluorescentLight.position.set(0, 3.8, 0);
        scene2.add(fluorescentLight);

        // 灯光闪烁
        setInterval(() => {
            fluorescentLight.intensity = 3 + Math.random() * 4;
        }, 200 + Math.random() * 800);

        // 添加隐藏元素
        const hidden1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xff88ff, emissive: 0xff00ff })
        );
        hidden1.position.set(-5, 1, -10);
        hidden1.name = 'hidden_element_1';
        scene2.add(hidden1);

        scene2.visible = false;
        this.scenes.push(scene2);
        this.mainScene.add(scene2);
    }

    // 场景3：旷原
    createScene3() {
        const scene3 = new THREE.Group();
        scene3.name = '旷原';
        scene3.description = this.sceneConfigs[3].description;

        // 材质
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const skyMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

        // 地面
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            groundMaterial
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene3.add(ground);

        // 添加超现实元素 - 悬浮岩石
        for (let i = 0; i < 10; i++) {
            const rock = new THREE.Mesh(
                new THREE.BoxGeometry(2, 2, 2),
                new THREE.MeshStandardMaterial({ color: 0x888888 })
            );
            rock.position.set(
                -40 + Math.random() * 80,
                Math.random() * 5 + 1,
                -40 + Math.random() * 80
            );
            rock.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );
            rock.name = `rock_${i}`;
            scene3.add(rock);
        }

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene3.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        scene3.add(directionalLight);

        // 添加隐藏元素
        const hidden1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.2, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0x88ff88, emissive: 0x00ff00 })
        );
        hidden1.position.set(0, 0.5, -20);
        hidden1.name = 'hidden_element_1';
        scene3.add(hidden1);

        scene3.visible = false;
        this.scenes.push(scene3);
        this.mainScene.add(scene3);
    }

    // 场景4：乙环
    createScene4() {
        const scene4 = new THREE.Group();
        scene4.name = '乙环';
        scene4.description = this.sceneConfigs[4].description;

        // 材质
        const ringMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.8, roughness: 0.2 });
        const centerMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });

        // 中心球体
        const center = new THREE.Mesh(
            new THREE.SphereGeometry(5, 32, 32),
            centerMaterial
        );
        scene4.add(center);

        // 环形结构
        const geometry = new THREE.TorusGeometry(15, 3, 16, 100);
        const ring = new THREE.Mesh(geometry, ringMaterial);
        scene4.add(ring);

        // 添加环形灯
        for (let i = 0; i < 32; i++) {
            const light = new THREE.PointLight(0xff0000, 1, 20);
            const angle = (i / 32) * Math.PI * 2;
            light.position.set(
                Math.cos(angle) * 15,
                Math.sin(angle) * 5,
                Math.sin(angle) * 15
            );
            scene4.add(light);
        }

        // 添加悬浮元素
        for (let i = 0; i < 20; i++) {
            const element = new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 16, 16),
                new THREE.MeshStandardMaterial({ color: 0xffffff })
            );
            const angle = (i / 20) * Math.PI * 2;
            const radius = 20 + Math.random() * 10;
            element.position.set(
                Math.cos(angle) * radius,
                Math.sin(angle) * 10,
                Math.sin(angle) * radius
            );
            element.name = `element_${i}`;
            scene4.add(element);
        }

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0x202020, 0.3);
        scene4.add(ambientLight);

        // 添加隐藏元素
        const hidden1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff })
        );
        hidden1.position.set(0, 0, 0);
        hidden1.name = 'hidden_element_1';
        scene4.add(hidden1);

        scene4.visible = false;
        this.scenes.push(scene4);
        this.mainScene.add(scene4);
    }

    // 场景切换
    switchScene(sceneIndex) {
        if (sceneIndex === this.currentSceneIndex) return;

        // 隐藏当前场景
        this.scenes[this.currentSceneIndex].visible = false;

        // 显示新场景
        this.scenes[sceneIndex].visible = true;
        this.currentSceneIndex = sceneIndex;

        // 发布场景切换完成事件
        eventBus.emit('scene:switched', {
            sceneIndex: sceneIndex,
            sceneName: this.scenes[sceneIndex].name,
            sceneDescription: this.scenes[sceneIndex].description
        });

        // 重置相机位置
        this.resetCamera();

        // 播放场景切换音效
        eventBus.emit('audio:play', { type: 'switch' });
    }

    // 重置相机位置（使用平滑过渡）
    resetCamera() {
        // 存储目标位置，让animate函数处理平滑过渡
        this.cameraResetTarget = {
            position: new THREE.Vector3(0, 1.6, 5),
            target: new THREE.Vector3(0, 1.6, 0)
        };
    }

    // 获取当前场景
    getCurrentScene() {
        return this.scenes[this.currentSceneIndex];
    }

    // 获取场景配置
    getSceneConfigs() {
        return this.sceneConfigs;
    }

    // 处理菜单选择
    handleMenuSelect(data) {
        const sceneType = data.sceneType;
        let sceneIndex = 0;

        // 根据场景类型查找对应的索引
        switch (sceneType) {
            case 'city':
                sceneIndex = 0;
                break;
            case 'town':
                sceneIndex = 1;
                break;
            case 'village':
                sceneIndex = 2;
                break;
            case 'plain':
                sceneIndex = 3;
                break;
            case 'ethring':
                sceneIndex = 4;
                break;
            default:
                sceneIndex = 0;
        }

        // 切换到对应的场景
        this.switchScene(sceneIndex);
    }
}

// UI管理器类
class UIManager {
    constructor() {
        this.menuButtons = document.querySelectorAll('.menu-btn');
        this.backButton = document.getElementById('back-to-menu');
        this.sceneConfigs = [];

        // 菜单滚动相关
        this.scrollContainer = null;
        this.scrollContent = null;
        this.scrollBar = null;
        this.scrollIndicator = null;
        this.scrollOffset = 0;
        this.maxScrollOffset = 0;
        this.scrollSpeed = 20;
        this.touchStartY = 0;
        this.touchStartScrollOffset = 0;
        this.isDragging = false;

        // 初始化UI和菜单事件
        this.initEvents();

        // 订阅场景切换完成事件
        eventBus.on('scene:switched', (data) => {
            this.updateUIAfterSceneSwitch(data);
        });

        // 订阅场景配置更新事件
        eventBus.on('scenes:configs', (data) => {
            this.sceneConfigs = data.configs;
        });

        // 初始状态：显示菜单，隐藏游戏UI
        this.container = document.getElementById('container');
        this.menu = document.getElementById('menu');
        this.ui = document.getElementById('ui');

        // 初始化菜单滚动
        this.initMenuScroll();
    }

    // 初始化菜单滚动
    initMenuScroll() {
        // 获取滚动相关元素
        this.scrollContainer = document.querySelector('.menu-scroll-container');
        this.scrollContent = document.querySelector('.menu-scroll-content');
        this.scrollBar = document.querySelector('.scroll-bar');
        this.scrollIndicator = document.querySelector('.scroll-indicator');

        // 延迟初始化，确保DOM已加载完成
        setTimeout(() => {
            // 计算最大滚动偏移量
            this.calculateMaxScrollOffset();
        }, 100);
    }

    // 计算最大滚动偏移量
    calculateMaxScrollOffset() {
        if (this.scrollContainer && this.scrollContent) {
            const containerHeight = this.scrollContainer.clientHeight;
            const contentHeight = this.scrollContent.scrollHeight;
            this.maxScrollOffset = Math.max(0, contentHeight - containerHeight);

            // 更新滚动指示器
            this.updateScrollIndicator();
        }
    }

    // 初始化UI事件
    initEvents() {
        // 菜单按钮事件
        this.menuButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sceneType = e.target.dataset.scene;
                this.handleMenuSelect(sceneType);
            });
        });

        // 返回菜单按钮事件
        if (this.backButton) {
            this.backButton.addEventListener('click', () => {
                this.showMenu();
            });
        }

        // 鼠标滚轮事件
        document.addEventListener('wheel', (e) => {
            // 只有菜单激活时才响应滚轮事件
            if (this.menu.classList.contains('menu-active')) {
                e.preventDefault();
                this.scrollMenu(e.deltaY);
            }
        }, { passive: false });

        // 触摸事件
        document.addEventListener('touchstart', (e) => {
            if (this.menu.classList.contains('menu-active')) {
                this.touchStartY = e.touches[0].clientY;
                this.touchStartScrollOffset = this.scrollOffset;
                this.isDragging = true;
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (this.isDragging && this.menu.classList.contains('menu-active')) {
                e.preventDefault();
                const deltaY = e.touches[0].clientY - this.touchStartY;
                this.scrollMenu(-deltaY);
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (this.menu.classList.contains('menu-active')) {
                switch (e.key) {
                    case 'ArrowUp':
                        e.preventDefault();
                        this.scrollMenu(-this.scrollSpeed);
                        break;
                    case 'ArrowDown':
                        e.preventDefault();
                        this.scrollMenu(this.scrollSpeed);
                        break;
                }
            }
        });

        // 窗口大小变化事件
        window.addEventListener('resize', () => {
            this.calculateMaxScrollOffset();
        });
    }

    // 滚动菜单
    scrollMenu(deltaY) {
        // 更新滚动偏移量
        this.scrollOffset += deltaY;

        // 应用边界限制
        this.scrollOffset = Math.max(0, Math.min(this.scrollOffset, this.maxScrollOffset));

        // 更新滚动位置
        this.updateScrollPosition();

        // 更新滚动指示器
        this.updateScrollIndicator();
    }

    // 更新滚动位置
    updateScrollPosition() {
        if (this.scrollContent) {
            this.scrollContent.style.transform = `translateY(${-this.scrollOffset}px)`;
        }
    }

    // 更新滚动指示器
    updateScrollIndicator() {
        if (this.scrollBar && this.maxScrollOffset > 0) {
            const scrollPercentage = this.scrollOffset / this.maxScrollOffset;
            const containerHeight = this.scrollIndicator.clientHeight;
            const barHeight = this.scrollBar.clientHeight;
            const maxBarOffset = containerHeight - barHeight;
            const barOffset = scrollPercentage * maxBarOffset;

            this.scrollBar.style.transform = `translateY(${barOffset}px)`;
        }
    }

    // 处理菜单选择
    handleMenuSelect(sceneType) {
        // 隐藏菜单，显示游戏场景
        this.hideMenu();

        // 发布菜单选择事件
        eventBus.emit('menu:select', { sceneType: sceneType });
    }

    // 更新场景切换后的UI
    updateUIAfterSceneSwitch(data) {
        // 更新场景信息
        this.updateSceneInfo(data);

        // 显示游戏UI
        this.showGameUI();
    }

    // 更新场景信息
    updateSceneInfo(data) {
        const sceneName = document.getElementById('scene-name');
        const sceneDescription = document.getElementById('scene-description');

        if (sceneName && sceneDescription) {
            sceneName.textContent = data.sceneName;
            sceneDescription.textContent = data.sceneDescription;
        }
        console.log(`当前场景：${data.sceneName} - ${data.sceneDescription}`);
    }

    // 显示菜单
    showMenu() {
        this.menu.classList.remove('fade-out');
        this.menu.classList.add('menu-active');
        this.container.classList.remove('show');
        this.ui.classList.remove('show');
    }

    // 隐藏菜单
    hideMenu() {
        this.menu.classList.remove('menu-active');
        this.menu.classList.add('fade-out');
        this.container.classList.add('show');
    }

    // 显示游戏UI
    showGameUI() {
        this.ui.classList.add('show');
    }

    // 隐藏游戏UI
    hideGameUI() {
        this.ui.classList.remove('show');
    }
}

// 初始化函数
function init() {
    // 初始化背景效果
    const backgroundEffectManager = new BackgroundEffectManager();

    // 创建场景
    scene = new THREE.Scene();

    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 5);
    camera.lookAt(0, 1.6, 0);

    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1); // 改为纯黑色背景
    renderer.shadowMap.enabled = true;
    document.getElementById('container').appendChild(renderer.domElement);

    // 添加事件监听
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);

    // 键盘事件监听
    document.addEventListener('keydown', (e) => {
        keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.code] = false;
    });

    // 初始化管理器
    sceneManager = new SceneManager(scene, camera);
    uiManager = new UIManager();

    // 初始化场景
    sceneManager.initScenes();

    // 发布场景配置信息
    eventBus.emit('scenes:configs', {
        configs: sceneManager.getSceneConfigs()
    });

    // 初始状态：显示菜单，隐藏游戏场景
    uiManager.showMenu();

    // 开始动画循环
    animate();

    // 初始化音效
    initAudio();
}

// 事件处理函数
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseDown() {
    isMouseDown = true;
    eventBus.emit('audio:play', { type: 'click' });
}

function onMouseUp() {
    isMouseDown = false;
}

function onTouchMove(event) {
    if (event.touches.length === 1) {
        event.preventDefault();
        mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
    }
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        event.preventDefault();
        isMouseDown = true;
        eventBus.emit('audio:play', { type: 'click' });
    }
}

function onTouchEnd(event) {
    isMouseDown = false;
}

// 动画循环
function animate() {
    requestAnimationFrame(animate);

    const time = Date.now() * 0.001;

    // 相机控制
    let targetX = mouse.x * 5;
    let targetY = mouse.y * 2 + 1.6;

    // 检查是否需要重置相机位置
    if (sceneManager.cameraResetTarget) {
        // 平滑过渡到重置目标位置
        const resetSpeed = 0.1;

        // 相机位置过渡
        camera.position.x += (sceneManager.cameraResetTarget.position.x - camera.position.x) * resetSpeed;
        camera.position.y += (sceneManager.cameraResetTarget.position.y - camera.position.y) * resetSpeed;
        camera.position.z += (sceneManager.cameraResetTarget.position.z - camera.position.z) * resetSpeed;

        // 相机目标过渡
        cameraTarget.x += (sceneManager.cameraResetTarget.target.x - cameraTarget.x) * resetSpeed;
        cameraTarget.y += (sceneManager.cameraResetTarget.target.y - cameraTarget.y) * resetSpeed;
        cameraTarget.z += (sceneManager.cameraResetTarget.target.z - cameraTarget.z) * resetSpeed;

        // 检查是否接近目标位置
        const positionDiff = camera.position.distanceTo(sceneManager.cameraResetTarget.position);
        const targetDiff = cameraTarget.distanceTo(sceneManager.cameraResetTarget.target);

        if (positionDiff < 0.1 && targetDiff < 0.1) {
            // 已经接近目标位置，完成重置
            camera.position.copy(sceneManager.cameraResetTarget.position);
            cameraTarget.copy(sceneManager.cameraResetTarget.target);
            sceneManager.cameraResetTarget = null;
        }
    } else {
        // 正常相机控制
        cameraTarget.x += (targetX - cameraTarget.x) * 0.05;
        cameraTarget.y += (targetY - cameraTarget.y) * 0.05;

        // 计算相机方向向量
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        // 侧面方向向量
        const sideDirection = new THREE.Vector3();
        sideDirection.copy(direction);
        sideDirection.cross(camera.up);
        sideDirection.normalize();

        // 键盘控制移动
        if (keys['KeyW'] || keys['ArrowUp']) {
            // 前进
            camera.position.add(direction.multiplyScalar(moveSpeed));
            cameraTarget.add(direction.multiplyScalar(moveSpeed));
        }
        if (keys['KeyS'] || keys['ArrowDown']) {
            // 后退
            camera.position.sub(direction.multiplyScalar(moveSpeed));
            cameraTarget.sub(direction.multiplyScalar(moveSpeed));
        }
        if (keys['KeyA'] || keys['ArrowLeft']) {
            // 左移
            camera.position.sub(sideDirection.multiplyScalar(moveSpeed));
            cameraTarget.sub(sideDirection.multiplyScalar(moveSpeed));
        }
        if (keys['KeyD'] || keys['ArrowRight']) {
            // 右移
            camera.position.add(sideDirection.multiplyScalar(moveSpeed));
            cameraTarget.add(sideDirection.multiplyScalar(moveSpeed));
        }
    }

    camera.lookAt(cameraTarget);

    // 获取当前场景
    const currentSceneGroup = sceneManager.getCurrentScene();

    // 场景0：后室走廊动画效果
    if (sceneManager.currentSceneIndex === 0) {
        currentSceneGroup.children.forEach((child, index) => {
            // 灯光闪烁
            if (child.type === 'PointLight') {
                child.intensity = 0.6 + Math.sin(time + index) * 0.4;
            }
            // 墙壁微妙移动
            if (child.geometry && child.geometry.type === 'PlaneGeometry' && child.position.y < 3) {
                child.position.x += Math.sin(time * 0.5 + index) * 0.001;
            }
        });
    }

    // 场景1：泳池空间动画效果
    if (sceneManager.currentSceneIndex === 1) {
        currentSceneGroup.children.forEach((child, index) => {
            // 泳池水波纹效果
            if (child.material && child.material.color.r === 0.2667) {
                child.rotation.y += 0.001;
                child.position.y = -1 + Math.sin(time + index) * 0.1;
                child.material.opacity = 0.7 + Math.sin(time * 2) * 0.1;
            }
            // 悬浮椅子浮动
            if (child.geometry && child.geometry.type === 'BoxGeometry' && child.material.color.r === 0.9961) {
                child.position.y += Math.sin(time + index) * 0.005;
                child.rotation.z += Math.sin(time * 0.5 + index) * 0.002;
            }
        });
    }

    // 场景2：诡异教室动画效果
    if (sceneManager.currentSceneIndex === 2) {
        currentSceneGroup.children.forEach((child, index) => {
            // 黑板微妙闪烁
            if (child.material && child.material.color.r === 0.1333) {
                child.material.emissive.r = Math.sin(time * 3) * 0.1;
            }
            // 桌椅微妙移动
            if (child.geometry && (child.geometry.type === 'BoxGeometry' || child.geometry.type === 'PlaneGeometry')) {
                if (child.position.y < 2) {
                    child.position.x += Math.sin(time * 0.3 + index) * 0.001;
                    child.position.z += Math.sin(time * 0.4 + index) * 0.001;
                }
            }
        });
    }

    // 场景3：旷原动画效果
    if (sceneManager.currentSceneIndex === 3) {
        currentSceneGroup.children.forEach((child, index) => {
            // 悬浮岩石浮动
            if (child.geometry && child.geometry.type === 'BoxGeometry' && child.material.color.r === 0.5333) {
                child.position.y += Math.sin(time + index) * 0.01;
                child.rotation.x += Math.sin(time * 0.5 + index) * 0.001;
                child.rotation.y += Math.sin(time * 0.3 + index) * 0.001;
            }
        });
    }

    // 场景4：乙环动画效果
    if (sceneManager.currentSceneIndex === 4) {
        currentSceneGroup.children.forEach((child, index) => {
            // 环形结构旋转
            if (child.geometry && child.geometry.type === 'TorusGeometry') {
                child.rotation.x += 0.001;
                child.rotation.y += 0.002;
            }
            // 悬浮元素围绕中心旋转
            if (child.geometry && child.geometry.type === 'SphereGeometry' && child.material.color.r === 1) {
                const angle = (time * 0.1 + index * 0.1) % (Math.PI * 2);
                const radius = Math.sqrt(child.position.x * child.position.x + child.position.z * child.position.z);
                child.position.x = Math.cos(angle) * radius;
                child.position.z = Math.sin(angle) * radius;
            }
            // 灯光闪烁
            if (child.type === 'PointLight' && child.color.r === 1) {
                child.intensity = 0.8 + Math.sin(time * 2 + index) * 0.4;
            }
        });
    }

    renderer.render(scene, camera);
}

// 音频系统
function initAudio() {
    // 简单的音频管理
    window.audioContext = null;
    window.sounds = {};

    // 订阅音频播放事件
    eventBus.on('audio:play', (data) => {
        playSound(data.type);
    });

    // 监听用户交互事件，激活音频上下文
    document.addEventListener('click', () => {
        if (!window.audioContext) {
            window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } else if (window.audioContext.state === 'suspended') {
            window.audioContext.resume();
        }
    });
}

function playSound(type) {
    if (!window.audioContext) {
        // 如果音频上下文尚未创建，先创建
        window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } else if (window.audioContext.state === 'suspended') {
        // 如果音频上下文处于挂起状态，先恢复
        window.audioContext.resume().then(() => {
            // 恢复后再次调用playSound
            playSound(type);
        });
        return;
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // 不同类型的音效
    if (type === 'switch') {
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.type = 'sine';
    } else if (type === 'click') {
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        oscillator.type = 'square';
    }

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// 初始化应用
window.addEventListener('DOMContentLoaded', init);
