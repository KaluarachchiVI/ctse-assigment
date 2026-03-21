"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Full-viewport animated gradient shader behind page content.
 */
export function AnimatedShaderBackground() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec2 uResolution;
        varying vec2 vUv;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          vec2 uv = vUv;
          vec2 p = uv * 3.0;
          float t = uTime * 0.35;
          float n =
            sin(p.x * 4.0 + t) * 0.5 +
            cos(p.y * 3.5 - t * 0.8) * 0.5 +
            noise(uv * uResolution * 0.002 + t) * 0.15;

          vec3 deep = vec3(0.04, 0.02, 0.08);
          vec3 mid = vec3(0.12, 0.04, 0.16);
          vec3 accent = vec3(0.25, 0.08, 0.28);
          vec3 col = mix(deep, mid, smoothstep(0.0, 1.0, uv.y + n * 0.2));
          col = mix(col, accent, 0.35 + 0.35 * n);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const w = mount.clientWidth || window.innerWidth;
      const h = mount.clientHeight || window.innerHeight;
      renderer.setSize(w, h, false);
      material.uniforms.uResolution.value.set(w, h);
    };

    mount.appendChild(renderer.domElement);
    resize();

    const onWinResize = () => resize();
    window.addEventListener("resize", onWinResize);

    renderer.setAnimationLoop(() => {
      material.uniforms.uTime.value += 0.012;
      renderer.render(scene, camera);
    });

    return () => {
      window.removeEventListener("resize", onWinResize);
      renderer.setAnimationLoop(null);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="h-full min-h-screen w-full"
      aria-hidden
    />
  );
}
