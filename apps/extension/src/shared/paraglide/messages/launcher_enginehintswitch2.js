/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Enginehintswitch2Inputs */

const en_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab to switch`)
};

const es_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab para alternar`)
};

const pt_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab para mudar`)
};

const fr_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab pour basculer`)
};

const de_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab zum Umschalten`)
};

const ja_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab で切り替え`)
};

const ko_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab으로 전환`)
};

const zh_cn2_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab 键切换`)
};

const ru_launcher_enginehintswitch2 = /** @type {(inputs: Launcher_Enginehintswitch2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tab для переключения`)
};

/**
* | output |
* | --- |
* | "Tab to switch" |
*
* @param {Launcher_Enginehintswitch2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_enginehintswitch2 = /** @type {((inputs?: Launcher_Enginehintswitch2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Enginehintswitch2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_enginehintswitch2(inputs)
	if (locale === "es") return es_launcher_enginehintswitch2(inputs)
	if (locale === "pt") return pt_launcher_enginehintswitch2(inputs)
	if (locale === "fr") return fr_launcher_enginehintswitch2(inputs)
	if (locale === "de") return de_launcher_enginehintswitch2(inputs)
	if (locale === "ja") return ja_launcher_enginehintswitch2(inputs)
	if (locale === "ko") return ko_launcher_enginehintswitch2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_enginehintswitch2(inputs)
	return ru_launcher_enginehintswitch2(inputs)
});
export { launcher_enginehintswitch2 as "launcher_engineHintSwitch" }