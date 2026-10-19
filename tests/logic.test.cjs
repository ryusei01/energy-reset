const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
test('game definitions and scoring helpers exist',()=>{
 const source=fs.readFileSync('src/lib/games.ts','utf8');
 for(const id of ['breath','bubble','rhythm','quest'])assert.ok(source.includes(`'${id}'`));
 assert.ok(source.includes('function recommend'));
 assert.ok(source.includes('function delta'));
 assert.ok(source.includes('function xpProgress'));
});
