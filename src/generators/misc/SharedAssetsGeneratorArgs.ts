export class SharedAssetsGeneratorArgs {
    public stylesFileName: string;
    public stylesFileContent: string;
    public angularJsonFilePath: string;
    public appComponentStylesFileName: string;
    public appComponentStylesFileContent: string;
    public additionalStyles: string[];

    constructor(stylesFileName: string, stylesFileContent: string,
                angularJsonFilePath: string, appComponentStylesFileName: string,
                appComponentStylesFileContent: string, additionalStyles?: string[]) {
        this.stylesFileName = stylesFileName;
        this.stylesFileContent = stylesFileContent;
        this.angularJsonFilePath = angularJsonFilePath;
        this.appComponentStylesFileName = appComponentStylesFileName;
        this.appComponentStylesFileContent = appComponentStylesFileContent;
        this.additionalStyles = additionalStyles;
    }
}
