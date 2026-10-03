import * as THREE from 'three';
import { OrbState, LanguageNodeConfig, ActiveLanguageConnection } from './OrbTypes.ts';

export const LANGUAGE_NODES: LanguageNodeConfig[] = [
  {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    glyph: 'A',
    code: 'en',
    color: '#38bdf8',
    colorNum: 0x38bdf8,
    phi: Math.PI * 0.35,
    theta: 0,
    radius: 2.3,
  },
  {
    id: 'hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    glyph: 'अ',
    code: 'hi',
    color: '#fbbf24',
    colorNum: 0xfbbf24,
    phi: Math.PI * 0.42,
    theta: Math.PI * 0.45,
    radius: 2.35,
  },
  {
    id: 'tamil',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    glyph: 'அ',
    code: 'ta',
    color: '#34d399',
    colorNum: 0x34d399,
    phi: Math.PI * 0.62,
    theta: Math.PI * 0.85,
    radius: 2.4,
  },
  {
    id: 'telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    glyph: 'తె',
    code: 'te',
    color: '#a78bfa',
    colorNum: 0xa78bfa,
    phi: Math.PI * 0.55,
    theta: Math.PI * 1.3,
    radius: 2.3,
  },
  {
    id: 'kannada',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    glyph: 'ಕ',
    code: 'kn',
    color: '#f43f5e',
    colorNum: 0xf43f5e,
    phi: Math.PI * 0.38,
    theta: Math.PI * 1.7,
    radius: 2.35,
  },
  {
    id: 'malayalam',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    glyph: 'മ',
    code: 'ml',
    color: '#818cf8',
    colorNum: 0x818cf8,
    phi: Math.PI * 0.68,
    theta: Math.PI * 0.2,
    radius: 2.4,
  },
  {
    id: 'bengali',
    name: 'Bengali',
    nativeName: 'বাংলা',
    glyph: 'বা',
    code: 'bn',
    color: '#2dd4bf',
    colorNum: 0x2dd4bf,
    phi: Math.PI * 0.25,
    theta: Math.PI * 0.95,
    radius: 2.32,
  },
  {
    id: 'marathi',
    name: 'Marathi',
    nativeName: 'मराठी',
    glyph: 'म',
    code: 'mr',
    color: '#fb923c',
    colorNum: 0xfb923c,
    phi: Math.PI * 0.72,
    theta: Math.PI * 1.55,
    radius: 2.38,
  },
];

export class OrbEngine {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private animFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Root group with floating movement
  private rootGroup: THREE.Group;
  private coreGroup: THREE.Group;
  private particlesGroup: THREE.Group;
  private orbitalRingsGroup: THREE.Group;
  private nodesGroup: THREE.Group;
  private connectionsGroup: THREE.Group;

  // Visual Meshes
  private innerCoreMesh!: THREE.Mesh;
  private outerCoronaMesh!: THREE.Mesh;
  private atmosphericGlowMesh!: THREE.Mesh;
  private particlePoints!: THREE.Points;
  private proximityLinesMesh!: THREE.LineSegments;

  // Particle data
  private particleCount = 84;
  private particlePositions!: Float32Array;
  private particleVelocities!: Float32Array;
  private particleOrbitAngles!: Float32Array;
  private particleOrbitRadii!: Float32Array;
  private particleOrbitSpeeds!: Float32Array;

  // Language nodes
  private nodeSprites: Map<string, THREE.Sprite> = new Map();
  private nodeMeshPoints: Map<string, THREE.Mesh> = new Map();
  private nodeBasePositions: Map<string, THREE.Vector3> = new Map();

  // Active connections
  private activeConnections: ActiveLanguageConnection[] = [];
  private connectionLines: THREE.Line[] = [];
  private pulseSprites: THREE.Sprite[] = [];

  // Interaction & Physics state
  private targetRotation = { x: 0, y: 0 };
  private currentRotation = { x: 0, y: 0 };
  private floatOffset = { x: 0, y: 0, z: 0 };
  private pulseEnergy = 0; // 0 to 1 boost
  private orbState: OrbState = 'IDLE';
  private activeLanguageKeys: Set<string> = new Set();
  private learningLanguageKey: string | null = null;
  private isPointerDown = false;
  private pointerStartPos = { x: 0, y: 0 };
  private prefersReducedMotion = false;
  private isDisposed = false;

  // Hover detection
  private raycaster = new THREE.Raycaster();
  private mouseVec = new THREE.Vector2(-999, -999);
  public onNodeHover?: (node: LanguageNodeConfig | null) => void;
  public onOrbClick?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 320;
    const height = rect.height || 320;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 7.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    // Groups
    this.rootGroup = new THREE.Group();
    this.coreGroup = new THREE.Group();
    this.particlesGroup = new THREE.Group();
    this.orbitalRingsGroup = new THREE.Group();
    this.nodesGroup = new THREE.Group();
    this.connectionsGroup = new THREE.Group();

    this.rootGroup.add(this.coreGroup);
    this.rootGroup.add(this.particlesGroup);
    this.rootGroup.add(this.orbitalRingsGroup);
    this.rootGroup.add(this.nodesGroup);
    this.rootGroup.add(this.connectionsGroup);
    this.scene.add(this.rootGroup);

    // Reduced motion check
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.setupLighting();
    this.setupCore();
    this.setupOrbitalRings();
    this.setupParticles();
    this.setupLanguageNodes();
    this.setupEventListeners();
    this.startLoop();
  }

  private setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x38bdf8, 1.8);
    keyLight.position.set(5, 5, 5);
    this.scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.5);
    rimLight.position.set(-5, -3, -4);
    this.scene.add(rimLight);
  }

  private setupCore() {
    // 1. Inner glowing nucleus sphere
    const innerGeo = new THREE.SphereGeometry(0.85, 32, 32);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    this.innerCoreMesh = new THREE.Mesh(innerGeo, innerMat);
    this.coreGroup.add(this.innerCoreMesh);

    // 2. Translucent outer core corona
    const outerGeo = new THREE.SphereGeometry(1.22, 32, 32);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.28,
      wireframe: true,
      blending: THREE.AdditiveBlending,
    });
    this.outerCoronaMesh = new THREE.Mesh(outerGeo, outerMat);
    this.coreGroup.add(this.outerCoronaMesh);

    // 3. Soft atmospheric halo aura
    const auraGeo = new THREE.SphereGeometry(1.48, 24, 24);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
    });
    this.atmosphericGlowMesh = new THREE.Mesh(auraGeo, auraMat);
    this.coreGroup.add(this.atmosphericGlowMesh);
  }

  private setupOrbitalRings() {
    const ringConfigs = [
      { radius: 1.75, tiltX: 0.45, tiltY: 0.2, tiltZ: 0.35, color: 0x38bdf8, opacity: 0.35 },
      { radius: 1.95, tiltX: -0.6, tiltY: 0.8, tiltZ: -0.2, color: 0x818cf8, opacity: 0.3 },
      { radius: 2.15, tiltX: 0.85, tiltY: -0.4, tiltZ: 0.75, color: 0x34d399, opacity: 0.25 },
      { radius: 2.35, tiltX: -0.3, tiltY: -0.7, tiltZ: -0.6, color: 0xfbbf24, opacity: 0.2 },
    ];

    ringConfigs.forEach((config) => {
      const curve = new THREE.EllipseCurve(
        0, 0,
        config.radius, config.radius * 0.92,
        0, 2 * Math.PI,
        false,
        0
      );
      const points = curve.getPoints(96);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: config.color,
        transparent: true,
        opacity: config.opacity,
        blending: THREE.AdditiveBlending,
      });
      const ringLine = new THREE.Line(geometry, material);
      ringLine.rotation.set(config.tiltX, config.tiltY, config.tiltZ);
      this.orbitalRingsGroup.add(ringLine);
    });
  }

  private setupParticles() {
    const count = this.particleCount;
    this.particlePositions = new Float32Array(count * 3);
    this.particleVelocities = new Float32Array(count * 3);
    this.particleOrbitAngles = new Float32Array(count);
    this.particleOrbitRadii = new Float32Array(count);
    this.particleOrbitSpeeds = new Float32Array(count);

    const colors = new Float32Array(count * 3);
    const colorPalette = [
      new THREE.Color(0x38bdf8), // cyan
      new THREE.Color(0x818cf8), // violet
      new THREE.Color(0x34d399), // emerald
      new THREE.Color(0xfbbf24), // amber
      new THREE.Color(0xa78bfa), // purple
      new THREE.Color(0xffffff), // white accent
    ];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const radius = 1.45 + Math.random() * 1.1;
      const inclination = (Math.random() - 0.5) * Math.PI * 0.85;

      this.particleOrbitAngles[i] = angle;
      this.particleOrbitRadii[i] = radius;
      this.particleOrbitSpeeds[i] = (0.25 + Math.random() * 0.5) * (Math.random() > 0.4 ? 1 : -1);

      const x = radius * Math.cos(angle) * Math.cos(inclination);
      const y = radius * Math.sin(inclination);
      const z = radius * Math.sin(angle) * Math.cos(inclination);

      this.particlePositions[i * 3] = x;
      this.particlePositions[i * 3 + 1] = y;
      this.particlePositions[i * 3 + 2] = z;

      const c = colorPalette[i % colorPalette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle sprite texture generated programmatically
    const particleTex = this.createParticleTexture();
    const particleMat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTex,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.particlePoints = new THREE.Points(particleGeo, particleMat);
    this.particlesGroup.add(this.particlePoints);

    // Proximity neural connection lines
    const lineIndices: number[] = [];
    const maxLines = 45;
    for (let i = 0; i < count && lineIndices.length < maxLines * 2; i++) {
      for (let j = i + 1; j < count; j++) {
        const dx = this.particlePositions[i * 3] - this.particlePositions[j * 3];
        const dy = this.particlePositions[i * 3 + 1] - this.particlePositions[j * 3 + 1];
        const dz = this.particlePositions[i * 3 + 2] - this.particlePositions[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.65 && lineIndices.length < maxLines * 2) {
          lineIndices.push(i, j);
        }
      }
    }

    const linesGeo = new THREE.BufferGeometry();
    linesGeo.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
    linesGeo.setIndex(lineIndices);

    const linesMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
    });
    this.proximityLinesMesh = new THREE.LineSegments(linesGeo, linesMat);
    this.particlesGroup.add(this.proximityLinesMesh);
  }

  private createParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
    grad.addColorStop(0.25, 'rgba(125, 211, 252, 0.85)');
    grad.addColorStop(0.65, 'rgba(56, 189, 248, 0.3)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  private setupLanguageNodes() {
    LANGUAGE_NODES.forEach((node) => {
      // Calculate spherical position
      const x = node.radius * Math.sin(node.phi) * Math.cos(node.theta);
      const y = node.radius * Math.cos(node.phi);
      const z = node.radius * Math.sin(node.phi) * Math.sin(node.theta);

      const basePos = new THREE.Vector3(x, y, z);
      this.nodeBasePositions.set(node.id, basePos);

      // 1. Subtle glowing sphere point
      const sphereGeo = new THREE.SphereGeometry(0.09, 16, 16);
      const sphereMat = new THREE.MeshBasicMaterial({
        color: node.colorNum,
        transparent: true,
        opacity: 0.9,
      });
      const nodeSphere = new THREE.Mesh(sphereGeo, sphereMat);
      nodeSphere.position.copy(basePos);
      nodeSphere.userData = { nodeId: node.id, nodeData: node };
      this.nodesGroup.add(nodeSphere);
      this.nodeMeshPoints.set(node.id, nodeSphere);

      // 2. Sprite with native script glyph
      const spriteTex = this.createLanguageGlyphTexture(node.glyph, node.color);
      const spriteMat = new THREE.SpriteMaterial({
        map: spriteTex,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthTest: false,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(0.48, 0.48, 1);
      // Position slightly offset outward
      const spritePos = basePos.clone().normalize().multiplyScalar(node.radius + 0.18);
      sprite.position.copy(spritePos);
      sprite.userData = { nodeId: node.id, nodeData: node };
      this.nodesGroup.add(sprite);
      this.nodeSprites.set(node.id, sprite);
    });
  }

  private createLanguageGlyphTexture(glyph: string, color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Clean background
    ctx.clearRect(0, 0, 128, 128);

    // Glowing circle perimeter
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.stroke();

    // Translucent filled disk
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fill();

    // Script glyph text
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px "Plus Jakarta Sans", "Noto Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(glyph, 64, 65);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }

  private setupEventListeners() {
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.addEventListener('click', this.handleClick);

    // Touch event handling with passive scrolling compatibility
    this.canvas.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.canvas.addEventListener('touchmove', this.handleTouchMove, { passive: true });
    this.canvas.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  private handleMouseMove = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

    this.mouseVec.set(x, y);

    // Parallax tilt target (spring response)
    this.targetRotation.x = -y * 0.45;
    this.targetRotation.y = x * 0.55;

    // Raycast hover check on language nodes
    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    const intersects = this.raycaster.intersectObjects(Array.from(this.nodeMeshPoints.values()));

    if (intersects.length > 0 && intersects[0].object.userData?.nodeData) {
      if (this.onNodeHover) {
        this.onNodeHover(intersects[0].object.userData.nodeData);
      }
    } else {
      if (this.onNodeHover) {
        this.onNodeHover(null);
      }
    }
  };

  private handleMouseLeave = () => {
    this.mouseVec.set(-999, -999);
    this.targetRotation.x = 0;
    this.targetRotation.y = 0;
    if (this.onNodeHover) this.onNodeHover(null);
  };

  private handleClick = () => {
    this.triggerPulse();
    if (this.onOrbClick) this.onOrbClick();
  };

  private handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.isPointerDown = true;
      this.pointerStartPos.x = e.touches[0].clientX;
      this.pointerStartPos.y = e.touches[0].clientY;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (!this.isPointerDown || e.touches.length !== 1) return;
    const deltaX = (e.touches[0].clientX - this.pointerStartPos.x) * 0.005;
    const deltaY = (e.touches[0].clientY - this.pointerStartPos.y) * 0.005;

    this.targetRotation.y += deltaX;
    this.targetRotation.x += deltaY;

    this.pointerStartPos.x = e.touches[0].clientX;
    this.pointerStartPos.y = e.touches[0].clientY;
  };

  private handleTouchEnd = () => {
    this.isPointerDown = false;
    // Release smoothly returns to idle
    setTimeout(() => {
      this.targetRotation.x = 0;
      this.targetRotation.y = 0;
    }, 400);
  };

  // Trigger an AI energy pulse (on tap / message send / event)
  public triggerPulse(intensity = 1.0) {
    this.pulseEnergy = Math.min(this.pulseEnergy + intensity, 1.5);
  }

  // Update animation state from parent
  public setState(state: OrbState) {
    this.orbState = state;
  }

  // Set active languages for code-switching reaction
  public setActiveLanguages(languages: Array<{ language: string; code?: string; confidence?: number }>) {
    this.activeLanguageKeys.clear();
    languages.forEach((l) => {
      const match = LANGUAGE_NODES.find(
        (n) =>
          n.name.toLowerCase() === l.language.toLowerCase() ||
          n.code.toLowerCase() === (l.code || '').toLowerCase()
      );
      if (match) {
        this.activeLanguageKeys.add(match.id);
      }
    });

    // If multiple active languages (code-switching), spawn connection pulses between them!
    if (this.activeLanguageKeys.size >= 2) {
      const langArray = Array.from(this.activeLanguageKeys);
      for (let i = 0; i < langArray.length - 1; i++) {
        this.spawnConnection(langArray[i], langArray[i + 1]);
      }
      this.triggerPulse(0.8);
    }
  }

  // Set emphasized language for Learning Mode
  public setLearningLanguage(langId?: string) {
    this.learningLanguageKey = langId || null;
  }

  // Spawns an energetic pulse traveling along a 3D connection arc
  public spawnConnection(sourceId: string, targetId: string) {
    const srcPos = this.nodeBasePositions.get(sourceId);
    const dstPos = this.nodeBasePositions.get(targetId);
    if (!srcPos || !dstPos) return;

    // Create curved spline
    const midPoint = srcPos
      .clone()
      .add(dstPos)
      .multiplyScalar(0.5)
      .normalize()
      .multiplyScalar(1.6); // arc inward toward core
    const curve = new THREE.QuadraticBezierCurve3(srcPos, midPoint, dstPos);
    const points = curve.getPoints(36);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const srcNode = LANGUAGE_NODES.find((n) => n.id === sourceId);
    const lineMat = new THREE.LineBasicMaterial({
      color: srcNode?.colorNum || 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const line = new THREE.Line(geometry, lineMat);
    this.connectionsGroup.add(line);

    // Glowing pulse packet traveling along curve
    const pulseTex = this.createParticleTexture();
    const pulseMat = new THREE.SpriteMaterial({
      map: pulseTex,
      color: srcNode?.colorNum || 0x38bdf8,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });
    const pulseSprite = new THREE.Sprite(pulseMat);
    pulseSprite.scale.set(0.32, 0.32, 1);
    pulseSprite.position.copy(srcPos);
    this.connectionsGroup.add(pulseSprite);

    this.connectionLines.push(line);
    this.pulseSprites.push(pulseSprite);

    // Animate along curve
    let progress = 0;
    const duration = 1.4; // seconds
    const startTime = performance.now();

    const animatePulse = () => {
      if (this.isDisposed) return;
      const elapsed = (performance.now() - startTime) / 1000;
      progress = elapsed / duration;

      if (progress <= 1) {
        const currentPos = curve.getPoint(progress);
        pulseSprite.position.copy(currentPos);
        lineMat.opacity = 0.85 * (1 - progress * 0.4);
        requestAnimationFrame(animatePulse);
      } else {
        // Cleanup after completion
        this.connectionsGroup.remove(line);
        this.connectionsGroup.remove(pulseSprite);
        geometry.dispose();
        lineMat.dispose();
        pulseMat.dispose();
        const lineIdx = this.connectionLines.indexOf(line);
        if (lineIdx >= 0) this.connectionLines.splice(lineIdx, 1);
        const spriteIdx = this.pulseSprites.indexOf(pulseSprite);
        if (spriteIdx >= 0) this.pulseSprites.splice(spriteIdx, 1);
      }
    };

    requestAnimationFrame(animatePulse);
  }

  // Occasional random connection in idle mode to show multilingual aliveness
  private lastIdleConnectionTime = 0;
  private checkIdleConnections(elapsed: number) {
    if (this.orbState === 'IDLE' && elapsed - this.lastIdleConnectionTime > 4.5) {
      this.lastIdleConnectionTime = elapsed;
      const n1 = LANGUAGE_NODES[Math.floor(Math.random() * LANGUAGE_NODES.length)].id;
      let n2 = LANGUAGE_NODES[Math.floor(Math.random() * LANGUAGE_NODES.length)].id;
      while (n2 === n1) {
        n2 = LANGUAGE_NODES[Math.floor(Math.random() * LANGUAGE_NODES.length)].id;
      }
      this.spawnConnection(n1, n2);
    }
  }

  // Animation Loop
  private startLoop() {
    const render = () => {
      if (this.isDisposed) return;
      this.animFrameId = requestAnimationFrame(render);

      const delta = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      // State modifiers
      let rotationSpeed = 0.22;
      let particleSpeedMultiplier = 1.0;
      let breathingRate = 1.2;

      switch (this.orbState) {
        case 'PROCESSING':
          rotationSpeed = 0.65;
          particleSpeedMultiplier = 2.2;
          breathingRate = 2.8;
          break;
        case 'LANGUAGE_DETECTED':
          rotationSpeed = 0.35;
          particleSpeedMultiplier = 1.5;
          breathingRate = 1.8;
          break;
        case 'LEARNING':
          rotationSpeed = 0.12;
          particleSpeedMultiplier = 0.65;
          breathingRate = 0.85;
          break;
        case 'RESPONDING':
          rotationSpeed = 0.28;
          particleSpeedMultiplier = 1.3;
          breathingRate = 1.5;
          break;
      }

      if (this.prefersReducedMotion) {
        rotationSpeed = 0;
        particleSpeedMultiplier = 0;
      }

      // 1. Smooth Lissajous floating movement for root orb
      // up -> slightly right -> down -> slightly left -> repeat
      const floatX = Math.sin(elapsed * 0.7) * 0.12;
      const floatY = Math.cos(elapsed * 0.95) * 0.14;
      const floatZ = Math.sin(elapsed * 0.5) * 0.06;
      this.rootGroup.position.set(floatX, floatY, floatZ);

      // 2. Spring rotation interpolation
      this.currentRotation.x += (this.targetRotation.x - this.currentRotation.x) * 0.08;
      this.currentRotation.y += (this.targetRotation.y - this.currentRotation.y) * 0.08;

      this.rootGroup.rotation.x = this.currentRotation.x;
      this.rootGroup.rotation.y = this.currentRotation.y + elapsed * rotationSpeed;

      // 3. Pulse decay
      if (this.pulseEnergy > 0.001) {
        this.pulseEnergy *= 0.94; // smooth exponential decay
      } else {
        this.pulseEnergy = 0;
      }

      // 4. Core breathing & pulse expansion
      const breath = Math.sin(elapsed * breathingRate) * 0.04;
      const coreScale = 1.0 + breath + this.pulseEnergy * 0.28;
      this.innerCoreMesh.scale.set(coreScale, coreScale, coreScale);
      this.outerCoronaMesh.scale.set(coreScale * 1.02, coreScale * 1.02, coreScale * 1.02);
      this.outerCoronaMesh.rotation.y = -elapsed * 0.3;
      this.outerCoronaMesh.rotation.x = elapsed * 0.18;

      // 5. Update orbital rings
      this.orbitalRingsGroup.children.forEach((ring, idx) => {
        const ringObj = ring as THREE.Line;
        ringObj.rotation.z += delta * (0.15 + idx * 0.05) * (idx % 2 === 0 ? 1 : -1);
      });

      // 6. Update Particles
      const posAttr = this.particlePoints.geometry.getAttribute('position') as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;

      for (let i = 0; i < this.particleCount; i++) {
        this.particleOrbitAngles[i] += delta * this.particleOrbitSpeeds[i] * particleSpeedMultiplier;
        const angle = this.particleOrbitAngles[i];
        const baseRadius = this.particleOrbitRadii[i];
        const r = baseRadius * (1.0 + this.pulseEnergy * 0.35);

        const x = r * Math.cos(angle);
        const y = positions[i * 3 + 1]; // maintain inclination height
        const z = r * Math.sin(angle);

        positions[i * 3] = x;
        positions[i * 3 + 2] = z;
      }
      posAttr.needsUpdate = true;

      // 7. Update Language Nodes (Gentle radial float & state highlight)
      LANGUAGE_NODES.forEach((node) => {
        const basePos = this.nodeBasePositions.get(node.id);
        const mesh = this.nodeMeshPoints.get(node.id);
        const sprite = this.nodeSprites.get(node.id);
        if (!basePos || !mesh || !sprite) return;

        // Individual radial float
        const nodeFloat = Math.sin(elapsed * 1.4 + node.phi * 2) * 0.06;
        const currentPos = basePos.clone().normalize().multiplyScalar(node.radius + nodeFloat);
        mesh.position.copy(currentPos);

        const spritePos = currentPos.clone().normalize().multiplyScalar(node.radius + nodeFloat + 0.22);
        sprite.position.copy(spritePos);

        // Check active / learning emphasis
        const isDetected = this.activeLanguageKeys.has(node.id);
        const isLearningFocus = this.learningLanguageKey === node.id;

        if (isDetected || isLearningFocus) {
          mesh.scale.set(1.4, 1.4, 1.4);
          sprite.scale.set(0.62, 0.62, 1);
          (sprite.material as THREE.SpriteMaterial).opacity = 1.0;
        } else {
          mesh.scale.set(1.0, 1.0, 1.0);
          sprite.scale.set(0.44, 0.44, 1);
          (sprite.material as THREE.SpriteMaterial).opacity = 0.82;
        }
      });

      // 8. Idle inter-lingual connection triggers
      this.checkIdleConnections(elapsed);

      // Render scene
      this.renderer.render(this.scene, this.camera);
    };

    render();
  }

  public resize(width: number, height: number) {
    if (this.isDisposed || width <= 0 || height <= 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public dispose() {
    this.isDisposed = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.canvas.removeEventListener('click', this.handleClick);
    this.canvas.removeEventListener('touchstart', this.handleTouchStart);
    this.canvas.removeEventListener('touchmove', this.handleTouchMove);
    this.canvas.removeEventListener('touchend', this.handleTouchEnd);

    // Dispose geometries & materials
    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).geometry) {
        (obj as THREE.Mesh).geometry.dispose();
      }
      if ((obj as THREE.Mesh).material) {
        const mat = (obj as THREE.Mesh).material;
        if (Array.isArray(mat)) {
          mat.forEach((m) => m.dispose());
        } else {
          mat.dispose();
        }
      }
    });

    this.renderer.dispose();
  }
}
