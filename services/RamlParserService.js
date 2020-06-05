const {isUndefined, isString} = require('lodash');
const ramlParser = require('raml-1-parser');

class RamlParserService {
    async loadFile(ramlFilePath) {
        this.raml = await ramlParser.load(ramlFilePath)
    }

    async getResource(path) {
        const lookupPath = (path, resources) => {

            const result = resources.map(resource => {
                if (resource.completeRelativeUri === path) {
                    return resource;
                } else if (!isUndefined(resource.resources)) {
                    return lookupPath(path, resource.resources);
                }
            }).filter(resource => resource != null);

            if (result.length === 0) {
                return null;
            } else {
                return result[0];
            }
        }
        return lookupPath(path, this.raml.specification.resources);
    }

    async getTypeTable(name) {
        if (isUndefined(name)) {
            return;
        }

        const type = this.raml.specification.types.find(type => type.name === name);

        if (type === null) {
            return;
        }

        // get all properties
        const properties = [];

        const lookupProperties = (fields, namePrefix) => {
            if (fields == null || fields.length === 0) {
                return;
            }

            fields.forEach(field => {
                const fullname = namePrefix ? `${namePrefix}.${field.name}` : field.name;
                properties.push({
                    ...field,
                    fullname
                });

                const itemsProperties = field.items && field.items.length > 0 ? field.items[0].properties : [];
                const fieldProperties = field.properties && field.properties.length > 0 ? field.properties : [];

                lookupProperties(fieldProperties.concat(itemsProperties), fullname)
            });
        }

        lookupProperties(type.properties)

        return this.generateTableForProperties(properties);
    }

    generateTableForProperties(properties) {
        // generate table
        const data = {
            "h-0": "Parameter",
            "h-1": "Description",
            "h-2": "Required?",
            "h-3": "Datatype",
            "h-4": "Enum values",
            "h-5": "Example"
        };

        properties.forEach((property, index) => {
            data[`${index}-0`] = property.fullname;
            data[`${index}-1`] = property.description ? property.description : '';
            data[`${index}-2`] = property.required ? "true" : "false";
            data[`${index}-3`] = property.type ? property.type.map(type => {
                if (isString(type)) {
                    return type;
                } else if (type.type && type.type[0] === 'union') {
                    return type.anyOf.join(', ');
                }
            }).join('\n* ') : '';
            data[`${index}-4`] = property.enum ? `[${property.enum.join(', ')}]` : '';
            data[`${index}-5`] = property.examples ? property.simplifiedExamples.join('\n* ') : '';
        });

        const table = {
            data,
            cols: 6,
            rows: properties.length
        };

        return `
[block:parameters]
${JSON.stringify(table, null, '\t')}
[/block]        
`;
    }
}

module.exports = RamlParserService;