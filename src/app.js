function init() {
    loadData();
    renderDevelopers();
    renderProjects();
    initAddDeveloperForm();
    initAddProjectForm();
    initExportImport();
    initThemeToggle();
    initSearch();
}

function initAddDeveloperForm() {
    const addBtn = document.getElementById('add-developer-btn');
    addBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('new-developer-name');
        const roleSelect = document.getElementById('new-developer-role');
        const regionSelect = document.getElementById('new-developer-region');
        const name = nameInput.value.trim();
        const role = roleSelect.value;
        const region = regionSelect.value;

        if (name) {
            DEV_DATA.lastDeveloperId += 1;
            let color = (role === 'Tech Lead') ? '#b0c4de' : '#d3d3d3';
            if (role === 'Vacancy') { color = '#fff8dc'; }
            DEV_DATA.developers.push({ id: DEV_DATA.lastDeveloperId, name: name, color: color, fte: 0, role: role, region: region });
            nameInput.value = '';
            renderDevelopers();
            saveData();
        } else {
            alert('Please enter a developer name.');
        }
    });
}

function initAddProjectForm() {
    const addProjectBtn = document.getElementById('add-project-btn');
    addProjectBtn.addEventListener('click', () => {
        const projectNameInput = document.getElementById('new-project-name');
        const projectName = projectNameInput.value.trim();
        if (projectName) {
            DEV_DATA.lastProjectId += 1;
            DEV_DATA.projects.push({
                id: DEV_DATA.lastProjectId,
                name: projectName,
                backendFTEGoal: 1,
                frontendFTEGoal: 1
            });
            projectNameInput.value = '';
            renderProjects();
            saveData();
        } else {
            alert('Please enter a project name.');
        }
    });
}

function removeProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        DEV_DATA.projects = DEV_DATA.projects.filter(proj => proj.id != projectId);
        DEV_DATA.assignments = DEV_DATA.assignments.filter(a => a.projectId != projectId);

        renderProjects();
        updateFTETotals();
        saveData();
    }
}

function removeAssignment(assignment) {
    if (confirm('Remove this developer from the project?')) {
        DEV_DATA.assignments = DEV_DATA.assignments.filter(a => a !== assignment);
        const developer = DEV_DATA.developers.find(dev => dev.id == assignment.devId);
        developer.fte -= assignment.fte;
        renderAssignments();
        updateFTETotals();
        saveData();
    }
}

function removeDeveloper(devId) {
    if (!confirm('Remove this developer entirely?')) return;

    // Удалим девелопера
    DEV_DATA.developers = DEV_DATA.developers.filter(d => d.id != devId);

    // Удалим все его назначения
    const hisAssignments = DEV_DATA.assignments.filter(a => a.devId == devId);
    hisAssignments.forEach(a => {
        const developer = DEV_DATA.developers.find(d => d.id == devId);
        if (developer) { 
            // theoretically developer is removed, so no update needed
            // but if we consider we found him:
            developer.fte -= a.fte;
        }
    });
    DEV_DATA.assignments = DEV_DATA.assignments.filter(a => a.devId != devId);

    renderDevelopers();
    renderProjects();
    saveData();
}


function updateFTETotals() {
    DEV_DATA.projects.forEach(project => {
        ['backend', 'frontend'].forEach(type => {
            const totalFTE = DEV_DATA.assignments
                .filter(a => a.projectId == project.id && a.type == type && !DEV_DATA.developers.find(d => d.id == a.devId).role.startsWith('Vacancy'))
                .reduce((sum, a) => sum + a.fte, 0);

            const totalElement = document.querySelector(`.fte-total[data-project-id='${project.id}'][data-type='${type}']`);
            totalElement.textContent = `Current FTE: ${totalFTE}`;

            const goalInput = document.querySelector(`.fte-input[data-project-id='${project.id}'][data-type='${type}']`);
            const goalFTE = parseFloat(goalInput.value);
            const difference = goalFTE - totalFTE;
            const differenceElement = document.querySelector(`.fte-difference[data-project-id='${project.id}'][data-type='${type}']`);

            if (difference > 0) {
                differenceElement.textContent = `FTE Shortfall: ${difference}`;
                differenceElement.style.color = 'red';
            } else if (difference === 0) {
                differenceElement.textContent = `FTE Goal Met`;
                differenceElement.style.color = 'green';
            } else {
                differenceElement.textContent = `Overassigned by ${Math.abs(difference)}`;
                differenceElement.style.color = 'orange';
            }
        });
    });

    renderDevelopers();
    saveData();
}


function highlightProjects(devId) {
    const projectColumns = document.querySelectorAll('.project-column');
    projectColumns.forEach(column => {
        column.classList.remove('highlight', 'dimmed');
    });

    if (devId === null) return;

    DEV_DATA.assignments.forEach(assignment => {
        if (Number(assignment.devId) === Number(devId)) {
            const projectColumn = document.querySelector(`.project-column[data-project-id='${assignment.projectId}']`);
            if (projectColumn) {
                projectColumn.classList.add('highlight');
            }
        }
    });

    projectColumns.forEach(column => {
        if (!column.classList.contains('highlight')) {
            column.classList.add('dimmed');
        }
    });
}

function initFTEInputs() {
    const inputs = document.querySelectorAll('.fte-input');
    inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const projectId = e.target.getAttribute('data-project-id');
            const type = e.target.getAttribute('data-type');
            const project = DEV_DATA.projects.find(proj => proj.id == projectId);

            const newGoal = parseFloat(e.target.value);
            if (isNaN(newGoal) || newGoal < 0) {
                alert('Invalid FTE value.');
                e.target.value = type === 'backend' ? project.backendFTEGoal : project.frontendFTEGoal;
                return;
            }

            if (type === 'backend') {
                project.backendFTEGoal = newGoal;
            } else {
                project.frontendFTEGoal = newGoal;
            }

            updateFTETotals();
            saveData();
        });
    });
}

function changeDeveloperColor(devId) {
    DEV_DATA.currentDevId = devId;
    const modal = document.getElementById('color-modal');
    const colorPicker = document.getElementById('color-picker');
    const developer = DEV_DATA.developers.find(dev => dev.id == devId);
    colorPicker.value = developer.color || '#d3d3d3';
    modal.style.display = 'block';
}

function initExportImport() {
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');
    const resetBtn = document.getElementById('reset-btn');

    exportBtn.addEventListener('click', () => {
        const data = {
            developers: DEV_DATA.developers,
            assignments: DEV_DATA.assignments,
            projects: DEV_DATA.projects
        };
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'project_data.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });

    importFileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file && file.type === 'application/json') {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const importedData = JSON.parse(e.target.result);
                    DEV_DATA.developers = importedData.developers || [];
                    DEV_DATA.assignments = importedData.assignments || [];
                    DEV_DATA.projects = importedData.projects || [];
                    DEV_DATA.lastDeveloperId = DEV_DATA.developers.reduce((maxId, dev) => Math.max(maxId, dev.id), 0);
                    DEV_DATA.lastProjectId = DEV_DATA.projects.reduce((maxId, proj) => Math.max(maxId, proj.id), 0);

                    renderDevelopers();
                    renderProjects();
                    saveData();

                    alert('Data imported successfully.');
                } catch (error) {
                    alert('Error importing data: invalid file format.');
                }
            };
            reader.readAsText(file);
        } else {
            alert('Please select a valid JSON file.');
        }
    });

    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all data?')) {
            localStorage.clear();
            location.reload();
        }
    });
}

document.getElementById('close-color-modal').onclick = function() {
    document.getElementById('color-modal').style.display = 'none';
}

document.getElementById('save-color-btn').onclick = function() {
    const colorPicker = document.getElementById('color-picker');
    const developer = DEV_DATA.developers.find(dev => dev.id == DEV_DATA.currentDevId);
    developer.color = colorPicker.value;

    renderDevelopers();
    renderAssignments();
    saveData();

    document.getElementById('color-modal').style.display = 'none';
}

window.onclick = function(event) {
    const modal = document.getElementById('color-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

window.init = init;
window.removeProject = removeProject;
window.removeAssignment = removeAssignment;
window.updateFTETotals = updateFTETotals;
window.highlightProjects = highlightProjects;
window.initFTEInputs = initFTEInputs;
window.changeDeveloperColor = changeDeveloperColor;
window.initExportImport = initExportImport;
window.removeDeveloper = removeDeveloper;


window.onload = init;
