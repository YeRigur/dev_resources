function initDragAndDrop() {
    const developersElements = document.querySelectorAll('#developers .developer');
    const dropzones = document.querySelectorAll('.developer-dropzone');

    developersElements.forEach(dev => {
        dev.addEventListener('dragstart', dragStart);
    });

    dropzones.forEach(zone => {
        zone.addEventListener('dragover', dragOver);
        zone.addEventListener('drop', dropDeveloper);
    });
}

function dragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-id'));
}

function dragOver(e) {
    e.preventDefault();
}

function dropDeveloper(e) {
    e.preventDefault();

    const devId = e.dataTransfer.getData('text/plain');
    const developer = DEV_DATA.developers.find(dev => String(dev.id) === String(devId));
    const projectId = e.currentTarget.getAttribute('data-project-id');
    const type = e.currentTarget.getAttribute('data-type');

    if (!developer) {
        console.error(`Developer not found с id=${devId}`);
        return;
    }

    if (!developer.role) {
        console.error(`Developer ${developer.name} (id=${developer.id}) does not have a 'role' field!`, developer);        return;
    }

    if (developer.role.startsWith('Vacancy')) {
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

    const newFTE = parseFloat(prompt(
        `Enter FTE for ${developer.name} (available: ${availableFTE}):`,
        Math.min(availableFTE, 1)
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
}

window.initDragAndDrop = initDragAndDrop;
