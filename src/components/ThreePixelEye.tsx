"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const EYE_GRID = [
  ".######.",
  "#..##..#",
  ".#.##.#.",
  "..####..",
];

export default function ThreePixelEye({
  className = "w-[22px] h-[12px] shrink-0",
}: {
  className?: string;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Dimensions
    const width = 24;
    const height = 14;

    // 1. Scene
    const scene = new THREE.Scene();

    // 2. Camera (Orthographic with subtle 3D downward tilt)
    const frustumSize = 7.5;
    const aspect = width / height;
    const camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      100
    );
    camera.position.set(0, 2.2, 8);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // 4. Lights (creates distinct 3D voxel bevels and shading on faces)
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(2, 5, 4);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.6);
    backLight.position.set(-2, -3, -4);
    scene.add(backLight);

    // 5. Build 3D Voxel Eye
    const group = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.96, 0.96, 0.96);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
    });

    const rows = EYE_GRID.length;
    const cols = EYE_GRID[0].length;
    const offsetX = (cols - 1) / 2;
    const offsetY = (rows - 1) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (EYE_GRID[r][c] === "#") {
          const voxel = new THREE.Mesh(boxGeo, boxMat);
          voxel.position.set(c - offsetX, offsetY - r, 0);
          group.add(voxel);
        }
      }
    }

    // Slightly tilt group for isometric 3D perspective
    group.rotation.x = THREE.MathUtils.degToRad(14);
    scene.add(group);

    // 6. Animation loop (Stepped 12-frame 3D rotation)
    let animId: number;
    let lastStepTime = performance.now();
    let currentStep = 0;
    const totalSteps = 12;
    const stepDuration = 100; // ms per step (~1.2s per full 360 rotation)

    const animate = (time: number) => {
      animId = requestAnimationFrame(animate);

      if (time - lastStepTime >= stepDuration) {
        lastStepTime = time;
        currentStep = (currentStep + 1) % totalSteps;
        const angle = (currentStep / totalSteps) * Math.PI * 2;
        group.rotation.y = angle;
      }

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

  return (
    <div
      ref={mountRef}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
}
