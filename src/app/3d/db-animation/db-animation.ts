import {
  AfterViewInit,
  Component,
  computed,
  DOCUMENT,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

@Component({
  selector: 'app-db-animation',
  imports: [],
  templateUrl: './db-animation.html',
  styleUrl: './db-animation.scss',
})
export class DbAnimation implements OnInit, AfterViewInit {
  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas!: ElementRef<HTMLCanvasElement>;

  private document = inject(DOCUMENT);

  public canvasHeight = input(500);
  public packetFrequency = signal(3);

  public isInfoCardVisible = signal(false);
  public controlsEnabled = signal(false);

  public displayStatusText = signal('');
  public displayStatusColour = signal('#58a6ff');
  public displayDescriptionText = signal('');
  public displayFrequency = computed(() => this.packetFrequency().toFixed(1));
  public displayBufferCount = signal(0);
  public displayBackpressureText = signal('INACTIVE');
  public displayBackpressureTextColour = signal('#00e396');

  private startX = -8;
  private endX = 8;
  private queueLength = this.endX - this.startX;
  private maxPacketsInChannel = 7;

  // --- Packet Pool ---
  private maxPackets = 600;
  private packets: THREE.Mesh[] = [];
  private packetGeom = new THREE.SphereGeometry(0.1, 8, 8);
  private packetMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0x00ffff,
    emissiveIntensity: 1,
  });

  // --- Runtime State Variables ---
  private spawnAccumulator = 0;
  private lastDbConsumeTime = 0;
  private backpressureThrottled = false;
  private lastPhase = 1;

  private spawnInterval = 0.333;
  private packetBaseSize = 1.0;
  private targetQueueOpacity = 0;
  private targetQueueRadius = 0.1;
  private targetSpiralIntensity = 0;
  private currentSpiralIntensity = 0;

  private minPacketFreq = 3;
  private maxPacketFreq = 10;
  private phase2StartTime = 5;
  private phase3StartTime = 10;
  private cycleTime = 20;

  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer = null!;
  private controls: OrbitControls = null!;
  private timer: THREE.Timer;
  private queueMat: THREE.MeshPhongMaterial;
  private queueChannel: THREE.Mesh;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      100,
      window.innerWidth / this.canvasHeight(),
      10,
      1000,
    );

    this.timer = new THREE.Timer();
    this.timer.connect(this.document);

    this.queueMat = new THREE.MeshPhongMaterial({
      color: 0x00e396,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const queueGeom = new THREE.CylinderGeometry(1.4, 1.4, this.queueLength, 32, 1, true);
    this.queueChannel = new THREE.Mesh(queueGeom, this.queueMat);
  }

  ngOnInit() {}

  ngAfterViewInit(): void {
    // --- Core 3D Setup ---
    this.scene.rotation.y = 0.69;

    this.scene.fog = new THREE.FogExp2(0x0b0f19, 0.025);

    this.camera.aspect = window.innerWidth / this.canvasHeight();
    this.camera.position.set(-0.23, 5.6, 20.7);
    this.camera.updateProjectionMatrix();

    const canvas = this.rendererCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    this.renderer.setSize(window.innerWidth, this.canvasHeight());
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(-2.3, -15.4, 0.6);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lights
    this.scene.add(new THREE.AmbientLight(0x222222));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // --- Infrastructure Objects ---
    const grid = new THREE.GridHelper(40, 40, 0x1c2128, 0x1c2128);
    grid.position.y = -2;
    this.scene.add(grid);

    const nodeMat = new THREE.MeshPhongMaterial({
      color: 0x161b22,
      specular: 0x58a6ff,
      shininess: 100,
    });
    const glowMatCyan = new THREE.LineBasicMaterial({ color: 0x00ffff });
    const glowMatPink = new THREE.LineBasicMaterial({ color: 0xff4560 });

    // Server (Cuboid)
    const serverGeom = new THREE.BoxGeometry(3, 5, 3);
    const server = new THREE.Mesh(serverGeom, nodeMat);
    server.position.x = this.startX;
    this.scene.add(server);
    const serverWire = new THREE.LineSegments(new THREE.EdgesGeometry(serverGeom), glowMatCyan);
    server.add(serverWire);

    // Database (Cylinder)
    const dbGeom = new THREE.CylinderGeometry(2, 2, 4, 32);
    const db = new THREE.Mesh(dbGeom, nodeMat);
    db.position.x = this.endX;
    this.scene.add(db);
    const dbWire = new THREE.LineSegments(new THREE.EdgesGeometry(dbGeom), glowMatPink);
    db.add(dbWire);

    // Connection Line
    const linePoints = [new THREE.Vector3(this.startX, 0, 0), new THREE.Vector3(this.endX, 0, 0)];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
    const connectionLine = new THREE.Line(
      lineGeom,
      new THREE.LineBasicMaterial({
        color: 0x373e47,
        transparent: false,
        opacity: 0.5,
      }),
    );
    this.scene.add(connectionLine);

    // Translucent Buffer Channel
    const queueStartX = this.endX - this.queueLength;
    this.queueChannel.rotation.z = Math.PI / 2;
    this.queueChannel.position.x = queueStartX + this.queueLength / 2;
    this.queueChannel.scale.set(0.1, 1, 0.1);
    this.queueChannel.visible = false;
    this.scene.add(this.queueChannel);

    // Packet Pool Initialisation
    for (let i = 0; i < this.maxPackets; i++) {
      const p = new THREE.Mesh(this.packetGeom, this.packetMat.clone());
      p.visible = false;
      p.userData = { active: false, progress: 0, isQueued: false };
      this.scene.add(p);
      this.packets.push(p);
    }

    requestAnimationFrame((timestamp) => this.animate(timestamp));
  }

  // --- Animation Loop ---
  private animate(timestamp: number) {
    requestAnimationFrame((timestamp) => this.animate(timestamp));
    this.controls.update();

    this.timer.update(timestamp);
    const delta = this.timer.getDelta();
    const elapsed = this.timer.getElapsed();
    const t = elapsed % this.cycleTime;

    // --- Phase State Evaluation ---
    let currentPhase = 1;
    if (t < this.phase2StartTime) {
      currentPhase = 1;
    } else if (t < this.phase3StartTime) {
      currentPhase = 2;
    } else {
      currentPhase = 3;
    }

    // Boundary Security Guard: Direct Phase 3 -> Phase 1 Loop Transition
    if (currentPhase === 1 && this.lastPhase === 3) {
      this.packets.forEach((p) => {
        p.userData['active'] = false;
        p.visible = false;
      });
      this.backpressureThrottled = false;
    }
    this.lastPhase = currentPhase;

    // --- Phase Parameter Execution ---
    if (currentPhase === 1) {
      this.displayStatusText.set('Phase 1: Frequency Scaling');
      this.displayStatusColour.set('#58a6ff');
      this.displayDescriptionText.set(
        'Small packets transmitting across connection line. Frequency ramps from 3Hz up to 10Hz.',
      );

      this.packetBaseSize = 1.0;
      this.packetFrequency.set(
        this.minPacketFreq + (this.maxPacketFreq - this.minPacketFreq) * (t / this.phase2StartTime),
      );

      this.targetQueueOpacity = 0;
      this.targetQueueRadius = 0.1;
      this.targetSpiralIntensity = 0;
    } else if (currentPhase === 2) {
      this.displayStatusText.set('Phase 2: Payload Escalation');
      this.displayStatusColour.set('#feb019');
      this.displayDescriptionText.set(
        'Packet size scales up significantly. Generation rate resets to 3Hz and builds back up to 10Hz.',
      );

      this.packetBaseSize = 2.5;
      this.packetFrequency.set(
        this.minPacketFreq +
          (this.maxPacketFreq - this.minPacketFreq) *
            ((t - this.phase2StartTime) / (this.phase3StartTime - this.phase2StartTime)),
      );

      this.targetQueueOpacity = 0;
      this.targetQueueRadius = 0.1;
      this.targetSpiralIntensity = 0;
    } else if (currentPhase === 3) {
      this.displayStatusText.set('Phase 3: Buffer Inundation');
      this.displayStatusColour.set('#ff4560');
      this.displayDescriptionText.set(
        'Channel active! Database bottlenecks to 5Hz max, triggering accumulation.',
      );

      this.packetBaseSize = 3.5;
      this.packetFrequency.set(this.maxPacketFreq);

      this.targetQueueOpacity = 0.4;
      this.targetQueueRadius = 1.0;
      this.targetSpiralIntensity = 1.0; // Enable orbital displacement
    }

    this.spawnInterval = 1 / this.packetFrequency();

    // --- Morph Channel Geometry Properties ---
    this.queueMat.opacity = THREE.MathUtils.lerp(
      this.queueMat.opacity,
      this.targetQueueOpacity,
      0.05,
    );
    const currentR = this.queueChannel.scale.x;
    const newR = THREE.MathUtils.lerp(currentR, this.targetQueueRadius, 0.05);
    this.queueChannel.scale.set(newR, 1, newR);
    this.queueChannel.visible = this.queueMat.opacity > 0.01;

    this.currentSpiralIntensity = THREE.MathUtils.lerp(
      this.currentSpiralIntensity,
      this.targetSpiralIntensity,
      0.05,
    );

    // --- Calculate Buffer Metrics & Evaluate Hysteresis Logic ---
    let packetsInChannel = this.packets.filter((p) => p.userData['active']).length;

    this.backpressureThrottled = currentPhase === 3 && packetsInChannel >= this.maxPacketsInChannel;

    this.displayBufferCount.set(packetsInChannel);

    if (this.backpressureThrottled) {
      this.displayBackpressureText.set('ACTIVE (HALTED)');
      this.displayBackpressureTextColour.set('#ff4560');
    } else {
      this.displayBackpressureText.set('INACTIVE');
      this.displayBackpressureTextColour.set('#00e396');
    }

    // --- Packet Generation Dispatcher ---
    this.spawnAccumulator += delta;
    if (this.spawnAccumulator >= this.spawnInterval) {
      this.spawnAccumulator -= this.spawnInterval;
      if (this.spawnAccumulator > this.spawnInterval) this.spawnAccumulator = 0;

      if (!this.backpressureThrottled) {
        const p = this.packets.find((packet) => !packet.userData['active']);
        if (p) {
          p.visible = true;
          p.userData['active'] = true;
          p.userData['progress'] = 0;
          p.userData['isQueued'] = false;
          p.position.set(this.startX, 0, 0);
          p.scale.set(this.packetBaseSize, this.packetBaseSize, this.packetBaseSize);

          const packetMeshMaterial = p.material as THREE.MeshStandardMaterial;

          if (currentPhase === 1) packetMeshMaterial.emissive.setHex(0x00ffff);
          else if (currentPhase === 2) packetMeshMaterial.emissive.setHex(0xfeb019);
          else packetMeshMaterial.emissive.setHex(0x00e396);
        }
      }
    }

    // --- Sorting & Positional Physics Mapping ---
    let activePackets = this.packets.filter((p) => p.userData['active']);
    // Sort closest to DB first to manage positional dependencies downstream
    activePackets.sort((a, b) => b.userData['progress'] - a.userData['progress']);

    const minSpacing = 0.65;
    const dbTargetX = this.endX - 1.5;

    activePackets.forEach((p, index) => {
      if (currentPhase === 3) {
        // Maximum physical linear bounds allowed for this specific index in line queue
        let maxAllowedX = dbTargetX - index * minSpacing;

        p.userData['progress'] += delta / 1.4; // Base transit velocity constant
        let desiredX = THREE.MathUtils.lerp(this.startX, this.endX, p.userData['progress']);

        p.position.x = desiredX;
        if (desiredX >= maxAllowedX) {
          //   p.position.x = maxAllowedX;
          //   p.position.x = maxAllowedX;
          p.userData['isQueued'] = true;
        } else {
          //   p.position.x = desiredX;
          //   p.position.x = desiredX;
          p.userData['isQueued'] = false;
        }

        // Apply orbital motion inside buffer channel space conditional to motion state
        if (this.currentSpiralIntensity > 0.02) {
          // Packets that are locked deep in accumulation queue experience lessened spiral velocity
          let kineticFactor = p.userData['isQueued'] ? 0.15 : 1.0;
          p.position.y =
            Math.sin(elapsed * 8 + p.position.x) *
            (this.currentSpiralIntensity * 0.6 * kineticFactor);
          p.position.z =
            Math.cos(elapsed * 8 + p.position.x) *
            (this.currentSpiralIntensity * 0.6 * kineticFactor);
        }
      } else {
        // Standard linear path mode execution
        p.userData['progress'] += delta / 1.4;
        p.position.x = THREE.MathUtils.lerp(this.startX, this.endX, p.userData['progress']);
        p.userData['isQueued'] = false;
      }

      if (p.userData['progress'] >= 1.0) {
        p.visible = false;
        p.userData['active'] = false;
      }
    });

    // --- Database Consumption Controller ---
    if (currentPhase === 3 && activePackets.length > 0) {
      let leadingPacket = activePackets[0];
      // Process depletion when leading element touches buffer front bounds
      if (leadingPacket.position.x >= dbTargetX - 0.05) {
        if (elapsed - this.lastDbConsumeTime >= 0.2) {
          // 1 / 5 packets per second = 0.2s interval constraint
          leadingPacket.visible = false;
          leadingPacket.userData['active'] = false;
          this.lastDbConsumeTime = elapsed;
        }
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('window:resize')
  public onResize() {
    this.camera.aspect = window.innerWidth / this.canvasHeight();
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, this.canvasHeight());
  }
}
