const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = dir + '/' + file;
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.tsx')) {
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
  
  if (file.includes('Client.tsx') || file.includes('Filters.tsx')) {
    content = content.replace(/className=\"p-6/g, 'className=\"p-4');
    content = content.replace(/className=\"p-8/g, 'className=\"p-4');
    content = content.replace(/className=\"px-5/g, 'className=\"px-4');
    content = content.replace(/className=\"px-6/g, 'className=\"px-4');
    
    // Replace gap and space-y
    content = content.replace(/space-y-6/g, 'flex flex-col gap-4');
    content = content.replace(/space-y-8/g, 'flex flex-col gap-4');
    content = content.replace(/space-y-5/g, 'flex flex-col gap-4');
    content = content.replace(/gap-6/g, 'gap-4');
    content = content.replace(/gap-5/g, 'gap-4');
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log('Updated Client: ' + file);
  }
});
console.log('Total client files updated: ' + updatedCount);
