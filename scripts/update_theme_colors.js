const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
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
files.push('d:/APPS/SATHYADHARE/src/components/PresenceUI.tsx');

let updatedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Background Colors
  content = content.replace(/bg-white dark:bg-\[#1b1929\]/g, 'bg-white dark:bg-zinc-950');
  content = content.replace(/bg-\[#1b1929\] dark:bg-white/g, 'bg-zinc-950 dark:bg-white');
  content = content.replace(/bg-gray-50 dark:bg-\[#1b1929\]/g, 'bg-zinc-50 dark:bg-zinc-950');
  content = content.replace(/bg-gray-50 dark:bg-white\/5/g, 'bg-zinc-50 dark:bg-white/5');
  content = content.replace(/bg-gray-50 dark:bg-gray-800/g, 'bg-zinc-50 dark:bg-zinc-900');
  content = content.replace(/bg-gray-50 dark:bg-gray-900/g, 'bg-zinc-50 dark:bg-zinc-950');
  content = content.replace(/bg-\[#f0f2ff\] dark:bg-indigo-500\/5/g, 'bg-zinc-50 dark:bg-white/5');
  
  // Text Colors
  content = content.replace(/text-\[#1b1929\] dark:text-white/g, 'text-zinc-900 dark:text-zinc-50');
  content = content.replace(/text-gray-900 dark:text-white/g, 'text-zinc-900 dark:text-zinc-50');
  content = content.replace(/text-gray-400 dark:text-gray-500/g, 'text-zinc-500 dark:text-zinc-400');
  content = content.replace(/text-gray-500/g, 'text-zinc-500');
  content = content.replace(/text-gray-400/g, 'text-zinc-500');
  content = content.replace(/text-gray-600/g, 'text-zinc-600');
  content = content.replace(/text-gray-700/g, 'text-zinc-700');
  content = content.replace(/text-gray-300/g, 'text-zinc-400');
  content = content.replace(/text-gray-200/g, 'text-zinc-300');
  content = content.replace(/text-gray-100/g, 'text-zinc-200');
  content = content.replace(/text-\[#2d2d2d\] dark:text-white/g, 'text-zinc-900 dark:text-zinc-50');

  // Borders
  content = content.replace(/border-gray-200/g, 'border-zinc-200');
  content = content.replace(/border-gray-100/g, 'border-zinc-100');
  content = content.replace(/border-gray-300/g, 'border-zinc-300');
  content = content.replace(/border-black\/5 dark:border-white\/5/g, 'border-zinc-200 dark:border-white/10');
  content = content.replace(/border-black\/10 dark:border-white\/10/g, 'border-zinc-200 dark:border-white/10');
  content = content.replace(/border-indigo-500\/10/g, 'border-indigo-500/20');
  
  // Replace Lucide Icon strokeWidth
  content = content.replace(/strokeWidth=\{1\.5\}/g, 'strokeWidth={1.25}');
  content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+className="([^"]*(?:w-[3-9]|h-[3-9])[^"]*)"\s+(?!.*?strokeWidth)/g, '<$1 className="$2" strokeWidth={1.25} ');
  content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+className='([^']*(?:w-[3-9]|h-[3-9])[^']*)'\s+(?!.*?strokeWidth)/g, "<$1 className='$2' strokeWidth={1.25} ");
  content = content.replace(/<([A-Z][a-zA-Z0-9]*)\s+size=\{([0-9]+)\}\s+(?!.*?strokeWidth)/g, '<$1 size={$2} strokeWidth={1.25} ');

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    updatedCount++;
    console.log('Updated theme in: ' + file);
  }
});

console.log('Total files themed: ' + updatedCount);

// Specifically handle Presence Header layout in PresenceUI.tsx
const pUIPath = 'd:/APPS/SATHYADHARE/src/components/PresenceUI.tsx';
let pUI = fs.readFileSync(pUIPath, 'utf8');

// The fixed header height
pUI = pUI.replace(
  /className="fixed top-0 left-1\/2 -translate-x-1\/2 z-40 w-full max-w-\[1400px\] bg-white dark:bg-\[#09090b\][^\"]*"/,
  'className="fixed top-0 left-1/2 -translate-x-1/2 z-40 w-full max-w-[1400px] h-[72px] bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200 dark:border-zinc-800/80 p-0 shadow-sm flex flex-col justify-end"'
);

// Internal header wrapper
pUI = pUI.replace(
  /<div className="flex items-center justify-between">/,
  '<div className="flex items-center justify-between h-14 px-4 w-full">'
);

// Wrapper top padding
pUI = pUI.replace(
  /pt-\[88px\]/g,
  'pt-[80px]'
);

// Ensure the Header inner title handles dark mode text natively since we removed text-white globally on the wrap
pUI = pUI.replace(
  /<h1 className="text-xl sm:text-2xl font-bold tracking-wide">\{title\}<\/h1>/,
  '<h1 className="text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>'
);
pUI = pUI.replace(
  /<p className="text-xs uppercase opacity-80 mt-1">\{roleLabel\}<\/p>/,
  '<p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-0.5">{roleLabel}</p>'
);

fs.writeFileSync(pUIPath, pUI, 'utf8');
console.log('Fixed PresenceHeader completely.');
