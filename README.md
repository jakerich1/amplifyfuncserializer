# AmplifyFuncSerializer

This project contains multiple independent Node.js scripts for managing and serializing backend configurations. It includes tools for setting function dependencies dynamically based on specified attributes and serialization percentages.

## Installation

Make sure Node.js is installed on your machine. Follow these steps to set up and run the scripts in this project.

### Prerequisites

- Node.js (v12.0.0 or higher recommended)
- npm (usually comes with Node.js)

### Setup

1. Clone the repository or download the source code.
2. Navigate to the directory containing the project.
3. Run `npm install` to install the required dependencies.
4. Execute `npm run build` to compile TypeScript files and minify the scripts.
5. Execute `npm link` to make the scripts available globally.

## Usage

This package includes several scripts that can be run from the command line. Here are the main scripts and how to execute them:

### Running the `depend` Script

The `depend` script updates function dependencies in a configuration file based on provided serialization percentages and attributes. Please run this command from the directory containing the backend-config.json file. Once complete it will have generate a new file called `updated-backend-config.json`. This json file contains a new `function` object with the updated dependencies. Simply replace the old `function` object with the new one in the `backend-config.json` file. 

#### How to Run

```bash
npx run depend --serialization [percentage] --attribute [attributeName]
```

#### Options

- `--serialization`: Sets the percentage of functions that should have dependencies serialized. Must be a number between 0 and 100. The default is 100 if not specified.

- `--attribute`: Specifies the attribute used when adding dependencies. The default is "Name" if not specified.