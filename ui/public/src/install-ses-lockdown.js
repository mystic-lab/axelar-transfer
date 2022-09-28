/* eslint-disable import/no-extraneous-dependencies */
/* global lockdown */
import 'ses/dist/ses.umd'; // adds lockdown, harden, and Compartment
import '@endo/eventual-send/shim'; // adds support needed by E

const errorTaming = process.env.NODE_ENV === 'development' ? 'unsafe' : 'safe';

// Help lock down the JS environment.  The start compartment (current evaluation context)
// can still access powerful globals, but this start compartment can use `new Compartment(...)`
// to evaluate code with stricter confinement.
lockdown({
  errorTaming,
  overrideTaming: 'severe',
});

Error.stackTraceLimit = Infinity;
