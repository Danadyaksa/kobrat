"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// 7x7 classic pixel person / avatar silhouette
const PROFILE_GRID = [
  "..###..", // 0: Head top
  "..###..", // 1: Head mid
  "..###..", // 2: Head chin
  ".......", // 3: Neck
  ".#####.", // 4: Shoulders
  "#######", // 5: Chest
  "#######", // 6: Torso base
];

export default function ThreeProfileIcon({
  size,
  className = "w-[18px] h-[18px] shrink-0",
}: {
  size?: number;
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = 28;
    const height = 28;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera (Orthographic with isometric 3D downward angle)
    const frustumSize = 10;
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    camera.position.set(0, 3.2, 10);
    camera.lookAt(0, -0.4, 0);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 4. Lights (creates distinct voxel depth, face bevels, and realistic shadows)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(3, 6, 5);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.7);
    fillLight.position.set(-3, -2, -4);
    scene.add(fillLight);

    // 5. Build 3D Voxel Profile Model
    const group = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.94, 0.94, 0.94);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.28,
      metalness: 0.12,
    });

    const rows = PROFILE_GRID.length;
    const cols = PROFILE_GRID[0].length;
    const offsetX = (cols - 1) / 2; // 3
    const offsetY = (rows - 1) / 2; // 3

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (PROFILE_GRID[r][c] === "#") {
          const isHead = r <= 2;
          // Head has 2 layers of depth, shoulders have 2 layers for solid 3D mass
          const zLayers = isHead ? [-0.5, 0.5] : [-0.4, 0.4];

          for (const z of zLayers) {
            const voxel = new THREE.Mesh(boxGeo, boxMat);
            voxel.position.set(c - offsetX, offsetY - r, z);
            group.add(voxel);
          }
        }
      }
    }

    // Slight isometric downward tilt
    group.rotation.x = THREE.MathUtils.degToRad(12);
    scene.add(group);

    // 6. Smooth, silky 3D rotation around Y axis
    let animId: number;
    let angle = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      angle += 0.034; // Smooth continuous 3D spin (~3.1s full turn)
      group.rotation.y = angle;
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      renderer.dispose();
      boxGeo.dispose();
      boxMat.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const sizeStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div
      ref={mountRef}
      style={sizeStyle}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}
