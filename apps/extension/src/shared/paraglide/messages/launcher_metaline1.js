/* eslint-disable */
import * as registry from '../registry.js'
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{ tabCount: NonNullable<unknown>, pinnedCount: NonNullable<unknown> }} Launcher_Metaline1Inputs */

const en_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {const tabPlural = registry.plural("en", i?.tabCount, {});
	if (tabPlural === "one") return /** @type {LocalizedString} */ (`${i?.tabCount} tab · ${i?.pinnedCount} pinned`);
	if (tabPlural === "other") return /** @type {LocalizedString} */ (`${i?.tabCount} tabs · ${i?.pinnedCount} pinned`);
	return /** @type {LocalizedString} */ ("launcher_metaLine");
};

const es_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {const tabPlural = registry.plural("es", i?.tabCount, {});
	if (tabPlural === "one") return /** @type {LocalizedString} */ (`${i?.tabCount} pestaña · ${i?.pinnedCount} fijadas`);
	if (tabPlural === "other") return /** @type {LocalizedString} */ (`${i?.tabCount} pestañas · ${i?.pinnedCount} fijadas`);
	return /** @type {LocalizedString} */ ("launcher_metaLine");
};

const pt_pt2_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {const tabPlural = registry.plural("pt-PT", i?.tabCount, {});
	if (tabPlural === "one") return /** @type {LocalizedString} */ (`${i?.tabCount} separador · ${i?.pinnedCount} fixos`);
	if (tabPlural === "other") return /** @type {LocalizedString} */ (`${i?.tabCount} separadores · ${i?.pinnedCount} fixos`);
	return /** @type {LocalizedString} */ ("launcher_metaLine");
};

const fr_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {const tabPlural = registry.plural("fr", i?.tabCount, {});
	if (tabPlural === "one") return /** @type {LocalizedString} */ (`${i?.tabCount} onglet · ${i?.pinnedCount} épinglé`);
	if (tabPlural === "other") return /** @type {LocalizedString} */ (`${i?.tabCount} onglets · ${i?.pinnedCount} épinglés`);
	return /** @type {LocalizedString} */ ("launcher_metaLine");
};

const de_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {const tabPlural = registry.plural("de", i?.tabCount, {});
	if (tabPlural === "one") return /** @type {LocalizedString} */ (`${i?.tabCount} Tab · ${i?.pinnedCount} angeheftet`);
	if (tabPlural === "other") return /** @type {LocalizedString} */ (`${i?.tabCount} Tabs · ${i?.pinnedCount} angeheftet`);
	return /** @type {LocalizedString} */ ("launcher_metaLine");
};

const ja_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {
	const tabPlural = registry.plural("ja", i?.tabCount, {});return /** @type {LocalizedString} */ (`${i?.tabCount} タブ · ${i?.pinnedCount} 個固定`)
};

const ko_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {
	const tabPlural = registry.plural("ko", i?.tabCount, {});return /** @type {LocalizedString} */ (`탭 ${i?.tabCount}개 · 고정 ${i?.pinnedCount}개`)
};

const zh_cn2_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {
	const tabPlural = registry.plural("zh-CN", i?.tabCount, {});return /** @type {LocalizedString} */ (`${i?.tabCount} 个标签页 · ${i?.pinnedCount} 个已固定`)
};

const ru_launcher_metaline1 = /** @type {(inputs: Launcher_Metaline1Inputs) => LocalizedString} */ (i) => {const tabPlural = registry.plural("ru", i?.tabCount, {});
	if (tabPlural === "one") return /** @type {LocalizedString} */ (`${i?.tabCount} вкладка · ${i?.pinnedCount} закреплена`);
	if (tabPlural === "few") return /** @type {LocalizedString} */ (`${i?.tabCount} вкладки · ${i?.pinnedCount} закреплено`);
	if (tabPlural === "many") return /** @type {LocalizedString} */ (`${i?.tabCount} вкладок · ${i?.pinnedCount} закреплено`);
	if (tabPlural === "other") return /** @type {LocalizedString} */ (`${i?.tabCount} вкладок · ${i?.pinnedCount} закреплено`);
	return /** @type {LocalizedString} */ ("launcher_metaLine");
};

/**
* | tabPlural | output |
* | --- | --- |
* | "one" | "{tabCount} tab · {pinnedCount} pinned" |
* | "other" | "{tabCount} tabs · {pinnedCount} pinned" |
*
* @param {Launcher_Metaline1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_metaline1 = /** @type {((inputs: Launcher_Metaline1Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Metaline1Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_metaline1(inputs)
	if (locale === "es") return es_launcher_metaline1(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_metaline1(inputs)
	if (locale === "fr") return fr_launcher_metaline1(inputs)
	if (locale === "de") return de_launcher_metaline1(inputs)
	if (locale === "ja") return ja_launcher_metaline1(inputs)
	if (locale === "ko") return ko_launcher_metaline1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_metaline1(inputs)
	return ru_launcher_metaline1(inputs)
});
export { launcher_metaline1 as "launcher_metaLine" }