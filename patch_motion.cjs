const fs = require('fs');
let code = fs.readFileSync('src/components/JournalEditor.tsx', 'utf8');

if (!code.includes("import { motion } from 'framer-motion';") && !code.includes("import { motion } from 'motion/react';")) {
  code = code.replace(
    "import React, { useState, useRef, useEffect } from 'react';",
    "import React, { useState, useRef, useEffect } from 'react';\nimport { motion } from 'motion/react';"
  );
  fs.writeFileSync('src/components/JournalEditor.tsx', code);
}
