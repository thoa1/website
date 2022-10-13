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
    	const collections = await(db.listCollections().toArray());
    	
    	const user_validate = !!collections.find(c => c.name == "users");
    	const contacts_validate = !!collections.find(c => c.name == "contacts");
    	
    	const choices = {collation: {locale: 'en', strength:2,}};
    	if(!user_validate){
    		const collection =await db.createCollection("users", choices);
    	}
    	
    	if( contacts_validate){
    		const collection = await db.Collection("contacts");
    		await collection.createIndex({"emails":1});
    		await collection.createIndex({"prefix":1}, choices);
    		
    	}
    	else{
    		const collection = await db.createCollection("contacts", choices);
    		await collection.createIndex({"emails":1});
    		await collection.createIndex({"prefix":1}, choices);
    	}
    	const users = db.collection("users");
    	const contacts = db.collection("contacts");
    	p.users = users;
    	p.contacts = contacts;
    	
 
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
    	const info = await c.deleteMany({});
    
      return okResult(info.deletedCount);
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
    	const info = await c.deleteMany({"userId": {userId}});
    	return okResult(info.deletedCount);
    	
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
	const NEXT_ID_KEY = 'count';
	
	async #nextId(){
		const query = {_id: NEXT_ID_KEY};
		const update = {$inc: {[NEXT_ID_KEY]: 1}};
		const choices = { upsert: true, returnDocument: 'after'};
		const ret = await this.contacts.findOneAndUpdate(query, update, choices);
		const seq = ret.value[next_id];
		return String(seq) + Math.random().toFixed(10).replace(/^0\./, '_');
	}
 	
  async create(contact) {
    //TODO any setup code
    try {
    	if (contact._id){
    		return errResult("new contact can not have id", {code: "BAD_REQ"});
    	}
    	const cID = new ObjectId().toHexString();
    	const prefix = namePrefixes(contact.name);
    	
    	const dbObject = {"_id": cID, "prefix":prefix, ...contact};
    	const ArrPre = namePrefixes(contact.name);
    	if(prefix){
    		const collection = this.contacts;
    		await this.contacts.insertOne(dbObject);
    		
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
    	const collection = this.contacts;
    	const dbEn = await collection.find({"userId": userId, "contactId": id});
    	
    	if(dbEn){
    		delete dbEn._id;
    		return okResult(dbEn);
			}
    	else{
    		return errResult("no contact for contactid", { code: 'NOT_FOUND' });
			}	
      
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
    let ret = [];
    try {
    	if(!id &&  !prefix &&email){
    		const cursor = await(this.contacts.find({"userID":userId}));
    		ret = ret.concat(await cursor.sort({name:1}).skip(index).limit(count).toArray());
			}
			if(prefix){
				const cursor = await(this.contacts.find({"userId":userId, "prefix":{$elemMatch:{$eq:prefix}}}));
				ret = ret.concat(await cursor.sort({name:1 }).skip(index).limit(count).toArray());
				
			}
			if(email){
				const cursor = await(this.contacts.find({"userID":userId, "emails":email}));
    		ret = ret.concat(await cursor.sort({name:1}).skip(index).limit(count).toArray());
			}
			if(id){
				const cursor = await(this.contacts.find({"userID":userId, "_id":id}));
    		ret = ret.concat(await cursor.sort({name:1}).skip(index).limit(count).toArray());
			}
      return okResult(ret);
    }
    catch (error) {
      console.error(error);
      return errResult(error.message, { code: 'DB' });
    }
  }



  
 	
  
}

//TODO: add auxiliary functions and definitions as needed
