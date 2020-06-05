const config = require('./config.json');
const consoleService = require('./services/ConsoleService');
const projectExplorerService = require('./services/ProjectExplorerService');
const RamlParserService = require('./services/RamlParserService');
const ramlParserService = new RamlParserService();

async function generateCurl(method, params) {
    let bodyPart = '';

    if (method.body && method.body.length > 0 && method.body[0].examples && method.body[0].examples.length > 0) {
        const body = method.body[0];
        bodyPart = ` \\
--header 'Content-Type: ${method.body[0].name}' \\
-d '${JSON.stringify(method.body[0].examples[0].value)}'`;
    }

    return `\`\`\`shell
curl -X ${method.method.toUpperCase()} ${config.baseUrl}${params.basePath}${method.parentUri} \\
--header 'Authorization: Basic ***'${bodyPart}
\`\`\``;
}

async function generateRequest(method, params) {
    if (method.body && method.body.length) {
        const body = method.body[0];
        return {
            contentType: body.name,
            examples: body.examples ? body.examples.map(example => '```json\n' + JSON.stringify(example.value, null, '\t') + '```') : [],
            curlExample: `\`\`\`shell
curl -X ${method.method.toUpperCase()} ${config.baseUrl}${params.basePath}${method.parentUri} \\
--header 'Authorization: Basic ***' \\
--header 'Content-Type: ${body.name}'
-d '${body.examples && body.examples.length > 0 ? JSON.stringify(body.examples[0].value) : ''}'
\`\`\``,
            requestFieldsTable: await ramlParserService.getTypeTable(body.type[0])
        }
    }
    return null;
}

async function generateResponse(response) {
    const body = response.body[0];
    return {
        title: `Status ${response.code} case`,
        contentType: body.name,
        examples: body.examples ? body.examples.map(example => '```json\n' + JSON.stringify(example.value, null, '\t') + '```') : [],
        responseFieldsTable: await ramlParserService.getTypeTable(body.type[0])
    };
}

async function printPage(page) {
    const responsesContent = page.responses.map(response => {
        return `#### ${response.title}
${response.examples.join('\n')}

${response.responseFieldsTable}
`;
    });

    let requestContent = '';
    if (page.request) {
        requestContent = `

### Request

#### Content Type
${page.request.contentType}

#### Request body examples
${page.request.examples.join('\n')}

#### Request structure
${page.request.requestFieldsTable}
`;
    }

    let uriParamsContent = '';
    if (page.uriParameters) {
        uriParamsContent = `

### Uri parameters
${ramlParserService.generateTableForProperties(page.uriParameters.map(property => ({...property, fullname: property.name})))}
`;
    }

    let queryParametersContent = '';
    if (page.queryParameters) {
        queryParametersContent = `

### Query parameters
${ramlParserService.generateTableForProperties(page.queryParameters.map(property => ({...property, fullname: property.name})))}
`;
    }

    const content = `
### API resource path
${page.path}

### Description
${page.description}

### Curl example
${page.curlExample}

${uriParamsContent}
${queryParametersContent}
${requestContent}
### Responses
${responsesContent.join('\n')}
`;
    console.log(content);
}

(async () => {
    try {
        const params = await consoleService.getParams();
        const project = await projectExplorerService.getRamlFullPath(config.pathToProjectsRootFolder, params.name);

        // load raml
        await ramlParserService.loadFile(project.ramlFilePath);

        // search for resource and methods
        const resource = await ramlParserService.getResource(params.path);
        consoleService.validateNotNull(resource, `resource ${params.path} not found`);
        const method = resource.methods.find(method => method.method.toLowerCase() === params.method.toLowerCase());
        consoleService.validateNotNull(method, 'method not found');

        const page = {
            path: `**${method.method.toUpperCase()}** \`${method.parentUri}\``,
            description: method.description ? method.description : "//TODO",
            curlExample: await generateCurl(method, params),
            request: await generateRequest(method, params),
            responses: method.responses ? await Promise.all(method.responses.map(async response => generateResponse(response, params))) : [],
            uriParameters: method.uriParameters,
            queryParameters: method.queryParameters
        }

        await printPage(page);
    } catch (e) {
        consoleService.log('Error occurred', e.message)
    }
})();