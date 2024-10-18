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
    execSync(`npm run build`, {stdio: 'inherit'});
    fce.moveSync(`${sdkCopyPath}/dist/`, `${tmpSDKPath}`, {overwrite: true});
}

module.exports = buildToJs;
