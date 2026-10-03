import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { playHapticTick, playScanSweep } from '../utils/audioHaptics';
import { RotateCw, ZoomIn, ZoomOut, Layers, Sparkles, Compass, Eye } from 'lucide-react';
import { isWebGLAvailable } from '../utils/webglSupport';

export interface SemanticNode {
  id: string;
  label: string;
  transliteration?: string;
  dialect: 'Tanglish' | 'Hinglish' | 'English' | 'CodeSwitch' | 'Negation';
  pos: [number, number, number];
  color: number;
  confidence: number;
  samplePhrase: string;
  vectorDistance: number;
}

const NODES_DATA: SemanticNode[] = [
  // English Baselines
  { id: 'en-1', label: 'Cannot complete action', dialect: 'English', pos: [0, 4.5, 0], color: 0x38bdf8, confidence: 0.99, samplePhrase: 'I cannot complete this transaction', vectorDistance: 0.08 },
  { id: 'en-2', label: 'Please wait', dialect: 'English', pos: [2.5, 3.8, 1.2], color: 0x38bdf8, confidence: 0.98, samplePhrase: 'Please wait for a moment', vectorDistance: 0.12 },
  { id: 'en-3', label: 'How to cancel ticket', dialect: 'English', pos: [-2.2, 3.5, 1.8], color: 0x38bdf8, confidence: 0.97, samplePhrase: 'How to cancel my train ticket?', vectorDistance: 0.15 },

  // Tamil / Tanglish
  { id: 'ta-1', label: 'panna mudiyala', transliteration: 'பண்ண முடியல', dialect: 'Tanglish', pos: [-3.8, -1.2, 2.5], color: 0x34d399, confidence: 0.94, samplePhrase: 'Bro, ennala idhu panna mudiyala', vectorDistance: 0.38 },
  { id: 'ta-2', label: 'cancel panradhuku steps', transliteration: 'கேன்சல் பண்றதுக்கு ஸ்டெப்ஸ்', dialect: 'Tanglish', pos: [-4.2, 0.8, 1.5], color: 0x34d399, confidence: 0.96, samplePhrase: 'Train ticket cancel panradhuku steps sollunga', vectorDistance: 0.32 },
  { id: 'ta-3', label: 'romba nalla irukku', transliteration: 'ரொம்ப நல்லா இருக்கு', dialect: 'Tanglish', pos: [-3.2, -2.5, -1.8], color: 0x34d399, confidence: 0.93, samplePhrase: 'Indha explanation romba nalla irukku pa', vectorDistance: 0.41 },
  { id: 'ta-4', label: 'seri pa pathukalam', transliteration: 'சரி பா பாத்துக்கலாம்', dialect: 'Tanglish', pos: [-2.8, -3.2, 1.2], color: 0x34d399, confidence: 0.91, samplePhrase: 'Seri pa, adha apram pathukalam', vectorDistance: 0.45 },

  // Hindi / Hinglish
  { id: 'hi-1', label: 'kar sakte ho kya', transliteration: 'कर सकते हो क्या', dialect: 'Hinglish', pos: [3.8, -0.8, 2.4], color: 0xfbbf24, confidence: 0.95, samplePhrase: 'Aap ye ticket reschedule kar sakte ho kya?', vectorDistance: 0.34 },
  { id: 'hi-2', label: 'kya scene hai bro', transliteration: 'क्या सीन है ब्रो', dialect: 'Hinglish', pos: [4.1, 1.2, 1.2], color: 0xfbbf24, confidence: 0.92, samplePhrase: 'Refund ka kya scene hai bro, kab aayega?', vectorDistance: 0.42 },
  { id: 'hi-3', label: 'nahi ho raha', transliteration: 'नहीं हो रहा', dialect: 'Hinglish', pos: [3.5, -2.2, -1.5], color: 0xfbbf24, confidence: 0.94, samplePhrase: 'Login nahi ho raha OTP expire ho gaya', vectorDistance: 0.37 },
  { id: 'hi-4', label: 'thoda jaldi batao', transliteration: 'थोड़ा जल्दी बताओ', dialect: 'Hinglish', pos: [2.9, -3.0, 1.8], color: 0xfbbf24, confidence: 0.89, samplePhrase: 'Pls thoda jaldi batao train nikal jayegi', vectorDistance: 0.48 },

  // Code-Switch Boundary Nodes
  { id: 'cs-1', label: 'bro wait karo', dialect: 'CodeSwitch', pos: [0.8, 0.5, 4.2], color: 0xa78bfa, confidence: 0.88, samplePhrase: 'Bro wait karo, server down irukku', vectorDistance: 0.52 },
  { id: 'cs-2', label: 'steps sollunga please', dialect: 'CodeSwitch', pos: [-1.2, 1.8, 3.8], color: 0xa78bfa, confidence: 0.91, samplePhrase: 'Procedure steps sollunga please ASAP', vectorDistance: 0.46 },
  { id: 'cs-3', label: 'confirm ho gaya but', dialect: 'CodeSwitch', pos: [1.4, -1.5, 3.9], color: 0xa78bfa, confidence: 0.90, samplePhrase: 'Ticket confirm ho gaya but seat allot aagala', vectorDistance: 0.49 },

  // Negation & Inversion Traps
  { id: 'neg-1', label: 'illanu sollala', transliteration: 'இல்லனு சொல்லல (Double Neg)', dialect: 'Negation', pos: [-1.8, -4.2, -0.8], color: 0xf43f5e, confidence: 0.85, samplePhrase: 'Naan illanu sollala, aana ippo mudiyadhu', vectorDistance: 0.62 },
  { id: 'neg-2', label: 'aisa mat socho ki nahi hoga', dialect: 'Negation', pos: [1.8, -4.0, -1.2], color: 0xf43f5e, confidence: 0.87, samplePhrase: 'Aisa mat socho ki process nahi hoga', vectorDistance: 0.58 },
];

// Dialect links (splines) between nodes
const NODE_LINKS: [string, string][] = [
  ['en-1', 'ta-1'],
  ['en-1', 'hi-3'],
  ['en-2', 'cs-1'],
  ['en-3', 'ta-2'],
  ['en-3', 'hi-1'],
  ['ta-1', 'cs-1'],
  ['hi-1', 'cs-1'],
  ['ta-2', 'cs-2'],
  ['hi-3', 'cs-3'],
  ['ta-1', 'neg-1'],
  ['hi-3', 'neg-2'],
  ['cs-1', 'cs-3'],
  ['cs-2', 'ta-1'],
];

interface ThreeSemanticGlobeProps {
  onSelectNodePrompt?: (prompt: string) => void;
  className?: string;
  compact?: boolean;
}

export const ThreeSemanticGlobe: React.FC<ThreeSemanticGlobeProps> = ({
  onSelectNodePrompt,
  className = '',
  compact = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<SemanticNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<SemanticNode | null>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [viewMode, setViewMode] = useState<'sphere' | 'helix' | 'manifold'>('sphere');
  const [filterDialect, setFilterDialect] = useState<string>('all');
  const [hasWebGLError, setHasWebGLError] = useState(false);

  // Three.js internal refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const nodesMeshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    if (!isWebGLAvailable()) {
      setHasWebGLError(true);
      return;
    }

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, compact ? 14 : 12);
    cameraRef.current = camera;

    // 2. WebGL Renderer with Anti-aliasing (Safe try/catch)
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch (err) {
      console.warn('ThreeSemanticGlobe WebGLRenderer creation failed, using 2D topology fallback:', err);
      setHasWebGLError(true);
      return;
    }

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setHasWebGLError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // 3. Central Interactive Group
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);
    groupRef.current = mainGroup;

    // 4. Subtle Wireframe Reference Lattice (Spherical grid)
    const latticeGeo = new THREE.SphereGeometry(5.2, 18, 12);
    const latticeMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const latticeMesh = new THREE.Mesh(latticeGeo, latticeMat);
    mainGroup.add(latticeMesh);

    // 5. Starry Background particles
    const starCount = 350;
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 35;
      starPositions[i + 1] = (Math.random() - 0.5) * 35;
      starPositions[i + 2] = (Math.random() - 0.5) * 35;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.12,
      transparent: true,
      opacity: 0.3,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 6. Linguistic Semantic Nodes
    const nodeGeometry = new THREE.SphereGeometry(0.24, 16, 16);
    const haloGeometry = new THREE.RingGeometry(0.32, 0.42, 24);

    NODES_DATA.forEach((node) => {
      const nodeMaterial = new THREE.MeshBasicMaterial({
        color: node.color,
      });
      const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
      nodeMesh.position.set(...node.pos);
      nodeMesh.userData = { nodeData: node };

      // Halo ring around each node
      const haloMat = new THREE.MeshBasicMaterial({
        color: node.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const haloMesh = new THREE.Mesh(haloGeometry, haloMat);
      nodeMesh.add(haloMesh);

      mainGroup.add(nodeMesh);
      nodesMeshMapRef.current.set(node.id, nodeMesh);
    });

    // 7. Dynamic Spline Arcs linking nodes
    const arcsGroup = new THREE.Group();
    mainGroup.add(arcsGroup);
    arcsGroupRef.current = arcsGroup;

    NODE_LINKS.forEach(([idA, idB]) => {
      const meshA = nodesMeshMapRef.current.get(idA);
      const meshB = nodesMeshMapRef.current.get(idB);
      if (!meshA || !meshB) return;

      const posA = meshA.position;
      const posB = meshB.position;

      // Arc curve elevated above center
      const midPoint = new THREE.Vector3()
        .addVectors(posA, posB)
        .multiplyScalar(0.5);
      const elevation = midPoint.clone().normalize().multiplyScalar(5.8);

      const curve = new THREE.QuadraticBezierCurve3(posA, elevation, posB);
      const points = curve.getPoints(32);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.28,
        linewidth: 1,
      });
      const arcLine = new THREE.Line(curveGeo, curveMat);
      arcLine.userData = { idA, idB };
      arcsGroup.add(arcLine);
    });

    // 8. Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(-999, -999);

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDraggingRef.current && mainGroup) {
        const deltaX = e.clientX - prevMousePosRef.current.x;
        const deltaY = e.clientY - prevMousePosRef.current.y;
        mainGroup.rotation.y += deltaX * 0.007;
        mainGroup.rotation.x += deltaY * 0.007;
        prevMousePosRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      isDraggingRef.current = true;
      prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = THREE.MathUtils.clamp(
        cameraRef.current.position.z + e.deltaY * 0.012,
        6,
        22
      );
    };

    const onClick = () => {
      if (!sceneRef.current || !cameraRef.current) return;
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(mainGroup.children, true);
      const hitNode = intersects.find((i) => i.object.userData?.nodeData);
      if (hitNode) {
        const nData = hitNode.object.userData.nodeData as SemanticNode;
        setSelectedNode(nData);
        playScanSweep();
      }
    };

    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('click', onClick);

    // 9. Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && cameraRef.current && rendererRef.current) {
          cameraRef.current.aspect = w / h;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(container);

    // 10. Animation Loop
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow idle rotation
      if (autoRotate && mainGroup && !isDraggingRef.current) {
        mainGroup.rotation.y += 0.0035;
      }

      // Starfield subtle breathing
      starField.rotation.y = elapsedTime * 0.015;

      // Pulse halos
      nodesMeshMapRef.current.forEach((mesh) => {
        const halo = mesh.children[0] as THREE.Mesh;
        if (halo) {
          const scale = 1 + Math.sin(elapsedTime * 2.5) * 0.12;
          halo.scale.set(scale, scale, 1);
          halo.lookAt(camera.position);
        }
      });

      // Hover Raycasting
      if (cameraRef.current) {
        raycaster.setFromCamera(mouse, cameraRef.current);
        const intersects = raycaster.intersectObjects(mainGroup.children, true);
        const hitNode = intersects.find((i) => i.object.userData?.nodeData);

        if (hitNode) {
          const nodeData = hitNode.object.userData.nodeData as SemanticNode;
          setHoveredNode(nodeData);
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setHoveredNode(null);
          renderer.domElement.style.cursor = isDraggingRef.current ? 'grabbing' : 'grab';
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('click', onClick);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [compact]);

  // Mode & Filter transitions
  useEffect(() => {
    if (!groupRef.current) return;
    const group = groupRef.current;

    NODES_DATA.forEach((node, idx) => {
      const mesh = nodesMeshMapRef.current.get(node.id);
      if (!mesh) return;

      // Filter visibility
      const isVisible =
        filterDialect === 'all' ||
        (filterDialect === 'Tanglish' && (node.dialect === 'Tanglish' || node.dialect === 'CodeSwitch')) ||
        (filterDialect === 'Hinglish' && (node.dialect === 'Hinglish' || node.dialect === 'CodeSwitch')) ||
        node.dialect === filterDialect;

      mesh.visible = isVisible;

      // Morph node positions based on viewMode
      let targetPos = new THREE.Vector3(...node.pos);
      if (viewMode === 'helix') {
        const angle = idx * 0.45;
        const radius = 3.6;
        const y = (idx - NODES_DATA.length / 2) * 0.65;
        targetPos.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
      } else if (viewMode === 'manifold') {
        // Flat 2D/3D embedding plane projection
        targetPos.set(node.pos[0] * 1.3, node.pos[1] * 0.3, node.pos[2] * 1.3);
      }

      mesh.position.lerp(targetPos, 0.9);
    });
  }, [viewMode, filterDialect]);

  return (
    <div className={`relative flex flex-col rounded-xl border border-white/10 bg-[#0d0e14] overflow-hidden ${className}`}>
      {/* Top 3D Control Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-black/40 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold text-stone-200 tracking-wide uppercase">
            {hasWebGLError ? 'Dialect Vector Topology' : '3D Dialect Constellation'}
          </span>
          <span className="text-[10px] font-mono text-stone-500 bg-white/5 px-2 py-0.5 rounded">
            {hasWebGLError ? '2D Vector Topology (Safe Fallback)' : 'WebGL Vector Space'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Dialect Filter */}
          <div className="flex items-center text-[11px] font-mono bg-white/5 rounded p-0.5 border border-white/5">
            {['all', 'Tanglish', 'Hinglish', 'Negation'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilterDialect(f);
                  playHapticTick();
                }}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filterDialect === f ? 'bg-stone-800 text-stone-100 font-semibold' : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {f === 'all' ? 'All Vectors' : f}
              </button>
            ))}
          </div>

          {/* View Modes */}
          <div className="flex items-center text-[11px] font-mono bg-white/5 rounded p-0.5 border border-white/5">
            <button
              onClick={() => {
                setViewMode('sphere');
                playHapticTick();
              }}
              title="3D Sphere Constellation"
              className={`p-1 rounded ${viewMode === 'sphere' ? 'bg-stone-800 text-stone-100' : 'text-stone-400'}`}
            >
              <Compass className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setViewMode('helix');
                playHapticTick();
              }}
              title="Code-Switching Helix"
              className={`p-1 rounded ${viewMode === 'helix' ? 'bg-stone-800 text-stone-100' : 'text-stone-400'}`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Auto rotate toggle */}
          <button
            onClick={() => {
              setAutoRotate(!autoRotate);
              playHapticTick();
            }}
            title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
            className={`p-1 rounded border border-white/5 text-[11px] font-mono transition-colors ${
              autoRotate ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-stone-400'
            }`}
          >
            <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>
        </div>
      </div>

      {/* Viewport: 2D Interactive Fallback Map OR WebGL Canvas */}
      {hasWebGLError ? (
        <div className="w-full flex-1 relative min-h-[360px] p-4 flex flex-col items-center justify-center bg-radial from-slate-900/60 via-slate-950 to-[#0b0c10]">
          <svg
            viewBox="0 0 800 420"
            className="w-full h-full max-h-[460px] select-none"
          >
            {/* Ambient Grid references */}
            <circle cx="400" cy="210" r="170" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <circle cx="400" cy="210" r="90" fill="none" stroke="rgba(255,255,255,0.04)" />
            <line x1="120" y1="210" x2="680" y2="210" stroke="rgba(255,255,255,0.04)" />
            <line x1="400" y1="40" x2="400" y2="380" stroke="rgba(255,255,255,0.04)" />

            {/* Vector Inter-Dialect Links */}
            {NODE_LINKS.map(([srcId, dstId], lIdx) => {
              const srcNode = NODES_DATA.find((n) => n.id === srcId);
              const dstNode = NODES_DATA.find((n) => n.id === dstId);
              if (!srcNode || !dstNode) return null;

              const isSrcVisible =
                filterDialect === 'all' ||
                (filterDialect === 'Tanglish' && (srcNode.dialect === 'Tanglish' || srcNode.dialect === 'CodeSwitch')) ||
                (filterDialect === 'Hinglish' && (srcNode.dialect === 'Hinglish' || srcNode.dialect === 'CodeSwitch')) ||
                srcNode.dialect === filterDialect;

              const isDstVisible =
                filterDialect === 'all' ||
                (filterDialect === 'Tanglish' && (dstNode.dialect === 'Tanglish' || dstNode.dialect === 'CodeSwitch')) ||
                (filterDialect === 'Hinglish' && (dstNode.dialect === 'Hinglish' || dstNode.dialect === 'CodeSwitch')) ||
                dstNode.dialect === filterDialect;

              if (!isSrcVisible || !isDstVisible) return null;

              const x1 = 400 + srcNode.pos[0] * 68;
              const y1 = 210 - srcNode.pos[1] * 34;
              const x2 = 400 + dstNode.pos[0] * 68;
              const y2 = 210 - dstNode.pos[1] * 34;

              return (
                <line
                  key={`link-${lIdx}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#38bdf8"
                  strokeOpacity="0.22"
                  strokeWidth="1.2"
                  strokeDasharray="4 3"
                />
              );
            })}

            {/* Dialect Nodes */}
            {NODES_DATA.map((node) => {
              const isVisible =
                filterDialect === 'all' ||
                (filterDialect === 'Tanglish' && (node.dialect === 'Tanglish' || node.dialect === 'CodeSwitch')) ||
                (filterDialect === 'Hinglish' && (node.dialect === 'Hinglish' || node.dialect === 'CodeSwitch')) ||
                node.dialect === filterDialect;

              if (!isVisible) return null;

              const cx = 400 + node.pos[0] * 68;
              const cy = 210 - node.pos[1] * 34;
              const isSelected = selectedNode?.id === node.id;
              const isHovered = hoveredNode?.id === node.id;
              const colorHex = `#${node.color.toString(16).padStart(6, '0')}`;

              return (
                <g
                  key={node.id}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => {
                    setSelectedNode(node);
                    playHapticTick();
                  }}
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* Outer pulse aura */}
                  {(isSelected || isHovered) && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="20"
                      fill={colorHex}
                      fillOpacity="0.2"
                      className="animate-ping"
                      style={{ animationDuration: '2s' }}
                    />
                  )}

                  {/* Halo disk */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? '14' : isHovered ? '12' : '9'}
                    fill="#0f172a"
                    stroke={colorHex}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                  />

                  {/* Center nucleus */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? '6' : '4'}
                    fill={colorHex}
                  />

                  {/* Label */}
                  <text
                    x={cx}
                    y={cy + 22}
                    textAnchor="middle"
                    fill={isSelected || isHovered ? '#ffffff' : '#94a3b8'}
                    fontSize={isSelected ? '11' : '10'}
                    fontFamily="monospace"
                    className="font-medium pointer-events-none select-none"
                  >
                    {node.label}
                  </text>
                  {node.transliteration && (
                    <text
                      x={cx}
                      y={cy + 34}
                      textAnchor="middle"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="system-ui, sans-serif"
                      className="pointer-events-none select-none"
                    >
                      {node.transliteration}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        /* WebGL Canvas Viewport */
        <div
          ref={mountRef}
          className="w-full flex-1 relative min-h-[360px] cursor-grab active:cursor-grabbing select-none"
        />
      )}

      {/* Floating 3D Vector Inspector HUD (On Hover or Select) */}
      {(hoveredNode || selectedNode) && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:w-96 p-3.5 rounded-lg border border-white/10 bg-[#12141c]/95 backdrop-blur-xl shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {(() => {
            const active = hoveredNode || selectedNode!;
            return (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-white/20"
                      style={{ backgroundColor: `#${active.color.toString(16).padStart(6, '0')}` }}
                    />
                    <span className="text-xs font-mono font-semibold text-stone-200">
                      {active.dialect} Cluster
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-stone-400">
                    d = {active.vectorDistance.toFixed(3)}
                  </span>
                </div>

                <div>
                  <div className="text-sm font-semibold text-stone-100 font-serif">
                    "{active.label}"
                  </div>
                  {active.transliteration && (
                    <div className="text-xs text-stone-400 font-mono mt-0.5">
                      Script: {active.transliteration}
                    </div>
                  )}
                </div>

                <div className="p-2 rounded bg-black/40 border border-white/5 text-xs text-stone-300 font-mono italic">
                  "{active.samplePhrase}"
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <div className="text-[10px] font-mono text-stone-400">
                    Confidence: {(active.confidence * 100).toFixed(0)}%
                  </div>

                  {onSelectNodePrompt && (
                    <button
                      onClick={() => {
                        onSelectNodePrompt(active.samplePhrase);
                        playHapticTick();
                      }}
                      className="px-2.5 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3 h-3" />
                      Test in Bench
                    </button>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Bottom Hint */}
      <div className="px-4 py-2 border-t border-white/5 bg-black/40 text-[11px] font-mono text-stone-500 flex items-center justify-between">
        <span>Click & drag to orbit 3D space · Scroll to zoom</span>
        <span>{NODES_DATA.length} dialect vectors indexed</span>
      </div>
    </div>
  );
};
