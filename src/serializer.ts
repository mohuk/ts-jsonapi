import { SerializerOptions } from './serializer-options';
import { SerializerUtils } from './serializer-utils';
import { Links } from './types';
import * as _ from 'lodash';

export class Serializer {
  private payload: any = {};
  constructor(
    public collectionName: string,
    public opts: SerializerOptions
  ) {}

  serialize (data: any) {
    if (this.opts.topLevelLinks) {
      this.payload.links = this.getLinks(this.opts.topLevelLinks, data);
    }

    if (this.opts.meta) {
      this.payload.meta = this.opts.meta;
    }
    if (_.isArray(data)) {
      return this.collection(data);
    } else {
      return this.resource(data);
    }
  }

  collection(data: any) {
    this.payload.data = [];

    data.forEach((record: any) => {
      var serializerUtils = new SerializerUtils(this.collectionName, record,
        this.payload, this.opts);
      this.payload.data.push(serializerUtils.perform());
    });

    return this.payload;
  }

  resource(data: any) {
    this.payload.data = new SerializerUtils(this.collectionName, data, this.payload, this.opts)
      .perform();

    return this.payload;
  }

  getLinks(links: Links, data: Array<any>) {
    return _.mapValues(links, function (value) {
      if (_.isFunction(value)) {
        return value(data);
      } else {
        return value;
      }});
  }

}
