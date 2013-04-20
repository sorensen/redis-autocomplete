'use strict';

/*!
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , fs = require('fs')
  , redis = require('redis')
  , Lua = require('redis-lua-loader')
  , tick = process.nextTick
  , toString = Object.prototype.toString

/**
 * AutoComplete constructor
 *
 * @param {Object} redis db client
 * @inherits EventEmitter
 * @event `ready`: Emitted when lua and redis client ready
 */

function AutoComplete(client, options) {
  var self = this, len = 2
  options || (options = {})
  this.client = client
  this.prefix = options.prefix || 'autocomplete:'
  this.maxLength = options.maxLength || 300
  this.ttl = options.ttl || 0

  // Load the related lua scripts
  this.lua = new Lua(client, {
    dirname: __dirname + '/lua'
  })
  // Ready callback
  function ready() {
    if (!--len) {
      self.ready = true
      self.emit('ready')
    }
  }
  // Wait for redis client ready event
  if (this.client.ready) ready()
  else this.client.on('ready', ready) 

  // Wait for lua client ready event
  if (this.lua.ready) ready()
  else this.lua.on('ready', ready) 
}

/*!
 * Inherit from EventEmitter.
 */

AutoComplete.prototype.__proto__ = EventEmitter.prototype

/**
 * Small helper for parsing a newline `\n` delemited file and
 * indexing all terms found inside. Mainly for testing / example.
 *
 * @param {String} file path
 * @param {Function} callback
 */

AutoComplete.prototype.parseFile = function(filepath, next) {
  var self = this
  fs.readFile(filepath, 'utf-8', function(err, data) {
    data = data.split('\n')
    var len = data.length
    data.forEach(function(line) {
      tick(function() {
        self.index(line, function() { --len || next() })
      })
    })
  })
  return this
}

/**
 * Search for a given term or partial term and get the results
 * ordered by score up to a given `count`. If `-1` is used
 * as the count, then return all results found.
 *
 * @param {String} search term
 * @param {Number} max results (optional, default 5)
 * @param {Function} callback
 */

AutoComplete.prototype.search = function(term, count, next) {
  var self = this
  if (toString.call(count) === '[object Function]') {
    next = count
  }
  if (isNaN(+count)) count = 5
  this.lua.search(0, this.prefix, term, count, function(err, resp) {
    return next(err, resp)
  })
  return this
}

/**
 * Store and index a given term, increasing its frequency score
 * for all sets contained in if it already exists. For any set 
 * iterated on, each one will be set to expire with the current
 * `ttl` and truncated if `maxLength` is reached.
 *
 * @param {String} search term
 * @param {Function} callback
 */

AutoComplete.prototype.index = function(term, next) {
  this.lua.index(0, this.prefix, this.ttl, this.maxLength, term, function(err, resp) {
    return next(err, resp)
  })
  return this
}

/**
 * Remove a given term from all sets contained in
 *
 * @param {String} search term
 * @param {Function} callback
 */

AutoComplete.prototype.remove = function(term, next) {
  this.lua.remove(0, this.prefix, term, function(err, resp) {
    return next(err, resp)
  })
}

/**
 * WARNING: This will remove all autocomplete data
 * Remove the current autocomplete datasets from the database
 *
 * @param {Function} callback
 */

AutoComplete.prototype.destroy = function(next) {
  this.lua.destroy(0, this.prefix, function(err, resp) {
    return next(err, resp)
  })
}

/*!
 * Module exports.
 */

module.exports = AutoComplete
