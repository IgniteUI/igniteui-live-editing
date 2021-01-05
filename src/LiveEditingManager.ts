import * as fs from "fs";
// tslint:disable-next-line: no-implicit-dependencies
import * as fsExtra from "fs-extra";
import * as path from "path";

import { IOptions } from "./generators/misc/LiveEditingFile";
import { MetaData } from "./generators/misc/MetaData";
import { SampleAssetsGenerator } from "./generators/SampleAssetsGenerator";
import { SharedAssetsGenerator } from "./generators/SharedAssetsGenerator";
import { TsRoutingPathService } from "./services/TsRoutingPathService";


export class LiveEditingManager {
    private routingPathService: TsRoutingPathService;

    constructor(public options: IOptions, private baseDir = process.cwd()) {
    
        this.options.samplesDir = path.join(this.baseDir, this.options.samplesDir + "/samples/");
        this.routingPathService = new TsRoutingPathService(this.baseDir, this.options.module.routerPath);
        this.routingPathService.generateRouting();
    }

    public async run() {
        fsExtra.removeSync(this.options.samplesDir);
        fs.mkdirSync(this.options.samplesDir);
        await this.generate();
    }

    private async generate() {

        const logInfo = "Sass syntax";

        console.log("-----------------------------------------------------");
        console.log("Live-Editing - with " + logInfo);

        new SampleAssetsGenerator(this.options, this.routingPathService).generateSamplesAssets()
        .then(console.log)
        .then(() => this.generateMetada())
        .then(() => {
            console.log("-----------------------------------------------------");
            console.log("Live-Editing - output folder: " + this.options.samplesDir);
        })
        .catch(e => { throw new Error(e)});
        new SharedAssetsGenerator(this.options).generateSharedAssets();
    }

    private generateMetada() {
        let metadata = new MetaData();
        fs.writeFileSync(this.options.samplesDir + "/meta.json", JSON.stringify(metadata));
    }
}
