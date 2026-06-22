import * as fs from 'fs';
import * as path from 'path';

const source = './tmp-git';
const destination = '.';

function copyRecursively(src: string, dest: string) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      if (childItemName === 'tmp-git' || childItemName === 'copy-repo.ts') {
        return;
      }
      copyRecursively(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

console.log('Starting migration script...');
copyRecursively(source, destination);
console.log('Migration complete!');
