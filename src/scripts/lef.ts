#!/usr/bin/env node
import * as fs from "fs/promises";
import * as path from "path";

interface Result {
  fileName: string;
  count: number;
}

const results: Result[] = [];

const findTemplates = async (currentPath: string) => {
  try {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await findTemplates(fullPath); // Recursively search in directories
      } else if (
        entry.name.endsWith("cloudformation-template.json") ||
        entry.name.endsWith("awscloudformation-template.json")
      ) {
        await analyzeTemplate(fullPath, entry.name); // Analyze the template file
      }
    }
  } catch (err) {
    console.error("Error reading directory:", currentPath, err);
  }
};

const analyzeTemplate = async (filePath: string, fileName: string) => {
  try {
    const data = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(data);
    if (json.Resources) {
      const resourceKeys = Object.keys(json.Resources);
      const count = resourceKeys.filter(
        (key) => json.Resources[key].Type === "AWS::Lambda::EventSourceMapping"
      ).length;

      const baseFileName = fileName
        .replace("-cloudformation-template.json", "")
        .replace("-awscloudformation-template.json", "");

      results.push({ fileName: baseFileName, count: count });
    }
  } catch (err) {
    console.error("Error analyzing file:", filePath, err);
  }
};

const run = async () => {
  const currentDir = process.cwd();
  await findTemplates(currentDir);
  results.sort((a, b) => b.count - a.count);

  console.table(results, ["fileName", "count"]);
};

run().catch(console.error);
