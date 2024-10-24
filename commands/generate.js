const inquirer = require('inquirer');
const buildToJs = require("../src/build_to_js");
const cleanDuplicateImport = require("../src/clean_duplicate_import");
const fs = require('fs');
const fce = require('fs-extra');
const {checkForChanges, getWorkingPath, lambdaInvoke, loader}  = require("../src/helpers");
const admZip = require('adm-zip');
const path = require('path');

const compileToJsFlag = "compiled-js";
const watchFlag = "watch";
const watchInterval = 10000;

const CLI_GREEN = "\x1b[32m%s\x1b[0m";
const CLI_BLUE = "\x1b[36m%s\x1b[0m";

async function generateSDK(apiKey, compileToJs) {
    try {
        console.log('Generating client from schema...');

        // Generate command
        const lambdaUrl = `https://0c8judkapg.execute-api.us-east-1.amazonaws.com/default/codegen-ts?token=${apiKey}`;
        const zip = new admZip(await lambdaInvoke(lambdaUrl));
        const tmpPath = getWorkingPath();
        const tmpSDKPath = `${tmpPath}/flotiqApi`;
        const outputPath = path.join(process.cwd(), 'flotiqApi');

        console.log(`Extracting SDK client to tmp dir '${tmpPath}'...`);
        zip.extractAllTo(tmpSDKPath);
        cleanDuplicateImport(tmpSDKPath);

        if (compileToJs) {
            console.log('Compiling to JavaScript...');
            buildToJs(tmpSDKPath);
        }

        if (fs.existsSync(outputPath)) {
            console.log(`Found existing SDK in '${outputPath}' - cleaning up...`);
            fce.removeSync(outputPath);
        }

        console.log(`Moving SDK to '${outputPath}'...`);
        fce.moveSync(tmpSDKPath, outputPath);
        fce.removeSync(tmpPath);

        console.log(CLI_GREEN, 'Client generated successfully!');
        console.log(CLI_GREEN, 'You can start using your Flotiq SDK');
        console.log(CLI_BLUE, 'Read more: https://github.com/flotiq/flotiq-codegen-ts');

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

async function watchChanges(apiKey, compileToJs) {
    const configFile = path.join(__dirname, '/src/codegen-ts-watch-config.json');
    const data = await checkForChanges(apiKey);
    if (!fce.existsSync(configFile)) {
        fce.createFileSync(configFile);
        fce.writeJsonSync(configFile, data);
    }

    const configData = fce.readJsonSync(configFile);

    if (JSON.stringify(data) === JSON.stringify(configData)) {
        return;
    }

    loader.stop();
    loader.succeed('Detected changes in content!')
    console.log(CLI_GREEN, 'Detected changes in content!');

    fce.writeJsonSync(configFile, data);
    await generateSDK(apiKey, compileToJs);
    loader.start();
}

async function main(argv) {
    const envfiles = ['.env', '.env.local', '.env.development', 'env.local', 'env.development'];
    const envName = "FLOTIQ_API_KEY";
    let apiKey = ''
    for (const file of envfiles) {
        const filepath = path.join(process.cwd(), file)

        if (fs.existsSync(filepath)) {
            dotenv.config({path: filepath})

            if (process.env[envName]) {

                let query = confirm(`${envName} found in '${file}' file. \n  Do you want to use API key from ${file}?`)
                if (query) {
                    //using API key from file
                    apiKey = process.env[envName];
                    break;
                }
            }
        }
    }

    if (!apiKey) {
        const answers = await inquirer.prompt([{
            type: 'input',
            name: 'apiKey',
            message: 'Please enter your Flotiq API key:',
            validate: input => !!input || 'API key cannot be empty.'
        }]);

        apiKey = answers.apiKey;

    }

    const compileToJs = argv[compileToJsFlag];
    const watch = argv[watchFlag];

    if (!watch) {
        await generateSDK(apiKey, compileToJs);
        return;
    }

    loader.start();
    await watchChanges(apiKey, compileToJs);
    setInterval(
        await watchChanges,
        watchInterval,
        apiKey,
        compileToJs
    );
}

module.exports = {
    command: 'generate [options]',
    describe: 'Generate api integration for your Flotiq project',
    builder: (yargs) => {
        return yargs
            .option(watchFlag, {
                description: "Listen for changes in Flotiq Api Schema, and regenerate SDK after detected change",
                alias: "",
                type: "boolean",
                default: false,
                demandOption: false,
            })
            .option(compileToJsFlag, {
                description: "Generates Fetch API integration compiled to JavaScript",
                alias: "",
                type: "boolean",
                default: false,
                demandOption: false,
            });
    },
    handler: main,
    generateSDK
}
