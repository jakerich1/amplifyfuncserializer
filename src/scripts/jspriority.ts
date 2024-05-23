#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

async function getDirectorySize(directory: string) {
  let totalSize = 0;
  let jsFileCount = 0;

  const items = await fs.promises.readdir(directory, { withFileTypes: true });

  for (const item of items) {
    const itemPath = path.join(directory, item.name);
    if (item.isDirectory() && item.name !== "node_modules") {
      const { size, count } = await getDirectorySize(itemPath);
      totalSize += size;
      jsFileCount += count;
    } else if (
      item.isFile() &&
      (item.name.endsWith(".js") || item.name.endsWith(".mjs"))
    ) {
      const stats = await fs.promises.stat(itemPath);
      totalSize += stats.size;
      jsFileCount++;
    }
  }

  return { size: totalSize, count: jsFileCount };
}

async function directoryContainsFile(directory: string, filename: string) {
  const items = await fs.promises.readdir(directory);
  return items.includes(filename);
}

const convertBytesToTextDescription = (bytes: number) => {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "n/a";
  const i = parseInt(String(Math.floor(Math.log(bytes) / Math.log(1024))));
  if (i === 0) return `${bytes} ${sizes[i]}`;
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

async function findTargetDirectories() {
  const currentDirectory = process.cwd();
  const items = await fs.promises.readdir(currentDirectory, {
    withFileTypes: true,
  });
  const results: {
    directory: string;
    sizeNum?: number;
    size: string;
    files: number;
  }[] = [];

  for (const item of items) {
    if (item.isDirectory() && item.name.includes("influenceio")) {
      const itemPath = path.join(currentDirectory, item.name);

      const containsTsConfig = await directoryContainsFile(
        itemPath,
        "tsconfig.json"
      );

      if (!containsTsConfig) {
        const directoryResults = await getDirectorySize(itemPath);
        const sizeText = convertBytesToTextDescription(directoryResults.size);
        results.push({
          directory: item.name,
          sizeNum: directoryResults.size,
          size: sizeText,
          files: directoryResults.count,
        });
      }
    }
  }

  results.sort((a, b) => {
    if (a.sizeNum && b.sizeNum) {
      return a.sizeNum - b.sizeNum;
    }
    return 0;
  });

  console.table(results);
}

findTargetDirectories().catch(console.error);
