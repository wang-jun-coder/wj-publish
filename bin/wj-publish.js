#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const Publish = require('../lib/publish');
const packageJson = require('../package');
program.version(packageJson.version, '-v, --version');

/*
* 根据配置文件路径执行发布操作
* */
async function publishWithConfigFile(configPath) {

    configPath = path.resolve(process.cwd(), configPath);
    const stat = await promisify(fs.stat).call(fs, configPath);
    if (!stat.isFile()) {
        throw new Error('please input valid config file path');
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    console.log(`bengin publish ${config.host} ${config.remote}`);
    const pub = new Publish(config);
    await pub.publish();
    return `publish end`;
}

async function exportExampleConfig(configPath) {
    const defaultConfig = {
        "host": "192.168.1.1",
        "port": 22,
        "username": "home",
        "privateKey": "/Users/xxx/Desktop/xxx/ssh/xxx",
        "passphrase": "xxx",
        "local": "/Users/xxx/Desktop/Project/xxx",
        "remote": "/home/xxx/",
        "ignore": [
            ".idea",
            ".git",
            "node_modules"
        ],
        "clear": true,
        "cmds": [
            "ls -al"
        ]
    };

    const json = JSON.stringify(defaultConfig, null, 4);
    configPath = path.resolve(process.cwd(), configPath);
    fs.writeFileSync(configPath, json);
}

program
    .command('<configPath>', 'publish with config file')
    .action(function (configPath) {
        publishWithConfigFile(configPath).then(console.log).catch(console.error);
    })
    .command('example <configPath>')
    .action(function (configPath) {
        exportExampleConfig(configPath).then(console.log).catch(console.error);
    });
program.parse(process.argv);

