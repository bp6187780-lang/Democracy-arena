/* ============================================
   SCENE - Three.js 3D Board Rendering
   ============================================ */

class GameScene {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.hexMeshes = [];
        this.playerMeshes = [];
        this.particles = null;
        this.animationId = null;
    }

    init(canvas) {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e17);
        this.scene.fog = new THREE.FogExp2(0x0a0e17, 0.04);

        // Camera
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 14, 10);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;

        // Lights
        const ambient = new THREE.AmbientLight(0x334466, 0.6);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(5, 10, 5);
        directional.castShadow = true;
        this.scene.add(directional);

        const point = new THREE.PointLight(0x00d4ff, 0.5, 30);
        point.position.set(0, 6, 0);
        this.scene.add(point);

        // Ground plane
        const groundGeo = new THREE.PlaneGeometry(60, 60);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x080c14,
            roughness: 0.9,
            metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // Background particles
        this.createParticles();

        // Window resize (store bound handler for proper removal)
        this._onResizeBound = () => this.onResize();
        window.addEventListener('resize', this._onResizeBound);

        // Start render loop
        this.animate();
    }

    createParticles() {
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = Math.random() * 15;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const material = new THREE.PointsMaterial({
            color: 0x00d4ff,
            size: 0.05,
            transparent: true,
            opacity: 0.6
        });
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    buildBoard(hexagons) {
        // Clear existing hex meshes
        this.hexMeshes.forEach(m => this.scene.remove(m));
        this.hexMeshes = [];

        hexagons.forEach(hex => {
            // Hexagon shape
            const shape = new THREE.Shape();
            const radius = 0.9;
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i - Math.PI / 6;
                const px = Math.cos(angle) * radius;
                const py = Math.sin(angle) * radius;
                if (i === 0) shape.moveTo(px, py);
                else shape.lineTo(px, py);
            }
            shape.closePath();

            const extrudeSettings = { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 };
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

            const color = hex.data.color || 0x1c2d44;
            const emissive = hex.type === 'core' ? 0x665500 : (hex.type === 'safe' ? color : 0x000000);
            const emissiveIntensity = hex.type === 'core' ? 0.4 : (hex.type === 'safe' ? 0.15 : 0);

            const material = new THREE.MeshStandardMaterial({
                color: color,
                roughness: 0.5,
                metalness: 0.3,
                emissive: emissive,
                emissiveIntensity: emissiveIntensity
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(hex.x, 0, hex.z);
            mesh.receiveShadow = true;
            mesh.castShadow = true;
            mesh.userData = { hexId: hex.id };

            this.scene.add(mesh);
            this.hexMeshes.push(mesh);
        });
    }

    createPlayerTokens(players) {
        // Clear existing
        this.playerMeshes.forEach(m => this.scene.remove(m));
        this.playerMeshes = [];

        players.forEach((player, i) => {
            const geo = new THREE.ConeGeometry(0.25, 0.6, 8);
            const mat = new THREE.MeshStandardMaterial({
                color: new THREE.Color(player.color),
                emissive: new THREE.Color(player.color),
                emissiveIntensity: 0.3,
                roughness: 0.3,
                metalness: 0.6
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = true;
            mesh.position.set(0, 0.5, 0);
            this.scene.add(mesh);
            this.playerMeshes.push(mesh);
        });
    }

    updatePlayerPositions(players, hexagons) {
        players.forEach((player, i) => {
            if (i >= this.playerMeshes.length) return;
            const hex = hexagons[player.position];
            if (!hex) return;

            const mesh = this.playerMeshes[i];
            // Offset slightly so multiple tokens on same hex don't overlap
            const offset = 0.3;
            const angle = (Math.PI * 2 * i) / players.length;
            const count = hex.players.length;
            const ox = count > 1 ? Math.cos(angle) * offset : 0;
            const oz = count > 1 ? Math.sin(angle) * offset : 0;

            mesh.position.set(hex.x + ox, 0.5, hex.z + oz);
        });
    }

    moveTokenTo(playerIndex, hex) {
        if (playerIndex >= this.playerMeshes.length) return;
        const mesh = this.playerMeshes[playerIndex];
        mesh.position.set(hex.x, 0.5, hex.z);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        // Slowly rotate particles
        if (this.particles) {
            this.particles.rotation.y += 0.0003;
        }

        // Gentle camera bob
        const t = Date.now() * 0.0005;
        this.camera.position.y = 14 + Math.sin(t) * 0.15;

        this.renderer.render(this.scene, this.camera);
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    destroy() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this._onResizeBound) {
            window.removeEventListener('resize', this._onResizeBound);
        }
    }
}

window.GameScene = GameScene;
