'use strict';
/* global describe, it */

var expect = require('chai').expect;

var JSONAPIDeserializer = require('../lib').Deserializer;

describe('JSON API Deserializer', function () {
  describe('simple JSONAPI array document', function () {
    it('should returns attributes', function (done) {
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
      expect(json).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        'first-name': 'Sandro',
        'last-name': 'Munda'
      });

      done(null, json);
    });

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
      expect(json).to.be.eql({
        id: '54735750e16638ba1eee59cb',
        firstName: 'Sandro',
        lastName: 'Munda'
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
          }
        }]
      };

      var json = new JSONAPIDeserializer({ keyForAttribute: 'camelCase' }).deserialize(dataSet);
      expect(json).to.be.an('array').with.length(2);

      expect(json[0]).to.have.key('id', 'firstName', 'lastName', 'books');
      expect(json[0].books).to.be.an('array');
      expect(json[0].books[0]).to.be.eql({
        bookTitle: 'Tesla, SpaceX.',
        isbn: '978-0062301239'
      });
      expect(json[0].books[1]).to.be.eql({
        bookTitle: 'Steve Jobs',
        isbn: '978-1451648546'
      });

      expect(json[1]).to.have.key('id', 'firstName', 'lastName',
        'books');
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
        }]
      };

      var json = new JSONAPIDeserializer().deserialize(dataSet);
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

      var json = new JSONAPIDeserializer({keyForAttribute: 'camelCase'}).deserialize(dataSet);
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

        var json = new JSONAPIDeserializer().deserialize(dataSet);
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

        expect(json[1]).to.have.key('id', 'first-name', 'last-name', 'address');

        expect(json[1].address).to.be.eql({
          id: '54735697e16624ba1eee36bf',
          'address-line1': '361 Shady Lane',
          'zip-code': '23185',
          country: 'USA',
          lock: {id: "2"}
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

        var json = new JSONAPIDeserializer().deserialize(dataSet);
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

        var json = new JSONAPIDeserializer({
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

      it('return id by default if no included found', function (done) {
        var dataSet = {
          data: [{
            type: 'users',
            id: '54735750e16638ba1eee59cb',
            attributes: {
              'first-name': 'Yevhen',
              'last-name': 'Baidiuk'
            },
            relationships: {
              address: {
                data: { type: 'address', id: '66635722e16620ba1eee36af' }
              }
            }
          }]
        };

        var json = new JSONAPIDeserializer().deserialize(dataSet);

        expect(json).to.be.an('array').with.length(1);
        expect(json[0]).to.have.key('id', 'first-name', 'last-name', 'address');
        expect(json[0].address).to.be.eql({
          id: '66635722e16620ba1eee36af'
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

        var json = new JSONAPIDeserializer().deserialize(dataSet);
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

        var json = new JSONAPIDeserializer().deserialize(dataSet);
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

        var json = new JSONAPIDeserializer().deserialize(dataSet);
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

        var json  = new JSONAPIDeserializer().deserialize(dataSet);
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

        var json = new JSONAPIDeserializer().deserialize(dataSet);
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

      var json = new JSONAPIDeserializer().deserialize(dataSet)

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
      var json = new JSONAPIDeserializer({keyForAttribute: 'snake_case'}).deserialize(dataSet)

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
            country: {
              id: "54735722e16609ba1eee36af"
            }
          }
        }
      });
    });
  });
});
