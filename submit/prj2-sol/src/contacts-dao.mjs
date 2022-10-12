import assert from 'assert';

import { namePrefixes } from './utils.mjs';
import { okResult, errResult } from 'cs544-js-utils';
import { MongoClient } from 'mongodb';

/** return a contacts dao for mongo URL dbUrl.  If there is previous contacts
 *  data at dbUrl, the returned dao should encompass that data.
 *  Error Codes:
 *    DB: a database error was encountered.
 */
export default async function makeContactsDao(dbUrl) {
  return ContactsDao.make(dbUrl);
}

const DEFAULT_COUNT = 5;

/** holds the contacts for multiple users. All request methods
 *  should assume that their single parameter has been validated
 *  with all non-db validations.
 *  For all requests except create(), unknown request properties are ignored.
 *  For create(), the unknown request properties are stored.
 */
class ContactsDao {
  constructor(params) {
    Object.assign(this, params);
  }

  /** Factory method to create a new instance of this 
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  static async make(dbUrl) {
    //TODO any setup code
    const p = {}
    try {
    	p._client = await(new MongoClient(dbUrl)).connect();
    	const db = p.client.db();
    	const users = db.collection(USERS_COLLECTION);
    	const contacts = db.collection(CONTACTS_COLLECTION);
    	p.users = users;
    	p.contacts = contacts;
    	
    	this.#makeIn();
    	
    	return okResult(new ContactsDao(p));
    	
    
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }
  
 


  /** close off this DAO; implementing object is invalid after 
   *  call to close() 
   *
   *  Error Codes: 
   *    DB: a database error was encountered.
   */
  async close() { 
    //TODO any setup code
    try {
    	await this.client.close();
    	
      
    }
    catch (e) {
      console.error(e);
      return errResult(e.message, { code: 'DB' });
    }
  }


  /** clear out all contacts for all users; returns number of contacts
   *  cleared out. 
   *  Error Codes:
   *    DB: a database error occurred
   */
  async clearAll() {
    //TODO any setup code
    try {
    	const c = this.users;
    	const cs = await(users.find({}).toArray());
    	for(const k of cs){
    		this.clear(k._id);
    	}
      await this.contacts.deleteMany({});
      return okResult(cs.length);
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }
  
  /** Clear out all contacts for user userId; return # of contacts cleared.
   *  Error Codes:
   *    DB: a database error occurred
   */
  async clear({userId}) {
    //TODO any setup code
    try {
    	const c = this.contacts;
    	const delete_info = await collection.deleteMany({userId: {userId}});
    	return okResult(delete_info.result.n);
    	
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }

  /** Add object contact into this as a contact for user userId and
   *  return Result<contactId> where contactId is the ID for the newly
   *  added contact.  The contact will have a name field which must
   *  contain at least one word containing at least one letter.
   *
   *  Unknown properties in contact are also stored in the database.
   *
   *  Errors Codes: 
   *    BAD_REQ: contact contains an _id property
   *    DB: a database error occurred   
   */
  async create(contact) {
    //TODO any setup code
    try {
    	if (contact._id){
    		return errResult("new contact can not have id", {code: "BAD_REQ"});
    	}
    	const cID = await this.#nextId();
    	const dbObject = {_id: cID, ...contact};
    	const ArrPre = namePrefixes(contact.name);
    	if(ArrPre){
    		const collection = this.contacts;
    		await db.contacts.insertOne(dbObject);
    		
    	}
      return okResult(cID);
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }
  

  /** Return XContact for contactId for user userId.
   *  Error Codes:
   *    DB: a database error occurred   
   *    NOT_FOUND: no contact for contactId id
   */
  async read({userId, id}) {
    //TODO any setup code
    try {
      return errResult('TODO', { code: 'TODO' });
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }

  /** perform a case-insensitive search for contact for user specified
   *  by userId using zero or more of the following fields in params:
   *    id:     the contact ID.
   *    prefix: a string, the letters of which must match 
   *            the prefix of a word in the contacts name field
   *    email:  an Email address
   *  If no params are specified, then all contacts for userId are returned.
   *  The returned XContact's are sorted by name (case-insensitive).
   *  The ordering of two contacts having the same name is unspecified.
   *  
   *  The results are sliced from startIndex (default 0) to 
   *  startIndex + count (default 5).
   *  Error Codes:
   *    DB: a database error occurred   
   */
  async search({userId, id, prefix, email, index=0, count=DEFAULT_COUNT}={}) {
    //TODO any setup code
    try {
    	
      return errResult('TODO', { code: 'TODO' });
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }
  
	async #makeIn(){
  	const collection = await(db.listCollections().toArray());
  	const exists = !!collections.find(c => c.name === property);
  	
  	if (exists){
  		await db.collection(property).createIndex(property);
  		
  	}
  	else{
  		const choices = {collation: {locale: 'en', strength 2,}};
  		const collection = await db.createCollection(property, options);
  		collection.createIndex(property);
  	}
 
  }

  
 
  
}

//TODO: add auxiliary functions and definitions as needed
