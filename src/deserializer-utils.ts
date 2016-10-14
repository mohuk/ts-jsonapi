import * as _ from 'lodash';
import { Inflector } from './inflector';

export class DeserializerUtils {

  constructor(
    public jsonapi: any,
    public data: any,
    public opts: any
  ){}

  private isComplexType(obj: any) {
    return _.isArray(obj) || _.isPlainObject(obj);
  }

  private getValueForRelationship(relationshipData: any, included: any) {
    if (this.opts && relationshipData && this.opts[relationshipData.type]) {
      let valueForRelationshipFct = this.opts[relationshipData.type]
        .valueForRelationship;

      return valueForRelationshipFct(relationshipData, included);
    } else {
      return included;
    }
  }

  private findIncluded(relationshipData: any) {
    return new Promise<any>((resolve) => {
      if (!this.jsonapi.included || !relationshipData) { resolve(null); }

      let included = _.find(this.jsonapi.included, {
        id: relationshipData.id,
        type: relationshipData.type
      });

      if (included) {
        return Promise
          .all([this.extractAttributes(included), this.extractRelationships(included)])
          .then(([attributes, relationships]) => {
            resolve(_.extend(attributes, relationships));
          })
      } else {
        return resolve(null);
      }
    });
  }

  private extractAttributes(from: any) {
    let dest = this.keyForAttribute(from.attributes || {});
    if ('id' in from) {
      dest.id = from.id;
    }

    return dest;
  }

  private extractRelationships(from: any): any {
    if (!from.relationships) { return; }

    let dest: any = {};

    return Promise.all(Object.keys(from.relationships).map((key: string) => {
        let relationship = from.relationships[key];

        if (relationship.data === null) {
          return dest[this.keyForAttribute(key)] = null;
        } else if (_.isArray(relationship.data)) {
          return Promise.all(relationship.data
            .map((relationshipData: Array<any>): Promise<any> => {
              return this.extractIncludes(relationshipData);
            }))
            .then((includes: any) => {
              if (includes) {
                dest[this.keyForAttribute(key)] = includes;
              }
            });
        } else {
          return this.extractIncludes(relationship.data)
            .then((include: any) => {
              if (include) {
                return dest[this.keyForAttribute(key)] = include;

              }
            });
        }
      }))
      .then(() => dest);
  }

  private keyForAttribute(attribute: any): any{
    if (_.isPlainObject(attribute)) {
      return _.transform(attribute, (result, value, key) => {
        if (this.isComplexType(value)) {
          result[this.keyForAttribute(key)] = this.keyForAttribute(value);
        } else {
          result[this.keyForAttribute(key)] = value;
        }
      });
    } else if (_.isArray(attribute)) {
      return attribute.map(attr => {
        if (this.isComplexType(attr)) {
          return this.keyForAttribute(attr);
        } else {
          return attr;
        }
      });
    } else {
      if (_.isFunction(this.opts.keyForAttribute)) {
        return this.opts.keyForAttribute(attribute);
      } else {
        return Inflector.caserize(attribute, this.opts.keyForAttribute);
      }
    }
  }

  private extractIncludes(relationshipData: any) {
    return this.findIncluded(relationshipData)
      .then((included) => {
        let valueForRelationship = this.getValueForRelationship(relationshipData,
          included);
        if (valueForRelationship && _.isFunction(valueForRelationship.then)) {
          return valueForRelationship
            .then((value: any) => {
              return value;
            });
        } else {
          return valueForRelationship;
        }
      });
  }

  perform(): Promise<any> {
    return Promise
      .all([this.extractAttributes(this.data), this.extractRelationships(this.data)])
      .then(([attributes, relationships]) => {
        return _.extend(attributes, relationships);
      });
  }
}
