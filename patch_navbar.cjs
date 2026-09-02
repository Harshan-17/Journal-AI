const fs = require('fs');
let code = fs.readFileSync('src/components/Navbar.tsx', 'utf8');

const toggleSidebarRegex = /\{\s*user\s*&&\s*onToggleSidebar\s*&&\s*\([\s\S]*?<\/button>\s*\)\s*\}/m;
code = code.replace(toggleSidebarRegex, '');

const securityButtonRegex = /<button\s*id="btn-security-model"[\s\S]*?<\/button>\s*/m;
code = code.replace(securityButtonRegex, '');

const adminButtonRegex = /\{\s*isAdmin\s*&&\s*onOpenAdmin\s*&&\s*\([\s\S]*?<\/button>\s*\)\s*\}/m;
code = code.replace(adminButtonRegex, '');

fs.writeFileSync('src/components/Navbar.tsx', code);
