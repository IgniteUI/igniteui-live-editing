import { LiveEditingManager } from "../LiveEditingManager";
import { IOptions } from "./misc/LiveEditingFile";
import * as path from 'path';
import { TsRoutingPathService } from "../services/TsRoutingPathService";
export const SAMPLE_SRC_FOLDER = "src/";
export const SAMPLE_APP_FOLDER = "src/app/";

export abstract class Generator {
    protected componentPaths;

    constructor(protected options?: IOptions, private routingService?: TsRoutingPathService) {
        this.componentPaths = this.routingService?.componentPaths;
    }

    protected getAssetsSamplesDir() {
        return this.options.samplesDir;
    }

    protected getConfigGenerators() {
       return import(path.join(process.cwd(), this.options.configGeneratorPath));
    }

    protected getConfigGeneratorsFileName() {
        return path.basename(this.options.configGeneratorPath);
    }

    protected getModuleRoutes() {
        return this.routingService.appRouting.get(this.options.module.moduleName);
    }
}
