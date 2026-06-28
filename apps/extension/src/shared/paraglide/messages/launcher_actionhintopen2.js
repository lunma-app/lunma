/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Actionhintopen2Inputs */

const en_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Open`)
};

const es_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Abrir`)
};

const pt_pt2_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Abrir`)
};

const fr_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Ouvrir`)
};

const de_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Öffnen`)
};

const ja_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ 開く`)
};

const ko_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ 열기`)
};

const zh_cn2_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ 打开`)
};

const ru_launcher_actionhintopen2 = /** @type {(inputs: Launcher_Actionhintopen2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`↵ Открыть`)
};

/**
* | output |
* | --- |
* | "↵ Open" |
*
* @param {Launcher_Actionhintopen2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_actionhintopen2 = /** @type {((inputs?: Launcher_Actionhintopen2Inputs, options?: { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Actionhintopen2Inputs, { locale?: "en" | "es" | "pt-PT" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_actionhintopen2(inputs)
	if (locale === "es") return es_launcher_actionhintopen2(inputs)
	if (locale === "pt-PT") return pt_pt2_launcher_actionhintopen2(inputs)
	if (locale === "fr") return fr_launcher_actionhintopen2(inputs)
	if (locale === "de") return de_launcher_actionhintopen2(inputs)
	if (locale === "ja") return ja_launcher_actionhintopen2(inputs)
	if (locale === "ko") return ko_launcher_actionhintopen2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_actionhintopen2(inputs)
	return ru_launcher_actionhintopen2(inputs)
});
export { launcher_actionhintopen2 as "launcher_actionHintOpen" }