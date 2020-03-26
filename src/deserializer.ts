import * as _ from 'lodash';
import { DeserializerUtils } from './deserializer-utils';

export type Response = {
  data: any;
  meta: any
}

export class Deserializer {
  constructor(
    public opts: any = {}
  ){}

  deserialize(jsonapi: any): Response {
    let response: any = {
      data: null,
      meta: DeserializerUtils.caserize(jsonapi.meta || {}, this.opts)
    };

    if (_.isArray(jsonapi.data)) {
      response.data = this.collection(jsonapi);
    } else {
      response.data = this.resource(jsonapi);
    }

    return response;
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
