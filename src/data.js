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
    developers: [
        { id: 3, name: 'developer', role: 'Junior', region: 'Lviv', color: '#D3D3D3', fte: 0 },
    ],
    projects: [
        { id: 1, name: 'Project A', backendFTEGoal: 1, frontendFTEGoal: 1 }
    ],
    assignments: [],
    lastDeveloperId: 6,
    lastProjectId: 1,
    selectedDeveloperId: null,
    currentDevId: null,
    NEUTRAL_COLORS: NEUTRAL_COLORS
};
