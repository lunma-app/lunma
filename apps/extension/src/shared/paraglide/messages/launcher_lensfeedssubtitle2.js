/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Launcher_Lensfeedssubtitle2Inputs */

const en_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds — a quiet magazine`)
};

const es_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds — una revista tranquila`)
};

const pt_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds — uma revista silenciosa`)
};

const fr_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Flux — un magazine tranquille`)
};

const de_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Feeds — ein ruhiges Magazin`)
};

const ja_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`フィード — 静かなマガジン`)
};

const ko_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`피드 — 조용한 매거진`)
};

const zh_cn2_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`订阅源 — 安静的杂志`)
};

const ru_launcher_lensfeedssubtitle2 = /** @type {(inputs: Launcher_Lensfeedssubtitle2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ленты — тихий журнал`)
};

/**
* | output |
* | --- |
* | "Feeds — a quiet magazine" |
*
* @param {Launcher_Lensfeedssubtitle2Inputs} inputs
* @param {{ locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }} options
* @returns {LocalizedString}
*/
const launcher_lensfeedssubtitle2 = /** @type {((inputs?: Launcher_Lensfeedssubtitle2Inputs, options?: { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Launcher_Lensfeedssubtitle2Inputs, { locale?: "en" | "es" | "pt" | "fr" | "de" | "ja" | "ko" | "zh-CN" | "ru" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_launcher_lensfeedssubtitle2(inputs)
	if (locale === "es") return es_launcher_lensfeedssubtitle2(inputs)
	if (locale === "pt") return pt_launcher_lensfeedssubtitle2(inputs)
	if (locale === "fr") return fr_launcher_lensfeedssubtitle2(inputs)
	if (locale === "de") return de_launcher_lensfeedssubtitle2(inputs)
	if (locale === "ja") return ja_launcher_lensfeedssubtitle2(inputs)
	if (locale === "ko") return ko_launcher_lensfeedssubtitle2(inputs)
	if (locale === "zh-CN") return zh_cn2_launcher_lensfeedssubtitle2(inputs)
	return ru_launcher_lensfeedssubtitle2(inputs)
});
export { launcher_lensfeedssubtitle2 as "launcher_lensFeedsSubtitle" }