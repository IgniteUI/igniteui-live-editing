import { LiveEditingFile } from "./LiveEditingFile";

export class SharedAssetsFile {
    public files: LiveEditingFile[];
    public devDependencies: object;
    public tsConfig: LiveEditingFile;
    constructor(files: LiveEditingFile[], devDependencies: object, tsConfig: LiveEditingFile) {
        this.files = files;
        this.devDependencies = devDependencies;
        this.tsConfig = tsConfig;
    }
}
