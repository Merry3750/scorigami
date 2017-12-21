"use strict";

var DATABASE_URL = "postgres://{{USERNAME}}:{{PASSWORD}}@{{SERVER HOST}}:{{PORT}}/{{DATABASE NAME}}";
var ADD_DEBUG_TABLES = true; //creates a second set of tables, identical to the first set that can be used for testing




module.exports = {
	DATABASE_URL: DATABASE_URL,
	ADD_DEBUG_TABLES: ADD_DEBUG_TABLES
};