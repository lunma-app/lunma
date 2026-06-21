# Changelog

## [0.1.0](https://github.com/lunma-app/lunma/compare/v0.2.1...v0.1.0) (2026-06-21)


### ⚠ BREAKING CHANGES

* **workspace:** source tree relocates under apps/extension/src; tokens move to the @lunma/tokens package.

### Features

* **appearance:** add showGlares toggle to suppress aurora and glow ([4c39b88](https://github.com/lunma-app/lunma/commit/4c39b88990c98b2a06913110576ded163d8f58e1))
* **background:** switch window Space to a focused tab's owning Space ([e51e931](https://github.com/lunma-app/lunma/commit/e51e931983dac54cb20ee25452d3d360696526d0))
* **boundary:** lock pinned tabs to url, path, or page ([c1c4689](https://github.com/lunma-app/lunma/commit/c1c4689472fbcbf88c5d32859d7eef3c7180498b))
* **brand:** adopt crescent mark for icons and favicon ([8b7f974](https://github.com/lunma-app/lunma/commit/8b7f9744ed22d7b99dbb82b76c5c41b374bcced1))
* **bus:** validate command payloads, add dispatch ([c94becd](https://github.com/lunma-app/lunma/commit/c94becdcb1b8e519a16d06385f1b8c99186a48b1))
* confirm destroy, a11y reorder, site landmarks ([aa8a4dc](https://github.com/lunma-app/lunma/commit/aa8a4dcd3185a884e7cea1fd668bd83badc7d427))
* **extension:** export/import portable JSON backup ([80f7a9a](https://github.com/lunma-app/lunma/commit/80f7a9ac6bdc0fd896f3908532445c512bf3a4c9))
* **extension:** land smart-folder connector epic ([49b25cd](https://github.com/lunma-app/lunma/commit/49b25cdc1d83541fd1d763fece041880546ef3e7))
* **launcher:** add combobox a11y for new-tab results ([6ccace0](https://github.com/lunma-app/lunma/commit/6ccace0304ec3b4bab137dfa37e407c74f4faa49))
* **launcher:** dedup open results, add duplicate tab ([0b46b30](https://github.com/lunma-app/lunma/commit/0b46b3043f8d48f0a46fff3e3169e76e9acb30d2))
* **launcher:** fuzzy match, smart-folder items, space scope ([53c1d7e](https://github.com/lunma-app/lunma/commit/53c1d7efc0dc122e0d1e89a037cb7fb7cc971a98))
* **launcher:** make selected-row selection wash-only ([1e0139a](https://github.com/lunma-app/lunma/commit/1e0139a13f85387a56f0613164063ce97407f34f))
* **newtab:** hearth bloom, kindle entrance, favorites ([87c76be](https://github.com/lunma-app/lunma/commit/87c76bec7311400dd84c40f2b5cac92140ff8e9b))
* request history, bookmarks, hosts at runtime ([039acde](https://github.com/lunma-app/lunma/commit/039acdecb4725327231854a999f5faaa314ebca7))
* **sidebar:** consolidate first-run welcome ([336fa42](https://github.com/lunma-app/lunma/commit/336fa42b38442aeda7dfc6e8d1ff571fa0f2e053))
* **sidebar:** disclose auto-archive on first run ([e4caa0b](https://github.com/lunma-app/lunma/commit/e4caa0b41577e94eed0ddae35f8429b65247f262))
* **sidebar:** make in-progress drags cancellable ([3f37222](https://github.com/lunma-app/lunma/commit/3f372228b0912010e5fc1d639530cecbfd342eef))
* **sidebar:** move auto-archive notice below grid ([fb15bcf](https://github.com/lunma-app/lunma/commit/fb15bcf67db86fdb19da42a72c2bdc452fa1145e))
* **sidebar:** move tab-row actions to right-click ([14d4b7e](https://github.com/lunma-app/lunma/commit/14d4b7ed565fe9e86bda58d7bbd2f1e7a95e6bce))
* **sidebar:** smart folders for gitlab + github queues ([5d9bd26](https://github.com/lunma-app/lunma/commit/5d9bd26f1d26893a7326c5f1dda6d1f378ada624))
* **sidebar:** two-step confirm for smart-folder delete ([a3ea424](https://github.com/lunma-app/lunma/commit/a3ea424f7ce8ba341d9b48a6052ebf902e29dc5d))
* **smart-folders:** multi-source smart folders ([fcb1045](https://github.com/lunma-app/lunma/commit/fcb10451103923d3ce8c7be733a194c55ab8afc2))
* **tokens:** move resting hue from ember to moonlit blue ([3cd93d0](https://github.com/lunma-app/lunma/commit/3cd93d087bfcbdf65d9bf861e226d2aa0a081831))
* **ui:** cross-fade folder count to kebab on hover ([9e4ccb1](https://github.com/lunma-app/lunma/commit/9e4ccb130474a0b788373d6a521bd138f4794616))


### Bug Fixes

* **ci:** correct release-please changelog path, align identity guard, exempt dependabot from DCO ([97438c4](https://github.com/lunma-app/lunma/commit/97438c4ff67f19cd1df999c99763fc1e1c10d06c))
* close recurring type-safety and security gaps ([6b2abcc](https://github.com/lunma-app/lunma/commit/6b2abccec007c2a5d9468ef17eecf68660fd4d47))
* **e2e:** add data-name to chip; fix invalid color in test ([2f651e8](https://github.com/lunma-app/lunma/commit/2f651e88505b5a1d3a49033871b2714df3457f09))
* **e2e:** bound ctx.waitForEvent('page') with 2 s timeout ([57df0bc](https://github.com/lunma-app/lunma/commit/57df0bc232ae7f38f720bb29116609dfb62bc5f8))
* **e2e:** fix invalid icon and cap SW wait in workspace-creation ([561a634](https://github.com/lunma-app/lunma/commit/561a6347cf05c80233dd9f5076fdd2cbe4d4f95c))
* **extension:** close consumed feed tabs on drain ([c7ba654](https://github.com/lunma-app/lunma/commit/c7ba654789afdc8ef892f2229c46073b7968ae29))
* **extension:** decode rss feeds by declared charset ([aa794d6](https://github.com/lunma-app/lunma/commit/aa794d6ded9244713c62e5f32808490c1bd7b482))
* **extension:** make new-tab + shortcuts Chromium-fork-safe ([1e3bc52](https://github.com/lunma-app/lunma/commit/1e3bc529beea2484133aae4c12690760179650bf))
* **extension:** reconcile live state after backup restore ([a470e33](https://github.com/lunma-app/lunma/commit/a470e335185548ed7d6897e9aee392a0f6960056))
* **extension:** render icons outside curated catalogue ([9351a9f](https://github.com/lunma-app/lunma/commit/9351a9f65e04d6807a0bcf05d355a74d969d76cb))
* **extension:** tolerate already-closed tabs on consume ([26637a4](https://github.com/lunma-app/lunma/commit/26637a48d992eb6d81f1f00247cf13297746efd8))
* keyword-led store summary, drop em-dash tells from metadata ([5ca1814](https://github.com/lunma-app/lunma/commit/5ca181457222b0b0b675c110e7c9d808d3855804))
* **launcher:** guard overlay message listener against foreign-origin senders and validate SW suggestion payload ([b366ef3](https://github.com/lunma-app/lunma/commit/b366ef3f5929e3d0b4f5051b1b07398464a32ae6))
* **lint:** apply biome safe-unsafe fixes (useLiteralKeys, useOptionalChain) ([f8f9928](https://github.com/lunma-app/lunma/commit/f8f99287c26cf97893e21e5571e2f4332ede1a02))
* **low:** prune lastSeenById in SmartFolder ([#37](https://github.com/lunma-app/lunma/issues/37)), canonical accent formula in SpaceEditor ([#47](https://github.com/lunma-app/lunma/issues/47)) ([b00afe9](https://github.com/lunma-app/lunma/commit/b00afe9f7b43984fd795a1516ce3a719ee7bd397))
* **manifest:** drop default_locale with no _locales bundle ([68c0858](https://github.com/lunma-app/lunma/commit/68c0858cf68cd23ab78d21b7390aa71a44e59d7c))
* **options:** validate chrome.storage.local reads with AppStateV7Schema ([#3](https://github.com/lunma-app/lunma/issues/3)) ([5eb852d](https://github.com/lunma-app/lunma/commit/5eb852dd3321d8f065e0ac7a98e376dd6958cd42))
* preserveFavoriteFocus test ([#14](https://github.com/lunma-app/lunma/issues/14)), folder token ([#27](https://github.com/lunma-app/lunma/issues/27)), overlay font tokens ([#30](https://github.com/lunma-app/lunma/issues/30)) ([389c895](https://github.com/lunma-app/lunma/commit/389c895de146413042f6a38dcab856946e46fba3))
* remove redundant SpaceColor casts, guard async onMount, narrow spy types ([8f7371d](https://github.com/lunma-app/lunma/commit/8f7371d8805f31487bb3fffe7db5d202c59e6998))
* **security,quality:** sender guards, tab-boundary filter, token fixes ([16de194](https://github.com/lunma-app/lunma/commit/16de194b7934e81cf2c7366ad79ec7b63c8bfd0e))
* **security,typesafety:** scheme guard, satisfies cast, bus-adapter comment ([d81d5b1](https://github.com/lunma-app/lunma/commit/d81d5b172ed74fe21e46e7687db2bc8eca0991d1))
* **security,ui:** add sender guards and declare missing tokens ([434bc8f](https://github.com/lunma-app/lunma/commit/434bc8f4284918ed6ae0b933778f2e334d9a9ec2))
* **sidebar:** hide scrollbar to keep header plumb ([433d0e7](https://github.com/lunma-app/lunma/commit/433d0e7f88cc409ef707eff3a92a709d8f651b52))
* **sidebar:** pin space header while list scrolls ([261ba9b](https://github.com/lunma-app/lunma/commit/261ba9bc5c25b825434945c8c2019fad18bef424))
* **testing:** AppStateV7Schema smartItemBindings slot shape not validated ([53274b8](https://github.com/lunma-app/lunma/commit/53274b8d96e0e1eb55496225e1b7a11e095ad2da))
* **testing:** GroupOrchestrator.orchestrateActivation preserveFavoriteFocu ([7ffd2be](https://github.com/lunma-app/lunma/commit/7ffd2be50b4c03a29a13be182d00cd01ae353cec))
* **testing:** openUrl handler non-http(s) scheme blocking not unit-tested ([94112d7](https://github.com/lunma-app/lunma/commit/94112d721b5f4d39e08d69f2003555b515f30fe5))
* **testing:** queries.ts isTrackedTab, savedTabIdForBoundTab, findSpaceIdB ([d8a471b](https://github.com/lunma-app/lunma/commit/d8a471b333a746fdfb942813970f367491ffa5ae))
* **typesafety:** onStateBroadcast casts raw chrome.runtime message to StateBr ([93f2c04](https://github.com/lunma-app/lunma/commit/93f2c04af2af7d67fd81bd40f20fc294e24c557d))
* **typesafety:** requestLauncherSuggestions returns msg.results as LauncherRe ([4ddaa74](https://github.com/lunma-app/lunma/commit/4ddaa74777b1cb2c533f1ccd9712b74c71afb3f8))
* **typesafety:** saxes tag.attributes cast to Record&lt;string,string&gt; unsafe if namespace mode enabled ([e5d1705](https://github.com/lunma-app/lunma/commit/e5d1705a3f205f521c27ca56dfe5178448b0ec75))
* **typesafety:** store.state double-unknown cast to SidebarLocalState spreads ([fecd98c](https://github.com/lunma-app/lunma/commit/fecd98c13aa31ab073cdfe284fd2623e306ed1b6))
* **typesafety:** toPendingEvent casts Zod-inferred type to SidebarCommand the ([33355e0](https://github.com/lunma-app/lunma/commit/33355e02fe8b0c8c8f65af72ce8baa49b75b8c3d))
* **ui:** equalize TabRow close-button inset ([83b589b](https://github.com/lunma-app/lunma/commit/83b589b23cf42f9595f1104f6d45ad802fb8a963))
* **ui:** let kebab clicks fall through hidden count ([9b8f03a](https://github.com/lunma-app/lunma/commit/9b8f03a7cc8edff367c87dde4a13c32eff2394f9))
* **ui:** portal ContextMenu to the viewport ([821375d](https://github.com/lunma-app/lunma/commit/821375df74e7fdb3ba35fd868ed737601018bad9))
* **ui:** silence derived_inert warning in ContextMenu ([4fc098d](https://github.com/lunma-app/lunma/commit/4fc098d61b8428113303c2b8003a14a81fd5290d))
* **ui:** unmount tooltip layer with its trigger ([be67f0d](https://github.com/lunma-app/lunma/commit/be67f0d782f3ffdde93b5e00704d8196bd1069c7))


### Performance Improvements

* **icons:** load lucide from generated allowlist ([9dd3e52](https://github.com/lunma-app/lunma/commit/9dd3e52f3bf301e48fcda5c094c935a7d94e3fe2))


### Reverts

* **sidebar:** drop first-run welcome hero ([2f1fad1](https://github.com/lunma-app/lunma/commit/2f1fad16aafda7472888dfad1e5d666c2ec0d0a5))


### Miscellaneous Chores

* bootstrap first release at 0.1.0 ([733828d](https://github.com/lunma-app/lunma/commit/733828de4196e81492debc224112d5456aad9494))


### Code Refactoring

* **workspace:** split into pnpm workspace ([be081ec](https://github.com/lunma-app/lunma/commit/be081ecbdc63ef6d115be22c30e95d31d904d86b))

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
