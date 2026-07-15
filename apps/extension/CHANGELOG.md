# Changelog

## [0.5.0](https://github.com/lunma-app/lunma/compare/v0.4.5...v0.5.0) (2026-07-15)


### Features

* **catalog:** hue-match the Space picker selection ring ([075a31c](https://github.com/lunma-app/lunma/commit/075a31c37a7b00f79ce88f46afc93bbe9c2f3510))
* **catalog:** per-story canvas/theme, author controls, live code, build gate ([f3ba2b8](https://github.com/lunma-app/lunma/commit/f3ba2b86c9bc88716878d5dff2cac2476ac9a957))
* **extension:** natively pin global favorites' live tabs ([#99](https://github.com/lunma-app/lunma/issues/99)) ([4193a58](https://github.com/lunma-app/lunma/commit/4193a583d97c4eb2fa18847f45f8354ff962696b))
* **tokens:** add contrast colour-role tokens, fix AA in ui/ ([c5bffdf](https://github.com/lunma-app/lunma/commit/c5bffdf40b872fe0443cc716ef72a02a5afae746))


### Bug Fixes

* **logger:** fold log context into the message string ([#94](https://github.com/lunma-app/lunma/issues/94)) ([ebae0ee](https://github.com/lunma-app/lunma/commit/ebae0ee98ad784951ba0f1197351b3aeb6c640e9))
* **sidebar:** unify FolderRow/LensRow disclosure and indentation ([410c269](https://github.com/lunma-app/lunma/commit/410c2696c8c82365fecad3d1ab83ebb37ffbcd23))

## [0.4.5](https://github.com/lunma-app/lunma/compare/v0.4.4...v0.4.5) (2026-07-03)


### Bug Fixes

* **background:** dedup a tab redirected through an interstitial ([95928d0](https://github.com/lunma-app/lunma/commit/95928d0462daba513b48a57d7816d1fe2ce6f786))
* **background:** exclude about:blank from the navigation dedup path ([a3338a4](https://github.com/lunma-app/lunma/commit/a3338a4423bc0a1484881ccb99c8c83231fa9d8b))
* **background:** fix temp-tab ordering and dedup reuse position ([c25657b](https://github.com/lunma-app/lunma/commit/c25657b96bdb6464003182f1185111aba4d98568))
* **background:** place duplicated tabs next to their source ([48783a4](https://github.com/lunma-app/lunma/commit/48783a4f2b3144ac206cd96a8cad499fc82032ff))
* **background:** stop duplicate clones being dedup-collapsed ([0d71cbd](https://github.com/lunma-app/lunma/commit/0d71cbd1db435e3c25999b25cc61082f6dc583fb))
* **sidebar:** add duplicate icon and clear-duplicates action ([ec34483](https://github.com/lunma-app/lunma/commit/ec3448333614cd6db041ef923f5c9381d4cbaa10))

## [0.4.4](https://github.com/lunma-app/lunma/compare/v0.4.3...v0.4.4) (2026-07-03)


### Bug Fixes

* **background:** dedup direct-URL tab creation, unscoped by gesture ([b66fc7d](https://github.com/lunma-app/lunma/commit/b66fc7dd2d683bc5d2237f086e01b0aef97662f7))
* **background:** exclude about:blank from onCreated-time tab dedup ([645465e](https://github.com/lunma-app/lunma/commit/645465ea256e35ae8147f9ec9c1af21a8920c977))
* **background:** stop draining user-created tab groups ([9c9d328](https://github.com/lunma-app/lunma/commit/9c9d32802eb8d88870f3f86df94684f68c5bceab))
* **catalog:** generate derived-controls.generated.ts for plain vitest too ([3b9023c](https://github.com/lunma-app/lunma/commit/3b9023cd30cc544626cc248cad436ba5636c8297))
* **catalog:** stop Examples tiles from clipping open popovers ([1eb74d5](https://github.com/lunma-app/lunma/commit/1eb74d5794266a98ef0742dac616028c53243281))
* **launcher:** default scope pickers to all-checked, not none ([fb5d8e3](https://github.com/lunma-app/lunma/commit/fb5d8e37d0b8d97c6913a4691089ddb93f52264e))
* **launcher:** fix select-all/clear feedback in scope pickers ([59f7777](https://github.com/lunma-app/lunma/commit/59f77772d9a26eafe9451be15d61308ab5641553))
* **launcher:** make an empty scope filter mean "match nothing" ([2249ec4](https://github.com/lunma-app/lunma/commit/2249ec4a7ec7b5a64d34fba73c6a4cd2df9dccbe))
* **launcher:** stop node re-renders from stomping scope-picker state ([0171a71](https://github.com/lunma-app/lunma/commit/0171a719f89306f042f72536d52f59df12686643))
* **launcher:** use neutral shadow for waiting-on-you lane ([db93d4e](https://github.com/lunma-app/lunma/commit/db93d4e776745cbabd972dc81e524e26d8472bfe))
* **spaces:** drop empty duplicate-named Spaces on read/boot ([5481826](https://github.com/lunma-app/lunma/commit/5481826ddca69adf937970dc778983843d1e04a1))

## [0.4.3](https://github.com/lunma-app/lunma/compare/v0.4.2...v0.4.3) (2026-07-01)


### Bug Fixes

* **bitbucket:** read real draft state for Server/DC pull requests ([6b0a286](https://github.com/lunma-app/lunma/commit/6b0a286ee72d7252c69375915703b4b89432e721))
* **e2e:** widen boundary chip retry budget for heavy-CI runs ([6e4b369](https://github.com/lunma-app/lunma/commit/6e4b369deb19399dbbb01c255ef9cc93ee03bf07))
* **launcher:** consistent lens scope filters, no stale select-all ([fc16e83](https://github.com/lunma-app/lunma/commit/fc16e8367e8bcbca60776d401850e76ee53609a0))

## [0.4.2](https://github.com/lunma-app/lunma/compare/v0.4.1...v0.4.2) (2026-07-01)


### Bug Fixes

* **i18n:** ship Portuguese manifest catalog as pt_BR + pt_PT ([c73a02e](https://github.com/lunma-app/lunma/commit/c73a02e7b0226168ecbaf35965954e8a462b0c08))

## [0.4.1](https://github.com/lunma-app/lunma/compare/v0.4.0...v0.4.1) (2026-07-01)


### Features

* **i18n:** rename pt-PT locale to region-neutral pt ([88669a9](https://github.com/lunma-app/lunma/commit/88669a9d518d5017b1868cb969b6255f7c28d236))


### Bug Fixes

* **e2e:** de-flake boundary lockToSite chip wait ([ba56817](https://github.com/lunma-app/lunma/commit/ba568176b61c47255881a8cb19e8564bca9ff350))
* **e2e:** heal dropped-dispatch and swallowed-contextmenu flakes ([4577d73](https://github.com/lunma-app/lunma/commit/4577d736e454b7964185eb6c79e24988f701ad1b))
* **i18n:** localize the "Space" term in de and pt catalogs ([549ddd7](https://github.com/lunma-app/lunma/commit/549ddd77cbcb7064066354d0ab3edc35feaf3df6))

## [0.4.0](https://github.com/lunma-app/lunma/compare/v0.3.1...v0.4.0) (2026-07-01)


### Features

* **background:** account lifecycle + lens engine on sources ([b20960a](https://github.com/lunma-app/lunma/commit/b20960ae3b57bad9db685e6f046515375cbde508))
* **background:** scope Space management to normal windows ([ebca537](https://github.com/lunma-app/lunma/commit/ebca537dc298c06f661f9a4b0d8341e3551794ad))
* **extension:** add dev-only component catalog ([a5bf666](https://github.com/lunma-app/lunma/commit/a5bf66607d517b7ee53435352a7a56c8026c7cad))
* **i18n:** add localization foundation (Paraglide + locale resolver + language picker) ([f25a296](https://github.com/lunma-app/lunma/commit/f25a296c37b296bb882cd1f7ad5c7fd561e6cc06))
* **i18n:** localize the extension UI (sidebar, launcher, options) in 9 languages ([9332b73](https://github.com/lunma-app/lunma/commit/9332b735d538ae2fe4e24ff5490a1343d1f1766a))
* **icons:** fill the toolbar mark, drop the tile ([3f14494](https://github.com/lunma-app/lunma/commit/3f14494f653417f6c959ef6678032b781f540e67))
* **launcher:** add the smart folder page surface ([6334794](https://github.com/lunma-app/lunma/commit/6334794ebfcd3b7f91bcf8c31f404f0f995d1bc4))
* **launcher:** envelope icon for the read/unread toggle ([db4f64d](https://github.com/lunma-app/lunma/commit/db4f64d2e5d60485af605f2519db7274e6d82953))
* **launcher:** generated cover for image-less feed cards ([dd09c9b](https://github.com/lunma-app/lunma/commit/dd09c9bf1eee537f193949923b56c0dcd328e3c3))
* **launcher:** linger read items + animate the folder-page grid ([d13a3f4](https://github.com/lunma-app/lunma/commit/d13a3f4345c0c4238fdbbb273a5f97139be1aa82))
* **launcher:** single-page lens overview ([fccf88f](https://github.com/lunma-app/lunma/commit/fccf88faac52563998946f5e43a02ea5acfd06d6))
* **launcher:** smart folder page reading controls ([a0d8ae9](https://github.com/lunma-app/lunma/commit/a0d8ae9f72338685e2407bb6f897b88be2960306))
* **lens-model:** establish-lens-model rename (smart folders → lenses) ([938093b](https://github.com/lunma-app/lunma/commit/938093bedf560fc639436feb79a42ba1b3117a8e))
* **lens-view-filters:** add feeds axis to LensFilter for persistent article feed filtering ([650a4ad](https://github.com/lunma-app/lunma/commit/650a4ad159c476fb337aaff2a83fc6ee414f1d59))
* **lens-view-filters:** persistent per-lens view filter ([28dc773](https://github.com/lunma-app/lunma/commit/28dc773d2042a1a41e105c5ac607496f1fd9cdcb))
* **lenses:** add Bitbucket connector (Server/DC + Cloud) ([28c2ef0](https://github.com/lunma-app/lunma/commit/28c2ef0ff12ae12eeee4994cc46b685e2bad8382))
* **lenses:** add the review lens end-to-end ([125883f](https://github.com/lunma-app/lunma/commit/125883fd1cad5208947ee4127b65a443c28d01a5))
* **lenses:** key sections by account sourceId ([92bf8ef](https://github.com/lunma-app/lunma/commit/92bf8efd7ccc4fb2f4c3860aa33449ead404a7b5))
* **lenses:** redesign lens overview as a width-aware triage board ([e429aa4](https://github.com/lunma-app/lunma/commit/e429aa412b5c0763022bd14793766d67f9c3b530))
* **lens:** persist Articles layout per lens ([e5a1f16](https://github.com/lunma-app/lunma/commit/e5a1f163f0aed2a89de8958d13ec2690bb567a3f))
* **lens:** searchable multi-select for scope + source pickers ([444d05e](https://github.com/lunma-app/lunma/commit/444d05ed9b55629c187e30be79392414a78c28fe))
* **options:** consolidate the options page into clear, named sections ([34894ce](https://github.com/lunma-app/lunma/commit/34894ceb275ca62501eddc4ec04ca5866619fab4))
* **options:** unified Connections manager ([4cfa93e](https://github.com/lunma-app/lunma/commit/4cfa93e828aaf6a64f922873637edba895a1fb86))
* **overview:** add the atmosphere-glow aurora to the lens page ([f9b06ed](https://github.com/lunma-app/lunma/commit/f9b06ed5065109b8087da72c087e7e344ea04d9a))
* **overview:** compose ReviewerRail + Diffstat in the Changes row ([416333e](https://github.com/lunma-app/lunma/commit/416333e902fe830b6be63c2e2262959b30613f40))
* **overview:** show all article categories + size list rows to two lines ([2ab8be2](https://github.com/lunma-app/lunma/commit/2ab8be27edc0d585fb53d3931dd3afd8241ad242))
* **shared:** per-account sources + lens entities over the bus ([80fb135](https://github.com/lunma-app/lunma/commit/80fb135ae83662875fed39ece1f12315c9a99799))
* **sidebar:** collapse smart-folder sections individually ([#11](https://github.com/lunma-app/lunma/issues/11)) ([64df91f](https://github.com/lunma-app/lunma/commit/64df91f55d2329a0b78a381cd33b65cc0c01c0bf))
* **sidebar:** connection-first lens editor + Space menus ([ef5e8aa](https://github.com/lunma-app/lunma/commit/ef5e8aa57a412cb42994d4b7d40adcf9f768aaf2))
* **sidebar:** merge smart-section header into one disclosure slot ([98f9195](https://github.com/lunma-app/lunma/commit/98f9195323b1bc3bcba372408007bb86d0a26c27))
* **sidebar:** open a smart folder as a page ([0276108](https://github.com/lunma-app/lunma/commit/027610835946b6fd787cece10522ca4a7d326b6b))
* **sidebar:** open smart folder page via icon, not a body-click split ([1acf1f3](https://github.com/lunma-app/lunma/commit/1acf1f37c9d3f71e89292847290756d04fce8511))
* **sidebar:** persistent card header + drag-handle reorder in the editor ([a0931dc](https://github.com/lunma-app/lunma/commit/a0931dc94574fb5cff7478fe570f658d9e54faba))
* **sidebar:** redesign smart-folder editor to Name-first source cards ([a0ccfb8](https://github.com/lunma-app/lunma/commit/a0ccfb838ffdaae95c67ad5a6059a791b792c617))
* **sidebar:** unify row hover/active, PR/issue glyphs, trailing alignment ([4c6debd](https://github.com/lunma-app/lunma/commit/4c6debd27244abb576941ff4a3f50c033fdb8822))
* **smart-folders:** add markSmartItemUnread command ([3413806](https://github.com/lunma-app/lunma/commit/3413806cfa4d11fe5966cd2ec5d4eaed43e3c92f))
* **smart-folders:** add openSmartFolderPage open-or-focus command ([f6b2b09](https://github.com/lunma-app/lunma/commit/f6b2b094bf670dee34d94247144c61145d0301dd))
* **smart-folders:** folder page is a managed view with a real title ([ae1decf](https://github.com/lunma-app/lunma/commit/ae1decfe0d3e0d7f81d272e683d36b265f50c0cb))
* **smart-folders:** multiple filters per connector instance (schema v9) ([525044e](https://github.com/lunma-app/lunma/commit/525044e3bd992903255d4ebc5731ef76cbfefc17))
* **smart-folders:** optional per-source name (schema v10) ([c7121bd](https://github.com/lunma-app/lunma/commit/c7121bd5f0c5e41d6252e0c197cce37dcd2c9205))
* **smart-folders:** parse RSS excerpt, image, and date ([fc52fe7](https://github.com/lunma-app/lunma/commit/fc52fe71000a0e0c916aee2c997372fedd599e8a))
* **ui:** add Button size="sm"; quiet smart-folder footer + tighten indent ([75fae02](https://github.com/lunma-app/lunma/commit/75fae0214ffe7a0f7275319f58c479f0b14ba068))
* **ui:** chip-variant MultiSelect; group lens filters left, layout right ([97d568b](https://github.com/lunma-app/lunma/commit/97d568b523c6103cec0b411583feb5888e7ee83d))
* **ui:** connection-first primitives ([f78321b](https://github.com/lunma-app/lunma/commit/f78321ba7e321e1bbf91cafa9a3ba054e296014c))
* **ui:** consolidate the primitive set (~40 -&gt; ~36) ([f1f459f](https://github.com/lunma-app/lunma/commit/f1f459fadfafc98e2643996dc46c66f358faa574))
* **ui:** harden component accessibility to WCAG 2.2 AA ([d26704a](https://github.com/lunma-app/lunma/commit/d26704a747f136f5781a71cddcc1a19455046c9f))


### Bug Fixes

* address code-review findings ([94f461c](https://github.com/lunma-app/lunma/commit/94f461c7d096802a80b93b09d30dae7587e9a7ba))
* **bus:** use Web Crypto for session id ([0ff9237](https://github.com/lunma-app/lunma/commit/0ff923763b959c9e74c2fcf7a1313ca254206da8))
* **e2e:** add visibility wait before chip text assert; widen dormant-switch timeout ([60638ec](https://github.com/lunma-app/lunma/commit/60638ec50fce749725a4cef5d7e575355ceab4c3))
* **i18n:** address code-review findings (auto-clobber, untranslated strings, overlay retry) ([9f88147](https://github.com/lunma-app/lunma/commit/9f88147e084f355a16c0b4d6f7d54d958584e5e0))
* **i18n:** use boolean | undefined for the overlay-labels handler return (biome noConfusingVoidType) ([efe4da6](https://github.com/lunma-app/lunma/commit/efe4da66d56c2b26984f2bcc867b3dd0a4b546f8))
* **lens-editor:** preview lists Issues for git sources, not just Changes ([d29ff82](https://github.com/lunma-app/lunma/commit/d29ff8225abafee881b36d2d5240bf93a63fa533))
* **lens-model:** rename remaining old testids in components and tests ([b734daa](https://github.com/lunma-app/lunma/commit/b734daa3fe4ee0f6562db731090ebea8d87490ba))
* **lens-view-filters:** add feeds to bus LensFilterSchema so setLensFilter validates ([86ae73a](https://github.com/lunma-app/lunma/commit/86ae73ad95caa8f236bb4f4efb47ca17203e4f09))
* **lens-view-filters:** advance broadcast/storage validators to AppStateV14 ([9323dcf](https://github.com/lunma-app/lunma/commit/9323dcf0040421a9dd87e3027862adad53729625))
* **lens-view-filters:** show feed filter chip at &gt;= 1 feed, matching repos/projects ([2db7516](https://github.com/lunma-app/lunma/commit/2db7516b7bc1fa85ac9869e45b9952f05137f607))
* **lenses:** make overview article List full-width ([c137b4c](https://github.com/lunma-app/lunma/commit/c137b4c9f90cd82dda9b3c1e376e2fd56a79399b))
* **lens:** fit overview article grid to its column width ([fe98f90](https://github.com/lunma-app/lunma/commit/fe98f90eccbef5d41f3a9e83694bce8f90d89205))
* **lens:** make light-theme glyph + border marks legible ([2c3569a](https://github.com/lunma-app/lunma/commit/2c3569aebe7cca805262290797d6fd18792162bb))
* **lenspage:** include bitbucket in the provider subtitle ([2108912](https://github.com/lunma-app/lunma/commit/2108912db2c9423463e368edd35b7789c6c166d0))
* **lens:** scope the sidebar feed filter and hide emptied sections ([8da6b25](https://github.com/lunma-app/lunma/commit/8da6b2585305fc67f40a15299d60d8f188065997))
* **overview:** use a 16:9 article grid hero ([5b46c32](https://github.com/lunma-app/lunma/commit/5b46c3268789a6c7d0281bcc38958263c4079e05))
* **sidebar:** give expanded source cards real containment ("glue") ([819ad9f](https://github.com/lunma-app/lunma/commit/819ad9fbe23006d5a177e9b13eb91bdbaa32a4ba))
* **sidebar:** give Move up/down menu items arrow icons ([606b57b](https://github.com/lunma-app/lunma/commit/606b57b09ec9456ad8b861ad0afa2817ff47158f))
* **sidebar:** give the editor filter pills a "Filters" field label ([d6dcf4a](https://github.com/lunma-app/lunma/commit/d6dcf4a525c388efe539cbddec942b415a02a6c6))
* **sidebar:** improve folder context menu UX ([16d8cba](https://github.com/lunma-app/lunma/commit/16d8cba634bce9aac9a1c77d8d4bb865c304229c))
* **sidebar:** scrollable, collapsible smart-folder source list ([32598ac](https://github.com/lunma-app/lunma/commit/32598acd19ef6aae1e5e3c051ac5d5333e5b120e))
* **sidebar:** use renamed 'funnel' lucide icon ([b8505ff](https://github.com/lunma-app/lunma/commit/b8505fff42cc595b1d7629db33f911b1438a789f))
* **smart-folders:** don't auto-advance a feed close when the page is open ([057d173](https://github.com/lunma-app/lunma/commit/057d173a489338b8c7aa63e3e94a117bb645ec14))
* **smart-folders:** make "Show recently read" per feed section ([252f180](https://github.com/lunma-app/lunma/commit/252f18091b80678e16202a4b6ed865842e720b3b))
* **smart-folders:** prune feed read-state per section ([02d5456](https://github.com/lunma-app/lunma/commit/02d5456dd5cd387f7e4c4421237b6a11640da9ad))
* **smart-folders:** render unread feed items hidden behind read rows ([3c68a7e](https://github.com/lunma-app/lunma/commit/3c68a7e10493750da41fc1890d6dc7098e0c2a85))
* **smart-folders:** stop derived_inert + guard the page open race ([462705c](https://github.com/lunma-app/lunma/commit/462705c006b12bbaa26f24015d837ff736b25228))
* **smart-folders:** stop feed auto-advance from draining the section ([1a25128](https://github.com/lunma-app/lunma/commit/1a25128ab4933a0664d65b773b00c0cbd65cc976))
* **smart-folders:** suppress feed auto-advance by open-origin, not page-open ([6ef5324](https://github.com/lunma-app/lunma/commit/6ef5324d2e945f22239295c59c95aca4dbf034b4))
* **spaces:** gate group→Space conversion on a genuine first boot ([0cf3279](https://github.com/lunma-app/lunma/commit/0cf3279df0ca73cf05f3621fc0110a645f3d2239))
* **storage:** dedupe space names on read path ([e60ae00](https://github.com/lunma-app/lunma/commit/e60ae000092969b83b092f2aea3c665d598785d7))
* **storage:** stop one bad node wiping the pinned tree ([726b292](https://github.com/lunma-app/lunma/commit/726b2928c623a8d097883313e835ca3d56362f90))
* **storage:** validate live state against the current v17 schema ([b93db8c](https://github.com/lunma-app/lunma/commit/b93db8cf90e7b0360a6af80279505428ab0fdd46))
* **tab-groups:** downgrade mid-drag tab-edit transient to debug ([3a32ad3](https://github.com/lunma-app/lunma/commit/3a32ad3c3ddc1f0085a6355618eed304ae70c70c))
* **tokens:** darken light-theme status + Space-ring colours ([533134e](https://github.com/lunma-app/lunma/commit/533134e7a84085d4100a01afecdaedfc8ec443d1))
* **ui:** give MultiSelect popover a definite width ([9e54d95](https://github.com/lunma-app/lunma/commit/9e54d9558337ff19dc5960c595a6591a4b3c4459))
* **ui:** restyle filter toggle chips — outline vs filled ([0538970](https://github.com/lunma-app/lunma/commit/05389705e1abcef215d700009ae3d8f98abf181c))
* **ui:** silence derived_inert warning in Favicon ([ced3cc9](https://github.com/lunma-app/lunma/commit/ced3cc9b5f81d529b9671993ae9e0dda442974a3))
* **ui:** size MultiSelect popover to content, not the trigger ([bb41f30](https://github.com/lunma-app/lunma/commit/bb41f30abcef296153bfdb0516af2d6ac7123c2d))
* **ui:** skip _favicon request for an empty pageUrl ([7ea6a31](https://github.com/lunma-app/lunma/commit/7ea6a31953f28f70146ffb65723bf346462486f7))

## [0.3.1](https://github.com/lunma-app/lunma/compare/v0.3.0...v0.3.1) (2026-06-21)


### Bug Fixes

* **tests:** replace non-null assertions with explicit checks ([c9483c5](https://github.com/lunma-app/lunma/commit/c9483c5065c9a8de0a9a4e67d2432a9dc36d1f49))

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
