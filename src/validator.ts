import { isString, isNumber, isObject, isArray, isBoolean, some } from 'lodash';
import { Validator } from './types';


export const validators: Validator[] = [
	{ type: 'req', check: () => true, parse: input => input },
	{ type: 'res', check: () => true, parse: input => input, disableAutoClose: true },
	{ type: 'user', check: () => true, parse: input => input },
	{ type: String, check: isString, parse: input => input },
	{ type: Number, check: isNumber, parse: parseInt },
	{ type: Object, check: isObject, parse: JSON.parse },
	{ type: Array, check: isArray, parse: JSON.parse },
	{ type: Boolean, check: isBoolean, parse: input => input === 'true' },
];

export function addValidator(validator: Validator) {
	if (some(validators, {type: validator.type})) {
		throw new Error(`Cannot add validator with type ${validator.type}: already parsing that!`);
	}
	validators.push(validator);
}
