import * as inflector from 'inflected';

export namespace Inflector {
  export function caserize(attribute: string, conversionCase: string): string {
    attribute = inflector.underscore(attribute);
    switch (conversionCase) {
      case 'dash-case':
      case 'lisp-case':
      case 'spinal-case':
      case 'kebab-case':
        return inflector.dasherize(attribute);
      case 'underscore_case':
      case 'snake_case':
        return attribute;
      case 'CamelCase':
        return inflector.camelize(attribute);
      case 'camelCase':
        return inflector.camelize(attribute, false);
      default:
        return inflector.dasherize(attribute);
    }
  }

  export function pluralize(attribute: string): string {
    return inflector.pluralize(attribute);
  }
}
