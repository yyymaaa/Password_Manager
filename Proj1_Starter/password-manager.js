"use strict";

/********* External Imports ********/


const { stringToBuffer, bufferToString, encodeBuffer, decodeBuffer, getRandomBytes } = require("./lib");

let subtle;
if (typeof window !== 'undefined' && window.crypto) {
    subtle = window.crypto.subtle;
} else if (typeof crypto !== 'undefined' && crypto.subtle) {
    subtle = crypto.subtle;
} else {
    throw new Error("Web Crypto API not available");
}


/********* Constants ********/

const PBKDF2_ITERATIONS = 100000; // number of iterations for PBKDF2 algorithm
const MAX_PASSWORD_LENGTH = 64;   // we can assume no password is longer than this many characters

function pad(password) {
  let padded = password + "\0";
  return padded.padEnd(MAX_PASSWORD_LENGTH, "\0");
}

function unpad(paddedPassword) {
  const firstNull = paddedPassword.indexOf("\0");
  if (firstNull === -1) {
    return paddedPassword;
  }
  return paddedPassword.substring(0, firstNull);
}

/********* Implementation ********/
class Keychain {
  /**
   * Initializes the keychain using the provided information. Note that external
   * users should likely never invoke the constructor directly and instead use
   * either Keychain.init or Keychain.load. 
   * Arguments:
   *  You may design the constructor with any parameters you would like. 
   * Return Type: void
   */
  constructor(data, secrets) {
    //this one holds public info
    this.data = data;
    //this one holds our secret keys
    this.secrets = secrets;
  };

  /**     * Creates an empty keychain with the given password.
    *
    * Arguments:
    *   password: string
    * Return Type: void
    */
  static async init(password) {
    //this is so that even if two peopple have the same password, their keys will be different
    const salt = getRandomBytes(16);
    //import the master password; This tells the crypto-tool is a raw key
    const masterKeyMaterial = await subtle.importKey(
      "raw",
      stringToBuffer(password),
      "PBKDF2",
      false,
      ["deriveKey"]
       );

    //then we create the master key
    const masterKey = await subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: PBKDF2_ITERATIONS,
        hash: "SHA-256",
      },
      masterKeyMaterial,
      { name: "HMAC", hash: "SHA-256", length: 256 },
      true,
      ["sign"] // this one signs things
    );

    //then, we create our two secret keys, using our masterkey to sign two simple text labels
    // [FIX: These are the raw ingredients (ArrayBuffers)]
    const hmacKeyMaterial = await subtle.sign(
      "HMAC",
      masterKey,
      stringToBuffer("hmac-key")
    );

    //our scrambler key
    // [FIX: This is the raw ingredient (ArrayBuffer)]
    const aesKeyMaterial = await subtle.sign(
      "HMAC",
      masterKey,
      stringToBuffer("aes-key") // Use "aes-key" label
    );

    // [FIX: NOW WE "PACKAGE" THEM INTO OFFICIAL TOOLS (CryptoKeys)]
    const hmacKey = await subtle.importKey(
      "raw",
      hmacKeyMaterial,
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign"] // This key's job is to sign things
    );

    const aesKey = await subtle.importKey(
      "raw",
      aesKeyMaterial,
      "AES-GCM",
      true,
      ["encrypt", "decrypt"] // This key's job is to encrypt/decrypt
    );

    //we create a secret knock to check if the password is correct. If it is, we load the safe
    const passwordCheck = await subtle.sign(
      "HMAC",
      masterKey,
      stringToBuffer("password-check")
    );

    //we organize our stuff by putting all the public stuff in data
    const data = {
      salt: encodeBuffer(salt), //this is to turn raw bytes into a simple text string
      kvs: {},
      passwordCheck: encodeBuffer(passwordCheck)
    };

    const secrets = {
      // [FIX: We are now storing the *packaged tool* (CryptoKey)]
      hmacKey: hmacKey,
      aesKey: aesKey
    };

    //build the safe. We call the constructor and pass it our new data and secrets
    return new Keychain(data, secrets);
  }

  /**
    * Loads the keychain state from the provided representation (repr). The
    * ...
    */
  static async load(password, repr, trustedDataCheck) {
   
  };

  /**
    * Returns a JSON serialization of the contents of the keychain...
    */ 
  async dump() {

  };

  /**
    * Fetches the data (as a string) corresponding to the given domain...
    */
  async get(name) {

  };

  /**   * Inserts the domain and associated data into the KVS...
  */
  async set(name, value) {

  };

  /**
m   * Removes the record with name from the password manager...
    */

  async remove(name) {

};

module.exports = { Keychain };

// exposes Keychain globally if running in a browser
if (typeof window !== 'undefined') {
    window.Keychain = Keychain;
}

