# MBS API

If MBS is installed then it exposes a small API accessible from `globalThis.mbs` (_i.e._ an `mbs` object in the global namespace). In order to safely use the API it is strongly recommended to place mbs access behind an `undefined` guard in case it isn't loaded. Note that checks against `API_VERSION.major`, while not strictly required, are recommended.

```js
if (typeof mbs !== "undefined" && mbs.API_VERSION.major === 1) {
    console.log(mbs.MBS_VERSION);
}
```

See the `mbs.d.ts` file (which can be copy/pasted into the project of your choosing) for a full overview and documentation of the API.
