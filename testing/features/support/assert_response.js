import { Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";

Then('el sistema responde con {int} y {string}', function (statusCode, statusText) {
    assert.equal(this.response.body?.message, statusText);
    assert.equal(this.response.status, statusCode);
});