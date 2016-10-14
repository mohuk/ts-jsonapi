# ts-jsonapi
JSON API (De)Serializer in Typescript

[![CircleCI](https://circleci.com/gh/mohuk/ts-jsonapi/tree/master.svg?style=svg)](https://circleci.com/gh/mohuk/ts-jsonapi/tree/master)

Typescript fork from [jsonapi-serializer](https://github.com/SeyZ/jsonapi-serializer)

### Why create a fork when you could just have created type definitions?
[jsonapi-serializer](https://github.com/SeyZ/jsonapi-serializer) depends on the [bluebird](https://github.com/petkaantonov/bluebird) promise API which is no longer needed with the arrival of native promises. Also, there might not be any use of promises at all, so this might change in the future.

### test

Current implementation passes all tests from [jsonapi-serializer](https://github.com/SeyZ/jsonapi-serializer)

```bash
$ npm run test
```
