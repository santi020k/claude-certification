import type { components, paths } from "./openapi";

export type ApiPaths = paths;
export type ApiSchemas = components["schemas"];

export type AskRequest = ApiSchemas["AskRequest"];
export type AskResponse = ApiSchemas["AskResponse"];
export type HealthResponse = ApiSchemas["HealthResponse"];
