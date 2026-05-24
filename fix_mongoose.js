const fs = require('fs');
const glob = require('glob'); // Note: glob might not be installed, better use native fs recursive

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.ts')) { 
            results.push(file);
        }
    });
    return results;
}

const files = walk('./backend/src');
let replacedFiles = 0;
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('new: true')) {
        let newContent = content.replace(/new:\s*true/g, "returnDocument: 'after'");
        fs.writeFileSync(file, newContent);
        replacedFiles++;
        console.log('Fixed:', file);
    }
});
console.log('Total files fixed:', replacedFiles);
