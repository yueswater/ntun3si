/**
 * API helper functions to simplify RESTful requests.
 * Uses the global axiosClient instance for consistent error handling.
 */

import axiosClient from "../api/axiosClient";

/**
 * Fetch all items from a given resource.
 * @param {string} resource
 * @returns {Promise<Array>}
 */
export async function getList(resource) {
  const res = await axiosClient.get(resource);
  return res.data;
}

/**
 * Fetch one item by ID.
 * @param {string} resource
 * @param {string|number} id
 * @returns {Promise<Object>}
 */
export async function getById(resource, id) {
  const res = await axiosClient.get(`${resource}/${id}`);
  return res.data;
}

/**
 * Fetch any resource endpoint (general GET)
 * e.g. get("/articles/slug") or get("/events/123")
 * @param {string} endpoint
 * @returns {Promise<Object>}
 */
export async function get(endpoint) {
  const res = await axiosClient.get(endpoint);
  return res.data;
}

/**
 * Create a new item.
 * @param {string} resource
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function create(resource, payload) {
  const res = await axiosClient.post(resource, payload);
  return res.data;
}

/**
 * POST request to any endpoint
 * Alias for create() but more semantic for non-CRUD operations
 * @param {string} endpoint - The endpoint path
 * @param {Object} payload - Data to send
 * @returns {Promise<Object>}
 */
export async function post(endpoint, payload) {
  const res = await axiosClient.post(endpoint, payload);
  return res.data;
}

/**
 * Update an existing item by ID.
 * @param {string} resource
 * @param {string|number} id
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function update(resource, id, payload) {
  const res = await axiosClient.put(`${resource}/${id}`, payload);
  return res.data;
}

/**
 * PATCH request to any endpoint
 * @param {string} endpoint
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function patch(endpoint, payload) {
  const res = await axiosClient.patch(endpoint, payload);
  return res.data;
}

/**
 * Delete an item by ID.
 * @param {string} resource
 * @param {string|number} id
 * @returns {Promise<void>}
 */
export async function remove(resource, id) {
  await axiosClient.delete(`${resource}/${id}`);
}

/**
 * DELETE request to any endpoint
 * @param {string} endpoint
 * @returns {Promise<void>}
 */
export async function del(endpoint) {
  await axiosClient.delete(endpoint);
}
