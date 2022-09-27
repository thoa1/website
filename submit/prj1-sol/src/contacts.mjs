// refer to ./contacts.d.ts for details of types

import { okResult, errResult } from 'cs544-js-utils';

export default function makeContacts() { return okResult(new Contacts()); }

/** holds the contacts for different users */
class Contacts {
  //TODO: add instance fields if necessary
  #contacts = new Map();;
  
  
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
  #emailsIN = new Index();
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
  	if(contact.id == ''){
  		return errResult('id already in contacts', {code : 'BAD_REQ'});
  	}
  	
    return okResult('TODO');
  }

  /** Return XContact for contactId.
   *  The returned contact should not share any structure with that
   *  stored within this.
   *  Error Codes:
   *    BAD_REQ: contactId not provided as a string
   *    NOT_FOUND: no contact for contactId
   */
  read(contactId) {
    return okResult('TODO');
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
    return okResults(['TODO']);
  }

  //TODO: define auxiliary methods

}


//TODO: define auxiliary functions and classes.

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

function merge(dest, src){
	for (const [k, val] of Objects.entries(src)) {
		const key = src	
  }
  
	
}

