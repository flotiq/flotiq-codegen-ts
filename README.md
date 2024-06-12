<a href="https://flotiq.com/">
    <img src="https://editor.flotiq.com/fonts/fq-logo.svg" alt="Flotiq logo" title="Flotiq" align="right" height="60" />
</a>


flotiq-codegen-ts
=================

This package generates Typescript Fetch API integration for your Flotiq project.

## See it in action!

![Flotiq API accessible through TypeScript](./.images/flotiq-typescript-intellisense-2.gif)

Go to this [JSFiddle](https://jsfiddle.net/o5rafnpw/1/) to see a (limited) demo.

## Quickstart

```
npx flotiq-codegen-ts generate
```

## Usage

Run `flotiq-codegen-ts`, provide your API key and wait for your Typescript code to be generated in the `flotiqApi`
folder.
Then start using it:

```javascript
import {FlotiqApi} from 'flotiqApi/src';

const FLOTIQ_RO_API_KEY = 'YOUR_API_KEY';
const flotiq = new FlotiqApi(FLOTIQ_RO_API_KEY);

// Use your IDE IntelliSense to work with types & api endpoints!

const eventList = await flotiq.EventAPI.list({limit: 100});
```

## Usage in JS project

If you wish to use `flotiqApi` in JS project you can use `flotiq-codegen-ts` with `--compiled-js` flag

```
npx flotiq-codegen-ts generate --compiled-js
```

Now set of compiled `d.ts` and `.js` will be automatically generated in your `flotiqApi` folder.
You can now import and use the API in your project:

```javascript
import {FlotiqApi} from 'flotiqApi/index';

const FLOTIQ_RO_API_KEY = 'YOUR_API_KEY';
const flotiq = new FlotiqApi(FLOTIQ_RO_API_KEY);

// Use your IDE IntelliSense to work with types & api endpoints!

const eventList = await flotiq.EventAPI.list({limit: 100});
```

## Watching for changes in your data in Flotiq

The `flotiq-codegen-ts` tool offers a feature to continuously monitor changes in the content on your Flotiq account. It
automatically regenerates the SDK whenever changes are detected, ensuring that developers always have the most
up-to-date data models in their IDE without manual intervention.

The `--watch` option for `flotiq-codegen-ts` ensures your SDK stays up-to-date by automatically monitoring and regenerating
based on content changes.

If you want to see changes made in Flotiq by your content editor in your IDE, use `flotiq-codegen-ts` with `--watch`
flag

```
npx flotiq-codegen-ts generate --watch
```

or, if you want your SDK to be directly compiled to JavaScript use `flotiq-codegen-ts` with flags  `--watch`
and `--compiled-js`

```
npx flotiq-codegen-ts generate --watch --compiled-js
```

Now, `flotiq-codegen-ts` will check for changes in your Flotiq content every 15 seconds. If changes are detected, it will
automatically regenerate your SDK to reflect the updates.

## Developing

To start developing this project, follow these steps:

1. Clone the repository `git clone git@github.com:flotiq/flotiq-codegen-ts.git`
2. Install dependencies `yarn install`
3. Run the project `yarn start`

## Collaborating

If you wish to talk with us about this project, feel free to hop on
our [![Discord Chat](https://img.shields.io/discord/682699728454025410.svg)](https://discord.gg/FwXcHnX).

If you found a bug, please report it in [issues](https://github.com/flotiq/flotiq-codegen-ts).
