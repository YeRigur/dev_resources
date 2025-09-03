// search.js
function initSearch() {
    const devSearch = document.getElementById('developer-search');
    const roleFilter = document.getElementById('developer-role-filter');
    const regionFilter = document.getElementById('developer-region-filter');
    const toggle = document.getElementById('filters-button');
    const panel = document.getElementById('filters-panel');
    const sortBy = document.getElementById('developer-sort-by');

    devSearch.addEventListener('input', () => {
        renderDevelopers();
    });

    roleFilter.addEventListener('change', () => {
        renderDevelopers();
    });

    regionFilter.addEventListener('change', () => {
        renderDevelopers();
    });

    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        panel.classList.toggle('collapsed');
      });
    }

    if (sortBy) {
      sortBy.addEventListener('change', () => {
        renderDevelopers();
      });
    }
}

function filterDevelopers() {
    const searchValue = document.getElementById('developer-search').value.toLowerCase();
    const roleValue = document.getElementById('developer-role-filter').value;
    const regionValue = document.getElementById('developer-region-filter').value;

    const filtered = DEV_DATA.developers.filter(dev => {
        const matchName = dev.name.toLowerCase().includes(searchValue);
        const matchRole = roleValue ? dev.role === roleValue : true;
        const matchRegion = regionValue ? dev.region === regionValue : true;
        return matchName && matchRole && matchRegion;
    });

    const sortBy = document.getElementById('developer-sort-by');
    const key = sortBy ? sortBy.value : 'name-asc';
    const rank = (role) => {
      if (!role) return 0;
      if (role.startsWith('Vacancy')) return 0;
      if (role === 'Junior') return 1;
      if (role === 'Middle') return 2;
      if (role === 'Senior') return 3;
      if (role === 'Tech Lead') return 4;
      return 0;
    };
    const usedAvail = (dev) => {
      if (window.Utils && Utils.computeAvailability) return Utils.computeAvailability(dev);
      const used = (DEV_DATA.assignments || []).filter(a => a.devId == dev.id).reduce((s,a)=>s+a.fte,0);
      return { used, available: Math.max(0, 1 - used) };
    };

    filtered.sort((a,b) => {
      switch (key) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'seniority':
          return rank(b.role) - rank(a.role);
        case 'avail-desc': {
          const avA = usedAvail(a).available;
          const avB = usedAvail(b).available;
          if (avB !== avA) return avB - avA;
          return a.name.localeCompare(b.name);
        }
        case 'used-asc': {
          const uA = usedAvail(a).used;
          const uB = usedAvail(b).used;
          if (uA !== uB) return uA - uB;
          return a.name.localeCompare(b.name);
        }
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
}

window.initSearch = initSearch;
window.filterDevelopers = filterDevelopers;
