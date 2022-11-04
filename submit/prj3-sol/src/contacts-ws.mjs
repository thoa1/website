import Path from 'path';

import cors from 'cors';
import express from 'express';
import STATUS from 'http-status';  //HTTP status codes
import assert from 'assert';
import bodyParser from 'body-parser';
import { okResult, errResult } from 'cs544-js-utils';

import { DEFAULT_COUNT } from './defs.mjs';
import { STATUS_CODES } from 'http';

export default function serve(model, base='') {
  const app = express();
  cdThisDir();
  app.locals.model = model;
  app.locals.base = base;
  app.use(express.static('statics'));
  setupRoutes(app);
  return okResult(app);
}


/** set up mapping between URL routes and handlers */
function setupRoutes(app) {
  const base = app.locals.base;
  app.use(cors({ exposedHeaders: [ 'Location' ]}));
  app.use(bodyParser.json());
  if (false) { //make true to see incoming requests
    app.use((req, res, next) => {
      console.log(req.method, requestUrl(req));
      next();
    });
  }

  //TODO: add routes here

  app.get(`${base}/:userId/:contactId`, doQueryContact(app));
  app.get(`${base}/:userId`, doQueryUser(app));
  app.post(`${base}/:userId`, doCreateContact(app));
  app.patch(`${base}/:userId/:contactId`, doUpdateContact(app));
  app.delete(`${base}/:userId/:contactId`, doDeleteContact(app));

  //must be last
  app.use(do404(app));
  app.use(doErrors(app));
}

/****************************** Route Handlers *************************/

//TODO: add route handlers

function doQueryContact(app){
  return (async function(req, res){
    try{
      const userId = req.params.userId;
      const contactId = req.params.contactId;
      const result = await app.locals.model.read({"userId": userId, "id": contactId});
      if(result.errors) throw result;
      res.location(`${userId}/${contactId}`);
      res.json(addSelfLinks(req, result.val));
    }
    catch(err){
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doQueryUser(app){
  return (async function(req, res){
    try{
      const userId = req.params.userId;
      const query = {...req.query};
      if(query.index === undefined) query.index = 0;
      if(query.count === undefined) query.count = DEFAULT_COUNT;
      query.count++;
      const result = await app.locals.model.search({"userId": userId, ...query});
      if(result.errors) throw result;
      res.json(addPagingLinks(req, result.val));

    }
    catch(err){
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doUpdateContact(app){
  return (async function(req, res){
    try{
      const userId = req.params.userId;
      const contactId = req.params.contactId;
      const updates = req.body;
      const result = await app.locals.model.update({"userId": userId, "id": contactId, ...updates});
      if(result.errors) throw result;
      res.location(`${userId}/${contactId}`);
      res.json(addSelfLinks(req, result.val));
    }
    catch(err){
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

  

function doCreateContact(app){
  return (async function(req, res){
    try{
      const my_userId = req.params;
      const contact = req.body;
      const result = await app.locals.model.create({...my_userId, ...contact});
      if(result.errors) throw result;
      const createdContact = result.val;
      const send = requestUrl(req)+"/"+createdContact;
      res.location(send);
      res.status(STATUS.CREATED).json(selfResult(req, createdContact, 'POST'));
    }
    catch(err){
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  });
}

function doDeleteContact(app){
  return (async function(req, res){
    try{
      const userId = req.params.userId;
      const contactId = req.params.contactId;
      const result = await app.locals.model.delete({"userId": userId, "id": contactId});
      if(result.errors) throw result;
      res.location(`${userId}/${contactId}`);
      res.status(STATUS.NO_CONTENT).json(selfResult(req, undefined, 'DELETE'));
    }
    catch(err){
      const mapped = mapResultErrors(err);
      res.status(mapped.status).json(mapped);
    }
  })
}

/** Default handler for when there is no route for a particular method
 *  and path.
 */
function do404(app) {
  return async function(req, res) {
    const message = `${req.method} not supported for ${req.originalUrl}`;
    const result = {
      status: STATUS.NOT_FOUND,
      errors: [	{ code: 'NOT_FOUND', message, }, ],
    };
    res.status(STATUS.NOT_FOUND).json(result);
  };
}


/** Ensures a server error results in nice JSON sent back to client
 *  with details logged on console.
 */ 
function doErrors(app) {
  return async function(err, req, res, next) {
    const result = {
      status: STATUS.INTERNAL_SERVER_ERROR,
      errors: [ { code: 'SERVER_ERROR', message: err.message } ],
    };
    res.status(STATUS.INTERNAL_SERVER_ERROR).json(result);
    console.error(result.errors);
  };
}

/************************* HATEOAS Utilities ***************************/

/** Return original URL for req (excluding query params) */
function requestUrl(req) {
  const url = req.originalUrl.replace(/\/?(\?.*)?$/, '');
  return `${req.protocol}://${req.get('host')}${url}`;
}

function selfResult(req, result, method=undefined){
  return { result, _links: { self: { href: queryUrl(req), method } } };
}

/** Return req URL with query params appended */
function queryUrl(req, query={}) {
  const url = new URL(requestUrl(req));
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.href;
}

/** Return object containing { result: obj, links: [{ rel: 'self',
 *  name: 'self', href }] } where href is req-url + suffix /obj[id] if
 *  id.
 */
function addSelfLinks(req, obj, id=undefined) {
  const baseUrl = requestUrl(req);
  const href = (id) ? `${baseUrl}/${obj[id]}` : baseUrl;
  const links = [ { rel: 'self', name: 'self', href } ];
  return {result: obj,  links: links };
}

/** Wrap results in paging links.  Specifically, return 
 *  { result, links: [self, next, prev] } where result
 *  is req-count prefix of results with each individual
 *  result wrapped in a self-link. self will always
 *  be present, next/prev are present if there
 *  are possibly more/earlier results.
 */
function addPagingLinks(req, results, selfId=undefined) {
  const links = [
    { rel: 'self', name: 'self', href: queryUrl(req, req.query) }
  ];
  const count = Number(req.query?.count ?? DEFAULT_COUNT);
  const nResults = results.length;  //may be 1 more than count
  const next = pagingUrl(req, nResults, +1);
  if (next) links.push({ rel: 'next', name: 'next', href: next });
  const prev = pagingUrl(req, nResults, -1);
  if (prev) links.push({ rel: 'prev', name: 'prev', href: prev });
  const results1 =
	results.slice(0, count).map(obj => addSelfLinks(req, obj, selfId));
  return { result: results1, links: links };
}

/** Return paging url (dir == +1: next; dif == -1: prev);
 *  returns null if no paging link necessary.
 *  (no prev if index == 0, no next if nResults <= count).
 */
//index and count have been validated  
function pagingUrl(req, nResults, dir) {
  const q = req.query;
  const index = Number(q?.index ?? 0);
  const count = Number(q?.count ?? DEFAULT_COUNT);
  const index1 = (index + dir*count) < 0 ? 0 : (index + dir*count);
  const query1 = Object.assign({}, q, { index: index1 });
  return ((dir > 0 && nResults <= count) || (dir < 0 && index1 === index))
         ? null
         : queryUrl(req, query1);
}

/*************************** Mapping Errors ****************************/

//map from domain errors to HTTP status codes.  If not mentioned in
//this map, an unknown error will have HTTP status BAD_REQUEST.
const ERROR_MAP = {
  EXISTS: STATUS.CONFLICT,
  NOT_FOUND: STATUS.NOT_FOUND,
  DB: STATUS.INTERNAL_SERVER_ERROR,
  INTERNAL: STATUS.INTERNAL_SERVER_ERROR,
}

/** Return first status corresponding to first option.code in
 *  appErrors, but SERVER_ERROR dominates other statuses.  Returns
 *  BAD_REQUEST if no code found.
 */
function getHttpStatus(appErrors) {
  let status = null;
  for (const appError of appErrors) {
    const errStatus = ERROR_MAP[appError.options?.code];
    if (!status) status = errStatus;
    if (errStatus === STATUS.INTERNAL_SERVER_ERROR) status = errStatus;
  }
  return status ?? STATUS.BAD_REQUEST;
}

/** Map domain/internal errors into suitable HTTP errors.  Return'd
 *  object will have a "status" property corresponding to HTTP status
 *  code.
 */
function mapResultErrors(err) {
  const errors = err.errors ||
    [ { message: err.message, options: { code: 'INTERNAL' } } ];
  const status = getHttpStatus(errors);
  if (status === STATUS.INTERNAL_SERVER_ERROR) {
    console.error(err);
  }
  return { status, errors, };
} 

/**************************** Misc Utilities ***************************/

/** return query[key] as a non-neg int; error if not */
function getNonNegInt(query, key, defaultVal) {
  const n = query[key];
  if (n === undefined) {
    return defaultVal;
  }
  else if (!/^\d+$/.test(n)) {
    const message = `${key} "${n}" must be a non-negative integer`;
    return {errors: [{ message, options: { code: 'BAD_VAL', widget: key}}]};
  }
  else {
    return Number(n);
  }
}

/** change dir to directory containing this file */
function cdThisDir() {
  try {
    const path = new URL(import.meta.url).pathname;
    const dir = Path.dirname(path);
    process.chdir(dir);
  }
  catch (err) {
    console.error(`cannot cd to this dir: ${err}`);
    process.exit(1);
  }
}

