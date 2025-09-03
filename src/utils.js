// utils.js
(function () {
  function isVacancy(role) {
    return typeof role === 'string' && role.startsWith('Vacancy');
  }

  function isTechLead(role) {
    return role === 'Tech Lead';
  }

  function formatFTE(n) {
    if (typeof n !== 'number' || isNaN(n)) return '0';
    const fixed = Math.round(n * 10) / 10; // 1 decimal place
    return String(fixed);
  }

  function defaultColorFor(role) {
    if (isVacancy(role)) return '#fff8dc';
    if (isTechLead(role)) return '#b0c4de';
    // cycle through available palette if present
    const list = (window.DEV_DATA && window.DEV_DATA.NEUTRAL_COLORS) || ['#D3D3D3'];
    const index = (window.DEV_DATA ? window.DEV_DATA.lastDeveloperId : 0) % list.length;
    return list[index];
  }

  function setLeftBorderColor(el, color) {
    if (!el) return;
    el.style.borderLeftColor = color || '#d3d3d3';
  }

  function computeAssignedFTE(devId) {
    const list = (window.DEV_DATA && window.DEV_DATA.assignments) || [];
    return list.filter(a => String(a.devId) === String(devId))
      .reduce((sum, a) => sum + (Number(a.fte) || 0), 0);
  }

  function computeAvailability(dev) {
    if (!dev || (dev.role && isVacancy(dev.role))) {
      return { used: 0, available: 0 };
    }
    const used = computeAssignedFTE(dev.id);
    const available = Math.max(0, 1 - used);
    return { used, available };
  }

  window.Utils = {
    isVacancy,
    isTechLead,
    formatFTE,
    defaultColorFor,
    setLeftBorderColor,
    computeAssignedFTE,
    computeAvailability,
  };
})();
