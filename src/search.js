// search.js
function initSearch() {
    const devSearch = document.getElementById('developer-search');
    const roleFilter = document.getElementById('developer-role-filter');
    const regionFilter = document.getElementById('developer-region-filter');

    devSearch.addEventListener('input', () => {
        renderDevelopers();
    });

    roleFilter.addEventListener('change', () => {
        renderDevelopers();
    });

    regionFilter.addEventListener('change', () => {
        renderDevelopers();
    });
}

function filterDevelopers() {
    const searchValue = document.getElementById('developer-search').value.toLowerCase();
    const roleValue = document.getElementById('developer-role-filter').value;
    const regionValue = document.getElementById('developer-region-filter').value;

    return DEV_DATA.developers.filter(dev => {
        const matchName = dev.name.toLowerCase().includes(searchValue);
        const matchRole = roleValue ? dev.role === roleValue : true;
        const matchRegion = regionValue ? dev.region === regionValue : true;
        return matchName && matchRole && matchRegion;
    });
}

window.initSearch = initSearch;
window.filterDevelopers = filterDevelopers;
