# 2.2.2 (2018-07-07)

- Update dependencies


# 2.2.1 (2018-01-18)

# FEATURES

- `WebError` can have text `errorCode` values as well
- Update dependencies


# 2.2.0 (2017-11-02)

## FIXES

- Add `.js.map` files to npm package
- Add comments (JSDoc) to npm package
- Close rejected async requests even if autoClose is set (`Response` object is used)
- Actions with the same route and different method won't have their middlewares interfere with each other
	- Now a middleware is applied if the route AND the method are ok. The latter is the news.
- Middlewares are applied in the same order as their declaration
- Readme fixes and update
- Test fixes

## CHANGES

- Results of `string` or a `Promise<string>` wont't be JSON-serialized
	- Technically it's a breaking change but sending JSON-serialized strings is clearly a bad practice noone should use
- Error callback changed as it was already documented
	- Debug callback already works this way


# 2.1.1 (2017-07-10)

## FIXES

- Permission name generation for actions with routes `/`, `/:*` would also generate `ctrlname:funcname`


# 2.1.0 (2017-07-10)

## CHANGES (undocumented breaking)

- `@Get('')` and other methods will register to `/ctrlname` instead of `/ctrlname/`
- Permission for `Get('')` will be `ctrlName.funcName`
- Using different permissions on same route + different method is available. Using any permission and no permission (Public) on the same route + different method is still forbidden.


# 2.0.0 (2017-06-28)

# FIXES

- Fixes in readme (typos, errors)


## BREAKING CHANGES: Renames

- `@AllowAnonymus` --> `@Public`
- `getAllWhiteList` --> `getAllPublicRoutes`
- `getWhiteList` --> `getPublicRoutes`


# 1.1.0 (2017-06-28)

## FEATURES

- Less constraints on `Body`, `Query` and `Param`: each can be used without types
- Minor undocumented change: `@Body()` won't validate `body` to be an Object


# 1.0.0 (2017-06-28)

## FEATURES

- Introduced some static messages on `AdvancedController` affecting every existing controller instances
- Role-based authentication + authorization
- `Param` decorator for routing params (e.g. `my-ctrl/action/:id`)
- `AllowAnonymus` and `Authorize` decorators
- WhiteLists
- Some checks to prevent various unintentional cases (e.g. 2 controllers using the same name)

## BREAKING CHANGES

- Rename all decorators: `camelCase` --> `PascalCase` (e.g. `get` --> `Get`)
- Type rename: `Req` --> `Request`, `Res` --> `Response`
- Rename `BaseController` --> `AdvancedController`
- Rename at `AdvancedController` instance: `getAllPermissions` --> `getPermissions`
- Default permission goes from `<ctrl>:<action>` to `<ctrl>.<action>`
- TS build: Requires full ES2015 lib (specifically: `ES2015.collections`, even more specifically: `Map`)


# 0.4.0 (2017-05-05)

## FEATURES

- Permission support on classes


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
