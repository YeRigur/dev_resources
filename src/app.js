function init() {
    loadData();
    renderDevelopers();
    renderProjects();
    initAddDeveloperForm();
    initAddProjectForm();
    initExportImport();
    initSearch();
    updateAddDevProjectOptions();
    updateProjectGroupOptions();
    initBulkActions();
    initDensityToggle();
    initScrollCue();
}

function initAddDeveloperForm() {
    const addBtn = document.getElementById('add-developer-btn');
    const projectSelect = document.getElementById('new-developer-project');
    const assignTypeRow = document.getElementById('assign-type-row');
    const assignTypeSelect = document.getElementById('new-developer-assignment-type');
    const directionSelect = document.getElementById('new-developer-direction');

    if (projectSelect && assignTypeRow) {
        const syncAssignVisibility = () => {
            const hasProject = projectSelect.value !== '';
            assignTypeRow.classList.toggle('hidden', !hasProject);
            if (hasProject) setDefaultAssignmentType();
        };
        projectSelect.addEventListener('change', syncAssignVisibility);
        if (directionSelect) directionSelect.addEventListener('change', () => {
            if (!assignTypeRow.classList.contains('hidden')) setDefaultAssignmentType();
        });
        // initial state
        syncAssignVisibility();
    }
    addBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('new-developer-name');
        const roleSelect = document.getElementById('new-developer-role');
        const regionSelect = document.getElementById('new-developer-region');
        const name = nameInput.value.trim();
        const role = roleSelect.value;
        const region = regionSelect.value;
        const targetProjectId = projectSelect ? projectSelect.value : '';
        const targetType = assignTypeSelect ? assignTypeSelect.value : 'backend';
        const direction = directionSelect ? directionSelect.value : 'BE';

        if (name) {
            DEV_DATA.lastDeveloperId += 1;
            const color = (window.Utils && Utils.defaultColorFor) ? Utils.defaultColorFor(role) : '#d3d3d3';
            const newDev = { id: DEV_DATA.lastDeveloperId, name: name, color: color, fte: 0, role: role, region: region, direction: direction };
            DEV_DATA.developers.push(newDev);
            nameInput.value = '';
            renderDevelopers();
            // if project selected, assign immediately
            if (targetProjectId) {
                const projectId = targetProjectId;
                if (!newDev.role || (window.Utils && Utils.isVacancy && Utils.isVacancy(newDev.role))) {
                    DEV_DATA.assignments.push({ devId: newDev.id, projectId, type: targetType, fte: 0, duration: '' });
                } else {
                    const availableFTE = 1; // brand new dev
                    const newFTE = parseFloat(prompt(`Enter FTE for ${newDev.name} (available: ${availableFTE}):`, 1));
                    if (!isNaN(newFTE) && newFTE > 0 && newFTE <= availableFTE) {
                        newDev.fte += newFTE;
                        if (targetType === 'fullstack') {
                            const half = Math.round((newFTE / 2) * 10) / 10;
                            const other = Math.max(0, newFTE - half);
                            DEV_DATA.assignments.push({ devId: newDev.id, projectId, type: 'backend', fte: half });
                            DEV_DATA.assignments.push({ devId: newDev.id, projectId, type: 'frontend', fte: other });
                        } else {
                            DEV_DATA.assignments.push({ devId: newDev.id, projectId, type: targetType, fte: newFTE });
                        }
                    }
                }
                renderAssignments();
                updateFTETotals();
            }
            saveData();
        } else {
            alert('Please enter a developer name.');
        }
    });
}

function initAddProjectForm() {
    const addProjectBtn = document.getElementById('add-project-btn');
    const groupSelect = document.getElementById('project-group-select');
    const groupSort = document.getElementById('group-sort-by');
    if (groupSelect) {
        groupSelect.addEventListener('change', () => {
            DEV_DATA.focusGroupId = Number(groupSelect.value);
            renderProjects();
        });
    }
    if (groupSort) {
        groupSort.value = DEV_DATA.groupSortKey || 'name-asc';
        groupSort.addEventListener('change', () => {
            DEV_DATA.groupSortKey = groupSort.value;
            renderProjects();
        });
    }
    addProjectBtn.addEventListener('click', () => {
        const projectNameInput = document.getElementById('new-project-name');
        const projectName = projectNameInput.value.trim();
        if (projectName) {
            DEV_DATA.lastProjectId += 1;
            DEV_DATA.projects.push({
                id: DEV_DATA.lastProjectId,
                name: projectName,
                backendFTEGoal: 1,
                frontendFTEGoal: 1,
                order: (DEV_DATA.projects && DEV_DATA.projects.length ? Math.max(...DEV_DATA.projects.map(p => p.order || 0)) + 1 : 1),
                groupId: groupSelect && groupSelect.value ? Number(groupSelect.value) : (DEV_DATA.groups[0] ? DEV_DATA.groups[0].id : null)
            });
            projectNameInput.value = '';
            renderProjects();
            updateAddDevProjectOptions();
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
        updateAddDevProjectOptions();
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

    DEV_DATA.developers = DEV_DATA.developers.filter(d => d.id != devId);

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
        .filter(a => {
          const dev = DEV_DATA.developers.find(d => d.id == a.devId);
          if (!dev || !dev.role) {
            return false;
          }
          return (
            a.projectId == project.id &&
            a.type == type &&
            !(window.Utils && Utils.isVacancy && Utils.isVacancy(dev.role))
          );
        })
        .reduce((sum, a) => sum + a.fte, 0);

      const totalElement = document.querySelector(
        `.fte-total[data-project-id='${project.id}'][data-type='${type}']`
      );
      totalElement.textContent = `Current FTE: ${window.Utils ? Utils.formatFTE(totalFTE) : totalFTE}`;

      const goalInput = document.querySelector(
        `.fte-input[data-project-id='${project.id}'][data-type='${type}']`
      );
      const goalFTE = parseFloat(goalInput.value);
      const difference = goalFTE - totalFTE;
      const differenceElement = document.querySelector(
        `.fte-difference[data-project-id='${project.id}'][data-type='${type}']`
      );

      if (difference > 0) {
        differenceElement.textContent = `FTE Shortfall: ${window.Utils ? Utils.formatFTE(difference) : difference}`;
        differenceElement.style.color = 'red';
      } else if (difference === 0) {
        differenceElement.textContent = `FTE Goal Met`;
        differenceElement.style.color = 'green';
      } else {
        const over = Math.abs(difference);
        differenceElement.textContent = `Overassigned by ${window.Utils ? Utils.formatFTE(over) : over}`;
        differenceElement.style.color = 'orange';
      }
    });
  });

  renderDevelopers();
  saveData();
}

function updateAddDevProjectOptions() {
    const select = document.getElementById('new-developer-project');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '';
    const none = document.createElement('option');
    none.value = '';
    none.textContent = 'No project';
    select.appendChild(none);
    DEV_DATA.projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = String(p.id);
        opt.textContent = p.name;
        select.appendChild(opt);
    });
    if ([...select.options].some(o => o.value === current)) select.value = current;
}

function setDefaultAssignmentType() {
    const assignType = document.getElementById('new-developer-assignment-type');
    const dirEl = document.getElementById('new-developer-direction');
    if (!assignType) return;
    const dir = dirEl ? dirEl.value : 'BE';
    if (dir === 'BE') assignType.value = 'backend';
    else if (dir === 'FE') assignType.value = 'frontend';
    else assignType.value = 'fullstack';
}


function highlightProjects(devId) {
    // Remove any previous highlights
    document.querySelectorAll('.developer-assigned.highlighted').forEach(el => el.classList.remove('highlighted'));
    if (devId === null) return;
    // Highlight only assignments of this developer
    document.querySelectorAll(`.developer-assigned[data-dev-id='${devId}']`).forEach(el => {
        el.classList.add('highlighted');
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
            developers: DEV_DATA.developers || [],
            assignments: DEV_DATA.assignments || [],
            projects: DEV_DATA.projects || [],
            groups: DEV_DATA.groups || [],
            lastDeveloperId: DEV_DATA.lastDeveloperId || 0,
            lastProjectId: DEV_DATA.lastProjectId || 0,
            lastGroupId: DEV_DATA.lastGroupId || 0,
            focusGroupId: DEV_DATA.focusGroupId || null,
            groupSortKey: DEV_DATA.groupSortKey || 'name-asc'
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
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                // minimal validation
                if (!importedData || typeof importedData !== 'object') throw new Error('invalid');
                DEV_DATA.developers = Array.isArray(importedData.developers) ? importedData.developers : [];
                DEV_DATA.assignments = Array.isArray(importedData.assignments) ? importedData.assignments : [];
                DEV_DATA.projects = Array.isArray(importedData.projects) ? importedData.projects : [];
                DEV_DATA.groups = Array.isArray(importedData.groups) ? importedData.groups : (DEV_DATA.groups || [{ id: 1, name: 'Ungrouped', order: 1 }]);
                DEV_DATA.focusGroupId = (importedData.focusGroupId !== undefined) ? importedData.focusGroupId : (DEV_DATA.focusGroupId || null);
                DEV_DATA.groupSortKey = importedData.groupSortKey || DEV_DATA.groupSortKey || 'name-asc';

                // recompute last ids
                DEV_DATA.lastDeveloperId = DEV_DATA.developers.reduce((maxId, dev) => Math.max(maxId, dev.id || 0), 0);
                DEV_DATA.lastProjectId = DEV_DATA.projects.reduce((maxId, proj) => Math.max(maxId, proj.id || 0), 0);
                DEV_DATA.lastGroupId = DEV_DATA.groups.reduce((maxId, g) => Math.max(maxId, g.id || 0), 0);

                // ensure there is an Ungrouped group
                let ungroup = DEV_DATA.groups.find(g => g.name === 'Ungrouped');
                if (!ungroup) {
                    DEV_DATA.lastGroupId += 1;
                    ungroup = { id: DEV_DATA.lastGroupId, name: 'Ungrouped', order: (DEV_DATA.groups.length ? Math.max(...DEV_DATA.groups.map(g=>g.order||0))+1 : 1) };
                    DEV_DATA.groups.unshift(ungroup);
                }
                // ensure projects groupId is valid
                DEV_DATA.projects.forEach(p => {
                    if (!DEV_DATA.groups.some(g => g.id === p.groupId)) {
                        p.groupId = ungroup.id;
                    }
                });

                renderDevelopers();
                renderProjects();
                updateProjectGroupOptions && updateProjectGroupOptions();
                saveData();

                alert('Data imported successfully.');
            } catch (error) {
                alert('Error importing data: invalid file format.');
            }
        };
        reader.readAsText(file);
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
window.updateAddDevProjectOptions = updateAddDevProjectOptions;
window.initBulkActions = initBulkActions;
window.initDensityToggle = initDensityToggle;
window.initScrollCue = initScrollCue;
window.updateProjectGroupOptions = updateProjectGroupOptions;
window.initDensityToggle = initDensityToggle;
window.initScrollCue = initScrollCue;

function initBulkActions() {
    const btn = document.getElementById('delete-selected-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (!DEV_DATA.selectedDevIds || DEV_DATA.selectedDevIds.length === 0) return;
        if (!confirm(`Delete ${DEV_DATA.selectedDevIds.length} selected developers?`)) return;
        const ids = new Set(DEV_DATA.selectedDevIds);
        // remove devs
        DEV_DATA.developers = DEV_DATA.developers.filter(d => !ids.has(d.id));
        // adjust fte and remove assignments
        DEV_DATA.assignments = DEV_DATA.assignments.filter(a => !ids.has(Number(a.devId)));
        DEV_DATA.selectedDevIds = [];
        renderDevelopers();
        renderProjects();
        updateFTETotals();
        saveData();
    });
}

function updateProjectGroupOptions() {
    const sel = document.getElementById('project-group-select');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '';
    (DEV_DATA.groups || []).slice().sort((a,b)=> (a.order||a.id)-(b.order||b.id)).forEach(g => {
        const opt = document.createElement('option');
        opt.value = String(g.id);
        opt.textContent = g.name;
        sel.appendChild(opt);
    });
    if ([...sel.options].some(o => o.value === cur)) sel.value = cur;
}

function initDensityToggle() {
    const btn = document.getElementById('density-toggle');
    if (!btn) return;
    const saved = localStorage.getItem('density');
    if (saved === 'compact') {
        document.body.classList.add('compact');
        btn.textContent = 'Comfortable';
    } else {
        btn.textContent = 'Compact';
    }
    btn.addEventListener('click', () => {
        document.body.classList.toggle('compact');
        const compact = document.body.classList.contains('compact');
        btn.textContent = compact ? 'Comfortable' : 'Compact';
        localStorage.setItem('density', compact ? 'compact' : 'normal');
    });
}

function initScrollCue() {
    const cue = document.getElementById('scroll-cue');
    if (!cue) return;
    const update = () => {
        const more = (window.scrollY + window.innerHeight) < (document.documentElement.scrollHeight - 16);
        cue.classList.toggle('visible', more);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
}

// Add group button
(function initAddGroupButton(){
  const btn = document.getElementById('add-group-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const name = prompt('New group name:');
    if (!name) return;
    DEV_DATA.lastGroupId = (DEV_DATA.lastGroupId || 0) + 1;
    const order = (DEV_DATA.groups && DEV_DATA.groups.length) ? Math.max(...DEV_DATA.groups.map(g => g.order || 0)) + 1 : 1;
    DEV_DATA.groups.push({ id: DEV_DATA.lastGroupId, name: name.trim(), order });
    updateProjectGroupOptions();
    renderProjects();
    saveData();
  });
})();


window.onload = init;
