import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { MapPin, Clock, Info } from 'lucide-react';
import USMapSVG from "./USMapSVG";

/* US STATES METADATA - keeping this the same */
const US_STATES_META = {
  AL: { name: "Alabama", capital: "Montgomery", region: "CT", tz: "America/Chicago", pos: { x: 650, y: 380 } },
  AK: { name: "Alaska", capital: "Juneau", region: "AKT", tz: "America/Anchorage", pos: { x: 100, y: 480 } },
  AZ: { name: "Arizona", capital: "Phoenix", region: "MT", tz: "America/Phoenix", pos: { x: 200, y: 350 } },
  AR: { name: "Arkansas", capital: "Little Rock", region: "CT", tz: "America/Chicago", pos: { x: 570, y: 340 } },
  CA: { name: "California", capital: "Sacramento", region: "PT", tz: "America/Los_Angeles", pos: { x: 120, y: 280 } },
  CO: { name: "Colorado", capital: "Denver", region: "MT", tz: "America/Denver", pos: { x: 350, y: 280 } },
  CT: { name: "Connecticut", capital: "Hartford", region: "ET", tz: "America/New_York", pos: { x: 850, y: 150 } },
  DC: { name: "District of Columbia", capital: "Washington", region: "ET", tz: "America/New_York", pos: { x: 815, y: 235 } },
  DE: { name: "Delaware", capital: "Dover", region: "ET", tz: "America/New_York", pos: { x: 830, y: 210 } },
  FL: { name: "Florida", capital: "Tallahassee", region: "ET", tz: "America/New_York", pos: { x: 600, y: 450 } },
  GA: { name: "Georgia", capital: "Atlanta", region: "ET", tz: "America/New_York", pos: { x: 690, y: 360 } },
  HI: { name: "Hawaii", capital: "Honolulu", region: "HST", tz: "Pacific/Honolulu", pos: { x: 280, y: 520 } },
  ID: { name: "Idaho", capital: "Boise", region: "MT", tz: "America/Boise", pos: { x: 220, y: 150 } },
  IL: { name: "Illinois", capital: "Springfield", region: "CT", tz: "America/Chicago", pos: { x: 620, y: 260 } },
  IN: { name: "Indiana", capital: "Indianapolis", region: "ET", tz: "America/Indiana/Indianapolis", pos: { x: 670, y: 250 } },
  IA: { name: "Iowa", capital: "Des Moines", region: "CT", tz: "America/Chicago", pos: { x: 540, y: 220 } },
  KS: { name: "Kansas", capital: "Topeka", region: "CT", tz: "America/Chicago", pos: { x: 470, y: 290 } },
  KY: { name: "Kentucky", capital: "Frankfort", region: "ET", tz: "America/New_York", pos: { x: 690, y: 280 } },
  LA: { name: "Louisiana", capital: "Baton Rouge", region: "CT", tz: "America/Chicago", pos: { x: 580, y: 420 } },
  ME: { name: "Maine", capital: "Augusta", region: "ET", tz: "America/New_York", pos: { x: 880, y: 90 } },
  MD: { name: "Maryland", capital: "Annapolis", region: "ET", tz: "America/New_York", pos: { x: 810, y: 230 } },
  MA: { name: "Massachusetts", capital: "Boston", region: "ET", tz: "America/New_York", pos: { x: 860, y: 130 } },
  MI: { name: "Michigan", capital: "Lansing", region: "ET", tz: "America/Detroit", pos: { x: 680, y: 170 } },
  MN: { name: "Minnesota", capital: "Saint Paul", region: "CT", tz: "America/Chicago", pos: { x: 540, y: 120 } },
  MS: { name: "Mississippi", capital: "Jackson", region: "CT", tz: "America/Chicago", pos: { x: 610, y: 380 } },
  MO: { name: "Missouri", capital: "Jefferson City", region: "CT", tz: "America/Chicago", pos: { x: 570, y: 280 } },
  MT: { name: "Montana", capital: "Helena", region: "MT", tz: "America/Denver", pos: { x: 300, y: 110 } },
  NE: { name: "Nebraska", capital: "Lincoln", region: "CT", tz: "America/Chicago", pos: { x: 450, y: 230 } },
  NV: { name: "Nevada", capital: "Carson City", region: "PT", tz: "America/Los_Angeles", pos: { x: 180, y: 250 } },
  NH: { name: "New Hampshire", capital: "Concord", region: "ET", tz: "America/New_York", pos: { x: 870, y: 110 } },
  NJ: { name: "New Jersey", capital: "Trenton", region: "ET", tz: "America/New_York", pos: { x: 830, y: 190 } },
  NM: { name: "New Mexico", capital: "Santa Fe", region: "MT", tz: "America/Denver", pos: { x: 310, y: 350 } },
  NY: { name: "New York", capital: "Albany", region: "ET", tz: "America/New_York", pos: { x: 810, y: 150 } },
  NC: { name: "North Carolina", capital: "Raleigh", region: "ET", tz: "America/New_York", pos: { x: 760, y: 330 } },
  ND: { name: "North Dakota", capital: "Bismarck", region: "CT", tz: "America/Chicago", pos: { x: 440, y: 120 } },
  OH: { name: "Ohio", capital: "Columbus", region: "ET", tz: "America/New_York", pos: { x: 720, y: 240 } },
  OK: { name: "Oklahoma", capital: "Oklahoma City", region: "CT", tz: "America/Chicago", pos: { x: 470, y: 340 } },
  OR: { name: "Oregon", capital: "Salem", region: "PT", tz: "America/Los_Angeles", pos: { x: 160, y: 140 } },
  PA: { name: "Pennsylvania", capital: "Harrisburg", region: "ET", tz: "America/New_York", pos: { x: 780, y: 200 } },
  RI: { name: "Rhode Island", capital: "Providence", region: "ET", tz: "America/New_York", pos: { x: 870, y: 145 } },
  SC: { name: "South Carolina", capital: "Columbia", region: "ET", tz: "America/New_York", pos: { x: 740, y: 360 } },
  SD: { name: "South Dakota", capital: "Pierre", region: "CT", tz: "America/Chicago", pos: { x: 440, y: 180 } },
  TN: { name: "Tennessee", capital: "Nashville", region: "CT", tz: "America/Chicago", pos: { x: 660, y: 320 } },
  TX: { name: "Texas", capital: "Austin", region: "CT", tz: "America/Chicago", pos: { x: 450, y: 400 } },
  UT: { name: "Utah", capital: "Salt Lake City", region: "MT", tz: "America/Denver", pos: { x: 250, y: 260 } },
  VT: { name: "Vermont", capital: "Montpelier", region: "ET", tz: "America/New_York", pos: { x: 850, y: 110 } },
  VA: { name: "Virginia", capital: "Richmond", region: "ET", tz: "America/New_York", pos: { x: 780, y: 270 } },
  WA: { name: "Washington", capital: "Olympia", region: "PT", tz: "America/Los_Angeles", pos: { x: 160, y: 70 } },
  WV: { name: "West Virginia", capital: "Charleston", region: "ET", tz: "America/New_York", pos: { x: 750, y: 270 } },
  WI: { name: "Wisconsin", capital: "Madison", region: "CT", tz: "America/Chicago", pos: { x: 610, y: 170 } },
  WY: { name: "Wyoming", capital: "Cheyenne", region: "MT", tz: "America/Denver", pos: { x: 320, y: 200 } }
};

const REGION_COLORS = {
  ET: "#90CAF9",
  CT: "#A5D6A7",
  MT: "#FFE082",
  PT: "#CE93D8",
  AKT: "#B0BEC5",
  HST: "#FFAB91"
};

const REGION_NAMES = {
  ET: "Eastern Time",
  CT: "Central Time",
  MT: "Mountain Time",
  PT: "Pacific Time",
  AKT: "Alaska Time",
  HST: "Hawaii Time"
};

export default function MapView({ visibleUSZones, is24Hour }) {
  const [tooltip, setTooltip] = useState(null);
  const [hoveredState, setHoveredState] = useState(null);
  const [stateLayout, setStateLayout] = useState({});
  const mouseMoveRafRef = useRef(null);
  const latestMousePosRef = useRef({ x: 0, y: 0 });

  const visibleTimezones = useMemo(
    () => new Set(visibleUSZones.map(z => z.label)),
    [visibleUSZones]
  );

  const showAllRegions = visibleUSZones.length === 0;

  const formatTime = useCallback((tz) => {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: !is24Hour
    }).format(new Date());
  }, [is24Hour]);

  const getTimePeriod = useCallback((tz) => {
    const hour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false
      }).format(new Date())
    );
    
    if (hour >= 9 && hour < 18) return "business";
    if (hour >= 6 && hour < 9) return "morning";
    if (hour >= 18 && hour < 22) return "evening";
    return "night";
  }, []);

  const handleStateHover = useCallback((stateCode, e) => {
    if (!stateCode) {
      setHoveredState(null);
      setTooltip(null);
      return;
    }

    const meta = US_STATES_META[stateCode];
    if (!meta) {
      setHoveredState(null);
      setTooltip(null);
      return;
    }

    setHoveredState(stateCode);
    setTooltip({
      x: e?.clientX ?? 0,
      y: e?.clientY ?? 0,
      code: stateCode,
      ...meta,
      time: formatTime(meta.tz),
      period: getTimePeriod(meta.tz)
    });
  }, [formatTime, getTimePeriod]);

  const stateStyles = useMemo(() => {
    const styles = {};

    Object.entries(US_STATES_META).forEach(([code, meta]) => {
      const visible = showAllRegions || visibleTimezones.has(meta.region);
      const isHovered = hoveredState === code;
      const baseColor = REGION_COLORS[meta.region] || "#E0E0E0";

      styles[code] = {
        opacity: visible ? (isHovered ? 1 : 0.8) : 0.15,
        stroke: "#333",
        strokeWidth: isHovered ? 2 : 0.75,
        filter: isHovered
          ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
          : 'none'
      };

    });

    return styles;
  }, [hoveredState, visibleTimezones, showAllRegions]);

  useEffect(() => {
    const tooltipActive = tooltip != null;
    if (!tooltipActive) return;

    const onMove = (e) => {
      latestMousePosRef.current = { x: e.clientX, y: e.clientY };

      if (mouseMoveRafRef.current != null) return;
      mouseMoveRafRef.current = window.requestAnimationFrame(() => {
        mouseMoveRafRef.current = null;
        setTooltip((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            x: latestMousePosRef.current.x,
            y: latestMousePosRef.current.y
          };
        });
      });
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (mouseMoveRafRef.current != null) {
        window.cancelAnimationFrame(mouseMoveRafRef.current);
        mouseMoveRafRef.current = null;
      }
    };
  }, [tooltip]);

  useEffect(() => {
    if (!hoveredState) return;

    const meta = US_STATES_META[hoveredState];
    if (!meta) return;

    const interval = setInterval(() => {
      setTooltip((prev) => {
        if (!prev) return prev;
        if (prev.code !== hoveredState) return prev;
        return {
          ...prev,
          time: formatTime(meta.tz),
          period: getTimePeriod(meta.tz)
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hoveredState, formatTime, getTimePeriod]);

  return (
    <div className="map-view-container">
      {/* Header */}
      <div className="map-header">
        <h2>
          <MapPin size={32} />
          US Time Zones Map
        </h2>
        <p>Hover over state markers to view current time and details</p>
      </div>


      {/* Map Container */}
      <div className="map-svg-container">
        <div className="map-svg-wrapper">
          <USMapSVG
            onStateHover={handleStateHover}
            onStateLayout={setStateLayout}
            stateStyles={stateStyles}
            style={{
              width: '100%',
              height: '100%',
              display: 'block'
            }}
          />

          <svg
            viewBox="0 0 959 593"
            preserveAspectRatio="xMidYMid meet"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {Object.entries(US_STATES_META).map(([code]) => {
              const layout = stateLayout?.[code];
              if (!layout) return null;

              const minDim = Math.min(layout.width, layout.height);
              const fontSize = Math.max(8, Math.min(14, Math.round(minDim * 0.35)));

              return (
                <text
                  key={code}
                  x={layout.x}
                  y={layout.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#111827"
                  fontSize={fontSize}
                  fontWeight="800"
                  style={{
                    paintOrder: 'stroke',
                    stroke: 'rgba(255,255,255,0.95)',
                    strokeWidth: 3
                  }}
                >
                  {code}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="map-tooltip"
            style={{
              left: tooltip.x + 15,
              top: tooltip.y + 15,
              borderColor: REGION_COLORS[tooltip.region]
            }}
          >
            <div className="map-tooltip-header">
              <MapPin size={16} />
              <strong>
                {tooltip.name} ({tooltip.code})
              </strong>
            </div>
            
            <div className="map-tooltip-content">
              <div className="map-tooltip-row">
                <Clock size={14} />
                <span><strong>Time:</strong> {tooltip.time}</span>
              </div>
              
              <div>
                <strong>Capital:</strong> {tooltip.capital}
              </div>
              
              <div>
                <strong>Region:</strong> {REGION_NAMES[tooltip.region] || tooltip.region}
              </div>
              
              <div className="map-tooltip-tz">
                {tooltip.tz}
              </div>
              
              <div
                className="map-tooltip-period"
                style={{
                  background: tooltip.period === 'business' ? '#4caf50' :
                             tooltip.period === 'morning' ? '#ff9800' :
                             tooltip.period === 'evening' ? '#9c27b0' : '#2196f3'
                }}
              >
                {tooltip.period === 'business' && 'Business Hours'}
                {tooltip.period === 'morning' && 'Morning'}
                {tooltip.period === 'evening' && 'Evening'}
                {tooltip.period === 'night' && 'Night'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend">
        {Object.entries(REGION_COLORS).map(([region, color]) => (
          <div key={region} className="legend-item">
            <div className="legend-color" style={{ background: color }} />
            <span>{REGION_NAMES[region] || region}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="map-stats">
        <div className="map-stat-card green">
          <div className="map-stat-value">
            {Object.keys(US_STATES_META).length - 1}
          </div>
          <div className="map-stat-label">
            Total States
          </div>
        </div>

        <div className="map-stat-card blue">
          <div className="map-stat-value">
            {Object.keys(REGION_COLORS).length}
          </div>
          <div className="map-stat-label">
            Time Zones
          </div>
        </div>

        <div className="map-stat-card orange">
          <div className="map-stat-value">
            {visibleUSZones.length}
          </div>
          <div className="map-stat-label">
            Visible Regions
          </div>
        </div>
      </div>
    </div>
  );
}