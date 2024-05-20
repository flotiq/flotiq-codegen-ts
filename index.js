#!/usr/bin/env node
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const admZip = require('adm-zip')

const compileToJsFlag = "compiled-js";

async function lambdaInvoke(url) {

    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' })
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



const getMoveCommand = (outputPath, buildToJs = false) => {
    const path = buildToJs ? 'flotiqApiBuildJs' : 'flotiqApi';
    const clearDestination = `rm -fr ${outputPath}`;
    const command = `mv ${__dirname}/${path} ${outputPath}`;

    execSync(clearDestination, {stdio: 'ignore', cwd: __dirname});
    execSync(command, {stdio: 'ignore', cwd: __dirname});
}

const getCleanUpCommand = (outputPath = null) => {
    const cleanCommand = `${__dirname}/clean_duplicate_import.sh`;

    execSync(cleanCommand, {stdio: 'ignore', cwd: !outputPath ? path.join(__dirname, 'flotiqApi') : outputPath});
}

async function main() {
    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'apiKey',
            message: 'Please enter your Flotiq API key:',
            validate: input => !!input || 'API key cannot be empty.'
        }
    ]);

    const { apiKey } = answers;
    const compileToJs = argv[compileToJsFlag];

    try {
        console.log('Downloading OpenAPI schema...');

        // Generate command
        const lambdaUrl = `https://0c8judkapg.execute-api.us-east-1.amazonaws.com/default/codegen-ts?token=${apiKey}`
        var zip = new admZip(await lambdaInvoke(lambdaUrl))
        const localPath = path.join(__dirname, 'flotiqApi');
        const outputPath = path.join(process.cwd(), 'flotiqApi');
        console.log('Generating client from schema...');

        if(!compileToJs){
            zip.extractAllTo(outputPath);
            getCleanUpCommand(outputPath);
            console.log('Client generated successfully!');
            return;
        }

        zip.extractAllTo(localPath)

        // compile api to js command
        const buildJsCommand = `sh build_to_js.sh`;

        console.log('Compiling to javascript...');
        getCleanUpCommand();

        execSync(buildJsCommand, {stdio: 'ignore', cwd: __dirname});
        getMoveCommand(outputPath, true);

        console.log('Client generated successfully!');

    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}
main();
