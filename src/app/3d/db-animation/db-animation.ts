import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

@Component({
  selector: 'app-db-animation',
  imports: [],
  templateUrl: './db-animation.html',
  styleUrl: './db-animation.scss',
})
export class DbAnimation implements OnInit {
  @ViewChild('rendererCanvas', { static: true })
  public rendererCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {
    this.initAnimation();
  }

  initAnimation() {
    // --- Core 3D Setup ---
    const container = document.getElementById('canvas-container');
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0b0f19, 0.025);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 10, 10);

    const canvas = this.rendererCanvas.nativeElement;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Lights
    scene.add(new THREE.AmbientLight(0x222222));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // --- Infrastructure Objects ---
    const grid = new THREE.GridHelper(40, 40, 0x1c2128, 0x1c2128);
    grid.position.y = -2;
    scene.add(grid);

    const nodeMat = new THREE.MeshPhongMaterial({
      color: 0x161b22,
      specular: 0x58a6ff,
      shininess: 100,
    });
    const glowMatCyan = new THREE.LineBasicMaterial({ color: 0x00ffff });
    const glowMatPink = new THREE.LineBasicMaterial({ color: 0xff4560 });

    const startX = -8;
    const endX = 8;

    // Server (Cuboid)
    const serverGeom = new THREE.BoxGeometry(3, 5, 3);
    const server = new THREE.Mesh(serverGeom, nodeMat);
    server.position.x = startX;
    scene.add(server);
    const serverWire = new THREE.LineSegments(new THREE.EdgesGeometry(serverGeom), glowMatCyan);
    server.add(serverWire);

    // Database (Cylinder)
    const dbGeom = new THREE.CylinderGeometry(2, 2, 4, 32);
    const db = new THREE.Mesh(dbGeom, nodeMat);
    db.position.x = endX;
    scene.add(db);
    const dbWire = new THREE.LineSegments(new THREE.EdgesGeometry(dbGeom), glowMatPink);
    db.add(dbWire);

    // Connection Line
    const linePoints = [new THREE.Vector3(startX, 0, 0), new THREE.Vector3(endX, 0, 0)];
    const lineGeom = new THREE.BufferGeometry().setFromPoints(linePoints);
    const connectionLine = new THREE.Line(
      lineGeom,
      new THREE.LineBasicMaterial({
        color: 0x373e47,
        transparent: false,
        opacity: 0.5,
      }),
    );
    scene.add(connectionLine);

    // Translucent Buffer Channel
    const queueLength = endX - startX;
    const queueGeom = new THREE.CylinderGeometry(1.4, 1.4, queueLength, 32, 1, true);
    const queueMat = new THREE.MeshPhongMaterial({
      color: 0x00e396,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const queueStartX = endX - queueLength;
    const queueChannel = new THREE.Mesh(queueGeom, queueMat);
    queueChannel.rotation.z = Math.PI / 2;
    queueChannel.position.x = queueStartX + queueLength / 2;
    queueChannel.scale.set(0.1, 1, 0.1);
    queueChannel.visible = false;
    scene.add(queueChannel);

    // --- Packet Pool ---
    const maxPackets = 600;
    const packets: THREE.Mesh[] = [];
    const packetGeom = new THREE.SphereGeometry(0.1, 8, 8);
    const packetMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1,
    });

    for (let i = 0; i < maxPackets; i++) {
      const p = new THREE.Mesh(packetGeom, packetMat.clone());
      p.visible = false;
      p.userData = { active: false, progress: 0, isQueued: false };
      scene.add(p);
      packets.push(p);
    }

    // --- Runtime State Variables ---
    const clock = new THREE.Clock();
    let spawnAccumulator = 0;
    let lastDbConsumeTime = 0;
    let backpressureThrottled = false;
    let lastPhase = 1;

    let spawnInterval = 0.333;
    let packetBaseSize = 1.0;
    let targetQueueOpacity = 0;
    let targetQueueRadius = 0.1;
    let targetSpiralIntensity = 0;
    let currentSpiralIntensity = 0;
    let displayFreq = 3;

    const uiStatus = document.getElementById('status')!;
    const uiDesc = document.getElementById('desc')!;
    const uiBufferCount = document.getElementById('buffer-count')!;
    const uiFrequency = document.getElementById('current-frequency')!;
    const uiBackpressure = document.getElementById('backpressure-state')!;

    const minPacketFreq = 3;
    const maxPacketFreq = 10;
    const phase2StartTime = 5;
    const phase3StartTime = 10;
    const cycleTime = 20;

    const maxPacketsInChannel = 7;

    // --- Animation Loop ---
    function animate() {
      requestAnimationFrame(animate);
      controls.update();

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();
      const t = elapsed % cycleTime;

      // --- Phase State Evaluation ---
      let currentPhase = 1;
      if (t < phase2StartTime) {
        currentPhase = 1;
      } else if (t < phase3StartTime) {
        currentPhase = 2;
      } else {
        currentPhase = 3;
      }

      // Boundary Security Guard: Direct Phase 3 -> Phase 1 Loop Transition
      if (currentPhase === 1 && lastPhase === 3) {
        packets.forEach((p) => {
          p.userData['active'] = false;
          p.visible = false;
        });
        backpressureThrottled = false;
      }
      lastPhase = currentPhase;

      // --- Phase Parameter Execution ---
      if (currentPhase === 1) {
        uiStatus.innerText = 'Phase 1: Frequency Scaling';
        uiStatus.style.background = '#58a6ff';
        uiDesc.innerText =
          'Small packets transmitting across connection line. Frequency ramps from 3Hz up to 10Hz.';

        packetBaseSize = 1.0;
        displayFreq = minPacketFreq + (maxPacketFreq - minPacketFreq) * (t / phase2StartTime);

        targetQueueOpacity = 0;
        targetQueueRadius = 0.1;
        targetSpiralIntensity = 0;
      } else if (currentPhase === 2) {
        uiStatus.innerText = 'Phase 2: Heavy Payload Transition';
        uiStatus.style.background = '#feb019';
        uiDesc.innerText =
          'Packet size scales up significantly. Generation rate resets to 3Hz and builds back up to 10Hz.';

        packetBaseSize = 2.5;
        displayFreq =
          minPacketFreq +
          (maxPacketFreq - minPacketFreq) *
            ((t - phase2StartTime) / (phase3StartTime - phase2StartTime));

        targetQueueOpacity = 0;
        targetQueueRadius = 0.1;
        targetSpiralIntensity = 0;
      } else if (currentPhase === 3) {
        uiStatus.innerText = 'Phase 3: Buffer Inundation';
        uiStatus.style.background = '#ff4560';
        uiDesc.innerText =
          'Channel active! Database bottlenecks to 5Hz max, triggering accumulation.';

        packetBaseSize = 3.5;
        displayFreq = maxPacketFreq; // Frequency continues increasing

        targetQueueOpacity = 0.4;
        targetQueueRadius = 1.0;
        targetSpiralIntensity = 1.0; // Enable orbital displacement
      }

      spawnInterval = 1 / displayFreq;

      // --- Morph Channel Geometry Properties ---
      queueMat.opacity = THREE.MathUtils.lerp(queueMat.opacity, targetQueueOpacity, 0.05);
      const currentR = queueChannel.scale.x;
      const newR = THREE.MathUtils.lerp(currentR, targetQueueRadius, 0.05);
      queueChannel.scale.set(newR, 1, newR);
      queueChannel.visible = queueMat.opacity > 0.01;

      currentSpiralIntensity = THREE.MathUtils.lerp(
        currentSpiralIntensity,
        targetSpiralIntensity,
        0.05,
      );

      // --- Calculate Buffer Metrics & Evaluate Hysteresis Logic ---
      let packetsInChannel = packets.filter((p) => p.userData['active']).length;

      backpressureThrottled = currentPhase === 3 && packetsInChannel >= maxPacketsInChannel;

      // --- UI Diagnostics Rendering ---
      uiFrequency.innerText = displayFreq.toFixed(1) + ' Hz';
      uiBufferCount.innerText = packetsInChannel + ' packets';
      uiBufferCount.style.color = packetsInChannel > 15 ? '#ff4560' : '#adbac7';

      if (backpressureThrottled) {
        uiBackpressure.innerText = 'ACTIVE (HALTED)';
        uiBackpressure.style.color = '#ff4560';
      } else {
        uiBackpressure.innerText = 'INACTIVE';
        uiBackpressure.style.color = '#00e396';
      }

      // --- Packet Generation Dispatcher ---
      spawnAccumulator += delta;
      if (spawnAccumulator >= spawnInterval) {
        spawnAccumulator -= spawnInterval;
        if (spawnAccumulator > spawnInterval) spawnAccumulator = 0;

        if (!backpressureThrottled) {
          const p = packets.find((packet) => !packet.userData['active']);
          if (p) {
            p.visible = true;
            p.userData['active'] = true;
            p.userData['progress'] = 0;
            p.userData['isQueued'] = false;
            p.position.set(startX, 0, 0);
            p.scale.set(packetBaseSize, packetBaseSize, packetBaseSize);

            const packetMeshMaterial = p.material as THREE.MeshStandardMaterial;

            if (currentPhase === 1) packetMeshMaterial.emissive.setHex(0x00ffff);
            else if (currentPhase === 2) packetMeshMaterial.emissive.setHex(0xfeb019);
            else packetMeshMaterial.emissive.setHex(0x00e396);
          }
        }
      }

      // --- Sorting & Positional Physics Mapping ---
      let activePackets = packets.filter((p) => p.userData['active']);
      // Sort closest to DB first to manage positional dependencies downstream
      activePackets.sort((a, b) => b.userData['progress'] - a.userData['progress']);

      const minSpacing = 0.65;
      const dbTargetX = endX - 1.5;

      activePackets.forEach((p, index) => {
        if (currentPhase === 3) {
          // Maximum physical linear bounds allowed for this specific index in line queue
          let maxAllowedX = dbTargetX - index * minSpacing;

          p.userData['progress'] += delta / 1.4; // Base transit velocity constant
          let desiredX = THREE.MathUtils.lerp(startX, endX, p.userData['progress']);

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
          if (currentSpiralIntensity > 0.02) {
            // Packets that are locked deep in accumulation queue experience lessened spiral velocity
            let kineticFactor = p.userData['isQueued'] ? 0.15 : 1.0;
            p.position.y =
              Math.sin(elapsed * 8 + p.position.x) * (currentSpiralIntensity * 0.6 * kineticFactor);
            p.position.z =
              Math.cos(elapsed * 8 + p.position.x) * (currentSpiralIntensity * 0.6 * kineticFactor);
          }
        } else {
          // Standard linear path mode execution
          // Standard linear path mode execution
          p.userData['progress'] += delta / 1.4;
          p.position.x = THREE.MathUtils.lerp(startX, endX, p.userData['progress']);
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
          if (elapsed - lastDbConsumeTime >= 0.2) {
            // 1 / 5 packets per second = 0.2s interval constraint
            leadingPacket.visible = false;
            leadingPacket.userData['active'] = false;
            lastDbConsumeTime = elapsed;
          }
        }
      }

      scene.rotation.y = elapsed * 0.015;
      renderer.render(scene, camera);
    }

    // --- Viewport Resize Handler ---
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    clock.start();
    animate();
  }
}
