const fs = require('fs');
const p = require('path');

function replaceTapTargets(dir) {
    fs.readdirSync(dir).forEach(f => {
        let fp = p.join(dir, f);
        if (fs.statSync(fp).isDirectory()) {
            replaceTapTargets(fp);
        } else if (fp.endsWith('.tsx')) {
            let c = fs.readFileSync(fp, 'utf8');
            let updated = c.replace(/className=\"([^\"]*?w-(?:8|9|10)\sh-(?:8|9|10)[^\"]*?)\"/g, (match, p1) => {
                if (!p1.includes('min-w-[44px]') && !p1.includes('min-w-11')) {
                    // Make sure it looks like an icon-only button size class and not something random
                    return 'className="' + p1 + ' min-w-[44px] min-h-[44px]"';
                }
                return match;
            });
            
            // For template literals: className={`...`}
            updated = updated.replace(/className=\{\`([^\`]*?w-(?:8|9|10)\sh-(?:8|9|10)[^\`]*?)\`\}/g, (match, p1) => {
                if (!p1.includes('min-w-[44px]') && !p1.includes('min-w-11')) {
                    return 'className={`' + p1 + ' min-w-[44px] min-h-[44px]`}';
                }
                return match;
            });

            if (c !== updated) {
                fs.writeFileSync(fp, updated);
                console.log('Fixed', fp);
            }
        }
    });
}

replaceTapTargets('src');
