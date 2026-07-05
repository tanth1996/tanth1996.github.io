import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IntroAnimation } from './intro-animation/intro-animation';
import { DbAnimation } from './3d/db-animation/db-animation';
import { SystemDiagramComponent } from './3d/system-design/system-diagram';
import { PidTracker } from './3d/pid-animation/pid-tracker';
import SystemDiagramConfig from './3d/system-design/system-diagram-config';
import * as THREE from 'three';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, IntroAnimation, DbAnimation, PidTracker, SystemDiagramComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  isIntroDone = signal<boolean>(false);

  isNavExpanded = false;

  ehnbSystemDiagramConfig: SystemDiagramConfig = {
    nodes: [
      {
        id: 'angular',
        name: 'Angular Client',
        geometryType: 'box',
        position: new THREE.Vector3(-10, 2, 0),
        logoUrl: '/assets/logos/angular.png',
        color: 0x161b22,
        wireframeColor: 0xdd0031,
        size: [1.8, 1.8, 1.8],
      },
      {
        id: 'nginx',
        name: 'Nginx Frontend',
        geometryType: 'box',
        position: new THREE.Vector3(-5, 1, 0),
        logoUrl: '/assets/logos/nginx.png',
        color: 0x161b22,
        wireframeColor: 0x009639,
        size: [1.6, 2.2, 1.6],
      },
      {
        id: 'aws',
        name: 'AWS',
        geometryType: 'box',
        position: new THREE.Vector3(2, 2, 0),
        logoUrl: '/assets/logos/aws.png',
        color: 0xef992b,
        wireframeColor: 0xef992b,
        size: [19, 6, 10],
      },
      {
        id: 'k8s',
        name: 'Kubernetes Cluster',
        geometryType: 'box',
        position: new THREE.Vector3(0, 2, 0),
        logoUrl: '/assets/logos/kubernetes.png',
        color: 0x0d1117,
        wireframeColor: 0x326ce5,
        size: [15, 5, 10],
      },
      {
        id: 'nodejs',
        name: 'Node.js Backend',
        geometryType: 'box',
        position: new THREE.Vector3(5, 2, -2),
        logoUrl: '/assets/logos/nodejs.png',
        color: 0x161b22,
        wireframeColor: 0x339933,
        size: [1.6, 1.6, 1.6],
      },
      {
        id: 'dotnet',
        name: '.NET Backend',
        geometryType: 'box',
        position: new THREE.Vector3(5, 2, 2),
        logoUrl: '/assets/logos/dotnet.png',
        color: 0x161b22,
        wireframeColor: 0x512bd4,
        size: [1.6, 1.6, 1.6],
      },
      {
        id: 'oracle',
        name: 'Oracle SQL',
        geometryType: 'cylinder',
        position: new THREE.Vector3(10, 0.5, 3),
        logoUrl: '/assets/logos/oracle.png',
        color: 0x161b22,
        wireframeColor: 0xf80000,
        size: [1.2, 1.2, 2.5, 15],
      },
      {
        id: 'mongodb',
        name: 'MongoDB',
        geometryType: 'cylinder',
        position: new THREE.Vector3(10, 0.5, -3),
        logoUrl: '/assets/logos/mongodb.png',
        color: 0x161b22,
        wireframeColor: 0x47a248,
        size: [1.2, 1.2, 2.5, 15],
      },
      {
        id: 'github',
        name: 'GitHub Actions',
        geometryType: 'sphere',
        position: new THREE.Vector3(0, -4.5, 0),
        logoUrl: '/assets/logos/github.png',
        color: 0x161b22,
        wireframeColor: 0x24292e,
        size: [1, 32, 32],
      },
      {
        id: 'copilot',
        name: 'GitHub Copilot',
        geometryType: 'sphere',
        position: new THREE.Vector3(-4.5, -4.5, 0),
        logoUrl: '/assets/logos/copilot.png',
        color: 0x161b22,
        wireframeColor: 0x00b7ff,
        size: [1, 32, 32],
      },
    ],
    connections: [
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
    ],
  };

  onIntroDone() {
    this.isIntroDone.set(true);
  }

  /**
   * Toggles the navigation card dropdown state.
   * Prevents toggling if the user clicked an actual link item.
   */
  toggleNav(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.tagName === 'A') {
      return;
    }
    this.isNavExpanded = !this.isNavExpanded;
  }

  /**
   * Explicitly closes the navigation menu (e.g., after clicking a link)
   */
  closeNav(): void {
    this.isNavExpanded = false;
  }
}
