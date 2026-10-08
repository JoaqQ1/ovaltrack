import { Given, When, Then } from "@cucumber/cucumber";
import assert from "node:assert/strict";

const BACKEND_URL = process.env.API_URL || "http://backend:8080";

Given(``, async function () {});
When(``, async function () {});
Then(``, async function (status,message) {
    assert.strictEqual(this.response.status,status);
    assert.strictEqual(this.response.message,message);
});
