/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lenswaitingonyou3Inputs */

const en_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

const es_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

const pt_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

const fr_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

const de_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

const ja_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

const ko_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

const zh_cn2_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

const ru_launcher_lenswaitingonyou3 = /** @type {(inputs: Launcher_Lenswaitingonyou3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Waiting on you`)
};

/**
* | output |
* | --- |
* | "Waiting on you" |
*
* @param {Launcher_Lenswaitingonyou3Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lenswaitingonyou3 = /** @type {((inputs?: Launcher_Lenswaitingonyou3Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lenswaitingonyou3Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lenswaitingonyou3(inputs)
	if (locale === "es") return es_launcher_lenswaitingonyou3(inputs)
	if (locale === "pt") return pt_launcher_lenswaitingonyou3(inputs)
	if (locale === "fr") return fr_launcher_lenswaitingonyou3(inputs)
	if (locale === "de") return de_launcher_lenswaitingonyou3(inputs)
	if (locale === "ja") return ja_launcher_lenswaitingonyou3(inputs)
	if (locale === "ko") return ko_launcher_lenswaitingonyou3(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lenswaitingonyou3(inputs)
	return ru_launcher_lenswaitingonyou3(inputs)
});
export { launcher_lenswaitingonyou3 as "launcher_lensWaitingOnYou" }