import { useEffect, useRef } from "react";

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const draw = () => {
      time += 0.002;

      // Create gradient
      const gradient = ctx.createRadialGradient(
        canvas.width * (0.3 + Math.sin(time) * 0.1),
        canvas.height * (0.3 + Math.cos(time * 0.7) * 0.1),
        0,
        canvas.width * 0.5,
        canvas.height * 0.5,
        canvas.width * 0.8
      );

      // Dark background with subtle purple/blue gradient
      gradient.addColorStop(0, "hsl(262, 83%, 15%)");
      gradient.addColorStop(0.3, "hsl(280, 60%, 8%)");
      gradient.addColorStop(0.6, "hsl(240, 10%, 5%)");
      gradient.addColorStop(1, "hsl(240, 10%, 3%)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add subtle floating orbs
      drawOrb(ctx, canvas.width * 0.2, canvas.height * 0.3, 200 + Math.sin(time * 1.5) * 50, "hsl(262, 83%, 40%)", 0.08);
      drawOrb(ctx, canvas.width * 0.8, canvas.height * 0.6, 250 + Math.cos(time * 1.2) * 60, "hsl(199, 89%, 35%)", 0.06);
      drawOrb(ctx, canvas.width * 0.5, canvas.height * 0.8, 180 + Math.sin(time * 0.8) * 40, "hsl(280, 80%, 35%)", 0.05);

      animationId = requestAnimationFrame(draw);
    };

    const drawOrb = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      radius: number,
      color: string,
      opacity: number
    ) => {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, color.replace(")", `, ${opacity})`).replace("hsl", "hsla"));
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    resize();
    draw();

    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ pointerEvents: "none" }}
    />
  );
};

export default AnimatedBackground;
