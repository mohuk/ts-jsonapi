import * as _ from 'lodash';
import { Links } from './types';
import { Inflector } from './inflector';
import { SerializerOptions } from './serializer-options';

export class SerializerUtils {
  constructor(
    public collectionName: string,
    public record: any,
    public payload: any,
    public opts: SerializerOptions
  ){}

  serialize(dest: any, current: any, attribute: any, opts: SerializerOptions) {
    let data: any = null;

    if (opts && opts.ref) {
      if (!dest.relationships) { dest.relationships = {}; }

      if (_.isArray(current[attribute])) {
        data = current[attribute].map((item: any) => {
          return this.serializeRef(item, current, attribute, opts);
        });
      } else {
        data = this.serializeRef(current[attribute], current, attribute,
          opts);
      }

      dest.relationships[this.keyForAttribute(attribute)] = {};
      if (!opts.ignoreRelationshipData) {
        dest.relationships[this.keyForAttribute(attribute)].data = data;
      }

      if (opts.relationshipLinks) {
        dest.relationships[this.keyForAttribute(attribute)].links =
          this.getLinks(current[attribute], opts.relationshipLinks, dest);
      }

      if (opts.relationshipMeta) {
        dest.relationships[this.keyForAttribute(attribute)].meta =
          this.getMeta(current[attribute], opts.relationshipMeta);
      }
    } else {
      if (_.isArray(current[attribute])) {
        if (current[attribute].length && _.isPlainObject(current[attribute][0])) {
          data = current[attribute].map((item: any) => {
            return this.serializeNested(item, current, attribute, opts);
          });
        } else {
          data = current[attribute];
        }

        dest.attributes[this.keyForAttribute(attribute)] = data;
      } else if (_.isPlainObject(current[attribute])) {
        data = this.serializeNested(current[attribute], current, attribute, opts);
        dest.attributes[this.keyForAttribute(attribute)] = data;
      } else {
        dest.attributes[this.keyForAttribute(attribute)] = current[attribute];
      }
    }
  }

  serializeRef (dest: any, current: any, attribute: any, opts: SerializerOptions): any {
    var id = this.getRef(current, dest, opts);
    var type = this.getType(attribute, dest);

    var relationships: Array<any> = [];
    var includedAttrs: Array<any> = [];

    if (opts.attributes) {
      relationships = opts.attributes.filter((attr: any) => {
        return opts[attr];
      });

      includedAttrs = opts.attributes.filter((attr: any) => {
        return !opts[attr];
      });
    }

    var included: any = { type: type, id: id };
    if (includedAttrs) {
      included.attributes = this.pick(dest, includedAttrs);
    }

    _.each(relationships, relationship => {
      if (dest && this.isComplexType(dest[relationship])) {
        this.serialize(included, dest, relationship, opts[relationship]);
      }
    });

    if (includedAttrs.length &&
      (_.isUndefined(opts.included) || opts.included)) {
      if (opts.includedLinks) {
        included.links = this.getLinks(dest, opts.includedLinks);
      }

      if (typeof id !== 'undefined') { this.pushToIncluded(this.payload, included); }
    }

    return typeof id !== 'undefined' ? { type: type, id: id } : null;
  };

  serializeNested (dest: any, current: any, attribute: string, opts: SerializerOptions): any {
    let embeds: Array<any> = [];
    let attributes: Array<any> = [];

    if (opts && opts.attributes) {
      embeds = opts.attributes.filter((attr) => {
        return opts[attr];
      });

      attributes = opts.attributes.filter((attr) => {
        return !opts[attr];
      });
    } else {
      attributes = _.keys(dest);
    }

    let ret: any = {};
    if (attributes) {
      ret.attributes = this.pick(dest, attributes);
    }

    _.each(embeds, embed => {
      if (this.isComplexType(dest[embed])) {
        this.serialize(ret, dest, embed, opts[embed]);
      }
    });
    return ret.attributes;
  }

  perform(): any {
    if(_.isNull(this.record)){
        return null;
    }

    // Top-level data.
    var data: any = {
      type: this.getType(this.collectionName, this.record),
      id: String(this.record[this.getId()])
    };

    // Data links.
    if (this.opts.dataLinks) {
      data.links = this.getLinks(this.record, this.opts.dataLinks);
    }

    _.each(this.opts.attributes, (attribute) => {
      var splittedAttributes = attribute.split(':');

      if (splittedAttributes[0] in this.record ||
        (this.opts[attribute] && this.opts[attribute].nullIfMissing)) {

        if (!data.attributes) { data.attributes = {}; }
        var attributeMap = attribute;
        if (splittedAttributes.length > 1) {
          attribute = splittedAttributes[0];
          attributeMap = splittedAttributes[1];
        }
        this.serialize(data, this.record, attribute, this.opts[attributeMap]);
      }
    });

    return data;
  }

  private keyForAttribute(attribute: any): any {
    if (_.isPlainObject(attribute)) {
      return _.transform(attribute, (result, value, key) => {
        if (this.isComplexType(value)) {
          result[this.keyForAttribute(key)] = this.keyForAttribute(value);
        } else {
          result[this.keyForAttribute(key)] = value;
        }
      });
    } else if (_.isArray(attribute)) {
      return attribute.map((attr) => {
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
        return Inflector.caserize(attribute, {
          keyForAttribute: this.opts.keyForAttribute
        });
      }
    }
  }

  private isComplexType(obj: any) {
    return _.isArray(obj) || _.isPlainObject(obj);
  }

  private getRef(current: any, item: any, opts: any): string | string[] {
    if (_.isFunction(opts.ref)) {
      return opts.ref(current, item);
    } else if (opts.ref === true) {
      if (_.isArray(item)) {
        return item.map(function (val) {
          return String(val);
        });
      } else if (item) {
        return String(item);
      }
    } else if (item && item[opts.ref]){
      return String(item[opts.ref]);
    }
  }

  private getId(): string {
    return this.opts.id || 'id';
  }

  private getType(str: string, attrVal: any): string {
    let type: string;
    attrVal = attrVal || {};

    if (_.isFunction(this.opts.typeForAttribute)) {
      type = this.opts.typeForAttribute(str, attrVal);
    }

    // If the pluralize option is on, typeForAttribute returned undefined or wasn't used
    if ((_.isUndefined(this.opts.pluralizeType) || this.opts.pluralizeType) && _.isUndefined(type)) {
      type = Inflector.pluralize(str);
    }

    if (_.isUndefined(type)) {
      type = str;
    }

    return type;
  }

  private getLinks(current: any, links: Links, dest?: any) {
    return _.mapValues(links, (value) => {
      if (_.isFunction(value)) {
        return value(this.record, current, dest);
      } else {
        return value;
      }
    });
  }

  private getMeta(current: any, meta: any) {
    return _.mapValues(meta, (value) => {
      if (_.isFunction(value)) {
        return value(this.record, current);
      } else {
        return value;
      }
    });
  }

  private pick(obj: any, attributes: any) {
    return _.mapKeys(_.pick<any, any>(obj, attributes), (value, key) => {
      return this.keyForAttribute(key);
    });
  }

  private isCompoundDocumentIncluded(included: any, item: any) {
    return _.find(this.payload.included, { id: item.id, type: item.type });
  }

  private pushToIncluded(dest: any, include: any) {
    if (!this.isCompoundDocumentIncluded(dest, include)) {
      if (!dest.included) { dest.included = []; }
      dest.included.push(include);
    }
  }

}
