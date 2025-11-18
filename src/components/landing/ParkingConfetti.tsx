import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

interface ParkingConfettiProps {
  trigger?: boolean;
  duration?: number;
}

export const ParkingConfetti = ({ trigger = false, duration = 3000 }: ParkingConfettiProps) => {
  const hasTriggered = useRef(false);

  useEffect(() => {
    if (!trigger || hasTriggered.current) return;
    
    hasTriggered.current = true;
    
    // Crear canvas para los iconos de P personalizados
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar tamaño del canvas para el icono
    canvas.width = 40;
    canvas.height = 40;

    // Colores vibrantes para las P
    const colors = [
      '#FF6B6B', // Rojo
      '#4ECDC4', // Turquesa
      '#45B7D1', // Azul
      '#FFA07A', // Naranja
      '#98D8C8', // Verde agua
      '#F7DC6F', // Amarillo
      '#BB8FCE', // Morado
      '#85C1E2', // Azul claro
    ];

    // Función para crear confetti con P
    const createParkingConfetti = () => {
      const count = 100;
      const defaults = {
        origin: { y: 0 },
        zIndex: 9999,
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
          shapes: ['circle', 'square'],
          colors: colors,
          scalar: 1.2,
          drift: 0.5,
          gravity: 0.8,
          ticks: 300,
        });
      }

      // Explosión inicial desde el centro
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
      });

      fire(0.2, {
        spread: 60,
      });

      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
      });

      fire(0.1, {
        spread: 120,
        startVelocity: 45,
      });
    };

    // Función para crear lluvia continua de P
    const createParkingRain = () => {
      const end = Date.now() + duration;

      const frame = () => {
        if (Date.now() > end) return;

        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0 },
          colors: colors,
          shapes: ['circle', 'square'],
          scalar: 1.2,
          drift: 0.5,
          gravity: 1,
          ticks: 300,
          zIndex: 9999,
        });

        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0 },
          colors: colors,
          shapes: ['circle', 'square'],
          scalar: 1.2,
          drift: -0.5,
          gravity: 1,
          ticks: 300,
          zIndex: 9999,
        });

        requestAnimationFrame(frame);
      };

      frame();
    };

    // Ejecutar explosión inicial
    createParkingConfetti();

    // Iniciar lluvia después de 200ms
    setTimeout(() => {
      createParkingRain();
    }, 200);

    // Cleanup
    return () => {
      confetti.reset();
    };
  }, [trigger, duration]);

  return null;
};
