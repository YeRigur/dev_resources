function initDragAndDrop() {
    const developersElements = document.querySelectorAll('#developers .developer');
    const dropzones = document.querySelectorAll('.developer-dropzone');
    const assignedElements = document.querySelectorAll('.developer-assigned');
    const developersList = document.getElementById('developers');

    developersElements.forEach(dev => {
        dev.addEventListener('dragstart', dragStart);
    });

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', dragOver);
        zone.addEventListener('dragenter', dragEnter);
        zone.addEventListener('dragleave', dragLeave);
        zone.addEventListener('drop', dropDeveloper);
    });

    assignedElements.forEach(el => {
        el.addEventListener('dragstart', dragStartAssigned);
    });

    if (developersList) {
        developersList.classList.add('drop-target');
        developersList.addEventListener('dragover', (e) => { e.preventDefault(); developersList.classList.add('dragover'); });
        developersList.addEventListener('dragleave', () => developersList.classList.remove('dragover'));
        developersList.addEventListener('drop', (e) => dropToDevelopers(e, developersList));
    }
}

// ---- Project reordering (drag-and-drop) ----
let DRAGGING_PROJECT_ID = null;

function initProjectReorder() {
    const cards = document.querySelectorAll('.project-column');
    cards.forEach(card => {
        card.setAttribute('draggable', 'true');
        card.addEventListener('dragstart', projectDragStart);
        card.addEventListener('dragend', projectDragEnd);
        card.addEventListener('dragover', projectDragOver);
        card.addEventListener('dragleave', projectDragLeave);
        card.addEventListener('drop', projectDrop);
    });
}

function projectDragStart(e) {
    DRAGGING_PROJECT_ID = e.currentTarget.getAttribute('data-project-id');
    e.dataTransfer.setData('application/x-project', DRAGGING_PROJECT_ID);
    e.currentTarget.classList.add('dragging');
}

function projectDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    DRAGGING_PROJECT_ID = null;
}

function projectDragOver(e) {
    if (!DRAGGING_PROJECT_ID) return; // only when reordering projects
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('reorder-over');
}

function projectDragLeave(e) {
    if (!DRAGGING_PROJECT_ID) return;
    e.currentTarget.classList.remove('reorder-over');
}

function projectDrop(e) {
    if (!DRAGGING_PROJECT_ID) return;
    e.preventDefault();
    e.stopPropagation();
    const targetId = e.currentTarget.getAttribute('data-project-id');
    e.currentTarget.classList.remove('reorder-over');
    if (!targetId || targetId === DRAGGING_PROJECT_ID) return;

    // Build ordered list
    const sorted = DEV_DATA.projects
        .slice()
        .sort((a,b)=>((a.order!=null?a.order:a.id)-(b.order!=null?b.order:b.id)));
    const fromIdx = sorted.findIndex(p => String(p.id) === String(DRAGGING_PROJECT_ID));
    const toIdx = sorted.findIndex(p => String(p.id) === String(targetId));
    if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return;
    const [moved] = sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, moved);
    sorted.forEach((p, i) => { p.order = i + 1; });

    renderProjects();
    saveData();
}

window.initProjectReorder = initProjectReorder;

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
}

function dragStartAssigned(e) {
    const idx = e.target.getAttribute('data-assignment-index');
    if (idx !== null) {
        e.dataTransfer.setData('text/plain', `assign:${idx}`);
    }
}

function dragOver(e) {
    e.preventDefault();
}

function dragEnter(e) {
    e.currentTarget.classList.add('dragover');
}

function dragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function dropDeveloper(e) {
    e.preventDefault();

    const payload = e.dataTransfer.getData('text/plain');
    const isAssignment = typeof payload === 'string' && payload.startsWith('assign:');
    const projectId = e.currentTarget.getAttribute('data-project-id');
    const type = e.currentTarget.getAttribute('data-type');

    if (isAssignment) {
        const idx = parseInt(payload.split(':')[1], 10);
        if (Number.isNaN(idx) || !DEV_DATA.assignments[idx]) return;
        const a = DEV_DATA.assignments[idx];
        const dev = DEV_DATA.developers.find(d => d.id == a.devId);
        if (!dev) return;

        // Only transfer from the dragged assignment. Max is always 1, but
        // also cannot exceed the current assignment's FTE.
        const maxAssignable = Math.min(1, a.fte);
        const def = maxAssignable;
        const entered = parseFloat(prompt(
            `Enter FTE to transfer (max: ${window.Utils ? Utils.formatFTE(maxAssignable) : maxAssignable}):`,
            window.Utils ? Utils.formatFTE(def) : def
        ));
        if (isNaN(entered) || entered <= 0 || entered > maxAssignable) {
            alert('Invalid FTE value.');
            return;
        }

        // subtract from original, add new assignment with entered FTE
        a.fte = a.fte - entered;
        if (a.fte <= 0) {
            DEV_DATA.assignments.splice(idx, 1);
        }
        DEV_DATA.assignments.push({ devId: a.devId, projectId, type, fte: entered });

        // developer.fte does not change on transfer
        renderAssignments();
        updateFTETotals();
        saveData();
        e.currentTarget.classList.remove('dragover');
        return;
    }

    const devId = payload;
    const developer = DEV_DATA.developers.find(dev => String(dev.id) === String(devId));
    
    

    if (!developer) {
        console.error(`Developer not found, id=${devId}`);
        return;
    }

    if (!developer.role) {
        console.error(`Developer ${developer.name} (id=${developer.id}) does not have a 'role' field!`, developer);        return;
    }

    if ((window.Utils && Utils.isVacancy && Utils.isVacancy(developer.role)) || developer.role.startsWith('Vacancy')) {
        DEV_DATA.assignments.push({
            devId: devId,
            projectId: projectId,
            type: type,
            fte: 0,
            duration: ''
        });
        renderAssignments();
        updateFTETotals();
        saveData();
        return;
    }

    const oldAssignments = DEV_DATA.assignments.filter(a => a.devId == devId);
    const totalFTE = oldAssignments.reduce((sum, a) => sum + a.fte, 0);

    const availableFTE = 1 - totalFTE;
    if (availableFTE <= 0) {
        alert(`No available FTE for ${developer.name}.`);
        return;
    }

    const availableStr = window.Utils ? Utils.formatFTE(availableFTE) : availableFTE;
    const newFTE = parseFloat(prompt(
        `Enter FTE for ${developer.name} (available: ${availableStr}):`,
        (Math.round(Math.min(availableFTE, 1) * 10) / 10)
    ));

    if (isNaN(newFTE) || newFTE <= 0 || newFTE > availableFTE) {
        alert('Invalid FTE value.');
        return;
    }

    developer.fte += newFTE;
    DEV_DATA.assignments.push({
        devId: devId,
        projectId: projectId,
        type: type,
        fte: newFTE,
    });

    renderAssignments();
    updateFTETotals();
    saveData();
    e.currentTarget.classList.remove('dragover');
}

function dropToDevelopers(e, container) {
    e.preventDefault();
    const payload = e.dataTransfer.getData('text/plain');
    if (!payload || !payload.startsWith('assign:')) { container.classList.remove('dragover'); return; }
    const idx = parseInt(payload.split(':')[1], 10);
    if (Number.isNaN(idx) || !DEV_DATA.assignments[idx]) { container.classList.remove('dragover'); return; }
    const assignment = DEV_DATA.assignments[idx];
    const dev = DEV_DATA.developers.find(d => d.id == assignment.devId);
    if (dev && !((window.Utils && Utils.isVacancy && Utils.isVacancy(dev.role)) || (dev.role && dev.role.startsWith('Vacancy')))) {
        dev.fte -= assignment.fte;
    }
    DEV_DATA.assignments.splice(idx, 1);
    renderAssignments();
    updateFTETotals();
    saveData();
    container.classList.remove('dragover');
}

window.initDragAndDrop = initDragAndDrop;
