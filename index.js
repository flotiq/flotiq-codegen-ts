#!/usr/bin/env node
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadSchema(url) {
    const response = await axios.get(url);
   // console.log(response.data);
    return JSON.stringify(response.data);
}

async function modifySchema(schema) {
    // Example: Replace a string in the schema
    const schema1 = schema + "";
    return schema1.replace(/Content: /g, '');
}

async function saveSchemaToFile(schema, filename) {
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, schema);
    return filePath;
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
    const schemaUrl = `https://api.flotiq.com/api/v1/open-api-schema.json?user_only=1&hydrate=1&auth_token=${apiKey}`;
    
    try {
        console.log('Downloading OpenAPI schema...');
        const schema = await downloadSchema(schemaUrl);
        const modifiedSchema = await modifySchema(schema);
        const schemaFile = await saveSchemaToFile(modifiedSchema, 'schema.json');
        // Correctly resolving the path to cfg.json
        const configPath = path.join(__dirname, 'cfg.json');
        const outputPath = path.join(process.cwd(), 'flotiqApi');
        // Generate command
        // const command = `openapi-generator-cli generate -i ${schemaFile} -g typescript-fetch --additional-properties=apiKey=${apiKey} -o ./generated-api`;
        const genCommand = `openapi-generator-cli --openapitools ${configPath} generate`
        const mvCommand = `mv ${__dirname}/flotiqApi ${outputPath}`;
        const cleanCommand = `${__dirname}/clean_duplicate_import.sh`;

        console.log('Generating client from schema...');
        execSync(genCommand, { stdio: 'ignore', cwd: __dirname});
        execSync(mvCommand, { stdio: 'ignore', cwd: __dirname});
        execSync(cleanCommand, { stdio: 'ignore', cwd: $outputPath});
        
        console.log('Client generated successfully!');
    } catch (error) {
        console.error('An error occurred:', error);
        process.exit(1);
    }
}

main();
