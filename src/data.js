// Палитра нейтральных цветов без rgb:
const NEUTRAL_COLORS = [
    '#D3D3D3',
    '#C0C0C0',
    '#A9A9A9',
    '#778899',
    '#708090',
    '#696969',
    '#DCDCDC',
    '#F0F0F0',
    '#E6E6FA',
    '#B0C4DE'
];

window.DEV_DATA = {
    groups: [
        { id: 1, name: 'Ungrouped', order: 1 }
    ],
    developers: [
        { id: 1,  name: 'Alice', role: 'Junior',    region: 'Lviv',  color: '#D3D3D3', fte: 0 },
        { id: 2,  name: 'Bob',   role: 'Junior',    region: 'Latam', color: '#C0C0C0', fte: 0 },
        { id: 3,  name: 'Carol', role: 'Middle',    region: 'Lviv',  color: '#A9A9A9', fte: 0 },
        { id: 4,  name: 'Dave',  role: 'Middle',    region: 'Latam', color: '#778899', fte: 0 },
        { id: 5,  name: 'Eve',   role: 'Senior',    region: 'Lviv',  color: '#708090', fte: 0 },
        { id: 6,  name: 'Frank', role: 'Senior',    region: 'Latam', color: '#696969', fte: 0 },
        { id: 7,  name: 'Grace', role: 'Senior',    region: 'Lviv',  color: '#DCDCDC', fte: 0 },
        { id: 8,  name: 'Heidi', role: 'Middle',    region: 'Latam', color: '#F0F0F0', fte: 0 },
        { id: 9,  name: 'Ivan',  role: 'Junior',    region: 'Lviv',  color: '#E6E6FA', fte: 0 },
        { id: 10, name: 'Judy',  role: 'Tech Lead', region: 'Latam', color: '#B0C4DE', fte: 0 },
    ],
    projects: [
        { id: 1, name: 'Project A', backendFTEGoal: 1, frontendFTEGoal: 1, order: 1 },
        { id: 2, name: 'Project B', backendFTEGoal: 1, frontendFTEGoal: 1, order: 2 },
        { id: 3, name: 'Project C', backendFTEGoal: 1, frontendFTEGoal: 1, order: 3 },
        { id: 4, name: 'Project D', backendFTEGoal: 1, frontendFTEGoal: 1, order: 4 },
        { id: 5, name: 'Project E', backendFTEGoal: 1, frontendFTEGoal: 1, order: 5 },
        { id: 6, name: 'Project F', backendFTEGoal: 1, frontendFTEGoal: 1, order: 6 },
        { id: 7, name: 'Project G', backendFTEGoal: 1, frontendFTEGoal: 1, order: 7 },
        { id: 8, name: 'Project H', backendFTEGoal: 1, frontendFTEGoal: 1, order: 8 },
    ],
    assignments: [],
    lastDeveloperId: 10,
    lastProjectId: 8,
    lastGroupId: 1,
    focusGroupId: null,
    groupSortKey: 'name-asc',
    selectedDeveloperId: null,
    currentDevId: null,
    selectedDevIds: [],
    NEUTRAL_COLORS: NEUTRAL_COLORS
};
