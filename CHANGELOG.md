# 0.2.0 (2016-04-17)

### FEATURES

* Can parse whole body (#2)
* Custom validation and parsing can be added
* Error handling is more customizable: can send back plain text or JSON object
  * Default settings: sending back something like [JSON API](http://jsonapi.org/format/): `"{"errors":[{"message":"<ERROR-MSG>"}]}"`

### BREAKING CHANGES

* No more `queryTYPE` and `bodyTYPE`. Rather call `query(name, type, opt?)`
* Error messages are not plain text but JSON objects by default
