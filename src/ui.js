function renderDevelopers() {
  const devContainer = document.getElementById('developers');
  const prevScroll = devContainer.scrollTop;
  devContainer.innerHTML = '';

  const filteredDevs = filterDevelopers();

  filteredDevs.forEach(dev => {
    const devElement = document.createElement('div');
    devElement.classList.add('developer');

    const header = document.createElement('div');
    header.className = 'dev-header';
    // selection checkbox inline with name
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'dev-select';
    cb.checked = DEV_DATA.selectedDevIds.includes(dev.id);
    cb.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleDevSelection(dev.id, cb.checked);
    });

    if ((window.Utils && Utils.isTechLead && Utils.isTechLead(dev.role)) || dev.role === 'Tech Lead') {
      devElement.classList.add('tech-lead');
    } 
    else if (dev.role && ((window.Utils && Utils.isVacancy && Utils.isVacancy(dev.role)) || dev.role.startsWith('Vacancy'))) {
      devElement.classList.add('vacancy');
    }

    const nameSpan = document.createElement('span');
    nameSpan.className = 'name';
    nameSpan.textContent = dev.name;
    header.appendChild(cb);
    header.appendChild(nameSpan);
    devElement.appendChild(header);

    if (dev.role && !((window.Utils && Utils.isVacancy && Utils.isVacancy(dev.role)) || dev.role.startsWith('Vacancy'))) {
      const meta = document.createElement('span');
      meta.className = 'meta';
      const roleBadge = document.createElement('span');
      roleBadge.className = `badge role seniority-${(dev.role || '').toLowerCase().replace(' ', '-')}`;
      roleBadge.textContent = dev.role;
      meta.appendChild(roleBadge);
      // utilization row
      const util = document.createElement('div');
      util.className = 'dev-util';
      const totals = window.Utils ? Utils.computeAvailability(dev) : { used: dev.fte || 0, available: Math.max(0, 1 - (dev.fte || 0)) };
      const used = document.createElement('span');
      used.className = 'pill used';
      used.textContent = `Used ${window.Utils ? Utils.formatFTE(totals.used) : totals.used}`;
      const avail = document.createElement('span');
      avail.className = 'pill avail';
      avail.textContent = `Avail ${window.Utils ? Utils.formatFTE(totals.available) : totals.available}`;
      util.appendChild(used);
      util.appendChild(avail);
      const metaRow = document.createElement('div');
      metaRow.className = 'dev-meta-row';
      metaRow.appendChild(meta);
      metaRow.appendChild(util);
      devElement.appendChild(metaRow);

      // Actions dropdown (⋯)
      const dropdown = document.createElement('div');
      dropdown.className = 'dropdown';
      const menuBtn = document.createElement('button');
      menuBtn.className = 'menu-btn';
      menuBtn.setAttribute('aria-haspopup', 'true');
      menuBtn.textContent = '⋯';
      const menu = document.createElement('div');
      menu.className = 'dropdown-menu';
      const editAction = document.createElement('button');
      editAction.textContent = 'Edit name';
      editAction.addEventListener('click', (e) => { e.stopPropagation(); startEditDeveloperName(dev, nameSpan); closeAllDropdowns(); });
      const regionAction = document.createElement('button');
      regionAction.textContent = 'Change region';
      regionAction.addEventListener('click', (e) => { e.stopPropagation(); changeDeveloperRegion(dev); closeAllDropdowns(); });
      const deleteAction = document.createElement('button');
      deleteAction.className = 'danger';
      deleteAction.textContent = 'Delete';
      deleteAction.addEventListener('click', (e) => { e.stopPropagation(); removeDeveloper(dev.id); closeAllDropdowns(); });
      menu.appendChild(editAction);
      menu.appendChild(regionAction);
      menu.appendChild(deleteAction);
      menuBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(dropdown); });
      dropdown.appendChild(menuBtn);
      dropdown.appendChild(menu);
      header.appendChild(dropdown);
    } else {
      const meta = document.createElement('span');
      meta.className = 'meta';
      const roleBadge = document.createElement('span');
      roleBadge.className = 'badge role seniority-junior';
      roleBadge.textContent = dev.role;
      meta.appendChild(roleBadge);
      const metaRow = document.createElement('div');
      metaRow.className = 'dev-meta-row';
      metaRow.appendChild(meta);
      devElement.appendChild(metaRow);
      // Actions dropdown for vacancy
      const dropdown = document.createElement('div');
      dropdown.className = 'dropdown';
      const menuBtn = document.createElement('button');
      menuBtn.className = 'menu-btn';
      menuBtn.textContent = '⋯';
      const menu = document.createElement('div');
      menu.className = 'dropdown-menu';
      const editAction = document.createElement('button');
      editAction.textContent = 'Edit name';
      editAction.addEventListener('click', (e) => { e.stopPropagation(); startEditDeveloperName(dev, nameSpan); closeAllDropdowns(); });
      const regionAction = document.createElement('button');
      regionAction.textContent = 'Change region';
      regionAction.addEventListener('click', (e) => { e.stopPropagation(); changeDeveloperRegion(dev); closeAllDropdowns(); });
      const deleteAction = document.createElement('button');
      deleteAction.className = 'danger';
      deleteAction.textContent = 'Delete';
      deleteAction.addEventListener('click', (e) => { e.stopPropagation(); removeDeveloper(dev.id); closeAllDropdowns(); });
      menu.appendChild(editAction);
      menu.appendChild(regionAction);
      menu.appendChild(deleteAction);
      menuBtn.addEventListener('mousedown', (e) => e.stopPropagation());
      menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(dropdown); });
      dropdown.appendChild(menuBtn);
      dropdown.appendChild(menu);
      header.appendChild(dropdown);
    }

    // delete button moved into conditional block above to avoid overflow

    devElement.setAttribute('draggable', 'true');
    devElement.setAttribute('data-id', dev.id);

    // removed color accent for developers per request

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
  // restore scroll to avoid jumps
  devContainer.scrollTop = prevScroll;
}


function renderProjects() {
  const projectsContainer = document.getElementById('projects');
  const prevScroll = projectsContainer.scrollTop;
  projectsContainer.innerHTML = '';

  // Build groups map
  let groups = (DEV_DATA.groups && DEV_DATA.groups.length)
    ? DEV_DATA.groups.slice().sort((a,b)=> (a.order||a.id)-(b.order||b.id))
    : [{ id: null, name: 'Projects', order: 1 }];

  const projByGroup = new Map();
  groups.forEach(g => projByGroup.set(g.id, []));
  DEV_DATA.projects.forEach(p => {
    const gid = p.groupId || groups[0]?.id || null;
    if (!projByGroup.has(gid)) projByGroup.set(gid, []);
    projByGroup.get(gid).push(p);
  });

  // Partition groups: with projects first, then empty; Ungrouped always last unless focused
  const focusId = DEV_DATA.focusGroupId != null ? DEV_DATA.focusGroupId : null;
  const ungroup = groups.find(g => g.name === 'Ungrouped');
  const isUngroupFocused = ungroup && focusId != null && ungroup.id == focusId;

  // Helper to count
  const countFor = g => (projByGroup.get(g.id) || []).length;
  let base = groups.slice();
  if (focusId != null) {
    const focused = base.find(g => g.id == focusId);
    base = focused ? [focused].concat(base.filter(g => g !== focused)) : base;
  }
  // Remove ungroup from base for ordering (we'll append appropriately)
  if (ungroup && !isUngroupFocused) base = base.filter(g => g !== ungroup);

  const withProj = base.filter(g => countFor(g) > 0);
  const withoutProj = base.filter(g => countFor(g) === 0);
  const sortKey = (DEV_DATA.groupSortKey || 'name-asc');
  const cmpByName = (a,b) => sortKey === 'name-desc'
    ? String(b.name).localeCompare(String(a.name))
    : String(a.name).localeCompare(String(b.name));
  const cmpByProjects = (a,b) => {
    const ca = countFor(a);
    const cb = countFor(b);
    if (sortKey === 'proj-asc') {
      if (ca !== cb) return ca - cb;
      return String(a.name).localeCompare(String(b.name));
    } else { // proj-desc
      if (ca !== cb) return cb - ca;
      return String(a.name).localeCompare(String(b.name));
    }
  };

  if (sortKey === 'proj-desc' || sortKey === 'proj-asc') {
    withProj.sort(cmpByProjects);
    // keep empty groups after withProj by requirement; sort empties by name
    withoutProj.sort(cmpByName);
  } else {
    withProj.sort(cmpByName);
    withoutProj.sort(cmpByName);
  }
  groups = withProj.concat(withoutProj);
  if (isUngroupFocused && ungroup) {
    groups = [ungroup].concat(groups);
  } else if (ungroup) {
    groups = groups.concat([ungroup]);
  }

  // (handled above) ensure Ungrouped position based on content

  groups.forEach(group => {
    const wrapper = document.createElement('section');
    wrapper.className = 'project-group';
    const header = document.createElement('div');
    header.className = 'project-group-header';
    const title = document.createElement('h3');
    title.textContent = group.name;
    header.appendChild(title);
    const stats = document.createElement('div');
    stats.className = 'group-stats';
    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';
    const renBtn = document.createElement('button');
    renBtn.className = 'icon-btn';
    renBtn.title = 'Rename group';
    renBtn.textContent = '✏';
    renBtn.addEventListener('click', () => { renameGroup(group.id); });
    const delBtn = document.createElement('button');
    delBtn.className = 'icon-btn';
    delBtn.title = 'Delete group';
    delBtn.textContent = '🗑';
    delBtn.addEventListener('click', () => { deleteGroup(group.id); });
    wrapper.appendChild(header);

    const grid = document.createElement('div');
    grid.className = 'projects';
    wrapper.appendChild(grid);
    projectsContainer.appendChild(wrapper);

    const groupedProjects = (projByGroup.get(group.id) || []);
    const projectsSorted = groupedProjects
      .slice()
      .sort((a, b) => {
        const ao = (a.order != null) ? a.order : a.id;
        const bo = (b.order != null) ? b.order : b.id;
        if (ao === bo) return String(a.name).localeCompare(String(b.name));
        return ao - bo;
      });

    // Compute group FTE stats
    const projIds = new Set(projectsSorted.map(p => String(p.id)));
    let be = 0, fe = 0, tl = 0;
    (DEV_DATA.assignments || []).forEach(a => {
      if (!projIds.has(String(a.projectId))) return;
      const dev = DEV_DATA.developers.find(d => d.id == a.devId);
      if (!dev) return;
      if (dev.role && dev.role.startsWith('Vacancy')) return;
      if (a.type === 'backend') be += a.fte;
      else if (a.type === 'frontend') fe += a.fte;
      if (dev.role === 'Tech Lead') tl += a.fte;
    });
    const beEl = document.createElement('span'); beEl.className = 'stat be'; beEl.textContent = `BE ${window.Utils ? Utils.formatFTE(be) : be}`;
    const feEl = document.createElement('span'); feEl.className = 'stat fe'; feEl.textContent = `FE ${window.Utils ? Utils.formatFTE(fe) : fe}`;
    const tlEl = document.createElement('span'); tlEl.className = 'stat tl'; tlEl.textContent = `TL ${window.Utils ? Utils.formatFTE(tl) : tl}`;
    stats.appendChild(beEl); stats.appendChild(feEl); stats.appendChild(tlEl);
    header.appendChild(stats);
    actions.appendChild(renBtn);
    actions.appendChild(delBtn);
    header.appendChild(actions);

    projectsSorted.forEach(project => {
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

    const projectMenu = document.createElement('div');
    projectMenu.className = 'dropdown';
    const projectMenuBtn = document.createElement('button');
    projectMenuBtn.className = 'menu-btn';
    projectMenuBtn.textContent = '⋯';
    const projectMenuContent = document.createElement('div');
    projectMenuContent.className = 'dropdown-menu';
    const renameAction = document.createElement('button');
    renameAction.textContent = 'Rename project';
    renameAction.addEventListener('click', () => { renameProject(project.id); closeAllDropdowns(); });
    const moveGroup = document.createElement('button');
    moveGroup.textContent = 'Move to group…';
    moveGroup.addEventListener('click', () => { setProjectGroup(project.id); closeAllDropdowns(); });
    const deleteAction = document.createElement('button');
    deleteAction.className = 'danger';
    deleteAction.textContent = 'Delete project';
    deleteAction.addEventListener('click', () => { removeProject(project.id); closeAllDropdowns(); });
    projectMenuContent.appendChild(renameAction);
    projectMenuContent.appendChild(moveGroup);
    projectMenuContent.appendChild(deleteAction);
    projectMenuBtn.addEventListener('mousedown', (e) => e.stopPropagation());
    projectMenuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(projectMenu); });
    projectMenu.appendChild(projectMenuBtn);
    projectMenu.appendChild(projectMenuContent);

    projectHeader.appendChild(projectTitle);
    projectHeader.appendChild(projectMenu);

    const subColumns = document.createElement('div');
    subColumns.classList.add('sub-columns');

    ['backend', 'frontend'].forEach(type => {
      const subColumn = document.createElement('div');
      subColumn.classList.add('sub-column');
      subColumn.setAttribute('data-type', type);

      const subTitle = document.createElement('h3');
      subTitle.textContent = (type === 'backend') ? 'Back-end' : 'Front-end';
      const addPosBtn = document.createElement('button');
      addPosBtn.className = 'add-pos-btn';
      addPosBtn.title = 'Add open position';
      addPosBtn.textContent = '+';
      addPosBtn.addEventListener('click', () => {
        const fte = parseFloat(prompt('FTE for open position:', '1'));
        if (isNaN(fte) || fte <= 0) return;
        // create a dedicated vacancy developer
        DEV_DATA.lastDeveloperId += 1;
        const dev = { id: DEV_DATA.lastDeveloperId, name: 'Vacancy', role: type === 'backend' ? 'Vacancy (BE)' : 'Vacancy (FE)', region: '-', color: '#fff8dc', fte: 0 };
        DEV_DATA.developers.push(dev);
        DEV_DATA.assignments.push({ devId: dev.id, projectId: project.id, type: type, fte });
        renderAssignments();
        updateFTETotals();
        saveData();
      });

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

      const subHeader = document.createElement('div');
      subHeader.style.display = 'flex';
      subHeader.style.alignItems = 'center';
      subHeader.style.justifyContent = 'space-between';
      subHeader.appendChild(subTitle);
      subHeader.appendChild(addPosBtn);
      subColumn.appendChild(subHeader);
      subColumn.appendChild(dropzone);
      subColumn.appendChild(fteGoalDiv);
      subColumn.appendChild(fteTotalDiv);
      subColumn.appendChild(fteDifferenceDiv);

      subColumns.appendChild(subColumn);
    });

    projectColumn.appendChild(projectHeader);
    projectColumn.appendChild(subColumns);
    grid.appendChild(projectColumn);
    });
  });

  initDragAndDrop();
  if (window.initProjectReorder) initProjectReorder();
  initFTEInputs();
  renderAssignments();
  updateFTETotals();
  // restore scroll
  projectsContainer.scrollTop = prevScroll;
}

function normalizeProjectOrder() {
  const list = DEV_DATA.projects
    .slice()
    .sort((a, b) => ((a.order != null ? a.order : a.id) - (b.order != null ? b.order : b.id)));
  list.forEach((p, idx) => { p.order = idx + 1; });
}

function moveProjectRelative(projectId, delta) {
  if (!delta) return;
  if (!DEV_DATA.projects || DEV_DATA.projects.length < 2) return;
  normalizeProjectOrder();
  const list = DEV_DATA.projects;
  const idx = list.findIndex(p => p.id == projectId);
  if (idx < 0) return;
  const targetIdx = idx + delta;
  if (targetIdx < 0 || targetIdx >= list.length) return;
  // swap orders
  const a = list[idx];
  const b = list[targetIdx];
  const tmp = a.order; a.order = b.order; b.order = tmp;
  renderProjects();
  saveData();
}

function renameGroup(groupId) {
  const g = DEV_DATA.groups.find(gr => gr.id === groupId);
  if (!g) return;
  const value = prompt('Rename group:', g.name);
  if (!value) return;
  g.name = value.trim();
  if (window.updateProjectGroupOptions) updateProjectGroupOptions();
  renderProjects();
  saveData();
}

window.renameGroup = renameGroup;

function setProjectPosition(projectId) {
  if (!DEV_DATA.projects) return;
  normalizeProjectOrder();
  const n = DEV_DATA.projects.length;
  const current = DEV_DATA.projects.find(p => p.id == projectId);
  if (!current) return;
  const value = prompt(`Set project position (1-${n}):`, String(current.order || 1));
  const pos = parseInt(value, 10);
  if (!pos || pos < 1 || pos > n) return;
  // sort, remove current, insert at pos-1
  const sorted = DEV_DATA.projects.slice().sort((a,b)=>a.order-b.order);
  const others = sorted.filter(p => p !== current);
  others.splice(pos - 1, 0, current);
  others.forEach((p, i) => p.order = i + 1);
  renderProjects();
  saveData();
}

function renderAssignments() {
  const dropzones = document.querySelectorAll('.developer-dropzone');
  dropzones.forEach(zone => {
    zone.innerHTML = '';
  });

  DEV_DATA.assignments.forEach((assignment, idx) => {
    const developer = DEV_DATA.developers.find(dev => dev.id == assignment.devId);
    if (!developer) return; // safety check

    const zoneSelector = `.developer-dropzone[data-project-id='${assignment.projectId}'][data-type='${assignment.type}']`;
    const dropzone = document.querySelector(zoneSelector);

    if (dropzone) {
      const devElement = document.createElement('div');
      devElement.classList.add('developer-assigned');
      devElement.setAttribute('data-dev-id', String(assignment.devId));
      devElement.setAttribute('data-project-id', String(assignment.projectId));
      devElement.setAttribute('draggable', 'true');
      devElement.setAttribute('data-assignment-index', String(idx));
      if (developer.role && ((window.Utils && Utils.isVacancy && Utils.isVacancy(developer.role)) || developer.role.startsWith('Vacancy'))) {
        devElement.classList.add('vacancy');
      }

      let displayText;
      const fteText = window.Utils ? Utils.formatFTE(assignment.fte) : assignment.fte;
      if (developer.role && !((window.Utils && Utils.isVacancy && Utils.isVacancy(developer.role)) || developer.role.startsWith('Vacancy'))) {
        displayText = `${developer.name} (${fteText})`;
      } else {
        displayText = `Vacancy (${fteText})`;
      }

      devElement.textContent = displayText;
      // removed trash icon; use drag-out or project menu actions
      dropzone.appendChild(devElement);
    }
  });

  saveData();
  // rebind drag handlers for new assignment elements
  if (window.initDragAndDrop) initDragAndDrop();
}

function startEditDeveloperName(dev, nameSpan) {
  const input = document.createElement('input');
  input.type = 'text';
  input.value = dev.name;
  input.className = 'edit-name-input';
  nameSpan.replaceWith(input);
  input.focus();

  const commit = () => {
    const newVal = input.value.trim();
    if (newVal) {
      dev.name = newVal;
      saveData();
      renderDevelopers();
      renderAssignments();
    } else {
      // revert
      renderDevelopers();
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') renderDevelopers();
  });
  input.addEventListener('blur', commit);
}

function toggleDropdown(drop) {
  closeAllDropdowns();
  drop.classList.toggle('open');
}

function closeAllDropdowns() {
  document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
}

document.addEventListener('click', () => closeAllDropdowns());

function toggleDevSelection(id, checked) {
  const set = new Set(DEV_DATA.selectedDevIds);
  if (checked) set.add(id); else set.delete(id);
  DEV_DATA.selectedDevIds = Array.from(set);
}

function changeDeveloperRole(dev) {
  const value = prompt('Role (Junior|Middle|Senior|Tech Lead|Vacancy (BE)|Vacancy (FE)):', dev.role || 'Junior');
  if (!value) return;
  dev.role = value;
  saveData();
  renderDevelopers();
  renderAssignments();
}

function changeDeveloperRegion(dev) {
  const value = prompt('Region (Lviv|Latam):', dev.region || 'Lviv');
  if (!value) return;
  dev.region = value;
  saveData();
  renderDevelopers();
}

function changeDeveloperSpecialty(dev) {
  const value = prompt('Specialty (BE|FE|TECH):', dev.specialty || 'BE');
  if (!value) return;
  dev.specialty = value;
  saveData();
  renderDevelopers();
  renderAssignments();
}

window.renderDevelopers = renderDevelopers;
window.renderProjects = renderProjects;
window.renderAssignments = renderAssignments;
window.startEditDeveloperName = startEditDeveloperName;
window.toggleDropdown = toggleDropdown;
window.changeDeveloperRole = changeDeveloperRole;
window.changeDeveloperRegion = changeDeveloperRegion;
window.changeDeveloperSpecialty = changeDeveloperSpecialty;
window.renameProject = renameProject;
// dnd handles reordering; keep functions internal
window.deleteGroup = deleteGroup;

function renameProject(projectId) {
  const proj = DEV_DATA.projects.find(p => p.id == projectId);
  if (!proj) return;
  const value = prompt('New project name:', proj.name);
  if (!value) return;
  proj.name = value.trim();
  renderProjects();
  updateAddDevProjectOptions();
  saveData();
}

function setProjectGroup(projectId) {
  const proj = DEV_DATA.projects.find(p => p.id == projectId);
  if (!proj) return;
  const current = proj.groupId || '';
  const names = DEV_DATA.groups.map(g => `${g.id}:${g.name}`).join('\n');
  const input = prompt(`Move to group (enter id) or new name:\n${names}`, String(current || ''));
  if (input == null) return;
  const existing = DEV_DATA.groups.find(g => String(g.id) === String(input));
  if (existing) {
    proj.groupId = existing.id;
  } else {
    // create new group with this name
    DEV_DATA.lastGroupId = (DEV_DATA.lastGroupId || 0) + 1;
    const order = (DEV_DATA.groups && DEV_DATA.groups.length) ? Math.max(...DEV_DATA.groups.map(g => g.order || 0)) + 1 : 1;
    const g = { id: DEV_DATA.lastGroupId, name: input.trim() || 'Group', order };
    DEV_DATA.groups.push(g);
    proj.groupId = g.id;
    updateProjectGroupOptions();
  }
  renderProjects();
  saveData();
}

function deleteGroup(groupId) {
  if (groupId == null) return;
  const ungroup = DEV_DATA.groups.find(g => g.name === 'Ungrouped') || DEV_DATA.groups[0];
  if (ungroup && ungroup.id === groupId) {
    alert('Cannot delete the Ungrouped group.');
    return;
  }
  if (!confirm('Delete this group? All projects will move to Ungrouped.')) return;
  const targetId = ungroup ? ungroup.id : null;
  DEV_DATA.projects.forEach(p => { if (p.groupId === groupId) p.groupId = targetId; });
  DEV_DATA.groups = DEV_DATA.groups.filter(g => g.id !== groupId);
  if (DEV_DATA.focusGroupId === groupId) DEV_DATA.focusGroupId = targetId;
  if (window.updateProjectGroupOptions) updateProjectGroupOptions();
  renderProjects();
  saveData();
}
