# Advanced Controllers

Features:

* MVC-like controllers for Express
* Easy configuration through `@decorators`
* Data binding for request data (query, body)
* Return value handling (data, exception, Promise)
* Authorization support
* Written in TypeScript, compiled to ES5

See the tests for examples.


## Not documented yet

We DO HAVE these functions but it takes much time to make documentations, so I'll do it later. Create an issue or check the source if interested.

* `body` annotation checking the whole `request.body` object
* Adding custom validators
* Usage with `async` action functions

See the [Change log](CHANGELOG.md) for breaking changes.


## MVC Features

Inspired on ASP.NET MVC it is possible to create Express based controllers and actions.

```
import * as web from 'advanced-controllers';

@controller('/kitten')
class KittenController extends BaseController {
	// GET /kitten/all
	@web.get('/all')
	getAll() { }

	// GET /kitten/details
	@web.get()
	details() {}

	// POST /kitten/create
	@web.post()
	create() {}

	// DELETE /kitten/delete
	@web.del('delete')
	deleteKitten() {}
}

let kittenCtrl = new KittenController();
kittenCtrl.register(expressApp);
```

**Features:**

* Use the `@controller('name')` decorator on the controller class
* Use the following functions: `get`, `post`, `put`, `head`, `options`, `del`
* The beginning `/` character in the names is optional
* The method names can be omitted. In this case the function name is used

**Caveats:**

* You have to actually *call* these functions. Good: `@get()`, bad: `@get`
* Use `@del` instead of `@delete`
* Don't forget to inherit from `BaseController` and call the `register()` function
* You forget to initialize `body-parser` for your Express app (so body won't be parsed)

### Registration details

```
kittenCtrl.register(
	expressApp, // Express app
	() => {},   // [OPTIONAL] Logger function for registration and runtime errors
	'animals',  // [OPTIONAL] Namespace for ctrl, e.g. 'GET /animals/kitten/all'
);
```


## Data Binding

Tired of calling and validating `let myStuff = req.body.someVariable` in every function? Well, we try to make it a bit more comfortable. We have some limitations though but here's what we've got:

```
import * as web from 'advanced-controllers';

@web.controller('/kitten')
class KittenController extends web.BaseController {
	// GET /kittens/all?from=0[&cnt=25]
	@web.get('/all')
	getKittens(
		@web.query('from', Number) from: number,
		@web.query('cnt', Number, true) cnt: number
	) { }

	// POST /kittens/create, body: { kitten: {} }
	@web.post()
	create(
		@web.body('kitten', Object) kitten: Kitten
	) {}

	@web.del('delete')
	deleteKitten() {}
}
```

**Features:**

* Parsing from query: `query` with these types: `String`, `Number`, `Object`, `Array`
  * Objects and arrays in query MUST be JSON-serialized
  * But seriously... arrays and objects in query?
* Parsing from body: `String`, `Number`, `Object`, `Array`
* The bound value must be present and must be with the correct type unless you set the 2nd parameter to `true`
* Currently `body` or `query` annotations are under consideration (returning full body / query)


**Caveats:**

* Don't forget about the parentheses... Good: `@body('foo', String)`, bad: `@body`
* You MUST add the *variable name* when parsing body or query parameter. We cannot parse it for you
  * Well, ehm... actually we could (like the Angular team did) but currently we don't want to. It's kinda ugly. Maybe later


## Original Request and Response

You can access the original `req` or `res` objects with similar syntax. Beware: if you ask the `res` object then we won't handle the return values for you. (Return values are discussed soon.)

```
@web.controller('casual')
class CasualController extends web.BaseController {
	@get('fancy-function')
	fancyFunction(
		web.req() req: web.Req,
		web.res() res: web.Res
	) {}
}
```

**Caveats:**

* If you use `res` then you have to manually end the request, e.g. `res.send('')` (see next section)
* Parentheses... Good: `@req()`, bad: `@req`


## Return values

By default the response is closed automatically with a status code and sometimes with data

* Missing bound parameter: 400
* When the action throws an error:
  * If the error has a `statusCode` property ending with `statusCode`
  * Otherwise 500
  * If the error has a `json` field then it will be sent as JSON
  * If the error has a `text` field then it will be sent as plain text
  * Default error parsing error sends back `{ "errors": [ { "message": "some-stuff" }]}`
* When the action executes correctly, depending on the return value
  * On `undefined`: 200
  * On non-Promise value: 200 + value `JSON.strigify`-ed
  * On Promise: waiting for the promise:
  	* On error: see error above
	* Otherwise: 200 + `undefined` OR `JSON.stringify`-ed return value

**Caveats:**

* If the action asked for `res` then there is no auto-close. In this case we don't know whether the response is closed -- or will be closed -- in the action.


## `WebError` object

This object extends `Error` and can be used to conveniently send back custom HTTP codes, error messages and codes. Feel free to throw it in actions, the framework will handle it.

* `new WebError(message: string)`, sending HTTP status code 500 by default
* `new WebError(message: string, statusCode: number)`
* `new WebError(message: string, settings: { statusCode?: number, errorCode?: number})`, the `errorCode` will be in the result JSON as `errors[0].code`

The result will be something like this: `{ "errors": [ { "message": "some-stuff", "code": 1 }]}`

Customization by overwriting `WebError.requestErrorTransformer`.


## Middlewares

One extra functionality is the utilization of `express.use()`. You can specify middleware calls over the actions.

```
@web.controller('middleware')
class MiddlewareTestController extends web.BaseController {

	middleware(req: web.Req, res: web.Res, next: Function) {
		console.log('Middleware called');
		next();
	}

	@web.get('do-stuff')
	@web.middleware('middleware')
	doStuff() {}

	@web.get('do-more-stuff')
	@web.middleware(otherMiddlewareFunction)
	doMoreStuff() {}
}
```

**Functions:**

* Call a controller function -- function name (as string) in parameter
* Call directly a function -- function reference in parameter
* In both cases on middleware call the `this` reference will be the controller instance

**Limitations:**

* There's no way to add global middleware, won't be, do it manually
* There's no way to add class-specific middleware (this might change)
* There's no way to add independent middlewares with custom / RegEx routes, do it manually

**Caveats:**

* A tricky one: if you specify the middleware function with Arrow Syntax (`() => {}`) then the `this` reference won't refer to the controller instance when the middleware is called. The reason is TS/ES6 to ES5 transpilation: the `this` reference changes in the process and I could not bind it.


## Permissions

This app does authorize but it needs the user to be authenticated. Please create an Express middleware providing the following interface.

```
export interface RequestWithUser extends Req {
	user: {
		hasPermission(permission: string): boolean | Promise<boolean>;
	};
}
```

You can use permissions like this:

```
@web.controller('perm')
class PermissionController extends web.BaseController {
	// GET /perm/test1-a
	// Needs permission: 'perm:test1-a'
	@web.permission()
	@web.get('test1-a')
	testOneA() { return { done: true }; }

	// GET /perm/testOneB
	// Needs permission: 'perm:TestOneB'
	@web.permission()
	@web.get()
	testOneB() { return { done: true }; }

	// POST /perm/test2
	// Needs permission: 'perm:test-two'
	@web.permission('perm:test-two')
	@web.post('test2')
	testTwo() { return { done: true }; }

	// GET /perm/noPerm
	// NO permission required
	@web.get('noperm')
	noPerm() { return { done: true }; }
}
```

Notes

* The `permission` decorator can be used on classes as well. It won't override the action-level permissions.
* When the user is not authenticated (i.e. `req.user.hasPermission` does not exists) the response is: 401 `{ errors: [{ message: "Unauthenticated" }]}`.
* When the user is authenticated but does not have the required permissions the response is: 403 `{ errors: [{ message: "Unauthorized" }]}`.

See [HTTP Status Codes Wiki][https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#4xx_Client_Error].

Caveats:

* Register the middleware providing `req.user.hasPermission` *before* registering the controller.
* This feature supports only permission-based authentication. If you have *roles* then you should map them somehow to permissions during authentication.
