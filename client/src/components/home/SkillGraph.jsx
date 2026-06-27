import { memo, useEffect, useRef, useState, useCallback } from 'react';
import SkillBubble from './SkillBubble';
import { motion as Motion, AnimatePresence } from 'framer-motion';

const SkillTooltip = ({ activeBubble, mousePos }) => {
  if (!activeBubble) return null;

  return (
    <div
      style={{
        left: mousePos.x + 12,
        top: mousePos.y - 12,
      }}
      className="pointer-events-none fixed z-[99] rounded-lg border border-zinc-800 bg-zinc-950/95 px-3 py-2 text-xs shadow-xl shadow-black/80 backdrop-blur-md"
    >
      <p className="font-semibold text-zinc-100">{activeBubble.skill.skill}</p>
      <div className="mt-1 flex items-center gap-1.5 text-zinc-400">
        <span
          className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
          style={{ opacity: (activeBubble.skill.percentage ?? 50) / 100 }}
        />
        <span>{activeBubble.skill.percentage}%</span>
        {activeBubble.skill.category ? (
          <>
            <span className="text-zinc-700">•</span>
            <span className="text-zinc-500">{activeBubble.skill.category}</span>
          </>
        ) : null}
      </div>
    </div>
  );
};

const SkillGraph = ({ skills = [], isPreview = false }) => {
  const containerRef = useRef(null);
  const requestRef = useRef(null);
  
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [activeBubble, setActiveBubble] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Refs for tracking mutable simulation state at 60fps without triggering React renders
  const nodesRef = useRef([]);
  const mouseStateRef = useRef({
    x: 0,
    y: 0,
    isDown: false,
    draggedId: null,
    startX: 0,
    startY: 0,
    nodeStartX: 0,
    nodeStartY: 0,
  });

  const boundsRef = useRef({ width: 600, height: 400 });

  // Calculate bubble size based on percentage (max 1.5x difference)
  const getBubbleRadius = useCallback((percentage = 50, isPreviewMode = false) => {
    const baseSize = isPreviewMode ? 48 : 64; // smaller in preview card
    const multiplier = 1 + ((percentage - 40) / 60) * 0.4; // 1.0x to 1.4x scale
    const finalSize = Math.max(baseSize * 0.85, Math.min(baseSize * 1.35, baseSize * multiplier));
    return finalSize / 2; // radius
  }, []);

  // Update bounds on mount/resize
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        boundsRef.current = {
          width: rect.width || 600,
          height: rect.height || 400,
        };
      }
    };

    updateBounds();
    window.addEventListener('resize', updateBounds);
    
    // Extra update to make sure sizing is caught after transitions
    const timer = setTimeout(updateBounds, 100);

    return () => {
      window.removeEventListener('resize', updateBounds);
      clearTimeout(timer);
    };
  }, []);

  // Initialize simulation nodes immediately on render if not yet set or count changes
  if (skills.length && (!nodesRef.current.length || nodesRef.current.length !== skills.length)) {
    const width = boundsRef.current.width || 600;
    const height = boundsRef.current.height || 400;
    const cx = width / 2;
    const cy = height / 2;

    nodesRef.current = skills.map((skill, index) => {
      const radius = getBubbleRadius(skill.percentage, isPreview);
      
      // Position nodes in a spiral/circle layout around the center initially
      const angle = index * 0.75;
      const dist = 30 + index * 6;
      const initialX = cx + Math.cos(angle) * dist;
      const initialY = cy + Math.sin(angle) * dist;

      return {
        id: skill._id || `${skill.skill}-${index}`,
        skill,
        x: initialX,
        y: initialY,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius,
        el: null, // DOM ref set during render
      };
    });
  }

  // Main physics loop
  useEffect(() => {
    let lastTime = performance.now();

    const tick = (time) => {
      const dt = Math.min((time - lastTime) / 16.666, 2); // normalize delta time
      lastTime = time;

      const { width, height } = boundsRef.current;
      const cx = width / 2;
      const cy = height / 2;
      const nodes = nodesRef.current;
      const mouse = mouseStateRef.current;

      if (!nodes.length) {
        requestRef.current = requestAnimationFrame(tick);
        return;
      }

      // 1. Position dragged node directly under mouse
      if (mouse.isDown && mouse.draggedId) {
        const draggedNode = nodes.find((n) => n.id === mouse.draggedId);
        if (draggedNode) {
          draggedNode.x = mouse.x;
          draggedNode.y = mouse.y;
          draggedNode.vx = 0;
          draggedNode.vy = 0;
        }
      }

      // 2. Apply centering and ambient motion forces
      const centeringForce = isPreview ? 0.006 : 0.008;
      const ambientForce = isPreview ? 0.015 : 0.025;
      const friction = 0.94; // slow dampening

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === mouse.draggedId) continue;

        // Centering force
        const dx = cx - node.x;
        const dy = cy - node.y;
        node.vx += dx * centeringForce * dt;
        node.vy += dy * centeringForce * dt;

        // Ambient breathing motion (gentle float)
        const angle = time * 0.0006 + i * 1.5;
        node.vx += Math.cos(angle) * ambientForce * dt;
        node.vy += Math.sin(angle) * ambientForce * dt;

        // Apply friction
        node.vx *= Math.pow(friction, dt);
        node.vy *= Math.pow(friction, dt);

        // Update position
        node.x += node.vx * dt;
        node.y += node.vy * dt;
      }

      // 3. Resolve circle-circle collisions (push apart)
      const collisionResolvePasses = 3; // run multiple passes for tighter constraints
      for (let pass = 0; pass < collisionResolvePasses; pass++) {
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];

            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy;
            const minDist = n1.radius + n2.radius + 3; // add small gap spacing

            if (distSq < minDist * minDist) {
              const dist = Math.sqrt(distSq) || 0.001;
              const overlap = minDist - dist;
              
              // Push normal vectors
              const pushX = (dx / dist) * overlap * 0.5;
              const pushY = (dy / dist) * overlap * 0.5;

              // Apply coordinate separation (don't push dragged bubble)
              if (n1.id === mouse.draggedId) {
                n2.x += pushX * 2;
                n2.y += pushY * 2;
              } else if (n2.id === mouse.draggedId) {
                n1.x -= pushX * 2;
                n1.y -= pushY * 2;
              } else {
                n1.x -= pushX;
                n1.y -= pushY;
                n2.x += pushX;
                n2.y += pushY;
              }

              // Adjust velocities to bounce back gently
              const relativeVx = n2.vx - n1.vx;
              const relativeVy = n2.vy - n1.vy;
              const velAlongNormal = relativeVx * (dx / dist) + relativeVy * (dy / dist);

              if (velAlongNormal < 0) {
                const bounce = 0.12; // soft bounce
                const impulse = -(1 + bounce) * velAlongNormal * 0.5;
                
                if (n1.id !== mouse.draggedId) {
                  n1.vx -= (dx / dist) * impulse;
                  n1.vy -= (dy / dist) * impulse;
                }
                if (n2.id !== mouse.draggedId) {
                  n2.vx += (dx / dist) * impulse;
                  n2.vy += (dy / dist) * impulse;
                }
              }
            }
          }
        }
      }

      // 4. Resolve boundary collisions (contain inside canvas)
      const borderPadding = 12;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.id === mouse.draggedId) continue;

        const limitLeft = node.radius + borderPadding;
        const limitRight = width - node.radius - borderPadding;
        const limitTop = node.radius + borderPadding;
        const limitBottom = height - node.radius - borderPadding;

        if (node.x < limitLeft) {
          node.x = limitLeft;
          node.vx *= -0.2; // soft bounce
        } else if (node.x > limitRight) {
          node.x = limitRight;
          node.vx *= -0.2;
        }

        if (node.y < limitTop) {
          node.y = limitTop;
          node.vy *= -0.2;
        } else if (node.y > limitBottom) {
          node.y = limitBottom;
          node.vy *= -0.2;
        }
      }

      // 5. Commit coordinates to absolute DOM properties for 60fps performance
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.el) {
          node.el.style.transform = `translate3d(${node.x - node.radius}px, ${node.y - node.radius}px, 0)`;
        }
      }

      requestRef.current = requestAnimationFrame(tick);
    };

    requestRef.current = requestAnimationFrame(tick);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPreview]);

  // Touch and mouse drag mechanics
  const handlePointerDown = (id, event) => {
    event.preventDefault();
    const touch = event.touches ? event.touches[0] : event;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = touch.clientX - rect.left;
    const mouseY = touch.clientY - rect.top;

    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;

    mouseStateRef.current = {
      x: mouseX,
      y: mouseY,
      isDown: true,
      draggedId: id,
      startX: touch.clientX,
      startY: touch.clientY,
      nodeStartX: node.x,
      nodeStartY: node.y,
    };

    setDraggedNodeId(id);
    setActiveBubble({ skill: node.skill });
    setMousePos({ x: touch.clientX, y: touch.clientY });
  };

  const handlePointerMove = useCallback((event) => {
    const mouse = mouseStateRef.current;
    if (!mouse.isDown) return;

    const touch = event.touches ? event.touches[0] : event;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Constrain drag coordinate within container bounds
    const dragX = Math.max(8, Math.min(rect.width - 8, touch.clientX - rect.left));
    const dragY = Math.max(8, Math.min(rect.height - 8, touch.clientY - rect.top));

    mouse.x = dragX;
    mouse.y = dragY;

    setMousePos({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handlePointerUp = useCallback(() => {
    mouseStateRef.current.isDown = false;
    mouseStateRef.current.draggedId = null;
    setDraggedNodeId(null);
  }, []);

  // Global mousemove/mouseup listeners for active dragging outside individual elements
  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none bg-zinc-950/20 rounded-xl"
    >
      {/* Simulation elements */}
      {skills.map((skill, index) => {
        const id = skill._id || `${skill.skill}-${index}`;
        const radius = getBubbleRadius(skill.percentage, isPreview);
        const size = radius * 2;
        const node = nodesRef.current.find((n) => n.id === id);

        return (
          <SkillBubble
            key={id}
            innerRef={(el) => {
              if (node) node.el = el;
            }}
            skill={skill}
            size={size}
            style={
              node
                ? {
                    transform: `translate3d(${node.x - radius}px, ${node.y - radius}px, 0)`,
                  }
                : { left: '50%', top: '50%', transform: 'translate3d(-50%, -50%, 0)' }
            }
            isHovered={hoveredNodeId === id}
            isDragged={draggedNodeId === id}
            onMouseEnter={(e) => {
              setHoveredNodeId(id);
              setActiveBubble({ skill });
              setMousePos({ x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => {
              setHoveredNodeId(null);
              if (draggedNodeId !== id) {
                setActiveBubble(null);
              }
            }}
            onMouseEnterMove={(e) => {
              setMousePos({ x: e.clientX, y: e.clientY });
            }}
            onMouseDown={(e) => handlePointerDown(id, e)}
            onTouchStart={(e) => handlePointerDown(id, e)}
            onClick={() => {
              // Click pulse effect
              const node = nodesRef.current.find((n) => n.id === id);
              if (node) {
                node.vx += (Math.random() - 0.5) * 3;
                node.vy += (Math.random() - 0.5) * 3;
              }
            }}
          />
        );
      })}

      {/* Satisfying custom HTML floating tooltip */}
      <AnimatePresence>
        {activeBubble && (
          <SkillTooltip activeBubble={activeBubble} mousePos={mousePos} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default memo(SkillGraph);
