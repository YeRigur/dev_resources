// Developer data
let developers = [
    { id: 1, name: 'dev1', color: '#cccccc', fte: 0 },
    { id: 2, name: 'dev2', color: '#cccccc', fte: 0 },
    { id: 3, name: 'dev3', color: '#cccccc', fte: 0 },
    { id: 4, name: 'dev4', color: '#cccccc', fte: 0 },
    { id: 5, name: 'dev5', color: '#cccccc', fte: 0 },
];

// Store project data
let projects = [
    {
        id: 1,
        name: 'Project A',
        backendFTEGoal: 1,
        frontendFTEGoal: 1
    }
];

// Store developer assignments
let assignments = [];

// Variables for tracking last developer and project IDs
let lastDeveloperId = developers.length;
let lastProjectId = projects.length;

// Initialize the app
function init() {
    loadData(); // Load data from localStorage, if available
    renderDevelopers();
    renderProjects();
    initAddDeveloperForm();
    initAddProjectForm();
    initExportImport();
}

// Load data from localStorage
function loadData() {
    const savedDevelopers = JSON.parse(localStorage.getItem('developers'));
    const savedAssignments = JSON.parse(localStorage.getItem('assignments'));
    const savedProjects = JSON.parse(localStorage.getItem('projects'));
    if (savedDevelopers) {
        developers = savedDevelopers;
        lastDeveloperId = developers.reduce((maxId, dev) => Math.max(maxId, dev.id), 0);
    }
    if (savedAssignments) {
        assignments = savedAssignments;
    }
    if (savedProjects) {
        projects = savedProjects;
        lastProjectId = projects.reduce((maxId, proj) => Math.max(maxId, proj.id), 0);
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('developers', JSON.stringify(developers));
    localStorage.setItem('assignments', JSON.stringify(assignments));
    localStorage.setItem('projects', JSON.stringify(projects));
}

// Remove a project by ID
function removeProject(projectId) {
    if (confirm('Are you sure you want to delete this project?')) {
        // Remove the project from the projects array
        projects = projects.filter(proj => proj.id != projectId);

        // Remove all assignments related to this project
        assignments = assignments.filter(assignment => assignment.projectId != projectId);

        // Update the UI
        renderProjects();
        updateFTETotals();
        saveData();
    }
}

// Variable to track the selected developer
let selectedDeveloperId = null;

// Updated function to render developers
function renderDevelopers() {
    const devContainer = document.getElementById('developers');
    devContainer.innerHTML = '';
    developers.forEach(dev => {
        const devElement = document.createElement('div');
        devElement.classList.add('developer');
        devElement.setAttribute('draggable', 'true');
        devElement.setAttribute('data-id', dev.id);
        devElement.style.backgroundColor = dev.color;

        const nameSpan = document.createElement('span');
        nameSpan.textContent = dev.name;

        // Button to change color
        const colorBtn = document.createElement('button');
        colorBtn.classList.add('color-btn');
        colorBtn.textContent = '🎨';
        colorBtn.addEventListener('click', () => {
            changeDeveloperColor(dev.id);
        });

        // Click event on developer to highlight projects
        devElement.addEventListener('click', () => {
            if (selectedDeveloperId === dev.id) {
                // Remove highlight if clicked on the same developer
                selectedDeveloperId = null;
                highlightProjects(null);
            } else {
                selectedDeveloperId = dev.id;
                highlightProjects(dev.id); // Highlight the developer's projects
            }
        });

        devElement.appendChild(nameSpan);
        devElement.appendChild(colorBtn);
        devContainer.appendChild(devElement);
    });

    initDragAndDrop(); // Initialize drag-and-drop for developers
}

// Function to highlight developer's projects
function highlightProjects(devId) {
    // Reset all highlights
    const projectColumns = document.querySelectorAll('.project-column');
    projectColumns.forEach(column => {
        column.classList.remove('highlight');
        column.classList.remove('dimmed');
    });

    if (devId === null) {
        return; // If no developer is selected, do not highlight anything
    }

    // Get all projects where the selected developer is assigned
    assignments.forEach(assignment => {
        if (assignment.devId == devId) {
            const projectColumn = document.querySelector(`.project-column[data-project-id='${assignment.projectId}']`);
            if (projectColumn) {
                projectColumn.classList.add('highlight'); // Highlight the project
            }
        }
    });

    // Dim all other projects
    projectColumns.forEach(column => {
        if (!column.classList.contains('highlight')) {
            column.classList.add('dimmed');
        }
    });
}


// Render the project list
function renderProjects() {
    const projectsContainer = document.getElementById('projects');
    projectsContainer.innerHTML = '';
    projects.forEach(project => {
        const projectColumn = document.createElement('div');
        projectColumn.classList.add('project-column');
        projectColumn.setAttribute('data-project-id', project.id);

        const projectHeader = document.createElement('div');
        projectHeader.classList.add('project-header');

        const projectTitle = document.createElement('h2');
        projectTitle.textContent = project.name;

        const deleteProjectBtn = document.createElement('button');
        deleteProjectBtn.classList.add('delete-project-btn');
        deleteProjectBtn.innerHTML = '🗑️';
        deleteProjectBtn.setAttribute('title', 'Delete project');
        deleteProjectBtn.addEventListener('click', () => {
            removeProject(project.id);
        });

        projectHeader.appendChild(projectTitle);
        projectHeader.appendChild(deleteProjectBtn);

        const subColumns = document.createElement('div');
        subColumns.classList.add('sub-columns');

        ['backend', 'frontend'].forEach(type => {
            const subColumn = document.createElement('div');
            subColumn.classList.add('sub-column');
            subColumn.setAttribute('data-type', type);

            const subTitle = document.createElement('h3');
            subTitle.textContent = type === 'backend' ? 'Back-end' : 'Front-end';

            const dropzone = document.createElement('div');
            dropzone.classList.add('developer-dropzone');
            dropzone.setAttribute('data-project-id', project.id);
            dropzone.setAttribute('data-type', type);

            const fteGoalDiv = document.createElement('div');
            fteGoalDiv.classList.add('fte-goal');
            fteGoalDiv.innerHTML = `FTE Goal: <input type="number" step="0.1" min="0" max="10" value="${type === 'backend' ? project.backendFTEGoal : project.frontendFTEGoal}" class="fte-input" data-project-id="${project.id}" data-type="${type}">`;

            const fteTotalDiv = document.createElement('div');
            fteTotalDiv.classList.add('fte-total');
            fteTotalDiv.setAttribute('data-project-id', project.id);
            fteTotalDiv.setAttribute('data-type', type);
            fteTotalDiv.textContent = 'Current FTE: 0';

            const fteDifferenceDiv = document.createElement('div');
            fteDifferenceDiv.classList.add('fte-difference');
            fteDifferenceDiv.setAttribute('data-project-id', project.id);
            fteDifferenceDiv.setAttribute('data-type', type);
            fteDifferenceDiv.textContent = 'FTE Shortfall: 0';

            subColumn.appendChild(subTitle);
            subColumn.appendChild(dropzone);
            subColumn.appendChild(fteGoalDiv);
            subColumn.appendChild(fteTotalDiv);
            subColumn.appendChild(fteDifferenceDiv);

            subColumns.appendChild(subColumn);
        });

        projectColumn.appendChild(projectHeader);
        projectColumn.appendChild(subColumns);

        projectsContainer.appendChild(projectColumn);
    });

    initDragAndDrop();
    initFTEInputs();
    renderAssignments();
    updateFTETotals();
}

// Initialize Drag and Drop functionality
function initDragAndDrop() {
    const developersElements = document.querySelectorAll('#developers .developer');
    const dropzones = document.querySelectorAll('.developer-dropzone');

    developersElements.forEach(dev => {
        dev.addEventListener('dragstart', dragStart);
    });

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', dragOver);
        zone.addEventListener('drop', drop);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
}

function dragOver(e) {
    e.preventDefault();
}

function drop(e) {
    e.preventDefault();
    const devId = e.dataTransfer.getData('text/plain');
    const developer = developers.find(dev => dev.id == devId);
    const projectId = e.currentTarget.getAttribute('data-project-id');
    const project = projects.find(proj => proj.id == projectId);
    const type = e.currentTarget.getAttribute('data-type');

    // Check developer's availability
    const totalFTE = assignments
        .filter(a => a.devId == devId)
        .reduce((sum, a) => sum + a.fte, 0);

    const remainingFTE = 1 - totalFTE;

    const fte = parseFloat(prompt(`Enter FTE for ${developer.name} (available: ${remainingFTE}):`, remainingFTE));

    if (fte > remainingFTE || fte <= 0 || isNaN(fte)) {
        alert('Invalid FTE value.');
        return;
    }

    // Add assignment
    assignments.push({ devId: devId, projectId: projectId, type: type, fte: fte });

    // Update developer's FTE
    developer.fte += fte;

    // Update the UI
    renderAssignments();
    updateFTETotals();
    saveData();
}

// Render developer assignments in projects
function renderAssignments() {
    // Clear all assignment dropzones
    const dropzones = document.querySelectorAll('.developer-dropzone');
    dropzones.forEach(zone => {
        zone.innerHTML = '';
    });

    assignments.forEach(assignment => {
        const developer = developers.find(dev => dev.id == assignment.devId);
        const zoneSelector = `.developer-dropzone[data-project-id='${assignment.projectId}'][data-type='${assignment.type}']`;
        const dropzone = document.querySelector(zoneSelector);

        if (dropzone) {
            const devElement = document.createElement('div');
            devElement.classList.add('developer-assigned');
            devElement.setAttribute('data-id', developer.id);
            devElement.setAttribute('data-project-id', assignment.projectId);
            devElement.setAttribute('data-type', assignment.type);
            devElement.style.backgroundColor = developer.color;
            devElement.textContent = `${developer.name} (${assignment.fte})`;

            // Add remove button (trash icon)
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('remove-btn');
            removeBtn.innerHTML = '🗑️'; // Trash icon
            removeBtn.addEventListener('click', () => {
                removeAssignment(assignment);
            });

            devElement.appendChild(removeBtn);
            dropzone.appendChild(devElement);
        }
    });

    saveData();
}

// Update the total FTE in the project columns
function updateFTETotals() {
    projects.forEach(project => {
        ['backend', 'frontend'].forEach(type => {
            const totalFTE = assignments
                .filter(a => a.projectId == project.id && a.type == type)
                .reduce((sum, a) => sum + a.fte, 0);

            const totalElement = document.querySelector(`.fte-total[data-project-id='${project.id}'][data-type='${type}']`);
            totalElement.textContent = `Current FTE: ${totalFTE}`;

            // Compare with goal and calculate the difference
            const goalInput = document.querySelector(`.fte-input[data-project-id='${project.id}'][data-type='${type}']`);
            const goalFTE = parseFloat(goalInput.value);
            const difference = goalFTE - totalFTE;
            const differenceElement = document.querySelector(`.fte-difference[data-project-id='${project.id}'][data-type='${type}']`);

            if (difference > 0) {
                differenceElement.textContent = `FTE Shortfall: ${difference}`;
                differenceElement.style.color = 'red'; // Display in red if FTE is below goal
            } else if (difference === 0) {
                differenceElement.textContent = `FTE Goal Met`;
                differenceElement.style.color = 'green'; // Display in green if FTE goal is met
            } else {
                differenceElement.textContent = `Overassigned by ${Math.abs(difference)}`;
                differenceElement.style.color = 'orange'; // Display in orange if overassigned
            }
        });
    });

    // Update available developers in the sidebar
    renderDevelopers();
    saveData();
}


// Initialize FTE goal input fields
function initFTEInputs() {
    const inputs = document.querySelectorAll('.fte-input');

    inputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const projectId = e.target.getAttribute('data-project-id');
            const type = e.target.getAttribute('data-type');
            const project = projects.find(proj => proj.id == projectId);

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

// Initialize form for adding a new developer
function initAddDeveloperForm() {
    const addBtn = document.getElementById('add-developer-btn');
    addBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('new-developer-name');
        const name = nameInput.value.trim();
        if (name) {
            lastDeveloperId += 1;
            developers.push({ id: lastDeveloperId, name: name, color: '#cccccc', fte: 0 });
            nameInput.value = '';
            renderDevelopers();
            saveData();
        } else {
            alert('Please enter a developer name.');
        }
    });
}

// Initialize form for adding a new project
function initAddProjectForm() {
    const addProjectBtn = document.getElementById('add-project-btn');
    addProjectBtn.addEventListener('click', () => {
        const projectNameInput = document.getElementById('new-project-name');
        const projectName = projectNameInput.value.trim();
        if (projectName) {
            lastProjectId += 1;
            projects.push({
                id: lastProjectId,
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

// Function to remove a developer assignment
function removeAssignment(assignment) {
    if (confirm('Are you sure you want to remove this developer from the project?')) {
        assignments = assignments.filter(a => a !== assignment);

        // Update the developer's FTE
        const developer = developers.find(dev => dev.id == assignment.devId);
        developer.fte -= assignment.fte;

        // Update the UI
        renderAssignments();
        updateFTETotals();
        saveData();
    }
}

// Function to change the developer's color
let currentDevId = null;

function changeDeveloperColor(devId) {
    currentDevId = devId;
    const modal = document.getElementById('color-modal');
    const colorPicker = document.getElementById('color-picker');
    const developer = developers.find(dev => dev.id == devId);
    colorPicker.value = developer.color || '#cccccc';
    modal.style.display = 'block';
}

// Modal window handlers
document.getElementById('close-color-modal').onclick = function() {
    document.getElementById('color-modal').style.display = 'none';
}

document.getElementById('save-color-btn').onclick = function() {
    const colorPicker = document.getElementById('color-picker');
    const developer = developers.find(dev => dev.id == currentDevId);
    developer.color = colorPicker.value;

    // Update the UI
    renderDevelopers();
    renderAssignments();
    saveData();

    // Close the modal window
    document.getElementById('color-modal').style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('color-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Initialize export and import functionality
function initExportImport() {
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFileInput = document.getElementById('import-file-input');

    exportBtn.addEventListener('click', () => {
        const data = {
            developers: developers,
            assignments: assignments,
            projects: projects
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
                    developers = importedData.developers || [];
                    assignments = importedData.assignments || [];
                    projects = importedData.projects || [];
                    lastDeveloperId = developers.reduce((maxId, dev) => Math.max(maxId, dev.id), 0);
                    lastProjectId = projects.reduce((maxId, proj) => Math.max(maxId, proj.id), 0);

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
}

// Start the application
window.onload = init;
