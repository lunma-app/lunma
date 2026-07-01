/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Sidebar_Moveleft1Inputs */

const en_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Move left`)
};

const es_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mover a la izquierda`)
};

const pt_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mover para a esquerda`)
};

const fr_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Déplacer vers la gauche`)
};

const de_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nach links`)
};

const ja_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`左に移動`)
};

const ko_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`왼쪽으로 이동`)
};

const zh_cn2_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`左移`)
};

const ru_sidebar_moveleft1 = /** @type {(inputs: Sidebar_Moveleft1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Влево`)
};

/**
* | output |
* | --- |
* | "Move left" |
*
* @param {Sidebar_Moveleft1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const sidebar_moveleft1 = /** @type {((inputs?: Sidebar_Moveleft1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_Moveleft1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_sidebar_moveleft1(inputs)
	if (locale === "es") return es_sidebar_moveleft1(inputs)
	if (locale === "pt") return pt_sidebar_moveleft1(inputs)
	if (locale === "fr") return fr_sidebar_moveleft1(inputs)
	if (locale === "de") return de_sidebar_moveleft1(inputs)
	if (locale === "ja") return ja_sidebar_moveleft1(inputs)
	if (locale === "ko") return ko_sidebar_moveleft1(inputs)
	if (locale === "zh-CN") return zh_cn2_sidebar_moveleft1(inputs)
	return ru_sidebar_moveleft1(inputs)
});
export { sidebar_moveleft1 as "sidebar_moveLeft" }