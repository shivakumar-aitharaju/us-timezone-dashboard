import React, { useState, useEffect, useMemo } from 'react';
import { Mail } from 'lucide-react';
import './App.css';
import MapView from './components/MapView.jsx';
import { Clock, Copy, Pause, Play, Moon, Sun, Check, Calendar, GitCompare, Bell, Search, MapPin, X, Star, ChevronDown, ChevronUp, CalendarDays } from 'lucide-react';

// ==================== UTILITY FUNCTIONS ====================

const getDSTTransitions = (timezone, year = new Date().getFullYear()) => {
  const jan = new Date(year, 0, 1);
  const jul = new Date(year, 6, 1);
  
  const getOffset = (date) => {
    const formatter = new Intl.DateTimeFormat('en-US', { 
      timeZone: timezone, 
      timeZoneName: 'shortOffset' 
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart ? offsetPart.value : null;
  };
  
  const janOffset = getOffset(jan);
  const julOffset = getOffset(jul);
  
  if (janOffset === julOffset) return null;
  
  const binarySearchTransition = (start, end, targetOffset) => {
    while (end - start > 86400000) {
      const mid = new Date((start.getTime() + end.getTime()) / 2);
      const offset = getOffset(mid);
      if (offset === targetOffset) {
        start = mid;
      } else {
        end = mid;
      }
    }
    return end;
  };
  
  return {
    start: binarySearchTransition(new Date(year, 0, 1), new Date(year, 6, 1), janOffset),
    end: binarySearchTransition(new Date(year, 6, 1), new Date(year, 11, 31), julOffset)
  };
};

const getDSTInfo = (timezone) => {
  const now = new Date();
  const transitions = getDSTTransitions(timezone);
  
  if (!transitions) {
    return { observesDST: false, isCurrentlyDST: false, message: null, daysUntil: null };
  }
  
  const { start, end } = transitions;
  const isCurrentlyDST = now >= start && now < end;
  
  const formatDate = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const daysUntil = (date) => Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  
  if (isCurrentlyDST) {
    const days = daysUntil(end);
    if (days <= 7 && days > 0) {
      return {
        observesDST: true,
        isCurrentlyDST: true,
        nextTransition: end,
        transitionType: 'end',
        daysUntil: days,
        message: days === 1 ? 'DST ends tomorrow' : `DST ends in ${days} days (${formatDate(end)})`
      };
    } else if (days === 0) {
      return {
        observesDST: true,
        isCurrentlyDST: true,
        nextTransition: end,
        transitionType: 'end',
        daysUntil: 0,
        message: 'DST ends today'
      };
    }
  } else {
    const nextStart = now < start ? start : getDSTTransitions(timezone, now.getFullYear() + 1)?.start;
    if (nextStart) {
      const days = daysUntil(nextStart);
      if (days <= 7 && days > 0) {
        return {
          observesDST: true,
          isCurrentlyDST: false,
          nextTransition: nextStart,
          transitionType: 'start',
          daysUntil: days,
          message: days === 1 ? 'DST starts tomorrow' : `DST starts in ${days} days (${formatDate(nextStart)})`
        };
      } else if (days === 0) {
        return {
          observesDST: true,
          isCurrentlyDST: false,
          nextTransition: nextStart,
          transitionType: 'start',
          daysUntil: 0,
          message: 'DST starts today'
        };
      }
    }
  }
  
  return { observesDST: true, isCurrentlyDST, message: null, daysUntil: null };
};

const getUSHolidays = (year = new Date().getFullYear()) => {
  const getNthWeekdayOfMonth = (year, month, weekday, n) => {
    const date = new Date(year, month, 1);
    let count = 0;
    while (date.getMonth() === month) {
      if (date.getDay() === weekday) {
        count++;
        if (count === n) return new Date(date);
      }
      date.setDate(date.getDate() + 1);
    }
    return null;
  };

  const getLastWeekdayOfMonth = (year, month, weekday) => {
    const date = new Date(year, month + 1, 0);
    while (date.getDay() !== weekday) {
      date.setDate(date.getDate() - 1);
    }
    return date;
  };

  const holidays = [
    { name: "New Year's Day", date: new Date(year, 0, 1) },
    { name: "Martin Luther King Jr. Day", date: getNthWeekdayOfMonth(year, 0, 1, 3) },
    { name: "Presidents' Day", date: getNthWeekdayOfMonth(year, 1, 1, 3) },
    { name: "Memorial Day", date: getLastWeekdayOfMonth(year, 4, 1) },
    { name: "Juneteenth", date: new Date(year, 5, 19) },
    { name: "Independence Day", date: new Date(year, 6, 4) },
    { name: "Labor Day", date: getNthWeekdayOfMonth(year, 8, 1, 1) },
    { name: "Columbus Day", date: getNthWeekdayOfMonth(year, 9, 1, 2) },
    { name: "Veterans Day", date: new Date(year, 10, 11) },
    { name: "Thanksgiving", date: getNthWeekdayOfMonth(year, 10, 4, 4) },
    { name: "Christmas Day", date: new Date(year, 11, 25) }
  ];

  // Add Inauguration Day every 4 years
  if ((year - 2021) % 4 === 0) {
    holidays.push({ name: "Inauguration Day", date: new Date(year, 0, 20) });
  }

  return holidays;
};

const getUpcomingHolidays = () => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const holidays = [...getUSHolidays(currentYear), ...getUSHolidays(currentYear + 1)];
  
  return holidays
    .filter(h => h.date >= now)
    .map(h => {
      const daysUntil = Math.ceil((h.date - now) / (1000 * 60 * 60 * 24));
      return { ...h, daysUntil };
    })
    .filter(h => h.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);
};

// ==================== CONFIGURATION ====================

const TIMEZONES = {
  india: {
    name: 'India',
    timezone: 'Asia/Kolkata',
    label: 'IST',
    primary: true
  },
  us: [
    {
      name: 'Eastern Time',
      timezone: 'America/New_York',
      label: 'ET',
      states: ['NY', 'FL', 'PA', 'OH', 'GA', 'NC', 'MI', 'NJ', 'VA', 'MA', 'IN', 'MD', 'TN', 'SC', 'ME', 'NH', 'VT', 'WV', 'CT', 'DE', 'RI', 'DC', 'KY']
    },
    {
      name: 'Central Time',
      timezone: 'America/Chicago',
      label: 'CT',
      states: ['TX', 'IL', 'MO', 'WI', 'MN', 'AL', 'LA', 'MS', 'AR', 'IA', 'OK', 'KS', 'NE', 'SD', 'ND']
    },
    {
      name: 'Mountain Time',
      timezone: 'America/Denver',
      label: 'MT',
      states: ['CO', 'AZ', 'NM', 'UT', 'WY', 'MT', 'ID']
    },
    {
      name: 'Pacific Time',
      timezone: 'America/Los_Angeles',
      label: 'PT',
      states: ['CA', 'WA', 'OR', 'NV']
    },
    {
      name: 'Alaska Time',
      timezone: 'America/Anchorage',
      label: 'AKT',
      states: ['AK']
    },
    {
      name: 'Hawaii Time',
      timezone: 'Pacific/Honolulu',
      label: 'HST',
      states: ['HI']
    }
  ]
};

// ==================== MAIN COMPONENT ====================

const TimezoneDashboard = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [is24Hour, setIs24Hour] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [copiedZone, setCopiedZone] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [meetingTime, setMeetingTime] = useState('09:00');
  const [selectedZone, setSelectedZone] = useState('America/New_York');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedStates, setSelectedStates] = useState(['CA', 'MA', 'CO', 'TN', 'VA', 'DE', 'MD', 'NJ', 'NY']);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('timezoneFavorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
  if (
    isPaused ||
    activeTab === 'meetings' ||
    showNotifications ||
    showCalendar
  ) {
    return;
  }

  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  return () => clearInterval(timer);
}, [isPaused, activeTab, showNotifications, showCalendar]);


// Update notifications at midnight India time (IST)
useEffect(() => {
  const now = new Date();
  
  // Get current time in IST
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false
  });
  
  const istNow = new Date(istFormatter.format(now));
  
  // Calculate next midnight IST
  const nextMidnightIST = new Date(istNow);
  nextMidnightIST.setHours(24, 0, 0, 0);
  
  // Convert back to local time to get the actual milliseconds to wait
  const msUntilMidnightIST = nextMidnightIST - istNow;
  
  const midnightTimer = setTimeout(() => {
    // Force notifications to recalculate by updating current time
    setCurrentTime(new Date());
  }, msUntilMidnightIST);
  
  return () => clearTimeout(midnightTimer);
}, [currentTime]);


  // ==================== HELPER FUNCTIONS ====================

  const getTimeData = (timezone) => {
    const formatter24 = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    const formatter12 = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const time = is24Hour ? formatter24.format(currentTime) : formatter12.format(currentTime);
    const date = dateFormatter.format(currentTime);

    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'shortOffset'
    });
    const parts = offsetFormatter.formatToParts(currentTime);
    const offsetPart = parts.find(part => part.type === 'timeZoneName');
    const utcOffset = offsetPart ? offsetPart.value : '';

    const january = new Date(currentTime.getFullYear(), 0, 1);
    const july = new Date(currentTime.getFullYear(), 6, 1);
    const janOffset = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' })
      .formatToParts(january).find(p => p.type === 'timeZoneName')?.value;
    const julyOffset = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'shortOffset' })
      .formatToParts(july).find(p => p.type === 'timeZoneName')?.value;
    const isDST = janOffset !== julyOffset && utcOffset === julyOffset;

    const hourFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false
    });
    const hour = parseInt(hourFormatter.format(currentTime));

    return { time, date, utcOffset, isDST, hour };
  };

  const getTimeDifference = (tz1, tz2) => {
    const date = new Date();
    
    const getOffsetMinutes = (tz) => {
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: tz }));
      return Math.round((tzDate - utcDate) / (1000 * 60));
    };

    const offset1 = getOffsetMinutes(tz1);
    const offset2 = getOffsetMinutes(tz2);
    const diffMinutes = offset1 - offset2;
    
    const hours = Math.floor(Math.abs(diffMinutes) / 60);
    const minutes = Math.abs(diffMinutes) % 60;
    const ahead = diffMinutes > 0;

    return { hours, minutes, ahead, totalMinutes: diffMinutes };
  };

  const convertMeetingTime = (timeStr, sourceTimezone, zones) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const base = new Date();

    const sourceDate = new Date(
      base.toLocaleString('en-US', { timeZone: sourceTimezone })
    );
    sourceDate.setHours(hours, minutes, 0, 0);

    const results = {};

    results['IST'] = new Intl.DateTimeFormat('en-US', {
      timeZone: TIMEZONES.india.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: !is24Hour
    }).format(sourceDate);

    zones.forEach(zone => {
      results[zone.label] = new Intl.DateTimeFormat('en-US', {
        timeZone: zone.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: !is24Hour
      }).format(sourceDate);
    });

    return results;
  };

  const getTimePeriod = (hour) => {
    if (hour >= 9 && hour < 18) return 'business';
    if (hour >= 6 && hour < 9) return 'morning';
    if (hour >= 18 && hour < 22) return 'evening';
    return 'night';
  };

  const copyToClipboard = (text, zone) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedZone(zone);
      setTimeout(() => setCopiedZone(null), 2000);
    });
  };

  const isOverlappingBusinessHours = (usHour) => {
    const indiaData = getTimeData(TIMEZONES.india.timezone);
    const indiaHour = indiaData.hour;
    const indiaBusinessHours = indiaHour >= 9 && indiaHour < 18;
    const usBusinessHours = usHour >= 9 && usHour < 18;
    return indiaBusinessHours && usBusinessHours;
  };

  const toggleState = (state) => {
    setSelectedStates(prev => 
      prev.includes(state)
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const toggleFavorite = (timezone) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(timezone)
        ? prev.filter(tz => tz !== timezone)
        : [...prev, timezone];
      localStorage.setItem('timezoneFavorites', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const isFavorite = (timezone) => favorites.includes(timezone);

  // ==================== COMPUTED VALUES ====================

  const allStates = useMemo(() => {
    const states = new Set();
    TIMEZONES.us.forEach(zone => {
      zone.states.forEach(state => states.add(state));
    });
    return Array.from(states).sort();
  }, []);

  const visibleUSZones = useMemo(() => {
    return TIMEZONES.us.filter(zone => {
      const matchesSearch = 
        zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        zone.states.some(state => state.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesRegion = 
        selectedRegion === 'all' || 
        zone.label === selectedRegion ||
        (selectedRegion === 'ET' && zone.label === 'ET') ||
        (selectedRegion === 'CT' && zone.label === 'CT') ||
        (selectedRegion === 'MT' && zone.label === 'MT') ||
        (selectedRegion === 'PT' && zone.label === 'PT') ||
        (selectedRegion === 'AK' && zone.label === 'AKT') ||
        (selectedRegion === 'HI' && zone.label === 'HST');
      
      const matchesStates = 
        selectedStates.length === 0 || 
        selectedStates.some(state => zone.states.includes(state));
      
      return matchesSearch && matchesRegion && matchesStates;
    });
  }, [searchQuery, selectedRegion, selectedStates]);

      const dstNotifications = useMemo(() => {
  const notifications = [];
  visibleUSZones.forEach(zone => {
    const dstInfo = getDSTInfo(zone.timezone);
    if (dstInfo.message && dstInfo.daysUntil !== null && dstInfo.daysUntil <= 7) {
      notifications.push({
        zone: zone.label,
        message: dstInfo.message,
        daysUntil: dstInfo.daysUntil,
        type: dstInfo.transitionType
      });
    }
  });
  return notifications;
}, [visibleUSZones]); // Only updates when zones change or at midnight IST

const holidayNotifications = useMemo(() => {
  return getUpcomingHolidays();
}, []); // Only updates at midnight IST

const totalNotifications = dstNotifications.length + holidayNotifications.length;

  // ==================== COMPONENTS ====================

  const NotificationPanel = () => {
    if (!showNotifications) return null;

    return (
      <div className="notification-panel">
        <div className="notification-header">
          <h3>Notifications</h3>
          <button onClick={() => setShowNotifications(false)} className="close-notifications">
            <X size={16} />
          </button>
        </div>

        {totalNotifications === 0 && (
          <div className="no-notifications">
            <Bell size={32} />
            <p>No upcoming notifications</p>
          </div>
        )}

        {dstNotifications.length > 0 && (
          <div className="notification-section">
            <h4>🕒 Daylight Saving Time</h4>
            {dstNotifications.map((notif, idx) => (
              <div key={idx} className={`notification-item dst ${notif.type}`}>
                <div className="notif-icon">
                  {notif.type === 'start' ? '🌅' : '🌆'}
                </div>
                <div className="notif-content">
                  <div className="notif-title">{notif.zone} - {notif.message}</div>
                  <div className="notif-meta">
                    {notif.daysUntil === 0 ? 'Today' : 
                     notif.daysUntil === 1 ? 'Tomorrow' : 
                     `In ${notif.daysUntil} days`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {holidayNotifications.length > 0 && (
          <div className="notification-section">
            <h4>🎉 US Federal Holidays</h4>
            {holidayNotifications.map((holiday, idx) => (
              <div key={idx} className="notification-item holiday">
                <div className="notif-icon">🇺🇸</div>
                <div className="notif-content">
                  <div className="notif-title">{holiday.name}</div>
                  <div className="notif-meta">
                    {holiday.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {' '}({holiday.daysUntil === 0 ? 'Today' : 
                          holiday.daysUntil === 1 ? 'Tomorrow' : 
                          `In ${holiday.daysUntil} days`})
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const CalendarModal = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMonth, setViewMonth] = useState(new Date());

    const getDaysInMonth = (date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const days = [];
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
      }
      return days;
    };

    const holidays = getUSHolidays(viewMonth.getFullYear());
    const holidayMap = new Map(
      holidays.map(h => [h.date.toDateString(), h.name])
    );

    const isToday = (date) => {
      if (!date) return false;
      const today = new Date();
      return date.toDateString() === today.toDateString();
    };

    const isHoliday = (date) => {
      if (!date) return false;
      return holidayMap.has(date.toDateString());
    };

    const changeMonth = (delta) => {
      setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + delta, 1));
    };

    return (
      <div className="calendar-modal-overlay" onClick={() => setShowCalendar(false)}>
        <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
          <div className="calendar-header">
            <h2>
              <CalendarDays size={24} />
              Calendar
            </h2>
            <button className="calendar-close" onClick={() => setShowCalendar(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="calendar-controls">
            <button onClick={() => changeMonth(-1)}>◀</button>
            <span className="calendar-month-year">
              {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)}>▶</button>
          </div>

          <div className="calendar-grid">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
            {getDaysInMonth(viewMonth).map((date, index) => (
              <div
                key={index}
                className={`calendar-day ${!date ? 'empty' : ''} ${isToday(date) ? 'today' : ''} ${isHoliday(date) ? 'holiday' : ''}`}
                title={date && isHoliday(date) ? holidayMap.get(date.toDateString()) : ''}
              >
                {date ? date.getDate() : ''}
                {date && isHoliday(date) && (
                  <div className="holiday-indicator">•</div>
                )}
              </div>
            ))}
          </div>

          <div className="calendar-legend">
            <div className="legend-item">
              <span className="legend-dot today-dot"></span>
              <span>Today</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot holiday-dot"></span>
              <span>Holiday</span>
            </div>
          </div>

          <div className="calendar-holidays-list">
            <h3>Upcoming Holidays</h3>
            {holidays.slice(0, 5).map((holiday, index) => (
              <div key={index} className="holiday-item">
                <span className="holiday-name">{holiday.name}</span>
                <span className="holiday-date">
                  {holiday.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const TimeCard = ({ name, timezone, label, states, primary }) => {
    const { time, date, utcOffset, isDST, hour } = getTimeData(timezone);
    const period = getTimePeriod(hour);
    const isOverlapping = !primary && isOverlappingBusinessHours(hour);
    const isFavorited = isFavorite(timezone);
    const copyText = `${name}: ${time} ${date} (${utcOffset})`;
    const dstInfo = getDSTInfo(timezone);

    return (
      <div className={`time-card ${primary ? 'primary' : ''} ${isDarkMode ? 'dark' : ''}`}>
        <div className="card-header">
          <div className="zone-info">
            <h3>{name}</h3>
            <div className="badges">
              <span className="zone-label">{label}</span>
              {dstInfo.isCurrentlyDST && <span className="badge dst">DST Active</span>}
              {isOverlapping && <span className="badge overlap">Business Overlap</span>}
            </div>
          </div>
          <div className="card-actions">
            <button
              className={`favorite-btn ${isFavorited ? 'favorited' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(timezone);
              }}
              title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star 
                size={16} 
                fill={isFavorited ? 'currentColor' : 'none'} 
                color={isFavorited ? '#f59e0b' : 'currentColor'} 
              />
            </button>
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(copyText, timezone)}
              title="Copy to clipboard"
            >
              {copiedZone === timezone ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
        
        <div className="time-display">
          <div className={`time ${period}`}>{time}</div>
          <div className="date">{date}</div>
        </div>
        
        <div className="card-footer">
          <span className="offset">{utcOffset}</span>
          {states && <span className="states">{states.join(', ')}</span>}
        </div>
        
        <div className={`period-indicator ${period}`}>
          {period === 'business' && 'Business Hours'}
          {period === 'morning' && 'Early Morning'}
          {period === 'evening' && 'Evening'}
          {period === 'night' && 'Night'}
        </div>
      </div>
    );
  };

  const CompareView = () => {
    const indiaData = getTimeData(TIMEZONES.india.timezone);

    const callRecommendations = useMemo(() => {
      const good = [];
      const avoid = [];
      
      visibleUSZones.forEach(zone => {
        const { hour } = getTimeData(zone.timezone);
        const indiaHour = indiaData.hour;
        
        if (hour >= 9 && hour < 18 && indiaHour >= 9 && indiaHour < 18) {
          good.push(zone.label);
        } else if (hour < 6 || hour >= 22) {
          avoid.push(zone.label);
        }
      });
      
      return { good, avoid };
    }, [indiaData.hour]);

    const getTimePeriodLabel = (hour) => {
      if (hour >= 6 && hour < 12) return 'Morning';
      if (hour >= 12 && hour < 17) return 'Afternoon';
      if (hour >= 17 && hour < 22) return 'Evening';
      return 'Night';
    };

    const getDateDifference = (indiaDate, usDate) => {
      const india = new Date(indiaDate);
      const us = new Date(usDate);
      const diffDays = Math.floor((india - us) / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) return '+1 Day';
      if (diffDays < 0) return '-1 Day';
      return 'Same Day';
    };

    const copyAllTimes = () => {
      const times = visibleUSZones.map(zone => {
        const { time } = getTimeData(zone.timezone);
        return `${zone.label}: ${time}`;
      }).join(' → ');
      
      const fullText = `IST: ${indiaData.time} → ${times}`;
      navigator.clipboard.writeText(fullText);
    };

    return (
      <div className="compare-view">
        <div className="compare-header">
          <h2>IST vs US Time Zones - Live Comparison</h2>
          <p className="subtitle">Real-time time differences and business hours overlap</p>
        </div>

        {(callRecommendations.good.length > 0 || callRecommendations.avoid.length > 0) && (
          <div className="call-recommendations">
            {callRecommendations.good.length > 0 && (
              <div className="recommendation good">
                <span className="icon">🟢</span>
                <div>
                  <strong>Good time to contact:</strong>
                  <span className="zones">{callRecommendations.good.join(', ')}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="copy-all-container">
          <button className="copy-all-btn" onClick={copyAllTimes}>
            <Copy size={16} />
            Copy All Times
          </button>
        </div>

        <div className="comparison-table-new">
          <table>
            <thead>
              <tr>
                <th>Current IST</th>
                <th>Region</th>
                <th>Region Name</th>
                <th>Current Time</th>
                <th>Time Difference</th>
                <th>Period</th>
                <th>Business Overlap</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {visibleUSZones.map(zone => {
                const usData = getTimeData(zone.timezone);
                const diff = getTimeDifference(TIMEZONES.india.timezone, zone.timezone);
                const period = getTimePeriodLabel(usData.hour);
                const overlap = isOverlappingBusinessHours(usData.hour);
                const dateDiff = getDateDifference(indiaData.date, usData.date);
                
                return (
                  <tr key={zone.timezone}>
                    <td className="ist-time">{indiaData.time}</td>
                    <td><span className="region-badge">{zone.label}</span></td>
                    <td className="region-name">{zone.name}</td>
                    <td className="us-time">{usData.time}</td>
                    <td className="time-diff">
                      {diff.ahead ? '+' : '-'}{diff.hours}h {diff.minutes > 0 ? `${diff.minutes}m` : ''}
                    </td>
                    <td>
                      <span className={`period-badge ${period.toLowerCase()}`}>
                        {period}
                      </span>
                    </td>
                    <td>
                      <span className={`overlap-badge ${overlap ? 'yes' : 'no'}`}>
                        {overlap ? '✅ Overlap' : '❌ No Overlap'}
                      </span>
                    </td>
                    <td>
                      <span className={`date-badge ${dateDiff === 'Same Day' ? 'same' : 'diff'}`}>
                        {dateDiff}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const MeetingPlanner = () => {
  const conversions = useMemo(() => 
    convertMeetingTime(meetingTime, selectedZone, visibleUSZones),
    [meetingTime, selectedZone, visibleUSZones, is24Hour]
  );

    return (
      <div className="meeting-planner">
        <div className="planner-header">
          <h2>Meeting Time Converter</h2>
          <p className="subtitle">Plan the perfect meeting time across all zones</p>
        </div>

        <div className="planner-controls">
          <div className="control-group">
            <label>Select Time Zone</label>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="zone-select"
            >
              <option value={TIMEZONES.india.timezone}>India (IST)</option>
              {TIMEZONES.us.map(zone => (
                <option key={zone.timezone} value={zone.timezone}>
                  {zone.name} ({zone.label})
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Meeting Time</label>
            <input
              type="time"
              value={meetingTime}
              onChange={(e) => setMeetingTime(e.target.value)}
              className="time-input"
            />
          </div>
        </div>

        <div className="conversion-results">
          <h3>Converted Times</h3>

          <div className="results-grid">
            {Object.entries(conversions).map(([zone, time]) => {
              const hour = parseInt(time.split(':')[0], 10);
              const isBusinessHour = hour >= 9 && hour < 18;

              return (
                <div
                  key={zone}
                  className={`result-card ${isBusinessHour ? 'good-time' : 'off-hours'}`}
                >
                  <h4>{zone}</h4>
                  <div className="converted-time">{time}</div>
                  <span className="status">
                    {isBusinessHour ? 'Business Hours' : 'Off Hours'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="best-time-finder">
            <h4>Best Meeting Windows</h4>
            <div className="time-suggestions">
              <div className="suggestion">
                <strong>Morning IST:</strong> 8:00–10:00 AM
                <span className="detail">Good for ET / CT</span>
              </div>
              <div className="suggestion">
                <strong>Evening IST:</strong> 7:00–9:00 PM
                <span className="detail">Good for MT / PT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==================== RENDER ====================

  return (
    <div className={`dashboard ${isDarkMode ? 'dark' : ''}`}>
      <header className="header">
        <div className="header-content">
          <div className="title-section">
            <Clock size={32} />
            <div>
              <h1>Time Dashboard</h1>
              <p className="tagline">US-India Time Zone Management</p>
            </div>
          </div>
          
          <div className="controls">

            <button
              className="control-btn notification-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <Bell size={20} />
              {totalNotifications > 0 && (
                <span className="notification-badge">{totalNotifications}</span>
              )}
            </button>

            <button
              className="control-btn"
              onClick={() => setShowCalendar(true)}
              title="Calendar"
            >
              <Calendar size={20} />
            </button>
            
            <button
              className="control-btn"
              onClick={() => setIs24Hour(!is24Hour)}
              title="Toggle 12/24 hour format"
            >
              {is24Hour ? '24H' : '12H'}
            </button>
            
            <button
              className="control-btn"
              onClick={() => setIsPaused(!isPaused)}
              title={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </button>
            
            <button
              className="control-btn"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <a
              href="mailto:shivakumaraitharaju@gmail.com"
              className="control-btn contact-btn"
              title="Mail : shivakumaraitharaju@gmail.com"
            >
              <Mail size={20} />
              <span className="contact-text">Contact</span>
            </a>

          </div>
        </div>

        <NotificationPanel />

        <nav className="nav-tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <Clock size={18} />
            Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'compare' ? 'active' : ''}`}
            onClick={() => setActiveTab('compare')}
          >
            <GitCompare size={18} />
            Compare
          </button>
          <button 
            className={`tab ${activeTab === 'meetings' ? 'active' : ''}`}
            onClick={() => setActiveTab('meetings')}
          >
            <Calendar size={18} />
            Meeting Planner
          </button>
          <button
            className={`tab ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
          >
            <MapPin size={18} />
            Map
          </button>
        </nav>
      </header>

      {showCalendar && <CalendarModal />}

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <>
            <section className="section india-section">
              <div className="india-compact-card">
                <div className="india-compact-header">
                  <h3>🇮🇳 India (IST)</h3>
                  <div className="india-actions">
                    <button
                      className={`favorite-btn ${isFavorite(TIMEZONES.india.timezone) ? 'favorited' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(TIMEZONES.india.timezone);
                      }}
                      title={isFavorite(TIMEZONES.india.timezone) ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star 
                        size={16} 
                        fill={isFavorite(TIMEZONES.india.timezone) ? 'currentColor' : 'none'} 
                        color={isFavorite(TIMEZONES.india.timezone) ? '#f59e0b' : 'currentColor'} 
                      />
                    </button>
                    <button
                      className="copy-btn"
                      onClick={() => {
                        const { time, date, utcOffset } = getTimeData(TIMEZONES.india.timezone);
                        copyToClipboard(`India: ${time} ${date} (${utcOffset})`, TIMEZONES.india.timezone);
                      }}
                      title="Copy to clipboard"
                    >
                      {copiedZone === TIMEZONES.india.timezone ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                <div className="india-compact-time">
                  <div className="time-large">{getTimeData(TIMEZONES.india.timezone).time}</div>
                  <div className="date-small">{getTimeData(TIMEZONES.india.timezone).date}</div>
                </div>
                <div className="india-compact-footer">
                  <span className="offset-badge">{getTimeData(TIMEZONES.india.timezone).utcOffset}</span>
                  <span className={`period-small ${getTimePeriod(getTimeData(TIMEZONES.india.timezone).hour)}`}>
                    {getTimePeriod(getTimeData(TIMEZONES.india.timezone).hour) === 'business' && 'Business Hours'}
                    {getTimePeriod(getTimeData(TIMEZONES.india.timezone).hour) === 'morning' && 'Morning'}
                    {getTimePeriod(getTimeData(TIMEZONES.india.timezone).hour) === 'evening' && 'Evening'}
                    {getTimePeriod(getTimeData(TIMEZONES.india.timezone).hour) === 'night' && 'Night'}
                  </span>
                </div>
              </div>
            </section>
            
            <section className="section us-section">
              <div className="section-header">
                <h2 className="section-title">United States Time Zones</h2>
                <div className="filters-container">
                  <div className="filter-group">
                    <div className="search-box">
                      <Search size={16} />
                      <input 
                        type="text" 
                        placeholder="Search zones or states..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                      />
                      {searchQuery && (
                        <button 
                          className="clear-search"
                          onClick={() => setSearchQuery('')}
                          title="Clear search"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="filter-group">
                    <div className="dropdown">
                      <button 
                        className="dropdown-toggle"
                        onClick={() => setShowStateDropdown(!showStateDropdown)}
                      >
                        {selectedStates.length > 0 
                          ? `${selectedStates.length} state${selectedStates.length > 1 ? 's' : ''} selected` 
                          : 'All States'}
                        {showStateDropdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {showStateDropdown && (
                        <div className="dropdown-menu states-dropdown">
                          <div className="dropdown-header">
                            <span>Select States</span>
                            <button 
                              className="clear-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStates([]);
                              }}
                            >
                              Clear
                            </button>
                          </div>
                          <div className="states-list">
                            {allStates.map(state => (
                              <label key={state} className="state-option">
                                <input
                                  type="checkbox"
                                  checked={selectedStates.includes(state)}
                                  onChange={() => toggleState(state)}
                                />
                                {state}
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="filter-group">
                    <select 
                      className="region-select"
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      disabled={selectedStates.length > 0}
                    >
                      <option value="all">All Regions</option>
                      <option value="ET">Eastern Time (ET)</option>
                      <option value="CT">Central Time (CT)</option>
                      <option value="MT">Mountain Time (MT)</option>
                      <option value="PT">Pacific Time (PT)</option>
                      <option value="AK">Alaska Time (AK)</option>
                      <option value="HI">Hawaii Time (HST)</option>
                    </select>
                  </div>

                  {(searchQuery || selectedRegion !== 'all' || selectedStates.length > 0) && (
                    <button 
                      className="clear-filters"
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedRegion('all');
                        setSelectedStates([]);
                      }}
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
              
              <div className="timezone-grid">
                {visibleUSZones.map((zone) => (
                  <TimeCard key={zone.timezone} {...zone} />
                ))}
              </div>
            </section>
          </>
        )}

        {activeTab === 'compare' && <CompareView />}
        {activeTab === 'meetings' && <MeetingPlanner />}
        {activeTab === 'map' && (
          <MapView
            visibleUSZones={visibleUSZones}
            is24Hour={is24Hour}
          />
        )}
      </main>
      <footer className="app-footer">
        <p>
          © {new Date().getFullYear()} Shivakumar Aitharaju. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default TimezoneDashboard;