function renderDevelopers() {
  const devContainer = document.getElementById('developers');
  devContainer.innerHTML = '';

  const filteredDevs = filterDevelopers();

  filteredDevs.forEach(dev => {
    const devElement = document.createElement('div');
    devElement.classList.add('developer');
    
    if (dev.role === 'Tech Lead') {
      devElement.classList.add('tech-lead');
    } 
    else if (dev.role && dev.role.startsWith('Vacancy')) {
      devElement.classList.add('vacancy');
    }

    const nameSpan = document.createElement('span');
    nameSpan.textContent = dev.role === 'Tech Lead'
      ? dev.name + ' ⭐'
      : dev.name;

    if (dev.role && !dev.role.startsWith('Vacancy')) {
      const colorBtn = document.createElement('button');
      colorBtn.classList.add('color-btn');
      colorBtn.textContent = '🎨';
      colorBtn.title = 'Change developer color';
      colorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        changeDeveloperColor(dev.id);
      });
      devElement.appendChild(nameSpan);
      devElement.appendChild(colorBtn);
    } else {
      devElement.appendChild(nameSpan);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.classList.add('remove-btn');
    deleteBtn.innerHTML = '🗑️';
    deleteBtn.title = 'Remove developer';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeDeveloper(dev.id);
    });
    devElement.appendChild(deleteBtn);

    devElement.setAttribute('draggable', 'true');
    devElement.setAttribute('data-id', dev.id);

    devElement.addEventListener('click', () => {
      if (DEV_DATA.selectedDeveloperId === dev.id) {
        DEV_DATA.selectedDeveloperId = null;
        highlightProjects(null);
      } else {
        DEV_DATA.selectedDeveloperId = dev.id;
        highlightProjects(dev.id);
      }
    });

    devContainer.appendChild(devElement);
  });

  initDragAndDrop();
}


function renderProjects() {
  const projectsContainer = document.getElementById('projects');
  projectsContainer.innerHTML = '';

  DEV_DATA.projects.forEach(project => {
    const projectColumn = document.createElement('div');
    projectColumn.classList.add('project-column');
    projectColumn.setAttribute('data-project-id', project.id);

    const vacancyBadge = document.createElement('div');
    vacancyBadge.classList.add('vacancy-badge');
    vacancyBadge.textContent = 'Vacancy';
    vacancyBadge.style.display = 'none';
    projectColumn.appendChild(vacancyBadge);

    const projectHeader = document.createElement('div');
    projectHeader.classList.add('project-header');

    const projectTitle = document.createElement('h2');
    projectTitle.textContent = project.name;

    const deleteProjectBtn = document.createElement('button');
    deleteProjectBtn.classList.add('delete-project-btn');
    deleteProjectBtn.innerHTML = '🗑️';
    deleteProjectBtn.title = 'Delete project';
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
      subTitle.textContent = (type === 'backend') ? 'Back-end' : 'Front-end';

      const dropzone = document.createElement('div');
      dropzone.classList.add('developer-dropzone');
      dropzone.setAttribute('data-project-id', project.id);
      dropzone.setAttribute('data-type', type);

      const fteGoalDiv = document.createElement('div');
      fteGoalDiv.classList.add('fte-goal');
      fteGoalDiv.innerHTML = `
        FTE Goal: 
        <input 
          type="number" 
          step="0.1" 
          min="0" 
          max="10" 
          value="${type === 'backend' ? project.backendFTEGoal : project.frontendFTEGoal}" 
          class="fte-input" 
          data-project-id="${project.id}" 
          data-type="${type}"
        >
      `;

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

function renderAssignments() {
  const dropzones = document.querySelectorAll('.developer-dropzone');
  dropzones.forEach(zone => {
    zone.innerHTML = '';
  });

  DEV_DATA.assignments.forEach(assignment => {
    const developer = DEV_DATA.developers.find(dev => dev.id == assignment.devId);
    if (!developer) return; // safety check

    const zoneSelector = `.developer-dropzone[data-project-id='${assignment.projectId}'][data-type='${assignment.type}']`;
    const dropzone = document.querySelector(zoneSelector);

    if (dropzone) {
      const devElement = document.createElement('div');
      devElement.classList.add('developer-assigned');
      if (developer.role && developer.role.startsWith('Vacancy')) {
        devElement.classList.add('vacancy');
      }

      let displayText = developer.name;
      if (developer.role && !developer.role.startsWith('Vacancy')) {
        displayText += ` (${assignment.fte}`;
        if (assignment.duration) displayText += `, ${assignment.duration}`;
        displayText += `)`;
      }

      devElement.textContent = displayText;

      const removeBtn = document.createElement('button');
      removeBtn.classList.add('remove-btn');
      removeBtn.innerHTML = '🗑️';
      removeBtn.title = 'Remove developer from project';
      removeBtn.addEventListener('click', () => {
        removeAssignment(assignment);
      });

      devElement.appendChild(removeBtn);
      dropzone.appendChild(devElement);
    }
  });

  saveData();
}

window.renderDevelopers = renderDevelopers;
window.renderProjects = renderProjects;
window.renderAssignments = renderAssignments;
