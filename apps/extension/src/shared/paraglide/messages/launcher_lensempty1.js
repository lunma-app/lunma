/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensempty1Inputs */

const en_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`This lens has nothing waiting right now.`)
};

const es_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta lente no tiene nada en este momento.`)
};

const pt_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Esta lens não tem nada pendente de momento.`)
};

const fr_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cette vue n'a rien en attente pour l'instant.`)
};

const de_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Diese Lens hat gerade nichts zu zeigen.`)
};

const ja_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`このレンズには今待っているものがありません。`)
};

const ko_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`이 렌즈에 현재 대기 중인 항목이 없습니다.`)
};

const zh_cn2_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`此镜头暂无内容`)
};

const ru_launcher_lensempty1 = /** @type {(inputs: Launcher_Lensempty1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`В этой линзе пока ничего нет.`)
};

/**
* | output |
* | --- |
* | "This lens has nothing waiting right now." |
*
* @param {Launcher_Lensempty1Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensempty1 = /** @type {((inputs?: Launcher_Lensempty1Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensempty1Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensempty1(inputs)
	if (locale === "es") return es_launcher_lensempty1(inputs)
	if (locale === "pt") return pt_launcher_lensempty1(inputs)
	if (locale === "fr") return fr_launcher_lensempty1(inputs)
	if (locale === "de") return de_launcher_lensempty1(inputs)
	if (locale === "ja") return ja_launcher_lensempty1(inputs)
	if (locale === "ko") return ko_launcher_lensempty1(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensempty1(inputs)
	return ru_launcher_lensempty1(inputs)
});
export { launcher_lensempty1 as "launcher_lensEmpty" }