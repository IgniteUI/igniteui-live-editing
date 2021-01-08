import * as fs from "fs";
import * as fsExtra from 'fs-extra';
// tslint:disable-next-line: no-implicit-dependencies
import * as path from "path";

import { MetaData } from "./generators/misc/MetaData";
import { SampleAssetsGenerator } from "./generators/SampleAssetsGenerator";
import { SharedAssetsGenerator } from "./generators/SharedAssetsGenerator";
import { ILiveEditingOptions } from "./public";
import { TsRoutingPathService } from "./services/TsRoutingPathService";


export async function generateLiveEditing(options: ILiveEditingOptions, baseDir = process.cwd()) {
    let routingPathService = new TsRoutingPathService(baseDir, options.module.routerPath);

    options.samplesDir = path.join(baseDir, options.samplesDir + "/samples/");

    if(fs.existsSync(options.samplesDir)) fsExtra.removeSync(options.samplesDir);
    fs.mkdirSync(options.samplesDir);

    routingPathService.generateRouting();

    console.log("-----------------------------------------------------");
    console.log("Starting Live-Editing Generation - for " + baseDir);
    
    
    new SampleAssetsGenerator(options).generateSamplesAssets()
    .then(console.log)
    .then(() => {
        let metadata = new MetaData();
        fs.writeFileSync(options.samplesDir + "/meta.json", JSON.stringify(metadata));
    })
    .then(() => {
        console.log("-----------------------------------------------------");
        console.log("Live-Editing - output folder: " + options.samplesDir);
    })
    .catch(e => { throw new Error(e)});

    new SharedAssetsGenerator(options.samplesDir).generateSharedAssets();
}