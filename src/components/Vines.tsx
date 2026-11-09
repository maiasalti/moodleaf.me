"use client";

import { useEffect, useRef } from "react";

const NS = "http://www.w3.org/2000/svg";
const VIEW_WIDTH = 120;

interface BuiltVine {
  stem: SVGPathElement;
  length: number;
  lengthAtY: (y: number) => number;
  items: [number, Element][];
}

// Deterministic PRNG so the vines look the same on every visit
function seededRandom(seed: number) {
  return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
}

function buildVine(svg: SVGSVGElement, seed: number, height: number): BuiltVine {
  svg.replaceChildren();
  const rand = seededRandom(seed);
  svg.setAttribute("viewBox", `0 0 ${VIEW_WIDTH} ${height}`);
  svg.style.height = `${height}px`;

  // Sinuous stem through random control points down the page
  const pts: [number, number][] = [];
  for (let y = -20; y < height + 160; y += 130 + rand() * 50) pts.push([14 + rand() * 40, y]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const my = (y0 + y1) / 2;
    d += ` C${x0},${my} ${x1},${my} ${x1},${y1}`;
  }
  const stem = document.createElementNS(NS, "path");
  stem.setAttribute("d", d);
  stem.setAttribute("class", "vine-stem");
  svg.appendChild(stem);
  const length = stem.getTotalLength();
  stem.style.strokeDasharray = `${length}`;
  stem.style.strokeDashoffset = `${length}`;

  // Path length at a given page y, so growth can follow the scroll position
  const table: [number, number][] = [];
  for (let s = 0; s <= length; s += 8) table.push([s, stem.getPointAtLength(s).y]);
  const lengthAtY = (y: number) => {
    for (const [s, py] of table) if (py >= y) return s;
    return length;
  };

  const items: [number, Element][] = [];
  let side = 1;
  for (let s = 40; s < length; s += 34 + rand() * 30) {
    const p = stem.getPointAtLength(s);
    const q = stem.getPointAtLength(Math.min(length, s + 2));
    const angle = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
    side = -side;
    const roll = rand();
    if (roll < 0.11) {
      // Small five-petal bloom on a short stalk
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "vine-bloom");
      const bx = p.x + side * 16;
      let petals = "";
      for (let k = 0; k < 5; k++) {
        const a = (k * 72 * Math.PI) / 180;
        petals += `<circle cx="${bx + Math.cos(a) * 5}" cy="${p.y + Math.sin(a) * 5}" r="4.4"/>`;
      }
      g.innerHTML = `<path class="vine-tendril" d="M${p.x},${p.y} Q${p.x + side * 8},${p.y - 6} ${bx},${p.y}"/>${petals}<circle class="vine-bloom-core" cx="${bx}" cy="${p.y}" r="2.2"/>`;
      svg.appendChild(g);
      items.push([s, g]);
    } else if (roll < 0.2) {
      // Curling tendril
      const t = document.createElementNS(NS, "path");
      t.setAttribute("class", "vine-tendril vine-leaf");
      const ex = p.x + side * 22;
      const ey = p.y - 10;
      t.setAttribute(
        "d",
        `M${p.x},${p.y} C${p.x + side * 10},${p.y - 18} ${ex + side * 6},${ey - 8} ${ex},${ey} S${ex - side * 6},${ey + 6} ${ex - side * 2},${ey + 1}`
      );
      svg.appendChild(t);
      items.push([s, t]);
    } else {
      const size = 13 + rand() * 11;
      const rot = angle + side * (55 + rand() * 25);
      const g = document.createElementNS(NS, "g");
      g.setAttribute("class", "vine-leaf" + (rand() < 0.35 ? " vine-leaf-dark" : ""));
      g.innerHTML = `<g transform="translate(${p.x},${p.y}) rotate(${rot})"><path d="M0,0 C${size * 0.35},${-size * 0.42} ${size * 0.8},${-size * 0.36} ${size * 1.25},0 C${size * 0.8},${size * 0.36} ${size * 0.35},${size * 0.42} 0,0Z"/><path class="vine-vein" d="M1,0 L${size * 1.1},0"/></g>`;
      svg.appendChild(g);
      items.push([s, g]);
    }
  }
  return { stem, length, lengthAtY, items };
}

/** Decorative vines down both page edges that grow as the reader scrolls. */
export default function Vines() {
  const leftRef = useRef<SVGSVGElement>(null);
  const rightRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const left = leftRef.current;
    const right = rightRef.current;
    if (!left || !right) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let vines: BuiltVine[] = [];
    let lastHeight = 0;

    const grow = () => {
      const tipY = window.scrollY + window.innerHeight * 0.9;
      for (const v of vines) {
        const len = reduceMotion ? v.length : Math.max(v.lengthAtY(window.innerHeight * 0.6), v.lengthAtY(tipY));
        v.stem.style.strokeDashoffset = `${Math.max(0, v.length - len)}`;
        for (const [s, el] of v.items) el.classList.toggle("on", s < len - 6);
      }
    };

    const build = () => {
      // Measure the page without the vines' own height inflating it
      left.style.height = right.style.height = "0px";
      const height = document.documentElement.scrollHeight;
      if (Math.abs(height - lastHeight) < 40 && vines.length) {
        left.style.height = right.style.height = `${lastHeight}px`;
        return;
      }
      lastHeight = height;
      vines = [buildVine(left, 7, height), buildVine(right, 23, height)];
      grow();
    };

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        grow();
      });
    };
    let timer: ReturnType<typeof setTimeout>;
    const scheduleBuild = () => {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    };

    build();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", scheduleBuild);
    const observer = new ResizeObserver(scheduleBuild);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", scheduleBuild);
      observer.disconnect();
      clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <>
      <svg ref={leftRef} className="vine vine-left" aria-hidden="true" />
      <svg ref={rightRef} className="vine vine-right" aria-hidden="true" />
    </>
  );
}
