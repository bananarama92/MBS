# Maid's Bondage Scripts
A repo with a number of Bondage Club-related additions, including:
* More crafting slots
* Additional bondage-heavy outfits for the wheel of fortune, including the likes of:
  * PSO (Permanently Sealed Object) uniforms
  * Bondage maids
  * Wrapped up mummies
  * Petrified statue
* Backports of a number of BC bug fixes (subject to change based on the particular release cycle)
* The ability to create custom wheel of fortune outfits that can be used by you and anyone else using MBS:
![image](docs/config_button.png)

## Installation
This addon can either be installed using Tampermonkey by clicking on the [src/loader.user.js](https://github.com/bananarama92/MBS/raw/main/src/loader.user.js) link or, alternatively, by passing assigning (and activating) the following link to a bookmark or directly using it in the address bar:

```js
javascript:(()=>{fetch(`https://bananarama92.github.io/MBS/main/mbs.js?_=${Date.now()}`).then(r=>r.text()).then(r=>eval(r));})();
```
