#!/usr/bin/env node
const inquirer = require('inquirer');
const axios = require('axios');
const fs = require('fs');
const fce = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const yargs = require('yargs');
const admZip = require('adm-zip');
const os = require('os');
const buildToJs = require("./build_to_js");
const cleanDuplicateImport = require("./clean_duplicate_import");

const compileToJsFlag = "compiled-js";

const CLI_GREEN = "\x1b[32m%s\x1b[0m";
const CLI_BLUE = "\x1b[36m%s\x1b[0m";

const getWorkingPath = () => fs.mkdtempSync(`${os.tmpdir()}${path.sep}`);

async function lambdaInvoke(url) {

    try {
        const response = await axios.get(url, {responseType: 'arraybuffer'})
        return Buffer.from(response.data, 'base64');
    } catch (error) {
        if (error.response) {
            const decoder = new TextDecoder('utf-8')
            const errorData = JSON.parse(decoder.decode(error.response.data))

            console.error('Error fetching data: ', errorData.message);
            process.exit(1);
        } else {
            console.error('Error fetching data: unknown error');
            process.exit(1);
        }
    }
}


const argv = yargs(process.argv)
    .command("flotiq-codegen-ts generate [options]", "Generate api integration for your Flotiq project", {})
    .usage("Use flotiq-codegen-ts generates typescript Fetch API integration for your Flotiq project.")
    .option(compileToJsFlag, {
        description: "Generates Fetch API integration compiled to JavaScript",
        alias: "",
        type: "boolean",
        default: false,
        demandOption: false,
    }).help().alias("help", "h").argv;


async function confirm(msg) {
    const response = await inquirer.prompt([
        {
            name: 'confirmation',
            type: 'confirm',
            message: msg
        }
    ]);
    return response.confirmation;
}

async function main() {

    const envfiles = [
        '.env',
        '.env.local',
        '.env.development',
        'env.local',
        'env.development'
    ];
    const envName = "FLOTIQ_API_KEY";
    let apiKey = ''
    for (const file of envfiles) {
        const filepath = path.join(process.cwd(), file)

        if (fs.existsSync(filepath)) {
            dotenv.config({path: filepath})

            if (process.env[envName]) {

                query = await confirm(`${envName} found in '${file}' file. \n  Do you want to use API key from ${file}?`)
                if (query) {
                    //using API key from file
                    apiKey = process.env[envName];
                }
            }
        }
    }

    if (!apiKey) {
        const answers = await inquirer.prompt([
            {
                type: 'input',
                name: 'apiKey',
                message: 'Please enter your Flotiq API key:',
                validate: input => !!input || 'API key cannot be empty.'
            }
        ]);

        apiKey = answers.apiKey;

    }

    const compileToJs = argv[compileToJsFlag];

    try {
        console.log('Generating client from schema...');

        // Generate command
        const lambdaUrl = `https://0c8judkapg.execute-api.us-east-1.amazonaws.com/default/codegen-ts?token=${apiKey}`
        const zip = new admZip(await lambdaInvoke(lambdaUrl));
        const tmpPath = getWorkingPath();
        const outputPath = path.join(process.cwd(), 'flotiqApi');

        console.log(`Extracting SDK client to tmp dir '${tmpPath}'...`);
        zip.extractAllTo(tmpPath);
        cleanDuplicateImport(tmpPath);

        if (compileToJs) {
            console.log('Compiling to JavaScript...');
            buildToJs(tmpPath);
        }

        if (fs.existsSync(outputPath)) {
            console.log(`Found existing SDK in '${outputPath}' - cleaning up...`);
            fce.removeSync(outputPath);
        }

        console.log(`Moving SDK to '${outputPath}'...`);
        fce.moveSync(tmpPath, outputPath);
        fce.removeSync(tmpPath);

        console.log(CLI_GREEN, 'Client generated successfully!');
        console.log(CLI_GREEN, 'You can start using your Flotiq SDK');
        console.log(CLI_BLUE, 'Read more: https://github.com/flotiq/flotiq-codegen-ts');

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main();
