// Copyright (c) 2025 Juan Jose Solorzano. All rights reserved.

const vscode = require('vscode');
const path = require('path');
const { exec } = require('child_process');
const utils = require('./lib/utils');

function activate(context){
    let disposable = vscode.commands.registerCommand('extension.GitRestoreBranch', async () => { // tells VSCode to run this function when the command 'GitRestoreBranch' is executed.
        const git = vscode.extensions.getExtension('vscode.git'); // Git extension is required for this to work.
        if(!git){ vscode.window.showErrorMessage('Git extension not found.'); return; } // Check if Git extension is available
        await git.activate(); // Wait for the Git extension to activate.
        const gitApi = git.exports.getAPI(1);
        let workspaceFolderPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        let gitFolder = path.join(workspaceFolderPath, '.git');
        if(!gitFolder){ vscode.window.showErrorMessage('Git folder not found.'); return; }
        const binaryData = await utils.folder2bin(gitFolder);
        if(!binaryData){ vscode.window.showErrorMessage('Error creating binary content from git folder.'); return; }
        const target = await vscode.window.showInputBox({
            prompt: 'Enter the git commit hash',
            placeHolder: '<1d1de50>'
        });
        // Get current branch name, and check if it's valid.
        if (!target) { vscode.window.showErrorMessage('No target value provided.'); return; }
        const repo = gitApi.repositories.find(repo => repo.rootUri.fsPath === workspaceFolderPath);
        if (!repo) { vscode.window.showErrorMessage('No git repository found in workspace.'); return; }
        const branch = repo.state.HEAD && repo.state.HEAD.name;
        if (!branch) { vscode.window.showErrorMessage('No branch currently checked out.'); return; }
        vscode.window.showInformationMessage(`Resetting branch ${branch} to commit ${target}`);
        // Force push the reset branch to remote after resetting.
        exec(`Set-Location ${workspaceFolderPath};git reset --hard ${target};git push origin ${branch} --force`,
            {shell:'powershell.exe'},(error,stdout,stderr) => {
                if(error){
                    vscode.window.showErrorMessage(`Error getting git status: ${stderr}`);
                    return;
                }
                vscode.debug.activeDebugConsole.appendLine(`Git status output:\n${stdout}`);
            });
        // Ask user if they want to restore the previous git status.
        let yes_no_user;
        while (yes_no_user === undefined) {
            yes_no_user = await vscode.window.showQuickPick(['Yes', 'No'], {
            placeHolder: `Do you want to restore the previous git status of ${branch}?`
            });
        }
        // Remove the .git folder before restoring
        if(!yes_no_user){
            await utils.removeItem(gitFolder).then(() => {
                vscode.window.showInformationMessage(`Removed existing .git folder at ${gitFolder}`);
            });
            await utils.bin2folder(binaryData, gitFolder).then(() => {
                vscode.window.showInformationMessage(`Successfully restored git status for branch ${branch}`);
            }).catch((error) => {
                vscode.window.showErrorMessage(`Error restoring git status: ${error}`);
            });
            exec(`Set-Location ${workspaceFolderPath};git reset FETCH_HEAD;git checkout ${branch}`,{shell:'powershell.exe'},(error,stdout,stderr) => {
                if(error){
                    vscode.window.showErrorMessage(`Error getting git status: ${stderr}`);
                    return;
                }
            });
            return;
        }
        if(yes_no_user === 'Yes'){
            await utils.removeItem(gitFolder).then(() => {
                vscode.window.showInformationMessage(`Removed existing .git folder at ${gitFolder}`);
            });
            await utils.bin2folder(binaryData,gitFolder).then(() => {
                vscode.window.showInformationMessage(`Successfully restored git status for branch ${branch}`);
            }).catch((error) => {
                vscode.window.showErrorMessage(`Error restoring git status: ${error}`);
            });
            exec(`Set-Location ${workspaceFolderPath};git restore .;git push origin ${branch}`,{shell:'powershell.exe'},(error,stdout,stderr) => {
                if(error){
                    vscode.window.showErrorMessage(`Error getting git status: ${stderr}`);
                    return;
                } 
            });
        }else{
            vscode.window.showInformationMessage(`Git branch ${branch} remains at commit ${target}`);
        }
    });
    context.subscriptions.push(disposable);
}

function deactivate(){}

module.exports = {
    activate,
    deactivate
};
