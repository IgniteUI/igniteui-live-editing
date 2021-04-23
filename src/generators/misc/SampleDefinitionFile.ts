import { LiveEditingFile } from "./LiveEditingFile";

export class SampleDefinitionFile {
    public sampleFiles: LiveEditingFile[];
    public sampleDependencies: string;
    public addTsConfig = false;
    constructor(files: LiveEditingFile[], dependencies: string[], addTsConfig: boolean) {
        this.sampleFiles = files;
        this.sampleDependencies = JSON.stringify(dependencies);
        this.addTsConfig = addTsConfig;
    }
}
