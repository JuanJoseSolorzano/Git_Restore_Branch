// Copyright (c) 2025 Solorzano-JuanJose. All rights reserved.

import fs from 'fs';
import AdmZip from 'adm-zip';
import {exec} from 'child_process';

export async function folder2bin(folderPath){
    return new Promise((resolve, reject) => {
        try {
            const zip = new AdmZip();
            zip.addLocalFolder(folderPath);
            const binaryContent = zip.toBuffer();
            resolve(binaryContent);
        } catch (error) {
            reject(`Error creating binary content from folder: ${error}`);
        }
    });
}

export function bin2folder(binaryContent, targetFolder){
    return new Promise((resolve, reject) => {
        try {
            const zip = new AdmZip(binaryContent);
            zip.extractAllToAsync(targetFolder, true, (err) => {
                if (err) {
                    return reject(`Error extracting binary content to folder: ${err}`);
                }
                resolve(`Successfully extracted to ${targetFolder}`);
            });
            return; // Prevent further resolve/reject after async callback
        } catch (error) {
            reject(`Error extracting binary content to folder: ${error}`);
        }
    });
}

export async function removeItem(itemPath) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(itemPath)) {
            return resolve(`Item does not exist: ${itemPath}`);
        }
        exec(
            `Remove-Item -Path "${itemPath}" -Recurse -Force`,
            { shell: 'powershell.exe' },
            (error, stdout, stderr) => {
                if (error) {
                    return reject(`Error removing item: ${stderr || error.message}`);
                }
                resolve(`Successfully removed item: ${itemPath}`);
            }
        );
    });
}
