import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IntroAnimation } from './intro-animation/intro-animation';
import { DbAnimation } from './3d/db-animation/db-animation';
import { SystemDiagramComponent } from './3d/system-design/system-diagram';
import { PidTracker } from './3d/pid-animation/pid-tracker';
import SystemDiagramConfig from './3d/system-design/system-diagram-config';
import * as THREE from 'three';
import { AppFooter } from './app-footer/app-footer';
import { CarouselImage, ImageCarousel } from './image-carousel/image-carousel';
import { LearningResources } from './learning-resources/learning-resources';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    IntroAnimation,
    DbAnimation,
    PidTracker,
    SystemDiagramComponent,
    ImageCarousel,
    LearningResources,
    AppFooter,
  ],
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

  policyAdminSystemDiagramConfig: SystemDiagramConfig = {
    nodes: [
      {
        id: 'guidewire',
        name: 'Guidewire PolicyCenter',
        geometryType: 'box',
        position: new THREE.Vector3(-7, 2, 0),
        logoUrl: '/assets/logos/guidewire.png',
        color: 0x337096,
        wireframeColor: 0x337096,
        size: [1.8, 1.8, 1.8],
      },
      {
        id: 'azurecloud',
        name: 'Azure Cloud',
        geometryType: 'box',
        position: new THREE.Vector3(0, 2, 0),
        logoUrl: '/assets/logos/azure.png',
        color: 0x51aae5,
        wireframeColor: 0x51aae5,
        size: [24, 8, 12],
      },
      {
        id: 'java',
        name: 'Java Backend',
        geometryType: 'box',
        position: new THREE.Vector3(-3, 2, 1),
        logoUrl: '/assets/logos/java.png',
        color: 0xd78726,
        wireframeColor: 0xd78726,
        size: [1.6, 1.6, 1.6],
      },
      {
        id: 'mssql',
        name: 'Microsoft SQL Server',
        geometryType: 'cylinder',
        position: new THREE.Vector3(10, 0.5, 0),
        logoUrl: '/assets/logos/mssql.png',
        color: 0x51aae5,
        wireframeColor: 0x51aae5,
        size: [1.2, 1.2, 2.5, 15],
      },
      {
        id: 'solr',
        name: 'Solr',
        geometryType: 'cylinder',
        position: new THREE.Vector3(10, 0.5, -3),
        logoUrl: '/assets/logos/solr.png',
        color: 0xc6382c,
        wireframeColor: 0xc6382c,
        size: [1.2, 1.2, 2.5, 15],
      },
      {
        id: 'ado',
        name: 'Azure DevOps',
        geometryType: 'sphere',
        position: new THREE.Vector3(0, -4.5, 0),
        logoUrl: '/assets/logos/azuredevops.png',
        color: 0x68bfed,
        wireframeColor: 0x68bfed,
        size: [1, 32, 32],
      },
      {
        id: 'kafka',
        name: 'Apache Kafka',
        geometryType: 'cylinder',
        position: new THREE.Vector3(3, 0.5, -1.5),
        logoUrl: '/assets/logos/kafka.png',
        color: 0x231f20,
        wireframeColor: 0x231f20,
        size: [1.2, 1.2, 2.5, 15],
      },
      {
        id: 'sap',
        name: 'SAP ERP',
        geometryType: 'box',
        position: new THREE.Vector3(2, 2, -4),
        logoUrl: '/assets/logos/sap.png',
        color: 0x008fd3,
        wireframeColor: 0x008fd3,
        size: [1.6, 1.6, 1.6],
      },
    ],
    connections: [
      { from: 'azurecloud', to: 'java', color: 0x414853, isBidirectional: true },
      { from: 'java', to: 'guidewire', color: 0x00e396, isBidirectional: true },
      { from: 'java', to: 'mssql', color: 0x414853, isBidirectional: true },
      { from: 'ado', to: 'azurecloud', color: 0x2188ff, isBidirectional: false },
      { from: 'java', to: 'kafka', color: 0x414853, isBidirectional: false },
      { from: 'kafka', to: 'solr', color: 0xc6382c, isBidirectional: true },
      { from: 'java', to: 'sap', color: 0x008fd3, isBidirectional: true },
      { from: 'kafka', to: 'sap', color: 0x414853, isBidirectional: false },
    ],
  };

  faceSpaceImages: CarouselImage[] = [
    {
      url: '/assets/images/facespace/Idol FaceSpace Target Faces.png',
      alt: 'Target Faces',
      caption:
        'A collection of face images are provided as input to the framework, on which a multilayer perceptron encoder is trained.',
    },
    {
      url: '/assets/images/facespace/Idol FaceSpace Synthetic Faces.png',
      alt: 'Synthetic Faces',
      caption:
        'Feature blending can be achieved based on tuning the encoder input once it is trained.',
    },
    {
      url: '/assets/images/facespace/Idol FaceSpace Face Morphing.png',
      alt: 'Face Morphing',
      caption:
        'The encoder can be used to morph between two faces by interpolating the latent space representation of the two faces.',
    },
  ];

  smartCityModelImages: CarouselImage[] = [
    {
      url: '/assets/images/Smart City Model demo.gif',
      alt: 'Smart City Model Demo',
    },
  ];

  trafficSimulatorImages: CarouselImage[] = [
    {
      url: '/assets/images/Lane-Changing animation.gif',
      alt: 'Traffic Simulator Demo',
    },
  ];

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
