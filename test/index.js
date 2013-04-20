'use strict';

var assert = require('assert')
  , ase = assert.strictEqual
  , ade = assert.deepEqual
  , redis = require('redis')
  , AutoComplete = require('../index')

describe('AutoComplete', function() {
  var db = redis.createClient()
    , auto = new AutoComplete(db, {
      prefix: 'autocomplete:'
    , ttl: 10
    , maxLength: 300
    })

  it('should emit a `ready` event', function(done) {
    auto.ready ? done() : auto.on('ready', done)
  })

  it('should index a given term', function(done) {
    auto.index('news', function(err, resp) {
      done()
    })
  })

  it('should index a given term', function(done) {
    auto.index('new york times', function(err, resp) {
      ase(err, null)
      auto.index('new york times', function(err, resp) {
        ase(err, null)
        done()
      })
    })
  })

  it('should index a given term', function(done) {
    auto.index('netflix', function(err, resp) {
      ase(err, null)
      auto.index('netflix', function(err, resp) {
        ase(err, null)
        auto.index('netflix', function(err, resp) {
          ase(err, null)
          done()
        })
      })
    })
  })

  it('should search', function(done) {
    auto.search('ne', 40, function(err, resp) {
      ase(err, null)
      ase(resp.length, 3)
      ase(resp[0], 'netflix')
      ase(resp[1], 'new york times')
      ase(resp[2], 'news')
      done()
    })
  })

  it('should search', function(done) {
    auto.search('ne', 2, function(err, resp) {
      ase(err, null)
      ase(resp.length, 2)
      ase(resp[0], 'netflix')
      ase(resp[1], 'new york times')
      done()
    })
  })

  it('should search', function(done) {
    auto.search('asdf', 40, function(err, resp) {
      ase(err, null)
      ase(resp.length, 0)
      done()
    })
  })

  it('should delete the set', function(done) {
    auto.destroy(function(err, resp) {
      ase(err, null)
      done()
    })
  })

  it('should disconnect from redis', function(done) {
    db.on('end', done)
    db.quit()
  })
})
