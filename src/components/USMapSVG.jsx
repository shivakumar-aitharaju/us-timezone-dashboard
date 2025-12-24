import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import usStatesSvg from '../assets/us-states.svg?raw';

const SVG_VIEWBOX = '0 0 959 593';

const extractInnerSvg = (svgText) => {
  const openIdx = svgText.indexOf('<svg');
  if (openIdx === -1) return svgText;

  const openEndIdx = svgText.indexOf('>', openIdx);
  const closeIdx = svgText.lastIndexOf('</svg>');
  if (openEndIdx === -1 || closeIdx === -1) return svgText;

  return svgText.slice(openEndIdx + 1, closeIdx);
};

const getStateCodeFromEventTarget = (target, stopEl) => {
  let el = target;
  while (el && el !== stopEl) {
    if (el instanceof Element) {
      const code = getStateCodeFromClassAttr(el);
      if (code) return code;
    }
    el = el.parentNode;
  }
  return null;
};

const getStateCodeFromClassAttr = (el) => {
  const classAttr = el.getAttribute('class');
  if (!classAttr) return null;

  const parts = classAttr.split(/\s+/).filter(Boolean);
  for (const part of parts) {
    if (/^[a-z]{2}$/.test(part)) return part.toUpperCase();
  }
  return null;
};

const applyStyleObjectToElement = (el, styleObj) => {
  if (!styleObj) {
    el.removeAttribute('fill');
    el.style.opacity = '';
    el.style.stroke = '';
    el.style.strokeWidth = '';
    el.style.filter = '';
    return;
  }

  // 🔥 THIS IS THE CRITICAL LINE
  el.removeAttribute('fill');
  el.setAttribute('fill', styleObj.fill);

  if (styleObj.opacity != null) el.style.opacity = String(styleObj.opacity);
  if (styleObj.stroke != null) el.style.stroke = styleObj.stroke;
  if (styleObj.strokeWidth != null) el.style.strokeWidth = String(styleObj.strokeWidth);
  if (styleObj.filter != null) el.style.filter = styleObj.filter;
};


const USMapSVG = ({ onStateHover, onStateLayout, stateStyles = {}, className, style }) => {
  const svgRef = useRef(null);
  const elementsByCodeRef = useRef(new Map());
  const lastHoverCodeRef = useRef(null);

  const innerSvg = useMemo(() => {
    return extractInnerSvg(usStatesSvg).replaceAll('fill="none"', '');
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const nextMap = new Map();

    const candidates = svgEl.querySelectorAll('path, circle, polygon, rect');
    candidates.forEach((el) => {
      const code = getStateCodeFromClassAttr(el);
      if (!code) return;

      const arr = nextMap.get(code) ?? [];
      arr.push(el);
      nextMap.set(code, arr);
      el.style.cursor = 'pointer';
    });

    elementsByCodeRef.current = nextMap;

    if (onStateLayout) {
      const raf = window.requestAnimationFrame(() => {
        const layout = {};
        for (const [code, els] of nextMap.entries()) {
          try {
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            els.forEach((part) => {
              const bbox = part.getBBox();
              minX = Math.min(minX, bbox.x);
              minY = Math.min(minY, bbox.y);
              maxX = Math.max(maxX, bbox.x + bbox.width);
              maxY = Math.max(maxY, bbox.y + bbox.height);
            });

            if (!Number.isFinite(minX) || !Number.isFinite(minY) || !Number.isFinite(maxX) || !Number.isFinite(maxY)) {
              return;
            }

            const width = maxX - minX;
            const height = maxY - minY;

            layout[code] = {
              x: minX + width / 2,
              y: minY + height / 2,
              width,
              height
            };
          } catch {
            // ignore
          }
        }
        onStateLayout(layout);
      });

      return () => window.cancelAnimationFrame(raf);
    }
  }, [innerSvg]);

  const handlePointerMove = useCallback((e) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const nextCode = getStateCodeFromEventTarget(e.target, svgEl);
    if (nextCode === lastHoverCodeRef.current) return;

    lastHoverCodeRef.current = nextCode;
    if (onStateHover) onStateHover(nextCode, nextCode ? e : null);
  }, [onStateHover]);

  const handlePointerLeave = useCallback(() => {
    if (lastHoverCodeRef.current == null) return;
    lastHoverCodeRef.current = null;
    if (onStateHover) onStateHover(null, null);
  }, [onStateHover]);

  useEffect(() => {
    const map = elementsByCodeRef.current;
    for (const [code, els] of map.entries()) {
      els.forEach((el) => applyStyleObjectToElement(el, stateStyles?.[code]));
    }
  }, [stateStyles]);

  return (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={SVG_VIEWBOX}
      preserveAspectRatio="xMidYMid meet"
      className={className}
      style={style}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      dangerouslySetInnerHTML={{ __html: innerSvg }}
    />
  );
};

export default USMapSVG;
