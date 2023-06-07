// tslint:disable:prefer-const
import * as fs from "fs";
import * as path from "path";
import { LiveEditingFile, SAMPLE_APP_FOLDER, SAMPLE_SRC_FOLDER, SAMPLE_ENVIRONMENTS_FOLDER } from "./misc/LiveEditingFile";
import { SharedAssetsFile } from "./misc/SharedAssetsFile";
import { SharedAssetsGeneratorArgs } from "./misc/SharedAssetsGeneratorArgs";
import { DevDependencyResolver } from "../services/DependencyResolver";
import { ILiveEditingOptions } from "../public";
const ANGULAR_JSON_TEMPLATE_PATH = path.join(__dirname, "../templates/angular.json.template");
const MAIN_TS_FILE_PATH = path.join(__dirname, "../templates/main.ts.template");
const APP_COMPONENT_TS_PATH = path.join(__dirname, "../templates/app.component.ts.template");
const TS_CONFIG_FILE_PATH = path.join(__dirname, "../templates/tsconfig.json.template");
const TS_APP_CONFIG_FILE_PATH = path.join(__dirname, "../templates/tsconfig.app.json.template");
const ENVIRONMENT_FILE_PATH = path.join(__dirname, "../templates/environment.ts.template");
const ENVIRONMENT_PROD_FILE_PATH = path.join(__dirname, "../templates/environment.prod.ts.template");
const STACKBLITZ_CONFIG_FILE_PATH = path.join(__dirname, "../templates/stackblitzrc.template");
const CODESANDBOX_TASKS_FILE_PATH = path.join(__dirname, "../templates/tasks.json.template");
const CODESANDBOX_DOCKER_FILE_PATH = path.join(__dirname, "../templates/Dockerfile.template");
export class SharedAssetsGenerator {

    constructor(private options: ILiveEditingOptions) {
        console.log("Live-Editing - SharedAssetsGenerator... ");
    }

    public generateSharedAssets() {
        const STYLES_FILE_PATH = path.join(process.cwd(), (this.options.projectDir ?? "") ,"src/styles.scss");
        const APP_COMPONENT_SCSS_PATH = path.join(process.cwd(), (this.options.projectDir ?? ""), "src/app/app.component.scss");
        let styles = fs.readFileSync(STYLES_FILE_PATH, "utf8");
        let appComponentScssFileContent = fs.readFileSync(APP_COMPONENT_SCSS_PATH, "utf8");
        let appComponentTsFileContnet = fs.readFileSync(APP_COMPONENT_TS_PATH, "utf8");

        let args = new SharedAssetsGeneratorArgs("styles.scss", styles, ANGULAR_JSON_TEMPLATE_PATH,
            "app.component.scss", appComponentScssFileContent,
            appComponentTsFileContnet);
        this._generateSharedAssets(args);
    }

    private _generateSharedAssets(args: SharedAssetsGeneratorArgs) {
        const INDEX_FILE_PATH = path.join(process.cwd(), (this.options.projectDir ?? ""), "src/index.html");
        const POLYPFILLS_FILE_PATH = path.join(process.cwd(), (this.options.projectDir ?? ""), "src/polyfills.ts");

        let indexFile = fs.readFileSync(INDEX_FILE_PATH, "utf8");
        let angularJsonFile = fs.readFileSync(args.angularJsonFilePath, "utf8");
        let mainTsFile = fs.readFileSync(MAIN_TS_FILE_PATH, "utf8");
        let environmentFile = fs.readFileSync(ENVIRONMENT_FILE_PATH, "utf8");
        let environmentProdFile = fs.readFileSync(ENVIRONMENT_PROD_FILE_PATH, "utf8");
        let files = new Array<LiveEditingFile>();
        let polyfillsFile = fs.readFileSync(POLYPFILLS_FILE_PATH, "utf8");
        let tsConfigFile = fs.readFileSync(TS_CONFIG_FILE_PATH, "utf8");
        let tsConfigAppFile = fs.readFileSync(TS_APP_CONFIG_FILE_PATH, "utf8");
        let stackblitzConfigFile = fs.readFileSync(STACKBLITZ_CONFIG_FILE_PATH, "utf8");
        let codesandboxTasks= fs.readFileSync(CODESANDBOX_TASKS_FILE_PATH, "utf8");
        let codesandboxDocker= fs.readFileSync(CODESANDBOX_DOCKER_FILE_PATH, "utf8");

        if(this.options.additionalSharedStyles?.length) {
            this.options.additionalSharedStyles.forEach(fileName => {
                let filePath =  path.join(process.cwd(), SAMPLE_SRC_FOLDER, fileName);
                files.push(new LiveEditingFile(SAMPLE_SRC_FOLDER + fileName, fs.readFileSync(filePath, "utf8")))
            });
        }
        if (this.options.platform === 'angular'){
            files.push(new LiveEditingFile("tsconfig.json", tsConfigFile));
            files.push(new LiveEditingFile("tsconfig.app.json", tsConfigAppFile));
            files.push(new LiveEditingFile(".stackblitzrc", stackblitzConfigFile));
            files.push(new LiveEditingFile(".codesandbox/tasks.json", codesandboxTasks));
            files.push(new LiveEditingFile(".codesandbox/Dockerfile", codesandboxDocker));
            files.push(new LiveEditingFile(SAMPLE_ENVIRONMENTS_FOLDER + "environment.ts", environmentFile));
            files.push(new LiveEditingFile(SAMPLE_ENVIRONMENTS_FOLDER + "environment.prod.ts", environmentProdFile));
        }
        files.push(new LiveEditingFile(SAMPLE_SRC_FOLDER + "index.html", indexFile));
        files.push(new LiveEditingFile(SAMPLE_SRC_FOLDER + "polyfills.ts", polyfillsFile));
        files.push(new LiveEditingFile(SAMPLE_SRC_FOLDER + args.stylesFileName, args.stylesFileContent));
        files.push(new LiveEditingFile("angular.json", angularJsonFile));
        files.push(new LiveEditingFile(SAMPLE_SRC_FOLDER + "main.ts", mainTsFile));
        files.push(new LiveEditingFile(SAMPLE_APP_FOLDER + args.appComponentStylesFileName,
             args.appComponentStylesFileContent));
        files.push(new LiveEditingFile(SAMPLE_APP_FOLDER + "app.component.ts", args.appComponentTsFileContent));
        
        let tsConfig = new LiveEditingFile("tsconfig.json", tsConfigFile);
        let sharedFile = new SharedAssetsFile(files, new DevDependencyResolver().devDependencies, tsConfig);
        fs.writeFileSync(this.options.samplesDir + "shared.json", JSON.stringify(sharedFile));
    }
}
