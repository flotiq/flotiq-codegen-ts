<a href="https://flotiq.com/">
    <img src="https://editor.flotiq.com/fonts/fq-logo.svg" alt="Flotiq logo" title="Flotiq" align="right" height="60" />
</a>


flotiq-codegen-ts
=================

This package generates Typescript Fetch API integration for your Flotiq project.


## See it in action!

![Flotiq API accessible through TypeScript](./.images/flotiq-typescript-intellisense.gif)

Go to this [JSFiddle](https://jsfiddle.net/o5rafnpw/1/) to see a (limited) demo.

## Quickstart

```
npx flotiq-codegen-ts generate
```

## Usage

Run `flotiq-codegen-ts`, provide your API key and wait for your Typescript code to be generated in the `flotiqApi` folder.
Then start using it:

```
import { FlotiqApi } from 'flotiqApi/src';
const FLOTIQ_RO_API_KEY = 'YOUR_API_KEY';
const flotiq = new FlotiqApi(FLOTIQ_RO_API_KEY);
  
// Use your IDE IntelliSense to work with types & api endpoints!

const eventList = await flotiq.Event.list({limit:100});
```

## Generating declarations

To generate a set of `d.ts` files for Typescript follow these steps:

1. Execute `npx flotiq-codegen-ts generate` as usual
2. Go to `./flotiqApi` directory
3. Execute `npm run build`

This will render the declarations in the `flotiqApi/dist` folder.

## Collaborating

If you wish to talk with us about this project, feel free to hop on our [![Discord Chat](https://img.shields.io/discord/682699728454025410.svg)](https://discord.gg/FwXcHnX).

If you found a bug, please report it in [issues](https://github.com/flotiq/flotiq-codegen-ts).
