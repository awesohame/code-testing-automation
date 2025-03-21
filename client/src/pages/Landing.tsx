"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Sparkle } from "lucide-react";
import { useUserData } from "@/hooks/useUserData";

function SpinningLogo() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.5, 0.5, 0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#cccccc" />
      </mesh>
      <mesh position={[-0.5, -0.5, -0.5]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
    </group>
  );
}

function AnimatedBox({
  initialPosition,
}: {
  initialPosition: [number, number, number];
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [targetPosition, setTargetPosition] = useState(
    new THREE.Vector3(...initialPosition)
  );
  const currentPosition = useRef(new THREE.Vector3(...initialPosition));

  const getAdjacentIntersection = (current: THREE.Vector3) => {
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];
    const randomDirection =
      directions[Math.floor(Math.random() * directions.length)];
    return new THREE.Vector3(
      current.x + randomDirection[0] * 3,
      0.5,
      current.z + randomDirection[1] * 3
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const newPosition = getAdjacentIntersection(currentPosition.current);
      newPosition.x = Math.max(-15, Math.min(15, newPosition.x));
      newPosition.z = Math.max(-15, Math.min(15, newPosition.z));
      setTargetPosition(newPosition);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      currentPosition.current.lerp(targetPosition, 0.1);
      meshRef.current.position.copy(currentPosition.current);
    }
  });

  return (
    <mesh ref={meshRef} position={initialPosition}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ffffff" opacity={0.9} transparent />
      <lineSegments>
        <edgesGeometry
          attach="geometry"
          args={[new THREE.BoxGeometry(1, 1, 1)]}
        />
        <lineBasicMaterial attach="material" color="#000000" linewidth={2} />
      </lineSegments>
    </mesh>
  );
}

function Scene() {
  const initialPositions: [number, number, number][] = [
    [-9, 0.5, -9],
    [-3, 0.5, -3],
    [0, 0.5, 0],
    [3, 0.5, 3],
    [9, 0.5, 9],
    [-6, 0.5, 6],
    [6, 0.5, -6],
    [-12, 0.5, 0],
    [12, 0.5, 0],
    [0, 0.5, 12],
  ];

  return (
    <>
      <OrbitControls />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <Grid
        renderOrder={-1}
        position={[0, 0, 0]}
        infiniteGrid
        cellSize={1}
        cellThickness={0.5}
        sectionSize={3}
        sectionThickness={1}
        sectionColor={[0.5, 0.5, 0.5] as any}
        fadeDistance={50}
      />
      {initialPositions.map((position, index) => (
        <AnimatedBox key={index} initialPosition={position} />
      ))}
    </>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [isHoveredPrimary, setIsHoveredPrimary] = useState(false);
  const [isHoveredSecondary, setIsHoveredSecondary] = useState(false);
  const { user } = useUserData()
  // Animation variants
  const heroTextVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, 0.05, 0.01, 0.99],
      },
    },
  };

  const buttonVariants = {
    initial: { scale: 0.9, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.6,
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 0px 8px rgb(59 130 246 / 0.5)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
    tap: { scale: 0.95 },
  };

  const logoPillVariants = {
    initial: { opacity: 0, y: -30 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, 0.05, 0.01, 0.99],
      },
    },
    hover: {
      scale: 1.05,
      boxShadow: "0px 0px 15px rgba(59, 130, 246, 0.5)",
      transition: { duration: 0.3 },
    },
  };

  return (
    <div
      className="relative w-full h-screen bg-[#0f172a] text-[#f8fafc] overflow-hidden bg-gradient-to-br from-blue-900/10 via-transparent to-blue-900/5"
    >
      {/* Hero section with logo pill above title */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full max-w-4xl px-6">
        {/* Logo Pill */}
        <motion.div
          className="inline-block bg-blue-900/30 flex backdrop-blur-md px-6 py-2 rounded-full border border-blue-500/30 mb-12 shadow-lg"
          initial="initial"
          animate="animate"
          whileHover="hover"
          variants={logoPillVariants}
        >
          <div className="flex justify-center items-center gap-2">
            <Sparkle className="text-blue-400" />
            <motion.span
              className="text-2xl font-bold text-blue-400"
              whileHover={{
                textShadow: "0px 0px 8px rgba(96, 165, 250, 0.7)",
              }}
            >
              Codeवेद
            </motion.span>
          </div>
        </motion.div>

        <motion.h1
          className="text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#f8fafc] to-blue-400"
          initial="initial"
          animate="animate"
          variants={heroTextVariants}
        >
          Simplify Your Testing Workflow
        </motion.h1>
        <motion.h2
          className="text-xl mb-10 text-blue-100/80 max-w-2xl mx-auto"
          initial="initial"
          animate="animate"
          variants={heroTextVariants}
          transition={{ delay: 0.3 }}
        >
          Automate, accelerate, and streamline your testing process with
          AI-driven tools
        </motion.h2>
        <div className="flex justify-center gap-5">
          <motion.button
            onClick={() => navigate(user ? '/dashboard' : '/sign-in')}
            className="bg-blue-500/25 border border-blue-500/30 text-blue-400 font-bold py-3 px-8 rounded-lg relative overflow-hidden"
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            onHoverStart={() => setIsHoveredPrimary(true)}
            onHoverEnd={() => setIsHoveredPrimary(false)}
          >
            <motion.span className="relative z-10">
              Start Testing Now
            </motion.span>
            <motion.div
              className="absolute inset-0 bg-blue-500/20"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                isHoveredPrimary
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0, opacity: 0 }
              }
              transition={{ duration: 0.3 }}
            />
          </motion.button>
          <motion.button
            className="bg-transparent border border-blue-500/20 text-blue-100/80 font-bold py-3 px-8 rounded-lg relative overflow-hidden"
            initial="initial"
            animate="animate"
            whileHover="hover"
            whileTap="tap"
            variants={buttonVariants}
            transition={{ delay: 0.7 }}
            onHoverStart={() => setIsHoveredSecondary(true)}
            onHoverEnd={() => setIsHoveredSecondary(false)}
          >
            <motion.span className="relative z-10">Learn More</motion.span>
            <motion.div
              className="absolute inset-0 bg-blue-500/10"
              initial={{ scale: 0, opacity: 0 }}
              animate={
                isHoveredSecondary
                  ? { scale: 1, opacity: 1 }
                  : { scale: 0, opacity: 0 }
              }
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </div>
      </div>

      {/* Floating particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-blue-500/20 backdrop-blur-sm"
          style={{
            width: Math.random() * 60 + 20,
            height: Math.random() * 60 + 20,
          }}
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            opacity: 0,
          }}
          animate={{
            x: [
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
              Math.random() * window.innerWidth,
            ],
            y: [
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
              Math.random() * window.innerHeight,
            ],
            opacity: [0, 0.3, 0],
          }}
          transition={{
            duration: Math.random() * 20 + 30,
            ease: "linear",
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}

      {/* 3D background canvas */}
      <Canvas
        shadows
        camera={{ position: [30, 30, 30], fov: 50 }}
        className="absolute inset-0"
      >
        <Scene />
      </Canvas>
    </div>
  );
}