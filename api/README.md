# MBS API

If MBS is installed then it exposes a small API accessible from `globalThis.mbs` (_i.e._ an `mbs` object in the global namespace). In order to safely use the API it is strongly recommended to place mbs access behind an `undefined` guard in case it isn't loaded. Note that checks against `API_VERSION.major`, while not strictly required, are recommended.

```js
if (typeof mbs !== "undefined" && mbs.API_VERSION.major === 1) {
    console.log(mbs.MBS_VERSION);
}
```

See the `mbs.d.ts` file (which can be copy/pasted into the project of your choosing) for a full overview and documentation of the API.

## Wheel of fortune event listeners

```ts
const MySdkInfo: import("bondage-club-mod-sdk").ModSDKModInfo;

mbs.wheelEvents.addEventListener(
    "beforeItemEquip",
    MySdkInfo,
    {
        listener(ev, kwargs) {
            const difficulty = kwargs.difficulty;
            if (difficulty.type === "number") {
                ev.difficultyModifier += kwargs.difficulty.value;
            }
        },
        hookName: "myDifficultyHook",
        label: "Increase the difficulty of the equipped item(s)",
        kwargs: {
            difficulty: {
                type: "number",
                default: 5,
                min: 0,
                max: 10,
            },
        },
    },
);

mbs.wheelEvents.addEventListener(
    "beforeItemEquip",
    MySdkInfo,
    {
        listener(ev, kwargs) {
            const color = kwargs.color;
            if (color.type === "select" && color.value != null) {
                ev.color.fill(color.value);
            }
        },
        hookName: "myRGBHook",
        label: "Color all items either red, green or blue",
        kwargs: {
            color: {
                type: "select",
                options: [
                    { label: "Red", value: "#FF0000" },
                    { label: "Green", value: "#00FF00" },
                    { label: "Blue", value: "#0000FF" },
                ],
            },
        },
    },
);

mbs.wheelEvents.addEventListener(
    "validateItemEquip",
    MySdkInfo,
    {
        listener(ev, kwargs) {
            if (ev.newAsset.Name.includes("x")) {
                return `Asset ${ev.newAsset.Name} contains the letter "x"`;
            }
        },
        hookName: "myAntiXHook",
        label: 'Ignore all potentially to-be equipped items whose name contains the letter "x"',
    },
);

mbs.wheelEvents.addEventListener(
    "afterOutfitEquip",
    MySdkInfo,
    {
        listener(ev, kwargs) {
            ChatRoomSendLocal("Hello world!");
        },
        hookName: "helloWorld",
        label: 'Show a "Hello world!" message in chat after equipping the outfit',
        description: [
            "Note that the message is only shown locally to yourself; "
            "no one else in the room will be able to see it",
        ],
    },
);
```
