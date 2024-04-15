#!/usr/bin/env node
import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import type { Functions } from "../types/backend-function";

interface Args {
  serialization: number;
  attribute: string;
}

const argv = yargs(hideBin(process.argv))
  .option("serialization", {
    describe: "Set the percentage for function serialization",
    type: "number",
    default: 100,
  })
  .option("attribute", {
    describe: "Set the attribute used in dependencies",
    type: "string",
    default: "Name",
  })
  .check((argv) => {
    if (argv.serialization < 0 || argv.serialization > 100) {
      throw new Error("Serialization must be a number between 0 and 100.");
    }
    return true;
  })
  .parseSync() as Args;

const findConfigFile = async () => {
  const fileName = "backend-config.json";
  const currentDir = process.cwd();
  const filePath = path.join(currentDir, fileName);
  const percent = argv.serialization;

  console.log("serialization percentage:", percent);

  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    console.log("Found:", fileName);
    await processFunctions(filePath, percent);
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", "Error: File not found:", fileName);
  }
};

const processFunctions = async (
  filePath: string,
  serializationPercentage: number
) => {
  try {
    const data = await fs.promises.readFile(filePath, "utf8");
    const json = JSON.parse(data);
    if (!json.function) {
      throw new Error('The "function" property is missing in the JSON file.');
    }
    const functions: Functions = json.function;
    const updatedFunctions = createFunctionalDependencies(
      functions,
      serializationPercentage
    );

    console.log("First function", findFirstFunction(updatedFunctions));
    console.log("Last function", findLastFunctionInChain(updatedFunctions));

    const newFilePath = path.join(
      path.dirname(filePath),
      "updated-backend-config.json"
    );
    await fs.promises.writeFile(
      newFilePath,
      JSON.stringify({ function: updatedFunctions }, null, 2)
    );
    console.log("Updated functions written to:", newFilePath);
  } catch (err) {
    if (err instanceof Error) {
      console.error("\x1b[31m%s\x1b[0m", "Error:", err.message);
    } else {
      console.error(
        "\x1b[31m%s\x1b[0m",
        "Error parsing JSON in file:",
        filePath
      );
    }
  }
};

const createFunctionalDependencies = (
  functions: Functions,
  percent: number
): Functions => {
  const keys = Object.keys(functions);
  const updatedFunctions = { ...functions };
  const usedDependencies = new Set<string>();

  let dependencyFreeFunctions = keys.filter(
    (key) =>
      !functions[key].dependsOn ||
      functions[key].dependsOn.every((dep) => dep.category !== "function")
  );

  const currentPercentage =
    ((keys.length - dependencyFreeFunctions.length) / keys.length) * 100;

  const totalToSerialize =
    Math.ceil(keys.length * (percent / 100)) -
    (keys.length - dependencyFreeFunctions.length);

  console.log("Total functions:", keys.length);
  console.log("Dependency-free functions:", dependencyFreeFunctions.length);
  console.log("Current serialization percentage:", currentPercentage);
  console.log("Target serialization percentage:", percent);
  console.log(
    "Number of functions to serialize for target:",
    Math.ceil(keys.length * (percent / 100)) -
      (keys.length - dependencyFreeFunctions.length)
  );

  for (const key of keys) {
    const functionConfig = functions[key];
    if (
      !functionConfig.dependsOn ||
      functionConfig.dependsOn.every((dep) => dep.category !== "function")
    ) {
      const possibleDependencies = dependencyFreeFunctions.filter(
        (k) => k !== key && !usedDependencies.has(k)
      );

      if (possibleDependencies.length > 0) {
        const selectedDependency = possibleDependencies[0];
        functionConfig.dependsOn = functionConfig.dependsOn || [];
        functionConfig.dependsOn.push({
          attributes: [argv.attribute],
          category: "function",
          resourceName: selectedDependency,
        });
        if (usedDependencies.size === 0) {
          usedDependencies.add(key);
        }

        if (usedDependencies.size === totalToSerialize) {
          break;
        }

        usedDependencies.add(selectedDependency);
        dependencyFreeFunctions = dependencyFreeFunctions.filter(
          (dep) => dep !== selectedDependency
        );
      }
    }
  }

  const circularPath = checkForCircularDependencies(updatedFunctions);
  if (circularPath) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "Circular dependency detected among the following functions:",
      circularPath.join(" -> ")
    );
    throw new Error("Circular dependency detected!");
  }

  return updatedFunctions;
};

const checkForCircularDependencies = (
  functions: Functions
): string[] | null => {
  const dependenciesMap = new Map<string, string[]>();
  for (const [key, value] of Object.entries(functions)) {
    dependenciesMap.set(
      key,
      value.dependsOn
        ?.filter((dep) => dep.category === "function")
        .map((dep) => dep.resourceName) || []
    );
  }

  const visited = new Map<string, string>();
  const stack = new Map<string, string>();

  const visit = (func: string, path: string[]): string[] | null => {
    if (stack.has(func)) {
      return [...path, func];
    }
    if (visited.has(func)) {
      return null;
    }

    visited.set(func, func);
    stack.set(func, func);
    const neighbors = dependenciesMap.get(func);
    if (neighbors) {
      for (const neighbor of neighbors) {
        const result = visit(neighbor, [...path, func]);
        if (result) return result;
      }
    }
    stack.delete(func);
    return null;
  };

  for (const key of Object.keys(functions)) {
    const result = visit(key, []);
    if (result) {
      return result;
    }
  }
  return null;
};

const findFirstFunction = (functions: Functions): string => {
  for (const key of Object.keys(functions)) {
    if (!functions[key].dependsOn) {
      return key;
    }
  }
  throw new Error("No function without dependencies found.");
};

const findLastFunctionInChain = (functions: Functions): string => {
  const dependenciesMap = new Map<string, string[]>();
  for (const [key, value] of Object.entries(functions)) {
    dependenciesMap.set(
      key,
      value.dependsOn
        ?.filter((dep) => dep.category === "function")
        .map((dep) => dep.resourceName) || []
    );
  }

  const visited = new Map<string, string>();
  const stack = new Map<string, string>();

  const visit = (func: string): string | null => {
    if (stack.has(func)) {
      return func;
    }
    if (visited.has(func)) {
      return null;
    }

    visited.set(func, func);
    stack.set(func, func);
    const neighbors = dependenciesMap.get(func);
    if (neighbors) {
      for (const neighbor of neighbors) {
        const result = visit(neighbor);
        if (result) return result;
      }
    }
    stack.delete(func);
    return null;
  };

  for (const key of Object.keys(functions)) {
    const result = visit(key);
    if (result) {
      return result;
    }
  }
  throw new Error("No function without dependencies found.");
};

findConfigFile();
