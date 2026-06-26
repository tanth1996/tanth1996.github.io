import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

interface DiagramNode {
  id: string;
  name: string;
  geometryType: 'box' | 'cylinder' | 'sphere';
  position: THREE.Vector3;
  logoUrl: string;
  color: number;
  wireframeColor: number;
  size?: [number, number, number] | [number, number, number, number]; // dimensions
}

interface DiagramConnection {
  from: string;
  to: string;
  color: number;
  isBidirectional: boolean;
}

@Component({
  selector: 'app-system-diagram',
  standalone: true,
  imports: [],
  templateUrl: './system-diagram.html',
  styleUrl: './system-diagram.scss',
})
export class SystemDiagramComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas!: ElementRef<HTMLCanvasElement>;

  private document = inject(DOCUMENT);

  // Configuration Inputs using Modern Signal Inputs
  public angularLogo = input<string>('/assets/logos/angular.png');
  public nginxLogo = input<string>('/assets/logos/nginx.png');
  public k8sLogo = input<string>('/assets/logos/kubernetes.png');
  public nodejsLogo = input<string>('/assets/logos/nodejs.png');
  public dotnetLogo = input<string>('/assets/logos/dotnet.png');
  public oracleLogo = input<string>('/assets/logos/oracle.png');
  public mongoLogo = input<string>('/assets/logos/mongodb.png');
  public githubLogo = input<string>('/assets/logos/github.png');
  public copilotLogo = input<string>('/assets/logos/copilot.png');

  // Core Three.js Engine Variables
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private clock = new THREE.Clock();
  private animationFrameId!: number;

  // Trackers for objects to update during rendering loop
  private nodeMeshes: Map<string, THREE.Object3D> = new Map();
  private spriteObjects: THREE.Sprite[] = [];
  private dataPackets: {
    mesh: THREE.Mesh;
    pathPoints: THREE.Vector3[];
    progress: number;
    speed: number;
  }[] = [];

  // Topology Definition State Arrays
  private nodesConfig: DiagramNode[] = [];
  private connectionsConfig: DiagramConnection[] = [];

  ngOnInit() {
    this.initializeTopology();
  }

  ngAfterViewInit(): void {
    this.initThree();
    this.buildInfrastructure();
    this.animate();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.renderer?.dispose();
  }

  /**
   * Modularity Engine: Define your node properties and structural layout here.
   * Coordinate space spaces nodes gracefully from left to right, adapting automatically.
   */
  private initializeTopology() {
    this.nodesConfig = [
      {
        id: 'angular',
        name: 'Angular Client',
        geometryType: 'box',
        position: new THREE.Vector3(-10, 2, 0),
        logoUrl: this.angularLogo(),
        color: 0x161b22,
        wireframeColor: 0xdd0031,
        size: [1.8, 1.8, 1.8],
      },
      {
        id: 'nginx',
        name: 'Nginx Frontend',
        geometryType: 'box',
        position: new THREE.Vector3(-5, 1, 0),
        logoUrl: this.nginxLogo(),
        color: 0x161b22,
        wireframeColor: 0x009639,
        size: [1.6, 2.2, 1.6],
      },
      {
        id: 'k8s',
        name: 'Kubernetes Cluster',
        geometryType: 'box',
        position: new THREE.Vector3(0, 2, 0),
        logoUrl: this.k8sLogo(),
        color: 0x0d1117,
        wireframeColor: 0x326ce5,
        size: [15, 5, 10],
      },
      {
        id: 'nodejs',
        name: 'Node.js Backend',
        geometryType: 'box',
        position: new THREE.Vector3(5, 2, -2),
        logoUrl: this.nodejsLogo(),
        color: 0x161b22,
        wireframeColor: 0x339933,
        size: [1.6, 1.6, 1.6],
      },
      {
        id: 'dotnet',
        name: '.NET Backend',
        geometryType: 'box',
        position: new THREE.Vector3(5, 2, 2),
        logoUrl: this.dotnetLogo(),
        color: 0x161b22,
        wireframeColor: 0x512bd4,
        size: [1.6, 1.6, 1.6],
      },
      {
        id: 'oracle',
        name: 'Oracle SQL',
        geometryType: 'cylinder',
        position: new THREE.Vector3(10, 0.5, -3),
        logoUrl: this.oracleLogo(),
        color: 0x161b22,
        wireframeColor: 0xf80000,
        size: [1.2, 1.2, 2.5, 15],
      },
      {
        id: 'mongodb',
        name: 'MongoDB',
        geometryType: 'cylinder',
        position: new THREE.Vector3(10, 0.5, 3),
        logoUrl: this.mongoLogo(),
        color: 0x161b22,
        wireframeColor: 0x47a248,
        size: [1.2, 1.2, 2.5, 15],
      },
      {
        id: 'github',
        name: 'GitHub Actions',
        geometryType: 'sphere',
        position: new THREE.Vector3(0, -4.5, 0),
        logoUrl: this.githubLogo(),
        color: 0x161b22,
        wireframeColor: 0x24292e,
        size: [1, 32, 32],
      },
      {
        id: 'copilot',
        name: 'GitHub Copilot',
        geometryType: 'sphere',
        position: new THREE.Vector3(-4.5, -4.5, 0),
        logoUrl: this.copilotLogo(),
        color: 0x161b22,
        wireframeColor: 0x00b7ff,
        size: [1, 32, 32],
      },
    ];

    this.connectionsConfig = [
      { from: 'nginx', to: 'angular', color: 0x414853, isBidirectional: false },
      { from: 'k8s', to: 'nginx', color: 0x414853, isBidirectional: true },
      { from: 'angular', to: 'nodejs', color: 0x00e396, isBidirectional: true },
      { from: 'angular', to: 'dotnet', color: 0x00e396, isBidirectional: true },
      { from: 'k8s', to: 'nodejs', color: 0x414853, isBidirectional: true },
      { from: 'k8s', to: 'dotnet', color: 0x414853, isBidirectional: true },
      { from: 'nodejs', to: 'mongodb', color: 0x414853, isBidirectional: true },
      { from: 'dotnet', to: 'oracle', color: 0x414853, isBidirectional: true },
      { from: 'github', to: 'k8s', color: 0x2188ff, isBidirectional: false },
      { from: 'copilot', to: 'github', color: 0x2188ff, isBidirectional: false },
    ];
  }

  private initThree() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xc7c9c9);

    const canvas = this.rendererCanvas.nativeElement;
    const width = canvas.parentElement!.clientWidth;
    const height = canvas.parentElement!.clientHeight;

    // Dynamic Camera Configuration
    this.camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    this.updateCameraForScreenSize(width, height);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxPolarAngle = Math.PI / 2 + 0.1; // Restrict bottom camera flipping

    // Lighting Configuration
    this.scene.add(new THREE.AmbientLight(0xaaaaaa));
    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(5, 15, 7);
    this.scene.add(dirLight1);
  }

  private buildInfrastructure() {
    // // Ground Grid System
    // const grid = new THREE.GridHelper(45, 45, 0x21262d, 0x161b22);
    // grid.position.y = -6;
    // this.scene.add(grid);

    const textureLoader = new THREE.TextureLoader();

    // Node Construction Loop
    this.nodesConfig.forEach((node) => {
      let geom: THREE.BufferGeometry;

      if (node.geometryType === 'cylinder') {
        const s = node.size as [number, number, number, number];
        geom = new THREE.CylinderGeometry(s[0], s[1], s[2], s[3]);
      } else if (node.geometryType === 'sphere') {
        const s = node.size as [number, number, number];
        geom = new THREE.SphereGeometry(s[0], s[1], s[2]);
      } else {
        const s = node.size as [number, number, number];
        geom = new THREE.BoxGeometry(s[0], s[1], s[2]);
      }

      const mat = new THREE.MeshPhongMaterial({
        color: node.color,
        shininess: 80,
        specular: node.wireframeColor,
        emissive: node.wireframeColor, // Subtle interior glow
        emissiveIntensity: 0.15,
        transparent: true,
        opacity: 0.1,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.copy(node.position);
      this.scene.add(mesh);

      // Colored Outer Wireframe Accents
      const wireGeom = new THREE.EdgesGeometry(geom);
      const wireMat = new THREE.LineBasicMaterial({ color: node.wireframeColor, linewidth: 2 });
      const wireframe = new THREE.LineSegments(wireGeom, wireMat);
      mesh.add(wireframe);

      this.nodeMeshes.set(node.id, mesh);

      // Billboarding Technology Logo Implementation
      textureLoader.load(
        node.logoUrl,
        (texture) => {
          // Parse the image using the correct sRGB color profile
          texture.colorSpace = THREE.SRGBColorSpace;
          texture.needsUpdate = true;

          const img = texture.image;
          const aspectRatio = img.width / img.height;

          const maxWidth = 2.0; // The absolute widest a logo can ever expand horizontally
          const maxHeight = 1.2; // The absolute tallest a logo can ever expand vertically

          let scaleX = maxWidth;
          let scaleY = scaleX / aspectRatio;

          if (scaleY > maxHeight) {
            scaleY = maxHeight;
            scaleX = scaleY * aspectRatio;
          }

          const spriteMat = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            color: 0xffffff, // Prevents any weird color tinting overrides
            fog: false,
          });
          const sprite = new THREE.Sprite(spriteMat);

          // Apply the mathematically corrected aspect ratio scale
          sprite.scale.set(scaleX, scaleY, 1);

          // Position logo safely above the node geometry
          const verticalOffset = node.geometryType === 'cylinder' ? 1.8 : 1.4;
          sprite.position.set(0, verticalOffset, 0);

          mesh.add(sprite);
          this.spriteObjects.push(sprite);
        },
        undefined,
        () => {
          console.warn(
            `Texture failed to load for node: ${node.id}. Using default placeholder styling.`,
          );
        },
      );
    });

    // Connections & Traffic Spline Generation Loop
    this.connectionsConfig.forEach((conn) => {
      const fromNode = this.nodeMeshes.get(conn.from);
      const toNode = this.nodeMeshes.get(conn.to);

      const isBidirectional = conn.isBidirectional ?? false;

      if (fromNode && toNode) {
        const startPos = fromNode.position.clone();
        const endPos = toNode.position.clone();

        // 1. Create the base structural layout line
        const centerPoints = [startPos, endPos];
        const lineGeom = new THREE.BufferGeometry().setFromPoints(centerPoints);
        const lineMat = new THREE.LineBasicMaterial({
          color: conn.color,
          transparent: true,
          opacity: 0.4,
        });
        const line = new THREE.Line(lineGeom, lineMat);
        this.scene.add(line);

        // 2. Conditional Traffic Routing
        if (isBidirectional) {
          // 🛣️ TWO-LANE HIGHWAY: Shift lanes left/right and spawn outbound + inbound packets
          const lineDirection = new THREE.Vector3().subVectors(endPos, startPos).normalize();
          const sideVector = new THREE.Vector3()
            .crossVectors(lineDirection, new THREE.Vector3(0, 1, 0))
            .normalize();
          const laneOffset = sideVector.multiplyScalar(0.12);

          // Lane 1: Forward (A -> B)
          const forwardRoute = [startPos.clone().add(laneOffset), endPos.clone().add(laneOffset)];
          this.spawnPacketAcrossRoute(forwardRoute, conn.color);

          // Lane 2: Return (B -> A)
          const backwardRoute = [endPos.clone().sub(laneOffset), startPos.clone().sub(laneOffset)];
          this.spawnPacketAcrossRoute(backwardRoute, conn.color);
        } else {
          // 🧭 SINGLE LANE: Spawn a single packet stream running directly down the center line
          const singleRoute = [startPos, endPos];
          this.spawnPacketAcrossRoute(singleRoute, conn.color);
        }
      }
    });
  }

  private spawnPacketAcrossRoute(points: THREE.Vector3[], color: number) {
    const packetGeom = new THREE.SphereGeometry(0.12, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: color });
    const packetMesh = new THREE.Mesh(packetGeom, packetMat);
    this.scene.add(packetMesh);

    this.dataPackets.push({
      mesh: packetMesh,
      pathPoints: points,
      progress: Math.random(), // Staggers starting execution phases
      speed: 0.25 + Math.random() * 0.15,
    });
  }

  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    this.controls.update();

    // Subtle floating animations on infrastructure meshes
    this.nodeMeshes.forEach((mesh, id) => {
      const offset = id.charCodeAt(0);
      mesh.position.y =
        this.nodesConfig.find((n) => n.id === id)!.position.y +
        Math.sin(elapsed * 1.5 + offset) * 0.12;
    });

    // Direct Packet Lifecycle Flow Updates
    this.dataPackets.forEach((packet) => {
      packet.progress += delta * packet.speed;
      if (packet.progress > 1.0) {
        packet.progress = 0;
      }
      // Linearly interpolate coordinates from point A to point B
      packet.mesh.position.lerpVectors(packet.pathPoints[0], packet.pathPoints[1], packet.progress);
    });

    this.renderer.render(this.scene, this.camera);
  };

  /**
   * Narrow Screen Optimization Guard Strategy: Modulates perspective
   * layouts based on dynamic layout constraints to maintain viewing safety bounds.
   */
  private updateCameraForScreenSize(width: number, height: number) {
    if (width < 600) {
      // Extremely narrow screens (Mobile)
      this.camera.position.set(0, 8.4, 15.6);
      this.camera.fov = 65;
    } else if (width < 992) {
      // Mid-tier narrow viewports (Tablets)
      this.camera.position.set(0, 7.3, 16.2);
      this.camera.fov = 55;
    } else {
      // Desktop Layout Monitors
      this.camera.position.set(0, 8, 18);
      this.camera.fov = 45;
    }
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  @HostListener('window:resize')
  public onResize() {
    const canvas = this.rendererCanvas.nativeElement;
    const width = canvas.parentElement!.clientWidth;
    const height = canvas.parentElement!.clientHeight;
    this.updateCameraForScreenSize(width, height);
    this.renderer.setSize(width, height, false);
  }
}
