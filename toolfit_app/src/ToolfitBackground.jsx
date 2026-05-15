// src/ToolfitBackground.jsx
import React, { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

const ToolfitBackground = () => {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const options = {
    background: {
      color: "transparent",
    },
    fullScreen: {
      enable: true,
      zIndex: -1,
    },
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          area: 800,
        },
      },
      color: { value: "#ffffff" },
      opacity: {
        value: 0.1,
        random: true,
        anim: {
          enable: true,
          speed: 1,
          opacity_min: 0.05,
          sync: false,
        },
      },
      shape: { type: "circle" },
      size: { value: 3, random: true },
      move: {
        direction: "top",
        enable: true,
        speed: 1,
        outModes: {
          default: "out",
        },
      },
    },
    detectRetina: true,
  };

  return <Particles id="tsparticles" init={particlesInit} options={options} />;
};

export default ToolfitBackground;
