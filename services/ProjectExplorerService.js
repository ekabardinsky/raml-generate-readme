const path = require('path');
const fs = require('fs');

class ProjectExplorerService {
    async getRamlFullPath(pathToProjectsRootFolder, name) {
        const projectPath = `${pathToProjectsRootFolder}${path.sep}ms-${name}${path.sep}`;
        const fullPath = `${projectPath}src${path.sep}main${path.sep}api`
        const files = await this.readdirAsync(fullPath);
        const fileName = files.find(file => file.toLowerCase().includes(".raml"));
        return {
            fileName,
            fullPath,
            ramlFilePath: `${fullPath}${path.sep}${fileName}`
        }
    }

    async readdirAsync(path) {
        return new Promise(function (resolve, reject) {
            fs.readdir(path, function (error, result) {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

module.exports = new ProjectExplorerService();