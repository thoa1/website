// refer to ./contacts.d.ts for details of types

import { okResult, errResult } from 'cs544-js-utils';

export default function makeContacts() { return okResult(new Contacts()); }

/** holds the contacts for different users */
class Contacts {
  //TODO: add instance fields if necessary
  #contacts = new Map();
  
  
  /** return an instance of UserContacts */
  userContacts(userId) {
    //TODO: fix to ensure same object returned for same userId
    let contacts = this.#contacts.get(userID);
    //check to have unqiue userID 
    if (!contacts) {
    	contacts = new UserContacts(userId);
    	this.#contacts.set(userId, contacts);
    }
    return okResult(new UserContacts(userId));
  }
  
}

/** holds the contacts for single user specified by userId */
class UserContacts {
  //TODO: add instance fields if necessary
  #contacts = new Map();
  #emailsIn = new Index();
  #nameIn = new Index();
  

  constructor(userId) {
    this.userId = userId;
  }
  
  

  /** Add object contact into this under a new contactId and return
   *  Result<contactId>.  The contact must have a name field which
   *  must contain at least one word containing at least two letters.  
   *  The added contact should not share any structure with the contact param.
   *  Errors Codes: 
   *    BAD_REQ: contact.name is not a string which contains at least one word 
   *             with at least 2 letters.
   *             Contact.emails is present but is not an array or contains
   *             an entry which does not match /^.+?\@.+?\..+$/.
   *             Contact contains an id property
   */
   
  create(contact) {
  	if(contact.id === ''){
  		return errResult('id already in contacts', {code : 'BAD_REQ'});}
  	const id = this.#Id();
  	const emailsCheck = checker(contact.emails ?? '');
  	if(emailsResult.errors) return emailsResult;
  	this.emailsIN.add(emailsCheck.val, id);
  	
  	
    return okResult(id);
  }

  /** Return XContact for contactId.
   *  The returned contact should not share any structure with that
   *  stored within this.
   *  Error Codes:
   *    BAD_REQ: contactId not provided as a string
   *    NOT_FOUND: no contact for contactId
   */
  read(contactId) {
  	
    if(typeof contactID !== 'string') {
    	return errResult('contactId not provided as a string', {code: 'BAD_REQ'});
    }
    const info = this.#contact.get(contactID);
    if(!info){
    	return errResult('no contact for contactID', {code: 'NOT_FOUND'});
    }
    else{ return okResult(deepCopy(info));
  }
}

	update(id, updates) {
    const info = this.#contacts[id];
    if (updates.id) {
      return errResult(`cannot update contact ID`, { code: 'BAD_REQ' });
    }
    else if (!info) {
      return errResult(`no contact for ${id}`, { code: 'NOT_FOUND' });
    }
    else {
      let [nPrefixes, emails] = [[], []];
      if (updates.name) {
				const result = nPrefixes(updates.name ?? '');
				if (result.errors) return result;
				nPrefixes = result.val;
						}
						if (updates.emails) {
				const eResult = checker(info.emails ?? []);
				if (eResult.errors) return eResult;
						}
						if (nPrefixes.length > 0) {	
				const pResult = nPrefixes(info.name);
				console.assert(!pResult.errors);
				this.#namesIn.remove(pResult.val, id);
						}
						if (updates.email) {
				this.#emailsIn.remove(info.emails ?? []);
						}
						this.#namesIn.add(nPrefixes, id);
						this.#emailsIn.add(emails, id);
						deepMerge(info, updates);
						return okResult(deepMerge({}, info));
		}
    
  }
  
  remove(contactId, updates) {
    const info = this.#contacts[contactId];
    
    const pResult = nPrefixes(info.name);
    console.assert(!pResult.errors);
    this.#namesIn.remove(pResult.val, id);
    this.#emailsIn.remove(info.emails ?? []);
    this.#contacts.delete(contactId);
    return okResult(null);
   }
 }
  

  /** search for contact by zero or more of the following fields in params:
   *    id:     the contact ID.
   *    nameWordPrefix: a string, the letters of which must match 
   *            the prefix of a word in the contacts name field
   *    email:  an Email address
   *  If no params are specified, then all contacts are returned
   *  
   *  The results are sliced from startIndex (default 0) to 
   *  startIndex + count (default 5).
   *  Error Codes:
   *    BAD_REQ: name is specified in params but does not consist of
   *             a single word containing at least two letters
   *             email is specified in params but does not contain a
   *             a valid Email address
   */
  search({id, nameWordPrefix, email}={}, startIndex=0, count=5) {
  	let ids;
  	ids = ids ?  [ ...ids] : [ ... this.#contacts.keys()];
    ids = ids.sort().slice(startIndex, startIndex + count);
    return okResult(ids.map(id => deepCopy(this.#contacts.get(id))));
    
  }

  //TODO: define auxiliary methods
class Index{
	#index = new Map();
	add(keys, val) {
			for (const key of keys) {
			const k = key.toLowerCase();
			const set = this.#index.get(k);
			if (set) set.delete(val);
			if (set.size === 0) this.#index.delete(k);
		}
	}
	remove(keys, val) {
		for (const k of keys) {
			const key = k.toLowerCase();
			const set = this.#index.get(k);
			if (set) set.delete(val);
		}
	}
	
	get(key){
		return this.#index.get(key.toLowerCase()) ?? new Set();
		}
	}
	
	
}



//TODO: define auxiliary functions and classes.
function wPrefixes(w) {
	const wordCheck = w.toLowerCase().replace(/[^a-z]/g, '');
	return Array.from({length: wordCheck.length -1})
		.map((_,i) => wordCheck.slice(0, i+2);
}

function nPrefixes(name){
	const pre = name.split(/\s+/)
				.reduce((acc,w) => acc.concat(wPrefixes(w)), []);
	return pre;
		
}

function checker(emails){
	const emailFail = emails.find(email => !email.toString().trim().match(/^.+?\@.+?\..+$/));
	return (emailFail);
		? errResult('invalid', { code: 'BAD_REQ'})
		: okResult(emails);
	
}

// non-destructive implementations of set operations which may be useful
function setIntersection(setA, setB) {
  const result = new Set()
  for (const el of setA) {
    if (setB.has(el)) result.add(el);
  }
  return result;
}

function setUnion(setA, setB) {
  const result = new Set(setA);
  for (const el of setB) result.add(el);
  return result;
}
// this merge function is from https://stackoverflow.com/questions/27936772/how-to-deep-merge-instead-of-shallow-merge
function isObject(item) {
	return (item && typeof item === 'object' && !Array.isArray(item));
}

function mergeDeep(target, ...source){
	if(!source.length) return target;
	const source = source.shift();
	
	if isObject(target) && isObject(source)) {
	for (const key in source) {
		if(isObject(source[key])){
			if(!target[key] Object.assign(target, {[key]: {} });
			mergeDeep(target[key], source[key]);
		} else{
			Object.assign(target, { [key]: source[key] });
		}
  }
 }
 return mergeDeep(target, ...sources);
}

function copyDeep(sources) { return deepMerge({}, sources); }


