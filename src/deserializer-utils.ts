import * as _ from 'lodash';
import { Inflector } from './inflector';

export class DeserializerUtils {

  constructor(
    public jsonapi: any,
    public data: any,
    public opts: any
  ){}

  private alreadyIncluded: any[] = [];

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

  private findIncluded(relationshipData: any, relationshipName: any, from: any) {
    if (!this.jsonapi.included || !relationshipData) {
      return null;
    }

    let included = _.find(this.jsonapi.included, {
      id: relationshipData.id,
      type: relationshipData.type
    });

    var includedObject = {
      to: {
        id: from.id,
        type: from.type
      },
      from: Object.assign({}, relationshipData),
      relation: relationshipName
    };

    // Check if the include is already processed (prevent circular references).
    if (_.find(this.alreadyIncluded, includedObject)) {
      return null;
    } else {
      this.alreadyIncluded.push(includedObject);
    }


    if (included) {
      return _.extend(this.extractAttributes(included), this.extractRelationships(included));
    } else {
      return null;
    }
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

    Object.keys(from.relationships)
      .map((key: string) => {
        let relationship = from.relationships[key];

        if (relationship.data === null) {
          return dest[this.keyForAttribute(key)] = null;
        } else if (_.isArray(relationship.data)) {
          let includes = relationship.data
            .map((relationshipData: Array<any>) => {
              return this.extractIncludes(relationshipData, key, from);
            });
          if (includes) {
              dest[this.keyForAttribute(key)] = includes;
          }
        } else {
          let includes = this.extractIncludes(relationship.data, key, from)
          if (includes) {
            return dest[this.keyForAttribute(key)] = includes;
          }
        }
      });
      return dest;
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

  private extractIncludes(relationshipData: any, relationshipName: any, from: any) {
    let included = this.findIncluded(relationshipData, relationshipName, from)
    let valueForRelationship = this.getValueForRelationship(relationshipData, included);
    return valueForRelationship;
  }

  perform(): any {
    return _.extend(this.extractAttributes(this.data), this.extractRelationships(this.data));
  }
}
