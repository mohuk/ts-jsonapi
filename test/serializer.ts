/// <reference path="../node_modules/@types/mocha/index.d.ts"/>
/// <reference path="../node_modules/@types/node/index.d.ts"/>

import { Serializer } from '../src/serializer';
import * as chai from 'chai';

let expect = chai.expect;

describe('Options', () => {

  describe('id', () => {
    it('should override the id field', (done) => {
      let dataSet = [{
        _id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
      }, {
        _id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett'
      }];

      let json = new Serializer('users', {
        id: '_id',
        attributes: ['firstName', 'lastName']
      }).serialize(dataSet);

      expect(json.data[0].id).equal('54735750e16638ba1eee59cb');
      done();
    });
  });

  describe('pluralizeType', () => {
    it('should allow type to not be pluralized', (done) => {
        let dataSet = {
          id: '1',
          firstName: 'Sandro',
          lastName: 'Munda',
        };

        let json = new Serializer('user', {
          attributes: ['firstName', 'lastName'],
          pluralizeType: false
        }).serialize(dataSet);

        expect(json.data.type).equal('user');

        // Confirm it response the same with a truthy setting
        json = new Serializer('user', {
          attributes: ['firstName', 'lastName'],
          pluralizeType: true
        }).serialize(dataSet);

        expect(json.data.type).equal('users');
        done();
    });
  });

  describe('typeForAttribute', () => {
    it('should set the type according to the func return', (done) => {
      let dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      let json = new Serializer('user', {
        attributes: ['firstName', 'lastName'],
        typeForAttribute: (attribute) => {
          return attribute + '_foo';
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user_foo');
      done();
    });

    it('should pass the object as a second letiable to the func', (done) => {
      let dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        customType: 'user_foo'
      };

      let json = new Serializer('user', {
        attributes: ['firstName', 'lastName'],
        typeForAttribute: (attribute, user) => {
          return user.customType;
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user_foo');
      done();
    });

    it('should use the default behaviour when typeForAttribute returns undefined', (done) => {
      let dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        bestFriend: {
          id: '2',
          customType: 'people'
        },
        job: {
          id: '1'
        }
      };

      let json = new Serializer('user', {
        attributes: ['firstName', 'lastName', 'bestFriend', 'job'],
        typeForAttribute: (attribute, data) => {
          // sometimes this returns undefined
          return data.customType;
        },
        job: {
          ref: 'id',
          included: false
        },
        bestFriend: {
          ref: 'id',
          included: false
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('users');
      expect(json.data.relationships.job.data.type).equal('jobs');
      expect(json.data.relationships['best-friend'].data.type).equal('people');
      done();
    });

  });

  describe('typeForAttributeRecord', () => {
    it('should set a related type according to the func return based on the attribute value', (done) => {
      let dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: [{
          id: '2',
          type: 'home',
          street: 'Dogwood Way',
          zip: '12345'
        },{
          id: '3',
          type: 'work',
          street: 'Dogwood Way',
          zip: '12345'
        }]
      };

      let json = new Serializer('user', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: (user: any, address: any) => {
            return address.id;
          },
          attributes: ['street', 'zip']
        },
        typeForAttribute: (attribute, record) => {
          return (record && record.type) ? record.type : attribute;
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user');
      expect(json.included[0]).to.have.property('type').equal('home');
      expect(json.included[1]).to.have.property('type').equal('work');

      expect(json.data.relationships).to.have.property('address').that.is.an('object');
      expect(json.data.relationships.address.data[0]).to.have.property('type').that.is.eql('home');
      expect(json.data.relationships.address.data[1]).to.have.property('type').that.is.eql('work');


      done();
    });
  });

  describe('meta', () => {
    it('should set the meta key', (done) => {
      let dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
      };

      let json = new Serializer('user', {
        attributes: ['firstName', 'lastName'],
        meta: { count: 1 }
      }).serialize(dataSet);

      expect(json.meta.count).equal(1);
      done();
    });
  });

  describe('included', () => {
    it('should include or not the compound documents', (done) => {
      let dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          id: '54735722e16620ba1eee36af',
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        },
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: {
          id: '54735697e16624ba1eee36bf',
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      let json = new Serializer('user', {
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: 'id',
          included: false,
          attributes: ['addressLine1', 'zipCode', 'country']
        }
      }).serialize(dataSet);

      expect(json.data[0]).to.have.property('relationships');
      expect(json.data[1]).to.have.property('relationships');
      expect(json).to.not.have.property('included');
      done();
    });
  });

  describe('keyForAttribute', () => {

    it('should serialize attribute in underscore', (done) => {
      let Inflector = require('inflected');
      let dataSet = {
        id: '1',
        firstName: 'Sandro',
        lastName: 'Munda',
        books: [{ createdAt: '2015-08-04T06:09:24.864Z' }],
        address: { zipCode: 42912 }
      };

      let json = new Serializer('user', {
        attributes: ['firstName', 'lastName', 'books', 'address'],
        books: { attributes: ['createdAt'] },
        address: { attributes: ['zipCode'] },
        pluralizeType: false,
        keyForAttribute: (attribute) => {
          return Inflector.underscore(attribute);
        }
      }).serialize(dataSet);

      expect(json.data.type).equal('user');
      expect(json.data).to.have.property('attributes').that.is
        .an('object')
        .eql({
          'first_name': 'Sandro',
          'last_name': 'Munda',
          books: [{ 'created_at': '2015-08-04T06:09:24.864Z' }],
          address: { 'zip_code': 42912 }
        });

      done();
    });
  })

  describe('keyForAttribute case strings', () => {
    let dataSet = {
      id: '1',
      firstName: 'Sandro',
    };

    it('should default the key case to dash-case', (done) => {
      let jsonNoCase = new Serializer('user', {
        attributes: ['firstName'],
      }).serialize(dataSet);

      let jsonInvalidCase = new Serializer('user', {
        attributes: ['firstName']
      }).serialize(dataSet);
      expect(jsonNoCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonInvalidCase.data.attributes['first-name']).equal('Sandro');

      done();
    });

    it('should update the key case to dash-case', (done) => {
      let jsonDashCase = new Serializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'dash-case'
      }).serialize(dataSet);

      let jsonLispCase = new Serializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'lisp-case'
      }).serialize(dataSet);

      let jsonSpinalCase = new Serializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'spinal-case'
      }).serialize(dataSet);

      let jsonKababCase = new Serializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'kebab-case'
      }).serialize(dataSet);

      expect(jsonDashCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonLispCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonSpinalCase.data.attributes['first-name']).equal('Sandro');
      expect(jsonKababCase.data.attributes['first-name']).equal('Sandro');

      done();
    });

    it('should update the key case to underscore_case', (done) => {
      let jsonUnderscoreCase = new Serializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'underscore_case'
      }).serialize(dataSet);

      let jsonSnakeCase = new Serializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'snake_case'
      }).serialize(dataSet);

      expect(jsonUnderscoreCase.data.attributes.first_name).equal('Sandro');
      expect(jsonSnakeCase.data.attributes.first_name).equal('Sandro');

      done();
    });

    it('should update the key case to CamelCase', (done) => {
      let dataSet = {
        id: '1',
        firstName: 'Sandro',
      };

      let jsonCamelCase = new Serializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'CamelCase'
      }).serialize(dataSet);

      expect(jsonCamelCase.data.attributes.FirstName).equal('Sandro');

      done();
    });

    it('should update the key case to camelCase', (done) => {
      let dataSet = {
        id: '1',
        firstName: 'Sandro',
      };

      let jsonCamelCase = new Serializer('user', {
        attributes: ['firstName'],
        keyForAttribute: 'camelCase'
      }).serialize(dataSet);

      expect(jsonCamelCase.data.attributes.firstName).equal('Sandro');

      done();
    });
  });

  describe('ref', () => {
    it('should returns the result of the passed function', (done) => {
      let dataSet = [{
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        address: {
          addressLine1: '406 Madison Court',
          zipCode: '49426',
          country: 'USA'
        },
      }, {
        id: '5490143e69e49d0c8f9fc6bc',
        firstName: 'Lawrence',
        lastName: 'Bennett',
        address: {
          addressLine1: '361 Shady Lane',
          zipCode: '23185',
          country: 'USA'
        }
      }];

      let json = new Serializer('users', {
        id: 'id',
        attributes: ['firstName', 'lastName', 'address'],
        address: {
          ref: (collection: any, field: any) => {
            return `${collection.id}${field.country}${field.zipCode}`;
          },
          attributes: ['addressLine1', 'country', 'zipCode']
        }
      }).serialize(dataSet);

      expect(json).to.have.property('data').with.length(2);

      expect(json.data[0]).to.have.property('relationships');

      expect(json.data[0].relationships).to.be.an('object').eql({
        address: {
          data: {
            id: '54735750e16638ba1eee59cbUSA49426',
            type: 'addresses'
          }
        }
      });

      expect(json).to.have.property('included').to.be.an('array').with
        .length(2);

      expect(json.included[0]).to.be.an('object').eql({
        id: '54735750e16638ba1eee59cbUSA49426',
        type: 'addresses',
        attributes: {
          'address-line1': '406 Madison Court',
          country: 'USA',
          'zip-code': '49426'
        }
      });

      done();
    });
  });
});
