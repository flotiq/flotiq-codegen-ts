const fce = require('fs-extra');
const {execSync} = require('child_process');

/**
 * Move raw TypeScript code to tmp _copy dir
 * Run compilation
 * Move back compiled files to standard flotiqApi dir
 * @param tmpSDKPath
 */
const buildToJs = (tmpSDKPath) => {
    const sdkCopyPath = tmpSDKPath.replace('flotiqApi', 'flotiqApi_copy');
    fce.moveSync(tmpSDKPath, sdkCopyPath);
    execSync('npm install', {cwd: sdkCopyPath}, (err, stdout) => {
        if(err) {
            return console.error(err.message);
        }
    });
    execSync(`npm run build`, {stdio: 'inherit', cwd: sdkCopyPath});
    // Move main files (dist, package.json, README.nd) to the result dir
    // Don't move typescript sources to the result dir
    fce.moveSync(`${sdkCopyPath}/dist`, `${tmpSDKPath}/dist`, {overwrite: true});
    fce.moveSync(`${sdkCopyPath}/package.json`, `${tmpSDKPath}/package.json`, {overwrite: true});
    fce.moveSync(`${sdkCopyPath}/README.md`, `${tmpSDKPath}/README.md`, {overwrite: true});
}

module.exports = buildToJs;
