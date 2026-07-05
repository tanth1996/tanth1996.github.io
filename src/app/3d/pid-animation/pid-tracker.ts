import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

interface HistoryNode {
  x: number;
  yCurrent: number;
  yTarget: number;
}

@Component({
  selector: 'app-pid-tracker',
  standalone: true,
  imports: [],
  templateUrl: './pid-tracker.html',
  styleUrl: './pid-tracker.scss',
})
export class PidTracker implements OnInit, AfterViewInit {
  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas!: ElementRef<HTMLCanvasElement>;

  private document = inject(DOCUMENT);

  // Flexible height parameter supporting either explicit pixel value or full viewport height
  public canvasHeight = input<number | string>('100vh');

  // --- Simulation & PID Constants ---
  private readonly Kp = 5;
  private readonly Ki = 1;
  private readonly Kd = 2;

  private targetValue = 2.0;
  private currentValue = 0.0;
  private integralError = 0.0;
  private lastError = 0.0;
  private velocity = 0.0;

  private stableTimeCounter = 0;
  private readonly STABILITY_THRESHOLD = 0.04;
  private readonly STABILITY_DURATION = 1.2;

  private lastTargetChangeTimeCounter = 0;
  private readonly MIN_TARGET_CHANGE_TIME = 3;

  // --- Extended Tracking Window Memory ---
  private readonly MAX_POINTS = 1000;
  private readonly X_SPACING = 0.03;
  private timeStepCounter = 0;
  private dynamicHistory: HistoryNode[] = [];

  // --- Three.js Framework Elements ---
  private scene: THREE.Scene;
  private camera!: THREE.OrthographicCamera;
  private renderer!: THREE.WebGLRenderer;
  private gridHelper!: THREE.GridHelper;
  private clock: THREE.Clock;

  private signalGeom!: THREE.BufferGeometry;
  private targetGeom!: THREE.BufferGeometry;
  private errorGeom!: LineGeometry;
  private trackerGroup!: THREE.Group;

  private accumulator = 0;
  private readonly timeStep = 1 / 60;
  private readonly viewSize = 12;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0b0f19');
    this.clock = new THREE.Clock();
  }

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const width = window.innerWidth;
    const height = this.calculateHeight();
    const aspect = width / height;

    // --- Orthographic Camera Setup ---
    this.camera = new THREE.OrthographicCamera(
      (-this.viewSize * aspect) / 2,
      (this.viewSize * aspect) / 2,
      this.viewSize / 2,
      -this.viewSize / 2,
      0.1,
      1000,
    );
    this.camera.position.set(0, 0, 1);

    // --- WebGL Renderer Initialization ---
    const canvas = this.rendererCanvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // --- Background Layer Layout Grid ---
    this.gridHelper = new THREE.GridHelper(120, 80, 0x373e47, 0x1c2128);
    this.gridHelper.rotation.x = Math.PI / 2;
    this.gridHelper.position.z = -0.5;
    this.scene.add(this.gridHelper);

    // --- Instantiating Ribbon Objects ---
    this.signalGeom = this.createRibbonGeometry(this.MAX_POINTS);
    const signalMat = new THREE.MeshBasicMaterial({
      color: 0x00b7ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95,
    });
    const signalRibbon = new THREE.Mesh(this.signalGeom, signalMat);
    signalRibbon.frustumCulled = false; // Disable culling to ensure continuity during endless trace
    this.scene.add(signalRibbon);

    this.targetGeom = this.createRibbonGeometry(this.MAX_POINTS);
    const targetMat = new THREE.MeshBasicMaterial({
      color: 0x00e396,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.4,
    });
    const targetRibbon = new THREE.Mesh(this.targetGeom, targetMat);
    targetRibbon.frustumCulled = false;
    this.scene.add(targetRibbon);

    this.errorGeom = new LineGeometry();
    this.errorGeom.setPositions([0, 0, 0.1, 0, 0, 0.1]);
    const errorMat = new LineMaterial({
      color: 0xff4560,
      linewidth: 3,
      transparent: true,
      opacity: 0.4,
    });
    const errorLine = new Line2(this.errorGeom, errorMat);
    errorLine.frustumCulled = false;
    this.scene.add(errorLine);

    // --- Target Dot Tracker Mesh ---
    this.trackerGroup = new THREE.Group();
    const coreGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    this.trackerGroup.add(coreMesh);

    const auraGeo = new THREE.RingGeometry(0.16, 0.24, 16);
    const auraMat = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const auraMesh = new THREE.Mesh(auraGeo, auraMat);
    this.trackerGroup.add(auraMesh);
    this.scene.add(this.trackerGroup);

    // Kickstart Loop Sequence
    this.clock.start();
    requestAnimationFrame(() => this.tick());
  }

  // --- Animation Core Loop Processing ---
  private tick(): void {
    requestAnimationFrame(() => this.tick());

    let delta = this.clock.getDelta();
    this.accumulator += delta;

    while (this.accumulator >= this.timeStep) {
      this.simulatePID(this.timeStep);

      this.timeStepCounter++;
      const currentX = this.timeStepCounter * this.X_SPACING;

      this.dynamicHistory.push({
        x: currentX,
        yCurrent: this.currentValue,
        yTarget: this.targetValue,
      });

      if (this.dynamicHistory.length > this.MAX_POINTS) {
        this.dynamicHistory.shift();
      }

      this.accumulator -= this.timeStep;
    }

    this.updateRibbonPath(this.signalGeom, this.dynamicHistory, 'signal', 0.12);
    this.updateRibbonPath(this.targetGeom, this.dynamicHistory, 'target', 0.04);

    if (this.dynamicHistory.length > 0) {
      const leadNode = this.dynamicHistory[this.dynamicHistory.length - 1];
      this.trackerGroup.position.set(leadNode.x, leadNode.yCurrent, 0.1);

      this.errorGeom.setPositions([
        leadNode.x,
        leadNode.yCurrent,
        0.1, // Start node
        leadNode.x,
        leadNode.yTarget,
        0.1, // End node
      ]);

      const aspect = window.innerWidth / this.calculateHeight();
      const camTargetX = leadNode.x - (this.viewSize * aspect) / 5;
      const camTargetY = leadNode.yTarget - 3;

      // Linear interpolation smoothing for camera mapping frame-by-frame
      this.camera.position.x += (camTargetX - this.camera.position.x) * 0.05;
      this.camera.position.y += (camTargetY - this.camera.position.y) * 0.05;

      this.gridHelper.position.x = this.camera.position.x;
      this.gridHelper.position.y = this.camera.position.y;
    }

    this.renderer.render(this.scene, this.camera);
  }

  // --- Math Calculations & Simulation Physics Logic ---
  private simulatePID(dt: number): void {
    this.lastTargetChangeTimeCounter += dt;
    this.targetValue += Math.random() * 0.01;
    const error = this.targetValue - this.currentValue;

    const pTerm = this.Kp * error;
    this.integralError = Math.max(-6, Math.min(6, this.integralError + error * dt));
    const iTerm = this.Ki * this.integralError;
    const dTerm = this.Kd * ((error - this.lastError) / dt);
    this.lastError = error;

    const controlForce = pTerm + iTerm + dTerm;
    const mass = 1.0;
    const friction = 0.2;
    const acceleration = controlForce / mass - friction * this.velocity;

    this.velocity += acceleration * dt;
    this.currentValue += this.velocity * dt;

    if (this.lastTargetChangeTimeCounter >= this.MIN_TARGET_CHANGE_TIME && Math.random() < 0.01) {
      this.stepIncreaseTarget();
      return;
    }

    if (Math.abs(error) < this.STABILITY_THRESHOLD) {
      this.stableTimeCounter += dt;
      if (this.stableTimeCounter >= this.STABILITY_DURATION) {
        this.stepIncreaseTarget();
      }
    } else {
      this.stableTimeCounter = 0;
    }
  }

  private stepIncreaseTarget(): void {
    const targetIncrease = Math.random() * 10;
    this.targetValue += targetIncrease;
    this.stableTimeCounter = 0;
    this.lastTargetChangeTimeCounter = 0;
  }

  // --- Ribbon Geometry Structural Generation Helpers ---
  private createRibbonGeometry(maxPoints: number): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxPoints * 2 * 3);
    const indices = new Uint32Array((maxPoints - 1) * 6);

    for (let i = 0; i < maxPoints - 1; i++) {
      const vIdx = i * 2;
      const iIdx = i * 6;
      indices[iIdx] = vIdx;
      indices[iIdx + 1] = vIdx + 1;
      indices[iIdx + 2] = vIdx + 2;
      indices[iIdx + 3] = vIdx + 1;
      indices[iIdx + 4] = vIdx + 3;
      indices[iIdx + 5] = vIdx + 2;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    return geometry;
  }

  private updateRibbonPath(
    geometry: THREE.BufferGeometry,
    historyArray: HistoryNode[],
    type: 'signal' | 'target',
    width: number,
  ): void {
    const posAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;
    if (!posAttribute) return;

    const posAttr = posAttribute.array as Float32Array;
    const totalPoints = historyArray.length;

    for (let i = 0; i < totalPoints; i++) {
      const current = historyArray[i];
      const next = historyArray[i + 1] || current;
      const prev = historyArray[i - 1] || current;

      let dx = next.x - prev.x;
      let dy = type === 'signal' ? next.yCurrent - prev.yCurrent : next.yTarget - prev.yTarget;

      if (i === 0 && totalPoints > 1) {
        dx = historyArray[1].x - current.x;
        dy =
          type === 'signal'
            ? historyArray[1].yCurrent - current.yCurrent
            : historyArray[1].yTarget - current.yTarget;
      }

      let len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) len = 1;
      const nx = -dy / len;
      const ny = dx / len;

      const currentY = type === 'signal' ? current.yCurrent : current.yTarget;
      const vIdx = i * 2 * 3;

      posAttr[vIdx] = current.x + nx * width * 0.5;
      posAttr[vIdx + 1] = currentY + ny * width * 0.5;
      posAttr[vIdx + 2] = 0;

      posAttr[vIdx + 3] = current.x - nx * width * 0.5;
      posAttr[vIdx + 4] = currentY - ny * width * 0.5;
      posAttr[vIdx + 5] = 0;
    }

    posAttribute.needsUpdate = true;

    if (totalPoints > 1) {
      geometry.setDrawRange(0, (totalPoints - 1) * 6);
    } else {
      geometry.setDrawRange(0, 0);
    }
  }

  private calculateHeight(): number {
    const h = this.canvasHeight();
    return typeof h === 'number' ? h : window.innerHeight;
  }

  @HostListener('window:resize')
  public onResize(): void {
    const width = window.innerWidth;
    const height = this.calculateHeight();
    const aspect = width / height;

    this.camera.left = (-this.viewSize * aspect) / 2;
    this.camera.right = (this.viewSize * aspect) / 2;
    this.camera.top = this.viewSize / 2;
    this.camera.bottom = -this.viewSize / 2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }
}
