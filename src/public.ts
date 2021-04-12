export enum DependenciesType {
    Default = 0,
    Charts = 1,
    Gauges = 2,
    Excel = 3,
    Maps = 4,
    Spreadsheet = 5
}

export class AppModuleConfig {
    public imports: string[];
    public ngDeclarations: string[];
    public ngImports: string[];
    public ngProviders: string[];
    public ngEntryComponents: string[];
    public schemas: string[];
    public additionalAdjustments: string[];

    constructor(fields: {
        imports: string[],
        ngDeclarations: string[],
        ngImports: string[],
        ngProviders?: string[],
        ngEntryComponents?: string[],
        schemas?: string[],
        additionalAdjustments?: string[]

    }) {
        this.imports = fields.imports;
        this.ngDeclarations = fields.ngDeclarations;
        this.ngImports = fields.ngImports;
        this.ngProviders = fields.ngProviders;
        this.ngEntryComponents = fields.ngEntryComponents;
        this.schemas = fields.schemas;
        this.additionalAdjustments = fields.additionalAdjustments;
    }
}

export class Config {
    public component: string;
    public usesRouting: boolean;
    public additionalFiles: string[];
    public appModuleConfig: AppModuleConfig;
    public dependenciesType: DependenciesType;
    public additionalDependencies: string[];
    public shortenComponentPathBy: string;

    constructor(fields: {
        component: string,
        additionalFiles?: string[],
        appModuleConfig: AppModuleConfig,
        dependenciesType?: DependenciesType,
        additionalDependencies?: string[]
        shortenComponentPathBy?: string
    }) {
        this.component = fields.component;
        this.additionalFiles = fields.additionalFiles;
        this.appModuleConfig = fields.appModuleConfig;
        this.dependenciesType = fields.dependenciesType === undefined ?
            DependenciesType.Default : fields.dependenciesType;
        this.additionalDependencies = fields.additionalDependencies;
        this.shortenComponentPathBy = fields.shortenComponentPathBy;
    }
}


type importsType = { [key: string]: string };

export interface IConfigGenerator {
    generateConfigs(): Config[];
    additionalImports?: importsType;
}

type Platform = "angular" | "react" | "blazor" | "wc";

export interface ILiveEditingOptions {
    platform: Platform,
    samplesDir: string,
    configGeneratorPath:  string;
    module: {
        routerPath:string,
        moduleName?: string
    };
    additionalSharedStyles?:string[];
}

