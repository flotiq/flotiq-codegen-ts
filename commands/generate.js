const inquirer = require('inquirer');
const buildToJs = require("../src/build_to_js");
const cleanDuplicateImport = require("../src/clean_duplicate_import");
const fs = require('fs');
const fce = require('fs-extra');
const {checkForChanges, getWorkingPath, lambdaInvoke, loader, confirm} = require("../src/helpers");
const admZip = require('adm-zip');
const path = require('path');
const dotenvFlow = require('dotenv-flow');

const envName = "FLOTIQ_API_KEY";

const compileToJsFlag = "compiled-js";
const apiKeyFlag = "flotiq-api-key";
const watchFlag = "watch";
const silentFlag = "silent";
const watchInterval = 10000;

const CLI_GREEN = "\x1b[32m%s\x1b[0m";
const CLI_BLUE = "\x1b[36m%s\x1b[0m";

const LAMBDA_URL = `https://0c8judkapg.execute-api.us-east-1.amazonaws.com/default/codegen-ts`;

async function generateSDK(apiKey, compileToJs, logger) {
    try {
        logger.log('Generating client from schema...');

        // Generate command
        const lambdaUrl = `${LAMBDA_URL}?token=${apiKey}`;
        const zip = new admZip(await lambdaInvoke(lambdaUrl, logger));
        const tmpPath = getWorkingPath();
        const tmpSDKPath = `${tmpPath}/flotiqApi`;
        const outputPath = path.join(process.cwd(), 'flotiqApi');

        logger.log(`Extracting SDK client to tmp dir '${tmpPath}'...`);
        zip.extractAllTo(tmpSDKPath);
        cleanDuplicateImport(tmpSDKPath);

        if (compileToJs) {
            logger.log('Compiling to JavaScript...');
            buildToJs(tmpSDKPath, logger);
        }

        if (fs.existsSync(outputPath)) {
            logger.log(`Found existing SDK in '${outputPath}' - cleaning up...`);
            fce.removeSync(outputPath);
        }

        logger.log(`Moving SDK to '${outputPath}'...`);
        fce.moveSync(tmpSDKPath, outputPath);
        fce.removeSync(tmpPath);

        logger.log(CLI_GREEN, 'Client generated successfully!');
        logger.log(CLI_GREEN, 'You can start using your Flotiq SDK');
        logger.log(CLI_BLUE, 'Read more: https://github.com/flotiq/flotiq-codegen-ts');

    } catch (error) {
        logger.error('An error occurred:', error);
        process.exit(1);
    }
}

async function watchChanges(apiKey, compileToJs, logger) {
    const configFile = path.join(__dirname, '../src/codegen-ts-watch-config.json');
    const data = await checkForChanges(apiKey, logger);
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
    logger.log(CLI_GREEN, 'Detected changes in content!');

    fce.writeJsonSync(configFile, data);
    await generateSDK(apiKey, compileToJs, logger);
    loader.start();
}

const silentLogger = {
    log: () => { },
    error: () => { },
    warn: () => { },
    info: () => { },
    debug: () => { },
};

/**
 * Run generation command
 * @param {{flotiqApiKey: string, watch: boolean, silent: boolean, compiledJs: boolean}} argv
 * @returns 
 */
async function main(argv) {
    let apiKey = argv.flotiqApiKey || process.env[envName];
    const silent = argv.silent;
    const logger = silent ? silentLogger : console;
    const compileToJs = argv.compiledJs;
    const watch = argv.watch;

    if (!apiKey && !silent) {
        const localEnv = dotenvFlow.parse(
            dotenvFlow.listFiles({
                path: process.cwd(),
            })
        );

        if (localEnv[envName]) {
            let query = await confirm(`${envName} found \n  Do you want to use API key from env file ?`)
            if (query) {
                //using API key from file
                apiKey = localEnv[envName];
            }
        }
    }

    if(!apiKey && !silent) {
        const answers = await inquirer.prompt([{
            type: 'input',
            name: 'apiKey',
            message: 'Please enter your Flotiq API key:',
            validate: input => !!input || 'API key cannot be empty.'
        }]);

        apiKey = answers.apiKey;
    }

    

    if (!watch) {
        await generateSDK(apiKey, compileToJs, logger);
        return;
    }

    loader.start();
    await watchChanges(apiKey, compileToJs, logger);
    setInterval(
        () => watchChanges(apiKey, compileToJs, logger),
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
            .option(apiKeyFlag, {
                description: "Flotiq API key",
                alias: "",
                type: "string",
                default: "",
                demandOption: false,
            })
            .option(watchFlag, {
                description: "Listen for changes in Flotiq Api Schema, and regenerate SDK after detected change",
                alias: "w",
                type: "boolean",
                default: false,
                demandOption: false,
            })
            .option(silentFlag, {
                description: "Suppress console output. Assumes no for all prompts.",
                alias: "s",
                type: "boolean",
                default: false,
                demandOption: false,
            })
            .option(compileToJsFlag, {
                description: "Generates Fetch API integration compiled to JavaScript",
                alias: "c",
                type: "boolean",
                default: false,
                demandOption: false,
            });
    },
    handler: main,
    generateSDK
}
