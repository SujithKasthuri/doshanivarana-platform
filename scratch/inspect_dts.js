const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../node_modules/@react-native-firebase/firestore/lib/index.d.ts');
const content = fs.readFileSync(filePath, 'utf8');

const lines = content.split('\n');
console.log("Lines containing 'FieldValue' or 'Timestamp':");
lines.forEach((line, index) => {
  if (line.includes('class FieldValue') || line.includes('interface FieldValue') || line.includes('class Timestamp') || line.includes('interface Timestamp')) {
    console.log(`${index + 1}: ${line}`);
  }
});
