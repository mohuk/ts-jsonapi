import * as _ from 'lodash';
import { DeserializerUtils } from './deserializer-utils';

export class Deserializer {
  constructor(
    public opts: any = {}
  ){}

  deserialize(jsonapi: any, callback?: Function) {
    if (_.isArray(jsonapi.data)) {
      return this.collection(jsonapi, callback);
    } else {
      return this.resource(jsonapi, callback);
    }
  }

  collection(jsonapi: any, callback?: Function) {
    let promises: Array<Promise<any>> = [];

    promises = _.map(jsonapi.data, (d) => {
      return new DeserializerUtils(jsonapi, d, this.opts).perform();
    });

    return Promise.all(promises)
      .then((response) => {
        return _.isFunction(callback) ? callback(null, response) : response
      });
  }

  resource(jsonapi: any, callback?: Function) {
    return new DeserializerUtils(jsonapi, jsonapi.data, this.opts)
      .perform()
      .then((result: any) => {
        return _.isFunction(callback) ? callback(null, result) : result;
      });
  }
}
