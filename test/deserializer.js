'use strict';
/* global describe, it */

var expect = require('chai').expect;

var JSONAPIDeserializer = require('../lib').Deserializer;

describe('JSON API Deserializer', function () {
  describe('simple JSONAPI array document', function () {
    it('should returns data and top level meta', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: { 'first-name': 'Lawrence', 'last-name': 'Bennett' }
        }]
      };

      var json = new JSONAPIDeserializer().deserialize(dataSet);
      expect(json).to.be.an('object');

      expect(json.data).to.be.an('array').with.length(2);
      expect(json.data[0]).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        'first-name': 'Sandro',
        'last-name': 'Munda'
      });
      expect(json.data[1]).to.be.eql({
        id: '5490143e69e49d0c8f9fc6bc',
        'first-name': 'Lawrence',
        'last-name': 'Bennett'
      });

      expect(json.meta).to.be.eql({});

      done(null, json);
    });
  });

  describe('simple JSONAPI single document', function () {
    it('should returns attributes', function (done) {
      var dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }
      };

      var json = new JSONAPIDeserializer().deserialize(dataSet);

      expect(json.data).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        'first-name': 'Sandro',
        'last-name': 'Munda'
      });

      expect(json.meta).to.be.eql({});

      done(null, json);
    });

    it('should returns top level meta object', function (done) {
      var dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        },
        meta: {
          bank_name: 'SuperBank',
          'bank-account': '100$'
        }
      }
      
      var json = new JSONAPIDeserializer({
        keyForAttribute: 'camelCase'
      }).deserialize(dataSet);

      expect(json.data).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda'
      });

      expect(json.meta).to.be.eql({
        bankName: 'SuperBank',
        bankAccount: '100$'
      });

      done(null, json);
    })

    it('should return camelCase attributes', function (done) {
      var dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }
      };

      var json = new JSONAPIDeserializer({
        keyForAttribute: 'camelCase'
      }).deserialize(dataSet);

      expect(json.data).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda'
      });

      done(null, json);
    });

    it('should return meta for resource if it exists', function (done) {
      var dataSet = {
        data: {
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' },
          meta: {
            bank_account: '100$',
            'bank-Name': 'SuperBank'
          }
        }
      };

      var json = new JSONAPIDeserializer({
        keyForAttribute: 'camelCase'
      }).deserialize(dataSet);

      expect(json.data).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda',
        meta: {
          bankAccount: '100$',
          bankName: 'SuperBank'
        }
      });

      done(null, json);

    });
  });

  describe('Nested documents', function () {
    it('should returns attributes', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda',
            books: [{
              'book-title': 'Tesla, SpaceX.',
              isbn: '978-0062301239'
            }, {
              'book-title': 'Steve Jobs',
              isbn: '978-1451648546'
            }]
          },
          meta: {
            metaFieldOne: true,
            metaFieldTwo: true
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            'first-name': 'Lawrence',
            'last-name': 'Bennett',
            books: [{
              'book-title': 'Zero to One',
              isbn: '978-0804139298'
            }, {
              'book-title': 'Einstein: His Life and Universe',
              isbn: '978-0743264747'
            }]
          },
          meta: {
            metaFieldOne: false,
            metaFieldTwo: false
          }
        }]
      };

      var { data: json, meta: topLevelMeta } = new JSONAPIDeserializer({ keyForAttribute: 'camelCase' }).deserialize(dataSet);
      expect(json).to.be.an('array').with.length(2);

      expect(json[0]).to.have.key('id', 'firstName', 'lastName', 'books', 'meta');
      expect(json[0].books).to.be.an('array');
      expect(json[0].books[0]).to.be.eql({
        bookTitle: 'Tesla, SpaceX.',
        isbn: '978-0062301239'
      });
      expect(json[0].books[1]).to.be.eql({
        bookTitle: 'Steve Jobs',
        isbn: '978-1451648546'
      });

      expect(json[1].meta).to.be.eql({
        metaFieldOne: false,
        metaFieldTwo: false
      })

      expect(json[1]).to.have.key('id', 'firstName', 'lastName',
        'books', 'meta');
    
      expect(topLevelMeta).to.be.eql({});
      done(null, json);
    });
  });

  describe('Compound document', function () {
    it('should merge included relationships to attributes', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            'first-name': 'Lawrence',
            'last-name': 'Bennett'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
            }
          }
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            'address-line1': '406 Madison Court',
            'zip-code': '49426',
            country: 'USA'
          }
        }, {
          type: 'addresses',
          id: '54735697e16624ba1eee36bf',
          attributes: {
            'address-line1': '361 Shady Lane',
            'zip-code': '23185',
            country: 'USA'
          }
        }],
        meta: {
          'some-meta-field-1': 1,
          'some-meta-field-2': 2
        }
      };

      var { data: json, meta } = new JSONAPIDeserializer().deserialize(dataSet);
      expect(json).to.be.an('array').with.length(2);

      expect(json[0]).to.have.key('id', 'first-name', 'last-name',
        'address');

      expect(json[0].address).to.be.eql({
        id: '54735722e16620ba1eee36af',
        'address-line1': '406 Madison Court',
        'zip-code': '49426',
        country: 'USA'
      });

      expect(json[1]).to.have.key('id', 'first-name', 'last-name',
        'address');

      expect(json[1].address).to.be.eql({
        id: '54735697e16624ba1eee36bf',
        'address-line1': '361 Shady Lane',
        'zip-code': '23185',
        country: 'USA'
      });

      expect(meta).to.be.eql({
        'some-meta-field-1': 1,
        'some-meta-field-2': 2
      })

      done(null, json);
    });

    it('should convert relationship attributes to camelCase', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda'
          },
          relationships: {
            'my-address': {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: {
            'first-name': 'Lawrence',
            'last-name': 'Bennett'
          },
          relationships: {
            'my-address': {
              data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
            }
          }
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            'address-line1': '406 Madison Court',
            'zip-code': '49426',
            country: 'USA'
          }
        }, {
          type: 'addresses',
          id: '54735697e16624ba1eee36bf',
          attributes: {
            'address-line1': '361 Shady Lane',
            'zip-code': '23185',
            country: 'USA'
          }
        }]
      };

      var { data: json } = new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(dataSet);
      expect(json).to.be.an('array').with.length(2);

      expect(json[0]).to.have.key('id', 'firstName', 'lastName',
        'myAddress');

      expect(json[0].myAddress).to.be.eql({
        id: '54735722e16620ba1eee36af',
        addressLine1: '406 Madison Court',
        zipCode: '49426',
        country: 'USA'
      });

      expect(json[1]).to.have.key('id', 'firstName', 'lastName',
        'myAddress');

      expect(json[1].myAddress).to.be.eql({
        id: '54735697e16624ba1eee36bf',
        addressLine1: '361 Shady Lane',
        zipCode: '23185',
        country: 'USA'
      });

      done(null, json);
    });

    describe('With multiple levels', function () {
      it('should merge all include relationships to attributes', function (done) {
        var dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              'first-name': 'Lawrence',
              'last-name': 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA'
            },
            relationships: {
              lock: { data: { type: 'lock', id: '1' } }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36bf',
            attributes: {
              'address-line1': '361 Shady Lane',
              'zip-code': '23185',
              country: 'USA'
            },
            relationships: {
              lock: {
                data: { type: 'lock', id: '2' }
              }
            }
          }, {
            type: 'lock',
            id: '1',
            attributes: {
              'secret-key': 'S*7v0oMf7YxCtFyA$ffy'
            },
            relationships: {
              key: {
                data: { type: 'key', id: '1' }
              }
            }
          }, {
            type: 'key',
            id: '1',
            attributes: {
              'public-key': '1*waZCXVE*XXpn*Izc%t'
            }
          }]
        };

        var { data: json } = new JSONAPIDeserializer().deserialize(dataSet);
        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'first-name', 'last-name','address');

        expect(json[0].address).to.be.eql({
          'address-line1': '406 Madison Court',
          'zip-code': '49426',
          country: 'USA',
          id: '54735722e16620ba1eee36af',
          lock: {
            id: '1',
            'secret-key': 'S*7v0oMf7YxCtFyA$ffy',
          key: {
            id: '1',
            'public-key': '1*waZCXVE*XXpn*Izc%t'
          }
        }});

        expect(json[1]).to.have.key('id', 'first-name', 'last-name','address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          'address-line1': '361 Shady Lane',
          'zip-code': '23185',
          country: 'USA'
        });

        done();
      });
    });

    describe('With relationships data array', function () {
      it('should merge included relationships to attributes', function (done) {
        var dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              'first-name': 'Lawrence',
              'last-name': 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }],
          included: [{
            type: 'addresses',
            id: '54735722e16620ba1eee36af',
            attributes: {
              'address-line1': '406 Madison Court',
              'zip-code': '49426',
              country: 'USA'
            },
            relationships: {
              locks: {
                data: [{ type: 'lock', id: '1' }, { type: 'lock', id: '2' }]
              }
            }
          }, {
            type: 'addresses',
            id: '54735697e16624ba1eee36bf',
            attributes: {
              'address-line1': '361 Shady Lane',
              'zip-code': '23185',
              country: 'USA'
            }
          }, {
            type: 'lock',
            id: '1',
            attributes: {
              'secret-key': 'S*7v0oMf7YxCtFyA$ffy'
            }
          }, {
            type: 'lock',
            id: '2',
            attributes: {
              'secret-key': 'En8zd6ZT6#q&Fz^EwGMy'
            }
          }]
        };

        var { data: json } = new JSONAPIDeserializer().deserialize(dataSet);
        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'first-name', 'last-name',
          'address');

        expect(json[0].address).to.be.eql({
          'address-line1': '406 Madison Court',
          'zip-code': '49426',
          country: 'USA',
          id: '54735722e16620ba1eee36af',
          locks: [
            { 'secret-key': 'S*7v0oMf7YxCtFyA$ffy', id: '1' },
            { 'secret-key': 'En8zd6ZT6#q&Fz^EwGMy', id: '2' }
          ]
        });

        expect(json[1]).to.have.key('id', 'first-name', 'last-name',
          'address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          'address-line1': '361 Shady Lane',
          'zip-code': '23185',
          country: 'USA'
        });

        done(null, json);
      });
    });

    describe('Without included', function () {
      it('should use the value of valueForRelationship opt', function (done) {
        var dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
              }
            }
          }, {
            type: 'users',
            id: '5490143e69e49d0c8f9fc6bc',
            attributes: {
              'first-name': 'Lawrence',
              'last-name': 'Bennett'
            },
            relationships: {
              address: {
                data: { type: 'addresses', id: '54735697e16624ba1eee36bf' }
              }
            }
          }]
        };

        var { data: json } = new JSONAPIDeserializer({
          addresses: {
            valueForRelationship: function (relationship) {
              return {
                id: relationship.id,
                'address-line1': '406 Madison Court',
                'zip-code': '49426',
                country: 'USA'
              };
            }
          }
        }).deserialize(dataSet);

        expect(json).to.be.an('array').with.length(2);

        expect(json[0]).to.have.key('id', 'first-name', 'last-name',
          'address');

        expect(json[0].address).to.be.eql({
          id: '54735722e16620ba1eee36af',
          'address-line1': '406 Madison Court',
          'zip-code': '49426',
          country: 'USA'
        });

        expect(json[1]).to.have.key('id', 'first-name', 'last-name',
          'address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          'address-line1': '406 Madison Court',
          'zip-code': '49426',
          country: 'USA'
        });

        done(null, json);
      });
    });

    describe('With empty relationship', function () {
      it('should include the relationship as null (one-to)', function (done) {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: { data: null }
            }
          }
        };

        var { data: json } = new JSONAPIDeserializer().deserialize(dataSet);
        expect(json).eql({
          id: '54735750e16638ba1eee59cb',
          'first-name': 'Sandro',
          'last-name': 'Munda',
          'address': null
        });
        done(null, json);
      });

      it('should include the relationship as empty array (to-many)', function (done) {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              addresses: { data: [] }
            }
          }
        };

        var { data: json } = new JSONAPIDeserializer().deserialize(dataSet);
        expect(json).eql({
          id: '54735750e16638ba1eee59cb',
          'first-name': 'Sandro',
          'last-name': 'Munda',
          'addresses': []
        });
        done(null, json);
      });
    });

    describe('With null included nested relationship', function () {
      it('should ignore the nested relationship', function (done) {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Sandro',
              'last-name': 'Munda'
            },
            relationships: {
              address: {
                data: {
                  id: '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
                  type: 'address'
                }
              }
            }
          },
          included:
            [
              {
                id: '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
                type: 'address',
                attributes: {
                  'state': 'Alabama',
                  'zip-code': '35801'
                },
                relationships: {
                  telephone: {
                    data: null
                  }
                }
              }
            ]
        };

        var { data: json } = new JSONAPIDeserializer().deserialize(dataSet);
        expect(json).eql({
          id: '54735750e16638ba1eee59cb',
          'first-name': 'Sandro',
          'last-name': 'Munda',
          'address': {
            'id': '2e593a7f2c3f2e5fc0b6ea1d4f03a2a3',
            'state': 'Alabama',
            'zip-code': '35801',
            'telephone': null
          }
        });
        done(null, json);
      });
    });

    describe('Without data.attributes, resource identifier', function() {
      it('should deserialize an object without data.attributes', function(done) {
        var dataSet = {
          data: {
            type: 'users',
            id: '54735750e16638ba1eee59cb'
          }
        };

        var { data: json }  = new JSONAPIDeserializer().deserialize(dataSet);
        expect(json).eql({
          id: '54735750e16638ba1eee59cb'
        });
        done(null, json);
      });
    });

    describe('without ID', function () {
      it('ID should not be returned', function (done) {
        var dataSet = {
          data: {
            type: 'users',
            attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
          }
        };

        var { data: json } = new JSONAPIDeserializer().deserialize(dataSet);
        expect(json).to.be.eql({
          'first-name': 'Sandro',
          'last-name': 'Munda'
        });

        done(null, json);
      });
    });
  });

  describe('without callback', function () {
    it('should return promise', function (done) {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: { 'first-name': 'Sandro', 'last-name': 'Munda' }
        }, {
          type: 'users',
          id: '5490143e69e49d0c8f9fc6bc',
          attributes: { 'first-name': 'Lawrence', 'last-name': 'Bennett' }
        }]
      };

      var { data: json } = new JSONAPIDeserializer().deserialize(dataSet)

      expect(json).to.be.an('array').with.length(2);
      expect(json[0]).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        'first-name': 'Sandro',
        'last-name': 'Munda'
      });
      expect(json[1]).to.be.eql({
        id: '5490143e69e49d0c8f9fc6bc',
        'first-name': 'Lawrence',
        'last-name': 'Bennett'
      });

      done(null, json);
    });
  });


  describe('Circular references', function () {
    it('should not create an infinite loop', function () {
      var dataSet = {
        data: [{
          type: 'users',
          id: '54735750e16638ba1eee59cb',
          attributes: {
            'first-name': 'Sandro',
            'last-name': 'Munda'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }],
        included: [{
          type: 'addresses',
          id: '54735722e16620ba1eee36af',
          attributes: {
            'address-line1': '406 Madison Court',
            'zip-code': '49426'
          },
          relationships: {
            country: {
              data: { type: 'countries', id: '54735722e16609ba1eee36af' }
            }
          }
        }, {
          type: 'countries',
          id: '54735722e16609ba1eee36af',
          attributes: {
            country: 'USA'
          },
          relationships: {
            address: {
              data: { type: 'addresses', id: '54735722e16620ba1eee36af' }
            }
          }
        }]
      };
      var { data: json } = new JSONAPIDeserializer({keyForAttribute: 'snake_case'}).deserialize(dataSet)

      expect(json).to.be.an('array').with.length(1);
      expect(json[0]).to.have.key('id', 'first_name', 'last_name', 'address');
      expect(json[0].address).to.be.eql({
        address_line1: '406 Madison Court',
        zip_code: '49426',
        id: '54735722e16620ba1eee36af',
        country: {
          country: 'USA',
          id: '54735722e16609ba1eee36af',
          address: {
            address_line1: '406 Madison Court',
            zip_code: '49426',
            id: '54735722e16620ba1eee36af',
          }
        }
      });
    });
  });
});
