#!/usr/bin/env node

import fs from 'fs'
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm'
import * as path from "path";
import minimist from "minimist";

const argv = minimist(process.argv.slice(2));
const env = !argv.env ? '' : argv.env

console.info(`Fetching AWS configuration from SSM store for env [${env}] ...`)
await fetchAwsConfig(env)

/**
 * Read AWS region from sst.json configuration file and load account level SSM config.
 */
 async function fetchAwsConfig (env) {
    try {
        const sstConfig = fs.readFileSync(path.normalize('../sst.json')).toJSON()

        const ssmClient = new SSMClient({ region: sstConfig.region})
        const accountConfig = (await ssmClient.send(
            new GetParameterCommand({ Name: '/account/stacks-config' }))
        ).Parameter.Value

        const accountConfigJSON = JSON.parse(accountConfig)
        accountConfigJSON.redirectSignIn = env === 'dev' ? 'https://dev.stokilo.com' : env === 'prod' ? 'https://stokilo.com' : 'http://localhost:8080/'
        accountConfigJSON.redirectSignOut =  env === 'dev' ? 'https://dev.stokilo.com' : env === 'prod' ? 'https://stokilo.com' : 'http://localhost:8080/'

        const accountConfigPretty = JSON.stringify(JSON.parse(JSON.stringify(accountConfigJSON)), null, 4)
        fs.writeFileSync(path.join('src', 'aws-config.json'), accountConfigPretty)

    } catch (e) {
        console.info('SST stack must be deployed and sst.json present in the root of the project.');
        console.info('AWS credentials must be present or SSO session active.');
        console.error(e)
        process.exit(1)
    }
}

