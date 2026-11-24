// Prints the site's hard-coded content (src/data/*.ts) as JSON, for the backend's
// `flask import-site-content` command. Needs Node 22.18+ (runs TypeScript directly).
//
//   node scripts/export-content.mjs > ../backend/instance/site-content.json

const load = (name) => import(new URL(`../src/data/${name}.ts`, import.meta.url));

const people = await load("people");
const programs = await load("programs");
const ceci = await load("ceci");
const focus = await load("focusAreas");
const places = await load("whereWeWork");
const stories = await load("stories");

const content = {
  exportedAt: new Date().toISOString(),
  teamFunctions: people.teamFunctions,
  volunteers: people.volunteers,
  boardMembers: people.boardMembers,
  programmes: programs.programmes,
  ceci: {
    programme: ceci.ceciProgramme,
    learningAreas: ceci.ceciLearningAreas,
    pathways: ceci.ceciPathways,
    phases: ceci.ceciPhases,
    leadership: ceci.ceciLeadership,
  },
  focusAreas: focus.focusAreas,
  focusAnchor: focus.focusAnchor,
  whereWeWork: places.whereWeWorkContent,
  stories: stories.stories,
};

process.stdout.write(JSON.stringify(content, null, 2) + "\n");
