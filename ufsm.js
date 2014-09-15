'use strict';

function asyncEvents(stateSubscriptions, state, input) {
  if (stateSubscriptions[state] === undefined) {
    return;
  }

  for (var i = 0; i < stateSubscriptions[state].length; i++) {
    (function close(i) {
      process.nextTick(function () {
        stateSubscriptions[state][i].func.call(stateSubscriptions[state][i].context, input);
      });
    })(i);
  }
}

function addSubscription(stateSubscriptions, state, func, context) {
  if (stateSubscriptions[state] === undefined) {
    stateSubscriptions[state] = [];
  }

  stateSubscriptions[state].push({
    func: func,
    context: context
  });
};

function uFsm(initialState) {
  this._states = {};
  this._entry = {};
  this._exit = {};

  this._validState = function (state) {
    if (!state) {
      throw new Error("Must provide valid state");
    }

    return "" + state;
  };

  this._resolveNextState = function (input) {
    var candidates = [];

    for (var outState in this._states[this._state]) {
      if (this._states[this._state][outState](input)) {
        candidates.push(outState);
      }
    }

    if (candidates.length > 1) {
      throw new Error("Cannot transition as more than one valid candidate is available from [" + this._state + "]: [" + candidates.join("], [") + "]");
    }

    if (candidates.length === 0) {
      throw new Error("Cannot transition as no valid candidates are available from [" + this._state + "]");
    }

    return candidates[0];
  };

  this._state = this._validState(initialState);
}

uFsm.prototype.map = function (inState, outState, predicate) {
  inState = this._validState(inState);
  outState = this._validState(outState);
  if (predicate.call === undefined || predicate.apply === undefined || predicate.length != 1) {
    throw new Error("A predicate with an arrity of 1 is required");
  }

  if (this._states[inState] === undefined) {
    this._states[inState] = {};
  }

  this._states[inState][outState] = predicate;

  return this;
};

uFsm.prototype.transition = function (input) {
  var nextState = this._resolveNextState(input);

  asyncEvents(this._exit, this._state, input);
  this._state = nextState;
  asyncEvents(this._entry, this._state, input);
};

uFsm.prototype.onEntry = function (state, func, context) {
  addSubscription(this._entry, state, func, context);
  return this;
};

uFsm.prototype.onExit = function (state, func, context) {
  addSubscription(this._exit, state, func, context);
  return this;
};

module.exports = uFsm;
