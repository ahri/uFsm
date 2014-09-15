'use strict';

let expect = require('chai').expect,
    uFsm = require('../ufsm');

describe('The uFsm class', function () {
  let fsm, initial = "initial";

  beforeEach(function () {
    fsm = new uFsm(initial);
  });

  it('should accept from and to states along with an evaluator to determine transition validity', function () {
    fsm.map(initial, "new state", function (input) {
      return true;
    });
  });

  it('should not map with any params', function () {
    expect(function noParams() {
      fsm.map();
    }).to.throw();
  });

  it('should not map without a truthy in-state', function () {
    expect(function noTruthyInState() {
      fsm.map(null, "out", function (input) {});
    }).to.throw();
  });

  it('should not map without a truthy out-state', function () {
    expect(function noTruthyOutState() {
      fsm.map("in", null, function (input) {});
    }).to.throw();
  });

  it('should not map without a predicate of arrity 1', function () {
    expect(function noPredicateArrity1() {
      fsm.map("in", "out", function () {});
    }).to.throw();
  });

  it('should accept input and pass it to the predicate', function (done) {
    let input = "input";

    fsm.map(initial, "next", function (predicateInput) {
      if (predicateInput !== input) {
        throw new Error("Unexpected input");
      }

      done();

      return true;
    });

    fsm.transition("input");
  });

  it('should evaluate second predicate after transitioning to first state', function (done) {
    fsm
      .map(initial, "first", function (input) {
        return true;
      })
      .map("first", "second", function (input) {
        done();

        return true;
      });

    fsm.transition("input");
    fsm.transition("input");
  });

  it('should allow mapping of two transitions from one state and correctly move to the first', function (done) {
    fsm
      .map(initial, "one", function (input) { return true; })
      .map("one", "blah", function (input) { done(); return true; })
      .map(initial, "two", function (input) { return false; });

    fsm.transition("input");
    fsm.transition("input");
  });

  it('should allow mapping of two transitions from one state and correctly move to the second', function (done) {
    fsm
      .map(initial, "one", function (input) { return false; })
      .map(initial, "two", function (input) { return true; })
      .map("two", "blah", function (input) { done(); return true; });

    fsm.transition("input");
    fsm.transition("input");
  });

  it('should throw if more than one predicate returns true', function () {
    fsm
      .map(initial, "one", function (input) { return true; })
      .map(initial, "two", function (input) { return true; });

    expect(function transitionWithMoreThanOneValidMove() { fsm.transition("input"); }).to.throw();
  });

  it('should throw if zero predicates returns true', function () {
    expect(function transitionWithZeroValidMoves() { fsm.transition("input"); }).to.throw();
  });

  it('should execute entry events async', function (done) {
    let asyncCalled = false;

    fsm
      .map(initial, "foo", function (input) { return true; })
      .onEntry("foo", function (input) { asyncCalled = true; done(); })
      .transition("input");

    expect(asyncCalled).to.be.false;
  });

  it('should execute exit events async', function (done) {
    let asyncCalled = false;

    fsm
      .map(initial, "foo", function (input) { return true; })
      .onExit(initial, function (input) { asyncCalled = true; done(); })
      .transition("input");

    expect(asyncCalled).to.be.false;
  });
});
