#!/usr/bin/env node
const inquirer = require('inquirer');
const {execSync} = require('child_process');
const axios = require('axios');
const fs = require('fs');
const fce = require('fs-extra');
const path = require('path');
const dotenv = require('dotenv');
const yargs = require('yargs');
const admZip = require('adm-zip')
const buildToJs = require("./build_to_js");
const cleanDuplicateImport = require("./clean_duplicate_import");

const compileToJsFlag = "compiled-js";

async function lambdaInvoke(url) {

    try {
        const response = await axios.get(url, {responseType: 'arraybuffer'})
        const decoded = Buffer.from(response.data, 'base64')
        return decoded;

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
        description: "generates Fetch API integration compiled to JS",
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

    const envfiles = ['.env', 'env.local', 'env.development'];
    const envName = "FLOTIQ_API_KEY";
    let apiKey = ''
    for (const file of envfiles) {
        const filepath = path.join(process.cwd(), file)

        if (fs.existsSync(filepath)) {
            dotenv.config({path: filepath})

            if (process.env[envName]) {

                query = await confirm(`${envName} found in env file. \n  Do you want to use API key from ${file}?`)
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
        console.log('Downloading OpenAPI schema...');

        // Generate command
        const lambdaUrl = `https://0c8judkapg.execute-api.us-east-1.amazonaws.com/default/codegen-ts?token=${apiKey}`
        var zip = new admZip(await lambdaInvoke(lambdaUrl))
        const localPath = path.join(__dirname, 'flotiqApi');
        const outputPath = path.join(process.cwd(), 'flotiqApi');
        console.log('Generating client from schema...');

        if (!compileToJs) {
            fce.removeSync('flotiqApi');
            zip.extractAllTo(outputPath);
            cleanDuplicateImport(outputPath);
            console.log('Client generated successfully!');
            return;
        }

        zip.extractAllTo(localPath)

        console.log('Compiling to javascript...');
        cleanDuplicateImport(localPath);
        buildToJs(localPath);

        console.log('Client generated successfully!');

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main();
