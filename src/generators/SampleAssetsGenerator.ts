// tslint:disable:prefer-for-of
// tslint:disable:prefer-const
import * as fs from "fs";
import * as path from "path";
import { DependencyResolver } from "./../services/DependencyResolver";
import { Generator, SAMPLE_APP_FOLDER, SAMPLE_SRC_FOLDER } from "./Generator";

import { IOptions, LiveEditingFile } from "./misc/LiveEditingFile";
import { SampleDefinitionFile } from "./misc/SampleDefinitionFile";
import { TsImportsService } from "../services/TsImportsService";
import { IConfigGenerator } from "./public/IConfigGenerator";
import { Config } from "./public/Config";
import { TsRoutingPathService } from "../services/TsRoutingPathService";

const BASE_PATH = path.join(__dirname, "../../");
const APP_MODULE_TEMPLATE_PATH = path.join(__dirname, "../templates/app.module.ts.template");

const COMPONENT_STYLE_FILE_EXTENSION = "scss";
const COMPONENT_FILE_EXTENSIONS = ["ts", "html", COMPONENT_STYLE_FILE_EXTENSION];

export class SampleAssetsGenerator extends Generator {
    private _dependencyResolver: DependencyResolver;
    private _componentRoutes: Map<string, string>;
    private _generatedSamples: Map<string, string>;
    private _logsEnabled: boolean;
    private _logsSampleFiles: number;
    private _logsCountConfigs: number;
    private _logsUtilitiesFiles: number;
    private _tsImportsService: TsImportsService;

    constructor(options: IOptions, routingService: TsRoutingPathService) {
        super(options, routingService);
        this._tsImportsService = new TsImportsService();

        this._logsEnabled = false;
        this._logsSampleFiles = 0;
        this._logsCountConfigs = 0;
        this._logsUtilitiesFiles = 0;
        console.log("Live-Editing - SampleAssetsGenerator... ");

        this._dependencyResolver = new DependencyResolver();

        this._componentRoutes = new Map<string, string>();
        this._generatedSamples = new Map<string, string>();
        this._generateRoutes();
    }

    public async generateSamplesAssets() {
        let currentFileImports = this._tsImportsService.getFileImports(this.options.configGeneratorPath);

        console.log("Live-Editing - generating component samples...");

       this.getConfigGenerators().then(m => {
            const GENERATORS = m[Object.keys(m)[0]];

            for (let i = 0; i < GENERATORS.length; i++) {
                let generatorType = GENERATORS[i];
                let generatorName = generatorType.name;
                let generatorPath = path.join(path.join(process.cwd(), path.dirname(this.options.configGeneratorPath)),
                    currentFileImports.get(generatorName) + ".ts");
                let generatorImports = this._tsImportsService.getFileImports(generatorPath);
                let generator = new GENERATORS[i]() as IConfigGenerator;
                let generatorConfigs = generator.generateConfigs();

                const generatorCount = generatorConfigs.length;
                const generatorInfo = generatorName.replace("ConfigGenerator", "");

                this._logsCountConfigs++;
                for (let j = 0; j < generatorConfigs.length; j++) {
                    this._generateSampleAssets(generatorConfigs[j], generatorImports, generator?.additionalImports);
                }

                console.log("Live-Editing - generated " + generatorCount + " samples for " + generatorInfo);
            }
        });
        const fileCount = this._logsSampleFiles + this._logsUtilitiesFiles;
        return "Live-Editing - generated " + fileCount + " files for " + this._logsCountConfigs + " components";
    }

    private _generateRoutes() {
        console.log("Live-Editing - generating component routes...");

        const moduleRoutes = this.getModuleRoutes();
        for (let i = 0; i < moduleRoutes.length; i++) {
            let moduleName = moduleRoutes[i].module;
            let modulePath = moduleRoutes[i].path;
            if (this._logsEnabled) {
                let moduleStat = moduleRoutes[i].routes.length + " routes";
                let moduleInfo = moduleName.replace("Module", " module");
                console.log("Live-Editing - generated " + moduleStat + " for " + moduleInfo);
            }
            for (let j = 0; j < moduleRoutes[i].routes.length; j++) {
                let componentRoute = moduleRoutes[i].routes[j];
                let routePath = modulePath;
                if (componentRoute.route) {
                    routePath += "/" + componentRoute.route;
                }
                this._componentRoutes.set(componentRoute.component, routePath);
            }
        }
    }

    private _generateSampleAssets(config: Config, configImports: Map<string, string>, configAdditionalImports?) {
        let sampleFiles = this._getComponentFiles(config);
        let sampleFilesCount = sampleFiles.length;
        let componentTsContent;
        let componentTsName;
        for (let i = 0; i < sampleFiles.length; i++) {
            if (sampleFiles[i].path.indexOf(".ts") !== -1) {
                componentTsContent = sampleFiles[i].content;
                componentTsName = this._getFileName(sampleFiles[i].path).replace(".component", "");
                componentTsName = componentTsName.replace(".ts", "");
                break;
            }
        }
        let additionalFiles: LiveEditingFile[] = [];
        if (config.additionalFiles !== undefined && config.additionalFiles.length > 0) {
            additionalFiles = this._getAdditionalFiles(config);
            sampleFiles = sampleFiles.concat(additionalFiles);
        }

        let appModuleFile = new LiveEditingFile(
            SAMPLE_APP_FOLDER + "app.module.ts", this._getAppModuleConfig(config, configImports, configAdditionalImports), true, 'ts', 'modules');
        this._shortenComponentPath(config, appModuleFile);
        sampleFiles.push(appModuleFile);
        sampleFiles.push(new LiveEditingFile(
            SAMPLE_APP_FOLDER + "app.component.html",
            this._getAppComponentHtml(componentTsContent, config.usesRouting)));

        if (this._logsEnabled) {
            let stats = sampleFilesCount + " + " + additionalFiles.length + " files";
            console.log("Live-Editing - generated " + stats + " for " + componentTsName);
        }

        let dependencies = this._dependencyResolver.resolveSampleDependencies(
            config.dependenciesType, config.additionalDependencies);
        let sampleDef = new SampleDefinitionFile(sampleFiles, dependencies);

        let sampleName = config.component;
        let sampleRoute = this._componentRoutes.get(sampleName);
        if (sampleRoute === undefined) {
            console.log("Live-Editing - ERROR missing route for " + sampleName);
        } else {
            sampleRoute = sampleRoute.replace("/", "--") + ".json";
            fs.writeFileSync(this.getAssetsSamplesDir() + sampleRoute, JSON.stringify(sampleDef));
            this._logsSampleFiles += sampleFilesCount;
            this._logsUtilitiesFiles += additionalFiles.length;

            this._generatedSamples.set(sampleName, sampleRoute);
        }
    }

    private _getComponentFiles(config: Config): LiveEditingFile[] {
        let componentFiles = new Array<LiveEditingFile>();
        let componentPath = this.componentPaths.get(config.component);
        for (let i = 0; i < COMPONENT_FILE_EXTENSIONS.length; i++) {
            let componentFilePath = componentPath + "." + COMPONENT_FILE_EXTENSIONS[i];
            let fileContent = fs.readFileSync(path.join(componentFilePath), "utf8");
            let file = new LiveEditingFile(componentFilePath.substr(componentFilePath.indexOf("src")), fileContent, true, COMPONENT_FILE_EXTENSIONS[i], COMPONENT_FILE_EXTENSIONS[i]);
            this._shortenComponentPath(config, file);
            componentFiles.push(file);
        }

        return componentFiles;
    }

    private _getAdditionalFiles(config: Config): LiveEditingFile[] {
        let additionalFiles = new Array<LiveEditingFile>();
        for (let i = 0; i < config.additionalFiles.length; i++) {
            let fileContent = fs.readFileSync(path.join(process.cwd(), config.additionalFiles[i]), "utf8");
            config.additionalFiles[i] = config.additionalFiles[i].substring(
                config.additionalFiles[i].indexOf(SAMPLE_SRC_FOLDER));
            let file = new LiveEditingFile(config.additionalFiles[i], fileContent);
            this._shortenComponentPath(config, file);
            additionalFiles.push(file);
        }

        return additionalFiles;
    }

    private _getAppComponentHtml(componentTsContent, usesRouting) {
        let selectorRegex = /selector:[\s]*["']([a-zA-Z0-9-]+)["']/g;
        let selectorComponent = selectorRegex.exec(componentTsContent)[1];
        let appComponentHtml = usesRouting ? "<router-outlet></router-outlet>" :
            "<" + selectorComponent + "></" + selectorComponent + ">";
        return appComponentHtml;
    }

    private _getAppModuleConfig(config: Config, configImports, configAdditionalImports?) {
        let defaultNgDeclarations = ["AppComponent"];
        let defaultNgImports = ["BrowserModule", "BrowserAnimationsModule", "FormsModule"];
        let appModuleTemplate = fs.readFileSync(APP_MODULE_TEMPLATE_PATH, "utf8");

        let imports = this._getAppModuleImports(config, configImports, configAdditionalImports);

        let appModuleNgDeclarations: string[] = defaultNgDeclarations.concat(config.appModuleConfig.ngDeclarations);
        let ngDeclarations = this._formatAppModuleTypes(appModuleNgDeclarations, true, 1, "\r\n");

        let appModuleNgImports: string[] = defaultNgImports.concat(config.appModuleConfig.ngImports);

        let ngImports = this._formatAppModuleTypes(appModuleNgImports, true, 1, "\r\n");

        let ngProviders = "";
        if (config.appModuleConfig.ngProviders !== undefined &&
            config.appModuleConfig.ngProviders !== null &&
            config.appModuleConfig.ngProviders.length > 0) {
            let appModuleNgProviders: string[] = config.appModuleConfig.ngProviders;
            ngProviders = this._formatAppModuleTypes(appModuleNgProviders, false, 1, "\r\n");
        }

        let ngEntryComponents = "";
        if (config.appModuleConfig.ngEntryComponents !== undefined &&
            config.appModuleConfig.ngEntryComponents.length > 0) {
            let appModuleNgEntryComponents: string[] = config.appModuleConfig.ngEntryComponents;
            ngEntryComponents = this._formatAppModuleTypes(appModuleNgEntryComponents, false, 1, "\r\n");
        }

        let schemas = "";
        if (config.appModuleConfig.schemas !== undefined &&
            config.appModuleConfig.schemas.length > 0) {
            let appModuleSchemas: string[] = config.appModuleConfig.schemas;
            schemas = this._formatAppModuleTypes(appModuleSchemas, false, 1, "\r\n");
        }

        let additionalAdjustments = "";
        if (config.appModuleConfig.additionalAdjustments !== undefined &&
            config.appModuleConfig.additionalAdjustments.length > 0) {
            let adjustments: string[] = config.appModuleConfig.additionalAdjustments;
            adjustments.forEach(a => {
                additionalAdjustments += a + "\n";
            });
        }

        appModuleTemplate = appModuleTemplate
            .replace("{imports}", imports)
            .replace("{ngDeclarations}", ngDeclarations)
            .replace("{ngImports}", ngImports)
            .replace("{ngProviders}", ngProviders)
            .replace("{ngEntryComponents}", ngEntryComponents)
            .replace("{ngSchemas}", schemas)
            .replace("{additionalAdjustments}", additionalAdjustments);

        return appModuleTemplate;
    }

    private _getAppModuleImports(config: Config, configImports: Map<string, string>, configAdditionalImports?: object): string {
        let sampleImports = new Map<string, string[]>();

        for (let i = 0; i < config.appModuleConfig.imports.length; i++) {
            let importName = config.appModuleConfig.imports[i];
            let importModuleSpecifier = this.componentPaths.get(importName) ?? configImports.get(importName) ?? configAdditionalImports[importName];
            if (!importModuleSpecifier) {
                throw new Error(`${importName} path is missing for ${config.component} config!`);
            }
            if (sampleImports.has(importModuleSpecifier)) {
                sampleImports.get(importModuleSpecifier).push(importName);
            } else {
                sampleImports.set(importModuleSpecifier, [importName]);
            }
        }

        let imports = "";
        let sampleImportsKeys = Array.from(sampleImports.keys());
        for (let i = 0; i < sampleImportsKeys.length; i++) {
            let currentImportModuleSpecifier: string = sampleImportsKeys[i];
            let baseDirIndex: number = currentImportModuleSpecifier.indexOf(SAMPLE_APP_FOLDER);
            if (baseDirIndex !== -1) {
                currentImportModuleSpecifier = "." +
                    currentImportModuleSpecifier.substring(baseDirIndex + SAMPLE_APP_FOLDER.length - 1);
            }
            let currentImportModules: string[] = sampleImports.get(sampleImportsKeys[i]);
            let currentImport = "\r\nimport { " + this._formatAppModuleTypes(currentImportModules, false, 1, "\r\n") +
                ' } from "' + currentImportModuleSpecifier + '";';
            imports = imports + currentImport;
        }

        return imports;
    }

    private _formatAppModuleTypes(types: string[], multiline: boolean, tabsCount: number,
        suffixIfMultiple: string = null): string {
        if (types.length === 1 && !multiline) {
            return types.join("");
        }

        let formattedTypes = "\r\n";
        let tabs = "";
        for (let i = 0; i < tabsCount; i++) {
            tabs = tabs + "\t";
        }

        for (let i = 0; i < types.length; i++) {
            formattedTypes = formattedTypes + tabs + types[i].trim();
            if (i < types.length - 1) {
                formattedTypes = formattedTypes + ",\r\n";
            }
        }

        if (types.length > 1 && suffixIfMultiple) {
            formattedTypes = formattedTypes + suffixIfMultiple;
        }

        return formattedTypes;
    }

    private _shortenComponentPath(config: Config, file: LiveEditingFile) {
        if (!config.shortenComponentPathBy) {
            return;
        }

        let shorteningRegex = new RegExp(config.shortenComponentPathBy, "g");
        file.path = file.path.replace(shorteningRegex, "/");
        file.content = file.content.replace(shorteningRegex, "/");
    }

    private _getFileName(filePath: string) {
        return filePath.substring(filePath.lastIndexOf("/") + 1, filePath.length);
    }
}
