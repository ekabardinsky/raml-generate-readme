const {isUndefined} = require('lodash');

class ConsoleService {
    validateNotNull(object, message) {
        if (object == null) {
            throw new Error(message);
        }
    }

    getParams() {
        const name = process.argv[2];
        const method = process.argv[3];
        const path = process.argv[4];
        const basePath = process.argv[5];

        if (isUndefined(name) || isUndefined(method) || isUndefined(path) || isUndefined(basePath)) {
            throw new Error(this.getHelp());
        } else {
            return {
                name,
                method,
                path,
                basePath
            }
        }
    }

    getHelp() {
        return `Please pass to the command line the following list of arguments:
* project name, like: ebank-ips-api
* method name, like: delete
* full path: /customer/{cif}/alias/{value}
* api base path: /ips
Example: node index.js ebank-ips-api delete /customer/{cif}/alias/{alias} /ips
`;
    }

    log(state, message) {
        console.log(`------------------------------${state}------------------------------
${message ? message : ''}
`);
    }
}

module.exports = new ConsoleService();