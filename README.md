# Advanced Controllers

Features:

* MVC-like controllers for Express
* Easy configuration through `@decorators`
* Data binding for request data (query, body)
* Return value handling (data, exception, Promise)
* Written in TypeScript, compiled to ES5


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


## Data Binding

Tired of calling and validating `let myStuff = req.body.someVariable` in every function? Well, we try to make it a bit more comfortable. We have some limitations though but here's what we've got:

```
import * as web from 'advanced-controllers';

@web.controller('/kitten')
class KittenController extends web.BaseController {
	// GET /kittens/all?from=0[&cnt=25]
	@web.get('/all')
	getKittens(
		@web.queryNumber('from') from: number,
		@web.queryNumber('cnt', true) cnt: number
	) { }

	// POST /kittens/create, body: { kitten: {} }
	@web.post()
	create(
		@web.bodyObject('kitten') kitten: Kitten
	) {}

	@web.del('delete')
	deleteKitten() {}
}
```

**Features:**

* Parsing from query: `queryString`, `queryNumber`, `queryObject`, `queryArray`
  * Objects and arrays in query MUST be JSON-serialized
  * But seriously... arrays and objects in query?
* Parsing from body: `bodyString`, `bodyNumber`, `bodyObject`, `bodyArray`
* The bound value must be present and must be with the correct type unless you set the 2nd parameter to `true`
* Currently `body` or `query` annotations are under consideration (returning full body / query)


**Caveats:**

* Don't forget about the parentheses... Good: `@bodyString('foo')`, bad: `@bodyString`
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
* When the action executes correctly, depending on the return value
  * On `undefined`: 200
  * On non-Promise value: 200 + value `JSON.strigify`-ed
  * On Promise: waiting for the promise:
  	* On error: see error above
	* Otherwise: 200 + `undefined` OR `JSON.stringify`-ed return value

**Caveats:**

* If the action asked for `res` then there is no auto-close. In this case we don't know whether the response is closed -- or will be closed -- in the action.


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

* A tricky one: if you specify the middleware function with Arrow Syntax (`() => {}`) then the `this` reference won't refer to the controller instance when the middleware is called. This reason is TS/ES6 to ES5 transpilation: the `this` reference changes in the process and I could not bind it.
