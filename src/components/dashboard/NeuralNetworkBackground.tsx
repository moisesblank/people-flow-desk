// ============================================
// NEURAL NETWORK BACKGROUND v1.1 - OPTIMIZED
// Fundo com rede neural - CANVAS ONLY (sem motion)
// Performance otimizada com pause quando inativo
// ============================================

import { useEffect, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

interface NeuralNetworkBackgroundProps {
  className?: string;
  intensity?: "low" | "medium" | "high";
  color?: "primary" | "blue" | "purple" | "green";
  interactive?: boolean;
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export function NeuralNetworkBackground({
  className,
  intensity = "medium",
  color = "primary",
  interactive = false,
}: NeuralNetworkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const isPausedRef = useRef(false);
  
  // 🏛️ LEI I Art. 19-21: Pausar quando tab inativa
  useEffect(() => {
    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const config = useMemo(() => ({
    low: { nodes: 30, speed: 0.3, maxDistance: 100 },
    medium: { nodes: 50, speed: 0.5, maxDistance: 150 },
    high: { nodes: 80, speed: 0.8, maxDistance: 200 },
  }), []);

  const colorMap = useMemo(() => ({
    primary: { r: 220, g: 38, b: 38 },
    blue: { r: 59, g: 130, b: 246 },
    purple: { r: 168, g: 85, b: 247 },
    green: { r: 16, g: 185, b: 129 },
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const { nodes: nodeCount, speed, maxDistance } = config[intensity];
    const { r, g, b } = colorMap[color];

    // Initialize nodes
    const nodes: Node[] = [];
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * speed,
        vy: (Math.random() - 0.5) * speed,
        radius: Math.random() * 2 + 1,
      });
    }

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    if (interactive) {
      canvas.addEventListener("mousemove", handleMouseMove);
    }

    // Animation loop - Pause quando tab inativa
    const animate = () => {
      if (isPausedRef.current) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.offsetWidth) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.offsetHeight) node.vy *= -1;

        if (interactive) {
          const dx = mouseRef.current.x - node.x;
          const dy = mouseRef.current.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150 && dist > 0) {
            node.x += dx * 0.01;
            node.y += dy * 0.01;
          }
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `rgba(${r}, ${g}, ${b}, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;

        nodes.slice(i + 1).forEach((otherNode) => {
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const opacity = (1 - dist / maxDistance) * 0.5;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(otherNode.x, otherNode.y);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (interactive) {
        canvas.removeEventListener("mousemove", handleMouseMove);
      }
      cancelAnimationFrame(animationRef.current);
    };
  }, [intensity, color, interactive, config, colorMap]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none",
        interactive && "pointer-events-auto",
        className
      )}
      style={{ opacity: 0.6 }}
    />
  );
}

// Simplified static SVG version - NO ANIMATIONS
export function NeuralNetworkSVG({ className }: { className?: string }) {
  const nodes = useMemo(() => 
    [...Array(12)].map((_, i) => ({
      id: i,
      cx: 10 + (i % 4) * 28,
      cy: 15 + Math.floor(i / 4) * 30,
      r: 2 + Math.random() * 2,
    })), []
  );

  const connections = useMemo(() => {
    const conns: { from: number; to: number }[] = [];
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((other, j) => {
        if (Math.random() > 0.6) {
          conns.push({ from: i, to: i + j + 1 });
        }
      });
    });
    return conns;
  }, [nodes]);

  return (
    <svg viewBox="0 0 100 100" className={cn("w-full h-full", className)}>
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Connections - STATIC */}
      {connections.map((conn, i) => (
        <line
          key={`line-${i}`}
          x1={nodes[conn.from].cx}
          y1={nodes[conn.from].cy}
          x2={nodes[conn.to].cx}
          y2={nodes[conn.to].cy}
          stroke="hsl(var(--primary))"
          strokeWidth="0.5"
          opacity="0.3"
        />
      ))}
      
      {/* Nodes - STATIC */}
      {nodes.map((node) => (
        <circle
          key={`node-${node.id}`}
          cx={node.cx}
          cy={node.cy}
          r={node.r}
          fill="hsl(var(--primary))"
          filter="url(#glow)"
          opacity="0.8"
        />
      ))}
    </svg>
  );
}
