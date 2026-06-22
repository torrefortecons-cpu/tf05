import fs from 'fs';
import path from 'path';

if (fs.existsSync('assets')) {
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  fs.cpSync('assets', 'dist/assets', { recursive: true });
  console.log('Assets directory copied to dist/assets successfully.');
}
