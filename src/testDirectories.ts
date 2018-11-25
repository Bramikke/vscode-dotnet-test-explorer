import * as fs from "fs";
import * as glob from "glob";
import * as path from "path";
import * as vscode from "vscode";
import { Logger } from "./logger";
import { Utility } from "./utility";

export class TestDirectories {

    private directories: string[];
    private testsForDirectory: Array<{ dir: string, name: string }>;

    public parseTestDirectories() {

        if (!vscode.workspace || !vscode.workspace.workspaceFolders) {
            return;
        }

        const testDirectoryGlob = Utility.getConfiguration().get<string>("testProjectPath");
        this.directories = [];

        const matchingDirs = [];

        vscode.workspace.workspaceFolders.forEach( (folder) => {

            const globPattern = folder.uri.fsPath.replace("\\", "/") + "/" + testDirectoryGlob;

            Logger.Log(`Finding projects for pattern ${globPattern}`);

            const matchingDirsForWorkspaceFolder = glob.sync(globPattern);

            matchingDirs.push(...matchingDirsForWorkspaceFolder);

            Logger.Log(`Found ${matchingDirsForWorkspaceFolder.length} matches for pattern in folder ${folder.uri.fsPath}`);
        });

        matchingDirs.forEach( (dir) => {
            Logger.Log(`Evaluating match ${dir}`);
            this.evaluateTestDirectory(dir);
        });
    }

    public addTestsForDirectory(testsForDirectory) {
        this.testsForDirectory = this.testsForDirectory.concat(testsForDirectory);
    }

    public clearTestsForDirectory() {
        this.testsForDirectory = [];
    }

    public getTestDirectories(testName?: string): string[] {

        if (testName && testName !== "") {
            const dirForTestName = this
                .testsForDirectory
                .filter( (t) => t.name.startsWith(testName))
                .map( (t) => t.dir);

            return [...new Set(dirForTestName)];
        }

        return this.directories;
    }

    private evaluateTestDirectory(testProjectFullPath: string): void {

        if (!fs.existsSync(testProjectFullPath)) {
            Logger.LogWarning(`Path ${testProjectFullPath} is not valid`);
        } else {

            if (fs.lstatSync(testProjectFullPath).isFile()) {
                testProjectFullPath = path.dirname(testProjectFullPath);
            }

            Logger.Log(`Adding directory ${testProjectFullPath}`);
            this.directories.push(testProjectFullPath);
        }
    }
}
