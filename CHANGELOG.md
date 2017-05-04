# 0.3.2 (2017-05-04)

## FIXES

* Fix enables using controller classes having a member variable with `function` type


# 0.3.1 (2017-02-23)

## FEATURES

* `WebError` can be used to send back a `code` besides a message. `{ errors: [ { message: string, code?: number }] }`

No breaking change, only extension.


# 0.3.0 (2017-01-11)

## FEATURES

* Permission support
* Namespace support

## BREAKING CHANGES

* Obsolete decorators like `@queryString` and `@bodyNumber` are removed

## NOTES

* Code is restructured into several files
* Removed `typings`, now using `@types/<name>` NPM packages
* `Promise` objects were already required; now TS build explicitly requires `es2015.promise`
* Minor git and package config changes
* Planning to go to `es2015` package build


# 0.2.0 (2016-04-17)

### FEATURES

* Can parse whole body (#2)
* Custom validation and parsing can be added
* Error handling is more customizable: can send back plain text or JSON object
  * Default settings: sending back something like [JSON API](http://jsonapi.org/format/): `"{"errors":[{"message":"<ERROR-MSG>"}]}"`
* `@queryTYPE` and `@bodyTYPE` are obsolete; use `@query(name, type, opt?)` instead

### BREAKING CHANGES

* Error messages are not plain text but JSON objects by default
