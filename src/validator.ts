import * as _ from 'lodash';
import { Validator } from './types';


export const validators: Validator[] = [
	{ type: 'req', check: input => true, parse: input => input },
	{ type: 'res', check: input => true, parse: input => input, disableAutoClose: true },
	{ type: String, check: _.isString, parse: input => input },
	{ type: Number, check: _.isNumber, parse: parseInt },
	{ type: Object, check: _.isObject, parse: JSON.parse },
	{ type: Array, check: _.isArray, parse: JSON.parse },
];

export function addValidator(validator: Validator) {
	if (_.some(validators, {type: validator.type})) {
		throw new Error(`Cannot add validator with type ${validator.type}: already parsing that!`);
	}
	validators.push(validator);
}
