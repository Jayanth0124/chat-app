const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let updated = content;

            // Regex to find || `https://ui-avatars.com...` 
            // e.g. || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`
            // e.g. || `https://ui-avatars.com/api/?name=${friend.displayName}`
            updated = updated.replace(/\|\|\s*`https:\/\/ui-avatars\.com\/api\/\?[^`]+`/g, "|| '/logo.png'");
            updated = updated.replace(/\|\|\s*"https:\/\/ui-avatars\.com\/api\/\?[^"]+"/g, "|| '/logo.png'");
            updated = updated.replace(/\|\|\s*'https:\/\/ui-avatars\.com\/api\/\?[^']+'/g, "|| '/logo.png'");
            
            // Also some might be just the URL without || if used as fallback
            updated = updated.replace(/`https:\/\/ui-avatars\.com\/api\/\?[^`]+`/g, "'/logo.png'");
            
            if (content !== updated) {
                fs.writeFileSync(fullPath, updated, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(__dirname, 'src'));
console.log('Done replacing ui-avatars.com with /logo.png');
