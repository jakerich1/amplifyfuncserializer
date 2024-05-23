#!/usr/bin/env node
import fs from "fs";
import path from "path";

// Function to recursively read files, excluding certain directories
const readFiles = (
  dir: string,
  fileList: string[] = [],
  excludeDirs: string[] = ["node_modules", "dist"]
) => {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (!excludeDirs.includes(path.basename(filePath))) {
        readFiles(filePath, fileList, excludeDirs);
      }
    } else if (
      filePath.endsWith(".js") ||
      filePath.endsWith(".ts") ||
      filePath.endsWith(".jsx") ||
      filePath.endsWith(".tsx")
    ) {
      fileList.push(filePath);
    }
  });
  return fileList;
};

// Function to count package occurrences
const countPackages = (files: string[]) => {
  const packageCounts: Record<string, number> = {};
  const requireRegex = /require\(['"`](.*?)['"`]\)/g;
  const importRegex = /import\s+.*?\s+from\s+['"`](.*?)['"`]/g;

  files.forEach((file) => {
    const content = fs.readFileSync(file, "utf8");
    let matches;

    while ((matches = requireRegex.exec(content)) !== null) {
      const packageName = matches[1];
      if (
        !packageName.startsWith(".") &&
        !packageName.startsWith("@influenceio") &&
        !packageName.startsWith("@/")
      ) {
        packageCounts[packageName] = (packageCounts[packageName] || 0) + 1;
      }
    }

    while ((matches = importRegex.exec(content)) !== null) {
      const packageName = matches[1];
      if (
        !packageName.startsWith(".") &&
        !packageName.startsWith("@influenceio") &&
        !packageName.startsWith("@/")
      ) {
        packageCounts[packageName] = (packageCounts[packageName] || 0) + 1;
      }
    }
  });

  return packageCounts;
};

const currentDirectory = process.cwd();
const files = readFiles(currentDirectory);
const packageCounts = countPackages(files);

// Sort package counts by occurrences in descending order
const sortedPackageCounts = Object.entries(packageCounts)
  .sort(([, countA], [, countB]) => countB - countA)
  .reduce((acc: Record<string, number>, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});

console.table(sortedPackageCounts);
