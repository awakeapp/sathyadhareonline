const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('d:/APPS/SATHYADHARE/src/app/admin');
let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace title in PresenceHeader
  content = content.replace(/title="Presence"/g, 'title="Super Admin"');
  
  // Replace main container paddings
  content = content.replace(/className=\"px-5 pb-10 space-y-6 relative z-20/g, 'className="p-4 flex flex-col gap-4 relative z-20');
  content = content.replace(/className=\"px-5 pb-\[120px\] space-y-6 relative z-20/g, 'className="p-4 flex flex-col gap-4 relative z-20');
  content = content.replace(/className=\"px-5 pb-10 space-y-8 relative z-20/g, 'className="p-4 flex flex-col gap-4 relative z-20');
  // Also fix Client files with hardcoded spaces
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log('Updated: ' + file);
  }
});
console.log('Total page/route files updated: ' + updatedCount);
