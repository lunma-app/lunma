# Changelog

## [0.1.0](https://github.com/lunma-app/lunma/compare/v0.3.0...v0.1.0) (2026-06-21)


### ⚠ BREAKING CHANGES

* **workspace:** source tree relocates under apps/extension/src; tokens move to the @lunma/tokens package.

### Features

* **appearance:** add showGlares toggle to suppress aurora and glow ([1653735](https://github.com/lunma-app/lunma/commit/1653735f6433ae36e109ffbc3999f80dab124d4d))
* **background:** switch window Space to a focused tab's owning Space ([1a0154a](https://github.com/lunma-app/lunma/commit/1a0154aad50d8ed66dbf0a9f071caf647e964f02))
* **boundary:** lock pinned tabs to url, path, or page ([484d5ed](https://github.com/lunma-app/lunma/commit/484d5ed9a292792e7630c5295a10b1192e58dc0e))
* **brand:** adopt crescent mark for icons and favicon ([514fe22](https://github.com/lunma-app/lunma/commit/514fe2267637a470ae8d4e18fd4c5b7efb396570))
* **bus:** validate command payloads, add dispatch ([a8daa69](https://github.com/lunma-app/lunma/commit/a8daa69e51bab2f5a166c1d4c99d97b3be2ab7fc))
* confirm destroy, a11y reorder, site landmarks ([21335c1](https://github.com/lunma-app/lunma/commit/21335c1188f82d871b4a7d3b73e82b1fd09c4a20))
* **extension:** export/import portable JSON backup ([d65297b](https://github.com/lunma-app/lunma/commit/d65297b551312fc9614675b44594c534f6084b5d))
* **extension:** land smart-folder connector epic ([02e1816](https://github.com/lunma-app/lunma/commit/02e18160c07f7511d66aff202a273f7d07f9e086))
* **launcher:** add combobox a11y for new-tab results ([48d38d6](https://github.com/lunma-app/lunma/commit/48d38d63b02b19560213dd86c526b5ee1f6e3f4d))
* **launcher:** dedup open results, add duplicate tab ([a860637](https://github.com/lunma-app/lunma/commit/a8606375817e4e38a495a183e31dd9e00cac99b4))
* **launcher:** fuzzy match, smart-folder items, space scope ([d9737a9](https://github.com/lunma-app/lunma/commit/d9737a9600ccb8747759d5290ec2bf02af42c463))
* **launcher:** make selected-row selection wash-only ([674f15b](https://github.com/lunma-app/lunma/commit/674f15bd0e4a3ce851188277da3bb5538a6570a3))
* **newtab:** hearth bloom, kindle entrance, favorites ([d96939b](https://github.com/lunma-app/lunma/commit/d96939b724f2a22b537b197c4996fbdaf7dbb4f4))
* request history, bookmarks, hosts at runtime ([31b2f44](https://github.com/lunma-app/lunma/commit/31b2f448434b6d692c532ca29e01da2d7edb857f))
* **sidebar:** consolidate first-run welcome ([70634d8](https://github.com/lunma-app/lunma/commit/70634d84de68ba01f85d65cac29124a88b295e46))
* **sidebar:** disclose auto-archive on first run ([dea4983](https://github.com/lunma-app/lunma/commit/dea4983a7efc9fe901e124a943b355fe59de61da))
* **sidebar:** make in-progress drags cancellable ([3b4b84b](https://github.com/lunma-app/lunma/commit/3b4b84b04d8222146d5b2264f6174a1a39788ddb))
* **sidebar:** move auto-archive notice below grid ([bbe8a18](https://github.com/lunma-app/lunma/commit/bbe8a183ce6b366495c2bab0d7ebb2243b4fe349))
* **sidebar:** move tab-row actions to right-click ([bd979c5](https://github.com/lunma-app/lunma/commit/bd979c55aac182bdb6a88876dc250ec3f1b9b3da))
* **sidebar:** smart folders for gitlab + github queues ([996e759](https://github.com/lunma-app/lunma/commit/996e7599f7d7817d7b8eabec50c65a56eb3d053f))
* **sidebar:** two-step confirm for smart-folder delete ([766c173](https://github.com/lunma-app/lunma/commit/766c1735e282c02cd22ed12b6eaca6e040d4d4d8))
* **smart-folders:** multi-source smart folders ([fe287ae](https://github.com/lunma-app/lunma/commit/fe287ae0a828b2c588fe1752f35bb10f18155277))
* **tokens:** move resting hue from ember to moonlit blue ([f95668d](https://github.com/lunma-app/lunma/commit/f95668d0712fd5627166b6a196fe492e6e2617ed))
* **ui:** cross-fade folder count to kebab on hover ([6e45fac](https://github.com/lunma-app/lunma/commit/6e45fac0bf4cb1e49bcd2885a51302cf81b2cc69))


### Bug Fixes

* **ci:** correct release-please changelog path, align identity guard, exempt dependabot from DCO ([52a9e9f](https://github.com/lunma-app/lunma/commit/52a9e9ff485a5f5e26c3371c7bf1db622566545b))
* close recurring type-safety and security gaps ([76023a4](https://github.com/lunma-app/lunma/commit/76023a4c61d070204a69276aad97bc318cf554d3))
* **cws:** narrow content script matches and update issue templates ([7e95a98](https://github.com/lunma-app/lunma/commit/7e95a984798fba02d2952a90c7e0fab8f6ca1388))
* **e2e:** add data-name to chip; fix invalid color in test ([1825a7e](https://github.com/lunma-app/lunma/commit/1825a7e4dd77d607ad9e9ee1336e39c054047d76))
* **e2e:** bound ctx.waitForEvent('page') with 2 s timeout ([1edb2c4](https://github.com/lunma-app/lunma/commit/1edb2c44e6423cad7c01ce2a42b5f16e42ef7c28))
* **e2e:** fix invalid icon and cap SW wait in workspace-creation ([4cb1c0e](https://github.com/lunma-app/lunma/commit/4cb1c0ebfa50d4cab348952fb1d8cd1ddf11918d))
* **extension:** close consumed feed tabs on drain ([fd09702](https://github.com/lunma-app/lunma/commit/fd0970230c71fbe4b0ff32d4368bc4bda6f72658))
* **extension:** decode rss feeds by declared charset ([4ffccc6](https://github.com/lunma-app/lunma/commit/4ffccc6486c6721bfcca8a597102627e26903d15))
* **extension:** make new-tab + shortcuts Chromium-fork-safe ([8f38fe2](https://github.com/lunma-app/lunma/commit/8f38fe2b8092ba47c6e44d257c47fd543ca8ba88))
* **extension:** reconcile live state after backup restore ([dc48077](https://github.com/lunma-app/lunma/commit/dc48077ef0d76ff637944bd8dd801768cc6ce021))
* **extension:** render icons outside curated catalogue ([7b54d2d](https://github.com/lunma-app/lunma/commit/7b54d2d028b871d2513c36c9ddeb264f165b202e))
* **extension:** tolerate already-closed tabs on consume ([a09747b](https://github.com/lunma-app/lunma/commit/a09747b5aff6b7b38bcde1fce172b0ff3f7c2b1e))
* keyword-led store summary, drop em-dash tells from metadata ([5298e2c](https://github.com/lunma-app/lunma/commit/5298e2ceeac6a5f932c94c37a3953d77bcf2e6d4))
* **launcher:** guard overlay message listener against foreign-origin senders and validate SW suggestion payload ([7a6f565](https://github.com/lunma-app/lunma/commit/7a6f565d1207dfc3a2089df198727ca1fd3647fa))
* **lint:** apply biome safe-unsafe fixes (useLiteralKeys, useOptionalChain) ([66e44bf](https://github.com/lunma-app/lunma/commit/66e44bf6e9e32da06580a30f540014aa8ec62589))
* **low:** prune lastSeenById in SmartFolder ([#37](https://github.com/lunma-app/lunma/issues/37)), canonical accent formula in SpaceEditor ([#47](https://github.com/lunma-app/lunma/issues/47)) ([29da93b](https://github.com/lunma-app/lunma/commit/29da93b3a7d4cd299bbc6085f941f714b5a60348))
* **manifest:** drop default_locale with no _locales bundle ([d5ab386](https://github.com/lunma-app/lunma/commit/d5ab38684c82153c9c6f946bbfabe84453b91b5c))
* **options:** validate chrome.storage.local reads with AppStateV7Schema ([#3](https://github.com/lunma-app/lunma/issues/3)) ([3e4b6ce](https://github.com/lunma-app/lunma/commit/3e4b6ceebf008cb8c184673761ae4a7c8eda2658))
* preserveFavoriteFocus test ([#14](https://github.com/lunma-app/lunma/issues/14)), folder token ([#27](https://github.com/lunma-app/lunma/issues/27)), overlay font tokens ([#30](https://github.com/lunma-app/lunma/issues/30)) ([5ef43af](https://github.com/lunma-app/lunma/commit/5ef43af320d12f3eca35e0d65136b494cc145e2c))
* remove redundant SpaceColor casts, guard async onMount, narrow spy types ([9f03793](https://github.com/lunma-app/lunma/commit/9f03793fa7a935240be0ecca184ebf3619b451c6))
* **security,quality:** sender guards, tab-boundary filter, token fixes ([4bce3b1](https://github.com/lunma-app/lunma/commit/4bce3b11dd3d8c375a673ad9929abc2d0f2adf8b))
* **security,typesafety:** scheme guard, satisfies cast, bus-adapter comment ([8b0ea28](https://github.com/lunma-app/lunma/commit/8b0ea28b0b1ad6d463dfc67a69c98f7f25ea6ba8))
* **security,ui:** add sender guards and declare missing tokens ([a3f692c](https://github.com/lunma-app/lunma/commit/a3f692cbb5ec65a18242d3ebb047bfbb3e2ae1b5))
* **sidebar:** hide scrollbar to keep header plumb ([3432c23](https://github.com/lunma-app/lunma/commit/3432c23b4c48a3550a9e89a24989fc0c0c8b917d))
* **sidebar:** pin space header while list scrolls ([6d4051a](https://github.com/lunma-app/lunma/commit/6d4051a796546235aa76e5a328f1f1aa0065e825))
* **testing:** AppStateV7Schema smartItemBindings slot shape not validated ([d68def7](https://github.com/lunma-app/lunma/commit/d68def79cba68ca5b576e01929036b92549be83f))
* **testing:** GroupOrchestrator.orchestrateActivation preserveFavoriteFocu ([902f67a](https://github.com/lunma-app/lunma/commit/902f67a5065e48f37adf69e49022ee2852fc4df1))
* **testing:** openUrl handler non-http(s) scheme blocking not unit-tested ([cf89b39](https://github.com/lunma-app/lunma/commit/cf89b39704f3dbf1c7c270e25307bf25e36b517f))
* **testing:** queries.ts isTrackedTab, savedTabIdForBoundTab, findSpaceIdB ([10bf06e](https://github.com/lunma-app/lunma/commit/10bf06e9fcbb304ec8b8c5a64844b9e7691646e3))
* **typesafety:** onStateBroadcast casts raw chrome.runtime message to StateBr ([664ba06](https://github.com/lunma-app/lunma/commit/664ba06394ebb60b65f01d96c0abaf370b6bf98e))
* **typesafety:** requestLauncherSuggestions returns msg.results as LauncherRe ([0d2ceff](https://github.com/lunma-app/lunma/commit/0d2ceffa9a4410f672950d786df3dcda3b5a767e))
* **typesafety:** saxes tag.attributes cast to Record&lt;string,string&gt; unsafe if namespace mode enabled ([805be48](https://github.com/lunma-app/lunma/commit/805be48915245a27f6bcfa9c5471d9ee1bb6444f))
* **typesafety:** store.state double-unknown cast to SidebarLocalState spreads ([63ac9be](https://github.com/lunma-app/lunma/commit/63ac9be00a28608da9505bc0df9eff173b3b2f89))
* **typesafety:** toPendingEvent casts Zod-inferred type to SidebarCommand the ([151e8ee](https://github.com/lunma-app/lunma/commit/151e8eecdae3903d62c824057be480fb0f34d0a5))
* **ui:** equalize TabRow close-button inset ([a8ef024](https://github.com/lunma-app/lunma/commit/a8ef024312f9c4f3fc62a2cd3705522c4e93b838))
* **ui:** let kebab clicks fall through hidden count ([13c41d2](https://github.com/lunma-app/lunma/commit/13c41d202508c0c2042371ba568616b6fae468a2))
* **ui:** portal ContextMenu to the viewport ([b3c1b81](https://github.com/lunma-app/lunma/commit/b3c1b81981b33401cad912f5c4d6487fb53a4ef7))
* **ui:** silence derived_inert warning in ContextMenu ([113128a](https://github.com/lunma-app/lunma/commit/113128a317c5350627ae2e9d3be65686edbbf2fe))
* **ui:** unmount tooltip layer with its trigger ([678d80b](https://github.com/lunma-app/lunma/commit/678d80bea83bf4f7ebe703f6919c4e2d55ed529d))


### Performance Improvements

* **icons:** load lucide from generated allowlist ([f206aec](https://github.com/lunma-app/lunma/commit/f206aece474cd63a5e4304717b3aa1cdfaf9ef9b))


### Reverts

* **sidebar:** drop first-run welcome hero ([ad3c6f2](https://github.com/lunma-app/lunma/commit/ad3c6f230fb876e67c89e9c8391540aa617c8018))


### Miscellaneous Chores

* bootstrap first release at 0.1.0 ([f6224c7](https://github.com/lunma-app/lunma/commit/f6224c7907855a7b1b3783fceba887994299272b))


### Code Refactoring

* **workspace:** split into pnpm workspace ([6ddb992](https://github.com/lunma-app/lunma/commit/6ddb992edd73ed37d3f3434ecda2ab998dd93bf3))

## [0.3.0](https://github.com/lunma-app/lunma/compare/v0.2.1...v0.3.0) (2026-06-21)


### Features

* **brand:** adopt crescent mark for icons and favicon ([8b7f974](https://github.com/lunma-app/lunma/commit/8b7f9744ed22d7b99dbb82b76c5c41b374bcced1))
* **smart-folders:** multi-source smart folders ([778103d](https://github.com/lunma-app/lunma/commit/778103d))

## [0.2.1](https://github.com/lunma-app/lunma/compare/v0.2.0...v0.2.1) (2026-06-21)


### Bug Fixes

* close recurring type-safety and security gaps ([85e2b2c](https://github.com/lunma-app/lunma/commit/85e2b2cfdf1eeedd51fd8465844f3ce5705b2adb))
* **e2e:** add data-name to chip; fix invalid color in test ([941e179](https://github.com/lunma-app/lunma/commit/941e179c2c4ab5a8c9b38c56f8a74cdfa3597c38))
* **e2e:** bound ctx.waitForEvent('page') with 2 s timeout ([864b4c0](https://github.com/lunma-app/lunma/commit/864b4c0183c005f55bcd86fdb3954c4f61eff69a))
* **e2e:** fix invalid icon and cap SW wait in workspace-creation ([07795af](https://github.com/lunma-app/lunma/commit/07795af790162c51cb3909b5b96754851ba92755))
* **launcher:** guard overlay message listener against foreign-origin senders and validate SW suggestion payload ([947fbb2](https://github.com/lunma-app/lunma/commit/947fbb2d8f35b87300b08f123da2d4ed14b9ed9a))
* remove redundant SpaceColor casts, guard async onMount, narrow spy types ([faa41d3](https://github.com/lunma-app/lunma/commit/faa41d3543fdc8dcda26a09b3de07afc8fbd3010))

## [0.2.0](https://github.com/lunma-app/lunma/compare/v0.1.1...v0.2.0) (2026-06-21)


### Features

* **appearance:** add showGlares toggle to suppress aurora and glow ([236f422](https://github.com/lunma-app/lunma/commit/236f42248325d7cf000fb506708cbce8771eb9c5))


### Bug Fixes

* **lint:** apply biome safe-unsafe fixes (useLiteralKeys, useOptionalChain) ([714384e](https://github.com/lunma-app/lunma/commit/714384eeffd4d1063e82d4e25a358acce3e938cb))
* **low:** prune lastSeenById in SmartFolder ([#37](https://github.com/lunma-app/lunma/issues/37)), canonical accent formula in SpaceEditor ([#47](https://github.com/lunma-app/lunma/issues/47)) ([d35f5a7](https://github.com/lunma-app/lunma/commit/d35f5a73e10cb91297c8f037794da4fe30569f98))
* **options:** validate chrome.storage.local reads with AppStateV7Schema ([#3](https://github.com/lunma-app/lunma/issues/3)) ([1afa935](https://github.com/lunma-app/lunma/commit/1afa935c5db8c3aa537d232faa1f4e0c9b84233d))
* preserveFavoriteFocus test ([#14](https://github.com/lunma-app/lunma/issues/14)), folder token ([#27](https://github.com/lunma-app/lunma/issues/27)), overlay font tokens ([#30](https://github.com/lunma-app/lunma/issues/30)) ([8ffb44f](https://github.com/lunma-app/lunma/commit/8ffb44f3364e265ef33f8481c2e57db085eda602))
* **security,quality:** sender guards, tab-boundary filter, token fixes ([a98f3a8](https://github.com/lunma-app/lunma/commit/a98f3a8f6a83ba4d89cf4e65461ecf2c5ea235de))
* **security,typesafety:** scheme guard, satisfies cast, bus-adapter comment ([d9d8533](https://github.com/lunma-app/lunma/commit/d9d8533cda676f06705e61954cd73fd8e9b3e37f))
* **security,ui:** add sender guards and declare missing tokens ([2dbe2fc](https://github.com/lunma-app/lunma/commit/2dbe2fc8eb88a2c94990923f789c2f8117257112))
* **testing:** AppStateV7Schema smartItemBindings slot shape not validated ([7ce099b](https://github.com/lunma-app/lunma/commit/7ce099b23084d1df947f52cbc9b106d7e3545fb5))
* **testing:** GroupOrchestrator.orchestrateActivation preserveFavoriteFocu ([ade17c1](https://github.com/lunma-app/lunma/commit/ade17c1bf4bf063dff9837a47ee34040302a1207))
* **testing:** openUrl handler non-http(s) scheme blocking not unit-tested ([2fc78d2](https://github.com/lunma-app/lunma/commit/2fc78d2d1f29342c3b29e7e2cbd4c6ddc12ac97b))
* **testing:** queries.ts isTrackedTab, savedTabIdForBoundTab, findSpaceIdB ([c31ad15](https://github.com/lunma-app/lunma/commit/c31ad15f3cd376c25df3fec5ffc1fc8732f516df))
* **typesafety:** onStateBroadcast casts raw chrome.runtime message to StateBr ([ffe7821](https://github.com/lunma-app/lunma/commit/ffe7821566e9f842d48c8237b79afa7fbf9be357))
* **typesafety:** requestLauncherSuggestions returns msg.results as LauncherRe ([dbecb6d](https://github.com/lunma-app/lunma/commit/dbecb6d63e7220d0c2d031c42e1535ae4b48557f))
* **typesafety:** saxes tag.attributes cast to Record&lt;string,string&gt; unsafe if namespace mode enabled ([0e0ae0f](https://github.com/lunma-app/lunma/commit/0e0ae0fb73a460eb6300a860b83d46b8606d0fd6))
* **typesafety:** store.state double-unknown cast to SidebarLocalState spreads ([7a283e1](https://github.com/lunma-app/lunma/commit/7a283e1eded3b776555e0864b650b0434d264f01))
* **typesafety:** toPendingEvent casts Zod-inferred type to SidebarCommand the ([a77966d](https://github.com/lunma-app/lunma/commit/a77966d332ab0c50130bad37c9b06ab7faff9959))

## [0.1.1](https://github.com/lunma-app/lunma/compare/v0.1.0...v0.1.1) (2026-06-19)


### Bug Fixes

* keyword-led store summary, drop em-dash tells from metadata ([82b9995](https://github.com/lunma-app/lunma/commit/82b999573d420ec659e5cbf56c2bc892be713fb2))

## 0.1.0 (2026-06-19)

First public release.

### Features

* **background:** switch window Space to a focused tab's owning Space ([b637600](https://github.com/lunma-app/lunma/commit/b6376007e7cee18b92f0b9a57333835ff9a1b47b))
* **boundary:** lock pinned tabs to url, path, or page ([b083a30](https://github.com/lunma-app/lunma/commit/b083a30c3e29fb57e0bc23fccf8fc3ded7454c34))
* **bus:** validate command payloads, add dispatch ([0d7f37f](https://github.com/lunma-app/lunma/commit/0d7f37fa91bafd5117e8d26755e97e1046ad3dc7))
* confirm destroy, a11y reorder, site landmarks ([a08ff44](https://github.com/lunma-app/lunma/commit/a08ff4465e86892a33e86625e029508830676fbb))
* **extension:** export/import portable JSON backup ([798e566](https://github.com/lunma-app/lunma/commit/798e56655b26cc0fff0fff5038864357a4b587db))
* **extension:** land smart-folder connector epic ([adc2d96](https://github.com/lunma-app/lunma/commit/adc2d96d4baf210e3dcd75c0bee60e50c5800cb0))
* **launcher:** add combobox a11y for new-tab results ([56c43ea](https://github.com/lunma-app/lunma/commit/56c43ead6a1ecf598c3f4db4b4244f9045016404))
* **launcher:** dedup open results, add duplicate tab ([c6dbac4](https://github.com/lunma-app/lunma/commit/c6dbac4db94ebacc0943a9682e32ebffcbda4c4f))
* **launcher:** fuzzy match, smart-folder items, space scope ([9fdfd77](https://github.com/lunma-app/lunma/commit/9fdfd77ba824edb98a1509715e92e6205183e840))
* **launcher:** make selected-row selection wash-only ([cbf8dd9](https://github.com/lunma-app/lunma/commit/cbf8dd944c1c7d04d281f0f5a284441b37f13a7b))
* **newtab:** hearth bloom, kindle entrance, favorites ([7262eb4](https://github.com/lunma-app/lunma/commit/7262eb4f17ced65c709a3229302e216c9ce47169))
* request history, bookmarks, hosts at runtime ([ea8af9e](https://github.com/lunma-app/lunma/commit/ea8af9e0783f32d8e2d507d546edcb0a8a47580b))
* **sidebar:** consolidate first-run welcome ([699484e](https://github.com/lunma-app/lunma/commit/699484e56db1b5eeaf3ddf4d98329bc5bc2961aa))
* **sidebar:** disclose auto-archive on first run ([78ff19f](https://github.com/lunma-app/lunma/commit/78ff19fea3b7137989539d86603e018985e67b02))
* **sidebar:** make in-progress drags cancellable ([5b3b64b](https://github.com/lunma-app/lunma/commit/5b3b64b6763fee9f9b078d3b14cf9e1a7cf38243))
* **sidebar:** move auto-archive notice below grid ([ea3cff2](https://github.com/lunma-app/lunma/commit/ea3cff20a09b029031d71da0c70d534253da1e3b))
* **sidebar:** move tab-row actions to right-click ([885c168](https://github.com/lunma-app/lunma/commit/885c168ad2fc755ee22a548c4c107e2bd9ca9fbb))
* **sidebar:** smart folders for gitlab + github queues ([fbb1c62](https://github.com/lunma-app/lunma/commit/fbb1c6264f37ffa391c872811e1744015e43c761))
* **sidebar:** two-step confirm for smart-folder delete ([c2ba1b4](https://github.com/lunma-app/lunma/commit/c2ba1b494bbb9279daf90e9d2b344a3d3636fa3c))
* **tokens:** move resting hue from ember to moonlit blue ([5961f1d](https://github.com/lunma-app/lunma/commit/5961f1d5aedaf04de649d1b06c69574ee565bc16))
* **ui:** cross-fade folder count to kebab on hover ([0ee7fa4](https://github.com/lunma-app/lunma/commit/0ee7fa4160db9b5e7e1def5c88ff8081a3f3688c))


### Bug Fixes

* **ci:** correct release-please changelog path, align identity guard, exempt dependabot from DCO ([e2afbac](https://github.com/lunma-app/lunma/commit/e2afbac8be47cf01c6a61c95caa9f9dc9269d8c6))
* **extension:** close consumed feed tabs on drain ([e9e8775](https://github.com/lunma-app/lunma/commit/e9e877594c314a266b9843554709ed06e6e2d6d2))
* **extension:** decode rss feeds by declared charset ([2aedd44](https://github.com/lunma-app/lunma/commit/2aedd44df9063b02f3786fec09a8156c19a53d40))
* **extension:** make new-tab + shortcuts Chromium-fork-safe ([fb81c62](https://github.com/lunma-app/lunma/commit/fb81c62ba6767807d4e485696b70cae18de3b2f7))
* **extension:** reconcile live state after backup restore ([f5f97c1](https://github.com/lunma-app/lunma/commit/f5f97c183668d6ce3e44f7ab33619ddd0e83c9fd))
* **extension:** render icons outside curated catalogue ([19f4e93](https://github.com/lunma-app/lunma/commit/19f4e93977f8d7df136c53f5124ce8bd325397f8))
* **extension:** tolerate already-closed tabs on consume ([1ba6d79](https://github.com/lunma-app/lunma/commit/1ba6d795da808a900840e8cfa1cb9ac8a5702b1b))
* **manifest:** drop default_locale with no _locales bundle ([9a87c62](https://github.com/lunma-app/lunma/commit/9a87c6276a905ec4d70e4069b3abd3523880d3b6))
* **sidebar:** hide scrollbar to keep header plumb ([f2d6e1b](https://github.com/lunma-app/lunma/commit/f2d6e1bec8d2bed42618e54fda5aef052d973197))
* **sidebar:** pin space header while list scrolls ([7dd6536](https://github.com/lunma-app/lunma/commit/7dd6536be92dcd5423d16a6364c0113f3374fcbd))
* **ui:** equalize TabRow close-button inset ([1c9a40d](https://github.com/lunma-app/lunma/commit/1c9a40d7071cafea3c02f93e701414c53dcaa84e))
* **ui:** let kebab clicks fall through hidden count ([df46ee2](https://github.com/lunma-app/lunma/commit/df46ee216dafecaa360122cab977dcf3a6b50d01))
* **ui:** portal ContextMenu to the viewport ([3be5cfe](https://github.com/lunma-app/lunma/commit/3be5cfe1718dd74d6a1f041fc3853afe179ee054))
* **ui:** silence derived_inert warning in ContextMenu ([d73f3d9](https://github.com/lunma-app/lunma/commit/d73f3d9526ae65ab3f64977a10a74c3cf0adad37))
* **ui:** unmount tooltip layer with its trigger ([5aa42ba](https://github.com/lunma-app/lunma/commit/5aa42ba420a3d9c3dc3c5cfc658f872131667347))


### Performance Improvements

* **icons:** load lucide from generated allowlist ([68fb1f7](https://github.com/lunma-app/lunma/commit/68fb1f7ef39ff3db91000e3fa87c4f75966474ce))


### Reverts

* **sidebar:** drop first-run welcome hero ([93a4916](https://github.com/lunma-app/lunma/commit/93a4916e9fddd89baad52d8ce504366ea165792f))


### Miscellaneous Chores

* bootstrap first release at 0.1.0 ([7ae6e1c](https://github.com/lunma-app/lunma/commit/7ae6e1c95a3214efc67408c67ceabd5d4b52869e))


### Code Refactoring

* **workspace:** split into pnpm workspace ([c0c0664](https://github.com/lunma-app/lunma/commit/c0c0664e034ec0da105f6dc9b2013904969acdf8))
