import { TsImportsService } from "./TsImportsService";
import * as path from "path";
// tslint:disable-next-line: no-implicit-dependencies
import * as ts from "typescript";
import * as fs from "fs";
// tslint:disable-next-line: no-implicit-dependencies
import slash = require('slash');

export interface IComponentRoute{
    component: string,
    route: string;
}

export interface IModuleRouting {
    module: string,
    path: string,
    routes: IComponentRoute[]
}

const appRouting = new Map<string, IModuleRouting[]>();
const componentPaths = new Map<string, string>();
export class TsRoutingPathService {

    private routingImports: Map<string, string>;
    private tsImportService: TsImportsService;
    public routes;
    constructor(private baseDir, routesFilesPath){
        this.tsImportService =  new TsImportsService();
        this.routes = path.join(this.baseDir, routesFilesPath);
        this.routingImports = this.tsImportService.getFileImports(routesFilesPath);
    }

    public generateRouting(routePath: string = this.routes, moduleRouting?: IModuleRouting) {
        let sourcePath = routePath === this.routes ? routePath : path.join(path.dirname(this.routes), routePath);
        const source = ts.createSourceFile(routePath, fs.readFileSync(sourcePath).toString(), ts.ScriptTarget.ES2015, true);
        let routing: ts.Statement;
        let name: ts.Identifier;
        let classRoutePath: string | ts.StringLiteral;
        let routingArray: ts.ArrayLiteralExpression;
        let properties: ts.ObjectLiteralElementLike[];
        let route: IComponentRoute | IModuleRouting;

        if (moduleRouting){
            routing = source.statements.find(s => s.kind === ts.SyntaxKind.VariableStatement) as ts.VariableStatement;
            [, routingArray] = this.getRoutesArray(routing, ts.SyntaxKind.VariableDeclarationList);
            routingArray.elements.forEach((object: ts.ObjectLiteralExpression) => {
                [...properties] = object.properties;
                name = this.getObjectLiteralPropertyValue<ts.Identifier>(properties, 'component', ts.SyntaxKind.Identifier);
                classRoutePath = this.getObjectLiteralPropertyValue<ts.StringLiteral>(properties, 'path', ts.SyntaxKind.StringLiteral);
                const componentImports = this.tsImportService.getFileImports(path.join(path.dirname(this.routes), routePath));
                const componentPath = slash(path.join(path.dirname(sourcePath), componentImports.get(name.text)));
                componentPaths.set(name.text, componentPath);
                route = {component: name.text, route: classRoutePath.text} as IComponentRoute;
                moduleRouting.routes.push(route);
            });
        } else {
            const routingAssignments = source.statements.filter(s => s.kind === ts.SyntaxKind.VariableStatement);
            let variableName;
            routingAssignments.forEach(rA => {
                routing = rA;
                [variableName, routingArray] = this.getRoutesArray(routing, ts.SyntaxKind.VariableDeclarationList);
                appRouting.set(variableName.text, []);
                routingArray.elements.forEach((node: ts.ObjectLiteralExpression) => {
                    [...properties] = node.properties;
                    // name = this.getObjectLiteralPropertyValue<ts.Identifier>(properties, 'module', ts.SyntaxKind.Identifier);
                    const pathName = this.getObjectLiteralPropertyValue<ts.StringLiteral>(properties, 'path', ts.SyntaxKind.StringLiteral).text;
                    
                    // classRoutePath = this.getBaseDir(name.text);
                    const componentRoutes =  this.getObjectLiteralPropertyValue<ts.PropertyAccessExpression>(properties, 'routes', ts.SyntaxKind.PropertyAccessExpression);
                    route = { /*module: name.text, */routes: [], path: pathName } as IModuleRouting;
                    //const moduleName = route.module;
                    const moduleRoutingIdentifier = componentRoutes.getChildren()[0].getText();
                    const moduleRoutingPath = `${this.routingImports.get(moduleRoutingIdentifier)}.ts`;
                    this.generateRouting(moduleRoutingPath, route);
                    appRouting.get(variableName.text).push(route);
                    console.log(`Configure Routing and Paths for ${pathName}`);
                });
            });
        }
    }

    private getRoutesArray(parent: ts.Node, searchKind: ts.SyntaxKind): never | [ts.Identifier, ts.ArrayLiteralExpression] {
        const child = parent.getChildren().find(node => node.kind === searchKind)
        switch (child.kind) {
            case ts.SyntaxKind.VariableDeclarationList:
                return this.getRoutesArray(child, ts.SyntaxKind.SyntaxList);
            case ts.SyntaxKind.SyntaxList:
                return this.getRoutesArray(child, ts.SyntaxKind.VariableDeclaration);
            case ts.SyntaxKind.VariableDeclaration:
                return child.getChildren().filter(node => node.kind === ts.SyntaxKind.Identifier || node.kind === ts.SyntaxKind.ArrayLiteralExpression) as unknown as [ts.Identifier, ts.ArrayLiteralExpression]
        }
    }

    private getObjectLiteralPropertyValue<T extends ts.Node>(props: ts.ObjectLiteralElementLike[], propertyName: string, valueSyntaxKind: ts.SyntaxKind): T {
        return (props.find(prop => prop.name.getText() === propertyName) as unknown as T).
                getChildren().find(n => n.kind === valueSyntaxKind && n.getText() !== propertyName) as T;
    }

    private getBaseDir(name: string){
        return path.basename(path.dirname(this.routingImports.get(name)));
    }
}

export {appRouting, componentPaths}
