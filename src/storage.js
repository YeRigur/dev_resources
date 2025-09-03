// storage.js
function loadData() {
    const savedDevelopers = JSON.parse(localStorage.getItem('developers'));
    const savedAssignments = JSON.parse(localStorage.getItem('assignments'));
    const savedProjects = JSON.parse(localStorage.getItem('projects'));
    const savedGroups = JSON.parse(localStorage.getItem('groups'));

    if (savedDevelopers) {
        DEV_DATA.developers = savedDevelopers;
        DEV_DATA.lastDeveloperId = DEV_DATA.developers.reduce((maxId, dev) => Math.max(maxId, dev.id), 0);
    }
    if (savedAssignments) {
        DEV_DATA.assignments = savedAssignments;
    }
    if (savedProjects) {
        DEV_DATA.projects = savedProjects;
        DEV_DATA.lastProjectId = DEV_DATA.projects.reduce((maxId, proj) => Math.max(maxId, proj.id), 0);
    }
    if (savedGroups) {
        DEV_DATA.groups = savedGroups;
        DEV_DATA.lastGroupId = DEV_DATA.groups.reduce((maxId, g) => Math.max(maxId, g.id), 0);
    }

    // Enforce dark-only theme
    document.body.classList.add('dark');
}

function saveData() {
    localStorage.setItem('developers', JSON.stringify(DEV_DATA.developers));
    localStorage.setItem('assignments', JSON.stringify(DEV_DATA.assignments));
    localStorage.setItem('projects', JSON.stringify(DEV_DATA.projects));
    localStorage.setItem('groups', JSON.stringify(DEV_DATA.groups));
}

window.loadData = loadData;
window.saveData = saveData;
