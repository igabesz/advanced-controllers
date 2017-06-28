# Advanced Controllers

Features:

* MVC-like controllers for Express
* Easy configuration through `@Decorators`
* Data binding for request data (query, body, params)
* Can handle `async` functions and Promises
* Return value handling (data, exception, Promise)
* Authorization support (custom or roles and permissions)
* Written in TypeScript, compiled to ES5

See the tests for examples. See the [Change log](CHANGELOG.md) for breaking changes.


## Not documented yet

* Adding custom validators


## MVC Features

Inspired on ASP.NET MVC it is possible to create Express based controllers and actions.

```typescript
import * as web from 'advanced-controllers';

@web.Controller('/kitten')
class KittenController extends AdvancedController {
	// GET /kitten/all
	@web.Get('/all')
	getAll() { }

	// GET /kitten/details
	@web.Get()
	details() {}

	// POST /kitten/create
	@web.Post()
	create() {}

	// DELETE /kitten/delete
	@web.Del('delete')
	deleteKitten() {}
}

let kittenCtrl = new KittenController();
kittenCtrl.register(expressApp);
```

**Features:**

* Use the `@Controller('name')` decorator on the controller class
* Use the following functions: `Get`, `Post`, `Put`, `Head`, `Options`, `Del`
* The beginning `/` character in the names is optional
* The method names can be omitted. In this case the function name is used

**Caveats:**

* You have to actually *call* these functions. Good: `@Get()`, bad: `@Get`
* Use `@Del` instead of `@Delete`
* Don't forget to inherit from `AdvancedController` and call the `register()` function
* You forget to initialize `body-parser` for your Express app (so body won't be parsed)

### Registration details

You can register a single controller or all AdvancedController instances created so far.

```typescript
kittenCtrl.register(
	expressApp, // Express app
	{}, // Optional settings
);

// OR

AdvancedController.registerAll(expressApp, {});
```

Optional `settings` can have these props:

- `namespace`: Prefix for the routes (E.g. `namespace1` --> `/namespace1/ctrl/action`)
- `debugLogger`: Debug logger for registration
- `errorLogger`: Any runtime errors (E.g. Errors / promise rejects in actions -- except `WebError` instances, see below at the `WebError` section)
- `implicitPublic`: See below at Permissions

**Caveats:**

- If you use `AdvancedController.register`, use it once and do not use the instances' `register` methods.
- `AdvancedController.register` works on instantiated controllers.


## Data Binding

Tired of calling and validating `let myStuff = req.body.someVariable` in every function? Well, we try to make it a bit more comfortable. We have some limitations though but here's what we've got:

```typescript
import * as web from 'advanced-controllers';

@web.Controller('/kitten')
class KittenController extends web.AdvancedController {
	// GET /kittens/all?from=0[&cnt=25]
	@web.Get('/all')
	getKittens(
		@web.Query('from', Number) from: number,
		@web.Query('cnt', Number, true) cnt: number
	) { }

	// POST /kittens/create, body: { kitten: {} }
	@web.Post()
	create(
		@web.Body('kitten', Object) kitten: Kitten
	) {}

	// POST /kittens/create2, body: {}
	@web.Post()
	create2(@web.Body() kitten: Kitten)

	// DELETE /kittens/delete/<id>
	@web.Del('delete/:id')
	deleteKitten(@web.Param('id') id: string) {}
}
```

**Interface**

```typescript
// Whole body
export function Body(type?: any): ActionDecorator;
// Member of body object
export function Body(name: string, type?: any, optional?: boolean): ActionDecorator;
// Query winthout type
export function Query(name: string, optional?: boolean): ActionDecorator;
// Query with type
export function Query(name: string, type: any, optional?: boolean): ActionDecorator;
// Param woth or without type
export function Param(name: string, type?: any): ActionDecorator;
```

**Features:**

* Type parameter is optional
  * In `Body`: only validation
  * In `Query` and `Param`: parse + validation
  * Supported types by default: `String`, `Number`, `Object`, `Array`
* If there is no type for `Query` and `Param` then the parameter value will be a `string`
* In `Query` and `Param`: Objects and arrays in query MUST be JSON-serialized. But seriously... arrays and objects in query?
* The bound value must be present unless you set the `optional` parameter to `true`


**Caveats:**

* Don't forget about the parentheses... Good: `@Body()`, bad: `@body`
* You MUST add the *variable name* when parsing body or query parameter. We cannot parse it for you
  * Well, ehm... actually we could (like the Angular team did) but currently we don't want to. It's kinda ugly. Maybe later


## Original Request and Response

You can access the original `req` or `res` objects with similar syntax. Beware: if you ask the `res` object then we won't handle the return values for you. (Return values are discussed soon.)

```typescript
@web.Controller('casual')
class CasualController extends web.AdvancedController {
	@web.Get('fancy-function')
	fancyFunction(
		web.Req() req: web.Request,
		web.Res() res: web.Response
	) {}
}
```

**Caveats:**

* If you use `res` then you have to manually end the request, e.g. `res.send('')` (see next section)
* Parentheses... Good: `@Req()`, bad: `@Req`


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

The result will be something like this: `{ "errors": [ { "message": "some-stuff", "code": 1 }]}` + HTTP 400 header

Customization by overwriting `WebError.requestErrorTransformer`.


## Middlewares

One extra functionality is the utilization of `express.use()`. You can specify middleware calls over the actions.

```typescript
@web.Controller('middleware')
class MiddlewareTestController extends web.AdvancedController {

	middleware(req: web.Request, res: web.Response, next: Function) {
		console.log('Middleware called');
		next();
	}

	@web.Get('do-stuff')
	@web.Middleware('middleware')
	doStuff() {}

	@web.Get('do-more-stuff')
	@web.Middleware(otherMiddlewareFunction)
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

Action authorization can be controlled by the following decorators.
Controller classes and action functions can be decorated (the latter is stronger).
An action will have a single permission. (You shouldn't use multiple decorators on the same class or action function.)

- `@Permission(name?: string)`: The action requires the `name` permission (default value: `ctrl.action`)
- `@Authorize()`: The action requires an authenticated user, i.e. `req.user` object must not be `undefined`
- `@Public()`: The action does not require

The permission check can be managed 2 ways.

1. Default: custom permission check. Use a custom middleware before registering the controllers creating the following function on the request object: `req.user.hasPermission(permission: string): boolean | Promise<booleam>`. You can implement it however you'd like to
2. Role based: Call the `AdvancedController.setRoles(roles: { name: string, permissions: string[] }[])` function to set the roles and their permissions. The following array should exists: `req.user.roles: string[]`

```typescript
export interface RequestWithUser extends Request {
	user: {
		// Default: custom authorization
		hasPermission?(permission: string): boolean | Promise<boolean>;
		// Role-based authorization
		roles?: string[]
	};
}
```

You should create the `req.user.hasPermission` function OR the `req.user.roles` array in your custom authorization middleware.


### A security enforcement

If you don't use permissions (`@Permission` or `@Authorize` or `@Public`) then you can ignore this subsection.

If there are permission-related decorators in your app then you shall do at least one of the following:

- Decorate public functions (or controllers) with the `@Public` decorator
- Register the controllers with `implicitPublic`, e.g.: `AdvancedController.regiseterAll(app, { implicitPublic: true })`

This is to prevent unintentional publication of some of your actions by forgetting the `@Permission` decorator.


### Example

You can use permissions like this:

```typescript
// You can annotate this
@web.Controller('perm')
class PermissionController extends web.AdvancedController {
	// GET /perm/test1-a
	// Needs permission: 'perm.test1-a'
	@web.Permission()
	@web.Get('test1-a')
	testOneA() { return { done: true }; }

	// GET /perm/testOneB
	// Needs permission: 'perm.TestOneB'
	@web.Permission()
	@web.Get()
	testOneB() { return { done: true }; }

	// POST /perm/test2
	// Needs permission: 'perm.test-two'
	@web.Permission('perm.test-two')
	@web.Post('test2')
	testTwo() { return { done: true }; }

	// GET /perm/noPerm
	// NO permission required
	@web.Get('noperm')
	@web.Public()
	noPerm() { return { done: true }; }

	// GET /perm/authorized
	// Must be authenticated, but no explicit permission required
	@web.Get('authorized')
	@web.Authorize()
	authorized() { return { done: true}; }
}
```

### Static functions

The following static functions help the management of authorization:

- `AdvancedController.getAllPermissions(): string[]`: Aggregates the `getPermission()` results for all `AdvancedController` instances.
- `AdvancedController.getAllPublicRoutes(): string[]`: Aggregates the `getPublicRoutes()` results for all `AdvancedController` instances. This can be used to create a whitelist in he authentication middleware (e.g. skip JWT checks on these URLs). Note that the results contain `/ctrl/action` style URLs but they do NOT contain the `namespace` if there is any (i.e. NOT `/namespace/ctrl/action`).

Note that the static functions work on instantiated controllers only.


### Notes and Caveats

Notes:

* Note that this package authorizes but NOT authenticates.
* Note that only one permission check method works at a time. By default: `hasPermission`. After `AdvancedController.setRoles` is called: role-based.
* The permission-related decorator can be used on classes as well. It won't override the action-level permissions though.
* When the user is not authenticated (most commonly: `req.user` does not exists) the response is: 401 `{ errors: [{ message: "Unauthenticated" }]}`.
* When the user is authenticated but does not have the required permissions the response is: 403 `{ errors: [{ message: "Unauthorized" }]}`.

See [HTTP Status Codes Wiki][https://en.wikipedia.org/wiki/List_of_HTTP_status_codes#4xx_Client_Error].

Caveats:

* Register the middleware providing `req.user.hasPermission` or `req.user.roles` *before* registering the controller.
