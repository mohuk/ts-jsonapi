import * as _ from 'lodash';
import { DeserializerUtils } from './deserializer-utils';

export class Deserializer {
  constructor(
    public opts: any = {}
  ){}

  deserialize(jsonapi: any) {
    if (_.isArray(jsonapi.data)) {
      return this.collection(jsonapi);
    } else {
      return this.resource(jsonapi);
    }
  }

  collection(jsonapi: any) {
    return _.map(jsonapi.data, (d) => {
      return new DeserializerUtils(jsonapi, d, this.opts).perform();
    });
  }

  resource(jsonapi: any) {
    return new DeserializerUtils(jsonapi, jsonapi.data, this.opts)
      .perform();
  }
}
