/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensallfeeds2Inputs */

const en_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`All feeds`)
};

const es_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos los feeds`)
};

const pt_pt2_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Todos os feeds`)
};

const fr_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tous les flux`)
};

const de_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Alle Feeds`)
};

const ja_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`すべてのフィード`)
};

const ko_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`모든 피드`)
};

const zh_cn2_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`所有订阅源`)
};

const ru_launcher_lensallfeeds2 = /** @type {(inputs: Launcher_Lensallfeeds2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Все ленты`)
};

/**
* | output |
* | --- |
* | "All feeds" |
*
* @param {Launcher_Lensallfeeds2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensallfeeds2 = /** @type {((inputs?: Launcher_Lensallfeeds2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensallfeeds2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensallfeeds2(inputs)
	if (locale === "es") return es_launcher_lensallfeeds2(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_lensallfeeds2(inputs)
	if (locale === "fr") return fr_launcher_lensallfeeds2(inputs)
	if (locale === "de") return de_launcher_lensallfeeds2(inputs)
	if (locale === "ja") return ja_launcher_lensallfeeds2(inputs)
	if (locale === "ko") return ko_launcher_lensallfeeds2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensallfeeds2(inputs)
	return ru_launcher_lensallfeeds2(inputs)
});
export { launcher_lensallfeeds2 as "launcher_lensAllFeeds" }