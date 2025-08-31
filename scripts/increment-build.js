const fs = require('fs');
const path = require('path');

const buildFilePath = path.join(__dirname, '../build.json');

try {
  // Read current build info
  const buildData = JSON.parse(fs.readFileSync(buildFilePath, 'utf8'));
  
  // Increment build number
  buildData.buildNumber += 1;
  buildData.lastBuild = new Date().toISOString();
  
  // Write back to file
  fs.writeFileSync(buildFilePath, JSON.stringify(buildData, null, 2));
  
  console.log(`✅ Build number incremented to: ${buildData.buildNumber}`);
  console.log(`📅 Build time: ${buildData.lastBuild}`);
} catch (error) {
  console.error('❌ Failed to increment build number:', error);
  process.exit(1);
}