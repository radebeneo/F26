const fs = require('fs');
const path = require('path');

const players1Path = path.join(__dirname, 'public', 'official', 'official_players.json');
const players2Path = path.join(__dirname, 'public', 'official', 'official_players2.json');

const players1Raw = fs.readFileSync(players1Path, 'utf8');
const players2Raw = fs.readFileSync(players2Path, 'utf8');

const players1 = JSON.parse(players1Raw);
const players2 = JSON.parse(players2Raw);

const players2Map = new Map();
players2.forEach(p => {
    players2Map.set(p.id, p);
});

const fieldsToUpdate = [
    'status',
    'matchStatus',
    'percentSelected',
    'roundsSelected',
    'stats',
    'oneToWatch',
    'oneToWatchText',
    'qualificationRoundIds'
];

let updatedCount = 0;

players1.forEach(p1 => {
    const p2 = players2Map.get(p1.id);
    if (p2) {
        fieldsToUpdate.forEach(field => {
            if (p2[field] !== undefined) {
                p1[field] = p2[field];
            }
        });
        updatedCount++;
    }
});

fs.writeFileSync(players1Path, JSON.stringify(players1, null, 4), 'utf8');
console.log(`Successfully updated ${updatedCount} players in official_players.json.`);
