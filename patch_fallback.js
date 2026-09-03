import fs from 'fs';

let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  'interface FallbackOptions {\n  contents: any;\n  systemInstruction?: string;\n  temperature?: number;\n}',
  'interface FallbackOptions {\n  contents: any;\n  systemInstruction?: string;\n  temperature?: number;\n  responseMimeType?: string;\n}'
);

code = code.replace(
  '        config: {\n          systemInstruction: options.systemInstruction,\n          temperature: options.temperature ?? 0.7,\n        },',
  '        config: {\n          systemInstruction: options.systemInstruction,\n          temperature: options.temperature ?? 0.7,\n          ...(options.responseMimeType && { responseMimeType: options.responseMimeType }),\n        },'
);

fs.writeFileSync('server.ts', code);
